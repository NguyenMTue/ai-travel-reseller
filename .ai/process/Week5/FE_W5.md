# MY WORK PLAN — FE_W5
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 5 (02/11/2026 – 07/11/2026) — Sprint 5 (Sprint Cuối / Final Sprint)  
**Member:** Cao Thị Thu Diệu (Frontend Lead)  
**Role:** Frontend Lead (Next.js 16 Production Build, PWA Mobile Commerce, Checkout Flow & UI Polish)  
**Current Milestone:** FINAL E2E UAT, PERFORMANCE STRESS TESTING, RLS SECURITY AUDIT & PRODUCTION GO-LIVE  
**Deadline:** 17:00 Thứ Bảy (07/11/2026)  
**Branch:** `feature/fe-w5-production-checkout-pwa-polish` (tách từ `dev`)  

---

## 1. Context & Trọng tâm Kỹ thuật Sprint 5
- Kế thừa thành quả Sprint 4: Đã hoàn thiện trình phát video dọc 9:16 chuyên dụng kèm nút tải trực tiếp file video MP4 về thiết bị di động; tối ưu hóa cảm ứng chạm vuốt và Safe Area Inset cho PWA Mobile qua PR #54.
- **Trọng tâm Frontend trong Tuần 5 — Hoàn thiện Chuỗi giá trị E2E & Production Build:**
  1. **Khóa chặt Luồng Thanh toán (Checkout Flow Integration):** Khi AI Sales Agent nhận diện ý định mua hàng và cung cấp link thanh toán, người dùng click nút "Đặt vé ngay" sẽ được điều hướng sang cổng thanh toán hoặc trang xác nhận đơn hàng của Merchant với đầy đủ mã định danh `reseller_id` và `tracking_code`.
  2. **Tối ưu hóa Production Build & PWA Lighthouse:** Phân tích bundle size, nén tài nguyên ảnh/font tĩnh, cấu hình Service Worker cache thông minh; đạt điểm Lighthouse Performance $\ge 90$ và PWA Installability đạt chuẩn $100\%$ trên thiết bị di động.
  3. **Trực chiến Khắc phục Lỗi Giao diện trong phiên UAT:** Đồng hành cùng Tester 1 và BA trong các phiên thử nghiệm người dùng ngày 04/11 để fix ngay các lỗi hiển thị, lỗi tràn chữ hoặc layout shift.
  4. **Code Review & Giám sát Tester 3 (FE phụ):** Kiểm duyệt mã nguồn trên nhánh `feature/fe-t3-w5-standalone-ui` của Tester 3, bảo đảm các component độc lập (FAQ Modal, Offline Banner) có interface chuẩn mực, không can thiệp vào các tệp core của dự án.

---

## 2. THIS WEEK — MY TASKS

| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|:---:|:---:|---|:---:|---|:---:|
| **FE-W5-01** | Tích hợp Hoàn chỉnh Luồng Thanh toán & Checkout Redirect | **P0** | `IN_PROGRESS` | BE1 Order API | FE Lead | Nút đặt vé dẫn sang checkout có lưu attribution token | 03/11 17:00 |
| **FE-W5-02** | Tối ưu Production Build Next.js & PWA Lighthouse Score $\ge 90$ | **P1** | `DONE` | Next.js config | FE Lead | PM chấp nhận hiệu năng theo tiêu chí điều chỉnh; QA portal/thiết bị tách riêng (mục12) | 04/11 12:00 |
| **FE-W5-03** | Trực chiến Fix Bug Giao diện trong phiên Final E2E UAT | **P0** | `READY` | Bug reports BA | FE Lead | 100% UI bugs resolved trước Go-Live | 05/11 12:00 |
| **FE-W5-04** | Review cấp 1 & Hỗ trợ tích hợp an toàn component của Tester 3 | **P2** | `IN_PROGRESS` | PR Tester 3 | FE Lead | Review comments, Approval 1 & Safe integration | 04/11 17:00 |

---

Cập nhật quyết định mới nhất: BE1/PM Nguyễn Minh Tuệ nghiệm thu FE-W5-02 theo tài liệu ngày02/11/2026,22:15 (mục12). Mốc120kB trong kế hoạch gốc bên dưới giữ để truy vết, không ghi đã đạt. FE-W5-01 và các kiểm chứng portal/thiết bị/E2E còn riêng, chưa nghiệm thu cả tuần.

## 3. TASK BREAKDOWN (CHI TIẾT THỰC THI)

### Task `FE-W5-01`: Tích hợp Luồng Thanh toán & Checkout Redirect
* **Mục tiêu:** Du khách từ chatbot có thể tiến hành thanh toán mượt mà, ghi nhận đơn hàng vào Supabase.
* **Các bước triển khai:**
  - [ ] Khi AI sinh thẻ gợi ý tour, bổ sung nút CTA nổi bật: *"Thanh toán & Đặt vé ngay"*.
  - [ ] Truyền kèm `reseller_id` trong URL redirect hoặc payload API để kích hoạt cơ chế gán hoa hồng tự động.
  - [ ] Thêm màn hình thông báo *"Đặt vé thành công"* và cập nhật ngay trạng thái giao dịch cho Reseller.
* **DoD:** Chạy thông suốt luồng từ tin nhắn chat sang màn hình đặt vé mà không bị mất mã tiếp thị.

### Task `FE-W5-02`: Tối ưu Production Build & PWA Lighthouse
* **Mục tiêu:** Đảm bảo ứng dụng load cực nhanh trên mạng 4G/5G di động.
* **Các bước triển khai:**
  - [ ] Chạy `npm run build` kiểm tra kích thước First Load JS $< 120\text{ kB}$.
  - [ ] Tối ưu hóa Service Worker (`sw.js`) để cache các icon, fonts và stylesheet tĩnh.
  - [ ] Chạy audit Lighthouse trên Chrome DevTools cho viewport di động.
* **DoD:** Điểm Performance $\ge 90$, Accessibility $\ge 95$, Best Practices $\ge 95$, PWA: Pass.

### Task `FE-W5-04`: Giám sát & Review PR của Tester 3
* **Mục tiêu:** Tận dụng hiệu quả đóng góp giao diện của Tester 3 mà không tạo bất kỳ rủi ro nào cho Core hệ thống.
* **Quy trình:**
  - [ ] Hướng dẫn Tester 3 triển khai component theo đúng interface đã thống nhất.
  - [ ] Kiểm tra diff trên GitHub PR: Đảm bảo PR **chỉ chứa duy nhất các component độc lập** trong `src/components/`, không sửa bất kỳ dòng code nào trong `app/layout.tsx` hay cấu hình hệ thống.
  - [ ] Thực hiện Approval 1 và chuyển tiếp cho PM duyệt gộp nhánh.

---

## 4. DEPENDENCY & INTERFACES

| Task | Dependency | Người phụ trách | Trạng thái |
|---|---|---|:---:|
| FE-W5-01 | Schema đơn hàng từ BE1 | BE1 Lead | `READY` |
| FE-W5-02 | Giao diện đã ổn định | FE Lead | `WAITING` |
| FE-W5-03 | Danh sách lỗi từ phiên UAT | BA & Tester 1 | `WAITING` |
| FE-W5-04 | PR từ Tester 3 | Tester 3 (Tuấn) | `RECEIVED — REVIEWED_ISOLATED, chờ sửa/PR mở` |

---

## 5. TEAM HANDOFF

| From | To | Deliverable | Format | Deadline |
|---|---|---|---|:---:|
| FE Lead | QA Lead (Tester 1) | Bản build Staging sẵn sàng cho E2E UAT | Web URL Staging | 03/11 17:00 |
| FE Lead | DevOps & BE1 | Mã nguồn nhánh `main` sẵn sàng cho Vercel Deploy | GitHub Branch `main` | 05/11 12:00 |
| FE Lead | Toàn team | Báo cáo tối ưu hóa hiệu năng Lighthouse | PDF / Screenshot | 05/11 17:00 |


---

## 6. FE thực thi & bàn giao — 01/11/2026 (Asia/Bangkok)

Đây là kết quả kiểm tra mã nguồn thực tế trước Sprint 5; các nhãn READY/kết quả Sprint 4 ở phần kế hoạch phía trên không phải bằng chứng nghiệm thu checkout hoặc thiết bị thật.

### Nền Git và bảo toàn

- Worktree: E:/THUCTAP/ai-travel-reseller-fe-w5.
- Branch: feature/fe-w5-production-checkout-pwa-polish; nền origin/dev = 7ced50a54997e639145d1ce83330ad2557b38574.
- Fetch riêng dev thành công với --no-tags --no-write-fetch-head; không fetch toàn bộ refs.
- PR #54 còn OPEN/DRAFT, merged=false; remote head đã xác minh là df2147ed8f3f3c6ca865b60d1c489c8ff9754f7d.
- Chọn phương án B.2: FE-W5-01 dùng ChatPanel, MobileChatSheet, transport và chat contract đã có ở dev; PR #54 không thay đổi các file này. Không cần kế thừa/cherry-pick tuần 4.
- Chưa kế thừa video-player/download, modal mẹo đăng video, shared mobile-dialog/visualViewport, safe area/bottom nav và sửa video rewrite trong #54. FE-W5-02 phải đồng bộ những phần này sau khi PR merge; không làm lại.
- Checkout tuần 3/4 và thay đổi tsconfig.json của chúng giữ nguyên. Không sao chép/sửa env, exclude, recovery hoặc ignored files của worktree cũ.
- Dependencies dùng junction node_modules tới repo gốc; không cài package, không thay lockfile. Next sinh thêm include cho output tuần 5 trong tsconfig.json của riêng worktree này; đây là cấu hình local có hiển thị trong diff.
- Không commit tính năng, push, tạo PR, review/approval, merge GitHub hoặc tạo local merge commit.

### Kế hoạch có thứ tự theo deadline

| Task | Đầu ra | Deadline (2026, UTC+7) | Phụ thuộc | Hiện trạng | Việc tiếp theo |
|---|---|---|---|---|---|
| FE-W5-01 | CTA checkout từ structured API URL, attribution được giữ; UI lỗi/thiếu dữ liệu/hết phiên; fixture và tests | 03/11 17:00 | BE1 Order API + BE2 checkout URL | IN_PROGRESS: FE contract hiện hữu đã triển khai, còn chờ contract production/E2E | BE xác nhận attribution có chữ ký/session và contract trạng thái đơn/thanh toán; QA kiểm thử sandbox |
| FE-W5-02 | Webpack production build, bundle/Lighthouse report, PWA installability | 04/11 12:00 | #54, icon UI/UX, môi trường audit | PLANNED: build riêng PASS; chưa audit Lighthouse/PWA thiết bị | Đồng bộ #54 sau merge, đo bundle và Lighthouse rồi tối ưu theo số đo |
| FE-W5-04 | Review cô lập PR61/SHA8f02a22; còn FAQ-01 và vị trí banner | 04/11 17:00 | Tester3 PR/HEAD mới, UIUX/BA copy | IN_PROGRESS: REVIEWED_ISOLATED (mục13) | Chờ sửa/check lại; chưa approval hoặc tích hợp |
| FE-W5-03 | Fix và bằng chứng re-test UI bug trong Final UAT | 05/11 12:00 | BA/QA bug reports, staging ổn định | WAITING | Trực chiến phiên UAT 04/11, tái kiểm thử các bug được giao |

### Contract đã đối chiếu

- Route hiện có: /chat nhận reseller_id, campaign_id, product_id dạng UUID từ query; MobileChatSheet giữ panel khi đóng/mở và phân tách panel theo bộ ID + sessionKey.
- POST /api/chat gửi { message, conversation_history, attribution_context: { reseller_id, campaign_id, product_id } }. Response hiện có { reply, intent_detected, suggested_checkout_url }.
- Backend src/lib/ai/chat.ts đọc sản phẩm/campaign/reseller; kiểm tra tồn tại và campaign-product; src/lib/ai/checkout-url.ts lấy products.payment_url rồi đặt ref=reseller_id, campaign=campaign_id, product=product_id.
- Đây là redirect ra website Merchant, không phải route đặt đơn nội bộ. FE chỉ dùng structured suggested_checkout_url của response; nội dung reply được render như text và không làm nguồn redirect.
- Query ID chỉ là ngữ cảnh. Kiểm tra hiện tại không chứng minh quyền nhận hoa hồng, signed attribution, active affiliate/click binding, session expiry hay đơn đã trả tiền.
- /r/[code] đọc affiliate_links.unique_code, ghi clicks rồi redirect destination_url; route này chưa bàn giao click/session/token cho FE checkout. Không mở route đó trong lượt kiểm thử.
- docs/be1/week3-be1-commerce-video-engine.md mô tả orders.click_id và state machine cùng RPC ví; schema/tài liệu không thay thế Order API. Không tìm thấy handler Order/Payment hoặc endpoint xác nhận đơn trong app/api tại nền đã chọn.
- Không có tracking_code/token trong ChatInput hoặc ChatReply hiện hữu; không tự thêm trường, tự sinh token hay coi query là proof.
- Trust boundary hiện hữu: URL từ structured API dựa trên payment_url trong DB, FE yêu cầu HTTPS; chưa có allowlist Merchant độc lập được BE bàn giao. FE không tuyên bố đã xác minh một domain từ nội dung AI.

### Phần đã triển khai

- src/lib/chat/checkout.ts: không sửa URL để đoán attribution; yêu cầu duy nhất một ref/campaign/product khớp chính xác ngữ cảnh. Chặn URL thiếu/sai, HTTP/protocol khác, userinfo, fragment và các query thông tin xác thực rõ ràng.
- src/components/chat/checkout-card.tsx: CTA Đặt vé ngay dùng checkout-card.module.css để tránh màu link global ghi đè, có vùng chạm tối thiểu 44px, tương phản chữ/nền đạt WCAG AA (browser kiểm tra >=4.5), focus hiển thị; domain đích rõ ràng, thẻ mới với noopener noreferrer. Giữ URL/query theo response sau kiểm tra; chỉ analytics hostname, không log URL.
- Pending chat khóa CTA cũ; ref latch chống bấm lặp; ngoại tuyến không điều hướng. Mở lại là thao tác chủ động, không tự retry navigation, tạo đơn hoặc payment.
- Thiếu/không hợp lệ URL hiển thị chưa có liên kết hợp lệ. Không dựng cổng thanh toán hoặc chế tạo response mock trong luồng thật.
- src/lib/chat/transport.ts: lỗi typed 401/403/404; không hiển thị raw error backend. ChatPanel vô hiệu hóa link cũ và compose khi phiên/ngữ cảnh hết hiệu lực; phải mở lại liên kết sản phẩm.
- Không thêm màn hình đặt vé/thanh toán thành công, tính hoa hồng, cập nhật ví lạc quan hoặc xử lý status=success. Mở checkout chưa phải xác nhận đặt đơn hay thanh toán.
- Preview chỉ ở /preview/chat trong development. Fixture hợp lệ/thiếu URL/URL không được phép/sai attribution/hết phiên không gọi AI, Tracking hoặc tạo đơn; click CTA fixture không mở Merchant.

### BE cần bàn giao để hoàn tất production

1. Endpoint/method tạo hoặc lấy checkout, request/response/error codes chính thức và URL nguồn; quy tắc Merchant domain/path được phép, HTTPS, credential/query công khai được phép và thời hạn URL.
2. Mapping tracking_code hoặc public signed attribution token với affiliate link/click/session/reseller/campaign/product; ai phát hành, cách truyền, lưu, hết hạn và backend xác thực/chống sửa đổi. Không chuyển secret qua URL.
3. Quy tắc xử lý đổi sản phẩm, inactive link, hết phiên, mất cookie và quan hệ với /r/[code]. Xác nhận ref/campaign/product hiện hữu có đủ cho Merchant hay phải chuyển sang contract mới.
4. Endpoint đọc trạng thái đơn có quyền truy cập, schema order_status và payment_status riêng nếu backend phân biệt, nguồn xác nhận đáng tin (server/webhook verified), return/cancel URL. Không tin query status hoặc AI reply.
5. Quy tắc chống tạo trùng/idempotency và timeout/late response cho mọi thao tác có side effect; dữ liệu sandbox và tài khoản QA được xác minh. Chưa nối thao tác tạo đơn/thanh toán khi chưa có contract này.

### Kiểm chứng và giới hạn

- TypeScript nền sạch: tsc --noEmit --incremental false PASS trước chỉnh sửa. Typecheck phần triển khai và typecheck bắt buộc trong Webpack production build PASS.
- Scoped ESLint PASS; unit contract/transport 6/6 PASS (tests/checkout.test.ts và tests/chat-transport.test.ts).
- tests/checkout-browser.mjs PASS: 320/390/768/1440px, href attribution, missing/unsafe/mismatch URL, vùng chạm/tương phản WCAG AA/focus/bàn phím, double submit/click, offline, pending, hết phiên vô hiệu hóa link cũ, error/timeout giữ draft, đổi campaign/product và session loại phản hồi muộn, status=success không tạo UI thành công.
- Hồi quy tests/chat-bottom-sheet.mjs PASS: bốn viewport, đóng/mở giữ hội thoại, expand, focus trap, offline/draft, late response, keyboard viewport mô phỏng, không phát sinh API/external/write requests.
- Ảnh: build/fe-w5-checkout-evidence/checkout-{320,390,768,1440}.png; hồi quy: build/fe-w5-chat-regression/.
- Browser runtime dùng Chrome cài sẵn; browser mặc định Playwright revision 1248 chưa có, không tải thêm.
- Một lần browser test dừng do locator alert trùng route announcer Next; đã scope vào .chat-compose rồi chạy lại toàn bộ PASS, không hạ assertion.
- Webpack output riêng build/fe-w5-production PASS, kể cả kiểm tra type bắt buộc. Build này không chứng minh Lighthouse >=90 hoặc checkout production.
- Không chạy full lint để tuyên bố repo sạch. Chỉ scoped lint được xác minh; không sửa lỗi backend/nền hoặc tắt typecheck.
- Không gọi AI trả phí, không tạo đơn/link tracking/thanh toán thật, mở /r/, gửi Telegram hoặc ghi Supabase dùng chung. Không sửa backend/DB/RLS.
- Checkout thật còn chờ BE + QA; chưa nghiệm thu realme C21Y, Safari iOS, PWA installability hay production UAT.

### Preview và lệnh PowerShell

Preview đang chạy riêng tại http://127.0.0.1:3195/preview/chat (chỉ development).

Nếu cần khởi động lại khi cổng trống:
~~~powershell
Set-Location E:\THUCTAP\ai-travel-reseller-fe-w5
$env:NEXT_BUILD_DIR = 'build/fe-w5-preview'
npm.cmd run dev -- --webpack --hostname 127.0.0.1 --port 3195
~~~

Chọn Checkout hợp lệ, mở chat, gửi tin và bấm Đặt vé ngay: chỉ nhận thông báo mô phỏng. Thử thiếu URL, URL không được phép, sai attribution; thử Hết phiên sau khi đã có checkout hợp lệ. Đóng/mở giữ hội thoại; đổi campaign/product hoặc phiên phải loại link/phản hồi của ngữ cảnh cũ.

~~~powershell
node --experimental-strip-types --test tests/checkout.test.ts tests/chat-transport.test.ts
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/eslint/bin/eslint.js src/components/chat/chat-panel.tsx src/components/chat/checkout-card.tsx src/lib/chat/checkout.ts src/lib/chat/transport.ts tests/checkout.test.ts tests/checkout-browser.mjs tests/fixtures/chat.ts app/preview/chat/preview.tsx
$env:PLAYWRIGHT_CHROMIUM_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
node tests/checkout-browser.mjs
$env:CHAT_BASE_URL = 'http://127.0.0.1:3195'
$env:CHAT_EVIDENCE_DIR = 'build/fe-w5-chat-regression'
node tests/chat-bottom-sheet.mjs
$env:NEXT_BUILD_DIR = 'build/fe-w5-production'
npm.cmd run build -- --webpack
~~~

### Tester 3 và đồng bộ sau PR #54

- Đã đọc TESTER3_W5.md: đích feature/fe-t3-w5-standalone-ui → dev, hai component ResellerFaqModal và OfflineBanner. Remote không có ref này; GitHub search head tương ứng trả rỗng tại lúc kiểm tra 01/11. Chưa có bàn giao để tích hợp; không tự làm thay.
- Khi nhận PR: xem diff chỉ component độc lập, props theo spec, focus/Escape/labels, responsive và lint/typecheck; đối chiếu nội dung FAQ với BA để không hứa sai thời gian/điều kiện hoa hồng. Không đăng review/approval hay merge trong lượt này.
- Nhánh tuần 5 xuất phát từ dev nên không mang commit riêng của #54. Sau khi #54 thực sự merge, đọc merged flag/merge_commit_sha và lịch sử dev để ghi nhận merge/squash/rebase thực tế.
- Chỉ sau khi bảo toàn và lưu thay đổi tuần 5 bằng cách được người dùng cho phép, fetch riêng dev với lệnh đã dùng, kiểm tra status/ancestry/diff rồi merge origin/dev vào nhánh tuần 5 (fast-forward nếu phù hợp). Cách này lấy kết quả #54 từ dev cho mọi kiểu merge, không cherry-pick/rebase/force-push.
- Rà conflict next.config/PWA/mobile theo hai phía; dừng nếu chưa đủ căn cứ. Chạy lại checkout/Bottom Sheet, video/PWA regression, typecheck và build sau tích hợp; ghi rõ thay đổi đến từ #54.
---

## 7. FE-W5-02 thực thi — 02/11/2026 (Asia/Bangkok)

### Bảo toàn và đồng bộ Git

- Worktree/branch giữ nguyên: E:/THUCTAP/ai-travel-reseller-fe-w5, feature/fe-w5-production-checkout-pwa-polish.
- Đã sao lưu ngoài worktree 12 file thay đổi (source/test/tài liệu và tsconfig local) tại E:/THUCTAP/fe-w5-recovery/20261102-f41e5871. Đã so sánh SHA256 từng bản sao và đọc lại manifest.json trước thao tác Git.
- Checkpoint LOCAL duy nhất: 44d02ca775d479f73a939a41c52d7fbdbdf6a16b, 11 file FE-W5-01. Stage đích danh, không đưa tsconfig local, env, output/log/artifact vào commit.
- Fetch riêng dev thành công: origin/dev vẫn 7ced50a54997e639145d1ce83330ad2557b38574. git merge --no-edit origin/dev trả Already up to date; không phát sinh merge commit/conflict. Không có thay đổi dev mới ảnh hưởng FE trong lần đồng bộ này.
- PR #54 vẫn OPEN/DRAFT, merged=false, head df2147e tại lần kiểm tra 02/11. Không coi merge_commit_sha tạm khi PR còn mở là bằng chứng merge.
- Không tích hợp/cherry-pick nhánh tuần 4. Đã đối chiếu: #54 sửa video rewrite trong next.config.ts, safe area, bottom-nav touch/viewport/rAF, mobile-dialog và video/modal. Các tối ưu lần này không sửa các file đó, không làm lại tuần 4.
- FE-W5-02 hiện IN_PROGRESS: kết quả đo là baseline nhánh chưa tích hợp #54; phải chạy lại sau khi #54 thực sự merge vào dev.
- Không commit tối ưu mới hoặc push. Không sửa env/DB/RLS/backend, exclude/recovery hay checkout tuần 3/4. tsconfig.json của riêng tuần 5 có thêm include do Next sinh cho output baseline/optimized/final; giữ local, chưa commit.

### Phương pháp và nguồn đang đo

- Baseline: checkpoint 44d02ca trên dev 7ced50a, Webpack output build/fe-w5-w2-baseline.
- Sau tối ưu: cùng checkpoint + diff FE-W5-02, output build/fe-w5-w2-final. Source patch và SHA256 từng file runtime nằm trong performance-optimized/summary.json; helper analytics mới được hash riêng dù chưa tracked.
- Lighthouse 13.0.1 (CLI Node), Chrome cài sẵn 156.0.8078.74, Next.js 16.3.8, Node 24.16.0. Công cụ Lighthouse cài ngoài repo tại E:/THUCTAP/fe-w5-tools-20261102, không sửa package.json/lockfile. Hai lần tải đầu ECONNRESET; tải với maxsockets=1 đã thành công, không sửa ACL/xóa lock.
- Cùng origin production http://127.0.0.1:3196, mỗi route 3 lượt tuần tự, profile Chrome mới từng lượt, không cookie/session. Storage reset bật, không dùng cache/SW ấm để tăng điểm.
- Lighthouse mobile mặc định theo report: 412x823, DPR 1.75; simulated throttling RTT 150ms, throughput 1638.4Kbps, CPU slowdown 4x (các tham số request/download/upload thực tế cũng được lưu trong JSON).
- Route đại diện: / (landing), /chat (UI chat thật, không attribution, không gửi AI), /login (auth UI). Không đo /preview/fixture để kết luận hiệu năng thật.
- /merchant và /reseller khi chưa có session redirect /login. Không lấy điểm login thay cho portal, Wallet, Library hoặc Content Kit; các route dữ liệu thật còn chờ session/staging an toàn.
- Không dùng dev server để đo Lighthouse. Môi trường local không có .env.local; SDK analytics không được tải khi thiếu cấu hình. Hành vi có cấu hình được kiểm tra bằng SDK fixture, không gửi analytics thật.

### Bảng đo trước/sau (3 lượt, trung vị và min–max)

| Route | Performance trước | Performance sau | A sau | BP sau | JS transfer trước → sau (KiB) | LCP trung vị trước → sau |
|---|---|---|---|---|---|---|
| / | 88 (70–88) | 93 (84–94) | 95 | 100 | 243.9 → 142.2 | 3626 → 2927 ms |
| /chat | 88 (87–95) | 94 (94–96) | 95 | 100 | 262.5 → 160.8 | 3697 → 2475 ms |
| /login | 90 (89–90) | 94 (92–95) | 100 | 100 | 298.1 → 196.4 | 3391 → 2631 ms |

- Các lượt P nguyên gốc: / trước [70,88,88], sau [84,94,93]; /chat trước [88,95,87], sau [96,94,94]; /login trước [89,90,90], sau [92,94,95]. Không loại lượt thấp.
- TBT trung vị trước → sau: / 141→132ms; /chat 126→143ms; /login 144→184ms. Không khẳng định mọi chỉ số đều cải thiện; cần profiling TBT/độ ổn định tiếp trên staging và thiết bị thật.
- CLS trung vị không đổi: / 0.0021, /chat 0.0051, /login 0.0010.
- Performance trung vị >=90, A>=95, BP>=95 đạt cho ba route đã đo; chưa đạt yêu cầu ổn định mọi lượt vì / có lượt 84.
- First Load JS <120kB CHƯA ĐẠT theo giả định tạm: JavaScript truyền tải lượt điều hướng lạnh từng route, đơn vị KiB (1024 bytes), gồm runtime/framework và script quan sát trong cửa sổ Lighthouse. Cần PM/QA thống nhất route, raw/compressed và có tính prefetch/analytics không.
- Next 16.3.8 Webpack không in bảng First Load JS kiểu tài liệu cũ. Dùng Lighthouse resource-summary Script.transferSize và Resource Timing làm số đo thay thế, không gọi đó là chỉ số First Load JS chính thức của Next.
- Chỉ hai chunk runtime/router dùng chung của bản sau đã truyền khoảng 126.9KiB; không tắt framework, auth hay chức năng để ép ngân sách. Không nâng dependencies trong lượt này.

Đối chiếu Resource Timing riêng, cùng viewport 390x844, Chrome mới, SW blocked và HTTP cache tắt bởi route guard, chỉ GET localhost (khác cấu hình Lighthouse, không trộn số):

| Route | JS decoded trước → sau (KiB) | JS encoded body trước → sau (KiB) |
|---|---|---|
| / | 772.3 → 462.5 | 240.3 → 139.1 |
| /chat | 822.6 → 512.7 | 257.8 → 156.5 |
| /login | 933.6 → 623.8 | 291.5 → 190.2 |

### Tối ưu đã thực hiện theo bằng chứng

- instrumentation-client.ts + src/lib/analytics.ts + src/lib/analytics-client.ts: baseline tải SDK PostHog đồng bộ (~101.7KiB transfer) dù chưa có đủ cấu hình. Nay dynamic import khi có đủ hai setting, dùng chung một lần load/init; sự kiện funnel sớm chờ init, giữ thứ tự/properties. Giữ autocapture/pageview/pageleave off và session recording disabled như cũ; không tắt analytics đã được cấu hình để tăng điểm.
- app/page.tsx: Lighthouse chỉ ra ảnh LCP thiếu fetchpriority=high. Thay prop priority đã deprecated trong Next 16 bằng loading=eager + fetchPriority=high theo docs nội bộ. Không đổi ảnh/logo/layout hoặc kích thước khung.
- Fonts tiếp tục self-host bằng Fontsource với display:swap; không gọi Google Fonts, đổi font hoặc tải asset thương hiệu khác.
- public/sw.js: giữ một cơ chế đăng ký hiện hữu. Core cache v2 vẫn chỉ offline document + 3 icon; thêm static-v2 tối đa 32 mục, chỉ font Be Vietnam Pro/Lora WOFF2 và CSS content-hashed của Next.
- Cache runtime chỉ nhận response thành công, không redirect, đúng MIME, có immutable và không private/no-store. Request tĩnh bỏ credentials và custom headers. Không cache JavaScript, API, Supabase, session/token, HTML/RSC, Server Actions, checkout/đơn/payment.
- Giữ navigation network-only/no-store và offline generic trung thực; /api, /auth, /r bypass nguyên trạng. Không mở /r trong browser test; bypass được chứng minh bằng unit dispatch không phát request.
- Không skipWaiting/clients.claim. Worker mới chờ các tab cũ đóng; activate xóa cache owned cũ, giữ unrelated cache. Development unregister worker/cache owned cũ, không tạo cache dev.
- Không làm FAQ Modal/Offline Banner thay Tester 3, không đổi Auth/guard, Tracking/QR, Wallet, Content Kit hoặc Merchant Library.

### Kiểm chứng

- Unit 15/15 PASS: analytics SDK chỉ load khi đủ cấu hình; init một lần/giữ event sớm/xử lý load lỗi; SW static allowlist, no credentials, MIME/cache headers, không cache response riêng tư/lỗi, giới hạn 32 mục, no-store/offline; checkout URL/transport hồi quy.
- Production Webpack baseline, optimized và final PASS, typecheck bắt buộc không bị tắt. Scoped lint và tsc --noEmit --incremental false PASS.
- tests/pwa-production-browser.mjs PASS: một manifest, metadata, icon 192/512/apple180, SW headers/scope/controller, cập nhật v1→v2 chờ đóng tab, dọn cache cũ/giữ cache khác, CSS/font cache thực, portal guard chưa đăng nhập, offline /merchant /reseller /chat generic và online recovery.
- Chrome Page.getAppManifest.errors=[] và Page.getInstallabilityErrors.installabilityErrors=[] trong profile thường riêng. Không tuyên bố đã cài Android/iOS thật hoặc PWA đạt 100% trên mọi thiết bị.
- Lần thử đầu Chrome báo in-incognito; đã chuyển profile riêng. Lần thử lifecycle mở tab mới quá sớm giữ worker cũ; đã chờ activate khi không còn controlled client. Giữ nguyên assertions và chạy lại PASS.
- Kiểm tra development PASS: gỡ worker/cache owned cũ, giữ other-app cache; không request API/external/tracking.
- Hồi quy tests/checkout-browser.mjs PASS lại bốn viewport 320/390/768/1440, URL/attribution, double click, focus, pending/offline/expiry, draft/error/timeout, đóng/mở/context/session/late reply. Không phát sinh API thật/external/write requests.
- Lỗi nền còn thấy trong Lighthouse: chữ AI nhỏ trong brand có contrast 3.82 (điểm A=95 cho / và /chat); không sửa logo/brand ngoài phạm vi. TBT trên chat/login tăng trong các lượt đo, chưa có bằng chứng nguyên nhân/regression chức năng.
- Lighthouse đã bỏ PWA category từ v12: không bịa điểm PWA. Thay bằng manifest/icons, native Chrome installability, SW lifecycle/cache/offline và checklist thiết bị. Nguồn: https://developers.google.com/speed/docs/insights/release_notes (10/05/2024).
- Full lint/portal dữ liệu thật/Lighthouse trên thiết bị thật chưa được tuyên bố PASS. FE-W5-01 vẫn chưa nghiệm thu checkout thật; contract Order API/attribution/status còn thiếu như mục 6.

### Artifacts ngoài Git và lệnh chạy lại

- Backup/hash: E:/THUCTAP/fe-w5-recovery/20261102-f41e5871/manifest.json.
- Lighthouse HTML/JSON từng lượt + summary/source: E:/THUCTAP/fe-w5-recovery/performance-baseline và performance-optimized.
- Resource Timing/ảnh: E:/THUCTAP/fe-w5-recovery/transfer-baseline và transfer-optimized.
- Installability/cache/ảnh PWA: E:/THUCTAP/fe-w5-recovery/pwa-production.
- Production final đang chạy: http://127.0.0.1:3196/ (PID 15740). Dev fixture: http://127.0.0.1:3195/preview/chat (PID 16528). Chỉ dừng server tuần 5 do lượt này tạo; không dừng mọi Node hoặc server worktree khác.
- Khi cổng trống, khởi động production:

~~~powershell
Set-Location E:\THUCTAP\ai-travel-reseller-fe-w5
$env:NEXT_BUILD_DIR = 'build/fe-w5-w2-final'
npm.cmd run build -- --webpack
npm.cmd run start -- --hostname 127.0.0.1 --port 3196
~~~

~~~powershell
node --experimental-strip-types --test tests/analytics-client.test.ts tests/pwa-worker.test.mjs tests/checkout.test.ts tests/chat-transport.test.ts
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/eslint/bin/eslint.js instrumentation-client.ts src/lib/analytics.ts src/lib/analytics-client.ts public/sw.js app/page.tsx tests/analytics-client.test.ts tests/pwa-worker.test.mjs tests/pwa-browser.mjs tests/pwa-production-browser.mjs
$env:PWA_BASE_URL = 'http://127.0.0.1:3196'
node tests/pwa-browser.mjs
node E:/THUCTAP/fe-w5-recovery/performance-run.mjs rerun
~~~

### Tester 3 và việc tiếp theo

- Truy vấn GitHub head:feature/fe-t3-w5-standalone-ui (all states) trả rỗng; ls-remote đúng ref cũng rỗng ngày 02/11. Chưa có PR/HEAD/file FAQ Modal hoặc Offline Banner để nhận bàn giao; không đăng comment/review/approval/merge.
- FE-W5-04 vẫn chờ bàn giao, review trước 04/11 17:00. FE-W5-03 chờ BA/QA bugs trước 05/11 12:00.
- FE-W5-02 deadline 04/11 12:00: còn ngân sách 120KiB chưa thống nhất/đạt, ổn định lượt đo, portal có session, UIUX maskable assets, tích hợp #54 và thiết bị thật.
- Sau khi #54 thực sự merge: xác minh lịch sử/cách merge từ dev, bảo toàn các tối ưu chưa commit theo ủy quyền mới rồi tích hợp origin/dev, không merge lại nhánh tuần 4 hoặc force-push/rebase. Chạy lại video/PWA/mobile/checkout và Lighthouse trên bản tích hợp cuối.

Checklist QA thiết bị tiếp theo (chưa thực hiện):
1. Android/realme C21Y: cài từ Chrome, icon/splash/standalone, safe area/bàn phím, font/CSS khi mạng chậm.
2. Safari iOS: Add to Home Screen, standalone, mở/đóng Bottom Sheet và focus trên máy thật.
3. Mở bản mới khi tab cũ còn chạy: không tự reload; đóng hết tab/PWA rồi mở lại để nhận worker mới.
4. Trên staging được QA cho phép, đăng xuất tài khoản rồi offline/mở lại portal: chỉ generic offline, không lộ HTML/tài khoản cũ; online phải qua guard.
5. Không coi redirect hoặc status=success là thanh toán thành công; nghiệm thu checkout riêng khi BE bàn giao contract và sandbox.
---

## 8. Đồng bộ PR #54 và đo lại — 02/11/2026

### Git và bảo toàn

- Worktree E:/THUCTAP/ai-travel-reseller-fe-w5; branch feature/fe-w5-production-checkout-pwa-polish.
- Backup trước Git tại E:/THUCTAP/fe-w5-recovery/20261102-before-dev-d8f3f1e5: 12 file source/test/docs/local tsconfig, source.patch, status.txt, manifest SHA256 đã đọc lại/xác minh. Env không được sao chép hoặc in; hash env/exclude được lưu riêng để kiểm tra không đổi.
- Checkpoint LOCAL mới: 28afb5f5dca77942170b2a6f44defeb726e208fb (11 file FE-W5-02, không env/artifact/output/tsconfig local).
- Fetch riêng dev thành công. Dev mới nhất tại lần kiểm tra: 89c9d4f9e71f74c960f296705cc9af26bbddd27b.
- GitHub #54: merged=true, merge commit 89c9d4f; hai parent 7ced50a và df2147e. Đây là merge commit thực, không phải squash/rebase hoặc merge SHA thử của PR đang mở.
- Merge origin/dev vào nhánh tuần 5 tạo LOCAL merge commit 4b0c977840ea06c9d5852fa02b2fef4fa5e082d7, strategy ort; không conflict, không có merge dở. Không rebase/cherry-pick hoặc merge riêng nhánh tuần 4.
- Ngay sau merge, hash cả 12 file tuần 5 trước merge, env và exclude đều khớp backup. Không cần tạm hoàn nguyên tsconfig local. Next sau đó tự thêm include cho output mới, giữ tất cả include cũ; tsconfig vẫn local, chưa commit.
- Dev đưa vào 39 file #54: VideoPlayer/download, modal mẹo và integration Content Kit, visualViewport/safe area, bottom-nav touch/rAF/cleanup, Merchant Library và sửa rewrite. next.config/video/mobile runtime giữ đúng nội dung dev; checkout/analytics/SW/ảnh LCP giữ đúng checkpoint tuần 5.
- Chỉ sửa một lỗi test tích hợp: tests/pwa-production-browser.mjs lấy fixture worker v1 từ commit 7ced50a thay vì HEAD (HEAD sau checkpoint đã chứa v2). Không hạ assertion hoặc đổi runtime.
- Tối ưu mới KHÔNG được triển khai. Phần chưa commit cuối lượt chỉ là tài liệu FE, tham chiếu fixture PWA và tsconfig output local; không push/PR/review/approval/merge GitHub.

### Kiểm chứng sau merge

- Node unit 18/18 PASS: checkout/transport, analytics, SW cache/privacy và video URL/download/errors.
- Content query adapter Playwright 3/3 PASS bằng Supabase SDK + fetch fixture; không gọi DB thật.
- tsc --noEmit --incremental false PASS; scoped ESLint cho phần FE tuần 4/5 liên quan PASS; production Webpack gồm typecheck bắt buộc PASS.
- Fixture browser scripts PASS: checkout-browser, chat-bottom-sheet, video-player-browser, pwa-polish-browser, video-posting-tips-browser và video-rewrite-browser.
- Phạm vi: 320/390/768/1440px; chat đóng/mở/context/session/late reply/double click; MP4 local byte/hash/range/download và errors; modal focus/Escape/scroll/cleanup; portrait/landscape, safe area và keyboard/visualViewport mô phỏng; video không tồn tại trả GET/HEAD 404 thật, không thay bằng sample.
- Video generation UI chỉ nhận mock HTTP do Playwright fulfill, không gọi AI/video service thật. Tracking dialog chỉ mở UI, không bấm tạo link. Không mở /r/; kiểm tra bypass trong unit dispatch không phát request.
- PWA production PASS: manifest/icons, Chrome installability, worker v1→v2 chờ đóng tab, scope/controller, cache tĩnh/offline/online và portal guard với browser chưa đăng nhập. Không nghiệm thu Android/Safari thật.
- Lần capture checkout đầu bị wrapper PowerShell dừng khi Node ghi stderr, không giữ được kết quả kiểm thử; đã chạy lại với capture đầy đủ và PASS. Không dùng lần không đủ bằng chứng để kết luận lỗi ứng dụng; không giảm assertion.
- Login production GET 200, nút mở, không còn notice thiếu cấu hình; đã xác minh hydration bằng toggle mật khẩu rỗng, không nhập/gửi tài khoản.
- Không sửa backend/DB/RLS/rule/typecheck. Không tuyên bố full lint toàn repo hoặc UAT portal đã đạt.

### Source, môi trường và server được đo

- Source runtime: merge 4b0c977 trên dev 89c9d4f + hai checkpoint tuần 5 đã bảo toàn; fix fixture chỉ ảnh hưởng test. Không có đợt tối ưu runtime bổ sung.
- Webpack output mới: build/fe-w5-post54-production-20261102. Build ID + SHA256 các file runtime ghi trong E:/THUCTAP/fe-w5-recovery/post54-20261102/initial-js-budget.json; Lighthouse summary cũng ghi source HEAD/hashes.
- Supabase URL và publishable key có mặt/qua guard; anon key thiếu nhưng không bắt buộc. SERVICE_ROLE có mặt, SECRET thiếu; không có SECRET rỗng che fallback. Chỉ kiểm tra trạng thái, không in hoặc sao chép credential, không xác nhận key hợp lệ với DB.
- PostHog token/host đều chưa cấu hình ở lần build này; không tự tắt analytics được cấu hình để tăng điểm. Nhánh vẫn giữ lazy SDK và kiểm thử configured analytics bằng fixture.
- Đầu lượt cả 3195 và 3196 không có listener. Đã kiểm tra cổng trống trước khi mở đúng worktree; không dùng/dừng PID lịch sử.
- Production http://127.0.0.1:3196/ PID 17424. Preview http://127.0.0.1:3195/preview/chat listener PID 3728; preview được khởi động mới vì đầu lượt không chạy, giữ nguyên khi mở production.
- Preview output riêng build/fe-w5-post54-preview-20261102. Không dừng server worktree khác, không tunnel/deploy.

### Lighthouse mobile — 3 lượt lạnh mỗi route

- Lighthouse 13.0.1, Chrome 156.0.8078.74 (report UA HeadlessChrome/156.0.0.0); 412x823 DPR 1.75, simulate, RTT150ms, throughput1638.4Kbps, CPU4x. Profile Chrome mới từng lượt, storage reset bật; không dùng cache/SW ấm hoặc session đăng nhập.
- Cùng điều kiện công cụ/throttling với lần trước; build/test nặng đã kết thúc trước khi bắt đầu đo. Không gửi chat, checkout hoặc thao tác tạo dữ liệu.
- Source lần cũ chưa có #54 và thiếu cấu hình Supabase, login bị khóa. Lần này source có tuần 4 và login đã mở. Vì khác môi trường/source, không quy toàn bộ chênh lệch cho tối ưu hiệu năng.

| Route | Performance 3 lượt | Trung vị (min–max) | Accessibility | Best Practices | JS transfer KiB | LCP trung vị | TBT trung vị |
|---|---|---|---|---|---|---|---|
| / | 90,91,94 | 91 (90–94) | 95 | 100 | 142.2 | 2963ms | 189ms |
| /chat | 94,93,93 | 93 (93–94) | 95 | 100 | 160.7 | 2921ms | 115ms |
| /login | 99,98,96 | 98 (96–99) | 100 | 100 | 196.4 | 2160ms | 98ms |

A/BP và JS transfer như nhau trong 3 lượt của từng route. CLS trung vị / 0.0021, /chat 0.0051, /login 0.0010.

Đối chiếu lịch sử chỉ để tham khảo: bản optimized trước #54/thiếu Supabase có P trung vị 93/94/94 và JS transfer142.2/160.8/196.4KiB. Không gọi lần đo đó là baseline cùng cấu hình hoặc portal acceptance.

### Ngân sách JavaScript — chưa đạt/chưa đủ định nghĩa First Load JS

- Tài liệu FE_W5 mục3 viết First Load JS <120 kB; yêu cầu lượt này dùng 120 KiB. Chưa thống nhất route, raw hay compressed, entry/runtime/prefetch. Không sửa ngưỡng: 120kB=120000 bytes, 120KiB=122880 bytes; các phép kiểm kê dưới đều vượt cả hai.
- JS transfer ở bảng Lighthouse là tổng transferSize của nhóm Script trong cửa sổ navigation, có thể gồm prefetch/dynamic load và protocol overhead. KHÔNG phải First Load JS và không được dùng thay cho chỉ số đó.
- Next16.3.8 Webpack không in bảng First Load JS theo cách tài liệu cũ. Chưa có số First Load JS chính thức được thống nhất; không đánh dấu đạt ngân sách này.
- Kiểm kê độc lập script src trong HTML initial, deduplicate theo URL, đọc file build và gzipSync từng chunk (ước lượng gzip local, không đồng nhất với transfer HTTP). Báo cả nomodule thay vì loại tùy ý:

| Route | Tất cả script tag: raw / gzip KiB | Script tag chạy trên browser hiện đại: gzip KiB |
|---|---|---|
| / | 572.4 / 177.8 | 139.1 |
| /chat | 606.1 / 188.4 | 149.7 |
| /login | 613.6 / 191.9 | 153.2 |

- Mỗi route có một polyfill nomodule:112594 bytes raw,39627 bytes gzip. Nó có trong HTML nhưng Chrome hiện đại không tải; vì vậy inventory tất cả tag khác mạng quan sát. Cột browser hiện đại chỉ phân loại đúng hành vi nomodule, không đổi ngưỡng hay tuyên bố đạt.
- Hai chunk dùng chung lớn nhất: 480-7ee263a2bbc97118.js (241026 raw/65776 gzip bytes, có marker React DOM/Next router), 8e2a97ba-98f903a5c1a41dfb.js (201055 raw/63300 gzip bytes, marker React DOM). Tổng gzip khoảng126.1KiB trước phần ứng dụng; marker không có nghĩa toàn bộ chunk thuộc một module.
- Chỉ đề xuất bước sau: dùng analyzer/module graph để xác định owner/duplication vendor trước khi đổi build; đánh giá tách ChatPanel ở lần mở đầu mobile với loading/focus/context đúng; profile lazy QR/poster ở portal (qrcode đang import tĩnh trong tracking-qr/canvas-qr). Chưa có bằng chứng QR là nguyên nhân chính trên ba route công khai.
- Không triển khai các đề xuất, không tắt analytics/auth/SSR/route, loại resource khỏi phép đo, đổi dependencies hoặc giảm threshold để báo đạt.

### Artifacts, giới hạn và việc tiếp theo

- Lighthouse HTML/JSON 9 lượt + summary/source: E:/THUCTAP/fe-w5-recovery/performance-post54-20261102.
- Build/test logs, login-verification.json, environment-states.json, initial-js-budget.json và script phân tích: E:/THUCTAP/fe-w5-recovery/post54-20261102.
- Checkout/Bottom Sheet và tuần4 chỉ dùng fixtures/mocks + MP4 local; không phải nghiệm thu video Merchant hay thanh toán thật.
- /merchant và /reseller chỉ kiểm tra guard của browser không session (redirect login). Chưa đo portal có session/dữ liệu thật, realme C21Y hoặc Safari iOS. Không đánh dấu hoàn tất toàn tuần5/UIUX/QA sign-off.
- FE-W5-02 deadline04/11 12:00 vẫn IN_PROGRESS: đã tích hợp #54 và đo lại; còn ngân sách JS, portal có session, thiết bị/PWA thực tế.
- Đã đối chiếu BE1_W5.md và API hiện có: dev lần này không thêm Order/Checkout/Payment handler. Chat vẫn nhận structured suggested_checkout_url từ products.payment_url, giữ ref/campaign/product; không có contract tracking_code/token/xác nhận trạng thái đơn/payment mới.
- FE-W5-01 chưa nghiệm thu checkout thật. Cần BE bàn giao endpoint/payload/response/error, Merchant URL rules, signed attribution/click-session expiry, trạng thái order/payment có xác nhận backend và dữ liệu sandbox trước tích hợp tiếp.
- FE-W5-04 chờ bàn giao component Tester3; FE-W5-03 chờ BA/QA UAT bugs. Không đăng review/approval hoặc làm component thay Tester3 trong lượt này.

Khi cổng trống, chạy lại production:
~~~powershell
Set-Location E:\THUCTAP\ai-travel-reseller-fe-w5
$env:NEXT_BUILD_DIR = 'build/fe-w5-post54-production-20261102'
npm.cmd run start -- --hostname 127.0.0.1 --port 3196
~~~

Đo lại (không chạy build/test nặng đồng thời; tên phase mới để giữ report cũ):
~~~powershell
node E:/THUCTAP/fe-w5-recovery/performance-run.mjs post54-rerun-new-phase
~~~
---

## 9. FE-W5-01 — đối chiếu bàn giao BE1 v1.0.0 và hoàn thiện FE — 02/11/2026

Đã đọc trực tiếp E:/HKDN_126/checkout_integration_guide_for_fe.md, SHA256 6B424772F1C7542A9C1E08C521251A225D2844DFAAAAD2BCB4C76C3713ACFF63. Tài liệu là đầu vào contract; hướng dẫn chạy RPC ở mục6.3 không phải ủy quyền thực thi và không được chạy.

### Đối chiếu từng phần

| Mục guide | Code hiện tại / kết luận |
|---|---|
| 1, 2.2 — POST /api/chat | Khớp: JSON reply, intent_detected, suggested_checkout_url (string/null). ChatPanel chỉ dùng trường URL có cấu trúc, không trích URL trong reply, không dùng intent đơn độc làm bằng chứng thanh toán. FE không tự tạo URL thật. |
| 2.1, 2.3 — nguồn URL / buildCheckoutUrl | Backend hiện chỉ dùng products.payment_url; booking_url được đưa vào knowledge base, chưa fallback làm checkout. buildCheckoutUrl phía BE thêm đúng ref/campaign/product nhưng chấp nhận cả HTTP. FE giữ HTTPS-only, không sửa BE hoặc tự fallback/ghép URL. |
| 3.1–3.3 — validation / domain | Ví dụ guide chỉ kiểm HTTPS; FE giữ thêm chặn credentials/hash/query secret, attribution thiếu/sai/trùng. Đã bổ sung allowlist chính xác sunworld.vn, checkout.culaochamtravel.vn, culaochamtravel.vn, vinwonders.com; chặn domain giả/subdomain ngoài danh sách/port không chuẩn. Domain đích hiển thị và target=_blank, rel=noopener noreferrer được giữ. |
| 3.2 — checkout_clicked | Đã có captureChatFunnelEvent với attribution + checkout_domain; chỉ phát khi người dùng mở thật, không phát ở preview/offline/pending/bấm lặp. Không gửi full URL, câu chat hoặc dữ liệu thanh toán. Test dùng capture mock, không gửi PostHog thật. |
| 4 — thời hạn | Đã rõ: attribution 30 ngày, không có token URL ngắn hạn; không yêu cầu BE cung cấp lại chữ ký/token/thời hạn đã nêu. Có ATTRIBUTION_WINDOW_DAYS=30/helper trong commerce, nhưng chat loadProductAndCheckout không lấy/kiểm valid_to và không xác minh tuổi click. FE không có timestamp xác thực để tự thi hành 30 ngày; không bịa countdown hay sửa URL. |
| 5.1 — trạng thái | pending/confirmed/paid/cancelled/refunded đã có. FE không coi click/redirect/status=success là đặt đơn hoặc trả tiền thành công. Wallet recent_commissions là trạng thái hoa hồng, không phải endpoint xác minh một giao dịch thanh toán theo order_id. |
| 5.2 — tiền hoa hồng | Công thức guide khớp code: ROUND(amount*rate/100), phí20%, phần reseller còn lại. Ví dụ 1.150.000 x7,5% → 86.250 gross,17.250 fee,69.000 net. FE không tính hoặc tăng ví từ click; giữ số VND nguyên do server trả. |
| 5.3 — Wallet | Endpoint GET /api/reseller/wallet đã có, getUser/reseller gate, private no-store; FE kiểm owner và schema, có Tải lại ví. Không cần BE cung cấp lại endpoint này. Tuy nhiên ví dụ guide là payload rút gọn, không qua schema hiện tại: thiếu refunded_balance,last_updated và các trường commission campaign_id/campaign_name/gross_amount/platform_fee/customer_name/flag_self_purchase; mẫu dùng masked_customer_name còn API/RPC hiện dùng customer_name đã mask. Giữ validation, không thêm giá trị tiền mặc định hoặc tự đổi contract. |
| 5.1, 5.3, 6.3 — phân bổ số dư | Khác biệt cần BE xác nhận trước nghiệm thu: guide nói confirmed→pending_balance, paid→available_balance; migration/RPC repo gom commission pending→pending_balance, confirmed→available_balance, paid→paid_balance, trigger sao chép order.status sang commission.status. lifetime_earnings hiện là available+paid, khác ý nghĩa tổng trong mẫu guide. Đây là quan sát source, chưa truy vấn DB triển khai. FE không sửa ledger/schema hoặc tự remap số dư. |
| 6.1–6.2 — fixture | Seed IDs và payload mẫu đã đủ để mock; đã thêm lựa chọn Checkout BE1 v1.0.0 (fixture) dùng đúng ba UUID và URL mẫu. Preview hiện dùng transport fixture/scenario, không tự chuyển sang AI theo câu hỏi/query như mô tả guide. Dùng cổng3195, chọn scenario rõ ràng; production /preview/chat vẫn404. |
| 6.3 — RPC | Không chạy process_order_attribution, không tạo đơn/hoa hồng hoặc gọi admin client. Script này ghi DB, không phải môi trường cô lập. |
| 7 — DoD | CTA/domain/HTTPS/attribution/analytics và mobile fixture đã kiểm chứng; chưa thể đánh dấu DoD ví tăng sau checkout hoặc thanh toán thật. |

### Thay đổi và bằng chứng

- Runtime chỉ bổ sung kiểm tra domain/port tại src/lib/chat/checkout.ts; CheckoutCard/ChatPanel/transport/analytics/Wallet hiện có được giữ, không làm lại. Giữ loading, offline, hết phiên, chống bấm lặp, không retry navigation, loại phản hồi chậm sau đổi context/session.
- Preview thêm scenario BE1 đúng payload, scenario HTTPS ngoài allowlist; fixture hợp lệ đổi sang Sun World. Việc tạo URL trong tests/fixtures chỉ tạo dữ liệu giả, không phải ghép URL checkout trong luồng FE thật.
- Unit/mock20/20 PASS: checkout6, transport2, analytics3, Wallet8, CheckoutCard1. Test CheckoutCard chạy component thật với React/analytics/browser mocks, chứng minh event một lần và chỉ domain/attribution, anchor an toàn, không có success state; không gọi dịch vụ ngoài.
- Browser checkout fixture PASS tại320/390/768/1440: href/UUID đúng, domain đích, tab/rel, contrast/focus/layout/dedup, HTTPS ngoài allowlist, attribution sai/thiếu URL, offline/loading/hết phiên/late response/session isolation và không tin status=success. Route guard chặn API, non-GET, domain ngoài và /r/; forbidden requests và pageerrors đều rỗng.
- Hai lượt browser đầu có assertion fixture sai đường dẫn/thiếu một nhóm UUID campaign; đã sửa assertion khớp nguyên mẫu BE, không hạ validation/assertion. Lượt cuối PASS đầy đủ.
- TypeScript noEmit/incremental false và scoped ESLint PASS. Production Webpack output riêng build/fe-w5-checkout-be1-20261102; log cuối build/fe-w5-checkout-be1-build-final.log. Browser log build/fe-w5-checkout-be1-browser-final.log; artifacts ignored, không commit.
- Runtime bundle đã đổi: Lighthouse mục8 là bằng chứng cho build trước thay đổi này. Cần đo lại /chat và các route dùng chung ChatPanel, cùng /,/login để có bộ so sánh3route trên build mới. Không gán điểm cũ cho build mới; lượt này không chạy lại Lighthouse hoặc đợt tối ưu.
- Giữ branch feature/fe-w5-production-checkout-pwa-polish, HEAD4b0c977; giữ toàn bộ diff cũ gồm tài liệu/PWA fixture/tsconfig local. Env/exclude hash vẫn nguyên; không fetch/merge/commit/push/env/backend/DB/RLS/tunnel.

### Phần còn chờ và cách kiểm tra

- Contract checkout redirect đã rõ theo BE1; không còn chờ danh sách domain, ref/campaign/product, attribution30ngày hay đòi thêm token ngắn hạn.
- Blocker nghiệm thu thanh toán: guide chưa cung cấp endpoint đọc xác nhận giao dịch cụ thể, correlation order/booking với request checkout, callback/webhook server và error/status contract. Wallet aggregate không thay thế xác nhận thanh toán.
- Chưa có sandbox/test project cô lập được bàn giao; seed IDs + RPC ghi dữ liệu ở mục6.3 không đáp ứng điều kiện test không ghi DB. Cần BE cung cấp môi trường và quy trình QA được phép trước E2E.
- Cần BE đối chiếu code với cam kết booking_url fallback/valid_to và xác nhận mapping trạng thái/số dư + payload Wallet đầy đủ; FE không tự sửa backend hoặc làm yếu parser để qua mẫu rút gọn.
- FE-W5-01 vẫn IN_PROGRESS: phần redirect FE theo contract đã xong bằng fixture; không thêm màn hình thanh toán thành công thiếu xác nhận server, không nghiệm thu toàn tuần5.
- Kiểm tra an toàn: http://127.0.0.1:3195/preview/chat → chọn Checkout BE1 v1.0.0 (fixture), mở chat nếu màn hình nhỏ, gửi “Tôi muốn mua vé”, xem domain/CTA, bấm để nhận thông báo mô phỏng. Không mở Merchant hoặc ghi dữ liệu. Có thể chọn HTTPS ngoài domain cho phép / Sai attribution / Hết phiên để xem trạng thái chặn.
### Server và kiểm tra build phục vụ cuối lượt

- Đã kiểm lại listener3196/PID17424, command/start time và output cũ trước khi dừng; không dùng PID lịch sử để dừng mặc định. Production mới PID20384, chạy next start từ đúng worktree/output build/fe-w5-checkout-be1-20261102. Preview3195 giữ nguyên listenerPID3728.
- Smoke production PASS: /login HTTP200, nút enabled, hết notice thiếu cấu hình, toggle mật khẩu rỗng chứng minh hydration; /chat HTTP200 và nhập bản nháp chứng minh hydration, không gửi. SHA25610 script chunks từ HTML response khớp output mới và có allowlist checkout mới; không dựa riêng vào server ready.
- Bằng chứng: build/fe-w5-checkout-be1-smoke.json. Blocked requests0, pageerrors0, không gửi credential/chat. Phép kiểm bundle dùng response HTML gốc; DOM sau hydration không còn đủ script tag. Không coi các lần capture/selector chưa đủ bằng chứng là lỗi ứng dụng.
- URL production http://127.0.0.1:3196/login để người dùng tự đăng nhập; không tự đăng nhập hoặc kiểm chứng key/thanh toán/Wallet thật. URL fixture checkout an toàn http://127.0.0.1:3195/preview/chat.
---

## 10. FE-W5-02 — tối ưu theo module graph và đo build cuối — 02/11/2026

### Quan sát thủ công do người dùng cung cấp

Chỉ ghi nhận ba quan sát trên preview:
- Fixture Checkout BE1 v1.0.0 hiển thị domain sunworld.vn và nút đặt vé.
- Bấm CTA mô phỏng: “Đang mở trang đặt vé…” rồi trở về “Đặt vé ngay”, không loading mãi.
- HTTPS ngoài domain cho phép bị chặn, không hiển thị CTA.

Đây chưa phải xác nhận thanh toán thật, điện thoại thật hoặc giữ hội thoại khi đóng/mở. Regression tự động có kiểm tra đóng/mở bằng fixture; không chuyển kết quả đó thành xác nhận thủ công của người dùng.

### Nền và phạm vi thay đổi

- Đã đọc AGENTS.md, kế hoạch và kết quả mục8/9, hướng dẫn Next16.3.8 tại node_modules/next/dist/docs/ về Client Components, lazy loading và Link prefetch.
- Worktree E:/THUCTAP/ai-travel-reseller-fe-w5; branch feature/fe-w5-production-checkout-pwa-polish; HEAD giữ4b0c977. Không fetch/merge/commit/push.
- Giữ toàn bộ diff đầu lượt: checkout BE1, fixtures/tests/docs, fixture SWv1 và tsconfig local; source tuần4/#54, analytics/SW/ảnh LCP tuần5 được giữ. Env/exclude nguyên hash. Không sửa backend/DB/RLS/dependency/next.config.
- Artifact riêng build/fe-w5-budget-20261102 gồm before-source.patch, backup hai component có đuôi .backup, script phân tích, module stats và logs. Không đưa env hoặc giá trị credential vào artifact.
- Chỉ tối ưu hai consumer AuthForm và ChatPanel. Các Button/Input tại đây chỉ dùng class cố định nên chuyển sang button/input HTML với đúng class đang có; giữ handler, form action, disabled, constraints, aria/focus và CSS. Không thay primitive dùng chung hoặc bắt portal chịu thay đổi.
- Bỏ đường import consumer→Button/Input→cn→tailwind-merge/class-variance-authority/Radix Slot khỏi initial graph của /chat và /login. Không trì hoãn chat, auth, checkout hoặc analytics.
- Thêm prefetch=false riêng link “Xem thử Dashboard” trong AuthForm: demo không cần để đăng nhập nhưng Next trước đó tự tải route + JS khi link vào viewport. Chỉ tải demo khi người dùng bấm; href/điều hướng giữ nguyên. Không tắt prefetch đăng nhập/đăng ký, không chặn resource trong Lighthouse.
- / không có các module ghép class này trong initial graph trước tối ưu; không sửa homepage để cố tăng điểm.

### Module lớn và nguyên nhân tải ban đầu

Webpack stats lấy bằng hook chỉ bổ sung done→toJson trong tiến trình build, source=false; không sửa cấu hình repo, không cài analyzer/package và không áp dụng hook vào server/Lighthouse.

- React DOM client production:616647 bytes theo kích thước module Webpack, là runtime hydration của App Router. Next segment-cache/cache145196, scheduler95827, ppr-navigations76997 và RSC client64276 bytes nằm trong đường router/navigation/prefetch. Đây là source/module bytes trước minify, không phải bytes giải nén hoặc transfer.
- Hai chunk framework lớn giữ nguyên: 8e2a97ba-98f903a5c1a41dfb.js201055 raw/63300 gzip bytes; 480-7ee263a2bbc97118.js241026 raw/65776 gzip bytes. Tổng gzip từng file126.1KiB trong build hiện tại, trước phần ứng dụng.
- Tailwind-merge106124 source bytes, Radix Slot/compose refs7937 và class-variance-authority3048 source bytes trước đây ở chunk6362 (34604 raw/11393 gzip bytes). Graph chứng minh được tải từ các primitive khi render AuthForm/ChatPanel ban đầu; sau tối ưu không còn trong initial graph hai route. Chúng vẫn tồn tại cho portal/demo sử dụng primitive, không gỡ dependencies.
- Lượt đo trung gian chỉ bỏ primitive import cho thấy /login transfer vẫn197.4KiB: network còn tải chunk6362,9032,1135 và app/preview/merchant qua auto-prefetch. Vì vậy bổ sung tải demo theo thao tác bấm; smoke xác minh không có request demo trước click và demo vẫn mở sau click.
- Bằng chứng đầy đủ: before/after/complete-webpack-stats.json, module-analysis.json, before/after/complete-initial-js.json và network-requests trong từng Lighthouse report.

### Ngân sách120KiB và định nghĩa đo

Không đổi ngưỡng để báo đạt. Mục3 kế hoạch gốc ghi First Load JS <120kB; yêu cầu hiện tại dùng120KiB. 120kB=120000 bytes,120KiB=122880 bytes. Tất cả phép kiểm kê dưới vẫn vượt cả hai.

1. First Load JS: Next16 Webpack không xuất bảng cũ; PM còn phải chốt route/browser, raw hay compressed, bao gồm entry/runtime/shared/prefetch ra sao và đơn vị kB/KiB. Chưa có số chính thức được thống nhất, không gắn nhãn First Load JS cho các phép đo khác.
2. Kiểm kê initial: lấy các script src trong HTML response, deduplicate URL, đối chiếu SHA256 file được phục vụ với output build; báo bytes file JS minified chưa nén và gzipSync từng file. Báo cả toàn bộ tag và browser hiện đại (nomodule có điều kiện không chạy). Đây là giả định phân tích nhất quán trước/sau, không tùy ý bỏ module.
3. JS transfer: Lighthouse resource-summary nhóm Script.transferSize trong toàn navigation, gồm script tải động/prefetch và overhead HTTP. Không thay thế First Load JS.
4. JS giải nén: cộng network-requests.resourceSize của mọi resourceType=Script, vẫn là JavaScript minified, chưa phải source/module bytes. Resource-summary của Lighthouse13 không có resourceSize nên không lấy nhầm trường này.

Kiểm kê cùng phương pháp, baseline ngay đầu lượt đã có checkout BE1 và cùng env:

| Route | Initial modern trước: raw / gzip KiB | Initial modern cuối: raw / gzip KiB | Còn vượt120KiB theo gzip |
|---|---|---|---|
| / | 462.5 /139.1 | 462.5 /139.1 | 19.1KiB |
| /chat | 496.3 /149.8 | 465.0 /139.7 | 19.7KiB |
| /login | 503.6 /153.2 | 472.1 /143.1 | 23.1KiB |

Giảm gzip initial khoảng10.1KiB ở mỗi /chat và /login. Toàn bộ script tag kể cả nomodule ở build cuối lần lượt raw/gzip572.4/177.8,574.9/178.4,582.1/181.8KiB. Mỗi route có polyfill nomodule112594 raw/39627 gzip bytes; Chrome hiện đại không tải nó. Hai cách kiểm kê đều được lưu, không dùng một cách để thay đổi tiêu chí.

Kết luận: chưa đạt120KiB theo giả định gzip initial ở trên; theo raw còn vượt nhiều hơn. Hai chunk framework hiện đã126.1KiB nên chỉ bỏ import ứng dụng an toàn không đủ. Bước tiếp theo là PM chốt metric, phân tích duplication/entry graph và đánh giá boundary theo route với QA; không tự thay kiến trúc, phiên bản hoặc trì hoãn chức năng thiết yếu để vượt ngưỡng trên giấy.

### Kiểm chứng và build phục vụ

- Unit18/18 PASS: checkout6, CheckoutCard1, chat transport2, analytics3, SW6. Configured analytics được thử bằng SDK mock; không gửi telemetry thật.
- Checkout browser + Chat/Bottom Sheet PASS tại320/390/768/1440: attribution/domain/tab/rel/contrast/layout, loading/offline/hết phiên/dedup/late response, focus/viewport/bản nháp và context/session isolation. Chỉ fixture/mocks, không gọi AI/Tracking/checkout/đơn/DB hoặc /r/.
- Auth smoke trước/sau PASS, đối chiếu class/trường thực tế: email/password constraints, toggle, next, role đăng ký và lỗi mật khẩu xác nhận chặn tại client. Chỉ dữ liệu giả, không gửi auth request. Demo-navigation smoke PASS: không prefetch demo, vẫn mở khi bấm; không API/write request.
- PWA trên build cuối PASS: Chrome native installability/manifest/icons, v1→v2 chờ tab đóng, CSS/font cache bounded/private bypass, guard browser không session và offline/online. Không coi đây là cài đặt Android/iOS thật.
- Standalone TypeScript noEmit/incremental false và scoped ESLint hai component PASS; build cuối Webpack gồm typecheck bắt buộc PASS. Không hạ assertion hoặc tắt rule. Player/modal/viewport helper/SW runtime không đổi; không làm lại tính năng tuần4.
- Có hai lỗi công cụ trong lượt: backup .tsx ban đầu lọt glob TypeScript (đã đổi đuôi .backup, giữ nội dung); bản runner PWA sao chép thiếu Encoding UTF8 làm sai literal tiếng Việt (đã sao chép lại UTF8 nguyên assertion). Các lần cuối đều PASS; không quy thành lỗi runtime hoặc giấu lần thất bại.
- Output cuối build/fe-w5-budget-complete-20261102, build ID BWmX6rdAgq6mcFDcV4IPt. Output trước và trung gian được giữ. next.config không đổi; Next chỉ bổ sung include output local vào tsconfig, giữ include cũ.
- Mỗi lần đổi server đều lấy lại listener/PID và kiểm command chứa đường dẫn tuyệt đối worktree trước khi dừng. Production cuối3196/PID11496; preview3195/PID3728 giữ nguyên và HMR nhận source mới, không restart preview. Không dừng server worktree khác.
- HTTP/hydration login/register, markup guard và điều hướng demo đã xác minh trên production cuối; script inventory SHA khớp output được phục vụ. Không chỉ dựa vào “Ready”. Người dùng tự đăng nhập; không xác nhận credential server hay thanh toán hợp lệ.

### Lighthouse trên build cuối

Lighthouse13.0.1, Chrome156.0.8078.74 (HeadlessChrome/156.0.0.0), mobile412x823/DPR1.75, simulated RTT150ms/throughput1638.4Kbps/CPU4x. ConfigSettings so sánh JSON bằng đúng bộ sau #54. Mỗi lượt Chrome profile mới, storage reset bật, không session và không dùng cache/SW ấm. Không chạy build/test nặng cùng lúc; không click chat/checkout khi đo.

Supabase/env giữ nguyên hash so với đầu lượt, login đã cấu hình; PostHog token/host vẫn chưa cấu hình, không tự tắt analytics để tăng điểm. Source cuối có #54 + checkout BE1 + hai tối ưu nhỏ ở trên. Build ID, HEAD4b0c977, source patch và SHA256 các file runtime trong summary; HEAD đơn độc không đại diện các diff chưa commit.

| Route | Performance3 lượt | Trung vị(min–max) | Accessibility | Best Practices | JS transfer KiB | JS giải nén KiB |
|---|---|---|---|---|---|---|
| / | 94,93,94 | 94(93–94) | 95 | 100 | 142.2 | 462.5 |
| /chat | 94,92,96 | 94(92–96) | 95 | 100 | 150.3 | 481.5 |
| /login | 81,96,95 | 95(81–96) | 100 | 100 | 151.1 | 479.2 |

A/BP, transfer và giải nén giống nhau trong3 lượt mỗi route. LCP trung vị2823/2837/2373ms, TBT116/113/183ms; CLS0.0021/0.0051/0.0010.

- So với bộ sau #54 mục8: P trung vị91/93/98→94/94/95; JS transfer142.2/160.7/196.4→142.2/150.3/151.1KiB; giải nén462.5/512.7/623.7→462.5/481.5/479.2KiB. Đây là so sánh lịch sử: bộ cũ chưa có checkout BE1; không quy toàn bộ chênh lệch score cho tối ưu. Kiểm kê initial đầu lượt ở bảng trên mới là baseline source/env checkout BE1 tương đương.
- / giữ nguyên source/bundle/transfer nhưng score cũng dao động; không có bằng chứng gắn mức tăng score homepage với thay đổi AuthForm. Login còn một lượt81, không tuyên bố mọi lượt đạt90 hoặc điểm đã ổn định; không loại lượt thấp.
- Bộ9 lượt trung gian (trước prefetch=false) được giữ riêng: P90(75–93)/93(86–93)/93(93–97), transfer142.2/150.3/197.4KiB. Chạy lại vì source được sửa thêm theo bằng chứng request, không thay thế tùy ý lượt xấu cùng một build.
- Báo cáo cuối: build/fe-w5-budget-20261102/lighthouse-complete (9 HTML/JSON + summary/source.patch). Bộ trung gian: lighthouse-final. Tổng hợp định nghĩa/số trước-sau: results-summary.json. Không nghiệm thu portal Merchant/Reseller có session hoặc thiết bị thật từ số liệu trang công khai.

### Trạng thái và bàn giao

- Cập nhật quyết định22:15 ngày02/11/2026: FE-W5-02 được PM nghiệm thu theo tiêu chí Performance trung vị>90, xem mục12. Kiểm kê JS vẫn vượt120KiB; giữ lượt login81 và giới hạn dao động. Portal có session/thiết bị/PWA thực tế vẫn chưa kiểm chứng, tách khỏi nghiệm thu hiệu năng theo tiêu chí PM điều chỉnh; không nghiệm thu toàn tuần.
- FE-W5-01 giữ IN_PROGRESS: quyết định BE1/PM ở mục12 đã chốt Wallet theo code/RPC và giao BE bổ sung fallback URL/valid_to/status. Còn chờ bàn giao/bằng chứng triển khai và kiểm chứng tích hợp, xác minh thanh toán theo đơn và quy trình test cô lập; không coi lời hứa là code đã triển khai.
- URL http://127.0.0.1:3196/login: kiểm tra toggle mật khẩu và bấm Xem thử Dashboard để xác minh demo vẫn mở; không cần gửi form. Preview an toàn http://127.0.0.1:3195/preview/chat vẫn có fixture BE1. Không yêu cầu kiểm thử thanh toán thật.
---

## 11. FE-W5-04 — kiểm tra bàn giao Tester3 và checklist review — 02/11/2026

### Preflight và kết luận tại thời điểm kiểm tra

- Đã đọc AGENTS.md, FE_W5.md, TESTER3_W5.md và UIUX_W5.md (UX-W5-02); đối chiếu interface LOCKED trong TEAM_WORK_LOG và SW/PWA/safe area hiện có.
- Worktree E:/THUCTAP/ai-travel-reseller-fe-w5, branch feature/fe-w5-production-checkout-pwa-polish, HEAD4b0c977840ea06c9d5852fa02b2fef4fa5e082d7. Kiểm tra status/diff/untracked, diff-check; không có merge dở hoặc thay branch. Toàn bộ diff FE-W5-01/02 và tsconfig local được giữ.
- Chưa tìm thấy bàn giao FAQ Modal/Offline Banner tuần5 trong các nguồn GitHub dưới đây. Đây là kết luận về nguồn đã kiểm tra tại thời điểm ghi bằng chứng, không phải khẳng định Tester3 chưa có công việc local.
- FE-W5-04 vẫn chờ bàn giao để review component, chưa review cô lập, chưa tích hợp, chưa có approval hoặc nghiệm thu. Không phải blocker đường găng của FE-W5-01/02 hay phát hành chính theo nguyên tắc Zero Blocker của TESTER3_W5.
- Không dựng component thay Tester3. Không tạo harness/ảnh giả hoặc gán PASS lint/TypeScript cho source chưa được nhận.

### Nguồn GitHub đã kiểm tra — HTTP GET, không git fetch

Repo NguyenMTue/ai-travel-reseller:
1. Search branches fe-t3 có kiểm tra hết cursor; collection branches?per_page=100 trả55 nhánh (<100). Không có feature/fe-t3-w5-standalone-ui; kiểm tra cả tên khác và hai nhánh phân biệt Feature/feature.
2. Search PR all states theo head:feature/fe-t3-w5-standalone-ui, FAQ, offline, standalone, reseller-faq-modal, OfflineBanner. FAQ/head/tên file/symbol không có PR phù hợp; offline/standalone chủ yếu trả #32/#46 (pipeline/PWA cũ).
3. Collection pulls?state=all&per_page=100&sort=updated&direction=desc trả56 PR (#1–#56): rà title/body/head/author, không có metadata chứa reseller-faq-modal/offline-banner/ResellerFaqModal/OfflineBanner. Hai PR tác giả TuanAnhNguyen-2005 là #33 và #50, không phải task tuần5.
4. Code search default branch cho tên file, ResellerFaqModal và OfflineBanner chỉ thấy tài liệu kế hoạch/interface; không có implementation runtime. Code search chỉ bao phủ default branch nên không dùng riêng nó để kết luận về các branch khác.
5. Cây Git recursive theo pinned SHA, truncated=false, trên dev89c9d4f và ba nhánh liên quan bên dưới: không có component src/components mang tên FAQ/Offline Banner. Các FAQ trong .ai/skills/docs là tài liệu tool, không phải FAQ cho Reseller.
6. GET toàn bộ danh sách file thay đổi của PR33/48/50 để loại trừ bàn giao khác tên; không chỉ dựa vào tiêu đề hoặc tên nhánh.

| Nguồn liên quan | Branch / HEAD SHA | File thay đổi và lý do không phải bàn giao tuần5 |
|---|---|---|
| PR33, tác giả TuanAnhNguyen-2005, merged22/10 | Feature/fe-t3-static-components / f9a5509cbc98b5d6ab4c37e9a4210ca398a21045 | src/components/merchant/media-card.tsx; src/components/merchant/video-guidelines-modal.tsx; src/lib/merchant/media-service.ts. Đây là Media/Video Guide tuần3. |
| Nhánh chữ thường, không có PR phù hợp trong collection | feature/fe-t3-static-components / f66ff8cbb9c40c8917f5cfd9dc7e31fefbf7432f | Cây file không có FAQ Modal/Offline Banner; không mặc định đồng nhất với nhánh Feature chữ hoa. |
| PR50, tác giả TuanAnhNguyen-2005, OPEN | feat/video-posting-tips-modal / b87ecb6578f58e650a793624cdafb3003cf217d9 | src/components/merchant/library-client.tsx; src/components/merchant/video-posting-tips-modal.tsx. Đây là modal mẹo tuần4 đã được đối chiếu ở lượt trước, không làm lại review. |
| PR48, tác giả QA DucHuy9725, OPEN | Feature/independent-audit-modal-tester3 / bcb22f848e785a76ad7c592d61b1287094168885 | Báo cáo/test độc lập modal cũ, không phải implementation FAQ/Offline tuần5. Danh sách đầy đủ10 file trong discovery.json. |

PR48 gồm: docs/qa/tester3-ui-audit-report.md; tests/independent-modal-ui-tester3.spec.ts; tests/qa-deliverables/independent-review-modal-tester3/bug-log-backend-api-static-modal.md; bug-log-frontend-static-modal.md; playwright.tester3.config.ts; review-notes-tester3-modal.md; screenshots/01-static-modal-desktop-view.png; screenshots/02-static-modal-mobile-view.png; screenshots/03-static-tracking-modal-desktop.png; tester3-ui-audit-checklist.csv (các tên rút gọn cùng thư mục tests/qa-deliverables/independent-review-modal-tester3).

Bằng chứng query, timestamp, PR/head/file list và tree không truncated: build/fe-w5-t3-review-20261102/discovery.json. Không fetch/checkout/merge/cherry-pick bất kỳ code nào vào worktree.

### Những gì cần Tester3 bàn giao

- PR URL hoặc branch/commit SHA có hai component; base ref, toàn bộ changed-file list và mọi CSS/import cần để render độc lập. Tên nhánh khác dự kiến cần được nêu rõ; không bỏ qua bàn giao chỉ vì khác tên.
- Cách dùng props ResellerFaqModal {isOpen,onClose}, OfflineBanner {isOffline?} và cách render cô lập, không cần sửa file cha/core/test/config của app.
- Logs lint/typecheck gắn đúng HEAD, ảnh/kịch bản đã tự kiểm. Không yêu cầu Tester3 sửa thư mục tests vốn bị cấm trong phạm vi được giao.
- Tham chiếu phiên bản UIUX/Figma/token dùng để đối chiếu nếu đã được bàn giao. UIUX_W5 hiện chỉ ghi nhiệm vụ UX-W5-02, không có URL Figma hoặc số padding/font/icon cụ thể. Năm FAQ đã có ở TESTER3_W5, không yêu cầu gửi lại toàn bộ nội dung đó.

### Checklist review sẵn sàng khi có source — tất cả chưa thực thi

Phạm vi/harness:
- [ ] Pin PR head SHA/base; lấy đầy đủ file list và đọc AGENTS/instructions áp dụng trên nhánh bàn giao. Không tự checkout đè/merge/cherry-pick; chỉ snapshot bytes nguyên trạng vào harness cô lập, không sửa code Tester3.
- [ ] Kiểm tra chỉ component/style độc lập đúng phạm vi; báo rõ nếu chạm app/layout/page/manifest/globals, config/proxy/package/tsconfig, tests/Playwright, API/Auth/DB hoặc tracking. Không có fetch, Supabase import, useRouter, đăng ký SW, telemetry hoặc side effect mạng.
- [ ] Harness chặn API, /r/, non-GET và external request trước mount; dùng props/static fixtures, không có session/credential hoặc thao tác tạo dữ liệu. Nếu cần server harness, dùng port/output riêng sau kiểm tra cổng, không đụng3195/3196.
- [ ] Chạy scoped lint và TypeScript trên snapshot/harness với dependency hiện có; ghi command/HEAD/exit, tách lỗi harness/nền với lỗi component, không hạ rule/assertion hoặc nâng/hạ dependency.

FAQ Modal:
- [ ] Props controlled, đóng/mở lặp lại, nút Đóng gọi onClose đúng; Escape, thao tác backdrop theo contract; closed state không còn tabbable.
- [ ] Accessible dialog name/heading; trạng thái accordion/summary thông báo được, icon trang trí không gây tên lặp, thứ tự đọc và focus dễ hiểu.
- [ ] Focus ban đầu hợp lý; Tab/Shift+Tab quay vòng thật bằng keyboard; trả focus trigger khi đóng; có fallback nếu trigger mất, cleanup khi unmount/isOpen đổi.
- [ ] Nền thực sự cô lập focus/pointer (native modal/inert tương đương), không chỉ aria-modal; khóa cuộn trong lúc mở, khôi phục trạng thái cuộn/overflow ban đầu khi đóng/unmount và không phá modal khác.
- [ ] Đủ5 FAQ, nội dung/typography khớp bản đã được BA/UIUX xác nhận. TESTER3_W5:77 nói ghi hoa hồng ngay khi thanh toán, :78 nêu100.000VNĐ, :79 nói link vĩnh viễn tới khi Merchant đóng; cần đối chiếu chính sách và khác biệt contract Wallet mục9 trước khi hiển thị như cam kết. Không đồng nhất tuổi link với cửa sổ attribution30ngày. Đây là điểm cần làm rõ ở spec, chưa phải finding code có thể tái hiện.
- [ ] Nội dung dài cuộn trong modal, controls chạm được/tối thiểu44px theo UI hiện tại, focus ring/contrast và reduced motion không mất khả năng sử dụng.

Offline Banner:
- [ ] Online/offline ban đầu, thay đổi mạng qua lại, đúng contract controlled/uncontrolled với true/false/undefined; SSR không đọc navigator sai hoặc sinh hydration mismatch.
- [ ] Đúng thông điệp, tông amber/icon theo UIUX; status/live region phù hợp, không chuyển focus hoặc thông báo lặp vô hạn.
- [ ] Listener online/offline đăng ký/cleanup đúng tham chiếu; mount/unmount/StrictMode không leak hoặc nhân đôi handler; không polling/fetch để dò mạng.
- [ ] navigator.onLine chỉ là tín hiệu kết nối, không phải xác nhận API/phiên/thanh toán thành công. Trở lại online không tự submit, replay queue, tạo link/đơn hoặc gửi lại chat.
- [ ] Không che CTA/Bottom Nav, không chặn pointer ngoài banner, safe area/visualViewport/keyboard và xoay màn hình; dùng hình học/keyboard lẫn ảnh để kết luận.

SW/PWA và hình ảnh:
- [ ] Không tạo cơ chế SW/cache/offline route trùng với registration hiện tại. SWv2 chỉ core offline/icons và CSS/font immutable bounded32; API/auth/tracking/RSC/actions/private HTML bypass. Banner không skipWaiting/clients.claim, ép reload hoặc tự retry ghi dữ liệu.
- [ ] Test320x844,390x844,768x1024,1440x900 và ngang844x390; mở FAQ và banner trong các trạng thái riêng/kết hợp, nội dung dài và safe area. Bottom Nav hiện dùng --reseller-nav-height88px + safe inset trên mobile; kiểm tra thực tế không hardcode vị trí dựa riêng vào một ảnh.
- [ ] Chụp và mở xem từng ảnh; ghi overflow, CTA/Bottom Nav overlap, focus, màu/chữ. Không coi có file ảnh là đã xem hoặc PASS.
- [ ] Findings phải có pinned SHA + file/line, bước tái hiện, expected/actual, mức ảnh hưởng và ảnh/log; không gửi comment/review/approval tự động.
- [ ] Tách kết quả review cô lập khỏi tích hợp toàn app (nhiều overlay, guard/session, bundle/SW) và Android/iOS thật. Chỉ cân nhắc tích hợp sau ủy quyền riêng, không suy 2 approvals đã có từ checklist.

### Trạng thái cuối lượt

Chưa có component HEAD/diff cho FAQ/Offline tuần5 để dựng harness, chạy lint/TypeScript/browser hoặc chụp/xem ảnh. Các mục đó là NOT_RUN/N/A do thiếu bàn giao; không ghi PASS và không làm thay. Không có finding runtime được xác nhận trong lượt này.

Chỉ cập nhật FE_W5 và phần FE của TEAM_WORK_LOG; không sửa TESTER3/UIUX hoặc source/config/env. Hai server vẫn chạy3195/PID3728 và3196/PID11496, không restart. FE-W5-04 tiếp tục WAITING_HANDOFF trong phần phụ thuộc, không đánh dấu hoàn thành/approval và không chặn tiến độ FE-W5-01/02.
---

## 12. Cập nhật kết luận bàn giao theo BE1/PM — 02/11/2026,22:15

### Căn cứ và phạm vi lượt cập nhật

Đã đọc trực tiếp E:/HKDN_126/week5-be1-fe-integration-qa.md, tiêu đề “GIẢI ĐÁP KỸ THUẬT & ĐỒNG BỘ CONTRACT FE — BE1 (SPRINT 5)”, người lập Nguyễn Minh Tuệ (BE1 Lead & PM), đề ngày22:15 Thứ Hai02/11/2026; tài liệu không ghi số phiên bản. SHA25666f76a89eaa4a92d65eaab62528146bd4143b2dfc8cc32c1da05b8f1c2dc407c. Ngày/giờ bàn giao được ghi theo tài liệu và ngữ cảnh client UTC+7, không lấy timezone của execution host.

Lượt này chỉ cập nhật FE_W5 và phần FE trong TEAM_WORK_LOG. Giữ branch feature/fe-w5-production-checkout-pwa-polish, HEAD4b0c977 và toàn bộ diff/source/tests/config/env hiện có. Không kiểm tra triển khai backend/cloud mới, không chạy test/build/Lighthouse hoặc restart server. Các ví dụ SQL/RPC/truy vấn orders và khuyến nghị Supabase local trong tài liệu là nội dung hướng dẫn, không phải ủy quyền thực thi.

### Quyết định contract đã chốt

- Mục1 của tài liệu BE: ưu tiên payment_url || booking_url. BE sẽ bổ sung trong src/lib/ai/chat.ts; BE chịu trách nhiệm kiểm valid_to >= now() và status='active', hết hạn/inactive trả suggested_checkout_url:null. Đây là cam kết/đầu việc BE, chưa phải bằng chứng đã có commit, deploy hoặc kiểm chứng trên cloud.
- FE tiếp tục lấy nguyên structured suggested_checkout_url từ POST /api/chat; không ghép URL hay tự fallback trong trình duyệt, không tự tính valid_to ở UI. Giữ HTTPS, allowlist/domain, attribution chính xác/không trùng, các validation hiện có; URL null/không hợp lệ thì không có CTA. Không bỏ guard để khớp ví dụ giản lược.
- Wallet đã chốt theo code/RPC hiện tại và wallet-service.ts, không sửa wallet-dashboard theo spec cũ. available_balance từ hoa hồng confirmed; pending_balance từ pending; paid_balance là đã chi trả; lifetime_earnings=available_balance+paid_balance. Giữ response đầy đủ, customer_name đã mask, Zod/owner/session guard và số tiền server trả.
- Các khác biệt Wallet từng nêu ở mục9 đã được BE1/PM giải quyết về mặt quyết định contract; không tiếp tục chờ chọn spec cũ hay code. Điều này không thay thế kiểm chứng API/DB triển khai, cũng không cho phép tự tăng số dư từ click.
- Các số p95/k6,21 migrations và trạng thái staging nêu trong tài liệu là thông tin BE cung cấp; lượt tài liệu này không tự xác nhận lại hoặc chuyển thành kết quả test mới của FE.

### FE-W5-02 — PM đã chấp nhận theo tiêu chí điều chỉnh

- Căn cứ mục4.2, Nguyễn Minh Tuệ/PM xác nhận nghiệm thu FE-W5-02: chấp nhận Performance trung vị>90 trên ba route mobile; không yêu cầu tiếp tục ép tổng JS xuống120KiB. Trạng thái task hiện tại DONE theo quyết định này, không phải tuyên bố ngưỡng JS gốc đã đạt.
- Giữ nguyên bảng mục10 và toàn bộ9 report của build BWmX6rdAgq6mcFDcV4IPt: trung vị94/94/95, min–max93–94/92–96/81–96, A95/95/100, BP100; giữ cả lượt login81. Không loại lượt thấp, không sửa số liệu/phương pháp và không coi mọi lượt đều>90.
- Kiểm kê initial modern gzip vẫn139.1/139.7/143.1KiB và vượt120KiB; JS transfer142.2/150.3/151.1KiB, giải nén462.5/481.5/479.2KiB là các phép đo riêng. First Load JS chưa có định nghĩa thống nhất như mục10; PM chấp nhận/điều chỉnh tiêu chí nghiệm thu, không thay số đo thành “tổng JS<120KiB”.
- Phép trừ vendor khoảng126KiB từ tổng139–143 trong tài liệu BE chỉ là ước lượng tổng hợp, không phải phân tích module chính xác. Không khẳng định13–17KiB là kích thước first-party được đo độc lập; không dùng phép trừ này thay module graph/ownership hoặc bỏ vendor khỏi phép đo để báo đạt.
- Khoảng126.1KiB là quan sát hai chunk trong build hiện có, không phải hằng số runtime bất biến. Không tiếp nhận nhận định “luôn bất biến/bất khả thi nếu không gỡ React” như kết luận kỹ thuật phổ quát; chunking/runtime vẫn có thể thay đổi và có thể còn tối ưu tùy trường hợp. Quyết định chấp nhận của PM được ghi riêng với các nhận định kỹ thuật đó.
- Không triển khai tối ưu bổ sung chỉ để đạt ngưỡng cũ. Dao động login, portal có session, realme C21Y/Chrome, Safari/iOS, cài đặt PWA và trải nghiệm thực tế vẫn là phần QA chưa được chứng minh; nghiệm thu task hiệu năng không bao phủ các phần này hoặc toàn bộ tuần5.
- Không đăng approval/review trên GitHub; chỉ ghi nhận xác nhận nghiệm thu của PM qua tài liệu bàn giao.

### Kiểm thử thủ công người dùng vừa xác nhận

- Nút ẩn/hiện mật khẩu hoạt động hai chiều.
- Liên kết Xem thử Dashboard mở được Dashboard mẫu.

Chỉ ghi nhận hai quan sát này, tách khỏi các kết quả tự động trước đó và không mở rộng thành nghiệm thu đăng nhập/portal có session, thanh toán E2E hoặc thiết bị thật.

### Checklist tích hợp FE-W5-01 — chuẩn bị, chưa thực thi lượt này

- [ ] Nhận commit/đầu ra bàn giao và bằng chứng test BE cho fallback/valid_to/status, đối chiếu đúng bản triển khai. Không đánh dấu đã triển khai chỉ từ câu “BE sẽ bổ sung”.
- [ ] Fixture payment_url hợp lệ và booking_url cùng có: URL do BE trả ưu tiên payment_url; payment_url thiếu/rỗng: BE dùng booking_url hợp lệ. Không ghép/sửa URL ở FE.
- [ ] Cả hai URL thiếu hoặc structured URL null/không hợp lệ: không CTA. Sản phẩm hết hạn hoặc status khác active: BE trả null, FE ẩn CTA. Các giá trị thời gian biên/null theo semantics BE bàn giao; FE không tự suy diễn hay tính ngày hết hạn.
- [ ] URL hợp lệ qua HTTPS/allowlist/domain và đủ ref/campaign/product đúng ngữ cảnh; chặn domain giả, attribution sai/trùng/mất, credentials/hash/query secret theo guard hiện có. Hiển thị domain, mở tab mới an toàn.
- [ ] Giữ pending/offline/hết phiên/chống bấm lặp/loại phản hồi muộn. checkout_clicked chỉ là click; redirect hoặc status=success không chứng minh đơn/tiền thành công, không tự retry hoặc cập nhật ví.
- [ ] Wallet mock/fixture theo JSON chuẩn mới và Zod hiện tại: balances/metrics/recent_commissions đầy đủ, tên đã mask, owner/session đúng, VND nguyên và tổng server trả. Không sửa theo sample rút gọn/spec cũ hoặc tự tính cộng hoa hồng.
- [ ] Phân biệt Wallet hiển thị đúng từ đơn mẫu do BE/QA chuẩn bị với thanh toán E2E thật. Tạo mẫu status=confirmed chỉ giả lập ghi nhận/hạch toán, không chứng minh khách đã trả tiền cho Merchant hay webhook/callback tin cậy đã chạy.
- [ ] Mục3.2 chỉ nêu GET /api/reseller/wallet và truy vấn orders trong DB; chưa cung cấp endpoint trạng thái đơn chuyên biệt cho FE với correlation/auth/response/error contract. Chờ bàn giao cơ chế xác minh theo đơn/booking trước khi có màn hình thành công; không thêm browser.from('orders') hoặc tự suy từ số dư tổng.
- [ ] Tài liệu đã mô tả Supabase Docker Local và Cloud Staging để QA; cần quy trình/tài khoản/phạm vi dữ liệu được phép dùng và bằng chứng môi trường tương ứng trước E2E. Không coi mô tả staging-ready là quyền tạo dữ liệu. Không tự đổi env sang local hoặc yêu cầu gửi credential vào chat.
- [ ] Không chạy SQL/RPC process_order_attribution, seed/migration, tạo đơn/thanh toán hoặc sửa cloud. Các ví dụ trong tài liệu không được thực thi trong lượt cập nhật này; tiếp tục fixture/mock cho phần kiểm chứng FE đã rõ khi được giao thực hiện.
- [ ] Ghi riêng kết quả redirect FE, test hạch toán/Wallet bằng mẫu và Merchant payment E2E. Không nghiệm thu FE-W5-01 khi thiếu bằng chứng tương ứng.

### Kết luận bàn giao hiện tại

FE-W5-02 được PM chấp nhận theo tiêu chí điều chỉnh, không còn yêu cầu tối ưu tiếp để ép tổng JS120KiB. FE-W5-01 vẫn IN_PROGRESS: contract Wallet đã chốt, còn chờ bàn giao/kiểm chứng BE URL và cơ chế xác nhận thanh toán theo đơn cùng quy trình test cô lập. FE-W5-03/UAT và FE-W5-04/bàn giao Tester3 giữ theo nhật ký trước, không được nghiệm thu bởi tài liệu này. Không đánh dấu cả tuần5 hoàn tất hoặc portal/thiết bị thật đã nghiệm thu.
---

## 13. FE-W5-04 — review thực thi PR #61 / Tester 3 — 04/11/2026 (UTC+7)

### Phiên bản và nguồn bàn giao

- Preflight: đã đọc AGENTS.md, FE_W5.md, TESTER3_W5.md, UIUX_W5.md (UX-W5-02), interface LOCKED và diff hiện tại. Worktree E:/THUCTAP/ai-travel-reseller-fe-w5; branch feature/fe-w5-production-checkout-pwa-polish; HEAD 4b0c977840ea06c9d5852fa02b2fef4fa5e082d7. Giữ toàn bộ thay đổi FE-W5-01/02, tuần4, source/tests/tsconfig/env/config local.
- GitHub HTTP GET xác minh PR https://github.com/NguyenMTue/ai-travel-reseller/pull/61 vẫn CLOSED, merged=false, merged_at=null. Branch đúng chữ hoa Feature/fe-t3-w5-standalone-ui; PR HEAD và HEAD branch đều 8f02a22ebf8813310c9e0f61520c0eab210c9bdf. Không có delta so với SHA người dùng cung cấp; không suy PR đóng là đã merge hoặc component bị loại.
- Base PR dev và merge-base cùng dd3dfe2a487170a987f1cf45e575c629f9565d90. Đã đọc toàn bộ patch compare base...head và danh sách PR files: đúng2 file added, +196/-0, không thiếu trang (<100 files).
- Toàn bộ file thay đổi: src/components/common/offline-banner.tsx (+22); src/components/reseller/reseller-faq-modal.tsx (+174).
- Rà đủ collection 61 PR all states,60 branch (<100), query tên reseller-faq-modal/offline-banner, metadata title/body/head/author và file lists PR57/58/59/60. Không tìm được PR component thay thế; PR59/Feature/qa-audit-tester3-w5 là báo cáo/test/ảnh QA, không thay hai source component. Branch/tree ở SHA có các artifact QA kế thừa; chúng không thuộc diff PR61 nên không gán là Tester3 sửa tests trái phạm vi.
- Tree recursive truncated=false: chỉ AGENTS.md gốc áp dụng cho hai file; AGENTS trong thư mục skill không áp dụng. Đã đọc AGENTS tại SHA và hướng dẫn Next server/client trong node_modules. UIUX_W5 có kế hoạch handoff nhưng chưa chứa link Figma/thông số số học chi tiết để kết luận pixel-perfect.

### Harness, tính nguyên bản và phạm vi

Artifact nằm ngoài worktree FE, tại E:/THUCTAP/ai-travel-reseller/build/fe-w4-worktree/build/fe-w5-t3-review-20261104. discovery.json lưu PR/base/patch/file lists/branch và metadata collection; originals.json lưu source nhận qua GitHub; source-hashes.json đối chiếu bytes snapshot:

| File | Git blob SHA1 khớp GitHub |
|---|---|
| offline-banner.tsx | 439d45e39ba2bd4bd8539fa3c9de4fc03bc64639 |
| reseller-faq-modal.tsx | 5fd6fc080fa838a25c54ffdb9a677b12fe3402c1 |
| use-dialog-viewport.ts (dependency tại cùng SHA) | 42f3e4a8ec2a62fc9fee14054208d47aca06552f |
| mobile-dialog.module.css (dependency tại cùng SHA) | 4fa6404c312ea5cafcba5d5c4523f9a0b07124c9 |

Không sửa component để test pass. Harness React19 dùng Webpack đóng gói độc lập, TypeScript transpilation và mapping CSS module surface; giữ nguyên CSS khai báo gốc, Tailwind4/globals token của FE và10 biến thể font local như app/layout (đã xác minh Be Vietnam Pro loaded). Không chạy Next app/RSC/hydration/full production build ở lượt review này; mapping class trong harness không thay thế kiểm chứng pipeline Next sau tích hợp.

Host tĩnh có trigger, CTA header, nội dung dài và Bottom Nav fixture cao88px. Chặn request ngoài origin/các API, /r/ và non-GET trước khi mount; browser suite cuối chỉ tải3 tài nguyên local HTML/CSS/JS, font nhúng từ dependency local. Không env/session/auth/AI/Tracking/đơn/thanh toán/DB/service worker trong harness. Adapter online/offline là code host fixture riêng, không thêm vào source Tester3.

### Kết quả thực thi và ảnh

- Node24.16.0, React19.2.8, Playwright1.64.0, Chrome156.0.8078.80 headless Windows, TypeScript5.9.3, ESLint9.39.5; không cài hoặc đổi dependency.
- node build.cjs: PASS bundle harness; node fonts.cjs nhúng đúng font local. Đây không phải build production FE.
- Scoped TypeScript: node E:/THUCTAP/ai-travel-reseller/node_modules/typescript/bin/tsc --project tsconfig.json --pretty false, cwd artifact: exit0. tsconfig của harness gồm source snapshot/hook và host, strict/noEmit; không dùng kết quả này để tuyên bố toàn app hoặc nhánh remote typecheck đạt.
- Scoped ESLint: node E:/THUCTAP/ai-travel-reseller/node_modules/eslint/bin/eslint.js --debug snapshot/src/components/common/offline-banner.tsx snapshot/src/components/reseller/reseller-faq-modal.tsx --max-warnings 0: exit0, không ESLint error/warning, dùng nguyên config repo, không --fix/tắt rule. Có thông báo của plugin Next về harness không có Pages directory, tách khỏi diagnostic source; không ghi full npm run lint toàn repo đã đạt.
- browser.cjs cuối:76 assertions đạt (browser-results.json, browser-final.log). supplementary.cjs: mở shell offline bằng local route fulfillment đạt;2 expected-behavior probes tái hiện FAQ-01 và BANNER-01 bên dưới. Vì có findings, không diễn giải76 assertions thành tất cả component PASS.
- Công cụ lúc đầu gặp đường dẫn bin/Node không đúng, Git ownership/sandbox, server chưa chạy gây ERR_CONNECTION_REFUSED; đã xử lý trong harness, chạy lại logs cuối. Không đổi git safe.directory/env/config FE. Giữ logs lỗi ban đầu riêng, không coi chúng là lỗi component. Tiến trình browser/lint lỗi ban đầu được dọn sau kiểm tra, không dùng PID server FE cũ.
- Đã chụp và mở xem18 ảnh cuối: mỗi viewport320x844,390x844,768x1024,1440x900,667x375 có offline / FAQ mở cả5 câu trả lời ở đầu / cuối vùng cuộn (15 ảnh); thêm online-initial, initial-offline và finding-banner-header-hit. File screenshots/*.png; ảnh trước khi nạp font đã được chụp lại, kết luận dựa trên bản cuối.
- FAQ ở320/390 và ngang: nội dung dài cuộn trong dialog, nút X ở đầu và nút Đóng ở cuối vẫn dùng được; không tràn ngang; cả5 đáp án được mở/kiểm tra, hình học dialog trong viewport. Không yêu cầu X luôn sticky vì nút Đóng cuối vẫn truy cập được.
- Banner không đè Bottom Nav fixture: diện tích giao0 ở cả5 viewport; không tràn ngang. Tuy nhiên che CTA header theo BANNER-01. Đây là hình học của bố cục thử, chưa xác minh header/Bottom Nav app có session hoặc safe area thật.

### FAQ Modal — phần đạt, finding và kết luận

Nội dung đủ5 câu/đáp án,100.000VNĐ, TikTok9:16 và props isOpen/onClose khớp TESTER3_W5. Native dialog có accessible name/description; Escape, nút X và Đóng, Tab qua5 summary rồi vòng về X, Shift+Tab vòng về Đóng đều hoạt động. showModal cô lập background focus/pointer; body/html scroll lock và trả focus trigger đúng khi đóng; unmount đang mở khôi phục overflow clip/scroll đã có. Bấm accordion không làm mất trap. Mở/đóng lặp ở5 viewport đạt.

**FAQ-01 — P2, đề nghị sửa trước tích hợp:** tại SHA8f02a22, src/components/reseller/reseller-faq-modal.tsx:109–111, handler onClick chỉ kiểm event.target===event.currentTarget.
- Tái hiện: viewport390x844, bấm Open FAQ, bấm padding bên trái bên trong hình chữ nhật dialog (tọa độ x21,y422 trong fixture). Hit-test trả DIALOG và điểm nằm trong bounds.
- Mong đợi: click phần padding nội bộ giữ modal mở; chỉ nút đóng/Escape/backdrop thực sự mới dismiss.
- Thực tế: onClose chạy, dialog.open chuyển false dù chưa bấm ra ngoài. Chạm nhầm vùng trống trên điện thoại có thể đóng FAQ đang đọc.
- Hướng sửa giao Tester3: phân biệt tọa độ click ngoài bounding rect hoặc dùng lớp content/backdrop riêng; giữ native modal/focus/scroll cleanup. FE không sửa source bàn giao ở lượt review.
- Bằng chứng: supplementary-results.json finding FAQ-01 (before.hit=DIALOG, actualOpen=false); ảnh FAQ cùng viewport và source pin SHA.

Copy nghiệp vụ khớp spec được giao, chưa đồng nghĩa đã được BE/BA xác nhận là cam kết hiện hành: “ngay khi thanh toán” và “vĩnh viễn” cần đối chiếu Wallet đã chốt theo code/RPC, valid_to/status/campaign và attribution. Đây là việc chốt nội dung PM/BA/BE trước phát hành, không gán Tester3 làm sai spec hoặc tự sửa backend.

Kết luận riêng FAQ: còn FAQ-01 cần Tester3 sửa và FE kiểm lại SHA mới; các hành vi keyboard/modal chính đạt trong Chrome harness. Chưa sẵn sàng kết luận tích hợp hoàn tất.

### Offline Banner — phần đạt, finding và kết luận

Component chọn contract controlled isOffline?:boolean; default=false. true hiển thị đúng1 thông báo amber/icon WifiOff trang trí aria-hidden; false/undefined ẩn. Không đọc navigator, không effect/listener/fetch: bản thân component có0 listener trước/sau8 vòng mount/unmount. Việc không tự hiện khi navigator offline mà không truyền prop là giới hạn có chủ đích của lựa chọn contract hợp lệ, không phải lỗi thiếu listener.

Host adapter cập nhật prop theo navigator.onLine và online/offline: online ban đầu ẩn;3 vòng online→offline→online đúng, không trùng; mount lại trong khi mạng offline hiện đúng. Mở document fixture ngay khi context offline dùng local route fulfillment cho shell HTML/CSS/JS cũng hiện; không tuyên bố cold network offline có thể tải app chưa cache. Khi ngắt adapter, listener về0. Không có retry, submit, queue hoặc request khi trở online.

Accessible tree expose đúng nội dung role=alert và aria-live=polite; không giành focus. Chưa dùng NVDA/VoiceOver/TalkBack nên **âm thanh thông báo thực tế NOT_RUN**, không ghi PASS trình đọc màn hình thật.

**BANNER-01 — P2, điều kiện bố cục cần xử lý trước gắn app:** tại SHA8f02a22, src/components/common/offline-banner.tsx:14, fixed top-4/right-4 z-50 (sm:top-6/right-6), không dành chỗ cho header.
- Tái hiện: fixture header có CTA ở góc phải, isOffline=true;320/390/768/1440 và667ngang đều giao vùng CTA. 390px: banner x16,y16,w358,h50; CTA x257.98,y20,w112.02,h64.19, giao khoảng5152.72px².
- Mong đợi: người dùng đọc cảnh báo và vẫn thao tác CTA; không phủ nút thiết yếu.
- Thực tế: click x313.99,y30 hit SPAN trong alert, CTA không nhận click (counter vẫn0). Ảnh finding-banner-header-hit.png và5 ảnh offline thể hiện che nút. Bottom Nav fixture không bị che.
- Đây là xung đột tái hiện ở host thử do placement cố định của component, **chưa phải bằng chứng app production đang bị che CTA**. Trước tích hợp FE/UIUX cần chọn vùng dành riêng hoặc cơ chế offset/placement có thống nhất với Tester3; không tự đổi contract hoặc nguồn Tester3 trong lượt này.

Góp ý tùy chọn P3: thống nhất role=status/aria-live=polite hoặc chính sách alert phù hợp; hiện kết hợp role=alert với explicit polite cần nghe thử trên screen reader. Không khẳng định markup hiện tại vô hiệu hoặc kết luận lỗi phát âm chưa kiểm.

Kết luận riêng Banner: có thể chuẩn bị tích hợp theo contract controlled, FE phải cung cấp trạng thái mạng từ một nguồn và giải quyết BANNER-01 trước đưa vào bố cục thật; không yêu cầu Tester3 tự thêm network listener chỉ để pass. Chưa tích hợp/approval.

### SW/PWA, giới hạn và bước tiếp theo

Đã audit src/components/pwa/registration.tsx và public/sw.js hiện có: đăng ký production một SW, không ép activation/reload; bypass non-GET, external, API/auth/tracking, RSC/actions; cache public offline/icons và CSS/font bounded32. Hai component không đăng ký SW, không cache, không replay thao tác ghi; không phát hiện cơ chế trùng ở mức source. Harness tắt service worker nên coexistence/cache/update/offline navigation toàn app **NOT_RUN**.

Giới hạn: chưa app có session, nhiều modal đồng thời/trigger bị xóa, native mobile keyboard/visualViewport thật, notch/safe-area thật, realme C21Y, Safari/iOS, screen reader phát tiếng; chưa đối chiếu Figma chi tiết do chưa có URL/thông số trong nguồn đã đọc. Không chạy Lighthouse hoặc production app build vì chưa thay bundle FE; kết quả FE-W5-02 và các giới hạn mục12 giữ nguyên.

PR61 còn closed/unmerged và metadata mergeable_state=dirty tại lúc GET; đây là trạng thái GitHub cần chủ nhánh/PM xử lý base/conflict và bàn giao PR mở thích hợp sau sửa, không tự rebase/merge từ lượt review. SHA review không thay đổi; chưa có2 approvals. Review kỹ thuật cô lập này không phải approval chính thức.

FE-W5-04 giữ IN_PROGRESS/REVIEWED_ISOLATED, chờ sửa FAQ-01, chốt vị trí banner/copy và bàn giao PR/HEAD mới rồi kiểm lại. Không đánh dấu đã tích hợp, nghiệm thu thiết bị thật hoặc hoàn thành task/toàn tuần. Nguyên tắc Zero Blocker vẫn áp dụng cho FE-W5-01/02/phát hành chính.

URL kiểm tra: http://127.0.0.1:3211 — Open FAQ, dùng Tab/Shift+Tab/Escape, mở5 accordion/cuộn tới Đóng; Toggle offline prop để xem banner và CTA header. Đây là fixture cô lập; không truy cập portal hoặc API ghi dữ liệu. Trước/sau không có listener3195/3196; không khởi động/dừng chúng. Harness3211/PID916 được giữ để người dùng kiểm tra.

Tin nhắn nháp cho Tuấn (chưa gửi):
> T review PR61 ở SHA8f02a22 rồi m. FAQ keyboard/focus/scroll ổn, nhưng bấm padding trong hộp cũng đóng vì handler chỉ so target===currentTarget; m sửa để chỉ dismiss khi click backdrop thật nhé. Banner đúng contract truyền isOffline, nhưng fixed góc trên che CTA header trong harness; m phối hợp t/Bửu chốt vị trí hoặc offset trước tích hợp. M bàn giao lại HEAD mới và PR mở phù hợp giúp t; PR61 hiện đóng chưa merge. T chưa đăng approval.

---

## 14. Bàn giao commit/push FE-W5-01/02 — 05/11/2026 (Asia/Bangkok)

### Phạm vi và trạng thái

- Bàn giao lên nhánh riêng feature/fe-w5-production-checkout-pwa-polish của origin https://github.com/NguyenMTue/ai-travel-reseller.git, không merge vào dev/không tạo PR trong lượt này. Preflight HEAD4b0c977840ea06c9d5852fa02b2fef4fa5e082d7; upstream cũ là origin/dev, nhánh FE chưa tồn tại trên remote khi kiểm tra. Sau push phải đối chiếu HEAD với refs/heads/feature/fe-w5-production-checkout-pwa-polish và đặt upstream đúng nhánh FE.
- Được fetch riêng origin/dev; kết quả30ce2e27f02724d7fa430137bd63a0fa7d9dda2a, merge-base89c9d4f9e71f74c960f296705cc9af26bbddd27b. Nhánh FE có3 commit riêng trước lượt này, dev có60 commit chưa ở FE. Không pull/merge/rebase/cherry-pick/reset/clean hoặc đổi nhánh.
- Giữ lịch sử checkpoint44d02ca (checkout),28afb5f (production polish) và merge4b0c977 nhận dev sau PR54. Week4/df2147e đã là ancestor của origin/dev; không tạo lại commit tuần4. Diff PR dùng origin/dev...HEAD từ merge-base, không dùng diff hai đầu để biến thay đổi mới của dev thành phần xóa của FE.
- FE-W5-01 vẫn IN_PROGRESS: structured suggested_checkout_url, HTTPS/exact domain/attribution validation, hiển thị domain và tab mới an toàn, pending/offline/session/dedup/late reply cùng fixture đã triển khai. Không coi checkout_clicked hoặc redirect là thanh toán thành công, không cập nhật ví hoặc dựng success screen từ query.
- FE-W5-02 DONE theo quyết định BE1/PM02/11/2026,22:15 tại mục12, không phải tổng JS đạt dưới120KiB. Giữ nguyên mọi số đo và giới hạn mục10, gồm login81. Không nghiệm thu toàn tuần, portal có session hoặc điện thoại thật.
- Bao gồm tối ưu import AuthForm/ChatPanel, demo prefetch theo thao tác, analytics init/lazy SDK giữ funnel/privacy, ảnh LCP, SWv2 cache public bounded32 và test/fixture nguồn có chủ đích. Không đưa FAQ/Offline Banner vào app. Mục13 FE-W5-04 giữ REVIEWED_ISOLATED/IN_PROGRESS, chưa approval hay tích hợp.

### Rà soát nội dung và chọn stage

- Đã đọc diff chưa commit và toàn bộ phạm vi PR22file dự kiến (kể cả tests/checkout-card.test.ts mới), cùng hai checkpoint/merge riêng sắp push. Danh sách file/history/credential-pattern audit lưu ngoài worktree FE; không thấy env/credential theo mẫu, log/ảnh/output/build/harness/backup trong phạm vi bàn giao. Không khẳng định regex scan thay thế bảo đảm tuyệt đối; source và staged diff được rà riêng.
- .env.local tồn tại, ignored, không tracked; không sửa/sao chép/in giá trị. Giữ config local, package/dependency và backend/DB/RLS.
- tsconfig.json không stage: toàn bộ diff hiện tại chỉ thêm include types/dev-types của12 output local tuần5; compilerOptions/exclude/source include không đổi. Giữ nguyên hunk đó trong working tree, không revert cả file. Không stage generated tsbuildinfo/next-env/output.
- Sửa mới duy nhất ngoài tài liệu: tests/pwa-production-browser.mjs lấy PWA_EVIDENCE_DIR hoặc build/fe-w5-pwa-evidence thay đường dẫn output tuyệt đối E:/THUCTAP/...; giữ fixture worker v1 pin7ced50a đã có và toàn bộ assertions. Đây là cấu hình output của test, không phải thay env file hoặc source/runtime app.
- Stage11file cụ thể: FE_W5.md, TEAM_WORK_LOG.md, app/preview/chat/preview.tsx, src/components/auth/auth-form.tsx, src/components/chat/chat-panel.tsx, src/lib/chat/checkout.ts, tests/checkout-browser.mjs, tests/checkout.test.ts, tests/checkout-card.test.ts, tests/fixtures/chat.ts, tests/pwa-production-browser.mjs. Không dùng git add .; không amend checkpoint hoặc viết lại merge.
- TEAM_WORK_LOG chỉ thêm phần FE; không sửa trạng thái/công việc của BE/Tester3/QA/PM. Các bản ghi lịch sử được giữ với ngày gốc, trạng thái hiện tại của FE-W5-01/02 theo mục12/14.

### Bằng chứng mới và tái sử dụng

Artifact mới ngoài Git: E:/THUCTAP/ai-travel-reseller/build/fe-w4-worktree/build/fe-w5-handoff-20261105; audit.json, history-audit.json, baseline.json, unit.log, chat-transport.log, typecheck.log, scoped-lint.log, full-lint.json, lint-summary.json, pwa-browser.log, pwa-lint.log, draft-pr.md. Không đưa các output/log/screenshot/profile/harness vào commit.

- Unit/mock mới:16/16 ở tests/checkout.test.ts, checkout-card.test.ts, analytics-client.test.ts, pwa-worker.test.mjs; thêm chat-transport.test.ts2/2. Tổng18/18, không gọi AI/API thật/DB. Không loại assertion hoặc tự retry thao tác ghi.
- TypeScript toàn worktree: tsc --noEmit --incremental false --pretty false exit0, dùng tsconfig local hiện có. Hunk local không đổi compilerOptions và không bỏ source; không đánh đồng với kiểm chứng bản tích hợp60commit dev mới.
- Scoped ESLint19file runtime/test FE tuần5: --max-warnings 0, exit0; test PWA sau đổi output được lint lại exit0. Không tắt rule/--fix, không sửa backend.
- Full lint hiện tại: eslint . --format json, exit1, **15errors/8warnings tại10file**. Đã đối chiếu nội dung từng file (chuẩn hóa CRLF/LF) với HEAD, merge-base89c9d4f và origin/dev30ce2e2: cả10file không đổi ở cả3 nguồn, không chỉ mặc định là lỗi nền. Không ghi full lint PASS.
- File lỗi/cảnh báo: app/api/merchant/campaigns/route.ts (2errors), app/api/merchant/video/generate/route.ts (2errors), scripts/render-remediated-pipeline.mjs (1warning), src/lib/database.types.ts (1parsing error/binary), src/lib/merchant/video-generate-schema.ts (2warnings), src/lib/merchant/video-generate-service.ts (3errors), src/lib/supabase/middleware.ts (2warnings), tests/commerce-attribution.test.ts (1warning), tests/merchant-campaign-form.spec.ts (1warning), tests/merchant-video-generate-api.test.ts (7errors/1warning). Chi tiết rule/line và đối chiếu trong lint-summary.json; không sửa các file đó.
- Tái sử dụng build Webpack BWmX6rdAgq6mcFDcV4IPt tại build/fe-w5-budget-complete-20261102:13 hash runtime/config và29 mục chunk của inventory khớp hiện tại, BUILD_ID khớp. HEAD build vẫn4b0c977; các diff chưa commit được nhận diện bằng hash, không dùng HEAD đơn độc. Không rebuild chỉ vì đổi tài liệu/đường dẫn output của test.
- Browser checkout BE1/attribution/dedup/offline/session/4viewport, auth toggle/demo navigation và regression tuần4/PWA trước đó được tái sử dụng trên cùng source/runtime/config đã đối chiếu; không ghi chúng là lượt chạy mới.
- Sau sửa output test PWA, đã chạy lại trên build đã xác minh tại cổng riêng3212: PASS worker v1→v2 waiting/activation, giữ cache ứng dụng khác, manifest/icons/installability/scope/headers, public static cache, portal guard và offline/online; không API/tracking/external request. Scoped lint file sửa exit0. Server3212 được xác minh PID trước khi dọn; không dừng3195/3196 hoặc worktree khác.
- Lighthouse giữ nguyên bộ9 report13.0.1/Chrome156, mobile412x823 DPR1.75, simulated RTT150ms/CPU4x,3 lượt lạnh mỗi route: P94(93–94)/94(92–96)/95(81–96), A95/95/100, BP100. Initial modern gzip139.1/139.7/143.1KiB vẫn vượt120; transfer142.2/150.3/151.1KiB, decoded462.5/481.5/479.2KiB là các phép tính riêng. Không đo lại hoặc sửa bảng chỉ vì commit/test output; nếu source/bundle thay đổi sau đồng bộ dev thì cần đánh giá/đo lại.
- Trước commit kiểm tra git diff --check, staged diff/check, danh sách file và pattern credential; sau push kiểm tra SHA remote/upstream/status. SHA thực tế và kết quả push báo cuối lượt, không ghi push thành công trước khi thực hiện.

### Phụ thuộc còn lại

- BE: đối chiếu/kiểm chứng trong bản tích hợp mới fallback payment_url||booking_url, valid_to/status/null và attribution contract đã chốt; không coi lời hứa hoặc source mới trên dev là bằng chứng FE branch hiện tại đã tích hợp/chạy. Chờ cơ chế xác nhận trạng thái thanh toán theo từng đơn/correlation dành cho FE và quy trình sandbox/quyền test. Wallet giữ mapping code/RPC đã chốt, không yêu cầu lại lựa chọn spec.
- Tester3: mục13 cần sửa FAQ-01 và chốt placement banner/copy, bàn giao PR/HEAD phù hợp để review lại; không có component T3 trong branch FE ở lượt này và không có approval.
- BA/QA: Final UAT/portal có session, thiết bị thật realme C21Y/Safari/PWA, xác nhận copy nghiệp vụ và kiểm thử thanh toán E2E trong môi trường được phép. Đơn mẫu/Wallet và fixture redirect không phải thanh toán thật.
- Git/PR: dev đã đi thêm60commit; reviewer cần xét nền mới, khả năng conflict và các contract BE mới trước tích hợp. Không tự ghép lịch sử trong lượt bàn giao. Nhánh riêng có thể push để review mà không khẳng định sẵn sàng merge/dev hoặc full lint repo sạch.

---

## 15. Đồng bộ origin/dev vào FE tuần5 — 05/11/2026 (Asia/Bangkok)

### Nền Git, bảo toàn và conflict

- Preflight đúng E:/THUCTAP/ai-travel-reseller-fe-w5, branch feature/fe-w5-production-checkout-pwa-polish, HEAD/upstream remote FE cùng924a7e76c8b9ee5072eb18f68e1f665fe7940c01. Không merge/rebase dở. Fetch chỉ dev và nhánh FE; dev30ce2e27f02724d7fa430137bd63a0fa7d9dda2a, merge-base89c9d4f9e71f74c960f296705cc9af26bbddd27b, chênh4commit FE/60commit dev; remote FE không có commit lạ.
- Recovery ref backup/fe-w5-pre-dev-20261105-924a7e7 và backup ngoài repository tại E:/THUCTAP/fe-w5-recovery/sync-20261105-924a7e7. Đã đối chiếu hash bản backup tsconfig và local.patch trước merge. Không sao chép env, chỉ đối chiếu hash kín; .env.local không đổi/không tracked.
- Merge thường origin/dev vào FE với --no-commit/--no-ff, không rebase/cherry-pick/reset/clean/force. Duy nhất conflict .ai/process/Week5/TEAM_WORK_LOG.md ở mục3: giữ mục QA mới từ dev và dòng FE có bằng chứng từ nhánh FE; không lấy nguyên ours/theirs. Phần còn lại ghép tự động.
- Giữ toàn bộ9 section lịch sử FE và tất cả dòng nội dung dev ngoài dòng trạng thái FE đã cập nhật; xác minh chuẩn hóa CRLF/LF, không thay log/DoD của thành viên khác. Giữ FE_W5 mục1–14 và các số đo cũ.
- tsconfig không cản merge, không cần tạm hoàn nguyên hay áp cả backup. Tất cả include local cũ còn nguyên; Next thêm4 include types/dev-types cho hai output sync production/preview. Không stage tsconfig, generated types, log/ảnh/build/harness/backup.
- Các .env.example, Supabase config/migration, QA assets, backend/package/vercel.json là tracked update đã có từ dev, giữ nguyên khi merge; không sửa tay credential/env/backend/DB/RLS, không chạy migration/seed/RPC hoặc script production/cloud. Delta riêng FE so với dev ở backend/config này bằng0.

### Thay đổi dev đã nhận và contract còn lại

- BE1 có code fallback payment_url||booking_url trong src/lib/ai/checkout-url.ts; chat loader đọc valid_to/status và trả checkout null nếu expired/inactive. BE2 có gateway/grounding và audit log trong route chat. FE tiếp tục chỉ dùng suggested_checkout_url, giữ HTTPS/exact allowlist/attribution, không tự ghép/fallback trong UI hoặc suy payment success.
- Test FE mới kiểm helper payment ưu tiên/booking fallback/both null và HTTP fallback vẫn bị FE chặn. Đây là pure unit, không dùng cloud. Không chạy test:be1:w5 vì script đó truy vấn Supabase cloud; không biến bộ test này thành mock hoặc ghi PASS thay BE.
- Cần BE chốt/kiểm chứng semantics còn lại: code !status coi null/thiếu status là active; valid_to parse không hợp lệ không bị so sánh là expired. Không tự sửa backend theo suy đoán, không xác nhận hạn dùng triển khai cloud chỉ từ đọc code. Chưa thấy endpoint order/payment/booking-status cho FE trong app/api; Wallet có endpoint riêng, không dùng tổng số dư làm trạng thái theo đơn.
- Dev đã có source ResellerFaqModal/OfflineBanner, Git blob tương ứng439d45e39ba2bd4bd8539fa3c9de4fc03bc64639/5fd6fc080fa838a25c54ffdb9a677b12fe3402c1 (banner/FAQ): cùng bản8f02a22 đã review ở mục13, chưa có sửa FAQ-01/placement banner. Không import hai component vào app; FE-W5-04 vẫn IN_PROGRESS/REVIEWED_ISOLATED, chưa approval hoặc hoàn tất tích hợp. Trạng thái QA trong log dev là báo cáo của QA, không thay kết luận FE.
- Merchant Library từ dev có thêm nút/modal mẹo đăng video. Giữ cập nhật này cùng Content Kit/modal/player tuần4; không nhân đôi listener/SDK/SW hoặc bỏ tính năng mới để làm test cũ pass.

### Sửa test tích hợp và bằng chứng

Runtime app/guard không chỉnh thêm sau merge. Chỉ sửa3 test FE:
1. tests/checkout.test.ts thêm test helper fallback của BE và guard FE.
2. tests/checkout-browser.mjs xác nhận hydration bằng bấm Đổi phiên/đợi UI Phiên2 trước chọn controlled scenario; sửa điều kiện runner trước đó có thể thao tác select SSR khi handler chưa gắn. Không bỏ kiểm tra URL, attribution, dedup/offline/session/late reply.
3. tests/video-posting-tips-browser.mjs thay kỳ vọng cũ Merchant không có nút bằng assert đúng1 nút, mở/đóng/focus và4 mục mẹo; vẫn kiểm modal quy chuẩn3mục riêng. Lỗi test cũ tái hiện do Merchant UI mới từ dev; không sửa component về giao diện cũ.

Kết quả cuối:
- Unit/mock19/19 PASS (checkout/domain/attribution/fallback, CTA analytics, transport, analytics SDK và SW privacy/cache). Không gọi AI/Tracking/đơn/thanh toán/cloud DB.
- TypeScript noEmit/incremental false PASS trước build và sau cập nhật test; scoped lint FE19file/tích hợp PASS,3test sửa được lint lại --max-warnings0 PASS. Không tắt rule/assertion/typecheck.
- Production Webpack PASS,32route; output riêng build/fe-w5-sync-20261105, BUILD_ID JsX6hVGC_Ym2QUk-4QupY. Production chạy cổng3214; auth smoke PASS toggle2chiều, next/role/field/class và mismatch chặn cục bộ, không gửi auth request; PWA production PASS manifest/icons/scope/headers/v1→v2 waiting-activation/cache/offline-online, không API/tracking/external.
- Các route preview có guard NODE_ENV=development. Lượt đầu runner dùng production gặp404/fixture unavailable, không ghi PASS hoặc coi là regression runtime; guard khớp FE trước merge và không bị bỏ. Đã chạy lại đúng dev Webpack3215, output riêng build/fe-w5-sync-preview-20261105.
- Fixture browser cuối PASS checkout/Bottom Sheet320/390/768/1440; video player/download/hash/range/error/focus/cleanup320/390/768/1440; modal mẹo320/390/768/1440/ngang667, Tab/ShiftTab/Escape/scroll/visualViewport/listener cleanup; touch/safe area/keyboard mô phỏng và video GET+HEAD404/rewrite. Merchant tips và guidelines riêng biệt đạt. Không bấm tạo Tracking; video response là fixture fulfill, không gọi AI/service thật. Ảnh checkout390 đã mở xem, không coi desktop emulation là điện thoại thật.
- Full lint exit1:15errors/13warnings tại15file. Mọi file có diagnostic khớp origin/dev;15errors/8warnings đã tồn tại trên FE trước merge;5warnings thêm do5file mới từ dev (monitor-uat-chat-logs, be2-w5-ai-gateway.test, demo-rehearsal, k6-load-test, security_test_runner). Không sửa backend/QA hoặc ghi full lint PASS.
- git diff --check working PASS; staged FE delta so với origin/dev PASS. Staged merge so với HEAD exit2 có298diagnostic whitespace, đối chiếu baseline89c9d4f→origin/dev cũng298 và không có diagnostic thêm. Không tắt whitespace rule hoặc sửa hàng loạt tài liệu người khác để làm sạch số liệu. Không còn unmerged/conflict marker.

### Lighthouse hồi quy mới — tách khỏi nghiệm thu bản trước

Chạy9lượt lạnh với Chrome profile riêng mỗi lượt, cùng Lighthouse13.0.1/configSettings như mục10 (so sánh JSON bằng nhau): mobile412x823 DPR1.75, simulate RTT150ms/CPU4x. Không build/test nặng đồng thời; dev fixture3215 đã dừng sau xác minh listener/CLI trước đo. Khác biệt: merge source/build mới, server3214 thay3196, Chrome156.0.8078.80 thay bản156.0.8078.74 trước. Đây là browser lạnh, không reset cache/server CPU giữa các lượt. Nguồn/build/hash và9HTML/JSON lưu ngoài repo, không áp điểm cũ lên build mới.

| Route | P median(min–max) | A median(min–max) | BP median(min–max) | JS transfer KiB median | JS decoded KiB median | Initial modern gzip KiB |
|---|---|---|---|---|---|---|
| / | 94 (84–94) | 95 (95–95) | 100 (100–100) | 142.2 | 462.5 | 139.1 |
| /chat | 96 (93–96) | 95 (95–95) | 100 (100–100) | 150.3 | 481.5 | 139.7 |
| /login | 96 (96–97) | 100 (100–100) | 100 (100–100) | 151.1 | 479.2 | 143.1 |

JS transfer là Lighthouse resource-summary Script transferSize; decoded là tổng Script resourceSize minified giải nén; initial modern gzip là tổng gzip từng unique initial HTML script, loại nomodule có điều kiện. Không gọi các số này là Next First Load JS hoặc bỏ vendor để báo đạt120KiB. Dung lượng JS transfer/decoded ổn định trong3lượt từng route; bảng ghi min–max điểm và median bytes. Initial modern gzip vẫn vượt120KiB.

Giữ home84 ở bộ mới và login81 ở bộ lịch sử mục10; không bỏ lượt thấp hoặc quy toàn bộ chênh lệch score cho merge. FE-W5-02 giữ DONE theo PM nghiệm thu bản trước và tiêu chí điều chỉnh, không tự tạo approval/đổi tiêu chí cho bản này. Portal có session/realme C21Y/Safari/PWA trên thiết bị thật còn riêng.

### Trạng thái bàn giao

FE-W5-01 vẫn IN_PROGRESS: code BE mới và fixture không chứng minh thanh toán end-to-end; còn endpoint trạng thái theo đơn/correlation, semantics valid_to/status và sandbox/quyền QA. Wallet giữ contract đã chốt. FE-W5-03 chờ BA/QA UAT, FE-W5-04 giữ giới hạn mục13. Không nghiệm thu toàn tuần.

Artifacts/backup/bằng chứng: E:/THUCTAP/fe-w5-recovery/sync-20261105-924a7e7 (backup.json/local.patch, build/typecheck/unit/lint/browser logs, merge-audit, diff-check-summary, results-summary và lighthouse/*). Chỉ tài liệu FE/test sửa nằm ngoài phần merge nguyên trạng từ dev. SHA merge/push được xác minh sau commit và báo cuối lượt; không tạo PR/approval hoặc merge ngược vào dev.
