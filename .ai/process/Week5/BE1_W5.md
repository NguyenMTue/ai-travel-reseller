# MY WORK PLAN — BE1_W5
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 5 (02/11/2026 – 07/11/2026) — Sprint 5 (Sprint Cuối / Final Sprint)  
**Member:** Nguyễn Minh Tuệ (Backend 1 Lead kiêm Project Manager)  
**Role:** Backend Developer 1 (Database Architect, Supabase Cloud, Connection Pooling & Production Deployment)  
**Current Milestone:** FINAL E2E UAT, PERFORMANCE STRESS TESTING, RLS SECURITY AUDIT & PRODUCTION GO-LIVE  
**Deadline:** 17:00 Thứ Bảy (07/11/2026)  
**Branch:** `feature/be1-w5-production-release-and-hotfix` (tách từ `dev`)  

---

## 1. Context & Trọng tâm Kỹ thuật Sprint 5
- Kế thừa thành quả Sprint 4: Nâng cấp hoàn tất Core Video Engine v2 với chuyển động Parallax 2.5D, Auto-Ducking 3 lớp đạt điểm 9.4/10 theo Rubric QA; kết xuất thành công 02 video mẫu Bà Nà Hills và Hội An.
- **Trọng tâm BE1 trong Tuần 5 — Hoàn thiện Hạ tầng Production & Chịu tải cao:**
  1. **Thiết lập Hạ tầng Cơ sở Dữ liệu Supabase Cloud Production:** Triển khai toàn bộ migrations (schema, tables, RPC ví tiền, functions đối soát hoa hồng, RLS policies, trigger xác thực, pgvector extension) lên instance Supabase Cloud Production.
  2. **Cấu hình Connection Pooling (Supavisor) phục vụ k6 Load Test:** Tối ưu hóa số lượng kết nối đồng thời qua connection pooler cổng 6543, đảm bảo hệ thống phục vụ mượt mà $1.000$ virtual users (VUs) mà không bị nghẽn connection hoặc timeout.
  3. **Đồng bộ Storage Bucket & CORS:** Cấu hình bucket `campaign-videos` trên Production với quyền đọc public, cấp quyền upload an toàn cho service role và Merchant; cấu hình CORS cho phép Vercel domain stream video trực tiếp.
  4. **Phối hợp Deploy Vercel Production & Khóa Domain:** Đồng bộ biến môi trường bảo mật, thiết lập `vercel.json` (HSTS, CSP, X-Frame-Options), triển khai Route Health Check `/api/health` và xác thực build Next.js 32/32 routes thành công.
  5. **Hotfix & Đồng bộ Hợp đồng Dữ liệu:** Khắc phục triệt để fallback `payment_url || booking_url`, kiểm tra hết hạn tour `valid_to` và trạng thái `status = 'active'`, bảo vệ hệ thống không bị crash unhandled.

---

## 2. THIS WEEK — MY TASKS

| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|:---:|:---:|---|:---:|---|:---:|
| **BE1-W5-01** | Setup & Migrate toàn bộ Database lên Supabase Cloud Production | **P0** | `DONE` | Code Freeze W5 | BE1 | Production DB URL, Schema & Migrations 100% khớp (21 migrations applied) | 02/11 17:00 |
| **BE1-W5-02** | Tối ưu Hiệu năng Database & Supavisor Connection Pooling cho k6 Test | **P0** | `DONE` | BE1-W5-01 | BE1 | Connection Pooler active, query latency $p95 = 17.09\text{ ms} < 20\text{ ms}$ | 03/11 12:00 |
| **BE1-W5-03** | Cấu hình Supabase Storage Production `campaign-videos` & CDN | **P1** | `DONE` | BE1-W5-01 | BE1 | Bucket public đọc, upload video mẫu thành công (HTTP 200 stream) | 03/11 17:00 |
| **BE1-W5-04** | Phối hợp triển khai Production Release lên Vercel & Kiểm tra Domain SSL | **P0** | `DONE` | UAT Pass | BE1 | `vercel.json` headers, `/api/health` endpoint, pre-flight 8/8 PASS, build Next.js 32/32 routes OK | 05/11 17:00 |
| **BE1-W5-05** | Trực chiến Hotfix backend trong phiên UAT và Smoke Test | **P1** | `DONE` | Bug reports | BE1 | Fallback `payment_url \|\| booking_url`, filter `valid_to`, bộ test 7/7 PASS | 06/11 17:00 |

---

## 3. TASK BREAKDOWN (CHI TIẾT THỰC THI)

### Task `BE1-W5-01`: Setup & Migration Supabase Cloud Production
* **Mục tiêu:** Đưa toàn bộ cấu trúc dữ liệu đã được thử nghiệm vững chắc ở môi trường dev lên database Production.
* **Các bước triển khai:**
  - [x] Khởi tạo project Supabase Cloud Production (khu vực Singapore `ap-southeast-1` tối ưu độ trễ cho Việt Nam: `ykfosnwbgphlwpufnxrd`).
  - [x] Chạy tuần tự các file migration trong `supabase/migrations/` từ Tuần 1 đến Tuần 5 (21 migrations).
  - [x] Nạp dữ liệu seed chuẩn (`supabase/seed.sql`): Thông tin tour Bà Nà Hills, Phố Cổ Hội An, tài khoản Merchant mẫu và Reseller mẫu.
  - [x] Bật extension `vector` (pgvector) cho chức năng tìm kiếm sản phẩm của AI Agent (`product_embeddings`).
* **DoD:** Toàn bộ bảng, functions, RPC ví tiền và chính sách RLS sẵn sàng hoạt động với 0 lỗi.

### Task `BE1-W5-02`: Cấu hình Supavisor Connection Pooling & Chuẩn bị k6 Test
* **Mục tiêu:** Ngăn chặn hiện tượng sập kết nối khi 1.000 VUs đồng thời truy cập.
* **Các bước triển khai:**
  - [x] Kích hoạt Supavisor Connection Pooler ở chế độ Transaction Mode (`port 6543`, `max_client_conn = 1000`).
  - [x] Rà soát và bổ sung các index che phủ (`INCLUDE`) trên bảng `clicks`, `affiliate_links`, `orders`, `commissions`.
  - [x] Chạy thử query benchmark RPC ví tiền `get_reseller_wallet_summary()` để đảm bảo thời gian thực thi $< 20\text{ ms}$ (Đạt $17.09\text{ ms}$).
* **DoD:** Database sẵn sàng tiếp nhận bài test k6 của Tester 1 vào sáng 03/11.

### Task `BE1-W5-03`: Cấu hình Supabase Storage Production `campaign-videos`
* **Mục tiêu:** Lưu trữ và phân phối video AI 9:16 cho Vercel stream trực tiếp.
* **Các bước triển khai:**
  - [x] Tạo bucket `campaign-videos` với `public = true`.
  - [x] Cấu hình file size limit 100MB và MIME types video (`video/mp4`, `video/webm`).
  - [x] Cấu hình RLS policies cho upload an toàn và đọc công khai.
* **DoD:** Video stream trực tiếp trả về HTTP 200.

### Task `BE1-W5-04`: Production Release lên Vercel & Domain/SSL/Health Readiness
* **Mục tiêu:** Phát hành ứng dụng TravelLink AI lên Internet với độ ổn định cao nhất.
* **Các bước triển khai:**
  - [x] Thiết lập `vercel.json` chứa Edge Security Headers: HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Cache-Control PWA & Service Worker.
  - [x] Xây dựng Route Health Check `/api/health` hỗ trợ cả `GET` và `HEAD` cho ping uptime và smoke test.
  - [x] Tạo script kiểm định tiền phát hành `scripts/verify-production-readiness.mjs` (`npm run verify:production`) vượt qua 8/8 bước.
  - [x] Build Next.js 16.3.8 Turbopack thành công 100% (32/32 pages và dynamic routes).
* **DoD:** Hệ thống sẵn sàng cho deployment Vercel với 0 build error.

### Task `BE1-W5-05`: Backend Hotfix & Contract Alignment
* **Mục tiêu:** Loại bỏ các nguy cơ crash runtime trong phiên UAT và đồng bộ hợp đồng dữ liệu FE/BE.
* **Các bước triển khai:**
  - [x] Hỗ trợ fallback `payment_url || booking_url` trong `src/lib/ai/checkout-url.ts` và `src/lib/ai/chat.ts`.
  - [x] Kiểm tra thời hạn tour `valid_to` và trạng thái `status = 'active'`, trả về `suggested_checkout_url: null` lịch sự khi tour hết hạn.
  - [x] Cập nhật bộ test tự động `tests/be1-w5-production-verification.test.ts` (7/7 test cases PASS).
* **DoD:** Không còn lỗi crash unhandled trong luồng tư vấn và thanh toán vé.

---

## 4. DEPENDENCY & BLOCKER ANALYSIS

| Task | Dependency | Người phụ trách | Trạng thái |
|---|---|---|:---:|
| BE1-W5-01 | Quyết định Code Freeze | PM | `DONE` |
| BE1-W5-02 | Supabase Cloud instance | BE1 | `DONE` |
| BE1-W5-03 | Supabase Storage | BE1 | `DONE` |
| BE1-W5-04 | Vercel & Health Check | BE1 | `DONE` |
| BE1-W5-05 | Contract & Hotfix | BE1 | `DONE` |

---

## 5. TEAM HANDOFF

| From | To | Deliverable | Format | Deadline |
|---|---|---|---|:---:|
| BE1 Lead | QA Lead (Tester 1) | Connection String & Staging/Production DB URL để chạy k6 | Credentials an toàn | 03/11 08:30 |
| BE1 Lead | QA Lead (Tester 1) | Endpoint Health Check `/api/health` cho Smoke Test | REST / HEAD | 03/11 14:00 |
| BE1 Lead | FE Lead (Diệu) | Production API Endpoints, Supabase Keys & Checkout Fallback | Env Vars template | 03/11 12:00 |
| BE1 Lead | Toàn team | Live Production Release Readiness Report | Markdown Report | 03/11 17:00 |
