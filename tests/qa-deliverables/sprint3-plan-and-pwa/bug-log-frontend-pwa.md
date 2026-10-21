# BÁO CÁO GHI NHẬN VẤN ĐỀ KIỂM THỬ FRONTEND & PWA (BUG LOG FRONTEND PWA)
**Dự án:** AI Travel Reseller Network (MVP)  
**Phân hệ:** PWA Mobile & Responsive UI  
**Người phụ trách báo cáo:** Senior QA Engineer  
**Đối tượng nhận xử lý:** Frontend Development Team  
**Tài liệu tham chiếu:** SRS v1.1 & BRD v1.0  
**Ngày lập:** 21/10/2026  
**Nguyên tắc ghi nhận:** Chỉ ghi nhận lỗi trên các tính năng/cấu hình **ĐÃ ĐƯỢC PHÁT TRIỂN (NHÓM A)**; tuyệt đối không báo bug cho các màn hình thuộc diện chờ phát triển (Nhóm B).

---

## 1. TỔNG QUAN
Sau khi rà soát toàn bộ source code giao diện và chạy bộ kiểm thử Responsive / PWA trên các kích thước màn hình điện thoại (iPhone 13, Pixel 5, iPhone SE, Small Mobile 320px), QA phát hiện **3 vấn đề lỗi giao diện và cấu hình PWA thực tế** trên các thành phần Frontend đã được triển khai:

| Mã Bug | Tên vấn đề | Mức độ nghiêm trọng (Severity) | File source code liên quan | Trạng thái |
| :---: | :--- | :---: | :--- | :---: |
| `BUG-FE-PWA-01` | Thiếu khai báo `viewport` và cấu hình PWA Metadata trong `app/layout.tsx` | **High** | `app/layout.tsx` | 🔴 Mới ghi nhận |
| `BUG-FE-PWA-02` | Header Landing Page (`SiteHeader`) ẩn navigation trên mobile nhưng thiếu nút Hamburger Menu mở Drawer | **Medium** | `src/components/site-header.tsx`, `app/globals.css` | 🔴 Mới ghi nhận |
| `BUG-FE-PWA-03` | Reseller Portal Shell (`ResellerShell`) thiếu thanh điều hướng cố định (Sticky/Bottom Nav) khi cuộn nội dung dài | **Medium** | `src/components/reseller/shell.tsx` | 🔴 Mới ghi nhận |

---

## 2. CHI TIẾT TỪNG VẤN ĐỀ

### 1. BUG-FE-PWA-01: Thiếu khai báo `viewport` và cấu hình PWA Metadata trong `app/layout.tsx`
- **Mã Bug:** `BUG-FE-PWA-01`
- **Vị trí phụ trách:** Frontend Dev / Next.js Specialist
- **Tính năng & Mã SRS bị ảnh hưởng:** Cấu hình PWA & Khả năng hiển thị di động (`NFR-ACC-01`, SRS v1.1 Mục 14)
- **Test Case liên quan:** `TC-PWA-01`, `TC-PWA-02`, `TC-PWA-03`
- **Mức độ nghiêm trọng:** `High`
- **File source code nghi ngờ gây lỗi:** `app/layout.tsx` (dòng 13–20)
- **Các bước tái hiện (Steps to Reproduce):**
  1. Mở file `app/layout.tsx` trong codebase.
  2. Kiểm tra phần khai báo `export const metadata: Metadata` và kiểm tra có export `viewport` hay thẻ meta trong HTML hay không.
  3. Mở ứng dụng trên trình duyệt Chrome Mobile hoặc Safari Mobile và chạy audit công cụ Lighthouse PWA.
- **Kết quả mong đợi (Expected Result):**
  - Theo chuẩn Next.js 14/15/16 và PWA Best Practices, file `layout.tsx` phải export cấu hình `viewport` độc lập:
    ```ts
    import type { Metadata, Viewport } from "next";

    export const viewport: Viewport = {
      width: "device-width",
      initialScale: 1,
      maximumScale: 5,
      themeColor: "#204e4c",
    };
    ```
  - Phần `metadata` phải khai báo link manifest và các thuộc tính Apple Web App:
    ```ts
    export const metadata: Metadata = {
      manifest: "/manifest.json",
      appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "TravelLink AI",
      },
      // ...
    };
    ```
- **Kết quả thực tế (Actual Result):**
  - Trong `app/layout.tsx` chỉ có `title` và `description`.
  - Hoàn toàn không có export `viewport`, không có `themeColor`, không có liên kết `manifest`, và không có cấu hình `appleWebApp`.
  - *Hậu quả:* Một số trình duyệt di động có thể hiển thị trang ở chế độ viewport mặc định 980px gây zoom-out, thanh trạng thái (status bar) trên điện thoại không đồng bộ màu thương hiệu `#204e4c`, và Lighthouse PWA đánh rớt tiêu chuẩn PWA Installable.

---

### 2. BUG-FE-PWA-02: Header Landing Page (`SiteHeader`) ẩn navigation trên mobile nhưng thiếu nút Hamburger Menu mở Drawer
- **Mã Bug:** `BUG-FE-PWA-02`
- **Vị trí phụ trách:** Frontend Dev
- **Tính năng & Mã SRS bị ảnh hưởng:** Điều hướng người dùng trên Mobile (`NFR-ACC-01`, `FR-CMP-02`)
- **Test Case liên quan:** `TC-PWA-06`, `TC-PWA-11`
- **Mức độ nghiêm trọng:** `Medium`
- **File source code nghi ngờ gây lỗi:** `src/components/site-header.tsx` và `app/globals.css` (dòng 1516–1525, 1853–1855)
- **Các bước tái hiện:**
  1. Truy cập trang chủ `/` trên viewport di động `390x844` hoặc `375x667`.
  2. Quan sát thanh Header ở đầu trang.
  3. Thử tìm cách chuyển đến trang "Cách hoạt động", "Trợ lý AI" hoặc "Xem Dashboard".
- **Kết quả mong đợi:**
  - Khi ẩn menu ngang trên mobile, hệ thống phải cung cấp một nút bấm icon Hamburger Menu (như bên `src/components/merchant/dashboard.tsx` đã làm) để mở Navigation Drawer trượt từ cạnh màn hình.
- **Kết quả thực tế:**
  - File `app/globals.css` tại media query `@media (max-width: 760px)` ẩn hoàn toàn:
    ```css
    .header-inner nav {
      display: none;
    }
    ```
  - Và khi `< 480px`:
    ```css
    .header-actions .login-link {
      display: none;
    }
    ```
  - Nhưng trong `SiteHeader` (`src/components/site-header.tsx`) không hề có nút toggle menu hamburger hay mobile drawer nào.
  - *Hậu quả:* Khách hàng vãng lai truy cập Landing Page trên điện thoại bị mất hoàn toàn khả năng điều hướng đến trang "Cách hoạt động", "Trợ lý AI" hay "Xem Dashboard".

---

### 3. BUG-FE-PWA-03: Reseller Portal Shell (`ResellerShell`) thiếu thanh điều hướng cố định (Sticky/Bottom Nav) khi cuộn nội dung dài
- **Mã Bug:** `BUG-FE-PWA-03`
- **Vị trí phụ trách:** Frontend Dev
- **Tính năng & Mã SRS bị ảnh hưởng:** Trải nghiệm thao tác Reseller trên Mobile (`FR-RES-05`, `NFR-ACC-01`)
- **Test Case liên quan:** `TC-PWA-09`, `TC-PWA-11`
- **Mức độ nghiêm trọng:** `Medium`
- **File source code nghi ngờ gây lỗi:** `src/components/reseller/shell.tsx` (dòng 18–50)
- **Các bước tái hiện:**
  1. Đăng nhập Reseller và truy cập chi tiết chiến dịch `/reseller/campaigns/[id]`.
  2. Cuộn dọc màn hình để duyệt qua 10 Hooks, 5 Scripts, 5 Captions và 5 CTAs trong Content Kit (chiều cao trang vượt quá 2.500px).
  3. Quan sát vị trí của thanh menu điều hướng.
- **Kết quả mong đợi:**
  - Thanh header hoặc thanh điều hướng chính phải có cơ chế cố định (Sticky Header `sticky top-0 z-50` hoặc Bottom Navigation Bar cố định ở đáy màn hình `fixed bottom-0 left-0 right-0`), giúp Reseller có thể bấm chuyển trang hoặc thoát ra danh sách chiến dịch bất kỳ lúc nào.
- **Kết quả thực tế:**
  - Thẻ `<header>` trong `ResellerShell` sử dụng `position: static` mặc định.
  - Khi người dùng cuộn xuống dưới, toàn bộ thanh header trôi mất khỏi màn hình.
  - *Hậu quả:* Reseller phải mất công vuốt ngược màn hình hàng chục lần mới lên được đầu trang để bấm quay lại danh sách chiến dịch, làm suy giảm nghiêm trọng trải nghiệm người dùng trên thiết bị di động (UX friction).

---
*Báo cáo được lập tự động bởi Senior QA Engineer phục vụ Sprint 3 Review.*
