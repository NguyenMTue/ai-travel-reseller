-- ==============================================================================
-- Migration: Cập nhật bản ghi Product & Campaign cho Sun World Ba Na Hills
-- Đảm bảo metadata (Tên sản phẩm, giá bán chính hãng, địa danh) khớp 100% với
-- chuẩn niêm yết của Merchant và bộ tư liệu 4 ảnh Bà Nà Hills.
-- ==============================================================================

UPDATE public.products
SET 
  name = 'Vé Cáp Treo Sun World Ba Na Hills',
  description = 'Vé trọn gói cáp treo khứ hồi Sun World Ba Na Hills, tham quan Cầu Vàng, Làng Pháp và Quảng trường Nhật Thực.',
  category = 'Vé tham quan & Cáp treo',
  original_price = 1250000,
  sale_price = 950000,
  booking_url = 'https://sunworld.vn/booking/ba-na-hills',
  status = 'active'
WHERE id = '33333333-3333-3333-3333-333333333333';

UPDATE public.campaigns
SET 
  name = 'Chiến dịch Khám Phá Sun World Ba Na Hills 2026',
  target_location = 'Bà Nà Hills, Đà Nẵng',
  product_id = '33333333-3333-3333-3333-333333333333',
  status = 'active'
WHERE id = '44444444-4444-4444-4444-444444444444';
