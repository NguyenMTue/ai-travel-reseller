-- ==============================================================================
-- Migration: Bổ sung trường ai_custom_instructions cho bảng campaigns
-- Phục vụ cấu hình ghi chú AI tạo kịch bản video review (BE1-MERCH-01)
-- ==============================================================================

ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS ai_custom_instructions TEXT;

COMMENT ON COLUMN public.campaigns.ai_custom_instructions IS 'Ghi chú tiếp thị hoặc phong cách kịch bản do Merchant cấu hình cho AI Video Pipeline (tối đa 500 ký tự)';
