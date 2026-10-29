# BÁO CÁO THEO DÕI LỖI & ĐÁNH GIÁ CHẤT LƯỢNG BACKEND / API TRÊN DI ĐỘNG (BACKEND API BUG LOG)
**Dự án:** AI Travel Reseller Network  
**Kịch bản kiểm thử:** Kiểm thử hiển thị Responsive & PWA trên thiết bị di động thật (Phương án C3)  
**Phân hệ phụ trách:** Backend Engineering (Next.js API Routes, Tracking Redirect Engine, AI Sales Agent Gateway)  
**Môi trường thử nghiệm:** Môi trường Dev Server Local / Mạng nội bộ LAN (`http://<local-ip>:3100`)  
**Ngày thực hiện:** 29/10/2026  
**Người thực hiện:** Senior QA Automation Engineer (Trương Đức Huy)  

---

## 1. TỔNG HỢP TRẠNG THÁI KIỂM THỬ BACKEND / API (NHÓM A)

Các API endpoints tham gia trực tiếp vào chuỗi Phương án C3 trên thiết bị di động gồm:
1. **PWA Manifest Route (`/manifest.webmanifest`):** Phản hồi HTTP 200 OK, MIME type `application/manifest+json`, cấu trúc JSON đúng chuẩn W3C Web App Manifest.
2. **PWA Service Worker Route (`/sw.js`):** Header `Cache-Control: no-store`, `Service-Worker-Allowed: /`, hỗ trợ offline cache cho các tài nguyên tĩnh `/pwa/*` và bỏ qua chuyển hướng tracking `/r/*`.
3. **Tracking Redirect Route (`/r/[code]`):**
   - Phân tích User-Agent chính xác đối với Mobile Safari (iOS) và Chrome Mobile (Android).
   - Rate Limiter chặn click tặc (> 10 requests / phút / IP).
   - HTTP 302 Redirect tức thì sang đường link thanh toán chính thức của đối tác Merchant.
4. **Mock Fixture API Routes (`/preview/*`):** Cung cấp dữ liệu độc lập cho Reseller Campaign Feed, Tracking Modal, Chat Assistant và Wallet Dashboard mà không phụ thuộc vào kết nối Supabase cloud sống.

| Endpoint | Giao thức / Phương thức | Mục đích trong Kịch bản C3 | Thiết bị kiểm thử | Kết quả phản hồi | Trạng thái |
| :--- | :---: | :--- | :--- | :---: | :---: |
| `/manifest.webmanifest` | GET | Cung cấp thông tin cài đặt PWA | iPhone 13, Pixel 5 | HTTP 200 (JSON) | **PASS** |
| `/sw.js` | GET | Service Worker quản lý offline cache | iPhone 13, Pixel 5 | HTTP 200 (JS) | **PASS** |
| `/pwa/icon-192.png` | GET | Icon PWA 192x192 px | iPhone 13, Pixel 5 | HTTP 200 (PNG) | **PASS** |
| `/pwa/icon-512.png` | GET | Icon PWA 512x512 px | iPhone 13, Pixel 5 | HTTP 200 (PNG) | **PASS** |
| `/pwa/apple-touch-icon.png` | GET | Icon Apple Touch 180x180 px | iPhone 13, Pixel 5 | HTTP 200 (PNG) | **PASS** |
| `/r/[code]` | GET | Redirect 302 & Phân tích UA Mobile | iOS Safari, Android Chrome | HTTP 302 Redirect | **PASS** |
| `/preview/reseller` | GET | Fixture Feed trên Mobile | iOS Safari, Android Chrome | HTTP 200 (HTML) | **PASS** |
| `/preview/chat` | GET | Fixture Chat AI trên Mobile | iOS Safari, Android Chrome | HTTP 200 (HTML) | **PASS** |
| `/preview/reseller/wallet` | GET | Fixture Ví & 4 trạng thái hoa hồng | iOS Safari, Android Chrome | HTTP 200 (HTML) | **PASS** |

---

## 2. DANH MỤC LỖI & ĐỀ XUẤT CẢI TIẾN BACKEND / API (NHÓM A)

### 📌 GHI CHÚ CHẤT LƯỢNG TỔNG QUAN:
- **Lỗi nghiêm trọng (Critical / Blocker):** **0 LỖI**. Không phát hiện lỗi sập server (500 Internal Server Error) hay lỗi vỡ contract dữ liệu trong quá trình kiểm thử tự động và giả lập thiết bị.
- **Quan sát kỹ thuật & Khuyến nghị tối ưu (Backend Optimization):** 01 điểm khuyến nghị.

---

### OBS-BE-MOBILE-01 (Mức độ: Low / Performance Optimization)
- **Tiêu đề:** Tối ưu hóa phản hồi HTTP Cache Header cho file Web App Manifest và PWA Icons trên mạng di động băng thông yếu (3G/4G).
- **Vị trí mã nguồn:** `app/manifest.ts` & cấu hình `next.config.ts`.
- **Hiện tượng quan sát:** Route `/manifest.webmanifest` hiện trả về header `cache-control: public, max-age=0, must-revalidate`. Mặc dù điều này giúp cập nhật icon ngay khi dev sửa đổi, nhưng trên thiết bị di động thật sử dụng mạng di động có độ trễ cao, trình duyệt sẽ luôn phải gửi conditional request kiểm tra lại mỗi lần khởi động PWA.
- **Đề xuất cho Backend Dev:** Khi chuyển sang môi trường Production, có thể tăng thời gian cache cho manifest (ví dụ `max-age=86400, stale-while-revalidate=3600`) để tăng tốc độ khởi chạy PWA ở chế độ Standalone.

---

## 3. DANH MỤC TÍNH NĂNG CHƯA TRIỂN KHAI (NHÓM B - TUYỆT ĐỐI KHÔNG BÁO BUG)

Căn cứ theo Backlog Sprint 3 và SRS v1.1, các mục sau chưa phát triển trên Backend, QA không báo bug:
1. *API Webhook tự động nhận thông báo thanh toán (IPN/Webhook) từ Cổng thanh toán của Merchant*: Hiện tại đối soát hoa hồng thực hiện qua trigger cập nhật trạng thái đơn hàng thủ công/mô phỏng.
2. *API liên kết tài khoản ngân hàng và tự động chi trả hoa hồng qua Napas 247*: Tính năng thuộc lộ trình Sprint tiếp theo.
3. *Push Notification Server (Web Push VAPID Protocol)*: Chưa triển khai server cấp phát khóa VAPID cho Service Worker.
