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
| FE-W5-01 | Cao T. Thu Diệu | FE Lead | Contract đã chốt; chờ bàn giao/test BE URL, xác minh thanh toán theo đơn và quy trình sandbox | IN_PROGRESS | 01/11/2026 | 03/11 17:00 |
| FE-W5-02 | Cao T. Thu Diệu | FE Lead | PM nghiệm thu theo median P>90, tiêu chí điều chỉnh BE02/11 22:15; giữ giới hạn QA | DONE | 02/11/2026 | 04/11 12:00 |
| FE-W5-03 | Cao T. Thu Diệu | FE Lead | Trực chiến fix bug giao diện trong phiên Final E2E UAT | READY | 04/11 09:00 | 05/11 12:00 |
| FE-W5-04 | Cao T. Thu Diệu | FE Lead | Review cô lập PR61/8f02a22; chờ sửa FAQ-01, chốt banner và PR/HEAD mới | IN_PROGRESS | 04/11 14:00 | 04/11 17:00 |
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
3. **FE-W5-01 (cập nhật FE 01/11/2026):** Worktree E:/THUCTAP/ai-travel-reseller-fe-w5, branch feature/fe-w5-production-checkout-pwa-polish từ origin/dev 7ced50a. CTA/URL-attribution/error/expiry và fixture hoàn tất theo contract chat hiện hữu; unit 6/6, browser 4 viewport, Bottom Sheet regression, scoped lint, typecheck và Webpack build PASS. Chưa nghiệm thu checkout thật; xem FE_W5.md mục 6.

---

### FE: bằng chứng và phụ thuộc thực tế — 01/11/2026

- FE-W5-01 còn chờ BE1/BE2 bàn giao Order API, signed attribution/tracking_code/session và trạng thái đơn/thanh toán đáng tin. Query ref/campaign/product hiện hữu không phải bằng chứng quyền hoặc hoa hồng. Không dựng màn hình thành công hay cập nhật ví giả.
- PR #54 vẫn OPEN/DRAFT tại df2147e, chưa merge. Tuần 5 không phụ thuộc code riêng tuần 4 cho checkout; FE-W5-02 phải đồng bộ video/PWA/mobile từ dev sau khi PR thực sự merge. Đây không phải xác nhận nghiệm thu lịch sử tuần 4.
- FE-W5-02: 04/11 12:00, build riêng PASS nhưng Lighthouse/PWA còn chờ đo. FE-W5-04: 04/11 17:00, chưa thấy remote branch/PR feature/fe-t3-w5-standalone-ui hoặc bàn giao FAQ/Offline Banner; không làm thay. FE-W5-03: 05/11 12:00, chờ BA/QA UAT bugs.
- Preview fixture: http://127.0.0.1:3195/preview/chat. Không gọi AI trả phí, API tạo đơn/thanh toán/link tracking hoặc ghi dữ liệu dùng chung; chưa nghiệm thu thiết bị thật. Không commit/push/PR/approval/merge GitHub.

### FE: thực thi Production/PWA — 02/11/2026

- Backup 12 file/hash tại E:/THUCTAP/fe-w5-recovery/20261102-f41e5871; checkpoint LOCAL 44d02ca chỉ source/test/tài liệu FE-W5-01. Fetch riêng dev vẫn 7ced50a, tích hợp trả Already up to date, không conflict/merge commit. Tối ưu mới chưa commit/push.
- PR #54 vẫn OPEN/DRAFT, chưa tích hợp; đây là baseline trước bản tuần 4 đầy đủ. Không merge/cherry-pick nhánh tuần 4 hoặc làm lại mobile/video.
- FE-W5-02: Lighthouse 13.0.1, Chrome 156, production Webpack, 3 lượt/route. P trung vị / 88→93 (sau 84–94), /chat 88→94 (94–96), /login 90→94 (92–95); A sau 95/95/100, BP đều100. Script transfer KiB 243.9→142.2, 262.5→160.8, 298.1→196.4. Ngân sách120KiB chưa đạt; TBT chat/login tăng, không kết luận mọi chỉ số tốt hơn.
- Tách tải PostHog nhưng giữ configured analytics/early funnel events; ưu tiên ảnh LCP; SW v2 chỉ core offline/icons + font/CSS content-hashed immutable, giới hạn32, không cache private data. Unit15/15, PWA lifecycle/installability/offline/dev cleanup, checkout4viewport, scoped lint/typecheck/build PASS. Thiết bị thật/portal có session chưa nghiệm thu.
- Báo cáo HTML/JSON/ảnh ngoài Git tại E:/THUCTAP/fe-w5-recovery; chi tiết phương pháp, số đo và lệnh ở FE_W5.md mục7. Production http://127.0.0.1:3196/; fixture http://127.0.0.1:3195/preview/chat.
- FE-W5-01 vẫn chờ contract BE và chưa nghiệm thu checkout thật. FE-W5-04: truy vấn đúng nhánh/PR Tester3 ngày02/11 chưa thấy bàn giao; không làm FAQ/Offline Banner thay hoặc đăng approval. FE-W5-03 chờ BA/QA UAT bugs. Không đánh dấu cả tuần hoàn thành hoặc UIUX/QA đã duyệt.
### FE: sau merge PR #54 — 02/11/2026

- Backup12 file/diff/hash: E:/THUCTAP/fe-w5-recovery/20261102-before-dev-d8f3f1e5. Checkpoint local28afb5f; dev89c9d4f xác minh là merge thật #54 (parent7ced50a,df2147e); merge local4b0c977 không conflict. Giữ checkout/analytics/SW tuần5 và player/download/modal/safe area/rewrite tuần4; không cherry-pick/rebase/push.
- Env/exclude và12 file cũ giữ nguyên hash ngay sau merge; Next chỉ thêm include output local về sau. Không commit env/artifact/tsconfig. Sửa duy nhất fixture SWv1 dùng commit cũ thay HEAD; chưa commit sửa test/tài liệu mới.
- Unit18/18, content-query fixture3/3, scoped lint/typecheck/build Webpack PASS. Browser checkout/Bottom Sheet/player/download/touch-safe area/modal/rewrite/PWA PASS; không gọi dịch vụ AI/Tracking/DB thật hoặc /r/. Login GET200, enabled và hydration xác minh; để người dùng tự đăng nhập.
- Lighthouse13.0.1/Chrome156, mobile412x823 DPR1.75, simulated RTT150ms/CPU4x,3 lượt lạnh/route, không build/test nặng đồng thời. P trung vị /91(90–94), /chat93(93–94), /login98(96–99); A95/95/100, BP100. JS transfer142.2/160.7/196.4KiB; không gọi đó là First Load JS.
- Ngân sách120kB/KiB chưa đạt theo kiểm kê startup và chưa thống nhất định nghĩa First Load JS. Chỉ phân tích/đề xuất, không tối ưu đợt mới. Lần cũ thiếu Supabase/chưa có #54 nên không quy chênh lệch thuần cho performance optimization.
- Production http://127.0.0.1:3196/ PID17424, preview http://127.0.0.1:3195/preview/chat listenerPID3728; cả hai không chạy đầu lượt, đã mở đúng worktree/output riêng. Reports ngoài Git: E:/THUCTAP/fe-w5-recovery/performance-post54-20261102 và post54-20261102.
- FE-W5-01 còn chờ contract checkout BE; FE-W5-02 còn ngân sách JS/portal có session/thiết bị thật; FE-W5-03 chờ UAT bugs, FE-W5-04 chờ Tester3. Không nghiệm thu toàn tuần5 hoặc thay mặt UIUX/QA duyệt.

### FE: checkout theo tài liệu BE1 v1.0.0 — 02/11/2026

- Đọc trực tiếp E:/HKDN_126/checkout_integration_guide_for_fe.md; đối chiếu từng mục tại FE_W5.md mục9. Contract structured URL/ref/campaign/product, domain và attribution30ngày đã rõ; không yêu cầu lại các thông tin này.
- Hoàn thiện allowlist4 domain chính xác, giữ HTTPS/attribution/query-secret validation/domain hiển thị/tab mới an toàn. Giữ checkout_clicked và bảo vệ loading/offline/session/dedup/late reply. Thêm fixture BE1 đúng UUID + HTTPS ngoài allowlist; không sửa backend/Wallet/env hoặc tạo success state từ click.
- Unit/mock20/20, browser fixture4viewport, TypeScript và scoped lint PASS. Webpack output riêng build/fe-w5-checkout-be1-20261102; bundle đổi nên cần đo lại Lighthouse trên build mới, không áp điểm mục8 sang bản mới.
- Khác biệt: BE chat chưa fallback booking_url/chưa kiểm valid_to; Wallet sample thiếu trường so với schema, dùng masked_customer_name thay customer_name đã mask; guide mapping confirmed/paid sang số dư khác RPC repo. FE giữ số server/validation, không tự remap hoặc tính hoa hồng từ click.
- FE-W5-01 còn IN_PROGRESS: chờ endpoint xác nhận thanh toán/correlation đơn và sandbox cô lập, cùng BE xác nhận khác biệt trên. GET Wallet đã có, không yêu cầu lại. Không chạy RPC process_order_attribution mục6.3, không gọi AI/Tracking/checkout thật/DB; không fetch/merge/commit/push.
- Kiểm tra UI an toàn: http://127.0.0.1:3195/preview/chat, chọn Checkout BE1 v1.0.0 (fixture), hỏi mua vé rồi bấm CTA mô phỏng. Chi tiết bằng chứng/giới hạn tại FE_W5.md mục9.
- Build cuối Webpack PASS; đã xác minh PID rồi thay đúng3196 (17424→20384), giữ preview3195/PID3728. HTTP/hydration login/chat PASS,10 script chunks hash khớp build mới và có allowlist; không gửi form/chat. Smoke JSON trong output ignored.

### FE: tối ưu bundle có bằng chứng — FE-W5-02 — 02/11/2026

- Ghi nhận đúng quan sát người dùng trên preview: fixture BE1 có sunworld.vn/CTA; CTA loading rồi trở về Đặt vé ngay; HTTPS ngoài allowlist không có CTA. Chưa xác nhận thanh toán/điện thoại thật/giữ hội thoại khi đóng mở.
- Module graph xác nhận tailwind-merge106124 source bytes bị kéo qua primitive. Chỉ sửa AuthForm/ChatPanel dùng HTML với class cố định tương đương; bỏ import ghép class thừa, giữ handlers/disabled/validation. Link Dashboard demo trong AuthForm prefetch=false, vẫn mở khi bấm; không trì hoãn auth/checkout.
- Initial modern gzip /139.1→139.1, /chat149.8→139.7, /login153.2→143.1KiB. Chưa đạt120KiB, còn vượt19.1/19.7/23.1; hai chunk framework hiện126.1KiB. Phân biệt initial/raw/gzip, JS transfer, giải nén và First Load JS chưa thống nhất; PM cần chốt metric, không đổi ngưỡng/cách tính để báo đạt.
- Unit18/18, browser checkout/Bottom Sheet4viewport, auth class/field/toggle/mismatch/next/role và demo-navigation smoke PASS; typecheck/scoped lint/build Webpack và PWA production cuối PASS. Không giảm assertion/tắt rule; backup lọt glob và lỗi encoding runner đã xử lý trong công cụ, không sửa backend.
- Lighthouse cuối13.0.1/Chrome156, mobile412x823 DPR1.75, simulated RTT150ms/CPU4x, config giống sau #54,3 profile lạnh/route và không test/build nặng đồng thời. P94(93–94)/94(92–96)/95(81–96), A95/95/100, BP100; transfer142.2/150.3/151.1KiB, giải nén462.5/481.5/479.2KiB. Giữ lượt81, không coi điểm ổn định hoặc mọi lượt≥90.
- Reports cuối build/fe-w5-budget-20261102/lighthouse-complete; giữ bộ9 lượt trung gian trước thay đổi prefetch. results-summary.json và FE_W5.md mục10 giải thích so sánh sau #54 khác source checkout BE1; không quy toàn bộ chênh lệch score cho tối ưu.
- Build cuối build/fe-w5-budget-complete-20261102, ID BWmX6rdAgq6mcFDcV4IPt; production3196/PID11496 sau xác minh listener/worktree, preview3195/PID3728 giữ nguyên. Env/exclude và source tuần4/checkout/analytics/SW giữ nguyên; chỉ include output local tự sinh thêm. Không fetch/merge/commit/push/env/backend/DB/RLS/AI/Tracking/đơn/RPC/Telegram/tunnel hoặc /r/.
- FE-W5-02 còn IN_PROGRESS: ngân sách JS, dao động login, portal có session/thiết bị thật/PM metric. FE-W5-01 còn chờ BE xác nhận khác biệt contract, xác minh thanh toán theo đơn và sandbox; không mở lại các thông tin đã bàn giao hoặc nghiệm thu toàn tuần.
- Kiểm tra nhẹ http://127.0.0.1:3196/login: toggle mật khẩu, mở Xem thử Dashboard; fixture checkout vẫn ở http://127.0.0.1:3195/preview/chat. Không cần gửi form/checkout thật.

### FE: kiểm tra bàn giao Tester3 — FE-W5-04 — 02/11/2026

- Đã đọc AGENTS/FE_W5/TESTER3_W5/UIUX_W5 và interface LOCKED. Worktree/branch/HEAD4b0c977 giữ nguyên cùng diff FE-W5-01/02, source tuần4, env/config local; không git fetch/merge/cherry-pick/commit/push.
- GitHub HTTP GET: kiểm55 nhánh và56 PR all states; search head dự kiến + FAQ/offline/standalone/tên file/symbol; code search default branch; tree recursive không truncated trên dev và3 nhánh T3/QA liên quan. Không kết luận từ việc thiếu đúng một tên nhánh.
- PR33/f9a5509 (Feature/fe-t3-static-components) là MediaCard/VideoGuidelinesModal tuần3; nhánh feature chữ thường/f66ff8c cũng không có FAQ/Offline; PR50/b87ecb6 là VideoPostingTipsModal tuần4; PR48/bcb22f8 là QA modal cũ. Đã lấy đủ file lists, chưa tìm thấy bàn giao FAQ Modal/Offline Banner tuần5 trong nguồn đã kiểm.
- Discovery timestamp/queries/HEAD/file lists: build/fe-w5-t3-review-20261102/discovery.json. Checklist đầy đủ tại FE_W5.md mục11: scope, harness pin SHA, FAQ keyboard/focus/inert/scroll, banner network/a11y/cleanup/layout, SW không trùng/retry,4viewport+ngang, chụp và xem ảnh, lint/typecheck, findings file/line/repro/severity.
- Chờ Tester3 gửi PR hoặc commit/base/files/styles/imports và logs lint/typecheck/cách render; dẫn chiếu UIUX/Figma nếu đã nhận. UIUX_W5 chỉ có kế hoạch handoff, chưa có thông số/link cụ thể trong file. FAQ business copy cần đối chiếu BA/contract Wallet, tuổi link khác cửa sổ attribution30ngày; chưa gán thành lỗi component.
- Chưa có source nên harness/lint/typecheck/browser/ảnh review mới NOT_RUN, không giả PASS hoặc làm component thay. FE-W5-04 WAITING_HANDOFF, chưa approval/tích hợp/nghiệm thu app hay thiết bị; không chặn FE-W5-01/02. Không gửi comment/review/approval.
- Giữ server preview3195/PID3728 và production3196/PID11496; không restart, không gọi AI/Tracking/đơn/thanh toán/DB hoặc /r/.

### FE: cập nhật quyết định nghiệm thu BE1/PM — 02/11/2026,22:15

- Căn cứ đọc trực tiếp E:/HKDN_126/week5-be1-fe-integration-qa.md, “GIẢI ĐÁP KỸ THUẬT & ĐỒNG BỘ CONTRACT FE — BE1 (SPRINT5)”, Nguyễn Minh Tuệ/BE1 Lead & PM, bản đề22:15 ngày02/11/2026, không có số version; chi tiết/hash tại FE_W5.md mục12.
- FE-W5-02 DONE theo PM chấp nhận Performance trung vị>90 trên3route và điều chỉnh tiêu chí120KiB. Giữ nguyên số đo/phương pháp/lượt login81: P94(93–94)/94(92–96)/95(81–96), A95/95/100,BP100; initial modern gzip139.1/139.7/143.1KiB vẫn vượt120. Không ghi tổng JS đã dưới120 hoặc bỏ vendor khỏi phép đo.
- Phép trừ vendor trong tài liệu là ước lượng tổng hợp, không phải phân tích module/first-party chính xác; không khẳng định runtime luôn bất biến hoặc không thể tối ưu. Không làm thêm tối ưu chỉ để ép ngưỡng cũ. Portal có session, realme C21Y/Safari/PWA và trải nghiệm thực tế còn QA riêng; không nghiệm thu toàn tuần.
- FE-W5-01 vẫn IN_PROGRESS: BE sẽ bổ sung payment_url||booking_url,valid_to/status; FE giữ suggested_checkout_url và validation/ẩn CTA khi null. Cam kết không phải bằng chứng đã commit/deploy. Wallet chốt theo code/RPC hiện tại, không sửa theo spec cũ; không tiếp tục chờ chọn lại mapping/schema đã được BE chốt.
- Ghi nhận thủ công người dùng: toggle mật khẩu hoạt động hai chiều; Xem thử Dashboard mở được Dashboard mẫu. Không mở rộng phạm vi xác nhận.
- Checklist mục12: fixture URL ưu tiên/fallback/null/expired/inactive, attribution/guard/trạng thái; Wallet bằng đơn mẫu tách payment E2E; chưa có endpoint trạng thái đơn riêng cho FE. Không thêm query orders trong browser hoặc màn hình thành công; chờ bàn giao/kiểm chứng BE và quy trình QA môi trường đã mô tả.
- Lượt này chỉ tài liệu/checklist: không chạy SQL/RPC/seed/migration/AI/Tracking/thanh toán, không đổi env sang local, không sửa source/backend/DB, không fetch/merge/commit/push/restart hoặc đăng approval. FE-W5-03/04 giữ theo nhật ký trước, không được nghiệm thu bởi quyết định FE-W5-02.

### FE: review thực thi Tester3 — FE-W5-04 — 04/11/2026

- Xác minh GitHub GET: PR61 CLOSED, merged=false; branch Feature/fe-t3-w5-standalone-ui và PR HEAD đều8f02a22ebf8813310c9e0f61520c0eab210c9bdf. Base/merge-base dd3dfe2a487170a987f1cf45e575c629f9565d90; toàn bộ diff chỉ2 added component (+196/-0). Rà61 PR/60 branch và file lists PR57–60; PR59 là QA, chưa tìm thấy bản component thay thế.
- Review source nguyên bản theo SHA bằng harness ngoài worktree FE, hash Git blob khớp GitHub. Không checkout/merge/cherry-pick hay sửa component Tester3. Artifact: E:/THUCTAP/ai-travel-reseller/build/fe-w4-worktree/build/fe-w5-t3-review-20261104; chi tiết FE_W5.md mục13.
- Chrome156.0.8078.80/Playwright1.64;76 assertions hành vi đạt, thêm test initial-offline shell local; scoped lint/TypeScript snapshot exit0. Lint có thông báo plugin Next thiếu Pages directory ở harness, không source diagnostic; không tắt rule. Chụp và mở xem18 ảnh cuối,5 viewport320/390/768/1440 và667x375 ngang, dùng token/font local của app. Không tuyên bố full-app build/lint/typecheck hoặc physical screen reader đã đạt.
- FAQ native dialog/focus/Tab/Shift+Tab/Escape/scroll/cleanup đạt trong harness; FAQ-01/P2 tại reseller-faq-modal.tsx:109–111: click padding nội bộ cũng đóng. Cần Tester3 sửa backdrop detection, rồi review SHA mới. Copy5FAQ khớp TESTER3_W5 nhưng cam kết ví/tuổi link cần PM/BA/BE chốt trước phát hành.
- Banner controlled prop đúng contract, không tự listener/fetch/retry;3 vòng network qua host adapter và8 remount không trùng/leak. BANNER-01/P2 tại offline-banner.tsx:14: fixed góc trên che CTA header fixture; không che Bottom Nav88px. Chốt slot/offset trước tích hợp; chưa suy lỗi production có session. ARIA tree expose thông báo, speech screen reader và thiết bị thật NOT_RUN.
- Source audit không có SW/retry trùng, nhưng coexistence SW toàn app chưa chạy. PR61 đóng/chưa merge, mergeable_state=dirty là việc Git chủ nhánh/PM còn xử lý; không coi review kỹ thuật là approval. Đã soạn tin nhắn t/m trong FE_W5 mục13, chưa gửi/comment/review.
- FE-W5-04 IN_PROGRESS/REVIEWED_ISOLATED, chưa tích hợp, approval hay hoàn thành. FE-W5-01/02 và số liệu/tiêu chí PM giữ nguyên. Chỉ cập nhật tài liệu FE; giữ source/tests/config/env/branch/HEAD. Không API ghi dữ liệu hoặc hành động Git mutation.
- Cổng3195/3196 không có listener khi kiểm tra đầu/cuối; không khởi động hay dừng. Harness http://127.0.0.1:3211/PID916 còn chạy: Open FAQ, keyboard/cuộn, Toggle offline prop. Không phải portal hoặc nghiệm thu thiết bị thật.



### FE: bàn giao commit/push FE-W5-01/02 — 05/11/2026

- Nhánh riêng feature/fe-w5-production-checkout-pwa-polish, preflight HEAD4b0c977, remote origin NguyenMTue/ai-travel-reseller. Nhánh FE chưa có remote khi kiểm tra; fetch riêng dev→30ce2e2, merge-base89c9d4f, dev ahead60/local3. Giữ44d02ca/28afb5f/merge4b0c977; không tạo lại tuần4/#54, không đồng bộ thêm dev hoặc viết lại lịch sử.
- Bàn giao checkout structured URL/allowlist/attribution/state/fixtures và production import/demo-prefetch/analytics/LCP/SW public cache/tests. FE-W5-01 IN_PROGRESS, chưa nghiệm thu checkout/payment thật; FE-W5-02 DONE theo PM02/11 22:15. Không nghiệm thu toàn tuần/thiết bị hoặc ghi tổng JS<120KiB.
- 18/18 unit/mock, TypeScript toàn worktree và scoped lint19file đạt. Full lint exit1 còn15errors/8warnings tại10file; đã đối chiếu từng file với HEAD/merge-base/origin/dev nội dung không đổi, không mặc định hoặc tuyên bố full lint PASS. Chi tiết FE_W5 mục14.
- Tái sử dụng Webpack/browser/Lighthouse sau đối chiếu13hash runtime/config và29mục chunk của build BWmX6rdAgq6mcFDcV4IPt. Giữ P94(93–94)/94(92–96)/95(81–96), A95/95/100,BP100; giữ login81 và initial modern gzip139.1/139.7/143.1KiB vẫn vượt120.
- Sửa riêng output test PWA sang PWA_EVIDENCE_DIR hoặc build/ tương đối; chạy lại browser PWA trên cổng riêng3212 và lint file đạt, không API/Tracking/external. Không đổi runtime/bundle nên không build/đo Lighthouse lại vì sửa test/tài liệu.
- Stage11file chỉ định, giữ tsconfig local (include12output) ngoài index; env/output/log/ảnh/profile/backup/harness không lên Git. Giữ ghi nhận review FE-W5-04 ở mục13, chưa tích hợp component T3 hoặc approval/hoàn tất.
- Còn BE: kiểm chứng fallback/valid_to/status trong bản tích hợp, trạng thái thanh toán theo đơn và sandbox/quyền QA. Tester3: sửa FAQ-01/chốt placement banner và PR/HEAD mới. BA/QA: UAT/session/thiết bị/copy/payment E2E. Không sửa backend/DB/RLS/env hoặc tự tạo dữ liệu.
- Kiểm tra staged diff/check trước commit, push non-force đúng nhánh FE và xác minh remote HEAD/upstream/status sau push; không tự tạo PR/đăng approval/merge. Draft title/body lưu ngoài Git tại artifact handoff, kết quả SHA/push báo cuối lượt.


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

