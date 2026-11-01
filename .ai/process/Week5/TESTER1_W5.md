# MY WORK PLAN — TESTER1_W5
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 5 (02/11/2026 – 07/11/2026) — Sprint 5 (Sprint Cuối / Final Sprint)  
**Member:** Trương Đức Huy (QA Lead & Hybrid Test)  
**Role:** QA Lead (Performance Stress Testing, Final E2E UAT Execution & Production Smoke Test)  
**Current Milestone:** FINAL E2E UAT, PERFORMANCE STRESS TESTING, RLS SECURITY AUDIT & PRODUCTION GO-LIVE  
**Deadline:** 17:00 Thứ Bảy (07/11/2026)  
**Branch:** `feature/qa-w5-e2e-uat-loadtest` (tách từ `dev`)  

---

## 1. Context & Trọng tâm Kiểm thử Sprint 5
- Kế thừa thành quả Sprint 4: Đã soạn thảo sẵn sàng kịch bản End-to-End Test Plan cho Tuần 5 (`docs/qa/e2e-uat-test-plan-sprint5.md`), xác thực hiển thị video 9:16 và tải MP4 mượt mà trên iPhone/Android qua Cloudflared tunnel C3 (PR #51).
- **Trọng tâm QA Lead trong Tuần 5 — Bảo chứng Chất lượng Sản phẩm Toàn diện:**
  1. **Thực thi Kiểm thử Chịu tải cao (k6 Stress Testing):** Chạy kịch bản 1.000 người dùng ảo đồng thời truy cập vào route tiếp thị `/r/[code]`, chuyển hướng sang landing page và gọi API feed; đo lường độ trễ $p95 < 200\text{ ms}$, tỷ lệ lỗi $0\%$.
  2. **Thực thi Kịch bản Final E2E UAT 3 Vai trò trên Thiết bị Thật:** Cùng BA điều phối người dùng chạy thử chuỗi giá trị trên Desktop Web và Mobile PWA (iOS Safari / Android Chrome Standalone).
  3. **Chạy Playwright Smoke Test trên Môi trường Production:** Ngay sau khi BE1 và DevOps deploy lên Vercel Production, chạy bộ kiểm thử tự động xác nhận 100% các màn hình chính (Landing, Login, Merchant Portal, Reseller Feed, Chatbot, Video Player) hoạt động thông suốt.
  4. **Kiểm tra Giao diện Độc lập của Tester 3 (FE phụ):** Thực hiện kiểm tra nhanh độ tương thích responsive của các component độc lập (`ResellerFaqModal`, `OfflineBanner`) trên các kích thước màn hình nhỏ $375\text{px}$ (iPhone SE) mà không làm ảnh hưởng tiến độ chung.

---

## 2. THIS WEEK — MY TASKS

| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|:---:|:---:|---|:---:|---|:---:|
| **QA-W5-01** | Thực thi Kịch bản k6 Load Test với 1.000 VUs trên Staging/Production | **P0** | `READY` | BE1 DB Pooling | Tester 1 | Báo cáo hiệu năng k6 Load Test Latency & Throughput | 03/11 17:00 |
| **QA-W5-02** | Điều phối & Thực thi Kịch bản Final E2E UAT 3 Vai trò (Desktop & Mobile) | **P0** | `READY` | E2E code ready | Tester 1 | Báo cáo thực thi E2E Test Execution Log Sprint 5 | 04/11 17:00 |
| **QA-W5-03** | Chạy Bộ Kiểm thử Smoke Test Tự động Playwright trên Domain Production | **P0** | `READY` | Deploy Vercel | Tester 1 | Báo cáo Playwright Production Smoke Test PASS 100% | 05/11 17:00 |
| **QA-W5-04** | Kiểm tra độc lập giao diện FAQ Modal & Offline Banner của Tester 3 | **P2** | `READY` | PR Tester 3 | Tester 1 | UI Audit checklist cho component tĩnh | 04/11 17:00 |
| **QA-W5-05** | Đóng gói Báo cáo Tổng kết Đảm bảo Chất lượng Dự án (Final QA Report) | **P1** | `READY` | Hoàn thành UAT | Tester 1 | `docs/qa/FINAL_QA_AND_PERFORMANCE_REPORT_SPRINT5.md` | 06/11 17:00 |

---

## 3. TASK BREAKDOWN (CHI TIẾT THỰC THI)

### Task `QA-W5-01`: Thực thi k6 Load Test (1.000 Virtual Users)
* **Mục tiêu:** Chứng minh hệ thống không bị nghẽn mạch hay quá tải khi chiến dịch marketing bùng nổ traffic.
* **Kịch bản:**
  - Ramp-up từ 0 lên 200 VUs trong 30 giây.
  - Tăng lên 1.000 VUs trong 2 phút, duy trì áp lực trong 3 phút.
  - Ramp-down về 0 trong 30 giây.
* **Chỉ số đo lường:**
  - HTTP failure rate $< 0.1\%$.
  - HTTP request duration $p95 < 200\text{ ms}$, $p99 < 500\text{ ms}$.
* **DoD:** Xuất biểu đồ và bảng số liệu hiệu năng k6 đưa vào báo cáo nghiệm thu kỹ thuật.

### Task `QA-W5-02`: Final E2E UAT Execution trên Thiết bị Thật
* **Thiết bị kiểm thử:**
  - iPhone 14 Pro (iOS 17, Safari PWA Standalone).
  - Samsung Galaxy S23 (Android 14, Chrome PWA Standalone).
  - MacBook / Windows PC (Chrome, Safari, Edge).
* **Các kịch bản kiểm thử:**
  - Đăng ký / Đăng nhập Merchant $\rightarrow$ Upload video mẫu $\rightarrow$ Kích hoạt render video AI.
  - Đăng nhập Reseller $\rightarrow$ Thêm PWA vào màn hình chính $\rightarrow$ Copy link tiếp thị & video MP4.
  - Khách hàng bấm link $\rightarrow$ Chat với bot $\rightarrow$ Điều hướng checkout $\rightarrow$ Kiểm tra số dư ví Reseller tăng chính xác.
* **DoD:** Không phát hiện bất kỳ lỗi mức độ Critical hay High nào trong luồng chính.

### Task `QA-W5-03`: Playwright Production Smoke Test
* **Mục tiêu:** Tự động hóa kiểm tra sau triển khai (Post-Deployment Verification).
* **DoD:** Toàn bộ test cases trong `tests/production-smoke.spec.ts` đạt kết quả xanh (Green PASS 100%).

---

## 4. DEPENDENCY ANALYSIS

| Task | Dependency | Người phụ trách | Trạng thái |
|---|---|---|:---:|
| QA-W5-01 | Setup Supabase Connection Pooler | BE1 Lead | `READY` |
| QA-W5-02 | Giao diện thanh toán & Chatbot | FE Lead, BE2 | `WAITING` |
| QA-W5-03 | Production Deploy URL Vercel | BE1, FE Lead | `WAITING` |

---

## 5. TEAM HANDOFF

| From | To | Deliverable | Format | Deadline |
|---|---|---|---|:---:|
| QA Lead | BE1 & PM | Báo cáo kết quả k6 Load Test 1.000 VUs | Markdown & Biểu đồ k6 | 03/11 17:00 |
| QA Lead | BA & Devs | Danh sách bug UAT cần hotfix khẩn cấp | Bug log table | 04/11 17:30 |
| QA Lead | Toàn team | Báo cáo Smoke Test Production hoàn chỉnh | Playwright Test Report | 05/11 17:00 |

