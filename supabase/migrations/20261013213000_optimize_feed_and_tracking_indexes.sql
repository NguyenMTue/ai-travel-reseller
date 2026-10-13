-- Migration: 20261013213000_optimize_feed_and_tracking_indexes.sql
-- Module: Backend 1 Week 2 (BE1-W2-06)
-- Description: Tối ưu hóa hiệu năng truy vấn cho Reseller Campaign Feed, Suggested Content Kit và Tracking Analytics

-- ============================================================================
-- 1. TỐI ƯU HÓA BẢNG CAMPAIGNS (Phục vụ Reseller Feed & Merchant Portal)
-- ============================================================================

-- 1.1. Composite index phục vụ Reseller Feed: Lọc theo status và sắp xếp theo ngày bắt đầu
CREATE INDEX IF NOT EXISTS idx_campaigns_status_start_date 
ON public.campaigns (status, start_date DESC NULLS LAST);

-- 1.2. Partial Index tối ưu hóa truy vấn các chiến dịch đang hoạt động (ACTIVE)
-- Giúp giảm kích thước index và tăng tốc độ lọc danh sách chiến dịch tiếp thị
CREATE INDEX IF NOT EXISTS idx_campaigns_active_feed 
ON public.campaigns (commission_rate DESC, start_date DESC NULLS LAST) 
WHERE status = 'ACTIVE';

-- 1.3. Foreign Key Indexes: Bắt buộc để tối ưu phép JOIN giữa campaigns và products/merchants
CREATE INDEX IF NOT EXISTS idx_campaigns_product_id 
ON public.campaigns (product_id);

CREATE INDEX IF NOT EXISTS idx_campaigns_merchant_id 
ON public.campaigns (merchant_id);

-- 1.4. Index phục vụ bộ lọc địa điểm du lịch (Đà Nẵng, Hội An, Huế...)
CREATE INDEX IF NOT EXISTS idx_campaigns_target_location 
ON public.campaigns (target_location) 
WHERE target_location IS NOT NULL;


-- ============================================================================
-- 2. TỐI ƯU HÓA BẢNG CONTENTS (Phục vụ Suggested Content Kit & AI Content Factory)
-- ============================================================================

-- 2.1. Composite index truy xuất nội dung theo Campaign và Trạng thái kiểm duyệt
CREATE INDEX IF NOT EXISTS idx_contents_campaign_status 
ON public.contents (campaign_id, status);

-- 2.2. Composite index phục vụ lọc bài viết theo Persona (Local Guide, Foodie, Family...)
CREATE INDEX IF NOT EXISTS idx_contents_campaign_persona 
ON public.contents (campaign_id, persona);

-- 2.3. Index phục vụ Merchant/Admin lọc nội dung theo trạng thái (NEEDS_REVIEW / APPROVED)
CREATE INDEX IF NOT EXISTS idx_contents_status 
ON public.contents (status);

-- 2.4. Index Foreign Key reseller_id (nếu nội dung được gán riêng cho Reseller)
CREATE INDEX IF NOT EXISTS idx_contents_reseller_id 
ON public.contents (reseller_id) 
WHERE reseller_id IS NOT NULL;


-- ============================================================================
-- 3. TỐI ƯU HÓA BẢNG PRODUCTS (Phục vụ JOIN với Campaign & Bộ lọc tour)
-- ============================================================================

-- 3.1. Foreign Key merchant_id
CREATE INDEX IF NOT EXISTS idx_products_merchant_id 
ON public.products (merchant_id);

-- 3.2. Index phục vụ lọc danh mục và trạng thái sản phẩm
CREATE INDEX IF NOT EXISTS idx_products_status_category 
ON public.products (status, category);


-- ============================================================================
-- 4. TỐI ƯU HÓA BẢNG CLICKS (Phục vụ Thống kê & Báo cáo Analytics)
-- ============================================================================

-- 4.1. Composite index tối ưu truy vấn chuỗi thời gian lượt click theo link tiếp thị
CREATE INDEX IF NOT EXISTS idx_clicks_link_clicked_at 
ON public.clicks (link_id, clicked_at DESC);


-- ============================================================================
-- 5. TỐI ƯU HÓA BẢNG ORDERS & COMMISSIONS (Phục vụ E2E & Commission Flow)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_orders_reseller_id 
ON public.orders (reseller_id);

CREATE INDEX IF NOT EXISTS idx_orders_merchant_id 
ON public.orders (merchant_id);

CREATE INDEX IF NOT EXISTS idx_orders_product_id 
ON public.orders (product_id);

CREATE INDEX IF NOT EXISTS idx_orders_status 
ON public.orders (status);
