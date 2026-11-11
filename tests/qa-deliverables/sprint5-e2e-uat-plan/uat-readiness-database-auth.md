# BÁO CÁO RÀ SOÁT ĐỘ SẴN SÀNG UAT & TỔNG HỢP LỖI DATABASE / AUTH / STORAGE (UAT READINESS — DB, AUTH & STORAGE)

**Dự án:** AI Travel Reseller Network (TravelLink AI)  
**Phân hệ phụ trách:** Database, Authentication & Cloud Storage Engineering (Supabase Postgres, Row Level Security, Auth Session SSR, Storage Buckets)  
**Mục tiêu rà soát:** Chuẩn bị điều kiện nghiệm thu UAT & E2E Tuần 5 (Sprint 5)  
**Người thực hiện:** Senior QA Lead / QA Automation Engineer (Trương Đức Huy)  
**Ngày lập:** 29/10/2026  
**Nguyên tắc đánh giá:** Progress-Aware Testing — Chỉ ghi nhận lỗi trên các tính năng đã code (Nhóm A); không báo bug cho các tính năng thuộc backlog (Nhóm B).  

---

## 1. TỔNG HỢP MỨC ĐỘ SẴN SÀNG DATABASE, AUTH & STORAGE (DB READINESS OVERVIEW)

Đội ngũ phụ trách Database và Hạ tầng (BE1) đã thiết kế schema cơ sở dữ liệu quan hệ hoàn chỉnh trên PostgreSQL (Supabase) cùng hệ thống chính sách bảo mật tầng dòng (RLS). Các bảng dữ liệu trọng yếu cho phiên UAT Tuần 5 đều đã sẵn sàng:

| Bảng dữ liệu / Thành phần | Chức năng nghiệp vụ trong E2E | Trạng thái Codebase | Đánh giá Sẵn sàng UAT Tuần 5 |
| :--- | :--- | :---: | :---: |
| **`merchants` & `resellers`** | Quản lý hồ sơ đối tác và cộng tác viên | **Nhóm A (Đã phát triển)** | ✅ **SẴN SÀNG 100%** |
| **`campaigns` & `products`** | Lưu trữ thông tin tour, giá niêm yết, hoa hồng | **Nhóm A (Đã phát triển)** | ✅ **SẴN SÀNG 100%** |
| **`affiliate_links`** | Quản lý mã `unique_code`, destination URL | **Nhóm A (Đã phát triển)** | ✅ **SẴN SÀNG 100%** |
| **`clicks`** | Lưu trữ lịch sử click, IP, UA, bot detection | **Nhóm A (Đã phát triển)** | ✅ **SẴN SÀNG 100%** |
| **`commissions`** | Quản lý 4 trạng thái hoa hồng (`pending` -> `paid`) | **Nhóm A (Đã phát triển)** | ✅ **SẴN SÀNG 100%** |
| **`media_references`** | Quản lý metadata video mẫu và cờ bản quyền | **Nhóm A (Đã phát triển)** | ✅ **SẴN SÀNG 100%** |
| **Supabase Storage Buckets** | Lưu trữ video dọc 9:16 và ảnh tĩnh truyền thông | **Nhóm A (Đã phát triển)** | ✅ **SẴN SÀNG 100%** |
| **Row Level Security (RLS)** | Bảo vệ dữ liệu CTV chỉ xem đơn hàng của mình | **Nhóm A (Đã phát triển)** | ✅ **SẴN SÀNG 100%** |
| **Auth Session SSR Cookies** | Duy trì đăng nhập ổn định trên trình duyệt & PWA | **Nhóm A (Đã phát triển)** | ✅ **SẴN SÀNG 100%** |
| **Database Trigger Tự động Payout** | Tự động sinh batch thanh toán hoa hồng hàng tuần | **Nhóm B (Chờ ghép nối)** | ⏳ **CHỜ DEV HOÀN THIỆN** |

---

## 2. GHI NHẬN LỖI TỒN ĐỌNG & KHUYẾN NGHỊ TỐI ƯU CƠ SỞ DỮ LIỆU (CHỈ DÀNH CHO NHÓM A)

### 📌 ĐÁNH GIÁ CHẤT LƯỢNG TỔNG QUAN:
- **Lỗi nghiêm trọng (Critical / Blocker):** **0 LỖI**. Không có lỗi rò rỉ dữ liệu chéo giữa các tài khoản (No cross-tenant data leakage) và chính sách RLS hoạt động an toàn.
- **Quan sát kỹ thuật & Khuyến nghị tối ưu (Database Indexing / Security):** 02 điểm khuyến nghị cần lưu ý.

---

### ISSUE-DB-UAT-01 (Mức độ: Medium — Tối ưu hóa Index Bảng `clicks`)
- **Tiêu đề:** Bổ sung Composite Index cho bảng `clicks` để tăng tốc độ truy vấn kiểm tra Rate Limiting và thống kê.
- **Vị trí cơ sở dữ liệu:** Bảng `clicks` (`supabase/migrations/`).
- **Mô tả hiện tượng:** Hàm kiểm tra click tặc (`checkClickRateLimit`) thực hiện đếm số lượt click từ cùng một địa chỉ IP trên một liên kết trong cửa sổ 60 giây gần nhất (`created_at >= NOW() - INTERVAL '1 minute'`). Khi số lượng click tăng cao trong ngày demo/UAT, câu truy vấn đếm có thể bị chậm nếu bảng chưa có index kết hợp trên `(ip_address, link_id, created_at)`.
- **Đề xuất cho Database Dev (BE1):**
  ```sql
  CREATE INDEX IF NOT EXISTS idx_clicks_rate_limit ON clicks (ip_address, link_id, created_at DESC);
  ```

---

### ISSUE-DB-UAT-02 (Mức độ: Low — Rà soát RLS Policy trên Bảng `commissions`)
- **Tiêu đề:** Đảm bảo chính sách RLS ngăn chặn hoàn toàn việc Reseller đọc trực tiếp cột `customer_phone` hoặc `customer_name` chưa qua hàm che giấu (masking).
- **Vị trí cơ sở dữ liệu:** Policy `select_reseller_commissions` trên bảng `commissions`.
- **Mô tả hiện tượng:** Trên giao diện Frontend, dữ liệu PII đã được che dạng `090****123`. Tuy nhiên, để đảm bảo an toàn tuyệt đối theo tiêu chuẩn `NFR-SEC-02`, tầng cơ sở dữ liệu nên cung cấp một Postgres View (ví dụ `view_reseller_commissions`) chỉ trả về thông tin đã mask sẵn, tránh trường hợp người dùng rành kỹ thuật mở DevTools Network xem payload thô.
- **Đề xuất cho Database Dev:** Tạo Database View với hàm che PII tích hợp sẵn và cấp quyền SELECT trên View này cho vai trò `authenticated`.

---

## 3. GHI CHÚ TIẾN ĐỘ TÍNH NĂNG CHƯA HOÀN THIỆN (NHÓM B — KHÔNG TÍNH VÀO BUG)

Căn cứ theo kế hoạch Sprint 5, các tính năng sau đang được chuẩn bị và không tính vào lỗi sản phẩm:
1. *Cơ chế Xác thực 2 bước (2FA / OTP SMS):* Dự kiến nâng cấp ở giai đoạn thương mại hóa v2.0.
2. *Lưu trữ phân tán CDN toàn cầu cho Video MP4:* Hiện tại video lưu trữ trực tiếp trên Supabase Storage bucket tiêu chuẩn.
3. *Cronjob tự động chốt sổ hoa hồng định kỳ (pg_cron):* Đang được cấu hình trên môi trường staging trước khi kích hoạt trên production.
