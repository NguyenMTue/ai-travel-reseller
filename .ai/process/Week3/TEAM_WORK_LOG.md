# TEAM WORK LOG
Project: AI Travel Reseller MVP (TravelLink AI)  
Week: Tuần 3 — 19/10/2026 – 24/10/2026 (Sprint 3)  
Last Updated: 20/10/2026

---

Phạm vi nhật ký: Đồng bộ tiến độ toàn diện của các thành viên trong đội ngũ Tuần 3 (Milestone: Commerce Flow, AI Sales Agent, PWA Mobile & Merchant Video Generation). Đây là bảng điều phối trung tâm chống xung đột giao diện, duplicate task và quản lý luồng bàn giao.

---

## 1. ACTIVE WORK
| Task ID | Member | Role | Task | Status | Started | Deadline |
|---|---|---|---|---|---|---|
| BA-W3-01 | Business Analyst | BA | Bàn giao & Giải đáp Đặc tả Nghiệp vụ tại Kick-off Sprint 3 | READY | 19/10 | 19/10 10:30 |
| BA-W3-02 | Business Analyst | BA | Khóa Business Rules cho BE1: Migration `orders`, `media_references` & RPC ví | READY | 19/10 | 19/10 14:00 |
| BA-W3-03 | Business Analyst | BA | Khóa Kịch bản RAG, Buying Intent & Multimodal Prompt cho BE2 | READY | 19/10 | 19/10 17:00 |
| BA-W3-04 | Business Analyst | BA | Handoff Yêu cầu Giao diện PWA Mobile & Merchant Library cho UI/UX | READY | 20/10 | 20/10 12:00 |
| BA-W3-05 | Business Analyst | BA | Khóa Event Taxonomy & Webhook Schema cho BE3 | READY | 20/10 | 20/10 17:00 |
| BA-W3-06 | Business Analyst | BA | Hỗ trợ FE Lead (Diệu) & Tester 3 (FE phụ) xác thực luồng giao diện | READY | 21/10 | 21/10 17:00 |
| BA-W3-07 | Business Analyst | BA | Đồng hành cùng QA Team (Tester 1, 2) chạy Bộ Test Nghiệp Vụ | READY | 22/10 | 22/10 17:00 |
| BA-W3-08 | Business Analyst | BA | Thực hiện Nghiệm thu Nghiệp vụ (Business UAT) & Đánh giá Demo Sprint 3 | READY | 23/10 | 23/10 17:30 |
| BE1-W3-01 | Nguyễn Minh Tuệ | BE1 (Kiêm PM) | Migration bảng `orders` & `commissions` (Attribution schema) | DONE | 19/10 | 20/10 12:00 |
| BE1-W3-02 | Nguyễn Minh Tuệ | BE1 (Kiêm PM) | Migration bảng `media_references` cho Merchant Video Library | DONE | 19/10 | 20/10 17:00 |
| BE1-W3-03 | Nguyễn Minh Tuệ | BE1 (Kiêm PM) | API `POST /api/merchant/media` quản lý video mẫu | DONE | 20/10 | 21/10 12:00 |
| BE1-W3-04 | Nguyễn Minh Tuệ | BE1 (Kiêm PM) | Attribution Engine & RPC `get_reseller_wallet_summary` | DONE | 19/10 | 21/10 17:00 |
| BE1-W3-05 | Nguyễn Minh Tuệ | BE1 (Kiêm PM) | Gỡ bỏ nợ kỹ thuật trigger hòa giải tạm thời Tuần 2 | DONE | 19/10 | 19/10 12:00 |
| BE1-W3-06 | Nguyễn Minh Tuệ | BE1 (Kiêm PM) | Core AI Video Generation Engine (`generator.ts`) từ kịch bản BE2 & asset tour | READY | 21/10 | 22/10 17:00 |
| BE1-W3-07 | Nguyễn Minh Tuệ | BE1 (Kiêm PM) | Video API `POST /api/merchant/video/generate` & Storage pipeline `campaign-videos` | READY | 22/10 | 23/10 12:00 |
| BE2-W3-01 | Nguyễn Huỳnh | BE2 | System Prompt AI Sales Agent nhận diện Buying Intent | DONE | 20/10 | 20/10 17:00 |
| BE2-W3-02 | Nguyễn Huỳnh | BE2 | Prompt Multimodal Gemini phân tích kịch bản video mẫu | OFFLINE DONE — LIVE PENDING | 20/10 | 21/10 12:00 |
| BE2-W3-03 | Nguyễn Huỳnh | BE2 | Prompt sinh kịch bản video áp dụng thông tin chiến dịch (bàn giao BE1) | OFFLINE DONE — LIVE PENDING | 20/10 | 22/10 12:00 |
| BE3-W3-01 | Thái Thanh Tú | BE3 | Workflow n8n thông báo đơn hàng / click mới qua Telegram/Zalo | READY | 20/10 | 21/10 17:00 |
| BE3-W3-02 | Thái Thanh Tú | BE3 | Tích hợp PostHog Analytics Dashboard & Phễu chuyển đổi 5 bước | READY | 21/10 | 22/10 17:00 |
| BE3-W3-03 | Thái Thanh Tú | BE3 | Workflow n8n thông báo thời gian thực khi Video sinh xong từ Core Engine | READY | 22/10 | 23/10 12:00 |
| FE-W3-01 | Diệu | FE Lead | Cấu hình PWA Core (manifest, Service Worker, Meta) | IN PROGRESS — local PASS, chờ QA thiết bị thật | 19/10 | 20/10 17:00 |
| FE-W3-02 | Diệu | FE Lead | Bottom Navigation Bar & Responsive Safe Area cho Reseller | IN PROGRESS — Chờ UI/UX review | 20/10 | 21/10 12:00 |
| FE-W3-03 | Diệu | FE Lead | Tích hợp Web Share API 1 chạm & Canvas xuất ảnh QR | IN PROGRESS — fixture PASS; Git blocked; chờ UIUX/thiết bị thật | 21/10 | 21/10 17:00 |
| FE-W3-04 | Diệu | FE Lead | Giao diện Chat AI Sales Agent Mobile (Bottom Sheet widget) | READY | 21/10 | 22/10 17:00 |
| FE-W3-05 | Diệu | FE Lead | Giao diện Màn hình Ví hoa hồng Reseller (`/reseller/wallet`) | READY | 22/10 | 23/10 12:00 |
| FE-W3-06 | Diệu | FE Lead | Tích hợp Media Library & Nút kích hoạt tạo Video qua API BE1 | READY | 22/10 | 23/10 17:00 |
| T3-FE-W3-01 | Tester 3 | FE Phụ | Cắt Component tĩnh `MediaCard` (`src/components/merchant/media-card.tsx`) | READY | 20/10 | 21/10 12:00 |
| T3-FE-W3-02 | Tester 3 | FE Phụ | Modal hướng dẫn quy chuẩn video 9:16 (`video-guidelines-modal.tsx`) | READY | 21/10 | 21/10 17:00 |
| UX-W3-01 | UI/UX Designer | UI/UX | Figma Hi-fi Reseller Mobile (Bottom Nav, Thẻ chạm, Ví) | READY | 19/10 | 20/10 12:00 |
| UX-W3-02 | UI/UX Designer | UI/UX | Figma Hi-fi Customer Chat Widget di động | READY | 19/10 | 20/10 17:00 |
| UX-W3-03 | UI/UX Designer | UI/UX | Figma Hi-fi Merchant Media Library & Video Template Grid | READY | 20/10 | 21/10 12:00 |
| T1-W3-01 | Tester 1 | QA Lead | Kiểm thử tính năng PWA, Viewport mobile & Kịch bản demo C1/C3 | READY | 20/10 | 23/10 17:00 |
| T1-W3-02 | Tester 1 | QA Lead | Kiểm thử chức năng Media Library & Luồng tải video mẫu | READY | 22/10 | 23/10 17:00 |
| T2-W3-01 | Tester 2 | AI Safety QA | Test chống Hallucination & Buying Intent của AI Sales Agent | READY | 21/10 | 23/10 17:00 |
| T2-W3-02 | Tester 2 | AI Safety QA | Đánh giá chất lượng kịch bản video AI bóc tách từ video mẫu | READY | 22/10 | 23/10 17:00 |
| PM-W3-01/06 | Nguyễn Minh Tuệ | BE1 Kiêm PM | Điều phối Sprint 3, Code Review 2 cấp, Diễn tập Demo nghiệm thu | READY | 19/10 | 24/10 17:30 |

---

## 2. COMPLETED WORK
- `BE1-W3-05` (19/10): Gỡ bỏ trigger hòa giải tạm thời `fn_temp_contents_reconcile` (xóa nợ kỹ thuật Tuần 2).
- `BE1-W3-01` (19/10): Hoàn thành migration mở rộng bảng `orders`, tạo bảng `commissions` kèm RLS policies và indexes.
- `BE1-W3-02` (19/10): Hoàn thành migration bảng `media_references` cho Merchant Video Library; đồng bộ types `src/lib/database.types.ts`.
- `BE1-W3-04` (19/10): Xây dựng Attribution Engine, RPC `get_reseller_wallet_summary`, đồng bộ hoa hồng orders-commissions, API `GET /api/reseller/wallet` và các ràng buộc bảo mật / chống gian lận.
- `BE1-W3-03` (20/10): Xây dựng API Quản lý Video Mẫu Merchant (`GET / POST / DELETE /api/merchant/media`), bộ kiểm tra Zod `createMediaReferenceSchema` và bàn giao interface `MediaReferenceItem` cho FE.
- `BE2-W3-01` (20/10): Hoàn thành taxonomy 6 intent, server-side checkout gate, attribution URL đầy đủ và 5/5 test offline.
- `BE2-W3-02/03` (20/10): Hoàn thành prompt, adapter contract, Zod/JSON Schema và guardrails offline; kiểm thử Gemini live tạm hoãn theo kế hoạch quota.
- `BE2-W3-04/05` (20/10): Hoàn thành tài liệu handoff, sample output và benchmark deterministic; trạng thái benchmark live còn pending.

---

## 3. IN PROGRESS
*(Sẽ cập nhật sau phiên họp Kick-off 09:00 AM ngày 19/10/2026).*

---

## 4. BLOCKED
*(Không có blocker ban đầu. Tất cả dependencies đã được làm sạch ở Sprint 2).*

---

## 5. HANDOFFS
| From | To | Deliverable | Status | Date |
|---|---|---|---|---|
| PM | Toàn team | Kế hoạch chi tiết Sprint 3 (Week3.md + 9 work plans cá nhân) | DONE | 19/10 |
| UI/UX | FE Lead | Bản vẽ Figma Reseller Mobile & Chat Widget | READY | 20/10 |
| UI/UX | Tester 3 (FE phụ) | Bản vẽ giao diện thẻ `MediaCard` tĩnh | READY | 20/10 |
| BE1 | FE Lead | Database migration `orders`, `commissions` & Types gen | READY | 20/10 |
| BE1 | Tester 3 (FE phụ) | Mock schema interface props cho `MediaCard` | READY | 20/10 |
| BE2 | BE1 | Prompt Multimodal & JSON schema kịch bản video nạp Core Engine | READY | 21/10 |
| Tester 3 (FE phụ) | FE Lead / PM | PR nhánh `feature/fe-t3-static-components` (Dumb UI components) | READY | 21/10 |
| BE1 | FE Lead | Endpoint API `POST /api/merchant/video/generate` & status polling | READY | 22/10 |
| BE1 | BE3 | Webhook event báo video hoàn tất để kích hoạt n8n notification | READY | 23/10 |
| FE Lead | Tester 1 | Bản build PWA Mobile Suite trên dev server | READY | 22/10 |

---

## 6. STRICT GUARDRAIL POLICY FOR TESTER 3 (FE PHỤ)
1. **Cô lập nhánh tuyệt đối:** Chỉ làm việc trên nhánh duy nhất `feature/fe-t3-static-components`.
2. **Khu vực cấm (Forbidden Zones):**
   * CẤM chạm vào `app/layout.tsx`, `app/page.tsx`, `app/globals.css`.
   * CẤM chạm vào `playwright.config.ts`, `tests/` và các cấu hình test chung.
   * CẤM chạm vào `src/lib/supabase/`, các API routes tại `app/api/` và router tracking `app/r/[code]`.
3. **Chỉ làm Dumb Component:** Nhận dữ liệu qua props, render thẻ card / modal tĩnh, không fetch API, không quản lý state phức tạp.
4. **Quy chế Merge 2 cấp:** Bắt buộc phải có Approval từ FE Lead (Diệu) và PM/BE1 (Tuệ). Cấm tự ý merge vào `dev`.

## 7. FE Lead — session 19/10/2026
- Git: fetch riêng dev với refspec rõ ràng và fast-forward thành công; nền `fe50aee54a6a4e17ceba6226d67e758b73f03a3f`, nhánh local `Feature_FE_W3_PWA_Mobile_Commerce`. Không sửa remote refs hoa/thường, lock/config, không commit/push.
- FE-W3-01: thêm manifest theo convention Next.js (`app/manifest.ts`), icons PNG từ Compass thương hiệu có sẵn, Apple/viewport metadata, một đăng ký SW production-only, offline document chung và `/sw.js` no-store. Cache chỉ 4 tài nguyên tĩnh `/pwa/`; không lưu HTML/RSC/session/account/API, bỏ qua tracking `/r/`, Auth, Server Actions và cross-origin. Worker update chờ đóng các tab cũ, dev unregister worker/cache của ứng dụng.
- Bằng chứng FE: unit SW 3/3 PASS, TypeScript PASS, lint toàn bộ code mới/sửa PASS, production build Next.js 16.3.8 PASS (24/24 static generation), `git diff --check` PASS. Chromium local revision 1243 có sẵn: manifest/meta/icons/scope/headers PASS, cache chỉ 4 static assets, portal offline chung, tracking bypass và online recovery PASS. Playwright mặc định cần revision 1248 chưa cài; test dùng executable override. Không xác nhận iOS/Android thật hay review hoàn tất.
- FE-W3-02 → 03 là việc tiếp theo, chờ UX-W3-01. Review FE-W3-07 ngay khi Tester 3 nộp 21–22/10, trước FE-W3-06; chưa review/approve. Các task khác chưa triển khai.
- Nhánh Tester 3 chưa thấy trong truy vấn local/remote có mục tiêu; cần chuẩn bị nhánh/skeleton MediaCard và VideoGuidelinesModal, chốt lệch deadline specs/card với UIUX/PM. Không ghi đè file của Tester 3 hoặc tự push nhánh.
- BE1 log đã ghi wallet API DONE; cần xác minh contract/mock cho FE-W3-05, Media API còn chờ BE1-W3-03. Chờ Figma và QA iOS/Android thật; chưa xác nhận cài đặt/standalone, chưa mở tunnel.
- Kế hoạch đủ 8 task, hướng dẫn chạy production/dev và checklist demo sau: xem `FE_W3.md`, mục 6. POST Tracking 500 chưa tái hiện ở phiên này, không kết luận nguyên nhân và không sửa backend.

### FE — kiểm tra thủ công do người dùng xác nhận (tách khỏi test tự động)
- Chrome tại `http://127.0.0.1:3183`: Service Worker hiển thị `activated and is running`; bật Offline và truy cập `/reseller` thấy “Bạn đang ngoại tuyến”; bỏ Offline và bấm “Thử lại” tải được `/login?next=%2Freseller`.
- Chưa kiểm tra cài đặt/standalone trên điện thoại thật; không nâng trạng thái FE-W3-01 thành hoàn tất hoặc đã review.
- Lượt này chỉ ghi nhận tài liệu FE, không chạy lại test hoặc sửa code, không commit/push.

### FE-W3-02 — bản đề xuất local, Chờ UI/UX review
- Tiếp tục đúng nhánh, không fetch/pull; giữ nguyên PWA Core và kết quả thủ công FE-W3-01. Chưa có Figma/spec UX-W3-01 bàn giao trong repo, không xác nhận khớp Figma.
- Thêm dock mobile <768px và safe-area trong ResellerShell; desktop giữ navigation cũ. Guard session/role giữ nguyên, dock portal chỉ hiện khi access allowed; preview chỉ fixture development-only.
- Mapping: Khám phá → danh sách chiến dịch; Nội dung AI/Link & QR → anchor trong chính chiến dịch đang mở, ở danh sách là nút hướng dẫn chọn chiến dịch; Ví hoa hồng → thông báo Sắp có, chưa tạo route FE-W3-05. Không dùng ID fixture trong portal, không tự tạo link/campaign hoặc đổi Tracking.
- Style dùng token Coastal Editorial, Lucide hiện có; active có nền/viền/chữ đậm/dấu gạch, focus và touch target, reduced motion. Chừa đáy theo 88px + safe-area + 16px; native dialog nằm trên dock; hỗ trợ ẩn dock theo visualViewport khi bàn phím mở.
- Bằng chứng FE-W3-02: TypeScript PASS; Chromium fixture PASS ở 320/390/768/1440 (không tràn, không che footer, nav đúng breakpoint, active route/hash, ≥44×44px, Enter/Escape/focus, Content Kit/QR modal mock và lịch sử Back). PASS mô phỏng keyboard visualViewport và inset 34px; không có page errors/API/write/external requests. Đã chụp và xem ảnh, chỉnh khoảng trống header preview và chữ phụ ở 320px; production build output riêng `build/fe-w3-nav-prod` PASS, gồm TypeScript và 24/24 static generation. Next dev badge chuyển lên góc trên phải để tránh che nav khi xem local, không đổi PWA headers.
- Chờ UIUX review, BA xác nhận điều hướng tổng hợp và wallet/commissions; chưa thử bàn phím/safe area trên điện thoại thật. Không coi mô phỏng viewport là kiểm tra thiết bị thật.
- Lint code FE-W3-02: 0 lỗi, 1 warning có sẵn (`preview` chưa dùng trong CampaignDetailView); chưa thay logic Tracking.
- Đã dừng server dev kiểm chứng, khôi phục đường dẫn output tự sinh của tsconfig/next-env; giữ output PWA cũ. `git diff --check` PASS. FE-W3-02 vẫn chờ UIUX/BA và thiết bị thật, không xác nhận cả tuần hoàn tất; không commit/push.
- Hướng dẫn và mapping chi tiết: FE_W3.md mục 7. Không commit/push/merge, không sửa DB/backend/PWA.

### FE-W3-03 — 21/10/2026
- Bảo toàn FE-W3-01/02 bằng checkpoint LOCAL `c513746` từ nền `fe50aee` (20 file source/test/docs/icons, không env/build/bằng chứng); giữ hai đường dẫn tsconfig local `build/fe-w3-nav-local` ngoài commit.
- Fetch riêng dev thành công tới `86babd0`; merge vào nhánh FE lỗi `unable to unlink ... content-kit.tsx: Invalid argument` và `... content-factory.ts: Invalid argument`. Đã dừng cập nhật Git, không retry/xóa lock/ACL/reset/clean. HEAD vẫn `c513746`, không MERGE_HEAD/merge commit; dev CHƯA được tích hợp. File mới từ dev còn untracked được giữ riêng, không commit như công việc FE.
- Đọc bàn giao origin/dev: Media API và Wallet route mới, BE2 Sales/Video offline + Telegram Content Kit; Tracking contract/UIUX/spec Tester 3 không đổi. Chưa kết luận Tracking POST 500 đã hết. Nhánh Tester 3 có tại `f66ff8c` nhưng chưa thấy MediaCard/VideoGuidelinesModal tại commit được truy vấn; chưa review/approve/merge.
- Triển khai Share link từ short_url hợp lệ hiện có, không tạo thêm link; pending/dedup, hủy khác lỗi, Copy fallback và thông báo không xác nhận đăng bài. Poster PNG Canvas 1080×1440 dùng thông tin campaign/product, Compass/Coastal tokens/minh họa coast.svg, QR đúng short_url, preview/download/canShare(files), fallback ảnh/CORS/taint, không bịa thông tin hoặc proxy backend.
- State Share/Poster theo campaign/product/session/link, observer phiên chỉ đọc, hủy kết quả muộn và revoke object URL. Preview luôn request fixture (kể cả URL không query tracking), không gọi API thật; giữ cảnh báo mô phỏng/local. PWA/Bottom Nav và bằng chứng thủ công FE-W3-01 giữ nguyên; poster/FE-W3-02 vẫn Chờ UIUX review.
- Unit Share 4/4 PASS; TypeScript FE scope PASS cả lần chốt cuối, lint source/test FE-W3-03 0 lỗi/0 cảnh báo. TypeScript toàn repo baseline FAIL 6 lỗi AI/Sales do file untracked từ lần merge lỗi và code tracked cũ không khớp; không sửa backend để che lỗi.
- Chromium mock PASS 320/390/768/1440, payload/native states/file/download/focus/modal/nav; PNG tải xuống được jsQR giải mã đúng URL, gồm tên/link dài, ảnh lỗi/CORS và canvas fallback; session/campaign reset + kết quả muộn + URL revoke PASS. Không có page errors/API write/tracking click/external calls. Copy/native Share chỉ mock, chưa được người dùng xác nhận thủ công hay kiểm tra trên điện thoại thật.
- Ảnh đã mở xem: `build/fe-w3-share-evidence-20261021/`. Build riêng compile bundle thành công nhưng FAIL tại TypeScript với đúng 6 lỗi baseline nêu trên; không tắt type checking/xóa cache/sửa quyền. Đã dừng server phiên này và bỏ include output mới, giữ tsconfig local cũ; next-env trỏ lại output dev nav-local đang có. Chi tiết lỗi/lệnh/URL/kế hoạch tiếp theo: FE_W3.md mục 8. Không commit thêm sau checkpoint, push/PR/merge GitHub hoặc sửa DB/env.
