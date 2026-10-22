# BÁO CÁO THEO DÕI LỖI (BUG LOG) - DÀNH CHO DATABASE & SUPABASE STORAGE DEVELOPER
## Chức năng: Thư viện Media & Luồng tải Video mẫu của Merchant (Merchant Media Library)
**Dự án:** AI Travel Reseller Network  
**Vai trò:** Senior QA Automation Engineer  
**Đối tượng bàn giao:** Database Lead & Supabase Storage Developer  
**Ngày báo cáo:** 22/10/2026  
**Mã Migration liên quan:** `20261019100000_commerce_attribution_and_media.sql` (Phần 4, 5, 6, 7)  

---

## 1. TỔNG QUAN TRẠNG THÁI KIỂM THỬ (TEST SUMMARY)

- **Tổng số lỗi phát hiện (Open Bugs):** **0 Lỗi (0 Open Bugs)** trên cấu trúc cơ sở dữ liệu và chính sách bảo mật đã triển khai.
- **Đánh giá chất lượng Database Schema & RLS:** **XUẤT SẮC (CLEAN PASS)**
  - Bảng `public.media_references` được thiết kế chặt chẽ, kiểu dữ liệu phù hợp, ràng buộc CHECK đầy đủ và có trigger tự động cập nhật `updated_at`.
  - Các chỉ mục (Indexes) trên `merchant_id` và `created_at DESC` đảm bảo hiệu năng truy vấn phân trang mượt mà ngay cả khi số lượng video tăng cao.
  - Chính sách bảo mật hàng (Row Level Security - RLS) được phân quyền chuẩn xác: Cho phép đọc công khai (để Reseller và AI Content Factory truy cập video mẫu) và chỉ cho phép Merchant chỉnh sửa/xóa tài nguyên thuộc quyền sở hữu của chính mình.

---

## 2. BẢNG CHI TIẾT TÌNH TRẠNG KIỂM TRA DATABASE ĐÃ PHÁT TRIỂN (NHÓM A)

| Đối tượng Database | Loại đối tượng | Mục đích nghiệp vụ | Kết quả kiểm tra thiết kế & thực thi | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| `public.media_references` | Bảng (Table) | Lưu trữ metadata video mẫu cho Merchant và AI Video Engine | Có khóa ngoại `merchant_id` ràng buộc `ON DELETE CASCADE` tới `merchants(id)`; hỗ trợ mảng `TEXT[]` cho style tags và `JSONB` cho metadata AI. | **PASS** |
| `chk_media_references_platform` | Ràng buộc CHECK | Đảm bảo nền tảng chỉ thuộc danh mục cho phép | Ràng buộc hoạt động chính xác: `platform IN ('upload', 'tiktok', 'reels', 'youtube_shorts', 'youtube', 'other')`. | **PASS** |
| `idx_media_references_merchant_id` | B-tree Index | Tối ưu hóa truy vấn lọc video theo Merchant | Đã khai báo trong migration, giúp tăng tốc câu lệnh `SELECT * WHERE merchant_id = ...`. | **PASS** |
| `idx_media_references_created_at` | B-tree Index | Tối ưu hóa sắp xếp video mới nhất lên đầu | Đã khai báo với thứ tự `created_at DESC`, hỗ trợ phân trang `ORDER BY created_at DESC LIMIT ... OFFSET ...`. | **PASS** |
| `trg_media_references_updated_at` | Trigger | Tự động đồng bộ `updated_at` khi có thay đổi | Kích hoạt hàm `fn_set_updated_at()` trước mỗi lệnh `UPDATE`, đảm bảo tính toàn vẹn dữ liệu. | **PASS** |
| `Allow public read access to media_references` | RLS Policy | Quyền xem video mẫu cho Reseller và AI Agent | Thiết lập `FOR SELECT USING (true)` - đáp ứng nghiệp vụ Reseller cần xem và tải video mẫu để quảng bá. | **PASS** |
| `Allow merchants to manage their own media_references` | RLS Policy | Quyền quản lý tài nguyên của Merchant | Thiết lập `FOR ALL USING (merchant_id = auth.uid()) WITH CHECK (merchant_id = auth.uid())` - chống tuyệt đối việc Merchant này xóa nhầm hoặc can thiệp vào video của Merchant khác. | **PASS** |

---

## 3. CHECKLIST CẤU HÌNH SUPABASE STORAGE CHO SPRINT TIẾP THEO

Để hỗ trợ tính năng tải trực tiếp các tệp tin video `.mp4` dung lượng lớn từ trình duyệt của Merchant lên hệ thống lưu trữ đám mây, QA khuyến nghị thiết lập cấu hình Supabase Storage như sau:

1. **Khởi tạo Storage Bucket chuyên dụng:**
   - *Tên Bucket:* `merchant-media` (hoặc `campaign-videos`).
   - *Quyền truy cập:* Public bucket (để sinh CDN URL cho video playback và tải về).

2. **Cấu hình giới hạn dung lượng & loại tệp (MIME types):**
   ```sql
   -- Script cấu hình Bucket trên Supabase Storage
   INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
   VALUES (
     'merchant-media',
     'merchant-media',
     true,
     104857600, -- Giới hạn 100MB cho mỗi tệp video
     ARRAY['video/mp4', 'image/jpeg', 'image/png', 'image/webp']
   )
   ON CONFLICT (id) DO UPDATE SET
     file_size_limit = EXCLUDED.file_size_limit,
     allowed_mime_types = EXCLUDED.allowed_mime_types;
   ```

3. **Thiết lập RLS Policy cho Storage Bucket:**
   ```sql
   -- Cho phép mọi người đọc/tải video công khai
   CREATE POLICY "Allow public read access to merchant media"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'merchant-media');

   -- Chỉ Merchant đã xác thực mới được tải file vào thư mục của mình
   CREATE POLICY "Allow authenticated merchants to upload media"
   ON storage.objects FOR INSERT
   WITH CHECK (
     bucket_id = 'merchant-media' 
     AND auth.role() = 'authenticated'
     AND (storage.foldername(name))[1] = auth.uid()::text
   );

   -- Chỉ Merchant sở hữu thư mục mới có quyền xóa file
   CREATE POLICY "Allow merchants to delete their own media"
   ON storage.objects FOR DELETE
   USING (
     bucket_id = 'merchant-media' 
     AND auth.uid()::text = (storage.foldername(name))[1]
   );
   ```
