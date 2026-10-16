# TÀI LIỆU TEST CASES & KẾT QUẢ THỬ NGHIỆM THỰC TẾ
## TÍNH NĂNG: COPY 1-CLICK CLIPBOARD & MODAL TRACKING
**Dự án:** AI Travel Reseller Network  
**Tài liệu đối chiếu:** SRS v1.1 & BRD v1.0  
**Người thực hiện:** Senior QA Automation Engineer  
**Bộ kịch bản kiểm thử tự động:** `tests/clipboard-modal-tracking.spec.ts`  
**Ngày thực hiện:** 16/10/2026  
**Môi trường thử nghiệm:** Headless Chrome, Next.js Dev Server (Port 3101), Cấp quyền Clipboard Browser Context (`clipboard-read`, `clipboard-write`)  

---

### 1. TỔNG KẾT KẾT QUẢ THỬ NGHIỆM

| Tiêu chí | Số lượng | Tỷ lệ (%) | Đánh giá chung |
| :--- | :---: | :---: | :--- |
| **Tổng số Test Cases** | **10** | **100%** | Bao phủ đầy đủ luồng mở/đóng Modal, định dạng link, voucher code, copy 1-click clipboard, UI feedback, đính kèm link vào caption/canned responses, và ghi nhận sự kiện sao chép. |
| **Pass (Đạt)** | **4** | **40%** | Luồng Modal cơ bản và Copy link tiếp thị hoạt động tốt, đọc được từ Clipboard thực tế, có UI feedback. |
| **Fail (Không đạt)** | **6** | **60%** | Thiếu mã Voucher riêng, thiếu nút copy voucher, nút Copy Caption không tự nối link tiếp thị, thiếu API ghi nhận tracking event sao chép, thiếu tính năng Canned Responses. |

---

### 2. MA TRẬN TEST CASES & KẾT QUẢ CHI TIẾT (TRACEABILITY MATRIX)

| TC ID | Mã SRS | Tên kịch bản kiểm thử | Tiền điều kiện | Các bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Trạng thái | Mã Bug liên quan |
| :---: | :---: | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-CLIP-01** | `FR-RES-06` | Mở & Đóng Modal Tracking trong <= 3 thao tác | Cấp quyền `clipboard-read`, `clipboard-write` | 1. Vào chi tiết chiến dịch<br>2. Bấm "Tạo link"<br>3. Đóng qua Esc, nút `×`, nút "Đóng" | Modal mở thành công trong 2 thao tác; đóng mượt qua Esc, nút Close và nút Đóng | Modal mở/đóng đúng kỳ vọng, bẫy focus bàn phím tốt | **PASS** | — |
| **TC-CLIP-02** | `FR-TRK-01` | Kiểm tra định dạng Tracking Link riêng | Modal Tracking đang mở | 1. Bấm "Tạo link tiếp thị"<br>2. Quan sát ô chứa link tiếp thị | Link hiển thị đúng cấu trúc `<domain>/r/<tracking_id>`, `tracking_id` duy nhất | Link trả về dạng `.../r/TESTlink` khớp định dạng `/r/<id>` | **PASS** | — |
| **TC-CLIP-03** | `FR-ATT-01` | Modal hiển thị đúng Mã Voucher riêng biệt | Modal Tracking đang mở | 1. Bấm "Tạo link tiếp thị"<br>2. Quan sát thông tin mã voucher | Modal bắt buộc hiển thị Mã Voucher riêng duy nhất của Reseller | Modal hoàn toàn không có trường hoặc văn bản hiển thị Mã Voucher | **FAIL** | `BUG-FE-CLIP-01`<br>`BUG-BE-CLIP-01` |
| **TC-CLIP-04** | `FR-RES-06`<br>`FR-TRK-01` | Copy 1-Click Tracking Link vào Clipboard | Đã tạo xong link trên Modal | 1. Bấm nút "Copy link"<br>2. Đọc `navigator.clipboard.readText()` | Dữ liệu trong Clipboard khớp 100% với Tracking Link trên Modal | `navigator.clipboard.readText()` nhận đúng `https://tracking.example.invalid/r/TESTlink` | **PASS** | — |
| **TC-CLIP-05** | `FR-ATT-01` | Copy 1-Click Mã Voucher riêng vào Clipboard | Đã tạo xong link/voucher trên Modal | 1. Bấm nút "Copy Mã Voucher"<br>2. Đọc `navigator.clipboard.readText()` | Dữ liệu trong Clipboard khớp 100% với Mã Voucher hiển thị | Không có nút Copy Mã Voucher trên giao diện | **FAIL** | `BUG-FE-CLIP-02`<br>`BUG-BE-CLIP-01` |
| **TC-CLIP-06** | `FR-RES-06` | Phản hồi giao diện (UI Feedback) khi bấm Copy | Đã tạo xong link trên Modal | 1. Bấm nút "Copy link"<br>2. Quan sát phản hồi UI trên Modal | Nút đổi trạng thái hoặc hiển thị text/toast "Đã sao chép link." | Hiển thị thông báo trạng thái `Đã sao chép link.` ngay sau khi bấm | **PASS** | — |
| **TC-CLIP-07** | `FR-RES-08` | Copy 1-Click Caption / CTA tự động đính kèm Tracking Link | Đã tạo Tracking Link cho chiến dịch | 1. Bấm nút "Copy Caption"<br>2. Đọc `navigator.clipboard.readText()` | Nội dung trong Clipboard bắt buộc phải đính kèm sẵn Tracking Link riêng của Reseller | Clipboard chỉ chứa caption thô, không được tự động đính kèm link tiếp thị | **FAIL** | `BUG-FE-CLIP-03` |
| **TC-CLIP-08** | `FR-RES-08` | Ghi nhận sự kiện "đã sao chép" (Copied Event Tracking) | Thư viện Content Kit đang hiển thị | 1. Lắng nghe network requests<br>2. Bấm nút "Copy Hook" hoặc "Copy Caption" | Hệ thống gửi API request ghi nhận sự kiện `copied` vào bảng `tracking_events` | Không có bất kỳ HTTP request nào được kích hoạt khi bấm nút Copy | **FAIL** | `BUG-FE-CLIP-04`<br>`BUG-BE-CLIP-02` |
| **TC-CLIP-09** | `FR-RES-09` | Hiển thị bộ Câu trả lời soạn sẵn (Canned Responses) | Đang ở trang chi tiết chiến dịch | 1. Cuộn đến khu vực câu trả lời soạn sẵn<br>2. Kiểm tra các câu trả lời về giá, địa điểm, cách đặt | Hiển thị đầy đủ bộ câu trả lời mẫu cho 3 thắc mắc thường gặp (giá, địa điểm, cách đặt vé) | Giao diện hoàn toàn không có khối Bộ câu trả lời soạn sẵn | **FAIL** | `BUG-FE-CLIP-05` |
| **TC-CLIP-10** | `FR-RES-09` | Copy 1-Click Canned Response đính kèm sẵn Tracking Link | Đang ở trang chi tiết chiến dịch | 1. Bấm nút Copy câu trả lời mẫu<br>2. Đọc `navigator.clipboard.readText()` | Nội dung Clipboard chứa đúng câu trả lời mẫu và kèm sẵn Tracking Link riêng | Thiếu hoàn toàn nút Copy và khối câu trả lời soạn sẵn | **FAIL** | `BUG-FE-CLIP-05` |
