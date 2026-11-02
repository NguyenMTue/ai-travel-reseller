# MY WORK PLAN — BE1_W5
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 5 (02/11/2026 – 07/11/2026) — Sprint 5 (Sprint Cuối / Final Sprint)  
**Member:** Nguyễn Minh Tuệ (Backend 1 Lead kiêm Project Manager)  
**Role:** Backend Developer 1 (Database Architect, Supabase Cloud, Connection Pooling & Production Deployment)  
**Current Milestone:** FINAL E2E UAT, PERFORMANCE STRESS TESTING, RLS SECURITY AUDIT & PRODUCTION GO-LIVE  
**Deadline:** 17:00 Thứ Bảy (07/11/2026)  
**Branch:** `feature/be1-w5-supabase-cloud-and-perf` (giai đoạn 1 trước 03/11, tách từ `dev`)  

---

## 1. Context & Trọng tâm Kỹ thuật Sprint 5
- Kế thừa thành quả Sprint 4: Nâng cấp hoàn tất Core Video Engine v2 với chuyển động Parallax 2.5D, Auto-Ducking 3 lớp đạt điểm 9.4/10 theo Rubric QA; kết xuất thành công 02 video mẫu Bà Nà Hills và Hội An.
- **Trọng tâm BE1 trong Tuần 5 — Hoàn thiện Hạ tầng Production & Chịu tải cao:**
  1. **Thiết lập Hạ tầng Cơ sở Dữ liệu Supabase Cloud Production:** Triển khai toàn bộ migrations (schema, tables, RPC ví tiền, functions đối soát hoa hồng, RLS policies, trigger xác thực, pgvector extension) lên instance Supabase Cloud Production.
  2. **Cấu hình Connection Pooling (Supavisor) phục vụ k6 Load Test:** Tối ưu hóa số lượng kết nối đồng thời qua connection pooler cổng 6543, đảm bảo hệ thống phục vụ mượt mà $1.000$ virtual users (VUs) mà không bị nghẽn connection hoặc timeout.
  3. **Đồng bộ Storage Bucket & CORS:** Cấu hình bucket `campaign-videos` trên Production với quyền đọc public, cấp quyền upload an toàn cho service role và Merchant; cấu hình CORS cho phép Vercel domain stream video trực tiếp.
  4. **Phối hợp Deploy Vercel Production & Khóa Domain:** Đồng bộ biến môi trường bảo mật, kích hoạt SSL/TLS và thực hiện smoke test database sau khi deploy.

---

## 2. THIS WEEK — MY TASKS

| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|:---:|:---:|---|:---:|---|:---:|
| **BE1-W5-01** | Setup & Migrate toàn bộ Database lên Supabase Cloud Production | **P0** | `DONE` | Code Freeze W5 | BE1 | Production DB URL, Schema & Migrations 100% khớp | 02/11 17:00 |
| **BE1-W5-02** | Tối ưu Hiệu năng Database & Supavisor Connection Pooling cho k6 Test | **P0** | `DONE` | BE1-W5-01 | BE1 | Connection Pooler active, query latency $p95 = 17.09\text{ ms} < 20\text{ ms}$ | 03/11 12:00 |
| **BE1-W5-03** | Cấu hình Supabase Storage Production `campaign-videos` & CDN | **P1** | `DONE` | BE1-W5-01 | BE1 | Bucket public đọc, upload video mẫu thành công | 03/11 17:00 |
| **BE1-W5-04** | Phối hợp triển khai Production Release lên Vercel & Kiểm tra Domain SSL | **P0** | `READY` | UAT Pass | BE1 | URL Production chính thức hoạt động 24/7 | 05/11 17:00 |
| **BE1-W5-05** | Trực chiến Hotfix backend trong phiên UAT và Smoke Test | **P1** | `READY` | Bug reports | BE1 | Zero critical database / API bugs | 06/11 17:00 |

---

## 3. TASK BREAKDOWN (CHI TIẾT THỰC THI)

### Task `BE1-W5-01`: Setup & Migration Supabase Cloud Production
* **Mục tiêu:** Đưa toàn bộ cấu trúc dữ liệu đã được thử nghiệm vững chắc ở môi trường dev lên database Production.
* **Các bước triển khai:**
  - [ ] Khởi tạo project Supabase Cloud Production (khu vực Singapore `ap-southeast-1` tối ưu độ trễ cho Việt Nam).
  - [ ] Chạy tuần tự các file migration trong `supabase/migrations/` từ Tuần 1 đến Tuần 4.
  - [ ] Nạp dữ liệu seed chuẩn (`supabase/seed.sql`): Thông tin tour Bà Nà Hills, Phố Cổ Hội An, tài khoản Merchant mẫu và Reseller mẫu.
  - [ ] Bật extension `vector` (pgvector) cho chức năng tìm kiếm sản phẩm của AI Agent.
* **DoD:** Toàn bộ bảng, functions, RPC ví tiền và chính sách RLS sẵn sàng hoạt động với 0 lỗi.

### Task `BE1-W5-02`: Cấu hình Supavisor Connection Pooling & Chuẩn bị k6 Test
* **Mục tiêu:** Ngăn chặn hiện tượng sập kết nối khi 1.000 VUs đồng thời truy cập.
* **Các bước triển khai:**
  - [ ] Kích hoạt Supavisor Connection Pooler ở chế độ Transaction Mode (`port 6543`).
  - [ ] Rà soát các index trên bảng `clicks`, `affiliate_links`, `orders`, `commissions`.
  - [ ] Chạy thử query benchmark RPC ví tiền `get_reseller_wallet_summary()` để đảm bảo thời gian thực thi $< 20\text{ ms}$.
* **DoD:** Database sẵn sàng tiếp nhận bài test k6 của Tester 1 vào sáng 03/11.

### Task `BE1-W5-04`: Production Release lên Vercel
* **Mục tiêu:** Phát hành ứng dụng TravelLink AI lên Internet với độ ổn định cao nhất.
* **Các bước triển khai:**
  - [ ] Khóa nhánh `main`, tạo release tag `v1.0.0-mvp`.
  - [ ] Cấu hình Production Environment Variables trên Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `POSTHOG_KEY`.
  - [ ] Gắn custom domain chính thức, kiểm tra cấu hình DNS và chứng chỉ SSL Let's Encrypt.
* **DoD:** Truy cập domain chính thức mượt mà, không gặp lỗi 500 hay lỗi kết nối cơ sở dữ liệu.

---

## 4. DEPENDENCY & BLOCKER ANALYSIS

| Task | Dependency | Người phụ trách | Trạng thái |
|---|---|---|:---:|
| BE1-W5-01 | Quyết định Code Freeze | PM | `READY` |
| BE1-W5-02 | Supabase Cloud instance | BE1 | `WAITING` |
| BE1-W5-04 | Kết quả UAT Pass | BA, QA Lead | `WAITING` |

---

## 5. TEAM HANDOFF

| From | To | Deliverable | Format | Deadline |
|---|---|---|---|:---:|
| BE1 Lead | QA Lead (Tester 1) | Connection String & Staging/Production DB URL để chạy k6 | Credentials an toàn | 03/11 08:30 |
| BE1 Lead | FE Lead (Diệu) | Production API Endpoints & Supabase Keys | Env Vars template | 03/11 12:00 |
| BE1 Lead | Toàn team | Live Production URL | Web URL & Status dashboard | 05/11 17:00 |

