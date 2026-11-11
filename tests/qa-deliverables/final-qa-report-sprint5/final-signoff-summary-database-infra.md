# BÁO CÁO TỔNG KẾT BÀN GIAO & NGHIỆM THU DATABASE, AUTH & INFRASTRUCTURE
## FINAL QA SIGN-OFF SUMMARY — DATABASE, AUTH & INFRASTRUCTURE TEAM
**Dự án:** AI Travel Reseller Network (TravelLink AI)  
**Mã định danh:** `cnm-2026-a`  
**Giai đoạn:** Sprint 5 — Final Project Sign-off & Go-Live Readiness  
**Người lập báo cáo:** **Trương Đức Huy** (Tester 3 / QA Specialist & Senior QA Lead)  
**Đối tượng tiếp nhận:** **Database, Supabase Auth & Cloud Infrastructure Team**  
**Ngày phát hành:** 05/11/2026  
**Trạng thái nghiệm thu:** **`ĐỒNG Ý BÀN GIAO — CƠ SỞ DỮ LIỆU & HẠ TẦNG ĐẠT CHUẨN AN TOÀN (APPROVED)`**  

---

## 1. TỔNG QUAN KẾT QUẢ NGHIỆM THU DATABASE, AUTH & HẠ TẦNG (INFRA EXECUTIVE SUMMARY)

Trải qua 5 Sprint phát triển, đội ngũ Database & Hạ tầng đã thiết lập hệ thống cơ sở dữ liệu Supabase Postgres 15, chính sách bảo vệ phân quyền Row Level Security (RLS), cơ chế lưu trữ tài nguyên Media Storage và kiến trúc bảo vệ dữ liệu cá nhân theo tiêu chuẩn quốc tế GDPR và Nghị định 13/2023/NĐ-CP.

Hệ thống đã trải qua các đợt kiểm thử tự động Playwright E2E UAT và bài kiểm tra chịu tải 1.000 VUs của k6. Kết quả khẳng định toàn bộ cấu trúc bảng, chính sách phân quyền và dữ liệu ví hoa hồng đều đạt tính toàn vẹn cao, bảo mật nghiêm ngặt và sẵn sàng đưa vào vận hành thực tế.

### Bảng Chỉ số An toàn & Toàn vẹn Dữ liệu (Database & Infra KPIs)
| Chỉ số Kiểm định Cơ sở dữ liệu | Tiêu chuẩn Đặt ra | Kết quả Thực nghiệm Ghi nhận | Đánh giá Tuân thủ |
| :--- | :---: | :---: | :---: |
| **Bảo mật Dữ liệu Cá nhân Khách hàng** | 100% PII Masking (`NFR-SEC-02`) | **100% Ẩn danh (Tuyệt đối không lộ Tên, SĐT, Email, Thẻ)** | ✅ TUÂN THỦ TUYỆT ĐỐI |
| **Chính sách Phân quyền RLS Supabase** | Cô lập Multi-Tenant hoàn toàn | **Chặn 100% truy cập chéo giữa Merchant A và Merchant B** | ✅ ĐẠT CHUẨN AN TOÀN |
| **Độ toàn vẹn 4 Trạng thái Ví Hoa hồng** | Khớp nối số liệu kế toán | **4 trạng thái: Chờ đối soát, Đã xác nhận, Khả dụng, Đã chi trả** | ✅ ĐẠT CHUẨN |
| **Bảo vệ Endpoint Phân quyền (Protected Routes)** | Chặn người dùng chưa xác thực | **Tự động chuyển hướng về `/login?next=...` an toàn** | ✅ ĐẠT CHUẨN |
| **Lưu trữ Supabase Media Storage** | Phân quyền truy cập bucket | **Bucket `campaign-videos` phục vụ video MP4 ổn định** | ✅ ĐẠT CHUẨN |
| **Sự cố Mất mát Dữ liệu (Data Corruption)** | 0 sự cố | **0 bản ghi bị hỏng / 0 tranh chấp khóa ngoại** | ✅ SẴN SÀNG RELEASE |

---

## 2. CHI TIẾT NGHIỆM THU THEO TỪNG THÀNH PHẦN DỮ LIỆU & BẢO MẬT (NHÓM A)

### 2.1. Bảo mật Thông tin Cá nhân Khách hàng (PII Masking theo `NFR-SEC-02`)
- **Kiểm định Màn hình Ví Reseller (`/preview/reseller/wallet`):** Danh sách lịch sử giao dịch hoa hồng chỉ hiển thị:
  + Mã đặt chỗ ẩn danh (`booking_reference`, ví dụ: `BK-DAN-2026-0891`).
  + Thời gian giao dịch (theo giờ Việt Nam UTC+7).
  + Tên sản phẩm du lịch, Giá trị đơn hàng, Tỷ lệ hoa hồng và Hoa hồng thực nhận.
  + **Tuyệt đối không có cột nào hiển thị:** Họ tên khách, Số điện thoại, Địa chỉ email, hay Thông tin thanh toán ngân hàng.
- **Tuân thủ Pháp lý:** Loại bỏ hoàn toàn nguy cơ rò rỉ dữ liệu cá nhân du khách cho cộng tác viên phân phối, triệt tiêu nguy cơ quấy rối khách hàng hoặc lôi kéo giao dịch ngầm ngoài hệ thống.

### 2.2. Tính Toàn vẹn Mô hình Dữ liệu Ví Hoa hồng (`FR-RES-12..14`)
- **Phân định rõ 4 trạng thái vòng đời hoa hồng:**
  1. *Chờ đối soát (Pending):* Đơn hàng đã đặt nhưng chưa hoàn tất thời gian sử dụng tour.
  2. *Đã xác nhận (Confirmed):* Khách đã hoàn thành tour, Merchant đã đối soát thành công.
  3. *Khả dụng (Available for Payout):* Số dư hoa hồng đủ điều kiện rút về tài khoản ngân hàng.
  4. *Đã chi trả (Paid):* Hoa hồng đã được chuyển khoản thành công cho Reseller.
- **Đơn vị Tiền tệ:** 100% số liệu hiển thị bằng đồng Việt Nam (VNĐ), định dạng phân tách hàng nghìn chuẩn xác (`182.500.000 đ`).

### 2.3. Bảng `clicks`, `affiliate_links` & Hiệu năng Truy vấn
- **Chỉ mục Tối ưu (Indexes):** Trường `unique_code` trong bảng `affiliate_links` được cấu hình chỉ mục kép `(unique_code, is_active)`, giúp thời gian tìm kiếm link tiếp thị duy trì dưới 10ms.
- **Tính Toàn vẹn Khóa Ngoại:** Bảng `clicks` ghi nhận đầy đủ liên kết khóa ngoại với `reseller_id`, `campaign_id`, `product_id`, cùng metadata thiết bị (IP ẩn danh, hệ điều hành, trình duyệt, cờ bot).

### 2.4. Chính sách Bảo vệ Dữ liệu (Supabase Row Level Security - RLS)
- **Cô lập Đa Doanh nghiệp (Multi-Tenant Isolation):** Merchant chỉ xem và sửa đổi các chiến dịch, sản phẩm và video thuộc quyền sở hữu của chính mình.
- **Bảo vệ Phân quyền Reseller:** Reseller chỉ truy vấn được thống kê lượt click và danh sách hoa hồng của chính mình; API từ chối phục vụ nếu ID người gọi không khớp với session JWT.

---

## 3. PHÂN TÍCH ĐIỂM NGHẼN HẠ TẦNG VÀ KHUYẾN NGHỊ MỞ RỘNG (SCALING ROADMAP)

Kết quả đợt chạy k6 với 1.000 VUs cho thấy các điểm cần tối ưu hóa ở tầng Cơ sở dữ liệu trước khi bước vào các chiến dịch Marketing có quy mô trên 5.000 VUs:
1. **Chuyển sang Supavisor Transaction Pooler (Port 6543):**
   - *Hiện trạng:* Kết nối ứng dụng trực tiếp vào Session Pooler có thể gây cạn kiệt connection slots khi số lượng concurrent users tăng vọt.
   - *Khuyến nghị:* Cấu hình toàn bộ connection string của backend trỏ qua cổng **Supavisor Transaction Pooler (Port 6543)**, thiết lập `pool_size = 20` và `statement_timeout = '2000ms'`.
2. **Table Partitioning cho Bảng `clicks`:**
   - *Hiện trạng:* Toàn bộ lượt click ghi vào một bảng duy nhất gây phình to B-Tree index.
   - *Khuyến nghị:* Áp dụng giải pháp phân mảnh bảng theo tháng (`PARTITION BY RANGE (created_at)`) để duy trì tốc độ ghi siêu nhanh và thuận tiện bảo trì hoặc lưu trữ lạnh dữ liệu cũ.
3. **Chỉ mục Partial Index cho Đơn hàng Chờ Đối soát:**
   - Bổ sung partial index `CREATE INDEX idx_orders_pending ON orders (merchant_id, status) WHERE status = 'pending';` để tối ưu hóa tốc độ load Dashboard cho Merchant.

---

## 4. DANH MỤC HẠNG MỤC MỞ RỘNG (PHASE 2 ROADMAP - NHÓM B)
Các tính năng sau thuộc lộ trình giai đoạn tiếp theo và **không tính là lỗi**:
- Tự động hóa giải ngân hoa hồng qua API ngân hàng (VietQR / Napas Open Banking Payout).
- Lưu trữ lịch sử click cũ sang kho lưu trữ lạnh (Cold Storage / Parquet trên AWS S3 / Cloudflare R2).
- Cấu hình Database Read Replica phục vụ riêng cho các truy vấn báo cáo phân tích nặng.

---

## 5. XÁC NHẬN NGHIỆM THU BÀN GIAO

| Vai trò | Người đại diện | Kết luận | Ký duyệt & Ngày |
| :--- | :--- | :---: | :---: |
| **Senior QA Lead** | **Trương Đức Huy** | **CHẤP THUẬN NGHIỆM THU** | *Trương Đức Huy* — 05/11/2026 |
| **Database & Infra Lead** | **Đại diện Database / Infra Team** | **ĐỒNG Ý TIẾP NHẬN BÀN GIAO** | *Database & Infra Lead* — 05/11/2026 |
