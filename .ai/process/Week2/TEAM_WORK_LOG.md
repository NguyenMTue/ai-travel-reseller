# TEAM WORK LOG
Project: AI Travel Reseller MVP (TravelLink AI)  
Week: Tuần 2 — 12/10/2026 – 16/10/2026 (Sprint 2)  
Last Updated: 16/10/2026 11:07 AM

---

Phạm vi nhật ký: Đồng bộ tiến độ toàn diện của 9 thành viên trong đội ngũ Tuần 2 (Milestone: AI Content Factory & Distribution). Đây là bảng điều phối trung tâm chống xung đột giao diện, duplicate task và quản lý luồng bàn giao.

---

## 1. ACTIVE WORK
| Task ID | Member | Role | Task | Status | Started | Deadline |
|---|---|---|---|---|---|---|
| BE1-W2-01/02 | Nguyễn Minh Tuệ | BE1 | Migration & API tạo Tracking Link định danh | DONE | 12/10 | 13/10 17:00 |
| BE1-W2-03 | Nguyễn Minh Tuệ | BE1 | Database Trigger `on_campaign_created` (pg_net) sang n8n | DONE | 12/10 | 13/10 17:00 |
| BE1-W2-04 | Nguyễn Minh Tuệ | BE1 | Redirect Router `/r/[code]` & Click Tracking | DONE | 13/10 | 14/10 17:00 |
| BE1-W2-05 | Nguyễn Minh Tuệ | BE1 | Cấu hình RLS Policies cho `affiliate_links` & `clicks` | DONE | 13/10 | 15/10 12:00 |
| BE1-W2-06 | Nguyễn Minh Tuệ | BE1 | Tối ưu hóa truy vấn Feed & Hỗ trợ tích hợp kỹ thuật E2E | DONE | 13/10 | 13/10 21:30 |
| BE1-W2-07 | Nguyễn Minh Tuệ | BE1 | Migration Clicks Anti-Fraud & Cập nhật Trigger thống kê click hợp lệ | DONE | 14/10 | 14/10 11:15 |
| BE1-W2-08 | Nguyễn Minh Tuệ | BE1 | Module Lọc Bot & Parser Thiết bị trong Router `/r/[code]` | DONE | 14/10 | 14/10 11:30 |
| BE1-W2-09 | Nguyễn Minh Tuệ | BE1 | Bộ Postgres RPC Hàm Thống Kê Nhanh (Analytics RPCs) | DONE | 14/10 | 14/10 11:45 |
| BE1-W2-10 | Nguyễn Minh Tuệ | BE1 | API Quản Lý & Báo Cáo cho Reseller Dashboard (`/api/reseller/*`) | DONE | 14/10 | 14/10 12:00 |
| BE1-W2-11 | Nguyễn Minh Tuệ | BE1 | Trigger hòa giải tạm thời bảng `contents` cho BE3 & Fix Auth Bypass | DONE | 15/10 | 16/10 10:00 |
| BE2-W2-01 | Nguyễn Huỳnh | BE2 | Prompt System phân theo 4 Personas du lịch | DONE | 12/10 | 12/10 17:00 |
| BE2-W2-02/03 | Nguyễn Huỳnh | BE2 | Zod Structured Output Schema & Content Guardrails | DONE | 13/10 | 13/10 17:00 |
| BE3-W2-01/02 | Thái Thanh Tú | BE3 | Workflow n8n Campaign-to-AI-Content-Pipeline | READY | 12/10 | 13/10 17:00 |
| BE3-W2-03/04 | Thái Thanh Tú | BE3 | Node kiểm duyệt & Lưu nội dung vào bảng `contents` | READY | 13/10 | 14/10 17:00 |
| FE-W2-01 | Diệu | FE | Layout/server gate & Reseller Feed (`/reseller/campaigns`) | WAITING_REVIEW | 14/10 — tiếp quản | Gốc: 13/10 12:00; đã qua |
| FE-W2-02 | Diệu | FE | Search & lọc danh mục/địa điểm/hoa hồng | WAITING_REVIEW | 14/10 — tiếp quản | Gốc: 13/10 17:00; đã qua |
| FE-W2-03 | Diệu | FE | Chi tiết & Content Kit 4 persona | WAITING_REVIEW — người dùng kiểm tra thủ công Bà Nà Hills/4 persona PASS | 14/10 — lượt Content Kit | Gốc: 14/10 12:00 |
| FE-W2-04 | Diệu | FE | Clipboard & modal Tracking Link/QR local | READY_FOR_INTEGRATION — Live tracking đã mở; BE API đã sửa auth & public domain; 59/59 tracking tests PASS | 14/10 — Copy; 15/10 — modal/QR/live | Gốc: 14/10 17:00 |
| FE-W2-05 | Diệu | FE | Merchant Campaign form/action theo contract xác nhận | IN_PROGRESS — code mở theo BE active/ngày VN; chưa live acceptance/review | 15/10 — form/loader/action/fixture | Gốc: 15/10 12:00 |
| FE-W2-06 | Diệu | FE | Live data integration đã kiểm chứng | IN_PROGRESS — Content Kit/Copy localhost được người dùng xác nhận; pipeline/QA còn lại | 14/10 — chẩn đoán truy cập | Gốc: 15/10 17:00 |
| FE-W2-07 | Diệu | FE | Mobile/keyboard & Full Playwright E2E; Tester 1 hỗ trợ QA | NOT_READY | Chưa bắt đầu | 16/10 12:00 |
| FE-W2-08 | Diệu | FE | Public Terms of Service `/terms` | UI DONE — nội dung WAITING_APPROVAL | 15/10 — khung bản nháp | 16/10 12:00 — hạn chung sprint |
| FE-W2-09 | Diệu | FE | Public Privacy Policy `/privacy` | UI DONE — nội dung WAITING_APPROVAL | 15/10 — khung bản nháp | 16/10 12:00 — hạn chung sprint |
| UX-W2-01/02 | UI/UX Designer | UI/UX | Figma Hi-fi Reseller Feed & Suggested Content Kit | IN_PROGRESS | 12/10 | 13/10 12:00 |
| T1-W2-01/02 | Tester 1 | QA Hybrid | Mock Data `campaign-demo.ts` & Hỗ trợ CSS Responsive | READY | 12/10 | 13/10 17:00 |
| T1-W2-03/04 | Tester 1 | QA Hybrid | Bộ test tự động Playwright E2E (`tests/reseller.spec.ts`) | READY | 13/10 | 14/10 17:00 |
| T2-W2-01/06 | Tester 2 | AI Safety QA | Rubric, groundedness, policy, adversarial và benchmark | IN_REVIEW — 13/13 deterministic PASS; chờ n8n live acceptance | 16/10 | 16/10 12:00 |
| T3-W2-01/02 | Tester 3 | System QA | Test Suite cho API Tracking Link & Redirect Router | READY | 12/10 | 14/10 17:00 |
| PM-W2-01/06 | Nguyễn Minh Tuệ | PM | Điều phối Sprint 2, Code Review & Release Management | IN_PROGRESS | 12/10 | 16/10 17:30 |

---

## 2. COMPLETED WORK
| Task ID | Member | Deliverable | Completed At | Handoff To |
|---|---|---|---|---|
| Milestone Week 1 | Toàn team | Nền tảng Tuần 1: 8 bảng DB, Auth, pgvector RAG, n8n setup, 5 màn hình FE | 09/10/2026 | Sẵn sàng cho Tuần 2 |
| PM-W2-01 | PM | Họp Kick-off Sprint 2 & Chốt Interface Contracts giữa FE - BE1 - BE2 - BE3 | 12/10/2026 10:30 | Toàn team |
| T1-W2-01 | Tester 1 | File Mock Data `src/lib/campaign-demo.ts` (4 campaigns, 20+ content items) | 12/10/2026 11:30 | FE |
| BE1-W2-01/05 | BE1 | Migration `affiliate_links` & `clicks`, Trigger n8n, API `/api/tracking/generate`, Router `/r/[code]`, RLS, Types gen, Test Suite PASS | 13/10/2026 14:00 | FE, BE3, Tester 3 |
| BE2-W2-01/03 | BE2 | Prompt 4 personas, Zod/JSON Schema, guardrails, 10/10 live parse và 5/5 violation tests | 13/10/2026 | BE3, Tester 2 |
| BE1-W2-06 | BE1 | Migration `optimize_feed_and_tracking_indexes.sql`, Benchmark script, EXPLAIN ANALYZE < 1ms PASS, Build PASS | 13/10/2026 21:30 | Toàn team (E2E) |
| BE1-W2-07 | BE1 | Migration `clicks_anti_fraud_and_device_analytics.sql`, Trigger assertion test PASS 100%, types generated, Build PASS | 14/10/2026 11:15 | Tester 3, BE1 (Task 08) |
| BE1-W2-08 | BE1 | Module UA Parser, Rate Limiter & Router `/r/[code]` anti-bot integration, Unit tests PASS 100%, Build PASS | 14/10/2026 11:30 | Tester 3, FE |
| BE1-W2-09 | BE1 | Migration `reseller_analytics_rpc.sql`, 4 RPC functions (Overview, Timeseries, Top campaigns, Devices) test PASS 100%, types generated | 14/10/2026 11:45 | FE, BE1 (Task 10) |
| BE1-W2-10 | BE1 | 2 API Route Handlers (`GET /api/reseller/links`, `GET /api/reseller/analytics`), Test E2E `test_antibot_and_analytics.ps1` PASS 100%, Build PASS 16/16 routes | 14/10/2026 12:00 | FE, Tester 3 |
| BE1-W2-11 | BE1 | Migration Trigger hòa giải `fn_temp_contents_reconcile` (Local & Cloud), xử lý bảo mật Auth Bypass & Host Poisoning, hỗ trợ BE3 n8n thông luồng | 16/10/2026 09:30 | BE3, FE, Toàn team |

---

## 3. IN PROGRESS
| Task ID | Member | Task | Progress | Blocker | Next Step |
|---|---|---|---|---|---|
| UX-W2-01 | UI/UX | Hoàn thiện Figma Hi-fi Reseller Feed | 70% | Chốt các trường bắt buộc trên Card | Xuất specs và asset cho FE |
| BE2-W2-04 | BE2 | Handoff Prompt, Schema, Guardrails & persistence mapper cho BE3 | READY_FOR_REVIEW | Chờ BE3/FE xác nhận contract trong live workflow | BE3 mirror mapper, batch insert và cross-test với FE |
| BE3-W2-01 | BE3 | Tạo Node Webhook tiếp nhận Campaign trên n8n | 50% | None (Đã có trigger BE1) | Cấu hình webhook URL cố định & test |
| FE-W2-01/02 | Diệu | Protected layout, server adapter/Feed, search/filter/states | Code + scoped lint/typegen/tsc/isolated build + 28/28 data/UI tests fixture pass; WAITING_REVIEW | Live RLS/types/status cần BE1/BE3; Figma/QA review chưa có | Tester 1/UIUX review JSON và ảnh sau sửa 320/390/1440px; không live DONE |

---

## 4. BLOCKED
| Task ID | Owner | Blocked By | Required From | Impact |
|---|---|---|---|---|
| FE-W2-04 | Diệu | RESOLVED — Backend API đã được vá bảo mật (chặn backdoor body.reseller_id trên production, chống IDOR, chuẩn hóa public domain). FE đã mở cờ live tracking và pass 59/59 Playwright tests | BE1 / FE | Đã giải tỏa blocker; sẵn sàng nghiệm thu E2E |
| FE-W2-05 (acceptance còn lại) | Diệu | Chưa kiểm chứng ghi session/RLS/trigger AI thật; AI notes chưa có contract/cột, required/limits ngoài phần đã xác nhận còn cần chốt | BE1 / PM / QA | Blocker status/ngày RESOLVED theo BE mới: active, đầu/hết ngày VN. Code đã mở, không tự tạo dữ liệu/AI trên Supabase chung; chưa reviewed hoặc live acceptance |
| FE-W2-06 | Diệu | Negative RLS/login lifecycle/pipeline/QA chưa đủ bằng chứng | BE1 / BE3 | Người dùng xác nhận localhost/Reseller: Bà Nà Hills đủ4 persona, Copy4 phần dán Notepad đúng nội dung/xuống dòng. Đây là kiểm tra thủ công giới hạn tài khoản/campaign này; tách mock, không ghi full integration DONE |
| FE-W2-08/09 (nội dung) | Diệu | Chưa có Điều khoản/Quyền riêng tư được công ty phê duyệt trong repo | Công ty / PM | Giao diện public đã có khung bản nháp; nội dung pháp lý chưa có hiệu lực, chờ copy và phê duyệt chính thức |
| BE3-W2-02 | BE3 | Prompt templates & Zod schema chính thức | BE2 | n8n tạm dùng prompt thử nghiệm của W1 |
| T3-W2-02 | Tester 3 | None (Đã giải tỏa bởi BE1) | BE1 | Tester 3 đã có router `/r/[code]` để chạy test suite 302 |
| BE2-W2-04 acceptance | BE2 | Reference mapping đã có: 5 full rows + 5 hook-only rows; status DB lowercase | BE3 + FE | Chưa thể DONE đến khi live workflow xác nhận batch insert và FE đọc được `approved` |

---

## 5. HANDOFFS
| From | To | Deliverable | Status | Date |
|---|---|---|---|---|
| PM | Toàn team | Phân công nhiệm vụ chi tiết Tuần 2 (Week2.md + 9 work plans) | DONE | 12/10 |
| UI/UX | FE | Figma Hi-fi Reseller Feed & Component Specs | WAITING_REVIEW | 12/10 |
| Tester 1 | FE | Bộ Mock Data `src/lib/campaign-demo.ts` | DONE | 12/10 |
| BE2 | BE3 | Prompt Templates + Zod/JSON Schema + Guardrails + persistence mapper + Test Report | READY_FOR_REVIEW | 15/10 |
| BE1 | BE3 | Webhook trigger `on_campaign_created` payload specs | DONE | 13/10 |
| BE1 | FE | API Contract `POST /api/tracking/generate` & `/api/tracking-links/generate` | DONE | 13/10 |
| BE1 | Tester 3 | Redirect Router `/r/[code]` & Schema `clicks` | DONE | 13/10 |
| BE1 | FE | API Báo cáo & Link Reseller (`GET /api/reseller/links`, `GET /api/reseller/analytics`) | DONE | 14/10 |
| BE1 | Tester 3 | RPC Functions & Test script lọc Bot, Rate limit, Analytics | DONE | 14/10 |
| BE3 | FE | Dữ liệu nội dung bài viết sinh tự động vào bảng `contents` | READY_FOR_HANDOFF | 14/10 |
| Diệu (FE) | Tester 1 / UI/UX | Code 01/02, fixtures có nhãn, scoped lint/tsc/build và 28/28 data/UI tests pass; ba ảnh sau sửa | WAITING_REVIEW; worktree có source, chưa push/PR/gửi bàn giao ngoài phiên | 14/10 |
| Diệu (FE) | BE1 / BE3 / PM | Câu hỏi role/RLS/types/status/tracking/form/legal và analytics scope trong FE_W2 | WAITING_HANDOFF; câu hỏi đã ghi, chưa gửi qua công cụ nhắn tin | 14/10 |

---

## 6. INTERFACES
| Interface | Owner | Consumer | Contract / Definition | Status |
|---|---|---|---|---|
| Tracking API | BE1 | FE | `POST /api/tracking/generate` nhận `{ campaign_id, product_id }` trả `{ short_url, tracking_id }` | CONTRACT AGREED |
| Redirect Router | BE1 | End Customer / QA | `GET /r/[code]` ghi nhận bảng `clicks` và 302 redirect tới official URL | CONTRACT AGREED |
| Webhook Campaign | BE1 | BE3 | `POST n8n-webhook` payload: `{ campaign_id, product_id, title, commission_rate }` | CONTRACT AGREED |
| LLM Output Schema | BE2 | BE3 | JSON schema gồm: `persona`, `hooks[]`, `scripts[]`, `captions[]`, `ctas[]` | IMPLEMENTED & TESTED |
| LLM Output → `contents` rows | BE2 reference; BE3 producer | BE3 / FE | 10 rows/persona: 5 full + 5 hook-only; shared `reseller_id = null`; `approved`/`needs_review` lowercase | IMPLEMENTED & TESTED BY BE2; WAITING LIVE ACCEPTANCE |
| Reseller Card Specs | UI/UX | FE | Hiển thị ảnh, tên tour, địa điểm, badge hoa hồng cam đất, nút hành động | CONTRACT AGREED |
| Bảng `contents` Schema | BE1 / BE3 | FE | Các cột: `product_id`, `persona`, `hook`, `script`, `caption`, `cta`, `status` | CONTRACT LIVE |
| Reseller Links API | BE1 | FE | `GET /api/reseller/links`: Danh sách link tiếp thị kèm số click hợp lệ | CONTRACT AGREED |
| Reseller Analytics API | BE1 | FE | `GET /api/reseller/analytics`: Dữ liệu biểu đồ timeseries, devices, top campaigns | CONTRACT AGREED |

### FE audit — 14/10/2026 (không thay trạng thái bàn giao của BE)

- Consumer hiện tại là Diệu. Các contract/status lịch sử của BE phía trên giữ nguyên; audit checkout chỉ xác nhận file hiện có, không chứng minh remote đã apply hay dịch vụ đang chạy.
- Tracking response thực tế là `{ status: "success", data: { id, unique_code, short_url, destination_url, ... } }`, khác `{ short_url, tracking_id }` ở bảng cũ. FE-W2-04 sẽ tái dùng route với session và `{ campaign_id, product_id }`; việc FE bỏ reseller_id không sửa API trust body/admin hiện tại. BE1 cần chốt auth/role/quan hệ; public Supabase keys không thay server secret/service-role thiếu ở máy FE.
- Feed dùng `campaigns.name`, `target_location`, `products.category`, commission của campaign theo phần trăm; parse `unknown` bằng Zod theo migrations, không any/casts che generated types rỗng. Exact `active` theo seed/API docs; `ACTIVE` trong index/benchmark là conflict chuyển BE1. Count nội dung chưa xác nhận đến khi BE1/BE3 chốt `APPROVED`/`published`; không đọc unapproved.
- Quyền portal được kiểm tra ở server bằng `getUser()` và read-only `resellers.id = user.id` có căn cứ migration; không metadata/localStorage/service-role. Remote RLS/schema chưa xác minh.
- Merchant form có chênh lệch name/title và AI notes chưa có cột riêng; FE-W2-05 chờ contract BE1/PM, không thêm field hoặc bỏ input. FE không gọi webhook trùng DB trigger.
- API analytics BE1 là bàn giao mới cần PM xác nhận phạm vi FE; lượt này không thêm dashboard analytics/links/ví/checkout/admin.

---

## 7. SHARED RESOURCES
| Resource | Owner | Location | Status |
|---|---|---|---|
| Supabase Project | BE1 | Database migrations & Supabase local | LIVE |
| Figma Workspace | UI/UX | Link Figma dự án TravelLink AI | ACTIVE |
| n8n Instance | BE3 | Instance n8n self-hosted / cloud | ACTIVE |
| LLM Service | BE3 / BE2 | `services/llm-service/` | ACTIVE (Fallback ready) |
| GitHub Repository | PM / Team | `https://github.com/NguyenMTue/ai-travel-reseller` (branch `dev`) | CLEAN |
| Test Suites | QA Team | `tests/frontend.spec.ts`, `tests/reseller.spec.ts` | ACTIVE |

---

## 8. CONFLICT / DUPLICATE CHECK

### Potential Duplicate Tasks
- **Sinh bài viết AI:** Đã phân định ranh giới rõ ràng: BE2 chỉ viết Prompt và định nghĩa Zod Schema; BE3 là người đưa prompt vào Workflow n8n và phụ trách luồng lưu trữ vào Supabase. Không để BE2 tự gọi API ghi thẳng vào DB.
- **Tạo link tracking:** BE1 là người duy nhất sở hữu logic sinh mã `unique_code` và quản lý bảng `affiliate_links`. FE chỉ gọi API của BE1, tuyệt đối không tự sinh mã ở client.

### Ownership Conflicts
- **Router `/r/[code]`:** Đặt tại root `app/r/[code]/route.ts`. BE1 sở hữu logic backend, phối hợp cùng FE để đảm bảo không bị `proxy.ts` chặn quyền truy cập của khách hàng vãng lai.

### Interface Conflicts
- Không có. Toàn bộ 4 hợp đồng giao tiếp chính đã được thống nhất tại phiên Kick-off sáng Thứ Hai.

### Dependency Conflicts
- FE cần dữ liệu dựng Reseller Feed trong khi BE1 và BE3 chưa hoàn thành luồng dữ liệu thật: Tester 1 đã giải tỏa hoàn toàn điểm nghẽn bằng việc cung cấp file Mock Data chuẩn `src/lib/campaign-demo.ts`.

---

## 9. DECISIONS
| Date | Decision | Reason | Decided By | Impact |
|---|---|---|---|---|
| 12/10 | Định dạng short link là `/r/[code]` thay vì query params dài | Thân thiện khi chia sẻ trên mạng xã hội, dễ quét mã QR | Team Lead & FE | BE1 tạo route handler chuyên biệt tại `app/r/[code]` |
| 12/10 | Bắt buộc 4 Personas: Local Guide, Family, Foodie, Budget Traveler | Bao phủ đầy đủ các phân khúc khách hàng du lịch cốt lõi | BE2 & PM | BE2 tạo 4 prompts; FE chia 4 tabs |
| 12/10 | Chỉ cung cấp nút Copy vào Clipboard, không tự động post qua API MXH | Tuân thủ chính sách API TikTok/Facebook, tránh bị khóa tài khoản | Toàn team | An toàn cho MVP, Reseller chủ động đăng bài |
| 12/10 | Duy trì cơ chế kiểm duyệt nội dung bán tự động | Đảm bảo uy tín thương hiệu và tính trung thực về giá | BE3 & Tester 2 | Bài viết gắn cờ `NEEDS_REVIEW` nếu có nghi vấn |

---

## 10. CHANGE LOG
| Date | Change | Author |
|---|---|---|
| 12/10 09:00 | Khởi tạo bảng theo dõi tiến độ Tuần 2 (Sprint 2) cho 9 thành viên | PM (Nguyễn Minh Tuệ) |
| 12/10 11:30 | Bổ sung bàn giao Mock Data `campaign-demo.ts` từ Tester 1 cho FE | Tester 1 / PM |
| 13/10 14:50 | Hoàn tất deliverables BE1-W2 (Schema, API, Redirect, Trigger); giải tỏa blockers cho FE & Tester 3 | BE1 (Nguyễn Minh Tuệ) |
| 14/10 10:45 | Phân rã 4 modules nâng cấp BE1-W2-07 đến 10 (Anti-fraud bot, Device parser, RPC analytics, Reseller API) | BE1 / PM |
| 14/10 12:00 | Hoàn tất toàn bộ 4 modules BE1-W2-07 đến 10 (Anti-bot, Device parser, RPCs, Reseller APIs, E2E test PASS 100%) | BE1 (Nguyễn Minh Tuệ) |
| 14/10 | Diệu tiếp quản FE duy nhất; cập nhật plan/FE rows theo checkout Feature_FE_W2_Integration tại daa3880; giữ 01–07, thêm 08/09; triển khai 01/02, ghi conflicts/blockers có bằng chứng | Diệu (FE) |
| 14/10 | Source FE-W2-01/02 đã có; scoped lint, regenerated Next types/tsc và isolated build pass; trạng thái WAITING_REVIEW, live FE06 còn BLOCKED; UI fixture tests cuối đang chạy | Diệu (FE) |
| 14/10 — tiếp nối | Hoàn tất contrast tab active/padding input trong component; 28/28 data/UI tests fixture sau sửa + ba ảnh 320/390/1440px; scoped lint/tsc/build pass. 01/02 WAITING_REVIEW, live chưa kiểm chứng | Diệu (FE) |

---

## 11. DAILY UPDATE

### 16/10/2026 (Thứ Sáu)

#### BE2 — Review nhánh tích hợp BE3

- Hoàn thành phần Tester2 có thể chạy trong repo: **13/13 PASS**, tạo đủ rubric/reports/benchmark; mở rộng guardrail policy và fake urgency ở TypeScript/Python. Sửa giá fixture VinWonders về **510.000đ** theo seed. Persona/groundedness live vẫn chờ workflow export + execution evidence BE3.
- Recheck sau pull `origin/dev@9d3eff6`: fast-forward sạch; commit mới chỉ merge PR #22 của BE2, không thêm workflow export, live E2E hoặc kết quả Tester 2. BE2 test **17/17 PASS** sau pull.
- Pull `origin/dev@fba688a` (đã merge `Feature_BE3_n8n_Campaign_Content@6ae494e`) vào nhánh BE2 bằng fast-forward, không xung đột; các thay đổi review cục bộ được bảo toàn.
- Hoàn thiện `src/lib/ai/content-batch.ts` để tạo payload chính xác cho `POST /contents/batch`: bốn persona, mười records/persona, năm bộ đầy đủ + năm hook-only, không modulo/duplicate assets.
- Mở rộng BE2 lên **17/17 PASS**, gồm các ca từ chối script string, caption thiếu hashtag, CTA thiếu token và key ngoài schema. Tái chạy độc lập BE3 Python **8/8 PASS** với Supabase mock; FE approved-content contract **14/14 PASS**.
- Production build PASS (23 routes), TypeScript PASS và targeted ESLint PASS.
- `dev@49d3032` bổ sung thỏa thuận BE1–BE3 dùng `index % 5` cho demo để mười biến thể đều đầy đủ. Ghi nhận đây là **demo override**; schema/mapper chuẩn BE2 vẫn giữ 5 full + 5 hook-only và không tự đổi contract dài hạn.
- Cần chạy E2E đủ bốn persona, regenerate `database.types.ts` sau migration và xác nhận FE đọc được rows `approved`; sau demo, PM/BE1/BE2/BE3 chốt contract canonical trước khi coi mapping là nghiệm thu dài hạn.

#### Tester 2 — AI Safety QA

- **Done:** Hoàn thiện rubric và sáu tài liệu Tester2; thêm `tests/content-safety.test.ts` đạt **13/13 PASS**; hồi quy BE2 đạt **17/17 PASS**; bổ sung guardrail cho giá/mã ưu đãi, chính sách trẻ em, hoàn hủy, bảo hiểm, xe đẩy/xe lăn, người cao tuổi, prompt injection và khan hiếm giả.
- **In Progress:** T2-W2-02/03/04/06 ở trạng thái `PARTIAL/IN_REVIEW`; contract, parser và deterministic guardrails đã PASS nhưng chưa có mẫu n8n live để chấm persona và groundedness đầu-cuối.
- **Blocker:** BE3 chưa cung cấp workflow export, execution ID và tám mẫu live (hai sản phẩm × bốn persona). Python unit suite chưa chạy tại máy hiện tại do thiếu `fastapi`; Python syntax compile PASS.
- **Next:** Nhận bằng chứng live từ BE3, quét bản ghi `contents`, chấm rubric tối thiểu 80/100 và ký nghiệm thu benchmark.

### 15/10/2026 (Thứ Năm)

#### FE (Diệu — đối chiếu Tracking blocker và Copy CTA kèm link)

- Fetch origin: dev vẫndb9f9ea; generate/alias/admin/redirect không khác localHEAD577b074. Chưa có fix chỉ trên remote; giữ mọi diff trước lượt, gồm login/membership/guard, không merge lại.
- Bằng chứng source: body reseller_id ưu tiên session, admin client, thiếu Reseller membership/campaign eligibility/quan hệ product; reuse filter triple nhưng bỏ active/error; request origin tạo short_url localhost; fallback /products chưa có route. Giữ live gate false, không sửa BE handler/DB. Contract response/state/config/public origin và BE1 message cụ thể ở FE_W2 mục27.
- Ảnh bảng người dùng mô tả:4 active links localhost, một owner22222222 và ba owner9ec38ccf, chưa thấy campaign VinWonders44444444…333333333333. Role postgres không chứng minh quyền session web; không hardcode/reuse link ảnh. Manual preview QR hiển thị/Copy Notepad khớp đã xác nhận; device scan/live create chưa xác nhận.
- Thêm Copy CTA kèm link riêng: thay đúng token trong bản sao, CTA/Copy gốc không đổi, rỗng/không token/không link có thông báo trung thực; chỉ dùng short_url đúng scope campaign/product/verified session. State in-memory reset khi đổi scope/Auth event; stale pending không lẫn link. Copy await/manual fallback; QR/Copy/link nhất quán, cảnh báo localhost chưa chia sẻ public. Fixture/session controls riêng, không gọi Supabase hoặc /r/.
- **Kiểm chứng:** Tracking/CTA35/35 PASS exit0 (8data+27UI320/390/1440). Sau fix SDK restore guard,20/20 PASS exit0 (8data recheck+12Copy regression gốc), không cộng lặp thành55ca riêng. Không làm yếu assertions; scoped lint0warning, tsc noEmit và build cuối PASS (2.5min compile/23.9s types/23pages), diff check PASS. Reports/ảnh và acceptance ở FE_W2 mục27; không coi mock/ảnh postgres là tạo link/redirect/click thật PASS. FE04/tuần2 chưa DONE/reviewed; Campaign thật/AI và session login thật sau sửa vẫn chưa kiểm chứng.
- Không sửa role tài khoản/DB/RLS/seed/migration/API Tracking/.env.local, không webhook/ghi dữ liệu/click thật hoặc commit/push/merge. Chỉ bổ sung phần FE trong log team.

#### FE (Diệu — sửa login theo membership và guard Merchant)

- Người dùng xác nhận trước sửa: Reseller login không next về Merchant minh họa, nhưng next Feed vào được9 chiến dịch. Một lần không đọc thấy hồ sơ Reseller chưa rõ nguyên nhân, không kết luận RLS. Nguyên nhân code: login page tự điền next Merchant, action redirect không membership và Merchant root thiếu server guard.
- Login/callback dùng getUser + merchants.id/resellers.id từ session client/RLS, không tin email/user_metadata. Default theo quyền; cả hai giữ default Merchant có kiểm chứng, không hồ sơ ở login với lỗi riêng. next internal an toàn và đúng quyền mới được dùng; Merchant layout/root loader có guard, form/action giữ kiểm tra Merchant/ownership độc lập. Proxy phân biệt lỗi Auth dịch vụ với hết phiên; preview public tách riêng, không redirect loop.
- Thêm7data+6UI tests với fake Supabase HTTP server localhost, SSR Auth/session qua SDK và REST writes=0. Lượt chính11/13 PASS (7data+4UI); hai ca selector trùng Next announcer được scope về form, giữ assertion, chạy lại2/2 PASS exit0. Chi tiết/report và checks tại FE_W2 mục26. Đây là mock, session thật sau sửa chờ người dùng kiểm tra `/login` không next bằng từng tài khoản; không tự tạo dữ liệu.
- **Checks hoàn tất:** tsc noEmit PASS sau native typegen khắc phục output cũ (không coi typegen là pass); scoped lint PASS,2 warning unused có sẵn ở middleware,0 error; build PASS exit0 (54s compile/24.8s types/23pages), diff check PASS. Giữ strict/includes, không chạy lại suite không bị ảnh hưởng.
- **Manual Tracking từ người dùng:** modal mô phỏng tạo link/hiện QR, Copy dán Notepad đúng URL; chưa quét điện thoại hoặc tạo link thật. Giữ gate chặn live và API Tracking nguyên trạng; không coi23tests mock trước đó là live acceptance. Merchant Campaign/AI và manual reload thông báo vẫn chưa kiểm chứng, tuần2/review giữ trạng thái cũ.
- Giữ HEAD577b074/toàn bộ diff trước lượt, không merge/checkpoint lại, DB/RLS/seed/migration/account-role/webhook/.env.local hoặc commit/push/merge. Không cập nhật phần BE/QA.

#### FE (Diệu — Tracking modal/QR, live generation giữ chặn)

- Đọc hướng dẫn/FE_W2/handoff cập nhật và riêng handler generate/alias. Giữ Feature_FE_W2_Integration/HEAD577b074, toàn bộ diff Merchant05; không merge lại, không sửa Content Kit/Copy nội dung hoặc nguồn dữ liệu.
- Handoff BE nói ready nhưng code generate vẫn ưu tiên body.reseller_id trước getUser, dùng admin client và chỉ kiểm tra campaign/product tồn tại riêng lẻ; alias re-export cùng POST nên cùng bị ảnh hưởng. Đây là phát hiện cụ thể của endpoint tạo link, không suy từ GET Reseller APIs. Gate live cố định false ở code, UI thật giải thích chờ xác nhận quyền, adapter cũng chặn trước fetch.
- Có modal native dialog, initial/pending/result/error/session/uncertain, explicit create, giữ kết quả qua đóng/mở và không retry POST chưa rõ; Copy chỉ success sau await clipboard, manual khi lỗi; QR local dùng cùng short_url đã validate. Không thay LINK_MUA_VE. Fixture development dùng mock transport, URL example.invalid có nhãn, không request API/đi qua /r/.
- Thêm qrcode1.5.4, types1.5.6 và jsqr1.4.0 (decoder chỉ test), lockfile cập nhật; không dùng dịch vụ QR ngoài. Checks/kết quả/bằng chứng/blocker tại FE_W2 mục25; chưa live Tracking/RLS/redirect/Copy native/QR trên điện thoại, không reviewed/tuần2 DONE.
- **Kiểm chứng:** Lượt đầu20/23 PASS,3 focus-loop FAIL; sửa focus handler, giữ nguyên assertion. Lượt cuối **23/23 PASS exit0** (5 data +18 UI ở320/390/1440,0 skipped/unexpected/flaky), QR từ SVG thực render giải mã đúng URL response bằng jsQR; CTA giữ nguyên. Scoped lint/TypeScript/build PASS (57s compile/15.4s types/23pages). Hai report/ảnh tại FE_W2 mục25; không coi là API/clipboard native/device QR đã pass.
- Hash44 file Merchant/API/DB/legal/Content Kit/query/Copy giữ nguyên; không sửa guard Merchant hoặc các thay đổi chưa commit. API adapter có code nhưng gate false trước fetch, chờ BE sửa handler hai aliases; không đánh đồng lỗi quyền với mọi API Reseller hoặc mở live theo lời handoff.
- Người dùng đã thấy Merchant lưu mô phỏng về Dashboard và thông báo; **manual reload chưa xác nhận**. Kết quả reload trong test tự động mục24 giữ riêng, chưa live Campaign/AI. Không sửa Merchant ở lượt này, không Supabase writes/seed/migration/RLS/webhook, không đọc/in secret/.env.local hoặc commit/push/merge.

#### FE (Diệu — hoàn thiện05 theo xác nhận BE active/ngày VN)

- **Contract mới từ BE qua người dùng:** status khởi tạo active, chưa lưu nháp; đầu/hết ngày Asia/Ho_Chi_Minh; INSERT tự trigger trg_on_campaign_created→n8n/Gemini/contents4 persona; sau ACK về /merchant. Thay thế blocker status/ngày cũ, không coi AI đã hoàn tất hoặc đang chạy.
- Mở policy server; giữ getUser/membership/owner của sản phẩm, session client/RLS, validation5–30%/ngày/độ dài, ACK verified và INSERT không retry. Repo dùng timestamp without time zone, lưu giờ lịch VN 00:00:00–23:59:59.999999 không đổi UTC/múi giờ máy; trigger forward nguyên ngày, chưa thấy backend so sánh start/end trong mã bàn giao. Căn cứ/giới hạn tại FE_W2 mục24.
- Sau success chuyển /merchant với thông báo một lần đúng nội dung yêu cầu, xóa receipt khi Dashboard nhận; fixture chỉ về /preview/merchant và có nhãn/namespace riêng. Pending/lỗi/uncertain giữ cơ chế chống trùng và giữ input. AI notes vẫn chưa hỗ trợ.
- Checks/mock và giới hạn live ghi tại FE_W2 mục24; chưa tự tạo Campaign thật, chưa kiểm chứng RLS/trigger/pipeline AI. Giữ05 IN_PROGRESS/chưa reviewed, tuần2 chưa hoàn thành. Không commit/push/merge lại, không seed/migration/DB/RLS/webhook, không đọc/in secret hoặc sửa .env.local.
- **Tiếp tục sau hết hạn mức:** Giữ source/diff hiện tại, không triển khai lại. Lượt cũ23 data PASS/hai UI timeout bị dừng; lượt recheck cũ có log tới ca41 nhưng thiếu report/exit cuối, không ghi hoàn tất. Native typegen không được coi là tsc pass. Lượt mới `tsc --noEmit` và scoped lint **PASS exit0**, data riêng **23/23 PASS exit0** có JSON; UI/build cuối ghi tiếp tại FE_W2 mục24. Giữ nguyên assertions và không chạy suites ngoài Merchant05.
- **UI hoàn tất lượt mới:**18/18 PASS exit0 tại320/390/1440px,0 unexpected/skipped/flaky; hai ca timeout cũ nay pass, giữ assertions. Data23 và UI18 có report riêng, không cộng log dở thành lượt41/41. Đã xem ba ảnh; pending/lỗi/uncertain/redirect/thông báo một lần đều kiểm thử fixture, không coi là lưu thật/AI PASS. Dừng đúng server QA3110 để ghi report; build cuối theo FE_W2 mục24.
- **Build cuối sau tiếp tục:**PASS exit0 bằng NEXT_BUILD_DIR=build/fe-w2-access (compile81s,TypeScript30.4s,23/23 pages). Tsc riêng/lint/data23/UI18 đều có kết quả hoàn tất, không dùng typegen thay bằng chứng. Diff check PASS; HEAD577b074 giữ nguyên, code/assertions không sửa thêm trong lượt tiếp tục. Chưa live write/RLS/trigger AI, chưa reviewed/tuần2 hoàn thành; không chạy suite ngoài05 hoặc commit/push/merge.

#### FE (Diệu — checkpoint và merge origin/dev local)

- Theo yêu cầu mới, tạo checkpoint local **3cb7387486fc9b393ae052f9918e16e8b994e85d**, message `feat(fe): checkpoint week 2 integration before dev merge`,74 file FE được bảo toàn trước merge. Handoff có một dòng mật khẩu: bản gốc giữ riêng trong thư mục test-results bị ignore, bản commit dùng ghi chú lấy từ BE; không đọc/in .env.local hoặc commit secret/output sinh tự động.
- Merge origin/dev@db9f9ea vào Feature_FE_W2_Integration; chỉ conflict tại changelog TEAM: giữ cả cập nhật BE và ba dòng FE. tsconfig tự ghép giữ allowImportingTsExtensions remote + includes local; không thay nghiệp vụ/guard Merchant, approved/owner/session/persona hoặc xác nhận manual Content Kit.
- TypeScript PASS,45/45 data/SDK mock tests và11/11 BE2 unit PASS; không chạy test live/seed/migration/Tracking/DB hoặc toàn bộ UI suites. Chi tiết lint/build, giới hạn và checkpoints tại FE_W2 mục23/báo cáo cuối; lỗi whitespace remote không tự sửa trong migration. Chưa đánh dấu tuần2 hoàn thành/reviewed, không push/merge vào dev/main trên GitHub.
- **Checks cuối:** Scoped lint PASS (0 errors,2 warnings middleware có sẵn); build isolated PASS (compile64s,TypeScript33.2s,23/23 pages). Không còn unmerged entries; chuẩn bị hoàn tất merge commit local sau khi rà diff. Source FE giữ nguyên checkpoint; config giữ cả hai phía, cập nhật BE nhận nguyên trạng từ origin/dev.

#### FE (Diệu — ghi nhận manual check và audit origin/dev)

- **Người dùng xác nhận:** Đã đăng nhập Reseller trên localhost, Bà Nà Hills hiển thị đủ bốn persona; Copy Hook/Script/Caption/CTA dán Notepad đúng nội dung và xuống dòng. Ghi nhận manual live Content Kit/Copy PASS trong phạm vi đó, không phải agent chạy lại hoặc clipboard mock. Test tự động36/38 + recheck2/2 ở mục lịch sử bên dưới giữ nguyên; không suy ra negative RLS/production/full QA PASS.
- Giữ03/Copy WAITING_REVIEW,06 IN_PROGRESS, tuần2 chưa hoàn thành. Merchant ghi thật vẫn BLOCKED status/ngày; Tracking/QR, legal approval và review còn lại không tự được mở.
- **Fetch/audit:** Giữ nhánh Feature_FE_W2_Integration, HEAD daa3880; fetch origin/dev từ b21320f tới db9f9ea (0 ahead/10 behind theo commit). Mới thêm seeddata chuẩn hóa approved/4 persona; không chạy seed/DB. Đọc thêm chênh lệch BE1 APIs/anti-bot/RPCs/types và BE2 schema/docs từ HEAD, không nhập code.
- **Nguy cơ đồng bộ:** TEAM_WORK_LOG và tsconfig cùng sửa ở local/remote;64 file untracked chưa trùng tên remote nhưng phải bảo toàn cùng tracked trước đồng bộ. API Reseller remote nhận ID từ query/header qua admin client, cần BE rà session/role trước tích hợp; mã Git không chứng minh RLS/migrations đã apply. Chi tiết và hướng chuẩn bị tại FE_W2 mục22; không sửa tiến độ BE trong log local.
- Chỉ cập nhật FE_W2 và phần FE của TEAM_WORK_LOG; không đọc/in .env.local, không pull/merge/checkout/stash/commit/push hoặc ghi đè thay đổi hiện tại. Không chạy lại suites vì chỉ sửa tài liệu.

#### FE (Diệu — Content Kit theo bổ sung approved)

- Đọc docs/Fe-update-2026-10-15.md; phần bổ sung mới **thay thế published/public** trong phần cũ và docs/Fe.md. Policy chỉ `approved`, giữ campaign_id AND shared NULL/owned theo getUser + membership. Không mở rộng alias để làm dữ liệu xuất hiện.
- Giữ local_guide/family/foodie/budget_traveler; persona ngoài contract vẫn bị loại, diagnostic development chỉ mã/quy tắc/tên trường. Không fallback local_guide, không hardcode mẫu vào portal.
- **BE xác nhận/báo cáo:** Campaign `44444444-4444-4444-4444-444444444444`, product `33333333-3333-3333-3333-333333333333`, đủ bốn phần cho bốn persona và quyền reseller@example.com. FE chưa kiểm chứng dataset mới bằng session thật trong lượt này; không ghi Copy native PASS từ clipboard mock.
- Kết quả test/check và hướng dẫn kiểm tra thật ghi tại FE_W2 mục 20. Giữ WAITING_REVIEW/IN_PROGRESS; không đổi tiến độ BE/QA, không triển khai Tracking/QR hoặc mở guard tạo Campaign Merchant; contract tạo status/ngày vẫn thiếu. Không sửa DB/seed/RLS, commit/push/merge.
- **FE thực kiểm chứng:** Scoped lint/TypeScript/build PASS; lượt Content Kit chính 36/38 PASS (14 data/mock + 24 UI), hai desktop timeout; chạy lại nguyên trạng đúng hai ca lỗi 2/2 PASS. Không gọi đây là một lượt 38/38 sạch. 320/390px pass đầy đủ, đã xem cả ba ảnh 320/390/1440px. Chưa kết luận nguyên nhân timeout đầu; báo cáo chính và recheck giữ riêng tại FE_W2 mục20. Clipboard stub/fixture không chứng minh dữ liệu thật, RLS hoặc Copy native PASS; chưa có review/acceptance.

#### FE (Diệu — Form tạo Campaign Merchant)

- **Phạm vi:** Giữ `Feature_FE_W2_Integration`, toàn bộ Feed/Content Kit/Copy/legal và thay đổi chưa commit. Fetch/read `origin/dev` đến `b21320f` (HEAD vẫn `daa3880`), không pull/merge/cherry-pick/đổi nhánh hoặc lấy code Foundation.
- **UI/luồng đã có:** `/merchant/campaigns/new`, loading, form tiếng Việt Coastal Editorial, nút Tạo chiến dịch từ Dashboard (preview trỏ fixture riêng). Có product/tên/hoa hồng 5–30%/ngày/đối tượng/địa điểm; lỗi từng trường, empty/load error, pending, kết quả và giữ input. Ghi chú AI disabled, không nhận rồi bỏ dữ liệu.
- **Server:** getUser + merchants membership tại read/write; merchant_id từ danh tính xác minh, product query có owner và submit kiểm tra lại; dùng session client/RLS, không service-role. Core/SDK adapter map campaigns.name, validation calendar/GUID/finite commission; POST không retry. Sau dispatch nếu mất ACK/kết quả chưa rõ thì không tự tạo lại; success chỉ khi ACK hợp lệ, không khẳng định AI đã chạy.
- **Contract/live BLOCKED:** Người dùng trả lời “Chưa có xác nhận BE” về status/ngày. Policy tạo thật vẫn null trong code server, không browser/env override. Repo + types mới origin/dev có name/audience/location, không ai_notes; anon SELECT projection limit=0 trên Supabase trả 200, OpenAPI 401. Đây không chứng minh kiểu/default/RLS/quyền ghi của Merchant hoặc pipeline. Không POST Supabase, không gọi n8n/API AI.
- **Kiểm chứng:** Playwright riêng **38/38 PASS** (20 data/core/SDK fetch mock + 18 UI ở 320/390/1440px), 0 skipped/unexpected/flaky; scoped lint, TypeScript noEmit và build riêng **PASS** (53s compile/19s TypeScript/21 pages). Ảnh/report/lệnh chạy và BE handoff tại FE_W2 mục 19. Chưa QA/UIUX review, chưa live create; không thay trạng thái task cũ hoặc ghi FE-W2-05 DONE.
- **Next:** BE1/PM chốt status, biên ngày/required fields/limits, membership và RLS INSERT/SELECT + product ownership; chốt notes riêng nếu hỗ trợ. Sau đó review policy, kiểm thử môi trường cô lập với BE3/QA trước khi cho phép ghi thật. Không sửa migration/seed/RLS/pipeline, không commit/push/merge.

#### FE (Diệu — Terms / Privacy public)

- **Phạm vi:** Tiếp tục trên `Feature_FE_W2_Integration`; kiểm tra status/diff trước code, giữ các thay đổi Content Kit/Feed hiện có. Campaign_id/persona và quyền Reseller tiếp tục chờ BE; không bỏ bộ lọc hay tự thêm mapping persona.
- **UI hoàn thành:** `/terms` (6 mục), `/privacy` (7 mục) tiếng Việt, dùng Coastal Editorial và header/Brand/Button có sẵn; shell/mục lục dùng chung, neo h2 nhận focus, skip link, về đầu trang/trang chủ/liên kết chéo. Tách footer Landing dùng chung và thêm legal links vào layout Login/Register; không đổi form, checkbox hoặc luồng đăng ký.
- **Nội dung WAITING_APPROVAL:** Tìm trong app/src/docs/README và .ai/role/process chưa thấy copy được công ty phê duyệt. Cả hai trang ghi “Bản nháp — chờ công ty phê duyệt” và chưa có hiệu lực; từng phần có ghi chú chờ bổ sung. Công ty cần cung cấp pháp nhân/đầu mối, điều khoản chính thức, danh mục/mục đích/cơ sở xử lý dữ liệu, chia sẻ/cookie/tracking, thời hạn lưu/xóa, quy trình yêu cầu, phiên bản/ngày hiệu lực và phê duyệt. Không tự đặt email, thời hạn hoặc cam kết pháp lý.
- **Kiểm chứng:** Scoped lint, TypeScript noEmit và build riêng **PASS**; Playwright **9/9 PASS** tại 320/390/1440px (public 200, heading/mục lục, keyboard/focus/Back, links Landing/Auth, nội dung dài/overflow, không pageerror). Đã sửa lỗi history/focus của hash links và số mục bị xuống dòng. Full lint còn lỗi nền `database.types.ts` bị ESLint coi là binary + 2 warning cũ middleware, giữ nguyên. Báo cáo/ảnh/lệnh chạy và phục hồi artifact Next tại FE_W2 mục 18; không chạy lại toàn bộ Content Kit. Test server đã dừng, local review sau `npm.cmd run dev`: `/terms`, `/privacy` trên localhost:3000.
- **Giữ phạm vi:** Không sửa database/seed/RLS, logic Auth, Tracking API hoặc Content Kit; không commit/push/merge, không gửi thông báo qua công cụ ngoài phiên. Hoàn thành UI 08/09 không thay trạng thái nghiệm thu pháp lý hoặc FE-W2-07 toàn portal.

### 14/10/2026 (Thứ Tư)

#### FE (Diệu — nhận contract BE, nối contents thật, đối chiếu Feed)

- **Contract nhận:** Đọc docs/Fe.md, giữ nguyên mẫu; published/public, không pending_approval/APPROVED; bốn key local_guide/family/foodie/budget_traveler; shared NULL/owned đúng session; campaign active. Blocker contract tương ứng RESOLVED, khác acceptance/data runtime.
- **Code:** Query contents có session/membership/GUID guard, mọi trang AND campaign/status/shared-own, select tối thiểu; bỏ product predicate không có trong contract, không lọc quyền tại browser. Adapter không map persona lạ, missing fields/null an toàn; Copy giữ nguyên whitespace/newline/[LINK_MUA_VE], nhắc thêm link trước đăng, không Tracking. Detail dates dd/MM/yyyy không chuyển timezone; query error giữ campaign/info và phân loại Retry; global empty khác persona empty. Feed không tải counts/per-card query, ghi Xem Content Kit.
- **Runtime thật:** Server 3000 session 83259: auth/member/detail OK; contents query OK có NO_ROW trước adapter, có ROW → PERSONA_UNMAPPED (field persona) → EMPTY, schema hợp lệ. Diệu kiểm tra sáu chiến dịch đều trống, sau đó Feed có tám chiến dịch; chưa có variant mapped/native Copy thật. Không coi test mock là Supabase acceptance. Log an toàn test-results/reseller-published-runtime.log.
- **Hai Phong Nha:** Link IDs 1f7341fa-bed5-4a94-a32a-a43d2b5b2006 và fc0a908d-32b8-46cb-bde7-fa20f7d696a7 khác nhau; query UNIQUE_IDS/DISTINCT_IDS_SAME_TITLE và probe REPORTED_IDS_MATCH_QUERY xác nhận chính hai record. Probe ID tạm thời đã gỡ, không dữ liệu hardcode/fallback portal. Không sửa render để gộp theo tên hoặc đổi/xóa DB; câu hỏi BE1 đối chiếu hai campaign ở FE_W2 mục 17.
- **Test:** Lần đầu startup webServer timeout, 0 tests executed, exit 1/report giữ lại. Full 69/69 pass sau đó; thêm regression identity rồi chạy trọn 70/70 PASS, exit 0, 0 unexpected/skipped/flaky, 25 data + 45 UI 320/390/1440. SDK dùng fetch mock, UI/source/clipboard fixture; assertions/timers giữ nguyên. Report cuối test-results/reseller-published-final/results.json; không cộng các lần để ghi full pass.
- **Checks:** Scoped lint/tsc pass. Build đầu lỗi generated Next dev types; native typegen tái sinh đúng artifact, không disable typecheck hoặc sửa encoding nền. Build riêng build/fe-w2-access pass (37.6s/9.8s, sau đó 5.5s/12.8s); build sau cleanup probe bổ sung tại FE_W2 mục 17. Chỉ dừng verified server test 3105 khi teardown kẹt; giữ review 3000.
- **Build cuối sau cleanup:** PASS, exit 0 tại build/fe-w2-access (34.3s compile/18.6s types/17 pages); không còn hai campaign ID được dùng trong probe tạm thời ở source portal. Không sửa dữ liệu để đạt test pass.
- **Blocked/Next:** Contract đã chốt; cần BE1/BE3 đối chiếu runtime publication/persona và có row mapped trước native Copy/QA. Hai record cùng tên cần BE1 xác nhận có chủ đích; query/ID không chứng minh FE duplicate. 01/02 WAITING_REVIEW; 03 UI/read/query WAITING_REVIEW; 04 chỉ Copy, Tracking/QR chưa làm; 06 IN_PROGRESS. Không form/Terms/Privacy, DB mutation/seed/migration/RLS hoặc commit/push/merge. Câu hỏi cụ thể cùng query/field/ID tại FE_W2 mục 17, chưa gửi qua công cụ.

#### FE (Diệu — sửa truy cập Reseller thật)

- **Done (có bằng chứng server runtime, chưa full acceptance):** Giữ mọi thay đổi cũ và 01/02 WAITING_REVIEW. Xác minh `z.uuid()` từ chối seed UUID PostgreSQL vì RFC variant; dùng `z.guid()` cho membership/Feed/detail/content projections, vẫn giữ session + đúng hàng user. Không đổi proxy/RLS/DB hoặc metadata-based authorization.
- **Runtime thật:** Review server 3000 session 68798 ghi VERIFIED → ROW → ALLOWED_POSTGRES_UUID (field id) → Feed query OK → READY. Chính hàng membership thật không qua rule UUID cũ; query đã thành công và khớp user. Log an toàn chỉ step/code/field tại `test-results/reseller-access-runtime.log`; khác server tests cô lập. Không chỉ dựa vào HTTP 200/mock để ghi pass.
- **Kiểm tra thủ công:** Diệu xác nhận tải lại `/reseller/campaigns` thấy bốn chiến dịch, không còn lỗi xác minh quyền truy cập. UI Feed thật đã có bằng chứng người dùng; chưa kiểm tra filter/detail/clipboard thật hoặc negative RLS qua xác nhận này, 01/02 vẫn WAITING_REVIEW.
- **Diagnostics:** Development/server-only, allowlist code/field, không raw message/ID/user payload/credential; tách auth/membership/query/validation/Feed/policy. Thông báo schema bỏ kết luận mặc định BE sai. Hướng dẫn Terminal/Thử lại và câu hỏi có query/code tại FE_W2 mục 16.
- **Validation:** Scoped lint và tsc pass. Full suite Reseller đầu tiên 55/56 pass, 1 desktop navigation timeout 30s; report giữ nguyên. Chạy lại trọn suite cùng assertions: 56/56 PASS, exit 0, 0 skipped/flaky/failed, gồm đầy đủ 44 ca lịch sử và các ca bổ sung; không cộng retry. JSON `test-results/reseller-access-recheck/results.json`. Fixture UI/clipboard mock, policy unit; responsive/focus/long/overflow pass và xem ba ảnh mới 320/390/1440. Chi tiết giới hạn dev cold cache và teardown tại FE_W2 mục 16.
- **Build cuối:** `NEXT_BUILD_DIR=build/fe-w2-access npm.cmd run build` PASS, exit 0 (compile 59s/types 50s/17 pages). Lint các lib/test sửa cuối PASS, exit 0; Next chỉ tự bổ sung include type paths trong tsconfig, không sửa encoding/cache nền.
- **Blocked riêng:** Contents thật vẫn policy NULL, chưa gọi query vì status duyệt/persona/shared-owned/product scope chưa được BE1/BE3 xác nhận; khác lỗi access/Feed đã xử lý. 03 UI/fixture và 04 Copy WAITING_REVIEW (Tracking chưa làm); 06 chưa DONE. Không mở Tracking/form/Terms/Privacy, không DB mutation/commit/push/merge.
- **Next:** Người dùng/QA thử filter/detail thật; Feed hiển thị đã được Diệu xác nhận. BE1 chốt active/ACTIVE, BE1/BE3 chốt quyền công bố contents. Nếu query tái lỗi gửi exact step/code/query, không hỏi chung tình trạng migrations.

#### FE (Diệu — lượt Auth/Content Kit/Copy)

- **Done (code/inspection, không phải live acceptance):**
  - Giữ 01/02 WAITING_REVIEW, nối nút detail đúng ID, không prefetch theo từng card. Tạo `/reseller/campaigns/[id]` và preview development riêng; server đọc campaign/product theo exact active bằng query join, xác thực user + membership tại loader; xử lý invalid ID/not-found/loading/error.
  - Content Kit bốn persona/nhiều biến thể/trường thiếu; Copy từng Hook/Script/Caption/CTA, chờ clipboard ghi thành công, disabled empty/pending, có thông báo/keyboard/manual copy khi bị từ chối hoặc API thiếu.
  - Phân loại configuration/network/permission/schema/query; chỉ Reseller có server loaders được nhận lỗi mạng/Auth service thay vì giả định hết session; Merchant/Admin giữ chặn login. Empty/not-found không khẳng định DB rỗng khi RLS có thể lọc hàng.
  - Kiểm tra local không session: login HTTP 200 giữ next, Feed/detail HTTP 307 về login đúng next. Không có browser connector gắn phiên người dùng; không đọc credential/token hoặc dùng service-role, chưa kiểm chứng login thành công/role/feed có session.
  - Typegen + tsc pass; scoped lint 0 errors, hai warning middleware cũ; build `build/fe-w2-content` exit 0 (compile 25.4s/types 13.2s). Kết quả test cuối và ảnh bổ sung tại FE_W2 mục 15.
  - Rà soát cuối giới hạn nhường lỗi Auth service chỉ cho Reseller loaders, không mở Merchant/Admin khi dịch vụ lỗi; helper thật kiểm tra 10 assertions bằng Node pass. Build cuối sau sửa exit 0 (64s/15.4s), scoped lint 0 errors/hai warning cũ. Unit case lưu thêm, không chạy lại mọi suite.
  - Test related lần đầu 40/44 pass (report gốc giữ lại); sau sửa cold navigation wait/selector alert, đúng sáu ca ảnh hưởng ở ba viewport PASS 6/6 exit 0. Không disable tests. Copy success/pending/error/manual dùng mock; policy unit xác minh reads=0 khi chưa xác nhận, loại status alias/other owner/campaign/product. Không gọi Tracking/AI/shared DB.
  - Case ảnh long variant sau reset scroll PASS 3/3 exit 0; đã xem ảnh mới 320/390/1440px. Preview detail server review 3000 HTTP 200 có nhãn fixture; reports/ảnh tại FE_W2 mục 15. Không coi logs HTTP 200 hoặc fixture là bằng chứng Auth/Feed có session thật.
- **In Progress:**
  - 03 UI/detail + Copy thuộc 04 WAITING_REVIEW; fixture/clipboard mock đã kiểm tra, không toàn bộ 03/04 DONE. Responsive/long/focus 320/390/1440 pass; ảnh và giới hạn kiểm chứng tại FE_W2 mục 15.
- **Blocked:**
  - Contents thật: producer `general/pending_approval` hoặc persona target_audience tự do/`published`; handoff đề xuất APPROVED/NEEDS_REVIEW, RLS SELECT contents USING(true). Chưa có giá trị/mẫu approved và quy tắc shared `reseller_id=NULL` / owned; `confirmedContentPolicy=null` chặn trước cả query contents.
  - Tracking modal/link/QR, form Campaign chưa triển khai theo phạm vi lượt này; dependencies BE1/BE3 trước đó giữ nguyên.
- **Handoff:**
  - Adapter policy có test lọc exact status/persona/campaign/product/owner bằng policy fixture riêng; không mapping published→APPROVED. BE1/BE3 cần trả lời câu hỏi tại FE_W2 mục 15. Không sửa tiến độ BE/QA hoặc DB chung.
- **Next:**
  - Review UI/Copy; kiểm tra Auth/Feed có session thủ công; BE1/BE3 chốt contract trước khi bật đọc contents thật. Chưa commit/push/merge.

#### FE (Diệu — tiếp quản)

- **Done:**
  - Audit hướng dẫn/Git/schema/contracts/env; branch `Feature_FE_W2_Integration`, HEAD `daa38805fa45f4622d0b3b0d45afa68c6d9fdcea`, initial clean/bằng cached origin/dev, chưa fetch.
  - Cập nhật FE_W2/FE rows: Diệu primary owner, giữ FE-W2-01–07, thêm 08 Terms và 09 Privacy, hạn chung 12:00 16/10/2026 UTC+7. Không ghi task implementation DONE.
  - Xác minh public Supabase URL/publishable có, secret/service-role thiếu; `.env.local` ignored/untracked, không in giá trị.
  - Code 01/02: protected layout, session/membership gate tại server/data loader, paginated exact-active Feed, Zod adapter; filter/search bỏ dấu Đ/đ, category/location options từ data, strict >10/>15 và các khoảng commission, reset/states/retry.
  - Scoped lint routes/components/lib/preview/tests/config mới exit 0; `next typegen` cập nhật stale Next types thành công, `node .../tsc --noEmit` exit 0; opt-in `NEXT_BUILD_DIR=build/fe-w2 npm.cmd run build` PASS (compile 44s, types 19.1s, page/routes generation).
  - Lượt tiếp nối hoàn tất hai lỗi UI: tab active dùng lại Button để giữ contrast, input `pl-10!` tránh icon chồng placeholder; không sửa globals.css. TypeScript/scoped lint sau sửa pass; build mới exit 0 (compile 70s, types 36.4s).
  - Suite sau sửa PASS 28/28, exit 0: 7 data/access/filter + 21 UI tại 320/390/1440px, 0 skip/failure/flaky. Contrast tab ≥4.5, icon/text gap ≥4px, overflow/keyboard/focus/states/filters pass; đã xem cả ba ảnh. JSON/ảnh local tại test-results/reseller, hướng dẫn tại FE_W2 mục 14. Fixture cô lập, không kiểm chứng Auth/Feed thật.
- **In Progress:**
  - FE-W2-01/02 WAITING_REVIEW; chờ Tester 1/UIUX review và live acceptance riêng. Dev-only preview + fixtures tách DB thật, Supabase config rỗng trong test process; membership được kiểm tra bằng unit tests, không ghi live role E2E DONE.
  - Baseline full lint: parser error `database.types.ts` UTF16LE + 2 unused-var middleware warnings còn tồn tại; default build .next EPERM unlink cache kể cả retry ngoài sandbox chưa giải quyết. Dùng output riêng ignored; không xóa cache hoặc dừng process để xử lý lỗi build nền, không cài dependency. Stale Next types đã được typegen cập nhật, tsc hiện pass.
  - Retry đầu dừng trước test vì 3101 còn server cũ; chuyển test sang 3103/output build/fe-w2-recheck. Sau test pass, đã xác minh và dọn đúng server test 3103 để giải tỏa Playwright teardown; CLI exit 0. Không dừng server cũ hoặc process khác; chưa chạy lại regression tuần 1 trong lượt tiếp nối.
- **Blocked:**
  - 04: tracking body reseller_id/admin trust, role/quan hệ/runtime key cần BE1; 05: contract campaign fields/AI notes/ownership cần BE1/PM.
  - 06: generated types/remote RLS/schema và approved content/pipeline cần BE1/BE3; chưa kiểm chứng Auth/DB thật. 03 chờ exact persona/status; UIUX review chưa có.
- **Handoff:**
  - Source/docs và kết quả/ảnh sau sửa có để Tester 1/UIUX review; câu hỏi BE1/BE3/PM trong FE_W2. Local fixture `/preview/reseller`, portal `/reseller/campaigns` theo FE_W2 mục 14. Chưa gửi tin qua công cụ, commit/push/PR/merge.
  - Dev localhost 3000 đã Ready; preview HTTP 200 có nhãn fixture, portal không session HTTP 307 về login giữ next. Đây là smoke check local, chưa kiểm chứng session/membership/dữ liệu Supabase thật.
- **Next:**
  - Tester 1/UIUX review 01/02; BE1/BE3 xác nhận runtime role/RLS/types/status rồi 03 → 04 → 05 → 06/07. Targeted search app/src/docs/.ai/role/process/README chưa thấy Terms/Privacy copy chính thức; 08/09 chờ PM hoặc khung có nhãn chờ duyệt, chưa code lượt này.
  - Giữ root app và tokens Coastal Editorial; không DB/seed/migration/n8n mutation, không tạo campaign trên DB chung, không analytics/ ví/checkout/admin/auto-post.

#### BE1 (Nguyễn Minh Tuệ)
- **Done:**
  - Merge thành công PR #12 (`Feature_Affiliate`) và PR #13 (`Feature_BE1_Optimization`) vào nhánh `dev`.
  - Tiếp nhận và phân rã 4 module nâng cấp từ `SP_BE1_W2` thành 4 task chính thức (`BE1-W2-07` đến `BE1-W2-10`).
  - Hoàn thành trọn vẹn cả 4 nhiệm vụ trên nhánh `Feature_BE1_AntiBot`:
    - `BE1-W2-07`: Mở rộng schema `clicks`, trigger đếm click hợp lệ (`clicks_anti_fraud_and_device_analytics.sql`).
    - `BE1-W2-08`: Module nhận diện Bot, Device Parser, Rate Limiter gắn vào `/r/[code]`.
    - `BE1-W2-09`: Bộ 4 Postgres RPC functions tính toán hiệu năng cao (`reseller_analytics_rpc.sql`).
    - `BE1-W2-10`: 2 API Route Handlers `/api/reseller/links` & `/api/reseller/analytics`.
  - Kiểm thử E2E kịch bản anti-bot, rate limit, crawler, analytics với `test_antibot_and_analytics.ps1` đạt PASS 100%. Next.js build pass 16/16 routes.
- **In Progress:**
  - Đẩy 4 commits lên branch `Feature_BE1_AntiBot`, chuẩn bị tạo PR merge vào `dev`.
- **Next:**
  - Hỗ trợ FE ghép UI Báo cáo Reseller với API mới và hỗ trợ Tester 3 chạy kiểm thử diện rộng.

### 13/10/2026 (Thứ Ba)

#### BE1 (Nguyễn Minh Tuệ)
- **Done:**
  - Hoàn thành migration `20261013140000_affiliate_links_and_clicks.sql` (bảng `affiliate_links` idempotent, bảng `clicks` raw log, trigger tăng clicks, trigger n8n `pg_net`, và RLS policies).
  - Hoàn thành Route Handler `POST /api/tracking/generate` & alias `/api/tracking-links/generate`.
  - Hoàn thành Route Handler `GET /r/[code]` ghi nhận click bất đồng bộ và 302 redirect.
  - Reset local database thành công 100%, regenerate `src/lib/database.types.ts`.
  - Build `npm run build` pass, chạy test suite `test_tracking.ps1` pass 100%.
  - Bàn giao API cho FE (giải tỏa `FE-W2-04`), bàn giao trigger cho BE3 (`BE3-W2-01`), bàn giao router cho Tester 3 (`T3-W2-02`).
- **In Progress:** Đẩy code lên nhánh `Feature_Affiliate`, chuẩn bị tạo PR vào `dev` và sync Supabase remote.
- **Next:** Hỗ trợ toàn đội chạy test tích hợp E2E vào Thứ Năm (15/10).

### 12/10/2026 (Thứ Hai)

#### PM (Nguyễn Minh Tuệ)
- **Done:** Chủ trì Kick-off Sprint 2, phê duyệt 4 hợp đồng giao tiếp, khởi tạo hệ thống 9 file kế hoạch Tuần 2 và bảng điều phối `TEAM_WORK_LOG.md`.
- **In Progress:** Giám sát handoff giữa UI/UX → FE và BE1 → BE3.
- **Next:** Rà soát code migration của BE1 và prompt system của BE2.

#### BE1 (Nguyễn Minh Tuệ)
- **Done:** Tham gia Kick-off, chốt specs API cấp tracking link và trigger webhook.
- **In Progress:** Viết migration mở rộng cho bảng `affiliate_links` và `clicks`.
- **Next:** Viết route handler `/api/tracking/generate` và database trigger `on_campaign_created`.

#### BE2 (Nguyễn Huỳnh)
- **Done:** Hoàn thiện Prompt 4 Personas, Zod/JSON Schema, parser, Guardrails; 11/11 unit tests, 10/10 live Gemini generations và 5/5 violation cases PASS.
- **In Progress:** Handoff cho BE3 và chốt mapping output arrays sang bảng `contents`.
- **Next:** Phối hợp BE3 chạy workflow cho Bà Nà Hills/VinWonders, sau đó bàn giao sample cho Tester 2.

#### BE3 (Thái Thanh Tú)
- **Done:** Chuẩn bị môi trường n8n cho Tuần 2, tạo Webhook Trigger node nhận Campaign.
- **In Progress:** Cấu hình node truy vấn thông tin chi tiết tour từ Supabase.
- **Next:** Nhận prompt từ BE2 và hoàn thiện luồng gọi Gemini API có retry.

#### FE (Thành viên Frontend — ghi chép lịch sử)

*Audit FE ngày 14/10: Không tìm thấy layout Reseller hoặc `src/lib/campaign-demo.ts` trên commit nền daa3880 khi Diệu tiếp quản. Các dòng dưới được giữ làm lịch sử, chưa phải bằng chứng deliverable tại checkout này. Trạng thái hiện tại xem phần FE Diệu ngày 14/10.*

- **Done:** Khởi tạo layout phân hệ Reseller `app/reseller/layout.tsx`.
- **In Progress:** Dựng giao diện Reseller Campaign Feed sử dụng mock data từ Tester 1.
- **Next:** Ghép hoàn thiện Campaign Card và bộ lọc theo địa điểm / hoa hồng.

#### UI/UX Designer
- **Done:** Hoàn thiện 70% bản vẽ Hi-fi Reseller Campaign Feed trên Figma.
- **In Progress:** Thiết kế chi tiết thẻ bài viết Suggested Content Kit theo 4 Personas.
- **Next:** Xuất bộ asset icons và bàn giao đầy đủ cho FE.

#### Tester 1 (QA Hybrid)
- **Done:** Hoàn thành file Mock Data `src/lib/campaign-demo.ts` và bàn giao cho FE.
- **In Progress:** Hỗ trợ FE rà soát CSS và kiểm tra responsive trên mobile.
- **Next:** Viết kịch bản test Playwright E2E cho phân hệ Reseller.

#### Tester 2 (AI Safety QA)
- **Done:** Xây dựng Rubric chấm điểm chất lượng và độ an toàn của nội dung AI.
- **In Progress:** Thiết kế bộ Test Cases tấn công Prompt Injection và JSON breaking.
- **Next:** Chờ đợt sinh bài đầu tiên từ n8n để chạy kiểm thử Groundedness.

#### Tester 3 (System QA)
- **Done:** Lập Test Plan chi tiết cho hệ thống Tracking Link và Redirect Router.
- **In Progress:** Thiết lập môi trường chạy test API tự động.
- **Next:** Viết test cases kiểm tra HTTP 302 và tính toàn vẹn của bảng `clicks`.

---

# RULES
1. Không tự nhận task người khác hoặc sửa status của họ từ suy đoán.
2. DONE cần deliverable và bằng chứng kiểm tra; UI code không đồng nghĩa E2E hoàn tất.
3. Task có owner; blocker có người bàn giao; interface có contract rõ ràng.
4. Requirement chưa rõ ghi `NEEDS DECISION`; không tự tiện xử lý conflict âm thầm.
5. Cập nhật phần bị ảnh hưởng, giữ lịch sử và không tạo log trùng lặp.
6. **Hạn chót toàn bộ code và PRs:** 12:00 PM Thứ Sáu (16/10/2026).
7. Chiều Thứ Sáu (13:30 – 17:30): Bắt buộc tham gia đầy đủ Cross-testing, Hotfix và Demo nghiệm thu.
