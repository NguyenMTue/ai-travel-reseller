# BÁO CÁO THEO DÕI LỖI (BUG LOG) - DÀNH CHO FRONTEND DEVELOPER
## Chức năng: Thư viện Media & Luồng tải Video mẫu của Merchant (Merchant Media Library)
**Dự án:** AI Travel Reseller Network  
**Vai trò:** Senior QA Automation Engineer  
**Đối tượng bàn giao:** Frontend Lead (Diệu) & Tester 3 (FE phụ)  
**Ngày báo cáo:** 22/10/2026  
**Môi trường kiểm thử:** Next.js 16.3.8 (Turbopack) / Chromium 1440×1000  

---

## 1. TỔNG QUAN TRẠNG THÁI KIỂM THỬ (TEST SUMMARY)

- **Tổng số lỗi phát hiện (Open Bugs):** **0 Lỗi (0 Open Bugs)** trên các chức năng đã triển khai ở tiến độ hiện tại.
- **Đánh giá chất lượng giao diện hiện có:** **ỔN ĐỊNH (PASS)**
  - Giao diện Merchant Dashboard hiện hữu (`/merchant`, `/preview/merchant`, `src/components/merchant/dashboard.tsx`) tải nhanh, bố cục sắc nét, điều hướng mượt mà, chuyển đổi các trạng thái xem (sample, empty, loading, error) chính xác, không gây crash UI hay vỡ layout.
  - Phân hệ Thư viện Media & Form Upload Video mẫu: Chưa được Frontend Dev xây dựng trên giao diện người dùng. Theo đúng nguyên tắc kiểm thử đồng bộ tiến độ (Progress-Aware Testing), QA **không ghi nhận đây là Bug** mà tổng hợp thành danh mục bàn giao kỹ thuật bên dưới.

---

## 2. BẢNG CHI TIẾT TÌNH TRẠNG BUG TRÊN CODE ĐÃ PHÁT TRIỂN (NHÓM A)

| Bug ID | Vị trí phụ trách | Mã SRS | Test Case liên quan | Mức độ nghiêm trọng | File source code nguyên nhân (Read-only) | Kết quả kiểm tra thực tế | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| — | Frontend Dev | `FR-CNT-08`<br>`FR-CNT-09` | `TC-MED-01` | — | `src/components/merchant/dashboard.tsx` | Không phát hiện lỗi (0 Open Bugs) trên các chức năng đã triển khai ở tiến độ hiện tại. Mọi thành phần render đúng thiết kế. | **CLEAN PASS** |

---

## 3. CHECKLIST BÀN GIAO & KHUYẾN NGHỊ KỸ THUẬT CHO FRONTEND DEV (SPRINT TIẾP THEO)

Nhằm giúp Frontend team nhanh chóng hoàn thiện tính năng Media Library theo đúng chuẩn Backend API đã sẵn sàng (`BE1-W3-03`), QA đề xuất checklist triển khai như sau:

1. **Tích hợp Tab điều hướng "Thư viện Media" trên Sidebar Merchant Portal:**
   - *Vị trí cần thêm:* `src/components/merchant/dashboard.tsx` (dòng 62-88).
   - *Yêu cầu:* Bổ sung button tab `<button onClick={() => setTab("media")}>Thư viện Media & Video</button>` kèm icon `Video` hoặc `Film` từ `lucide-react`.

2. **Xây dựng Component hiển thị Thư viện Video mẫu (`FR-CNT-08`):**
   - Hiển thị danh sách video dạng lưới (Grid), mỗi thẻ video mẫu cần đảm bảo:
     + Khung hình tỷ lệ dọc **9:16** (chuẩn CapCut, TikTok, Reels, YouTube Shorts).
     + Hiển thị thời lượng video (khuyến nghị trong dải **15s – 60s** theo `FR-CNT-08`).
     + Nhãn nền tảng (Upload, TikTok, Reels, YouTube Shorts).
     + Các nút thao tác nhanh: **Xem trước (Preview)**, **Tải video (Download)**, **Xóa video (Delete)**.

3. **Xây dựng Form / Modal Tải lên Video mẫu (`FR-CNT-09`) & Ràng buộc Bản quyền (`NFR-SEC-04`):**
   - Hỗ trợ chọn tệp video định dạng `.mp4` từ thiết bị hoặc kéo thả (Drag & Drop).
   - Giới hạn dung lượng tệp tin (tối đa 100MB).
   - **BẮT BUỘC:** Có Checkbox xác nhận cam kết bản quyền:  
     `[x] "Tôi cam kết sở hữu toàn bộ bản quyền hoặc quyền sử dụng thương mại hợp pháp đối với video này (NFR-SEC-04)"`. Nút submit chỉ được kích hoạt khi checkbox này đã được tick chọn.

4. **Trình phát Xem trước Video Player 9:16 tích hợp Watermark & CTA (`FR-CNT-08`, `FR-RES-08`):**
   - Modal mở video player dọc có đầy đủ controls (Play, Pause, Mute, Seekbar).
   - Hiển thị lớp phủ Watermark logo/tên thương hiệu Merchant ở góc trên.
   - Hiển thị banner Call-To-Action (CTA) ưu đãi kèm Hotline đặt tour ở góc dưới video.
   - Nút bấm *"Tải video mẫu này về máy"* kích hoạt tải tệp MP4 trực tiếp về máy người dùng.

5. **Kết nối API Backend đã sẵn sàng:**
   - Lấy danh sách video: `GET /api/merchant/media?platform=...&search=...`
   - Thêm video mới: `POST /api/merchant/media`
   - Xóa video mẫu: `DELETE /api/merchant/media?id=...`
