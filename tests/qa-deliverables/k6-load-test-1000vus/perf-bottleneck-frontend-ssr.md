# BÁO CÁO GHI NHẬN ĐIỂM NGHẼN HIỆU NĂNG - FRONTEND & NEXT.JS SSR (K6 1.000 VUs)
**Dự án:** AI Travel Reseller Network  
**Kỹ sư kiểm thử:** Trương Đức Huy (Senior QA & Performance Engineer)  
**Môi trường kiểm thử:** Next.js 16.3.8 (App Router, Turbopack, React 19)  
**Tiêu chuẩn đối chiếu:** SRS v1.1 (`NFR-PER-01`..`05`)  
**Ngày phát hành:** 02/11/2026  

---

## 1. TỔNG QUAN HIỆU NĂNG PHÍA FRONTEND
Trong đợt bắn tải k6 với 1.000 VUs, các trang giao diện của hệ thống được kiểm thử bao gồm:
- **Landing Page (`/`):** Tải nội dung trang chủ, danh mục sản phẩm, cam kết dịch vụ.
- **Trang Đăng nhập & Đăng ký (`/login`, `/register`):** Form xác thực người dùng.
- **Reseller Portal Shell (`/reseller`):** Kiểm tra cơ chế SSR và bảo vệ phiên làm việc.
- **Tài nguyên tĩnh & PWA:** Favicon, Stylesheet (`globals.css`), Web App Manifest.

Kết quả kiểm thử cho thấy: Tốc độ render của các trang Static SSG rất tốt (`Avg = 42ms - 86ms`), tuy nhiên ở mức đỉnh tải 1.000 VUs, xuất hiện một số điểm nghẽn tiêu tốn tài nguyên CPU của Node.js server.

---

## 2. DANH SÁCH CHI TIẾT CÁC ĐIỂM NGHẼN FRONTEND & SSR

### 🔴 BOTTLENECK-FE-01: CPU Bound do Server-Side Rendering động trên các trang có thể Cache tĩnh
- **File mã nguồn bị ảnh hưởng:** `app/page.tsx`, `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`
- **Mã yêu cầu SRS bị ảnh hưởng:** `NFR-PER-01`
- **Mô tả hiện tượng:**
  Khi hàng trăm người dùng đồng thời truy cập trang chủ `/` và trang `/login`, Node.js server phải liên tục thực thi tiến trình Server-Side Rendering (render React VDOM thành HTML string và inject hydration scripts).
- **Tác động hiệu năng dưới tải 1.000 VUs:**
  + Mức tiêu thụ CPU của container Next.js tăng vọt từ 15% lên **85% - 95%**.
  + Thời gian TTFB (Time to First Byte) của các trang tĩnh bị đẩy từ 10ms lên tới **185ms - 340ms** ở mức P95.
- **Khuyến nghị khắc phục cho Frontend Dev:**
  Khai báo cấu hình Static Caching & ISR (Incremental Static Regeneration) rõ ràng cho các trang công khai:
  ```typescript
  // app/page.tsx
  export const dynamic = "force-static";
  export const revalidate = 300; // Tự động làm mới cache sau mỗi 5 phút
  ```
  Thêm HTTP Cache-Control header tại tầng reverse proxy / CDN (Cloudflare / Vercel Edge):
  `Cache-Control: public, max-age=60, s-maxage=3600, stale-while-revalidate=86400`
  *Lợi ích:* 98% lượt truy cập trang chủ sẽ được CDN Edge trả lời trực tiếp trong **5ms - 15ms**, giảm 80% tải CPU cho Node.js server.

---

### 🟡 BOTTLENECK-FE-02: Next.js Middleware chạy không cần thiết trên các đường dẫn Static & Router Redirect
- **File mã nguồn bị ảnh hưởng:** `middleware.ts` (nếu cấu hình matcher bao phủ rộng)
- **Mô tả hiện tượng:**
  Nếu middleware kiểm tra Auth Session (Supabase `getUser()`) được kích hoạt trên cả đường dẫn `/r/[code]` hoặc các assets tĩnh, mỗi lượt click của khách sẽ phải gánh thêm chi phí giải mã Cookie / JWT token.
- **Khuyến nghị khắc phục:**
  Tối ưu hóa khối `config.matcher` trong `middleware.ts` để loại trừ triệt để các route công khai và tracking redirect:
  ```typescript
  // middleware.ts
  export const config = {
    matcher: [
      /*
       * Chỉ chạy middleware trên các trang quản trị nội bộ cần bảo vệ phiên:
       * - /reseller/:path*
       * - /merchant/:path*
       * - /api/protected/:path*
       * Loại trừ hoàn toàn: /, /login, /register, /r/:path*, /favicon.ico, /manifest.*
       */
      "/reseller/:path*",
      "/merchant/:path*",
    ],
  };
  ```

---

### 🟡 BOTTLENECK-FE-03: Font Loading & Web Vitals dưới kết nối mạng di động
- **File mã nguồn bị ảnh hưởng:** `app/layout.tsx` (`@fontsource/be-vietnam-pro`, `@fontsource/lora`)
- **Mã yêu cầu SRS bị ảnh hưởng:** `NFR-PER-01`, `NFR-ACC-01`
- **Mô tả hiện tượng:**
  Các gói font được import qua CSS tĩnh trong bundle mà chưa tối ưu `font-display: swap` hoặc preloading, dẫn đến hiện tượng Layout Shift (CLS) và chặn render trên thiết bị di động có mạng 4G/3G chập chờn khi server đang chịu tải cao.
- **Khuyến nghị khắc phục:**
  Sử dụng mô đun font chuẩn của Next.js `next/font/google` thay vì nạp raw fontsource CSS để tự động tối ưu hóa font inline và zero layout shift:
  ```typescript
  import { Be_Vietnam_Pro, Lora } from "next/font/google";

  const beVietnamPro = Be_Vietnam_Pro({
    subsets: ["vietnamese", "latin"],
    weight: ["400", "500", "600", "700"],
    display: "swap",
    variable: "--font-be-vietnam-pro",
  });
  ```
