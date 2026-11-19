# BÁO CÁO KIỂM THỬ TÍNH TOÀN VẸN CƠ SỞ DỮ LIỆU & HOA HỒNG (DATABASE / SUPABASE DEV)

**Dự án:** AI Travel Reseller Network  
**Phân hệ:** Supabase PostgreSQL Schema, Indexes, Constraints & RPC Stored Procedures  
**Người thực hiện:** Trương Đức Huy (Senior QA Automation Engineer)  
**Ngày kiểm toán:** 19/11/2026  
**Trạng thái chung:** **ĐẠT TIÊU CHUẨN TOÀN VẸN DỮ LIỆU (PASS WITH RECOMMENDATIONS)**  

---

## 1. PHẠM VI KIỂM TOÁN TẦNG DATABASE (SCOPE DEFINITION)

### Nhóm A: Bảng & RPC Đã phát triển thực tế (Audited Scope)
1. **Bảng Đơn hàng `public.orders`:**
   - Trường lưu trữ: `amount`, `commission_rate`, `gross_commission`, `platform_fee`, `reseller_commission`, `booking_reference`, `status`, `flag_self_purchase`.
   - Ràng buộc: `chk_orders_status_valid` (`pending`, `confirmed`, `paid`, `cancelled`, `refunded`).
   - Unique Index: `uq_orders_merchant_booking_ref` trên `(merchant_id, booking_reference)`.
2. **Bảng Sổ cái Hoa hồng `public.commissions`:**
   - Trường lưu trữ: `order_id`, `reseller_id`, `merchant_id`, `campaign_id`, `gross_amount`, `platform_fee`, `net_amount`, `status`.
   - Ràng buộc: `chk_commissions_status`.
   - Unique Index: `uq_commissions_order_id` trên `(order_id)`.
3. **Stored Procedure RPC:**
   - `public.process_order_attribution(...)`: Phân bổ hoa hồng, chống trùng đơn và chống tự mua hàng.
   - `public.get_reseller_wallet_summary(p_reseller_id uuid)`: Tổng hợp số dư ví Reseller và che thông tin nhạy cảm (PII Masking).
   - `public.request_payout(...)`: Khóa số dư tức thời chống rút tiền kép (Anti Double-Spend).

### Nhóm B: Tính năng Database nâng cao chưa phát triển (Pending Scope)
- Hệ thống Partitioning theo thời gian (Monthly Tables Partitioning) cho bảng `clicks` và `orders` phục vụ lưu trữ dữ liệu quy mô hàng chục triệu bản ghi.
- Cơ chế Audit Logging tự động ghi chép toàn bộ lịch sử can thiệp thủ công (Administrative CDC Triggers).

---

## 2. KẾT QUẢ ĐỐI SOÁT DỮ LIỆU & CONSTRAINT AUDIT

| Mã Kiểm thử | Bảng / RPC Đối tượng | Kịch bản Thao tác | Hành vi Kỳ vọng | Hành vi Thực tế | Đánh giá |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **DB-IDEM-01** | `uq_orders_merchant_booking_ref` | Cố gắng chèn 2 đơn hàng có cùng `merchant_id` và `booking_reference`. | Database ném lỗi vi phạm Unique Constraint mã Postgres `23505`, chặn hoàn toàn việc ghi trùng đơn. | Ràng buộc duy nhất hoạt động chuẩn xác: chặn thành công bản ghi thứ hai, trả về lỗi mã `23505`. | **PASS** |
| **DB-IDEM-02** | `uq_commissions_order_id` | Chèn 2 bản ghi hoa hồng cho cùng một `order_id`. | Mỗi đơn hàng chỉ có duy nhất 1 dòng trong sổ cái `commissions` (Single Ledger Rule). | Database chặn hoàn toàn bản ghi thứ 2 có trùng `order_id`, không gây nhân đôi số dư ví. | **PASS** |
| **DB-STAT-01** | Trigger `trg_sync_order_status_to_commission` | Thay đổi trạng thái đơn hàng từ `confirmed` sang `cancelled` trong bảng `orders`. | Trạng thái của dòng hoa hồng tương ứng trong `commissions` tự động chuyển sang `cancelled`. | Trigger đồng bộ trạng thái ngay lập tức, loại trừ khoản hoa hồng này khỏi `available_balance` của Reseller. | **PASS** |
| **DB-MATH-01** | `commissions.net_amount` | Kiểm tra tính toán số dư số học: `gross_amount = platform_fee + net_amount`. | Không có sai số làm tròn số thực dấu phẩy động (Floating point rounding error), chênh lệch = 0 VND. | Cột sử dụng kiểu `NUMERIC` chuẩn tài chính, toàn bộ phép tính bảo toàn 100% từng đồng VND. | **PASS** |

---

## 3. KHUYẾN NGHỊ GIA CỐ CƠ SỞ DỮ LIỆU (RECOMMENDATIONS FOR DATABASE DEV)

> [!NOTE]
> Hệ thống Database đã có cấu trúc rất vững chắc với các Unique Indexes chống trùng và Trigger đồng bộ trạng thái. Dưới đây là các khuyến nghị hoàn thiện thêm trước khi go-live:

### Khuyến nghị 1: Bổ sung Ràng buộc Check Constraint Toán học trên Bảng `commissions`
- **Đề xuất:** Thêm một Check Constraint để bảo vệ mức cơ sở dữ liệu:
  ```sql
  ALTER TABLE public.commissions
    ADD CONSTRAINT chk_commissions_math_integrity
    CHECK (gross_amount = platform_fee + net_amount);
  ```
  Ràng buộc này ngăn ngừa bất kỳ bug code nào ở tầng ứng dụng vô tình ghi lệch dù chỉ 1 đồng giữa hoa hồng gộp, phí sàn và hoa hồng thực nhận.

### Khuyến nghị 2: Tăng cường Atomic Lock trên Bảng `payout_requests`
- **Đề xuất:** Đảm bảo hàm `request_payout` luôn sử dụng lệnh:
  ```sql
  PERFORM pg_advisory_xact_lock(hashtext(p_reseller_id::text));
  ```
  Nhằm tuần tự hóa (serialize) các yêu cầu rút tiền liên tiếp của cùng một Reseller trong thời gian mili-giây, ngăn ngừa hoàn toàn khả năng rút vượt số dư khả dụng khi có tấn công mạng song song.

---

## 4. KẾT LUẬN TỔNG THỂ DÀNH CHO DATABASE TEAM
- **Mức độ toàn vẹn dữ liệu:** **100% ĐẠT CHUẨN**.
- **Tính khả thi vận hành:** Đã sẵn sàng phục vụ quy mô chiến dịch bán hàng lớn.
