# BÁO CÁO GHI NHẬN LỖI & ĐỀ XUẤT TỐI ƯU HÓA CƠ SỞ DỮ LIỆU & PHÂN QUYỀN (AUTH)
## PHÂN HỆ: ATTRIBUTION STORAGE, COMMISSIONS & ROW LEVEL SECURITY (DÀNH CHO DATABASE / AUTH DEV)

- **Dự án:** AI Travel Reseller Network (TravelLink)
- **QA Automation Engineer:** Senior QA Lead
- **Phạm vi kiểm thử:** Bảng dữ liệu `affiliate_links`, `clicks`, `orders`, `commissions`, `wallets`, cơ chế Row Level Security (RLS) và chính sách phân bổ hoa hồng đa cấp.
- **Ngày ghi nhận:** 19/11/2026

---

### BẢNG TỔNG QUAN PHÂN LOẠI LỖI DATABASE / AUTH

| Mã Bug | Tên lỗi / Vấn đề phát hiện | Vị trí bảng / migration | Mức độ nghiêm trọng | Trạng thái |
| :---: | :--- | :--- | :---: | :---: |
| `BUG-DB-CHK-01` | Thiếu Index phối hợp trên bảng `clicks` cho việc truy vấn báo cáo chiến dịch | Bảng `clicks` (`metadata->campaign_id`) | **Medium / Performance** | Đề xuất tối ưu |
| `BUG-DB-CHK-02` | RLS Policy trên bảng `orders` cần đảm bảo khách hàng vãng lai không xem được đơn của người khác | Bảng `orders` & RLS Policies | **Low / Security Hardening** | Đề xuất tối ưu |
| `BUG-DB-CHK-03` | Ràng buộc khóa ngoại mềm (Nullable FK) khi ghi nhận hoa hồng đơn hàng Storefront | Bảng `commissions` (`order_id`, `reseller_id`) | **Low / Data Integrity** | Đề xuất tối ưu |

---

### CHI TIẾT CÁC VẤN ĐỀ GHI NHẬN:

#### 1. BUG-DB-CHK-01: Thiếu Composite Index trên bảng `clicks` phục vụ tổng hợp dữ liệu thời gian thực
- **Vị trí phát hiện:** Cơ sở dữ liệu Supabase - Bảng `clicks`
- **Mức độ:** **Medium / Performance**
- **Mô tả chi tiết:**
  Khi người dùng click vào shortlink, router chèn một bản ghi vào bảng `clicks` với các trường `link_id, ip_address, is_bot, is_valid, created_at`. Màn hình Reseller Analytics thường xuyên truy vấn tổng số click hợp lệ theo `link_id` trong khoảng thời gian `created_at`. Nếu không có composite index `(link_id, is_valid, created_at DESC)`, các truy vấn lọc click sẽ phải thực hiện Bitmap Index Scan hoặc Seq Scan khi bảng `clicks` đạt hàng triệu dòng.
- **Giải pháp đề xuất:**
  Thêm migration index:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_clicks_link_valid_created 
  ON public.clicks (link_id, is_valid, created_at DESC);
  ```

---

#### 2. BUG-DB-CHK-02: RLS Policy trên bảng `orders` bảo vệ đơn hàng của khách hàng vãng lai (Guest Checkout)
- **Vị trí phát hiện:** Supabase RLS Policies cho bảng `orders`
- **Mức độ:** **Low / Security Hardening**
- **Mô tả chi tiết:**
  Khách hàng mua vé qua link tiếp thị Reseller là khách vãng lai (Guest) không bắt buộc đăng nhập (No-auth Guest Checkout). Khi API `/api/storefront/orders/confirm` ghi nhận đơn hàng bằng service role (admin client), đơn được lưu thành công. Tuy nhiên, nếu phía client gọi trực tiếp Supabase client để tra cứu lại thông tin đơn hàng theo `order_id` mà không có token bí mật hoặc phone verification, cần đảm bảo RLS không mở public `SELECT` trên toàn bộ bảng `orders`.
- **Giải pháp đề xuất:** Chỉ cho phép đọc chi tiết đơn nếu có kèm `ticket_code` hoặc `phone_number` khớp với bản ghi, hoặc chỉ tra cứu qua Secure Backend API endpoint.

---

#### 3. BUG-DB-CHK-03: Tính toàn vẹn dữ liệu ví Reseller khi có hoàn hủy (Refund / Cancellation)
- **Vị trí phát hiện:** Bảng `wallets` và `commissions`
- **Mức độ:** **Low / Data Integrity**
- **Mô tả:** Trạng thái hoa hồng ban đầu được gán `confirmed` hoặc `pending`. Cần đảm bảo có Trigger hoặc hàm RPC khóa số dư (Holding Period) tối thiểu 24h-48h sau khi tour hoàn tất trước khi cộng vào `available_balance` để tránh rủi ro khách hàng hủy tour nhưng Reseller đã rút tiền hoa hồng trước đó.
- **Giải pháp đề xuất:** Bổ sung trường `matured_at` trong bảng `commissions` và scheduled job tự động chuyển từ `pending` sang `available`.

---

### GHI CHÚ TIẾN ĐỘ (OUT OF CURRENT IMPLEMENTATION - KHÔNG TÍNH BUG):
- Hệ thống phân bổ hoa hồng đa cấp n tầng (Multi-tier affiliate) chưa triển khai trong Sprint này. Hệ thống hiện tập trung tuyệt đối vào mô hình 1 cấp trực tiếp (Direct Single-tier Attribution 12% - 15%) với chính sách chia sẻ minh bạch và bảo đảm pháp lý.
