-- =====================================================================
-- BE1-W2-07: Migration Clicks Anti-Fraud, Bot Detection & Device Analytics
-- 1. Mở rộng bảng clicks với các trường định danh thiết bị, OS, Bot & tính hợp lệ
-- 2. Cập nhật Trigger increment_affiliate_link_clicks chỉ tăng cho click hợp lệ
-- 3. Tạo các Partial Indexes tối ưu hóa truy vấn phân tích & chống spam
-- =====================================================================

-- 1. Bổ sung các cột mới vào bảng public.clicks
ALTER TABLE public.clicks
  ADD COLUMN IF NOT EXISTS device_type     character varying(20) DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS os              character varying(30) DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS browser         character varying(40) DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS is_bot          boolean               NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bot_name        character varying(50),
  ADD COLUMN IF NOT EXISTS is_valid        boolean               NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS invalid_reason  character varying(50);

-- 2. Cập nhật Trigger Function increment_affiliate_link_clicks
-- Logic mới: Chỉ tăng clicks_count khi click là người thật (is_bot = false) và hợp lệ (is_valid = true)
CREATE OR REPLACE FUNCTION public.increment_affiliate_link_clicks()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_bot = false AND NEW.is_valid = true THEN
    UPDATE public.affiliate_links
    SET clicks_count = clicks_count + 1,
        updated_at = timezone('utc'::text, now())
    WHERE id = NEW.link_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Đảm bảo trigger gắn đúng sau khi cập nhật hàm
DROP TRIGGER IF EXISTS trg_increment_affiliate_link_clicks ON public.clicks;
CREATE TRIGGER trg_increment_affiliate_link_clicks
AFTER INSERT ON public.clicks
FOR EACH ROW
EXECUTE FUNCTION public.increment_affiliate_link_clicks();

-- 3. Tạo các Partial & Composite Indexes tối ưu truy vấn phân tích & chống spam

-- 3.1. Index tối ưu thống kê lượt click của người thật theo từng link tiếp thị
CREATE INDEX IF NOT EXISTS idx_clicks_valid_human
ON public.clicks (link_id, clicked_at DESC)
WHERE is_bot = false AND is_valid = true;

-- 3.2. Index tối ưu thống kê phân bố Thiết bị & Hệ điều hành của khách hàng thực
CREATE INDEX IF NOT EXISTS idx_clicks_device_stats
ON public.clicks (link_id, device_type, os)
WHERE is_bot = false AND is_valid = true;

-- 3.3. Index tối ưu cho kiểm tra Rate Limiting (truy vấn số lần click gần nhất của 1 IP trên 1 link)
CREATE INDEX IF NOT EXISTS idx_clicks_rate_limit_check
ON public.clicks (ip_address, link_id, clicked_at DESC);

-- 3.4. Index tối ưu báo cáo tỷ lệ lọc Bot / Crawler
CREATE INDEX IF NOT EXISTS idx_clicks_bot_tracking
ON public.clicks (link_id, is_bot, clicked_at DESC);

-- Cấp quyền truy cập cho anon, authenticated, service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clicks TO anon, authenticated, service_role;
