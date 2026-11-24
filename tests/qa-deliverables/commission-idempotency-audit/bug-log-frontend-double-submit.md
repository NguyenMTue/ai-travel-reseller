# BÁO CÁO KIỂM THỬ GIAO DIỆN CHỐNG BẤM ĐÚP (FRONTEND DEV)

**Dự án:** AI Travel Reseller Network  
**Phân hệ:** Storefront Checkout Modal, Chat Checkout & Reseller Wallet UI  
**Người thực hiện:** Trương Đức Huy (Senior QA Automation Engineer)  
**Ngày kiểm toán:** 19/11/2026  
**Trạng thái chung:** **ĐẠT TIÊU CHUẨN TRẢI NGHIỆM & AN TOÀN UI (PASS WITH RECOMMENDATIONS)**  

---

## 1. PHẠM VI KIỂM TOÁN TẦNG FRONTEND (SCOPE DEFINITION)

### Nhóm A: Màn hình & Form Đã phát triển thực tế (Audited Scope)
1. **Modal Đặt vé Storefront (`StorefrontCheckoutModal`):**
   - Step 1: Chọn gói vé, chọn ngày tham quan, số lượng vé, nhập thông tin liên hệ và tính giảm giá đối tác.
   - Step 2: Quét mã VietQR thanh toán tự động, nút xác nhận *"TÔI ĐÃ CHUYỂN KHOẢN • XUẤT VÉ"*.
   - Step 3: Hiển thị Thẻ vé điện tử chính hãng (E-Ticket QR) và mã vé `ET-***`.
2. **Khung Trò chuyện Chat Checkout (`CheckoutCard`):**
   - Trợ lý AI đưa ra liên kết đặt chỗ trực tiếp với doanh nghiệp đối tác, nút *"Đặt vé ngay ↗"*.
3. **Màn hình Ví Reseller (`WalletDashboard` & `PayoutModal`):**
   - Hiển thị 3 khối số dư, danh sách giao dịch có che PII, modal rút tiền hoa hồng.

### Nhóm B: Tính năng Giao diện chưa phát triển (Pending Scope)
- Giao diện quét mã QR trực tiếp từ Camera điện thoại để check-in tại cổng soát vé (Turnstile Mobile Scanner UI).
- Hoạt ảnh 3D chúc mừng khi thanh toán thành công (Lottie Animation).

---

## 2. KẾT QUẢ KIỂM THỬ THỰC TẾ TRÊN CÁC FORM NHÓM A

| Mã Kiểm thử | Component / Màn hình | Kịch bản Thao tác | Hành vi Kỳ vọng | Hành vi Thực tế | Đánh giá |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **FE-IDEM-01** | `StorefrontCheckoutModal` | Bấm chuột liên tiếp 3 lần cực nhanh (`clickCount: 3, delay: 0`) vào nút *"TÔI ĐÃ CHUYỂN KHOẢN • XUẤT VÉ"*. | Nút chuyển sang trạng thái `disabled` và `loading` ngay lập tức; chỉ gửi duy nhất 1 request mạng tới API. | Nút chuyển ngay sang trạng thái disabled (`isConfirming=true`), hiển thị spinner xoay tròn và text `"ĐANG XÁC NHẬN & CỘNG VÍ..."`. Chỉ có đúng 1 request POST gửi đi. | **PASS** |
| **FE-IDEM-02** | `CheckoutCard` (Chat) | Click nhiều lần liên tiếp vào liên kết *"Đặt vé ngay ↗"*. | Chặn việc mở nhiều tab trùng lặp liên tiếp, hiển thị thông báo trạng thái. | Ref `busy.current` kích hoạt ngay lập tức, nút hiển thị `"Đang mở trang đặt vé…"`, sau 1.5s mới khôi phục lại trạng thái bình thường. | **PASS** |
| **FE-FMT-01** | `WalletDashboard` | Kiểm tra định dạng hiển thị tiền tệ Việt Nam. | Tiền tệ hiển thị chuẩn định dạng VND với dấu chấm phân cách hàng nghìn (vd: `1.800.000 ₫`). | Số dư hiển thị chuẩn xác: `4.269.000 ₫`, `1.269.000 ₫`, `216.000 ₫`. | **PASS** |
| **FE-PII-01** | `WalletDashboard` | Kiểm tra tính năng che giấu dữ liệu nhạy cảm (PII Data Masking). | Tên khách và số điện thoại phải được che giấu (`K***h`, `090****123`). | Toàn bộ thông tin khách hàng nhạy cảm được che giấu hoàn hảo, không để lộ thông tin riêng tư của du khách. | **PASS** |

---

## 3. KHUYẾN NGHỊ NÂNG CAO TRẢI NGHIỆM NGƯỜI DÙNG (RECOMMENDATIONS FOR FRONTEND DEV)

> [!NOTE]
> Frontend đã làm rất tốt việc kiểm soát trạng thái bấm nút (`disabled` và `isConfirming` state). Một số điểm có thể tối ưu thêm để đạt trải nghiệm mượt mà hơn:

### Khuyến nghị 1: Bổ sung Cơ chế Debounce / Throttle Mức Utility
- **Hiện trạng:** Việc chống bấm đúp đang được quản lý cục bộ qua state `isConfirming` và `busy.current`.
- **Đề xuất:** Tạo một custom hook reusable `useSingleAction` hoặc wrap handler qua hàm `debounce(fn, 1000, { leading: true, trailing: false })` để áp dụng đồng bộ trên tất cả các nút bấm thanh toán hoặc tạo chiến dịch trong toàn bộ dự án.

### Khuyến nghị 2: Xử lý Tình huống Timeout Mạng (Network Timeout Fallback)
- **Hiện trạng:** Nếu mạng người dùng chập chờn hoặc request kéo dài quá lâu, nút có thể ở trạng thái loading liên tục.
- **Đề xuất:** Thiết lập timeout 15 giây cho request fetch. Nếu sau 15 giây không có phản hồi, hiển thị thông báo: *"Hệ thống đang xử lý đơn hàng của bạn. Vui lòng kiểm tra SMS hoặc lịch sử đơn hàng trước khi thử lại."* kèm nút *"Thử lại"* được mở khóa an toàn.

---

## 4. KẾT LUẬN TỔNG THỂ DÀNH CHO FRONTEND TEAM
- **Mức độ bảo vệ chống bấm đúp UI:** **HOÀN HẢO (100% PASS)**.
- **Trải nghiệm người dùng:** Mượt mà, trực quan, có phản hồi thị giác (visual feedback) rõ ràng.
