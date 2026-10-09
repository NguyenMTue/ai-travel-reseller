-- Migration bổ sung các trường phục vụ BE3 AI Content Factory cho bảng contents
ALTER TABLE public.contents
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS persona TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS hook TEXT,
ADD COLUMN IF NOT EXISTS cta TEXT;

-- Tạo index hỗ trợ tìm kiếm nhanh theo product_id và campaign_id
CREATE INDEX IF NOT EXISTS idx_contents_product_id ON public.contents(product_id);
CREATE INDEX IF NOT EXISTS idx_contents_campaign_id ON public.contents(campaign_id);

-- Cấp đầy đủ quyền cho service_role để n8n và Python service ghi nội dung tự động
GRANT ALL ON public.contents TO service_role;
