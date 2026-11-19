# BÁO CÁO GHI NHẬN LỖI & ĐỀ XUẤT TỐI ƯU HÓA FRONTEND MOBILE COMPATIBILITY (TUẦN 6)
## PHÂN HỆ: MOBILE RESPONSIVE, TOUCH GESTURES, SAFE AREA & KEYBOARD OVERLAY

- **Dự án:** AI Travel Reseller Network (TravelLink)
- **QA Automation Engineer:** Trương Đức Huy (Senior QA Lead)
- **Phạm vi kiểm thử:** Toàn bộ giao diện Mobile Web / PWA trên thiết bị di động (iPhone iOS Safari 390x844 & Android Chrome Mobile 393x851), bao gồm Storefront, Reseller Portal, Merchant Portal, Khung Chat AI Sales Agent và Form Checkout Modal.
- **Ngày ghi nhận:** 19/11/2026

---

### BẢNG TỔNG QUAN PHÂN LOẠI VẤN ĐỀ FRONTEND MOBILE

| Mã Issue | Tên vấn đề / Lỗi phát hiện | Vị trí file mã nguồn | Mức độ nghiêm trọng | Trạng thái |
| :---: | :--- | :--- | :---: | :---: |
| `BUG-FE-MOB-01` | Form Checkout thiếu cấu hình `font-size: 16px` gây nguy cơ iOS Safari Auto-Zoom | `src/components/storefront/storefront-checkout-modal.tsx` | **Medium / Mobile UX** | Đề xuất tối ưu |
| `BUG-FE-MOB-02` | Thanh Sticky CTA Storefront thiếu khoảng đệm `env(safe-area-inset-bottom)` trên iPhone | `src/components/storefront/storefront-sticky-cta.tsx` | **Low / Visual Ergonomics** | Đề xuất tối ưu |
| `BUG-FE-MOB-03` | Root Layout thiếu `viewport-fit: cover` trong metadata toàn cục | `app/layout.tsx` (dòng 25) | **Low / PWA Standards** | Đề xuất tối ưu |

---

### CHI TIẾT CÁC VẤN ĐỀ GHI NHẬN:

#### 1. BUG-FE-MOB-01: Form Checkout thiếu cấu hình `font-size: 16px` gây nguy cơ iOS Safari Auto-Zoom
- **Vị trí phát hiện:** `src/components/storefront/storefront-checkout-modal.tsx` (dòng 264, 334, 349, 360)
- **Mức độ:** **Medium / Mobile UX**
- **Mô tả chi tiết:**
  Trên trình duyệt iOS Safari (iPhone), khi người dùng chạm (`tap`) vào bất kỳ ô `<input>` hoặc `<textarea>` nào có cỡ chữ tính toán nhỏ hơn 16px (`font-size < 16px`), trình duyệt sẽ tự động kích hoạt tính năng phóng to (Auto-zoom in) vào trường nhập liệu. Điều này làm thay đổi tỷ lệ khung hình (scale), đẩy các nút bấm cố định hoặc header ra khỏi màn hình hiển thị.
  Hiện tại, trong khi khung Chat AI (`mobile-chat-sheet.module.css`) đã cấu hình rất tốt thuộc tính:
  ```css
  .sheet :global(.chat-compose textarea) { font-size: 16px; }
  ```
  thì tại `storefront-checkout-modal.tsx`, các ô nhập liệu Họ tên, Số điện thoại, Email và Ngày đi đang sử dụng lớp Tailwind:
  ```tsx
  className="w-full text-xs md:text-sm pl-9 pr-3 py-2 ..." // text-xs = 12px, text-sm = 14px
  ```
- **Hành vi mong đợi:** Trên màn hình di động (`< 768px`), các thẻ `<input>` trên Form Checkout phải có `font-size: 16px` (hoặc lớp Tailwind `text-base md:text-sm`) để ngăn chặn hoàn toàn hiện tượng tự động phóng to của iOS Safari.
- **Giải pháp khắc phục đề xuất:**
  ```tsx
  // Thay thế text-xs md:text-sm bằng text-base md:text-sm
  className="w-full text-base md:text-sm pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden ..."
  ```

---

#### 2. BUG-FE-MOB-02: Thanh Sticky CTA Storefront thiếu khoảng đệm `env(safe-area-inset-bottom)` trên iPhone
- **Vị trí phát hiện:** `src/components/storefront/storefront-sticky-cta.tsx` (dòng 15)
- **Mức độ:** **Low / Visual Ergonomics**
- **Mô tả chi tiết:**
  Thanh CTA cố định ở đáy màn hình di động Storefront được khai báo lớp:
  ```tsx
  className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-2xl flex items-center justify-between gap-3"
  ```
  Lớp `p-3` (padding 12px) không tính đến khoảng an toàn của thanh vuốt điều hướng Home Indicator trên iPhone tràn viền (`env(safe-area-inset-bottom)` = 34px). Khi người dùng thao tác vuốt về Home từ đáy màn hình, ngón tay rất dễ chạm nhầm vào nút "ĐẶT VÉ NGAY" hoặc vùng giá.
- **Giải pháp khắc phục đề xuất:**
  Bổ sung khoảng đệm an toàn tự động co giãn theo thiết bị:
  ```tsx
  className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-2xl flex items-center justify-between gap-3"
  ```

---

#### 3. BUG-FE-MOB-03: Root Layout thiếu `viewport-fit: cover` trong metadata toàn cục
- **Vị trí phát hiện:** `app/layout.tsx` (dòng 25)
- **Mức độ:** **Low / PWA Standards**
- **Mô tả chi tiết:**
  Hiện tại `app/layout.tsx` chỉ khai báo:
  ```tsx
  export const viewport: Viewport = { themeColor: "#204e4c" };
  ```
  Trong khi `app/chat/layout.tsx` và `app/reseller/layout.tsx` đã khai báo `viewportFit: "cover"`. Điều này khiến các trang không thuộc 2 phân hệ trên (như Trang chủ `/`, `/storefront/[tenant]/[slug]`, `/login`, `/register`) không được trình duyệt di động kích hoạt chế độ hiển thị tràn viền Edge-to-Edge đầy đủ của CSS Safe Area.
- **Giải pháp khắc phục đề xuất:**
  Đồng bộ khai báo trong `app/layout.tsx`:
  ```tsx
  export const viewport: Viewport = {
    themeColor: "#204e4c",
    viewportFit: "cover",
  };
  ```

---

### CÁC ĐIỂM SÁNG ĐÃ ĐẠT CHUẨN FRONTEND MOBILE TRONG DỰ ÁN:
1. **Touch Targets:** Thanh Bottom Navigation Reseller đạt chuẩn kích thước 98x76px (vượt xa chuẩn khuyến nghị 44x44px của Apple HIG và Material Design).
2. **Horizontal Overflow:** 100% các màn hình kiểm thử đều đạt `scrollWidth <= clientWidth`, không có hiện tượng vỡ layout hay thanh trượt ngang ngoài ý muốn.
3. **Chat AI Bottom Sheet:** Áp dụng `dvh` (Dynamic Viewport Height) và tự động co giãn thông minh khi bàn phím ảo bật lên, Textarea đạt chuẩn 16px.
