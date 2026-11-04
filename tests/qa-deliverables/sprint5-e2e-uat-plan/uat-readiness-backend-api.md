# BÁO CÁO RÀ SOÁT ĐỘ SẴN SÀNG UAT & TỔNG HỢP LỖI BACKEND / API (UAT READINESS — BACKEND & API)

**Dự án:** AI Travel Reseller Network (TravelLink AI)  
**Phân hệ phụ trách:** Backend Engineering (Next.js Route Handlers, Edge Tracking Router, Video Generation Engine, AI Sales Agent Gateway)  
**Mục tiêu rà soát:** Chuẩn bị điều kiện nghiệm thu UAT & E2E Tuần 5 (Sprint 5)  
**Người thực hiện:** Senior QA Lead / QA Automation Engineer (Trương Đức Huy)  
**Ngày lập:** 29/10/2026  
**Nguyên tắc đánh giá:** Progress-Aware Testing — Chỉ ghi nhận lỗi trên các tính năng đã code (Nhóm A); không báo bug cho các tính năng thuộc backlog (Nhóm B).  

---

## 1. TỔNG HỢP MỨC ĐỘ SẴN SÀNG BACKEND & API (BACKEND READINESS OVERVIEW)

Đội ngũ Backend (BE1, BE2, BE3) đã hoàn thành hầu hết các API Route Handlers và Core Services trọng yếu. Các service chịu tải chính trong chuỗi kịch bản C1 và C3 đều đã chạy ổn định trên môi trường local và dev integration:

| Dịch vụ / API Endpoint | Chức năng nghiệp vụ trong E2E | Trạng thái Codebase | Đánh giá Sẵn sàng UAT Tuần 5 |
| :--- | :--- | :---: | :---: |
| **`/manifest.webmanifest`** | Cung cấp JSON cấu hình PWA Standalone | **Nhóm A (Đã phát triển)** | ✅ **SẴN SÀNG 100%** |
| **`/sw.js`** | Service Worker quản lý offline static cache | **Nhóm A (Đã phát triển)** | ✅ **SẴN SÀNG 100%** |
| **`/r/[code]`** | Tracking Router, phân tích UA, HTTP 302 Redirect | **Nhóm A (Đã phát triển)** | ✅ **SẴN SÀNG 100%** |
| **`Core Video Engine (generator.ts)`** | Render video 9:16 Parallax 2.5D, Auto-Ducking -20dB | **Nhóm A (Đã phát triển)** | ✅ **SẴN SÀNG 100%** |
| **`Content Factory Service`** | Sinh 4 Personas hooks/scripts/captions qua Zod | **Nhóm A (Đã phát triển)** | ✅ **SẴN SÀNG 100%** |
| **`AI Sales Agent Gateway`** | Truy xuất RAG, phát hiện intent mua, an toàn HTTPS | **Nhóm A (Đã phát triển)** | ✅ **SẴN SÀNG 100%** |
| **`Attribution Priority Resolver`** | Quy tắc ưu tiên Mã Voucher hợp lệ > Tracking Link | **Nhóm A (Đã phát triển)** | ✅ **SẴN SÀNG 100%** |
| **`Rate Limiter Service`** | Chặn click tặc tần suất cao (> 10 clicks/phút) | **Nhóm A (Đã phát triển)** | ✅ **SẴN SÀNG 100%** |
| **`Payment Webhook IPN Route`** | Tự động nhận kết quả thanh toán từ Ngân hàng | **Nhóm B (Chờ ghép nối)** | ⏳ **CHỜ DEV HOÀN THIỆN** |
| **`Napas Payout Transfer API`** | Tự động bắn lệnh chuyển khoản hoa hồng Napas | **Nhóm B (Chờ ghép nối)** | ⏳ **CHỜ DEV HOÀN THIỆN** |

---

## 2. GHI NHẬN LỖI TỒN ĐỌNG & KHUYẾN NGHỊ TỐI ƯU BACKEND / API (CHỈ DÀNH CHO NHÓM A)

### 📌 ĐÁNH GIÁ CHẤT LƯỢNG TỔNG QUAN:
- **Lỗi nghiêm trọng (Critical / Blocker):** **0 LỖI**. Không có endpoint nào bị crash mã 500 hay rò rỉ secret keys trong quá trình chạy kiểm thử tự động.
- **Quan sát kỹ thuật & Khuyến nghị hiệu năng (Performance / Scalability):** 02 điểm khuyến nghị cần tinh chỉnh cho Sprint 5.

---

### ISSUE-BE-UAT-01 (Mức độ: Medium — Tối ưu hóa Hiệu năng Render Video)
- **Tiêu đề:** Tối ưu hóa thời gian xử lý FFmpeg khi kết xuất đồng thời nhiều video dọc 9:16 có Auto-Ducking.
- **Vị trí mã nguồn:** `src/lib/video-engine/generator.ts`.
- **Mô tả hiện tượng:** Thuật toán hòa âm 3 lớp (Voiceover 0dB, BGM -20dB khi có lời thoại, SFX -12dB) và chuyển động Parallax 2.5D tạo ra video chất lượng rất cao. Tuy nhiên, khi kết xuất trên CPU không có card đồ họa tăng tốc phần cứng (Hardware Acceleration), thời gian render một video 45 giây có thể mất khoảng 60 - 90 giây.
- **Đề xuất cho Backend Dev (BE1):**
  - Cân nhắc cấu hình cờ `-preset veryfast` hoặc `-threads 4` trong FFmpeg command options khi chạy trên máy chủ phát triển/staging.
  - Tách quá trình render video thành Job chạy ngầm qua hàng đợi n8n (Queue Worker) và trả về trạng thái `processing` ngay lập tức cho UI.

---

### ISSUE-BE-UAT-02 (Mức độ: Low — Xử lý Ngoại lệ Tracking URL)
- **Tiêu đề:** Xử lý trường hợp URL đích của Merchant (`destination_url`) chứa các ký tự Unicode tiếng Việt có dấu.
- **Vị trí mã nguồn:** `app/r/[code]/route.ts`.
- **Mô tả hiện tượng:** Trong khối kiểm tra chuyển hướng HTTP 302, hàm `new URL(link.destination_url, request.url)` có thể ném ngoại lệ nếu đường link do Merchant nhập chứa khoảng trắng hoặc ký tự tiếng Việt chưa được encode (`encodeURI`). Hiện tại ngoại lệ này được bắt và redirect về `/?error=invalid_destination_url`.
- **Đề xuất cho Backend Dev:** Thêm bước chuẩn hóa `encodeURI(link.destination_url.trim())` trước khi đưa vào hàm tạo URL để đảm bảo các link tiếng Việt không bị báo lỗi nhầm.

---

## 3. GHI CHÚ TIẾN ĐỘ TÍNH NĂNG CHƯA HOÀN THIỆN (NHÓM B — KHÔNG TÍNH VÀO BUG)

Căn cứ theo kế hoạch Sprint 5, các tính năng sau đang được đội ngũ Backend phát triển và sẽ hoàn thiện trước ngày nghiệm thu:
1. *Endpoint tiếp nhận Webhook IPN từ cổng thanh toán đối tác:* Đang xây dựng cơ chế xác thực chữ ký số (HMAC SHA-256) đảm bảo an toàn giao dịch.
2. *Tích hợp API đối tác chi trả hoa hồng tự động Napas 247:* Đang trong quá trình hoàn thiện hợp đồng thử nghiệm sandbox.
3. *Đồng bộ sự kiện sang PostHog Cloud Production:* Hiện đang chạy với PostHog client mock trong các môi trường test nội bộ.
