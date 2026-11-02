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
| **FE-W5-02** | Tối ưu Production Build Next.js & PWA Lighthouse Score $\ge 90$ | **P1** | `IN_PROGRESS` | Next.js config | FE Lead | Bundle tối ưu, PWA cài đặt 1-chạm không lỗi | 04/11 12:00 |
| **FE-W5-03** | Trực chiến Fix Bug Giao diện trong phiên Final E2E UAT | **P0** | `READY` | Bug reports BA | FE Lead | 100% UI bugs resolved trước Go-Live | 05/11 12:00 |
| **FE-W5-04** | Review cấp 1 & Hỗ trợ tích hợp an toàn component của Tester 3 | **P2** | `READY` | PR Tester 3 | FE Lead | Review comments, Approval 1 & Safe integration | 04/11 17:00 |

---

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
| FE-W5-04 | PR từ Tester 3 | Tester 3 (Tuấn) | `WAITING` |

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
| FE-W5-04 | Checklist review và tích hợp FAQ Modal/Offline Banner đúng phạm vi | 04/11 17:00 | Tester 3 PR, specs UI/UX/BA | WAITING: chưa có remote branch/PR được tìm thấy | Nhận bàn giao, kiểm tra props/a11y/diff; chưa đăng approval hoặc merge |
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