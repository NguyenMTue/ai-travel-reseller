-- ==============================================================================
-- Migration: 20261021120000_storage_campaign_videos.sql
-- Dự án: AI Travel Reseller MVP (TravelLink AI) - Sprint 3
-- Task: BE1-W3-07: Video API & Storage Pipeline
-- Tác giả: Nguyễn Minh Tuệ (Backend 1 Lead)
-- Mục tiêu:
--   1. Khởi tạo Supabase Storage bucket 'campaign-videos' chế độ Public Read.
--   2. Giới hạn dung lượng tối đa 100MB và định dạng MIME chuẩn video (mp4, webm, mov).
--   3. Thiết lập bộ chính sách RLS (Row Level Security) cho storage.objects:
--      - Public: Xem/Stream video trực tiếp trên web/mobile không cần token.
--      - Authenticated & Service Role: Upload, cập nhật và xóa video.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PHẦN 1: KHỞI TẠO BUCKET 'campaign-videos'
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'campaign-videos',
  'campaign-videos',
  true,
  104857600, -- 100MB (100 * 1024 * 1024 bytes)
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/quicktime']::text[];

-- ------------------------------------------------------------------------------
-- PHẦN 2: CHÍNH SÁCH BẢO MẬT RLS (ROW LEVEL SECURITY) CHO STORAGE.OBJECTS
-- ------------------------------------------------------------------------------

-- 1. Public Read: Bất kỳ ai (Khách du lịch, Reseller, Merchant) đều có thể xem/tải video
DROP POLICY IF EXISTS "Public Read Access for Campaign Videos" ON storage.objects;
CREATE POLICY "Public Read Access for Campaign Videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaign-videos');

-- 2. Authenticated Upload: Người dùng đã đăng nhập hoặc Service Role mới được phép tải video lên
DROP POLICY IF EXISTS "Authenticated and Service Role Upload Campaign Videos" ON storage.objects;
CREATE POLICY "Authenticated and Service Role Upload Campaign Videos"
ON storage.objects FOR INSERT
TO authenticated, service_role
WITH CHECK (
  bucket_id = 'campaign-videos'
);

-- 3. Update Policy: Cho phép chỉnh sửa metadata hoặc cập nhật video
DROP POLICY IF EXISTS "Authenticated and Service Role Update Campaign Videos" ON storage.objects;
CREATE POLICY "Authenticated and Service Role Update Campaign Videos"
ON storage.objects FOR UPDATE
TO authenticated, service_role
USING (bucket_id = 'campaign-videos')
WITH CHECK (bucket_id = 'campaign-videos');

-- 4. Delete Policy: Cho phép xóa video khỏi bucket khi Merchant xóa chiến dịch
DROP POLICY IF EXISTS "Authenticated and Service Role Delete Campaign Videos" ON storage.objects;
CREATE POLICY "Authenticated and Service Role Delete Campaign Videos"
ON storage.objects FOR DELETE
TO authenticated, service_role
USING (bucket_id = 'campaign-videos');
