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
| **FE-W5-02** | Tối ưu Production Build Next.js & PWA Lighthouse Score $\ge 90$ | **P1** | `READY` | Next.js config | FE Lead | Bundle tối ưu, PWA cài đặt 1-chạm không lỗi | 04/11 12:00 |
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