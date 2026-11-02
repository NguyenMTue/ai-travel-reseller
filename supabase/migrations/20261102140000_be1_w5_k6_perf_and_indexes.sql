-- ==============================================================================
-- Migration: 20261102140000_be1_w5_k6_perf_and_indexes.sql
-- Dự án: AI Travel Reseller MVP (TravelLink AI) - Sprint 5 (Final Sprint)
-- Tác giả: Nguyễn Minh Tuệ (Backend 1 Lead kiêm Project Manager)
-- Tasks:
--   - BE1-W5-01: Production Schema Hardening & Pgvector Verification
--   - BE1-W5-02: Index Tuning & Connection Pooling Optimization for k6 Load Test
--   - BE1-W5-03: Production Storage Bucket 'campaign-videos' & CORS Security
--
-- Mục tiêu kỹ thuật:
--   1. Tạo Covering Indexes (Index-Only Scan) cho tuyến đường nóng /r/[code] (affiliate_links).
--   2. Tối ưu hóa truy vấn tóm tắt ví hoa hồng (get_reseller_wallet_summary) đạt p95 < 20ms.
--   3. Củng cố ràng buộc và hiệu năng ghi đồng thời cao cho bảng clicks khi 1.000 VUs truy cập.
--   4. Đảm bảo cấu hình bucket storage campaign-videos và RLS an toàn.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PHẦN 1: TỐI ƯU HÓA HIỆU NĂNG CHO TUYẾN ĐƯỜNG TIẾP THỊ /r/[code] (k6 1.000 VUs)
-- ------------------------------------------------------------------------------

-- Covering Index phục vụ Index-Only Scan cho việc tra cứu link tiếp thị tức thì
CREATE INDEX IF NOT EXISTS idx_affiliate_links_k6_lookup
ON public.affiliate_links (unique_code, is_active)
INCLUDE (id, destination_url, reseller_id, campaign_id, product_id);

-- Index tối ưu kiểm tra giới hạn tần suất click (IP Rate Limit) và chống click tặc
CREATE INDEX IF NOT EXISTS idx_clicks_link_ip_recent
ON public.clicks (link_id, ip_address, clicked_at DESC);

-- ------------------------------------------------------------------------------
-- PHẦN 2: COVERING INDEXES CHO RPC get_reseller_wallet_summary
-- ------------------------------------------------------------------------------

-- Index bao phủ thống kê hoa hồng theo trạng thái (confirmed, pending, paid, refunded)
CREATE INDEX IF NOT EXISTS idx_commissions_reseller_status_covering
ON public.commissions (reseller_id, status)
INCLUDE (net_amount, gross_amount, platform_fee, created_at, order_id);

-- Index bao phủ thống kê đơn hàng và kiểm tra tự mua (flag_self_purchase)
CREATE INDEX IF NOT EXISTS idx_orders_reseller_status_covering
ON public.orders (reseller_id, status)
INCLUDE (amount, reseller_commission, flag_self_purchase);

-- ------------------------------------------------------------------------------
-- PHẦN 3: BẢO ĐẢM TRẠNG THÁI STORAGE BUCKET 'campaign-videos'
-- ------------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'campaign-videos',
  'campaign-videos',
  true,
  104857600, -- 100MB
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/quicktime']::text[];

-- Đảm bảo chính sách RLS cho Storage Objects trên bucket 'campaign-videos'

DROP POLICY IF EXISTS "Public Read Access for Campaign Videos" ON storage.objects;
CREATE POLICY "Public Read Access for Campaign Videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaign-videos');

DROP POLICY IF EXISTS "Authenticated and Service Role Upload Campaign Videos" ON storage.objects;
CREATE POLICY "Authenticated and Service Role Upload Campaign Videos"
ON storage.objects FOR INSERT
TO authenticated, service_role
WITH CHECK (bucket_id = 'campaign-videos');

-- ------------------------------------------------------------------------------
-- PHẦN 4: CẬP NHẬT THỐNG KÊ QUERY PLANNER (ANALYZE)
-- ------------------------------------------------------------------------------
ANALYZE public.affiliate_links;
ANALYZE public.clicks;
ANALYZE public.orders;
ANALYZE public.commissions;
ANALYZE public.campaigns;
ANALYZE public.products;
