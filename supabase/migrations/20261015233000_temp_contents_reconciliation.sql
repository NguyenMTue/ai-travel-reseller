-- ==============================================================================
-- Migration: 20261015233000_temp_contents_reconciliation.sql
-- Mục đích: Trigger hòa giải tạm thời phục vụ thông luồng Demo Tuần 2 (16/10/2026).
-- Giúp kết nối trơn tru giữa BE3 AI Content Factory / n8n và FE Reseller Portal.
-- Lưu ý: BE1 sẽ DROP TRIGGER này ở đầu Tuần 3 khi hoàn tất màn hình Admin Moderation.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.fn_temp_contents_reconcile()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Nếu thiếu campaign_id nhưng có product_id: Tự map vào campaign mới nhất của product đó (theo start_date)
  IF NEW.campaign_id IS NULL AND NEW.product_id IS NOT NULL THEN
    SELECT id INTO NEW.campaign_id
    FROM public.campaigns
    WHERE product_id = NEW.product_id
    ORDER BY start_date DESC NULLS LAST
    LIMIT 1;
  END IF;

  -- 2. Nếu thiếu product_id nhưng có campaign_id: Tự map product_id từ campaign đó
  IF NEW.product_id IS NULL AND NEW.campaign_id IS NOT NULL THEN
    SELECT product_id INTO NEW.product_id
    FROM public.campaigns
    WHERE id = NEW.campaign_id
    LIMIT 1;
  END IF;

  -- 3. Nếu persona bị null hoặc là 'general': Tạm map về 'local_guide' để FE hiển thị tab đầu tiên
  IF NEW.persona IS NULL OR NEW.persona = 'general' THEN
    NEW.persona := 'local_guide';
  END IF;

  -- 4. Đảm bảo status là 'approved' để FE hiển thị ngay cho Reseller copy
  IF NEW.status IS NULL OR NEW.status IN ('pending_approval', 'NEEDS_REVIEW') THEN
    NEW.status := 'approved';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Gắn trigger vào bảng public.contents
DROP TRIGGER IF EXISTS trg_temp_contents_reconcile ON public.contents;
CREATE TRIGGER trg_temp_contents_reconcile
BEFORE INSERT OR UPDATE ON public.contents
FOR EACH ROW
EXECUTE FUNCTION public.fn_temp_contents_reconcile();
