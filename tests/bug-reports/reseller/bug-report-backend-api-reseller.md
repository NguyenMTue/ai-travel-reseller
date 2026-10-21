# BÁO CÁO LỖI KIỂM THỬ BACKEND & API (BACKEND API BUG REPORT) - PHÂN HỆ RESELLER PORTAL
**Dự án:** AI Travel Reseller Network (MVP)  
**Phân hệ:** Reseller Portal / API Routes  
**Người phụ trách báo cáo:** Senior QA Automation Engineer  
**Đối tượng nhận xử lý:** Backend / API Development Team  
**Tài liệu tham chiếu:** SRS v1.1 & BRD v1.0  
**Ngày lập:** 15/10/2026  

---

## TỔNG QUAN
Qua kiểm thử logic server-side và đối chiếu API contracts với SRS v1.1 / BRD v1.0, QA ghi nhận **6 lỗi và thiếu sót** cốt lõi ở tầng Backend & API Handlers, làm ảnh hưởng trực tiếp đến an ninh phân quyền, cơ chế cấp mã Dual Attribution, và hệ thống theo dõi hiệu suất/hoa hồng của Reseller.

---

## DANH SÁCH CHI TIẾT CÁC BUG

### 1. BUG-BE-RES-01: Access Guard không kiểm tra trạng thái tài khoản `status` (Chờ duyệt / Bị đình chỉ)
- **Bug ID:** `BUG-BE-RES-01`
- **Vị trí phụ trách:** Backend / API Dev
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Phân quyền Reseller & Chặn truy cập - `FR-RES-01`, `FR-ADM-02`
- **Test Case liên quan trong `tests/reseller.spec.ts`:** `TC-RES-04 [FR-RES-01, FR-RES-04, FR-ADM-02]`
- **Mức độ nghiêm trọng (Severity):** `Critical`
- **File source code nghi ngờ gây lỗi:** `src/lib/reseller/server.ts` (dòng 62–79) và `src/lib/reseller/access.ts` (dòng 23–38)
- **Các bước tái hiện:**
  1. Tạo hoặc cấu hình một tài khoản Reseller trong DB có `status = 'pending'` (Chờ duyệt) hoặc `status = 'suspended'` (Bị đình chỉ).
  2. Đăng nhập với tài khoản trên và truy cập vào `/reseller/campaigns`.
- **Kết quả mong đợi:** Theo `FR-RES-01` và `FR-ADM-02`, hệ thống phải chặn truy cập và hiển thị thông báo tài khoản đang chờ phê duyệt hoặc đã bị đình chỉ hoạt động; không cho phép xem feed hay tham gia chiến dịch.
- **Kết quả thực tế:** Hàm `getResellerAccess()` chỉ thực hiện câu lệnh:
  ```ts
  const membership = await client
    .from("resellers")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();
  ```
  Hàm chỉ kiểm tra xem có dòng dữ liệu với `id` đó không, hoàn toàn bỏ qua cột `status`. Tài khoản ở trạng thái "Chờ duyệt" hay "Bị đình chỉ" đều được gán `decision === 'allowed'` và cấp toàn quyền truy cập.

---

### 2. BUG-BE-RES-02: Endpoint `/api/tracking-links/generate` không cấp Unique Voucher Code (Dual Attribution)
- **Bug ID:** `BUG-BE-RES-02`
- **Vị trí phụ trách:** Backend / API Dev
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Cơ chế ghi nhận hoa hồng kép - `FR-TRK-01`, `FR-ATT-01`, `FR-RES-06`
- **Test Case liên quan:** `TC-RES-07 [FR-RES-06, FR-TRK-01, FR-ATT-01]`
- **Mức độ nghiêm trọng (Severity):** `High`
- **File source code nghi ngờ gây lỗi:** `app/api/tracking/generate/route.ts` (dòng 1–250) & `src/lib/reseller/tracking-link.ts` (dòng 18–21)
- **Các bước tái hiện:**
  1. Gửi request `POST /api/tracking-links/generate` với payload:
     ```json
     {
       "campaign_id": "44444444-4444-4444-4444-444444444444",
       "product_id": "33333333-3333-3333-3333-333333333333"
     }
     ```
  2. Kiểm tra schema response trả về.
- **Kết quả mong đợi:** Theo `FR-ATT-01`, hệ thống cấp đồng thời **Tracking Link** (`/r/<tracking_id>`) và **Mã Voucher riêng** (Unique Voucher Code ví dụ: `DANANG-RESELLER1-SALE10`) để khách có thể nhập voucher khi thanh toán trên web Merchant nhằm ghi nhận hoa hồng.
- **Kết quả thực tế:** Endpoint chỉ tạo bản ghi trong bảng `affiliate_links` và trả về `unique_code`, `short_url`, `destination_url`. Không có logic sinh hoặc lưu trữ Mã Voucher riêng.

---

### 3. BUG-BE-RES-03: Thiếu API endpoint ghi nhận sự kiện tải video và sao chép nội dung
- **Bug ID:** `BUG-BE-RES-03`
- **Vị trí phụ trách:** Backend / API Dev
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Theo dõi tương tác tài nguyên - `FR-RES-08`
- **Test Case liên quan:** `TC-RES-10 [FR-RES-08]`
- **Mức độ nghiêm trọng (Severity):** `Medium`
- **File source code nghi ngờ gây lỗi:** Thư mục `app/api/` (chưa có endpoint audit log)
- **Các bước tái hiện:**
  1. Người dùng nhấn nút Copy kịch bản hoặc Tải video trên giao diện Content Kit.
  2. Kiểm tra tab Network và bảng `tracking_events` trong Database.
- **Kết quả mong đợi:** Theo `FR-RES-08`, hệ thống phải ghi nhận sự kiện `content_downloaded` và `content_copied` kèm `reseller_id`, `content_id`, `campaign_id` vào bảng `tracking_events` để đo lường mức độ tương tác nội dung.
- **Kết quả thực tế:** Không có bất kỳ HTTP request nào được gửi về backend khi người dùng copy nội dung; không có endpoint tiếp nhận sự kiện này.

---

### 4. BUG-BE-RES-04: Thiếu API endpoints cho việc khai báo bài đăng và số liệu tự khai
- **Bug ID:** `BUG-BE-RES-04`
- **Vị trí phụ trách:** Backend / API Dev
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Khai báo bài đăng & Số liệu tự khai - `FR-RES-10`, `FR-RES-11`
- **Test Case liên quan:** `TC-RES-12`, `TC-RES-13`
- **Mức độ nghiêm trọng (Severity):** `High`
- **File source code nghi ngờ gây lỗi:** Thư mục `app/api/reseller/`
- **Các bước tái hiện:**
  1. Kiểm tra danh sách API routes trong `app/api/reseller/`.
- **Kết quả mong đợi:** Phải có 2 endpoints:
  - `POST /api/reseller/posts`: Khai báo URL bài đăng TikTok/Facebook và liên kết `content_id`.
  - `POST /api/reseller/posts/metrics`: Cập nhật số liệu view, like, comment, share, save và URL ảnh chụp màn hình bằng chứng.
- **Kết quả thực tế:** Thư mục `app/api/reseller/` hiện chỉ có 2 routes là `analytics` và `links`. Chưa có endpoint nào xử lý nghiệp vụ bài đăng.

---

### 5. BUG-BE-RES-05: Thiếu API danh sách Booking hoa hồng có Masking PII khách hàng
- **Bug ID:** `BUG-BE-RES-05`
- **Vị trí phụ trách:** Backend / API Dev
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Bảo vệ dữ liệu cá nhân & Quản lý hoa hồng - `FR-ANA-09`, `FR-AIS-13`, `FR-RES-13`
- **Test Case liên quan:** `TC-RES-18 [FR-ANA-09, FR-AIS-13]`
- **Mức độ nghiêm trọng (Severity):** `High`
- **File source code nghi ngờ gây lỗi:** Thư mục `app/api/reseller/`
- **Các bước tái hiện:**
  1. Kiểm tra API cung cấp dữ liệu hoa hồng và đơn hàng cho Reseller.
- **Kết quả mong đợi:** Cung cấp API trả về danh sách đơn hàng đã chốt kèm hoa hồng; thông tin khách hàng (Họ tên, SĐT, Email) bắt buộc phải được che (PII Masking) tại backend trước khi trả về client.
- **Kết quả thực tế:** Chưa có API endpoint trả về danh sách booking cho Reseller.

---

### 6. BUG-BE-RES-06: Endpoint `/api/reseller/analytics` thiếu Lead, GMV, CR và xử lý mẫu số 0
- **Bug ID:** `BUG-BE-RES-06`
- **Vị trí phụ trách:** Backend / API Dev
- **Tính năng & Mã yêu cầu SRS bị ảnh hưởng:** Dashboard Hiệu suất - `FR-RES-12`, `FR-ANA-06`, `FR-ANA-11`
- **Test Case liên quan:** `TC-RES-14 [FR-RES-12, FR-ANA-06, FR-ANA-11]`
- **Mức độ nghiêm trọng (Severity):** `Medium`
- **File source code nghi ngờ gây lỗi:** `app/api/reseller/analytics/route.ts` (dòng 90–98)
- **Các bước tái hiện:**
  1. Gửi request `GET /api/reseller/analytics?reseller_id=<id>`.
  2. Kiểm tra cấu trúc object `data.overview`.
- **Kết quả mong đợi:** Theo `FR-ANA-06` và `FR-ANA-11`, cấu trúc overview phải bao gồm: `clicks`, `leads`, `bookings`, `gmv` (VND), `conversion_rate` (trả về `"N/A"` nếu `clicks === 0`).
- **Kết quả thực tế:** Object `overview` hiện tại chỉ có:
  ```json
  {
    "total_links": 0,
    "active_links": 0,
    "total_clicks": 0,
    "valid_clicks": 0,
    "bot_clicks": 0,
    "invalid_clicks": 0,
    "bot_ratio_percentage": 0
  }
  ```
  Thiếu hoàn toàn các trường: `leads`, `bookings`, `gmv`, và `conversion_rate`.
