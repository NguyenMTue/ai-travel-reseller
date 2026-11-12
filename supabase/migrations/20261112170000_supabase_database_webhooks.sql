-- Migration: 20261112170000_supabase_database_webhooks.sql
-- Mô tả: Cấu hình Database Webhooks tự động trên Supabase cho n8n Content Generation & Embeddings RAG Sync
-- Phân hệ: Automation & Event-driven Architecture

-- 1. Bảng lưu trữ và nhật ký sự kiện Database Webhooks (Outbox & Audit Log Pattern)
CREATE TABLE IF NOT EXISTS public.database_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,                    -- 'INSERT', 'UPDATE', 'DELETE'
  table_name text NOT NULL,                    -- 'campaigns', 'products'
  record_id uuid NOT NULL,                     -- ID của bản ghi mục tiêu
  payload jsonb NOT NULL,                      -- Dữ liệu payload webhook tiêu chuẩn của Supabase
  target_url text,                             -- Endpoint tiếp nhận webhook
  status text NOT NULL DEFAULT 'pending',      -- 'pending', 'delivered', 'skipped', 'failed'
  attempts int NOT NULL DEFAULT 0,             -- Số lần thử phát tín hiệu
  response_status int,                         -- Mã HTTP status nhận về
  error_message text,                          -- Chi tiết lỗi nếu có
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Chỉ mục hỗ trợ truy vấn các sự kiện chờ xử lý và tra cứu lịch sử theo bảng / bản ghi
CREATE INDEX IF NOT EXISTS idx_database_webhook_events_status_created 
  ON public.database_webhook_events(status, created_at);

CREATE INDEX IF NOT EXISTS idx_database_webhook_events_table_record 
  ON public.database_webhook_events(table_name, record_id);

-- 2. Kích hoạt Row-Level Security (RLS) bảo vệ bảng nhật ký webhook
ALTER TABLE public.database_webhook_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'database_webhook_events' 
    AND policyname = 'service_role_all_database_webhook_events'
  ) THEN
    CREATE POLICY service_role_all_database_webhook_events 
      ON public.database_webhook_events
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 3. Gỡ bỏ trigger tĩnh cũ (nếu có từ trước trên Cloudflare tunnel tạm)
DROP TRIGGER IF EXISTS "N8N_WEBHOOK_URL" ON public.campaigns;

-- 4. Trigger Function: Tự động bắn webhook khi có Chiến dịch mới (campaigns INSERT -> n8n Content Kit)
CREATE OR REPLACE FUNCTION public.trg_fn_campaigns_created_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_payload jsonb;
  v_target_url text;
  v_event_id uuid;
  v_webhook_token text;
BEGIN
  -- Định dạng chuẩn Supabase Database Webhook Payload
  v_payload := jsonb_build_object(
    'type', 'INSERT',
    'table', 'campaigns',
    'schema', 'public',
    'record', row_to_json(NEW),
    'old_record', NULL
  );

  -- Lấy URL cấu hình nếu có trong PostgreSQL settings hoặc mặc định
  v_target_url := NULLIF(current_setting('app.settings.n8n_campaign_webhook_url', true), '');
  v_webhook_token := NULLIF(current_setting('app.settings.n8n_webhook_token', true), '');

  -- Ghi nhận sự kiện vào bảng outbox database_webhook_events
  INSERT INTO public.database_webhook_events (
    event_type,
    table_name,
    record_id,
    payload,
    target_url,
    status
  ) VALUES (
    'INSERT',
    'campaigns',
    NEW.id,
    v_payload,
    v_target_url,
    'pending'
  ) RETURNING id INTO v_event_id;

  -- Nếu có cấu hình pg_net hoặc supabase_functions.http_request và target_url hợp lệ, tiến hành gọi HTTP async
  IF v_target_url IS NOT NULL THEN
    BEGIN
      -- Thử gọi hàm supabase_functions.http_request nếu môi trường Cloud hỗ trợ
      PERFORM supabase_functions.http_request(
        v_target_url,
        'POST',
        jsonb_build_object(
          'Content-Type', 'application/json',
          'X-Webhook-Token', COALESCE(v_webhook_token, '')
        )::text,
        v_payload::text,
        '5000'
      );

      UPDATE public.database_webhook_events
      SET status = 'delivered', attempts = attempts + 1, updated_at = now()
      WHERE id = v_event_id;
    EXCEPTION WHEN OTHERS THEN
      -- Bắt lỗi mạng/cấu hình để KHÔNG làm gián đoạn transaction tạo chiến dịch của Merchant
      UPDATE public.database_webhook_events
      SET status = 'failed', attempts = attempts + 1, error_message = SQLERRM, updated_at = now()
      WHERE id = v_event_id;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Gắn trigger vào bảng campaigns
DROP TRIGGER IF EXISTS trg_campaigns_created_webhook ON public.campaigns;
CREATE TRIGGER trg_campaigns_created_webhook
  AFTER INSERT ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_campaigns_created_webhook();

-- 5. Trigger Function: Tự động bắn webhook đồng bộ Vector Embeddings RAG khi Sản phẩm được tạo hoặc sửa đổi (products INSERT/UPDATE)
CREATE OR REPLACE FUNCTION public.trg_fn_products_sync_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_payload jsonb;
  v_target_url text;
  v_event_id uuid;
  v_sync_secret text;
BEGIN
  -- Định dạng chuẩn Supabase Database Webhook Payload cho sản phẩm
  v_payload := jsonb_build_object(
    'type', TG_OP,
    'table', 'products',
    'schema', 'public',
    'record', row_to_json(NEW),
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
  );

  v_target_url := NULLIF(current_setting('app.settings.embeddings_sync_url', true), '');
  v_sync_secret := NULLIF(current_setting('app.settings.embeddings_sync_secret', true), '');

  -- Ghi nhận sự kiện vào bảng outbox database_webhook_events
  INSERT INTO public.database_webhook_events (
    event_type,
    table_name,
    record_id,
    payload,
    target_url,
    status
  ) VALUES (
    TG_OP,
    'products',
    NEW.id,
    v_payload,
    v_target_url,
    'pending'
  ) RETURNING id INTO v_event_id;

  -- Kích hoạt HTTP POST bất đồng bộ nếu URL được cấu hình
  IF v_target_url IS NOT NULL THEN
    BEGIN
      PERFORM supabase_functions.http_request(
        v_target_url,
        'POST',
        jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || COALESCE(v_sync_secret, '')
        )::text,
        v_payload::text,
        '5000'
      );

      UPDATE public.database_webhook_events
      SET status = 'delivered', attempts = attempts + 1, updated_at = now()
      WHERE id = v_event_id;
    EXCEPTION WHEN OTHERS THEN
      UPDATE public.database_webhook_events
      SET status = 'failed', attempts = attempts + 1, error_message = SQLERRM, updated_at = now()
      WHERE id = v_event_id;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Gắn trigger vào bảng products
DROP TRIGGER IF EXISTS trg_products_sync_webhook ON public.products;
CREATE TRIGGER trg_products_sync_webhook
  AFTER INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_products_sync_webhook();

-- 6. RPC hỗ trợ truy vấn các Webhook Events đang chờ xử lý (phục vụ Worker hoặc cron-job đồng bộ)
CREATE OR REPLACE FUNCTION public.get_pending_webhook_events(p_limit int DEFAULT 50)
RETURNS TABLE (
  id uuid,
  event_type text,
  table_name text,
  record_id uuid,
  payload jsonb,
  target_url text,
  attempts int,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
  SELECT 
    e.id,
    e.event_type,
    e.table_name,
    e.record_id,
    e.payload,
    e.target_url,
    e.attempts,
    e.created_at
  FROM public.database_webhook_events e
  WHERE e.status = 'pending'
  ORDER BY e.created_at ASC
  LIMIT LEAST(GREATEST(p_limit, 1), 200);
$$;

REVOKE ALL ON FUNCTION public.get_pending_webhook_events(int) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_webhook_events(int) TO service_role;
