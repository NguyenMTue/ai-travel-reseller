# BÁO CÁO THEO DÕI LỖI & ĐÁNH GIÁ CHẤT LƯỢNG GIAO DIỆN DI ĐỘNG (FRONTEND BUG LOG & UI AUDIT)
**Dự án:** AI Travel Reseller Network  
**Kịch bản kiểm thử:** Kiểm thử hiển thị Responsive & PWA trên thiết bị di động thật (Phương án C3)  
**Phân hệ phụ trách:** Frontend Engineering (Next.js 16 App Router, Tailwind CSS v4, PWA, Mobile Bottom Sheet)  
**Môi trường thử nghiệm:** iPhone 13 (iOS Safari, 390×844, DPR 3x) & Pixel 5 (Android Chrome Mobile, 393×851, DPR 2.75x)  
**Tiêu chuẩn chất lượng:** Không tràn ngang (`Horizontal Overflow = 0px`), Touch Target >= 44×44px, Contrast WCAG 2.1 AA  
**Ngày thực hiện:** 29/10/2026  
**Người thực hiện:** Senior QA Automation Engineer (Trương Đức Huy)  

---

## 1. TỔNG HỢP TRẠNG THÁI KIỂM THỬ GIAO DIỆN DI ĐỘNG (NHÓM A)

Căn cứ theo nguyên tắc kiểm thử **Progress-Aware Testing** (chỉ đánh giá và thẩm định trên các màn hình đã phát triển thuộc Nhóm A), toàn bộ các màn hình chính trong chuỗi Phương án C3 đều được kiểm tra toàn diện trên cả hai nền tảng iOS (WebKit) và Android (Chromium).

| STT | Màn hình / Component | Kích thước iPhone (`390×844`) | Kích thước Android (`393×851`) | Giới hạn cuộn (`scrollWidth <= clientWidth`) | Touch Target (>= 44px) | Kết luận |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| 1 | **Landing Page (`/`)** | Hiển thị trọn vẹn | Hiển thị trọn vẹn | ĐẠT (Overflow = 0px) | ĐẠT | **PASS** |
| 2 | **Reseller Feed (`/preview/reseller`)** | Hiển thị trọn vẹn | Hiển thị trọn vẹn | ĐẠT (Overflow = 0px) | ĐẠT | **PASS** |
| 3 | **Bottom Navigation Bar (Dock)** | Cố định đáy chuẩn | Cố định đáy chuẩn | ĐẠT (Overflow = 0px) | ĐẠT (48×48px) | **PASS** |
| 4 | **Modal Tracking Link & QR** | Căn giữa, cuộn mượt | Căn giữa, cuộn mượt | ĐẠT (Overflow = 0px) | ĐẠT | **PASS** |
| 5 | **AI Chat Bottom Sheet (`/preview/chat`)** | Trượt từ đáy, trap focus | Trượt từ đáy, trap focus | ĐẠT (Overflow = 0px) | ĐẠT | **PASS** |
| 6 | **Ví Reseller (`/preview/reseller/wallet`)** | 4 khối thẻ rõ ràng | 4 khối thẻ rõ ràng | ĐẠT (Overflow = 0px) | ĐẠT | **PASS** |

---

## 2. DANH MỤC LỖI & KHUYẾN NGHỊ CẢI TIẾN GIAO DIỆN (CHỈ DÀNH CHO NHÓM A)

### 📌 GHI CHÚ CHẤT LƯỢNG TỔNG QUAN:
- **Lỗi nghiêm trọng (Critical / Blocker):** **0 LỖI**. Không phát hiện lỗi vỡ khung hình, tràn màn hình ngang hay nút bấm bị che khuất trong toàn bộ luồng Phương án C3.
- **Lỗi giao diện nhỏ & Đề xuất cải tiến (Low / Enhancement):** Ghi nhận 02 quan sát kỹ thuật nhằm tối ưu hóa trải nghiệm người dùng thực tế trên thiết bị di động thật.

---

### BUG-FE-MOBILE-01 (Mức độ: Low / UI Enhancement)
- **Tiêu đề:** Tối ưu hóa vùng an toàn đáy (Safe Area Inset Bottom) cho thanh điều hướng Mobile trên các dòng iPhone có Dynamic Island / Tai thỏ.
- **Vị trí màn hình:** `src/components/reseller/shell.tsx` & `src/components/reseller/bottom-nav.tsx` (hoặc class `.mobile-dock`).
- **Hiện tượng quan sát:** Thanh Bottom Navigation Bar ("Điều hướng nhanh Cộng tác viên") hiển thị cố định ở chân màn hình rất tốt trên Android và iPhone giả lập. Tuy nhiên, trên thiết bị iPhone vật lý có vạch Home Bar của iOS (Home Indicator), thanh điều hướng có thể cần thêm thuộc tính CSS `padding-bottom: env(safe-area-inset-bottom, 16px)` để đảm bảo vạch điều hướng hệ thống không đè lên icon hoặc chữ của 4 tab.
- **Các bước tái hiện:**
  1. Mở trang `/preview/reseller` trên thiết bị iPhone 13 / 14 / 15 thật hoặc giả lập WebKit có bật Safe Area Insets.
  2. Quan sát chân trang của thanh điều hướng.
- **Hành vi mong đợi:** Thanh dock có khoảng đệm tự nhiên cách ly với Home Indicator của iOS.
- **Đề xuất khắc phục cho FE Dev:**
  ```css
  .mobile-bottom-nav {
    padding-bottom: calc(0.5rem + env(safe-area-inset-bottom, 0px));
  }
  ```

---

### BUG-FE-MOBILE-02 (Mức độ: Trivial / UX Guidance)
- **Tiêu đề:** Bổ sung hướng dẫn cài đặt PWA riêng biệt (Custom Install Prompt Guidance) cho trình duyệt Mobile Safari trên iOS.
- **Vị trí màn hình:** Banner thông báo PWA hoặc Modal Hướng dẫn cài đặt.
- **Hiện tượng quan sát:** File `manifest.webmanifest` đã khai báo đầy đủ `display: "standalone"`, `theme_color: "#204e4c"`, icon 192/512. Android Chrome Mobile tự động hiển thị thanh "Thêm vào màn hình chính" (Add to Home Screen). Tuy nhiên, trên iOS Safari, Apple không hỗ trợ sự kiện `beforeinstallprompt`, dẫn đến việc người dùng iPhone không thấy nút cài đặt tự động nếu không được hướng dẫn thao tác thủ công.
- **Đề xuất khắc phục cho FE Dev:**
  - Nhận diện thiết bị iOS qua User Agent (`/iPad|iPhone|iPod/.test(navigator.userAgent)`).
  - Hiển thị tooltip hoặc banner nhỏ: *"Để cài đặt ứng dụng trên iPhone: Chạm biểu tượng Chia sẻ (Share) ⎋ -> Chọn 'Thêm vào MH chính' ⊞"*.

---

## 3. DANH MỤC TÍNH NĂNG CHƯA TRIỂN KHAI (NHÓM B - TUYỆT ĐỐI KHÔNG BÁO BUG)

Căn cứ theo Backlog Sprint 3 và SRS v1.1, các mục sau chưa được lập trình ở phiên bản hiện tại, QA không tạo bug log:
1. *Cơ chế Push Notification của Service Worker trên nền WebKit iOS*: Chờ hoàn thiện Web Push Server backend.
2. *Chế độ Dark Mode di động*: Chưa có trong phạm vi Sprint 3 (thiết kế Coastal Editorial hiện sử dụng màu nền ấm `#faf9f5` và xanh `#204e4c`).
3. *Thao tác Swipe cử chỉ (Gesture Swipe-to-dismiss) cho Bottom Sheet*: Hiện tại Bottom Sheet hỗ trợ nút đóng `×`, phím `Escape`, và click ra ngoài backdrop.
