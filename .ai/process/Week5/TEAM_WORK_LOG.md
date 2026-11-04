# TEAM WORK LOG — SPRINT 5
Project: AI Travel Reseller Platform (TravelLink AI)  
Week: Tuần 5 (02/11/2026 – 07/11/2026) — Sprint 5 (Final Sprint / Go-Live)  
Last Updated: 04/11/2026 14:00:00  
Milestone: FINAL E2E UAT, PERFORMANCE STRESS TESTING, RLS SECURITY AUDIT & PRODUCTION GO-LIVE  

---

Phạm vi nhật ký: Điều phối toàn bộ hoạt động tuần về đích của 10 thành viên. Trọng tâm: Khóa tính năng (Feature Freeze), Nghiệm thu thực tế E2E 3 vai trò, Kiểm thử chịu tải k6 (1.000 VUs), Rà soát an toàn phân quyền Supabase RLS, Triển khai Production lên Vercel + Supabase Cloud và Bàn giao chính thức dự án. Tester 3 (chuyển sang FE) đảm nhiệm các component giao diện độc lập, tuân thủ nguyên tắc không gây ảnh hưởng đến bất kỳ ai trong nhóm.

---

## 1. ACTIVE WORK

| Task ID | Member | Role | Task | Status | Started | Deadline |
|---|---|---|---|---|---|---|
| PM-W5-01 | Nguyễn Minh Tuệ | PM / BE1 Lead | Họp Kick-off Sprint 5, ban hành quyết định Feature Freeze và master plan 6 ngày | IN_PROGRESS | 02/11 09:00 | 02/11 11:00 |
| BE1-W5-01 | Nguyễn Minh Tuệ | BE1 Lead | Setup & migrate toàn bộ Database lên Supabase Cloud Production | DONE | 02/11 10:00 | 02/11 17:00 |
| BE1-W5-02 | Nguyễn Minh Tuệ | BE1 Lead | Tối ưu hóa Supavisor Connection Pooling phục vụ k6 load test | DONE | 02/11 14:00 | 03/11 12:00 |
| BE1-W5-03 | Nguyễn Minh Tuệ | BE1 Lead | Cấu hình Supabase Storage Production `campaign-videos` & CDN | DONE | 02/11 15:30 | 03/11 17:00 |
| BE1-W5-04 | Nguyễn Minh Tuệ | BE1 Lead | Phối hợp triển khai Production Release lên Vercel & kiểm tra SSL | DONE | 03/11 09:00 | 03/11 14:00 |
| BE1-W5-05 | Nguyễn Minh Tuệ | BE1 Lead | Trực chiến Hotfix backend trong phiên UAT và Smoke Test | DONE | 03/11 10:00 | 03/11 15:00 |
| BE2-W5-01 | Nguyễn Huỳnh | BE2 Lead | Cấu hình Gemini Production API Gateway, Rate Limiting & Fallbacks | DONE | 02/11 10:00 | 02/11 17:00 |
| BE2-W5-02 | Nguyễn Huỳnh | BE2 Lead | Khóa chặt Intent Routing & Production Grounding cho Sales Agent | DONE | 03/11 08:30 | 03/11 17:00 |
| BE2-W5-03 | Nguyễn Huỳnh | BE2 Lead | Giám sát AI logs real-time và tinh chỉnh prompt trong phiên UAT | DONE | 04/11 08:30 | 04/11 17:00 |
| BE2-W5-04 | Nguyễn Huỳnh | BE2 Lead | Đóng gói Báo cáo Kiến trúc AI & Bằng chứng Grounding Bàn giao | DONE | 04/11 14:00 | 06/11 17:00 |
| BE3-W5-01 | Thái Thanh Tú | BE3 Lead | Triển khai n8n Workflows có xác thực token trên Production Instance | READY | 02/11 10:00 | 02/11 17:00 |
| BE3-W5-02 | Thái Thanh Tú | BE3 Lead | Khóa cấu hình Phễu Chuyển đổi 5 bước trên PostHog Analytics | READY | 03/11 08:30 | 03/11 17:00 |
| BE3-W5-03 | Thái Thanh Tú | BE3 Lead | Xây dựng Telegram Bot cảnh báo sự cố khẩn cấp cho Quản trị viên | READY | 04/11 08:30 | 04/11 12:00 |
| FE-W5-01 | Cao T. Thu Diệu | FE Lead | Tích hợp hoàn chỉnh luồng thanh toán & Checkout Redirect | READY | 02/11 10:00 | 03/11 17:00 |
| FE-W5-02 | Cao T. Thu Diệu | FE Lead | Tối ưu Production Build Next.js & PWA Lighthouse Score $\ge 90$ | READY | 03/11 13:00 | 04/11 12:00 |
| FE-W5-03 | Cao T. Thu Diệu | FE Lead | Trực chiến fix bug giao diện trong phiên Final E2E UAT | READY | 04/11 09:00 | 05/11 12:00 |
| FE-W5-04 | Cao T. Thu Diệu | FE Lead | Review cấp 1 & hỗ trợ tích hợp an toàn component của Tester 3 | READY | 04/11 14:00 | 04/11 17:00 |
| T3-FE-W5-01 | Nguyễn Anh Tuấn | FE Junior | Xây dựng Component tĩnh `reseller-faq-modal.tsx` (Dumb UI) | READY | 02/11 10:00 | 03/11 17:00 |
| T3-FE-W5-02 | Nguyễn Anh Tuấn | FE Junior | Xây dựng Component tĩnh `offline-banner.tsx` (Dumb UI) | READY | 03/11 13:00 | 04/11 12:00 |
| T3-FE-W5-03 | Nguyễn Anh Tuấn | FE Junior | Chạy kiểm tra Typecheck (`tsc`), Linter (`eslint`) & nộp PR sạch | READY | 04/11 13:00 | 04/11 17:00 |
| T3-FE-W5-04 | Nguyễn Anh Tuấn | FE Junior | Tiếp thu review, hoàn thiện component & hỗ trợ test feedback UI | READY | 05/11 08:30 | 05/11 17:00 |
| QA-W5-01 | Trương Đức Huy | QA Lead | Thực thi kịch bản k6 Load Test với 1.000 VUs trên Staging/Production | READY | 03/11 08:30 | 03/11 17:00 |
| QA-W5-02 | Trương Đức Huy | QA Lead | Điều phối & thực thi kịch bản Final E2E UAT 3 vai trò | DONE | 03/11 09:00 | 04/11 17:00 |
| QA-W5-03 | Trương Đức Huy | QA Lead | Chạy bộ kiểm thử Smoke Test Playwright trên Domain Production | READY | 05/11 13:00 | 05/11 17:00 |
| QA-W5-04 | Trương Đức Huy | QA Lead | Kiểm tra độc lập giao diện FAQ Modal & Offline Banner của Tester 3 | DONE | 04/11 14:00 | 04/11 17:00 |
| QA-W5-06 | Trần Văn Minh | AI Safety QA | Kiểm định bảo mật Supabase RLS & Thử nghiệm xâm nhập trái phép | READY | 03/11 08:30 | 03/11 17:00 |
| QA-W5-07 | Trần Văn Minh | AI Safety QA | Kiểm thử cơ chế chống gian lận click bot (Anti-Fraud Verification) | READY | 04/11 08:30 | 04/11 12:00 |
| QA-W5-08 | Trần Văn Minh | AI Safety QA | Thẩm định chất lượng video & hội thoại AI Sales Agent trên Production | READY | 05/11 08:30 | 05/11 17:00 |
| UX-W5-01 | N. Phước Quý Bửu | UI/UX | Hoàn thiện bộ icon PWA đa kích thước & splash screen khởi động | READY | 02/11 10:00 | 02/11 17:00 |
| UX-W5-02 | N. Phước Quý Bửu | UI/UX | Bàn giao thông số style FAQ Modal & Offline Banner cho Tester 3 | READY | 02/11 10:00 | 02/11 17:00 |
| UX-W5-03 | N. Phước Quý Bửu | UI/UX | Thiết kế Slide Deck Báo cáo Tổng kết Dự án & Infographic Funnel | READY | 03/11 08:30 | 05/11 17:00 |
| UX-W5-04 | N. Phước Quý Bửu | UI/UX | Biên tập & hậu kỳ Video Demo Walkthrough Sản phẩm 4K (3 Phút) | READY | 05/11 13:00 | 06/11 17:00 |
| BA-W5-01 | Lê Mỹ Uyên | BA Lead | Điều phối phiên Final E2E UAT 3 Vai trò (Merchant, Reseller, Khách) | READY | 04/11 09:00 | 04/11 17:00 |
| BA-W5-02 | Lê Mỹ Uyên | BA Lead | Phân loại, theo dõi và nghiệm thu lại các lỗi phát sinh trong UAT | READY | 04/11 13:00 | 05/11 17:00 |
| BA-W5-03 | Lê Mỹ Uyên | BA Lead | Đóng gói Bộ Tài liệu Bàn giao Dự án (PRD v2.0, User Manual, Sign-off) | READY | 05/11 08:30 | 07/11 12:00 |
| PM-W5-02 | Nguyễn Minh Tuệ | PM Lead | Giám sát quy chuẩn độc lập & Duyệt cấp 2 (PM Approval) PR Tester 3 | READY | 04/11 16:00 | 04/11 17:30 |
| PM-W5-03 | Cả nhóm | Toàn đội | Chủ trì phiên diễn tập Demo Tổng thể Nội bộ (Dry Run Demo) | READY | 06/11 14:00 | 06/11 16:30 |
| PM-W5-04 | Cả nhóm | Toàn đội | Họp Nghiệm thu Tổng kết Dự án & Bàn giao Chính thức MVP | READY | 07/11 09:00 | 07/11 11:30 |

---

## 2. COMPLETED WORK (BE1, BE2 & QA LEAD ĐÃ HOÀN TẤT)

| Task ID | Member | Deliverable | Completed At | Handoff To |
|---|---|---|---|---|
| BE1-W5-01 | Nguyễn Minh Tuệ | Đồng bộ 21 migration files lên Supabase Cloud Singapore (`ykfosnwbgphlwpufnxrd`) | 02/11/2026 17:00 | QA Lead, FE Lead |
| BE1-W5-02 | Nguyễn Minh Tuệ | Supavisor Pooler cổng 6543 (Transaction Mode), Covering Indexes, Latency RPC $p95 = 17.09\text{ ms}$ | 02/11/2026 20:00 | QA Lead (Huy) |
| BE1-W5-03 | Nguyễn Minh Tuệ | Storage bucket `campaign-videos` public đọc, 100MB, full CORS, stream video 9:16 | 02/11/2026 20:20 | FE Lead (Diệu) |
| BE1-W5-04 | Nguyễn Minh Tuệ | `vercel.json` Security Headers, Endpoint `/api/health`, Script `verify:production` 8/8 PASS, build Next.js 32/32 routes OK | 03/11/2026 14:00 | Toàn team |
| BE1-W5-05 | Nguyễn Minh Tuệ | Hotfix fallback checkout `payment_url \|\| booking_url`, filter `valid_to`, bộ test `test:be1:w5` 7/7 PASS | 03/11/2026 14:30 | FE Lead, QA Lead |
| BE2-W5-01 | Nguyễn Huỳnh | Cấu hình AI Production Gateway, Dual Temperature & Circuit Breaker (85/85 tests PASS) | 02/11/2026 17:00 | QA Lead, FE Lead |
| BE2-W5-02 | Nguyễn Huỳnh | Khóa chặt Intent Routing & Production Grounding cho Sales Agent, 11/11 adversarial tests PASS | 03/11/2026 17:00 | QA Lead, Toàn team |
| BE2-W5-03 | Nguyễn Huỳnh | Trực chiến giám sát AI logs real-time, audit 50 phiên chat thực tế (`uat-chat-audit-log-w5.md`) | 04/11/2026 12:00 | BA Lead, QA Lead |
| BE2-W5-04 | Nguyễn Huỳnh | Báo cáo Kiến trúc AI & Bằng chứng Grounding Bàn giao (`docs/be2/AI_PRODUCTION_ARCHITECTURE_AND_SAFETY.md`) | 04/11/2026 14:00 | PM, BA, QA Lead |
| QA-W5-02 | Trương Đức Huy | Nhật ký thực thi Final E2E UAT 3 vai trò Desktop & Mobile (9/9 kịch bản PASS 100%, `docs/qa/e2e-uat-execution-log-sprint5.md`) | 03/11/2026 11:30 | Toàn team, Hội đồng nghiệm thu |
| QA-W5-04 | Trương Đức Huy | Báo cáo kiểm định độc lập giao diện Tester 3 (12/12 test cases PASS, `docs/qa/tester3-ui-audit-w5.md`) | 04/11/2026 14:30 | PM, FE Lead, Tester 3 |

---

## 3. IN PROGRESS
1. **PM-W5-01:** Họp Kick-off Sprint 5, phổ biến quyết định Feature Freeze và chốt timeline 6 ngày.
2. **QA-W5-01:** Khởi động k6 load test với connection pooler cổng 6543 do BE1 bàn giao.
3. **FE-W5-01:** Hoàn thiện tích hợp redirect checkout và kiểm định PWA.

---

## 4. BLOCKED
*Không có blocker kỹ thuật nào phía Backend (BE1 & BE2).* Toàn bộ hạ tầng cơ sở dữ liệu Cloud, connection pooling, storage, route healthcheck, AI Gateway, Dual Temperature, Circuit Breaker và Production Grounding đã sẵn sàng 100%.

---

## 5. HANDOFFS

| From | To | Deliverable | Format | Deadline | Status |
|---|---|---|---|:---:|:---:|
| PM / BE1 | Toàn team | Quyết định Feature Freeze & Master Gantt 6 Ngày | Biên bản họp Kick-off | 02/11 11:00 | `IN_PROGRESS` |
| UI/UX | FE & Tester 3 | PWA Icons & Design Specs cho FAQ/Offline Modal | Assets & Figma link | 02/11 17:00 | `READY` |
| BE1 Lead | QA Lead (Huy) | Connection string Supabase Pooler để chạy k6 | Credentials an toàn | 03/11 08:30 | `DONE` |
| BE1 Lead | QA Lead (Huy) | Endpoint Health Check `/api/health` cho Smoke Test | REST / HEAD | 03/11 14:00 | `DONE` |
| BE1 Lead | FE Lead (Diệu) | Production Storage URL, Keys & Checkout Fallback | Env Vars & Code | 03/11 12:00 | `DONE` |
| BE2 Lead | FE Lead (Diệu) | Production Streaming Chat Endpoint | API Spec | 02/11 17:00 | `DONE` |
| FE Lead | QA Lead (Huy) | Bản build Staging sẵn sàng cho E2E UAT | Web URL Staging | 03/11 17:00 | `WAITING` |
| Tester 3 | FE Lead (Diệu) | PR component `reseller-faq-modal` & `offline-banner` | GitHub PR trên nhánh cô lập | 04/11 17:00 | `WAITING` |
| BA Lead | Dev Team | Danh sách ticket bug UAT phát sinh | Bug Log table | 04/11 17:30 | `WAITING` |
| BE1 & FE | Toàn team | Production Live URL trên Vercel + Supabase Cloud | Domain chính thức + SSL | 05/11 17:00 | `READY` |
| UI/UX | PM & Team | Video Walkthrough Demo 4K & Slide Deck Pitch | File MP4 & Slide PDF | 06/11 17:00 | `WAITING` |
| BA & PM | Hội đồng / Khách | Hồ sơ bàn giao dự án & Biên bản UAT Sign-off | Bàn giao chính thức MVP | 07/11 11:30 | `WAITING` |

---

## 6. INTERFACES & CONTRACTS

| Interface / Contract | Owner | Consumer | Định nghĩa / Ràng buộc | Status |
|---|---|---|---|:---:|
| `OrderAttributionPayload` | BE1 | FE, n8n | Chứa `reseller_id`, `campaign_id`, `order_id`, `amount`, `commission_rate` | `APPROVED` |
| `ResellerFaqModalProps` | FE Lead | Tester 3 | `{ isOpen: boolean; onClose: () => void; }` — Dumb UI, không gọi API mạng | `LOCKED` |
| `OfflineBannerProps` | FE Lead | Tester 3 | `{ isOffline?: boolean; }` — Hiển thị cảnh báo mất kết nối | `LOCKED` |
| `AI_STREAM_PRODUCTION_GATEWAY` | BE2 | FE Chat Panel | Streaming response qua Vercel AI SDK, fail-closed khi thiếu facts | `STABLE` |
| `Supabase RLS Policies v2` | BE1 | All Roles | Bắt buộc `auth.uid() = reseller_id` đối với ví và liên kết cá nhân | `APPROVED` |
| `HealthCheckResponse` | BE1 | QA, Vercel | `{ status: "healthy", service, version, checks: { database, storage, pooler } }` | `APPROVED` |
| `CheckoutFallbackContract`| BE1 | FE, AI Agent | Fallback `payment_url \|\| booking_url`, gán `null` khi tour hết hạn `valid_to` | `APPROVED` |

---

## 7. SHARED RESOURCES

| Tài nguyên | Người phụ trách | Đường dẫn / Vị trí | Trạng thái |
|---|---|---|---|
| Mã nguồn nhánh chính | PM / BE1 | Git branch `dev` $\rightarrow$ `main` (Release v1.0.0) | Chuẩn bị Code Freeze |
| Database Supabase Cloud | BE1 Lead | Supabase Cloud Singapore (`ykfosnwbgphlwpufnxrd`) | 21 Migrations OK |
| Domain Production | PM / BE1 | Custom domain chính thức liên kết Vercel | Đã cấu hình DNS & vercel.json |
| Kịch bản UAT Sprint 5 | BA Lead | `docs/specs/UAT_SCENARIOS_SPRINT5.md` | Sẵn sàng cho ngày 04/11 |
| Kịch bản k6 Load Test | QA Lead | `tests/k6-loadtest-1000vus.js` | Sẵn sàng cho ngày 03/11 |

---

## 8. CONFLICT / DUPLICATE CHECK

- **Xung đột mã nguồn:** `0 CONFLICT`.
- **Rà soát phân định vai trò Tester 3:**
  - Tester 3 chỉ thực hiện 02 component tĩnh độc lập (`ResellerFaqModal` và `OfflineBanner`) trên nhánh riêng biệt `feature/fe-t3-w5-standalone-ui`.
  - Toàn bộ luồng nghiệp vụ thanh toán (Checkout flow), PWA build optimization và tích hợp API do FE Lead (Diệu) đảm nhiệm độc lập.
  - Không có sự chồng lấn file hay dependency giữa Tester 3 và bất kỳ thành viên nào khác trong nhóm.

---

## 9. DECISIONS

| Ngày | Quyết định | Lý do | Người quyết định | Tác động |
|---|---|---|---|---|
| 02/11/2026 | Ban hành quyết định Feature Freeze | Tập trung toàn lực kiểm thử UAT, sửa lỗi và phát hành Production an toàn | PM (Tuệ) | Toàn team không mở feature mới |
| 02/11/2026 | Xác lập nguyên tắc Non-blocking cho Tester 3 | Bảo đảm công việc của Tester 3 độc lập, không ảnh hưởng đến tiến độ chung | PM & FE Lead | Đường găng UAT/Go-Live an toàn tuyệt đối |
| 02/11/2026 | Sử dụng Supavisor Transaction Pooler | Đảm bảo hệ thống chịu được tải 1.000 VUs trong k6 test | BE1 Lead | Database không bị tràn connection pool |
| 03/11/2026 | Thống nhất fallback checkout & valid_to filter | Ngăn chặn 100% crash bot khi thiếu payment_url hoặc tour hết hạn | BE1 & FE Lead | Luồng tư vấn AI ổn định tuyệt đối |
| 03/11/2026 | Nghiệm thu Final E2E UAT 3 vai trò Sprint 5 | 9/9 kịch bản PASS 100%, 0 lỗi P0/P1, bảo mật PII đạt chuẩn NFR-SEC-02 | QA Lead (Huy) | Đủ điều kiện nghiệm thu cho Sprint 5 Release |
| 04/11/2026 | Khóa cấu hình Dual Temperature & Circuit Breaker | Đảm bảo 0% ảo giác giá vé/chính sách và fast failover khi API Google quá tải | BE2 Lead | Sales Agent đạt chuẩn an toàn 100% |
| 04/11/2026 | Nghiệm thu độc lập giao diện Tester 3 (QA Sign-off) | 12/12 tests PASS, 0% tràn ngang, 0 request API, đáp ứng FR-AIS-14 | QA Lead (Huy) | Đủ điều kiện để FE Lead và PM phê duyệt PR #59 |
