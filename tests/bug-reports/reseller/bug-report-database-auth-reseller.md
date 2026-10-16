# BÁO CÁO LỖI KIỂM THỬ E2E UI - PHÂN HỆ RESELLER PORTAL
## DÀNH CHO: DATABASE / SUPABASE / AUTH DEVELOPER (DB & AUTH)
**Dự án:** AI Travel Reseller Network  
**Tài liệu đối chiếu:** SRS v1.1 & BRD v1.0  
**Người lập báo cáo:** Senior QA Automation Engineer  
**Bộ test tự động:** `tests/reseller.spec.ts`  
**Ngày thực hiện:** 16/10/2026  

---

### TỔNG QUAN TÌNH TRẠNG DATABASE & AUTH
Qua rà soát các file migration trong `supabase/migrations/`, type definition tại `src/lib/database.types.ts` và logic kiểm tra quyền truy cập tại `src/lib/reseller/server.ts` & `src/lib/reseller/access.ts`:
1. Schema database hiện tại thiếu nhiều cột nghiệp vụ bắt buộc của `resellers` (location, interests, languages, compliance_agreed, payout_info) và `social_accounts` (engagement_rate).
2. Chưa có bảng dữ liệu lưu trữ Bài đăng khai báo (`post_declarations`) và số liệu tương tác tự khai của Reseller.
3. Trigger khởi tạo user mới `handle_new_user()` chưa thiết lập trạng thái mặc định cho Reseller là `pending` (`Chờ duyệt`).
4. Hàm kiểm tra quyền Reseller phía server `getResellerAccess()` **chưa kiểm tra điều kiện trạng thái tài khoản `status === 'approved'`**, dẫn tới việc mọi tài khoản có ID trong bảng `resellers` (kể cả bị đình chỉ hoặc chờ duyệt) đều có thể được cấp quyền truy cập nếu không có gatekeeper chặn ở tầng middleware/RLS.

---

### DANH SÁCH CHI TIẾT CÁC BUG DATABASE & AUTH

---

#### 1. BUG-DB-RES-01: Bảng `resellers` thiếu các cột thông tin hồ sơ và cam kết tuân thủ
- **Bug ID:** `BUG-DB-RES-01`
- **Vị trí phụ trách:** Database / Supabase / Auth Developer
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Hồ sơ Reseller & Cam kết tuân thủ - `FR-RES-01`, `FR-RES-04`, `RULE-14`
- **Test Case liên quan:** `FR-RES-01: Form đăng ký Reseller phải cung cấp đầy đủ thông tin: họ tên, email, SĐT, địa điểm, sở thích, ngôn ngữ` và `FR-RES-04 & RULE-14: Hiển thị đầy đủ 4 điều khoản tuân thủ bắt buộc cam kết trước khi tham gia`
- **Mức độ nghiêm trọng (Severity):** `High`
- **File source code nghi ngờ gây lỗi:** [remote_schema.sql](file:///d:/ai-travel-reseller/supabase/migrations/20261006162951_remote_schema.sql#L109-L119) và [database.types.ts](file:///d:/ai-travel-reseller/src/lib/database.types.ts#L214-L226)
- **Các bước tái hiện:**
  1. Kiểm tra cấu trúc bảng `public.resellers` hiện tại trong DB/migration:
     ```sql
     CREATE TABLE "public"."resellers" (
       "id" uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
       "name" character varying NOT NULL,
       "email" character varying,
       "phone" character varying,
       "status" character varying,
       "commission_rate" numeric,
       "created_at" timestamp without time zone DEFAULT now(),
       CONSTRAINT "resellers_pkey" PRIMARY KEY (id)
     );
     ```
- **Kết quả mong đợi (SRS v1.1):** Bảng `public.resellers` phải có các cột:
  - `location`: text/varchar (địa điểm hoạt động của Reseller).
  - `interests`: text[] hoặc jsonb (sở thích/ngách du lịch).
  - `languages`: text[] hoặc jsonb (ngôn ngữ sáng tạo nội dung).
  - `compliance_agreed_at`: timestamp with time zone (thời điểm đồng ý 4 điều khoản tuân thủ theo `RULE-14`).
  - `compliance_agreed_version`: varchar (phiên bản điều khoản đã đồng ý).
- **Kết quả thực tế & Error Log từ Playwright:**
  - Thiếu toàn bộ các cột trên, khiến Frontend và Backend không có schema để lưu thông tin khi đăng ký và cập nhật hồ sơ.
  - *Playwright Log:*
    ```text
    Error: expect(locator).toBeVisible() failed
    Locator: getByLabel('Số điện thoại', { exact: false })
    Error: element(s) not found
    ```

---

#### 2. BUG-DB-RES-02: Trigger `handle_new_user()` không thiết lập trạng thái mặc định 'pending' (Chờ duyệt)
- **Bug ID:** `BUG-DB-RES-02`
- **Vị trí phụ trách:** Database / Supabase / Auth Developer
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Trạng thái tài khoản ban đầu - `FR-RES-01`, `FR-ADM-02`
- **Test Case liên quan:** `FR-RES-01, FR-RES-04, FR-ADM-02: Chặn quyền tham gia chiến dịch đối với tài khoản Chờ duyệt hoặc Bị đình chỉ`
- **Mức độ nghiêm trọng (Severity):** `Critical`
- **File source code nghi ngờ gây lỗi:** [20261007201500_auth_trigger.sql](file:///d:/ai-travel-reseller/supabase/migrations/20261007201500_auth_trigger.sql#L15-L18)
- **Các bước tái hiện:**
  1. Xem hàm trigger `public.handle_new_user()`:
     ```sql
     ELSIF user_role = 'reseller' THEN
       INSERT INTO public.resellers (id, name, email)
       VALUES (NEW.id, full_name, NEW.email);
     END IF;
     ```
  2. Tạo một user mới qua Supabase Auth.
  3. Kiểm tra cột `status` trong `public.resellers`.
- **Kết quả mong đợi (SRS v1.1):** Cột `status` của tài khoản Reseller mới tạo phải có giá trị là `'pending'` (`Chờ duyệt`). Tài khoản phải qua Admin xét duyệt (`FR-ADM-02`) mới chuyển sang `'approved'`.
- **Kết quả thực tế & Error Log từ Playwright:**
  - Trigger chèn row mà không truyền `status`, và bảng `resellers` không có `DEFAULT 'pending'`. Cột `status` bị nhận giá trị `NULL`.
  - Hậu quả: Hệ thống không phân biệt được tài khoản mới đăng ký hay đã duyệt, tiềm ẩn nguy cơ cho phép tài khoản chưa duyệt tham gia phát tán link chiến dịch.

---

#### 3. BUG-DB-RES-03: Logic `getResellerAccess()` và RLS chưa kiểm tra trạng thái duyệt ('approved') và cam kết tuân thủ
- **Bug ID:** `BUG-DB-RES-03`
- **Vị trí phụ trách:** Database / Supabase / Auth Developer
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Kiểm soát phân quyền & RLS - `FR-RES-01`, `FR-RES-04`, `FR-ADM-02`
- **Test Case liên quan:** `FR-RES-01, FR-RES-04, FR-ADM-02: Chặn quyền tham gia chiến dịch đối với tài khoản Chờ duyệt hoặc Bị đình chỉ`
- **Mức độ nghiêm trọng (Severity):** `Critical`
- **File source code nghi ngờ gây lỗi:** [access.ts](file:///d:/ai-travel-reseller/src/lib/reseller/access.ts#L23-L38) và [server.ts](file:///d:/ai-travel-reseller/src/lib/reseller/server.ts#L61-L82)
- **Các bước tái hiện:**
  1. Kiểm tra hàm `inspectResellerAccess()` trong `src/lib/reseller/access.ts`:
     ```ts
     const parsed = z.object({ id: databaseUuidSchema }).safeParse(membership);
     if (parsed.data.id !== verifiedUserId) return { decision: "unavailable", ... };
     return { decision: "allowed", ... };
     ```
  2. Tạo tài khoản Reseller có `status = 'suspended'` hoặc `status = 'pending'`.
  3. Đăng nhập và truy cập các API hoặc trang `/reseller/campaigns`.
- **Kết quả mong đợi (SRS v1.1):**
  - Hàm `inspectResellerAccess` phải kiểm tra `membership.status === 'approved'` và `membership.compliance_agreed === true`.
  - Nếu `status === 'pending'` hoặc `status === 'suspended'`, phải trả về `decision: "forbidden"` kèm lý do cụ thể để hiển thị màn hình thông báo chờ duyệt hoặc đình chỉ.
  - Các chính sách RLS trên bảng `affiliate_links`, `contents` phải có điều kiện `EXISTS (SELECT 1 FROM public.resellers WHERE id = auth.uid() AND status = 'approved')`.
- **Kết quả thực tế & Error Log từ Playwright:**
  - Hiện tại hàm chỉ kiểm tra duy nhất: `resellers.id == auth.user.id`. Bất kỳ trạng thái nào (kể cả pending hay suspended) đều trả về `decision: "allowed"`!

---

#### 4. BUG-DB-RES-04: Bảng `social_accounts` thiếu cột `engagement_rate` (tương tác tự khai)
- **Bug ID:** `BUG-DB-RES-04`
- **Vị trí phụ trách:** Database / Supabase / Auth Developer
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Dữ liệu kênh mạng xã hội - `FR-RES-02`
- **Test Case liên quan:** `FR-RES-02 & RULE-17: Thêm tài khoản mạng xã hội (TikTok/FB) với chỉ số tự khai, TUYỆT ĐỐI không có ô nhập mật khẩu MXH`
- **Mức độ nghiêm trọng (Severity):** `Medium`
- **File source code nghi ngờ gây lỗi:** [20261006162951_remote_schema.sql](file:///d:/ai-travel-reseller/supabase/migrations/20261006162951_remote_schema.sql#L124-L135)
- **Các bước tái hiện:**
  1. Kiểm tra cấu trúc bảng `public.social_accounts`:
     ```sql
     "average_views" integer,
     "followers" integer,
     "platform" character varying,
     "status" character varying,
     "url" text,
     "username" character varying
     ```
- **Kết quả mong đợi (SRS v1.1):** Bổ sung cột `engagement_rate numeric` (hoặc `float`) để lưu trữ tỷ lệ tương tác tự khai của kênh (ví dụ: `4.5%`).
- **Kết quả thực tế & Error Log từ Playwright:**
  - Cột `engagement_rate` chưa có trong bảng `social_accounts`.

---

#### 5. BUG-DB-RES-05: Thiếu bảng lưu thông tin bài đăng khai báo (`post_declarations`) và số liệu tự khai
- **Bug ID:** `BUG-DB-RES-05`
- **Vị trí phụ trách:** Database / Supabase / Auth Developer
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Khai báo bài đăng & Số liệu tự khai - `FR-RES-10`, `FR-RES-11`, `RULE-13`
- **Test Case liên quan:** `FR-RES-10: Form khai báo URL bài đăng trên TikTok/Facebook và liên kết biến thể nội dung đã dùng` và `FR-RES-11 & RULE-13: Khai báo số liệu tương tác (view, like, cmt, share, save) kèm ảnh bằng chứng, bắt buộc gắn nhãn 'Tự khai'`
- **Mức độ nghiêm trọng (Severity):** `High`
- **File source code nghi ngờ gây lỗi:** Thiếu migration tạo bảng `public.post_declarations`
- **Các bước tái hiện:**
  1. Tìm kiếm bảng lưu URL bài đăng và metrics tương tác trong toàn bộ schema database.
- **Kết quả mong đợi (SRS v1.1 & RULE-13):** Cần tạo bảng `public.post_declarations`:
  - `id`: uuid primary key.
  - `reseller_id`: uuid references `public.resellers(id)`.
  - `campaign_id`: uuid references `public.campaigns(id)`.
  - `content_id`: uuid references `public.contents(id)` (biến thể nội dung đã dùng).
  - `platform`: varchar ('tiktok' / 'facebook').
  - `post_url`: text NOT NULL.
  - `views`, `likes`, `comments`, `shares`, `saves`: integer DEFAULT 0 (số liệu tự khai).
  - `proof_image_url`: text (ảnh chụp màn hình bằng chứng).
  - `is_self_reported`: boolean DEFAULT true.
  - Kèm chính sách RLS: Reseller chỉ được xem và tạo bài đăng của chính mình (`reseller_id = auth.uid()`).
- **Kết quả thực tế & Error Log từ Playwright:**
  - Hoàn toàn chưa có bảng hoặc cột nào trong database hỗ trợ tính năng này.

---

#### 6. BUG-DB-RES-06: Bảng `affiliate_links` thiếu cột lưu `voucher_code` (Mã voucher riêng biệt)
- **Bug ID:** `BUG-DB-RES-06`
- **Vị trí phụ trách:** Database / Supabase / Auth Developer
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Phân bổ doanh số bằng mã voucher - `FR-TRK-01`, `FR-ATT-01`
- **Test Case liên quan:** `FR-RES-06, FR-TRK-01 & FR-ATT-01: Tham gia chiến dịch <= 3 thao tác, chọn tài khoản MXH, cấp Tracking Link riêng và Mã Voucher riêng`
- **Mức độ nghiêm trọng (Severity):** `High`
- **File source code nghi ngờ gây lỗi:** [20261013140000_affiliate_links_and_clicks.sql](file:///d:/ai-travel-reseller/supabase/migrations/20261013140000_affiliate_links_and_clicks.sql#L8-L25)
- **Các bước tái hiện:**
  1. Kiểm tra bảng `public.affiliate_links`:
     Hiện chỉ có `id`, `reseller_id`, `campaign_id`, `product_id`, `unique_code`, `short_url`, `destination_url`, `clicks_count`, `is_active`.
- **Kết quả mong đợi (SRS v1.1):** Bổ sung cột:
  - `voucher_code`: varchar UNIQUE (ví dụ: `DANANG-RES-8823`).
  - Constraint UNIQUE để đảm bảo mỗi Reseller tham gia một chiến dịch có một mã voucher duy nhất, không trùng lặp trên toàn hệ thống.
- **Kết quả thực tế & Error Log từ Playwright:**
  - Bảng `affiliate_links` chưa có cột `voucher_code`.

---

#### 7. BUG-DB-RES-07: Thiếu bảng hoặc cột lưu trữ thông tin nhận hoa hồng (Payout Accounts)
- **Bug ID:** `BUG-DB-RES-07`
- **Vị trí phụ trách:** Database / Supabase / Auth Developer
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Thông tin nhận tiền - `FR-RES-14`
- **Test Case liên quan:** `FR-RES-14 & RULE-17: Form khai báo thông tin nhận hoa hồng (ngân hàng, số tài khoản, tên chủ thẻ, MST)`
- **Mức độ nghiêm trọng (Severity):** `High`
- **File source code nghi ngờ gây lỗi:** Thiếu bảng `public.reseller_payout_accounts` hoặc các cột tương ứng trong `public.resellers`
- **Các bước tái hiện:**
  1. Kiểm tra schema để tìm nơi lưu thông tin tài khoản ngân hàng của Reseller.
- **Kết quả mong đợi (SRS v1.1):** Cần có bảng hoặc các trường: `bank_name`, `account_number`, `account_holder`, `tax_id` (được mã hóa hoặc giới hạn quyền đọc chỉ cho chính Reseller và Admin).
- **Kết quả thực tế & Error Log từ Playwright:**
  - Chưa có bảng/cột nào trong database.
