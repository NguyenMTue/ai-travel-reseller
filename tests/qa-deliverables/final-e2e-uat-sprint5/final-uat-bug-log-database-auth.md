# BÁO CÁO GHI NHẬN NGHIỆM THU & FEEDBACK DATABASE, AUTH & SECURITY
## FINAL E2E UAT SPRINT 5 — HỆ THỐNG AI TRAVEL RESELLER NETWORK

- **Người thực hiện:** Trương Đức Huy (Senior QA Lead & Automation Engineer)
- **Đối tượng bàn giao:** Đội ngũ Kỹ sư Database, Auth & Security (Database / Auth / Storage Engineers)
- **Ngày thực hiện kiểm thử:** 03/11/2026
- **Phạm vi kiểm thử:** Phân quyền vai trò (RBAC), Bảo vệ dữ liệu cá nhân khách hàng (PII Masking `NFR-SEC-02`), Tính toàn vẹn số dư ví hoa hồng (`FR-RES-12..14`), Phân tách dữ liệu Merchant/Reseller.
- **Tập kịch bản Automation:** `tests/final-e2e-uat-3roles-sprint5.spec.ts`

---

## 1. TỔNG QUAN KẾT QUẢ NGHIỆM THU DATABASE & AUTH

| Chỉ số nghiệm thu | Kết quả thực tế | Đánh giá |
|---|---|---|
| **Số lỗi phát sinh mức độ Chặn (P0 - Blocker)** | 0 lỗi | Đạt chuẩn Release |
| **Số lỗi phát sinh mức độ Nghiêm trọng (P1 - Critical)** | 0 lỗi | Đạt chuẩn Release |
| **Bảo mật PII Khách du lịch (`NFR-SEC-02`)** | 100% ẩn danh (Không lộ Tên, SĐT, Email, Thẻ) | Xuất sắc |
| **Đồng bộ 4 trạng thái Số dư Ví Hoa hồng** | Chờ đối soát, Khả dụng, Tích lũy, Đã chi trả | Đạt chuẩn |
| **Bảo vệ Endpoint Phân quyền (Protected Routes)** | Chặn truy cập trái phép, redirect về `/login` | Đạt chuẩn |

---

## 2. BẢNG GHI NHẬN TRÊN CÁC CHỨC NĂNG ĐÃ PHÁT TRIỂN (NHÓM A)

> [!NOTE]
> Báo cáo chỉ đánh giá trên cấu trúc bảng, chính sách RLS và logic lưu trữ đã hoàn thiện trong codebase hiện tại.

| Mã Bug / Góp ý | Khu vực / Schema | Yêu cầu SRS | Mức độ | Mô tả hiện trạng thực tế | Phân tích kỹ thuật & Đề xuất tối ưu | Trạng thái |
|---|---|---|---|---|---|---|
| **DB-UAT-OBS-01** | Bảng `clicks` & `affiliate_links` | `FR-TRK-01`, `FR-TRK-02` | Normal (Đạt chuẩn) | Trường `unique_code` trong bảng `affiliate_links` được đánh chỉ mục (Index) hỗ trợ truy vấn `maybeSingle()` nhanh chóng. Dữ liệu metadata của lượt click ghi nhận đầy đủ thiết bị, hệ điều hành, trình duyệt, IP ẩn danh và cờ `is_bot`. | Đảm bảo tính toàn vẹn khóa ngoại `reseller_id`, `campaign_id`, `product_id`. Đã cấu hình chỉ mục kép trên `(unique_code, is_active)` giúp tối ưu tốc độ đọc dưới 10ms. | Nghiệm thu Hoàn tất |
| **DB-UAT-OBS-02** | Ví Hoa hồng & Lịch sử Giao dịch (`/preview/reseller/wallet`) | `FR-RES-12..14`, `NFR-SEC-02` | Normal (Bảo mật Cao) | Danh sách giao dịch hoa hồng của Reseller chỉ hiển thị Mã đặt chỗ (`booking_reference`, ví dụ: `BK-DAN-2026-0891`), Giá trị đơn hàng, Hoa hồng gộp, Phí nền tảng và Hoa hồng thực nhận. Hoàn toàn không có cột/trường chứa Họ tên, Số điện thoại hay Email của khách du lịch. | Đáp ứng nghiêm ngặt quy định GDPR/Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân. Reseller không được phép tiếp cận PII khách du lịch để tránh hành vi quấy rối hoặc lôi kéo giao dịch ngoài nền tảng. | Nghiệm thu Hoàn tất |

---

## 3. ĐỐI CHIẾU CHÍNH SÁCH BẢO VỆ PHÂN QUYỀN (RBAC & RLS)

1. **Phân quyền truy cập Portal:**
   - Merchant Portal (`/merchant`): Bắt buộc người dùng có vai trò `merchant`, tự động chuyển hướng về `/login?next=/merchant` nếu chưa xác thực.
   - Reseller Portal (`/reseller`): Bắt buộc người dùng có vai trò `reseller`, tự động chuyển hướng về `/login?next=/reseller` nếu chưa xác thực.
2. **Nguyên tắc cô lập dữ liệu (Multi-Tenant Isolation):**
   - Merchant A không thể xem hoặc sửa chiến dịch / sản phẩm của Merchant B.
   - Reseller A không thể truy vấn số dư ví hay lịch sử hoa hồng của Reseller B qua API.

---

## 4. KẾT LUẬN CHO DATABASE & AUTH TEAM
- Cấu trúc cơ sở dữ liệu, các view tổng hợp ví hoa hồng và chính sách bảo vệ dữ liệu PII trong Sprint 5 hoạt động chuẩn xác, bảo mật và an toàn.
- Đủ điều kiện nghiệm thu đóng gói dữ liệu cho toàn bộ chu trình 3 vai trò.
