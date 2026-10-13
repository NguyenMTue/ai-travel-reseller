-- =====================================================================
-- BE1-W2-01: Migration chuẩn hóa bảng affiliate_links và clicks
-- BE1-W2-03: Trigger database on_campaign_created kích hoạt n8n Webhook
-- BE1-W2-05: RLS Policies cho affiliate_links và clicks
-- =====================================================================

-- 1. Kích hoạt extension pg_net cho Webhook HTTP POST (nếu chưa có)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Tạo bảng affiliate_links quản lý link tiếp thị định danh cho Reseller
CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id              uuid                      NOT NULL DEFAULT extensions.uuid_generate_v4(),
  reseller_id     uuid                      NOT NULL REFERENCES public.resellers(id) ON DELETE CASCADE,
  campaign_id     uuid                      NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  product_id      uuid                      NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  unique_code     character varying(32)     NOT NULL,
  short_url       text,
  destination_url text                      NOT NULL,
  clicks_count    integer                   NOT NULL DEFAULT 0,
  is_active       boolean                   NOT NULL DEFAULT true,
  created_at      timestamp with time zone  NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at      timestamp with time zone  NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT affiliate_links_pkey PRIMARY KEY (id),
  CONSTRAINT uq_affiliate_links_unique_code UNIQUE (unique_code),
  -- Ràng buộc Idempotent: 1 Reseller với 1 Campaign và 1 Product chỉ có duy nhất 1 link tiếp thị
  CONSTRAINT uq_affiliate_links_reseller_campaign_product UNIQUE (reseller_id, campaign_id, product_id)
);

-- 3. Tạo bảng clicks ghi nhận lịch sử mỗi lượt truy cập vào link tiếp thị
CREATE TABLE IF NOT EXISTS public.clicks (
  id              uuid                      NOT NULL DEFAULT extensions.uuid_generate_v4(),
  link_id         uuid                      NOT NULL REFERENCES public.affiliate_links(id) ON DELETE CASCADE,
  ip_address      character varying(45),
  user_agent      text,
  referer         text,
  clicked_at      timestamp with time zone  NOT NULL DEFAULT timezone('utc'::text, now()),
  metadata        jsonb                     NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT clicks_pkey PRIMARY KEY (id)
);

-- 4. Tạo các Index tối ưu hóa hiệu năng truy vấn và báo cáo
CREATE INDEX IF NOT EXISTS idx_affiliate_links_unique_code ON public.affiliate_links(unique_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_reseller_id ON public.affiliate_links(reseller_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_campaign_id ON public.affiliate_links(campaign_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_product_id ON public.affiliate_links(product_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_active ON public.affiliate_links(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON public.clicks(link_id);
CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON public.clicks(clicked_at);

-- 5. Trigger tự động tăng clicks_count trong affiliate_links khi có bản ghi click mới
CREATE OR REPLACE FUNCTION public.increment_affiliate_link_clicks()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.affiliate_links
  SET clicks_count = clicks_count + 1,
      updated_at = timezone('utc'::text, now())
  WHERE id = NEW.link_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_increment_affiliate_link_clicks ON public.clicks;
CREATE TRIGGER trg_increment_affiliate_link_clicks
AFTER INSERT ON public.clicks
FOR EACH ROW
EXECUTE FUNCTION public.increment_affiliate_link_clicks();

-- 6. Database Trigger on_campaign_created bắn Webhook sang n8n qua pg_net (BE1-W2-03)
CREATE OR REPLACE FUNCTION public.trigger_campaign_to_n8n()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url text := coalesce(
    current_setting('app.settings.n8n_campaign_webhook_url', true),
    'http://127.0.0.1:5678/webhook/campaign-created'
  );
  payload jsonb;
BEGIN
  payload := jsonb_build_object(
    'type', 'INSERT',
    'table', 'campaigns',
    'schema', 'public',
    'record', jsonb_build_object(
      'id', NEW.id,
      'merchant_id', NEW.merchant_id,
      'product_id', NEW.product_id,
      'name', NEW.name,
      'start_date', NEW.start_date,
      'end_date', NEW.end_date,
      'target_audience', NEW.target_audience,
      'target_location', NEW.target_location,
      'commission_rate', NEW.commission_rate,
      'status', NEW.status
    )
  );

  -- Gọi HTTP POST bất đồng bộ qua pg_net trong khối exception để không làm nghẽn transaction tạo campaign
  BEGIN
    PERFORM net.http_post(
      url := webhook_url,
      body := payload,
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'n8n campaign webhook notification failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_on_campaign_created ON public.campaigns;
CREATE TRIGGER trg_on_campaign_created
AFTER INSERT ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.trigger_campaign_to_n8n();

-- 7. Cấu hình Row Level Security (RLS) & Phân quyền (BE1-W2-05)
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clicks ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_links TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clicks TO anon, authenticated, service_role;

-- Policies cho bảng affiliate_links
DROP POLICY IF EXISTS "Allow public read active affiliate_links" ON public.affiliate_links;
CREATE POLICY "Allow public read active affiliate_links"
ON public.affiliate_links FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Allow resellers to view own affiliate_links" ON public.affiliate_links;
CREATE POLICY "Allow resellers to view own affiliate_links"
ON public.affiliate_links FOR SELECT
USING (reseller_id = auth.uid());

DROP POLICY IF EXISTS "Allow resellers to insert own affiliate_links" ON public.affiliate_links;
CREATE POLICY "Allow resellers to insert own affiliate_links"
ON public.affiliate_links FOR INSERT
WITH CHECK (reseller_id = auth.uid());

DROP POLICY IF EXISTS "Allow merchants to view their affiliate_links" ON public.affiliate_links;
CREATE POLICY "Allow merchants to view their affiliate_links"
ON public.affiliate_links FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.products
    WHERE products.id = affiliate_links.product_id
      AND products.merchant_id = auth.uid()
  )
);

-- Policies cho bảng clicks
DROP POLICY IF EXISTS "Allow public insert to clicks" ON public.clicks;
CREATE POLICY "Allow public insert to clicks"
ON public.clicks FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow resellers to view clicks" ON public.clicks;
CREATE POLICY "Allow resellers to view clicks"
ON public.clicks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.affiliate_links
    WHERE affiliate_links.id = clicks.link_id
      AND affiliate_links.reseller_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Allow merchants to view clicks" ON public.clicks;
CREATE POLICY "Allow merchants to view clicks"
ON public.clicks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.affiliate_links
    JOIN public.products ON products.id = affiliate_links.product_id
    WHERE affiliate_links.id = clicks.link_id
      AND products.merchant_id = auth.uid()
  )
);
