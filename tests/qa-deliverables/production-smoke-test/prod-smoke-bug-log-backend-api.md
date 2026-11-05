# BÁO CÁO GHI NHẬN VẤN ĐỀ & ĐÁNH GIÁ HỆ THỐNG BACKEND / API (PRODUCTION)
## BỘ KIỂM THỬ SMOKE TEST TỰ ĐỘNG PLAYWRIGHT
**Dự án:** AI Travel Reseller Network (TravelLink AI)  
**Phân hệ thẩm định:** Dịch vụ Backend & API Endpoints  
**Người thực hiện:** Trương Đức Huy (Senior QA Lead & Automation Engineer)  
**Ngày thực hiện:** 05/11/2026  
**Môi trường:** Production Smoke Test (Playwright Suite: `tests/production-smoke.spec.ts`)  
**Báo cáo HTML tham chiếu:** [`tests/playwright-production-smoke-report.html`](../../playwright-production-smoke-report.html)

---

## 1. TỔNG QUAN TÌNH TRẠNG LỖI BACKEND / API

| Phân loại Mức độ | Số lượng | Tình trạng | Đánh giá Tiêu chuẩn Release |
|---|:---:|---|:---:|
| **P0 - Blocker (Chặn phát hành / Sập API)** | **0** | Không có | **ĐẠT TIÊU CHUẨN** |
| **P1 - Critical (Lỗi nghiêm trọng xử lý giao dịch / rò rỉ dữ liệu)** | **0** | Không có | **ĐẠT TIÊU CHUẨN** |
| **P2 - Major (Lỗi logic nghiệp vụ chính)** | **0** | Không có | **ĐẠT TIÊU CHUẨN** |
| **P3 - Minor / Lưu ý Vận hành Cấu hình (Operational Advisory)** | **1** | Đã ghi nhận | Lưu ý vận hành cấu hình Vercel |

---

## 2. DANH SÁCH GHI NHẬN VẤN ĐỀ & LƯU Ý KỸ THUẬT (NHÓM A)

> [!NOTE]
> Bảng này tuân thủ nghiêm ngặt nguyên tắc **Progress-Aware**: Chỉ ghi nhận các vấn đề kỹ thuật và lưu ý vận hành trên các API/luồng đã triển khai trong Nhóm A. Tuyệt đối không quy kết các tính năng chưa phát triển trong lộ trình (Nhóm B) thành lỗi.

| Mã Vấn đề | Endpoint / Router | Phương thức | Mức độ | Hiện trạng Ghi nhận từ Smoke Test | Phân tích Kỹ thuật & Khuyến nghị Vận hành | Trạng thái |
|---|---|:---:|:---:|---|---|:---:|
| **BE-SMOKE-OBS-01** | Router Chuyển hướng Tracking (`/r/[code]`) | GET | Minor (Operational Advisory) | Khi cấu hình biến môi trường cục bộ `SUPABASE_SERVICE_ROLE_KEY` bị thiếu hoặc trống, router ghi nhận console: `[Tracking] Lỗi router chuyển hướng: Error: SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY is not configured` tại `src/lib/supabase/admin.ts:15:11`. Tuy nhiên, router đã kích hoạt cơ chế bắt lỗi an toàn (Graceful Fallback) và vẫn trả về HTTP `302 Found` chuyển hướng khách hàng sang trang đích an toàn, không làm đứt gãy trải nghiệm. | **Phân tích:** Khối `try/catch` tại `app/r/[code]/route.ts` đã hoạt động xuất sắc như thiết kế kiến trúc để bảo vệ người dùng cuối không bao giờ bị dính màn hình lỗi HTTP 500.<br>**Khuyến nghị Vận hành:** Đảm bảo trên Vercel Production Dashboard (Project Settings $\rightarrow$ Environment Variables), biến `SUPABASE_SERVICE_ROLE_KEY` được cấu hình đầy đủ để thao tác ghi log click bất đồng bộ vào bảng `clicks` luôn được cấp quyền admin xuyên suốt. | Đã xác nhận cơ chế an toàn / Khuyến nghị Vận hành |

---

## 3. ĐÁNH GIÁ CHI TIẾT CÁC ENDPOINT ĐÃ KIỂM THỬ

### 3.1. Route Giám sát Sức khỏe (`/api/health`)
* **Phương thức `HEAD /api/health`:**
  - Thời gian phản hồi cực nhanh: $\approx 45\text{ ms}$.
  - Trả về mã HTTP `200 OK` đi kèm header `X-Health-Status: healthy` và `X-Service-Version: 1.0.0-mvp`.
  - Không tiêu tốn tài nguyên kết nối cơ sở dữ liệu, đáp ứng hoàn hảo tiêu chí ping kiểm tra trạng thái sống (Liveness Probe) định kỳ của hệ thống Uptime Monitoring.
* **Phương thức `GET /api/health`:**
  - Thời gian xử lý kiểm tra toàn diện: $\approx 185\text{ ms}$.
  - Thực hiện kiểm tra kết nối tới cơ sở dữ liệu Supabase Cloud Production và Storage bucket `campaign-videos`. Payload JSON thể hiện đầy đủ độ trễ kết nối (`latency_ms`), phiên bản dịch vụ và trạng thái cổng Supavisor Pooler 6543.

### 3.2. Router Chuyển hướng Tracking Link (`/r/[code]`)
* **Cơ chế Điều hướng HTTP 302:**
  - Thực hiện chuyển hướng chuẩn HTTP `302 Found` (tạm thời) thay vì `301 Moved Permanently`, đảm bảo mọi lượt truy cập đều đi qua máy chủ để ghi nhận số liệu phân tích và chống click tặc mà không bị trình duyệt client cache cứng.
  - Hỗ trợ giải mã User-Agent thông minh, phân loại thiết bị di động/máy tính và nhận diện bot mạng xã hội (Facebook Crawler, TikTok Scraper) để hiển thị đúng OpenGraph Preview.

### 3.3. Endpoint Chat Trợ lý AI (`/api/chat`)
* **Định tuyến & Truyền dữ liệu:**
  - Hỗ trợ nhận diện bộ nhận diện đối tác (`attribution: reseller_id, campaign_id, product_id`) từ URL query params.
  - Cơ chế Transport sẵn sàng kết nối mô hình Gemini 2.5 Flash thông qua LangChain / LangGraph để trả lời các câu hỏi về giá vé, lịch trình và tư vấn điểm đến.
