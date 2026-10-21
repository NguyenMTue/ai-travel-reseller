# BÁO CÁO LỖI KIỂM THỬ CƠ SỞ DỮ LIỆU & XÁC THỰC (DATABASE & AUTH BUG REPORT) - PHÂN HỆ RESELLER PORTAL
**Dự án:** AI Travel Reseller Network (MVP)  
**Phân hệ:** Database Schema / Supabase Auth / RLS  
**Người phụ trách báo cáo:** Senior QA Automation Engineer  
**Đối tượng nhận xử lý:** Database / Supabase / Auth Development Team  
**Tài liệu tham chiếu:** SRS v1.1 & BRD v1.0  
**Ngày lập:** 15/10/2026  

---

## TỔNG QUAN
Qua đối chiếu giữa Database Schema thực tế trong `supabase/migrations/` và `src/lib/database.types.ts` với tài liệu SRS v1.1 / BRD v1.0, QA phát hiện **6 vấn đề thiếu hụt bảng, cột và quy tắc phân quyền RLS** cần DB Dev tiến hành cập nhật migration để phục vụ phân hệ Reseller.

---

## DANH SÁCH CHI TIẾT CÁC BUG

### 1. BUG-DB-RES-01: Bảng `public.resellers` thiếu các cột thông tin hồ sơ và cam kết tuân thủ
- **Bug ID:** `BUG-DB-RES-01`
- **Vị trí phụ trách:** Database / Supabase Dev
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Đăng ký / Hồ sơ & Điều khoản tuân thủ - `FR-RES-01`, `FR-RES-04`, `RULE-14`
- **Test Case liên quan trong `tests/reseller.spec.ts`:** `TC-RES-01 [FR-RES-01]`, `TC-RES-03 [FR-RES-04]`
- **Mức độ nghiêm trọng (Severity):** `High`
- **File source code nghi ngờ gây lỗi:** `supabase/migrations/20261006162951_remote_schema.sql` (bảng `resellers`) và `src/lib/database.types.ts` (dòng 214–226)
- **Các bước tái hiện:**
  1. Kiểm tra cấu trúc bảng `resellers` trong `database.types.ts`:
     ```ts
     resellers: {
       Row: {
         commission_rate: number | null,
         created_at: string | null,
         email: string | null,
         id: string,
         name: string,
         phone: string | null,
         status: string | null
       }
     }
     ```
- **Kết quả mong đợi:** Theo `FR-RES-01` và `FR-RES-04`, bảng `resellers` phải có các cột:
  - `location`: `text` (Địa bàn hoạt động chính của Reseller, vd: Đà Nẵng, Hội An).
  - `interests`: `text[]` hoặc `jsonb` (Sở thích/thế mạnh: ẩm thực, nghỉ dưỡng, gia đình...).
  - `languages`: `text[]` (Ngôn ngữ: Tiếng Việt, Tiếng Anh, Hàn...).
  - `compliance_accepted_at`: `timestamptz` (Thời điểm xác nhận cam kết điều khoản tuân thủ RULE-14).
- **Kết quả thực tế:** Bảng `resellers` hoàn toàn thiếu 4 cột trên. Khi người dùng đăng ký hoặc cập nhật hồ sơ, dữ liệu không có chỗ lưu trữ.

---

### 2. BUG-DB-RES-02: Bảng `public.resellers` thiếu các cột thông tin nhận tiền hoa hồng
- **Bug ID:** `BUG-DB-RES-02`
- **Vị trí phụ trách:** Database / Supabase Dev
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Thông tin nhận hoa hồng - `FR-RES-14`, `RULE-17`
- **Test Case liên quan:** `TC-RES-17 [FR-RES-14, RULE-17]`
- **Mức độ nghiêm trọng (Severity):** `High`
- **File source code nghi ngờ gây lỗi:** `supabase/migrations/20261006162951_remote_schema.sql`
- **Các bước tái hiện:**
  1. Kiểm tra schema của bảng `resellers`.
- **Kết quả mong đợi:** Cần có các trường để lưu thông tin tài khoản nhận tiền thanh toán:
  - `bank_name`: `text` (Tên ngân hàng).
  - `bank_account_number`: `text` (Số tài khoản ngân hàng).
  - `bank_account_holder`: `text` (Tên chủ tài khoản viết hoa không dấu).
  - `tax_id`: `text` (Mã số thuế thu nhập cá nhân nếu có).
- **Kết quả thực tế:** Bảng `resellers` chưa có bất kỳ trường nào liên quan đến thông tin tài khoản ngân hàng.

---

### 3. BUG-DB-RES-03: Bảng `social_accounts` thiếu cột tỷ lệ tương tác tự khai (`engagement_rate`)
- **Bug ID:** `BUG-DB-RES-03`
- **Vị trí phụ trách:** Database / Supabase Dev
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Khai báo tài khoản mạng xã hội - `FR-RES-02`
- **Test Case liên quan:** `TC-RES-02 [FR-RES-02]`
- **Mức độ nghiêm trọng (Severity):** `Medium`
- **File source code nghi ngờ gây lỗi:** `src/lib/database.types.ts` (dòng 227–245)
- **Các bước tái hiện:**
  1. Kiểm tra các cột trong bảng `social_accounts`:
     `average_views`, `created_at`, `followers`, `id`, `platform`, `reseller_id`, `status`, `url`, `username`.
- **Kết quả mong đợi:** Cần có cột `engagement_rate`: `numeric(5,2)` để lưu tỷ lệ tương tác do Reseller tự khai báo khi thêm tài khoản MXH theo yêu cầu `FR-RES-02`.
- **Kết quả thực tế:** Thiếu cột `engagement_rate`.

---

### 4. BUG-DB-RES-04: Thiếu bảng `reseller_posts` và `reseller_post_metrics`
- **Bug ID:** `BUG-DB-RES-04`
- **Vị trí phụ trách:** Database / Supabase Dev
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Khai báo bài đăng & Số liệu tự khai - `FR-RES-10`, `FR-RES-11`, `RULE-13`
- **Test Case liên quan:** `TC-RES-12`, `TC-RES-13`
- **Mức độ nghiêm trọng (Severity):** `Critical`
- **File source code nghi ngờ gây lỗi:** `supabase/migrations/`
- **Các bước tái hiện:**
  1. Kiểm tra danh sách bảng hiện có trong database:
     `affiliate_links`, `campaigns`, `clicks`, `contents`, `merchants`, `orders`, `product_embeddings`, `products`, `resellers`, `social_accounts`, `tracking_events`.
- **Kết quả mong đợi:** Phải có bảng phục vụ nghiệp vụ khai báo bài đăng của Reseller:
  - Bảng `reseller_posts`: `id`, `reseller_id`, `campaign_id`, `content_id`, `platform`, `post_url`, `status`, `created_at`.
  - Bảng `reseller_post_metrics`: `id`, `post_id`, `views`, `likes`, `comments`, `shares`, `saves`, `proof_image_url`, `is_self_reported` (default true), `reported_at`.
- **Kết quả thực tế:** Hoàn toàn chưa có 2 bảng này trong cơ sở dữ liệu.

---

### 5. BUG-DB-RES-05: Thiếu trường lưu trữ Mã Voucher trong bảng `affiliate_links` (hoặc thiếu bảng `vouchers`)
- **Bug ID:** `BUG-DB-RES-05`
- **Vị trí phụ trách:** Database / Supabase Dev
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Cấp phát mã voucher riêng - `FR-ATT-01`, `FR-RES-06`
- **Test Case liên quan:** `TC-RES-07 [FR-ATT-01]`
- **Mức độ nghiêm trọng (Severity):** `High`
- **File source code nghi ngờ gây lỗi:** `supabase/migrations/20261006162951_remote_schema.sql` (bảng `affiliate_links`)
- **Các bước tái hiện:**
  1. Kiểm tra bảng `affiliate_links` trong `src/lib/database.types.ts`:
     `campaign_id`, `clicks_count`, `created_at`, `destination_url`, `id`, `is_active`, `product_id`, `reseller_id`, `short_url`, `unique_code`, `updated_at`.
- **Kết quả mong đợi:** Theo `FR-ATT-01`, khi tham gia chiến dịch, Reseller được cấp đồng thời Tracking Link VÀ Mã Voucher riêng. Database cần có cột `voucher_code` (unique, nullable/not null) trong `affiliate_links` hoặc một bảng riêng `reseller_vouchers`.
- **Kết quả thực tế:** Chỉ có cột `unique_code` dùng cho tracking URL path (`/r/[unique_code]`), không có cột lưu mã voucher giảm giá cho Reseller.

---

### 6. BUG-DB-RES-06: RLS Policies cần kiểm tra trạng thái hoạt động của Reseller trước khi cho phép INSERT/SELECT
- **Bug ID:** `BUG-DB-RES-06`
- **Vị trí phụ trách:** Database / Supabase / Auth Dev
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Bảo mật phân quyền RLS - `FR-ADM-02`, `FR-RES-01`
- **Test Case liên quan:** `TC-RES-04`
- **Mức độ nghiêm trọng (Severity):** `High`
- **File source code nghi ngờ gây lỗi:** `supabase/migrations/` (các chính sách RLS trên bảng `affiliate_links` và `contents`)
- **Các bước tái hiện:**
  1. Kiểm tra điều kiện chính sách RLS hiện hành trên bảng `affiliate_links`.
- **Kết quả mong đợi:** Chính sách RLS cho phép tạo link hoặc xem nội dung phải ràng buộc điều kiện:
  ```sql
  EXISTS (
    SELECT 1 FROM public.resellers 
    WHERE id = auth.uid() AND status = 'active'
  )
  ```
  Nhằm ngăn chặn tài khoản đang ở trạng thái `pending` (Chờ duyệt) hoặc `suspended` (Bị đình chỉ) ghi dữ liệu.
- **Kết quả thực tế:** Hiện tại các policies chỉ kiểm tra `auth.uid() = reseller_id`, không kiểm tra `status = 'active'`.
