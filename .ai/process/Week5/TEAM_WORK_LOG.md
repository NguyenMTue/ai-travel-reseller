# TEAM WORK LOG — SPRINT 5
Project: AI Travel Reseller Platform (TravelLink AI)  
Week: Tuần 5 (02/11/2026 – 07/11/2026) — Sprint 5 (Final Sprint / Go-Live)  
Last Updated: 02/11/2026 09:00:00  
Milestone: FINAL E2E UAT, PERFORMANCE STRESS TESTING, RLS SECURITY AUDIT & PRODUCTION GO-LIVE  

---

Phạm vi nhật ký: Điều phối toàn bộ hoạt động tuần về đích của 10 thành viên. Trọng tâm: Khóa tính năng (Feature Freeze), Nghiệm thu thực tế E2E 3 vai trò, Kiểm thử chịu tải k6 (1.000 VUs), Rà soát an toàn phân quyền Supabase RLS, Triển khai Production lên Vercel + Supabase Cloud và Bàn giao chính thức dự án. Tester 3 (chuyển sang FE) đảm nhiệm các component giao diện độc lập, tuân thủ nguyên tắc không gây ảnh hưởng đến bất kỳ ai trong nhóm.

---

## 1. ACTIVE WORK

| Task ID | Member | Role | Task | Status | Started | Deadline |
|---|---|---|---|---|---|---|
| PM-W5-01 | Nguyễn Minh Tuệ | PM / BE1 Lead | Họp Kick-off Sprint 5, ban hành quyết định Feature Freeze và master plan 6 ngày | IN_PROGRESS | 02/11 09:00 | 02/11 11:00 |
| BE1-W5-01 | Nguyễn Minh Tuệ | BE1 Lead | Setup & migrate toàn bộ Database lên Supabase Cloud Production | READY | 02/11 10:00 | 02/11 17:00 |
| BE1-W5-02 | Nguyễn Minh Tuệ | BE1 Lead | Tối ưu hóa Supavisor Connection Pooling phục vụ k6 load test | READY | 03/11 08:30 | 03/11 12:00 |
| BE1-W5-03 | Nguyễn Minh Tuệ | BE1 Lead | Cấu hình Supabase Storage Production `campaign-videos` & CDN | READY | 03/11 13:00 | 03/11 17:00 |
| BE1-W5-04 | Nguyễn Minh Tuệ | BE1 Lead | Phối hợp triển khai Production Release lên Vercel & kiểm tra SSL | READY | 05/11 08:30 | 05/11 17:00 |
| BE2-W5-01 | Nguyễn Huỳnh | BE2 Lead | Cấu hình Gemini Production API Gateway, Rate Limiting & Fallbacks | READY | 02/11 10:00 | 02/11 17:00 |
| BE2-W5-02 | Nguyễn Huỳnh | BE2 Lead | Khóa chặt Intent Routing & Production Grounding cho Sales Agent | READY | 03/11 08:30 | 03/11 17:00 |
| BE2-W5-03 | Nguyễn Huỳnh | BE2 Lead | Giám sát AI logs real-time và tinh chỉnh prompt trong phiên UAT | READY | 04/11 08:30 | 04/11 17:00 |
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
| QA-W5-02 | Trương Đức Huy | QA Lead | Điều phối & thực thi kịch bản Final E2E UAT 3 vai trò | READY | 04/11 09:00 | 04/11 17:00 |
| QA-W5-03 | Trương Đức Huy | QA Lead | Chạy bộ kiểm thử Smoke Test Playwright trên Domain Production | READY | 05/11 13:00 | 05/11 17:00 |
| QA-W5-04 | Trương Đức Huy | QA Lead | Kiểm tra độc lập giao diện FAQ Modal & Offline Banner của Tester 3 | READY | 04/11 14:00 | 04/11 17:00 |
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

## 2. COMPLETED WORK (KẾ THỪA TỪ SPRINT 4)

| Task ID | Member | Deliverable | Completed At | Handoff To |
|---|---|---|---|---|
| BE1-W4-01..04 | Nguyễn Minh Tuệ | Motion 2.5D Parallax, Auto-Ducking 3 lớp, Render FFmpeg 1080x1920 30fps, 02 video mẫu | 30/10/2026 | FE Lead, QA, Toàn team |
| BE2-W4-01..03 | Nguyễn Huỳnh | JSON Schema 14 scenes, Khóa 46/46 Anti-Hallucination tests, Verified Facts Catalog | 30/10/2026 | BE1, QA 2 |
| BE3-W4-01..02 | Thái Thanh Tú | Hàng đợi retry n8n (Exponential Backoff 3 lần), Thông báo Telegram kèm preview | 30/10/2026 | FE Lead, QA |
| FE-W4-01..04 | Cao T. Thu Diệu | Video Player 9:16 + Nút tải MP4, PWA Touch Gestures, Tích hợp modal mẹo đăng bài | 30/10/2026 | QA Lead, Toàn team |
| T3-FE-W4-01..04| Nguyễn Anh Tuấn | Component `VideoPostingTipsModal` (Dumb UI), 0 lỗi lint/typecheck, Merged vào `dev` | 29/10/2026 | FE Lead |
| QA-W4-01..05 | Huy, Minh | Báo cáo test di động C3 qua Cloudflared, Thẩm định Video Rubric 9.4/10, Báo cáo An toàn AI | 31/10/2026 | Stakeholders |
| BA-W4-01..03 | Lê Mỹ Uyên | Master Roadmap 5 tuần, Acceptance Criteria Video v2, Kịch bản UAT Sprint 5 | 30/10/2026 | Toàn team |
| UX-W4-01..02 | Quý Bửu | 03 file PNG overlays 9:16 (vignette, safe zone, badge), Design specs cho Tester 3 | 28/10/2026 | BE1, Tester 3 |

---

## 3. IN PROGRESS
1. **PM-W5-01:** Họp Kick-off Sprint 5, phổ biến quyết định Feature Freeze và chốt timeline 6 ngày.
2. **BE1-W5-01:** Khởi tạo project Supabase Cloud Production khu vực Singapore `ap-southeast-1`.
3. **FE-W5-01:** Rà soát luồng điều hướng nút thanh toán từ khung chat AI sang trang đặt vé.

---

## 4. BLOCKED
*Hiện tại không có blocker nào cản trở luồng công việc.* Toàn bộ mã nguồn trên nhánh `dev` sạch sẽ và đã vượt qua tất cả các bài kiểm tra chất lượng của Sprint 4.

---

## 5. HANDOFFS

| From | To | Deliverable | Format | Deadline | Status |
|---|---|---|---|:---:|:---:|
| PM / BE1 | Toàn team | Quyết định Feature Freeze & Master Gantt 6 Ngày | Biên bản họp Kick-off | 02/11 11:00 | `IN_PROGRESS` |
| UI/UX | FE & Tester 3 | PWA Icons & Design Specs cho FAQ/Offline Modal | Assets & Figma link | 02/11 17:00 | `READY` |
| BE1 Lead | QA Lead (Huy) | Connection string Supabase Pooler để chạy k6 | Credentials an toàn | 03/11 08:30 | `WAITING` |
| BE2 Lead | FE Lead (Diệu) | Production Streaming Chat Endpoint | API Spec | 02/11 17:00 | `READY` |
| FE Lead | QA Lead (Huy) | Bản build Staging sẵn sàng cho E2E UAT | Web URL Staging | 03/11 17:00 | `WAITING` |
| Tester 3 | FE Lead (Diệu) | PR component `reseller-faq-modal` & `offline-banner` | GitHub PR trên nhánh cô lập | 04/11 17:00 | `WAITING` |
| BA Lead | Dev Team | Danh sách ticket bug UAT phát sinh | Bug Log table | 04/11 17:30 | `WAITING` |
| BE1 & FE | Toàn team | Production Live URL trên Vercel + Supabase Cloud | Domain chính thức + SSL | 05/11 17:00 | `WAITING` |
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

---

## 7. SHARED RESOURCES

| Tài nguyên | Người phụ trách | Đường dẫn / Vị trí | Trạng thái |
|---|---|---|:---:|
| Mã nguồn nhánh chính | PM / BE1 | Git branch `dev` $\rightarrow$ `main` (Release v1.0.0) | Chuẩn bị Code Freeze |
| Database Supabase Cloud | BE1 Lead | Supabase Cloud Singapore (`ap-southeast-1`) | Chuẩn bị migration |
| Domain Production | PM / BE1 | Custom domain chính thức liên kết Vercel | Đã cấu hình DNS |
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

