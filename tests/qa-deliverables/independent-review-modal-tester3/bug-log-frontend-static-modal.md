# BẢNG GHI NHẬN LỖI & KHUYẾN NGHỊ GIAO DIỆN DÀNH CHO FRONTEND DEV
**Dự án:** AI Travel Reseller Network (TravelLink AI)  
**Phân hệ:** Merchant Media Library — Component `VideoGuidelinesModal` & Giao diện Modal Tĩnh  
**Người kiểm tra (Auditor):** Trương Đức Huy — Senior QA Automation Engineer  
**Thời gian rà soát:** 28/10/2026  
**Môi trường:** Next.js 16.3.8, Playwright Chromium Engine (Desktop 1280x720 & Mobile 390x844)  

---

## 1. Tóm tắt Hiện trạng Chất lượng (Quality Status Summary)

* **Tổng số lỗi Blocker / Critical:** **0**
* **Tổng số lỗi Major (Tràn khung, Vỡ layout, Lỗi font):** **0**
* **Tổng số khuyến nghị cải tiến UX (Minor / Enhancement):** **1**
* **Trạng thái nghiệm thu:** **ĐẠT (PASS)**

---

## 2. Bảng Danh mục Ghi nhận Chi tiết (UI Bug & Enhancement Log)

| ID | Mức độ | Phân loại | Component | Mô tả hiện trạng | Hành vi mong đợi / Đề xuất xử lý | Trạng thái |
|---|:---:|---|---|---|---|:---:|
| **SUGG-FE-MODAL-01** | **Minor / UX** | Tương tác người dùng (Interaction) | `VideoGuidelinesModal.tsx` | Click chuột vào vùng nền mờ (`::backdrop`) chưa tự động đóng modal. Người dùng hiện phải bấm nút `X`, nút "Đã hiểu" hoặc phím `Escape`. | Thêm sự kiện bắt click trên vùng backdrop: `onClick={(e) => { if (e.target === dialogRef.current) onClose(); }}` để tăng tính trực quan. | ĐỀ XUẤT |

---

## 3. Ghi chú Phạm vi Giao diện Tĩnh (Static Scope Notes — Không tính là Bug)

Căn cứ theo tài liệu phân công Sprint 3 (`TESTER3_W3.md`) và quy chế an toàn:
1. **Bản chất Dumb UI tĩnh:** `VideoGuidelinesModal` được giao cho Tester 3 thực hiện thuần túy là popup hiển thị thông tin hướng dẫn kỹ thuật dạng tĩnh (Stateless/Presentational).
2. **Không kết nối API / Database:** Modal không có và không cần kết nối tới bất kỳ API hay cơ sở dữ liệu Supabase nào. Việc không có dữ liệu động là hoàn toàn đúng đặc tả kỹ thuật và thiết kế kiến trúc.
3. **Nút "Đã hiểu":** Nút này đóng vai trò xác nhận người dùng đã đọc quy chuẩn và kích hoạt hàm callback `onClose()`. Nút không cần gửi bất kỳ tracking hay request lưu trữ trạng thái người dùng lên server trong giai đoạn này.

---

## 4. Xác nhận Chất lượng Bố cục & Responsive (Verification Checklist)

- [x] **Desktop (1280x720):** Modal căn giữa hoàn hảo, padding đồng đều, không tràn ngang (`scrollWidth <= clientWidth`).
- [x] **Mobile (390x844 - iPhone 13):** Khung viền cách lề 16px (`w-[calc(100%-2rem)]`), không tràn màn hình, nút `X` và nút `Đã hiểu` có touch target đạt chuẩn >= 40px và >= 44px.
- [x] **Typography & Tiếng Việt:** Toàn bộ font hiển thị rõ ràng, dấu tiếng Việt hiển thị chuẩn Unicode, không có lỗi hiển thị chuỗi rỗng/undefined.
- [x] **Khóa cuộn nền (Scroll Lock):** Thân trang (`body` và `html`) bị khóa cuộn khi modal mở và phục hồi nguyên vẹn khi modal đóng.
