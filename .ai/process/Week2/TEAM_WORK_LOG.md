# TEAM WORK LOG
Project: AI Travel Reseller MVP (TravelLink AI)  
Week: Tuần 2 — 12/10/2026 – 16/10/2026 (Sprint 2)  
Last Updated: 14/10/2026 10:45 AM

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
| BE2-W2-01 | Nguyễn Huỳnh | BE2 | Prompt System phân theo 4 Personas du lịch | DONE | 12/10 | 12/10 17:00 |
| BE2-W2-02/03 | Nguyễn Huỳnh | BE2 | Zod Structured Output Schema & Content Guardrails | DONE | 13/10 | 13/10 17:00 |
| BE3-W2-01/02 | Thái Thanh Tú | BE3 | Workflow n8n Campaign-to-AI-Content-Pipeline | READY | 12/10 | 13/10 17:00 |
| BE3-W2-03/04 | Thái Thanh Tú | BE3 | Node kiểm duyệt & Lưu nội dung vào bảng `contents` | READY | 13/10 | 14/10 17:00 |
| FE-W2-01/02 | Thành viên FE | FE | Layout Reseller Portal & Màn hình Bảng tin (`/reseller/campaigns`) | READY | 12/10 | 13/10 17:00 |
| FE-W2-03/04 | Thành viên FE | FE | Màn hình Chi tiết Chiến dịch & Modal Lấy Tracking Link | READY | 13/10 | 14/10 17:00 |
| FE-W2-05/06 | Thành viên FE | FE | Form tạo Campaign Merchant & Tích hợp dữ liệu thật DB | READY | 14/10 | 15/10 17:00 |
| UX-W2-01/02 | UI/UX Designer | UI/UX | Figma Hi-fi Reseller Feed & Suggested Content Kit | IN_PROGRESS | 12/10 | 13/10 12:00 |
| T1-W2-01/02 | Tester 1 | QA Hybrid | Mock Data `campaign-demo.ts` & Hỗ trợ CSS Responsive | READY | 12/10 | 13/10 17:00 |
| T1-W2-03/04 | Tester 1 | QA Hybrid | Bộ test tự động Playwright E2E (`tests/reseller.spec.ts`) | READY | 13/10 | 14/10 17:00 |
| T2-W2-01/03 | Tester 2 | AI Safety QA | Rubric chấm điểm nội dung & Test chống ảo giác giá vé | READY | 12/10 | 14/10 17:00 |
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

---

## 3. IN PROGRESS
| Task ID | Member | Task | Progress | Blocker | Next Step |
|---|---|---|---|---|---|
| UX-W2-01 | UI/UX | Hoàn thiện Figma Hi-fi Reseller Feed | 70% | Chốt các trường bắt buộc trên Card | Xuất specs và asset cho FE |
| BE2-W2-04 | BE2 | Handoff Prompt, Schema & Guardrails cho BE3 | 90% | Chờ quyết định mapping mảng output → rows `contents` | BE3 review artifact và chốt mapping với FE |
| BE3-W2-01 | BE3 | Tạo Node Webhook tiếp nhận Campaign trên n8n | 50% | None (Đã có trigger BE1) | Cấu hình webhook URL cố định & test |
| FE-W2-01 | FE | Khởi tạo cấu trúc router `/reseller/campaigns` | 30% | Chờ Figma từ UI/UX | Dựng layout chung bằng mock data |

---

## 4. BLOCKED
| Task ID | Owner | Blocked By | Required From | Impact |
|---|---|---|---|---|
| FE-W2-04 | FE | None (Đã giải tỏa bởi BE1) | BE1 | FE đã có API `POST /api/tracking/generate` để ghép Modal |
| BE3-W2-02 | BE3 | Prompt templates & Zod schema chính thức | BE2 | n8n tạm dùng prompt thử nghiệm của W1 |
| T3-W2-02 | Tester 3 | None (Đã giải tỏa bởi BE1) | BE1 | Tester 3 đã có router `/r/[code]` để chạy test suite 302 |
| BE2-W2-04 | BE2 | Mapping 10 hooks + 5 scripts/captions/CTAs sang rows `contents` | BE3 + FE + PM | Không thể khóa batch-insert contract nếu chưa chốt cách ghép |

---

## 5. HANDOFFS
| From | To | Deliverable | Status | Date |
|---|---|---|---|---|
| PM | Toàn team | Phân công nhiệm vụ chi tiết Tuần 2 (Week2.md + 9 work plans) | DONE | 12/10 |
| UI/UX | FE | Figma Hi-fi Reseller Feed & Component Specs | WAITING_REVIEW | 12/10 |
| Tester 1 | FE | Bộ Mock Data `src/lib/campaign-demo.ts` | DONE | 12/10 |
| BE2 | BE3 | Prompt Templates + Zod/JSON Schema + Guardrails + Test Report | WAITING_REVIEW | 13/10 |
| BE1 | BE3 | Webhook trigger `on_campaign_created` payload specs | DONE | 13/10 |
| BE1 | FE | API Contract `POST /api/tracking/generate` & `/api/tracking-links/generate` | DONE | 13/10 |
| BE1 | Tester 3 | Redirect Router `/r/[code]` & Schema `clicks` | DONE | 13/10 |
| BE1 | FE | API Báo cáo & Link Reseller (`GET /api/reseller/links`, `GET /api/reseller/analytics`) | DONE | 14/10 |
| BE1 | Tester 3 | RPC Functions & Test script lọc Bot, Rate limit, Analytics | DONE | 14/10 |
| BE3 | FE | Dữ liệu nội dung bài viết sinh tự động vào bảng `contents` | READY_FOR_HANDOFF | 14/10 |
| FE | Tester 1 | Nhánh code Reseller Portal để viết Playwright test | READY_FOR_HANDOFF | 14/10 |

---

## 6. INTERFACES
| Interface | Owner | Consumer | Contract / Definition | Status |
|---|---|---|---|---|
| Tracking API | BE1 | FE | `POST /api/tracking/generate` nhận `{ campaign_id, product_id }` trả `{ short_url, tracking_id }` | CONTRACT AGREED |
| Redirect Router | BE1 | End Customer / QA | `GET /r/[code]` ghi nhận bảng `clicks` và 302 redirect tới official URL | CONTRACT AGREED |
| Webhook Campaign | BE1 | BE3 | `POST n8n-webhook` payload: `{ campaign_id, product_id, title, commission_rate }` | CONTRACT AGREED |
| LLM Output Schema | BE2 | BE3 | JSON schema gồm: `persona`, `hooks[]`, `scripts[]`, `captions[]`, `ctas[]` | IMPLEMENTED & TESTED |
| LLM Output → `contents` rows | BE3 | BE2 / FE | Cách ghép 10 hooks với 5 scripts/captions/CTAs | NEEDS DECISION |
| Reseller Card Specs | UI/UX | FE | Hiển thị ảnh, tên tour, địa điểm, badge hoa hồng cam đất, nút hành động | CONTRACT AGREED |
| Bảng `contents` Schema | BE1 / BE3 | FE | Các cột: `product_id`, `persona`, `hook`, `script`, `caption`, `cta`, `status` | CONTRACT LIVE |
| Reseller Links API | BE1 | FE | `GET /api/reseller/links`: Danh sách link tiếp thị kèm số click hợp lệ | CONTRACT AGREED |
| Reseller Analytics API | BE1 | FE | `GET /api/reseller/analytics`: Dữ liệu biểu đồ timeseries, devices, top campaigns | CONTRACT AGREED |

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

---

## 11. DAILY UPDATE

### 14/10/2026 (Thứ Tư)

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

#### FE (Thành viên Frontend)
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
