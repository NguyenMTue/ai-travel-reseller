# MY WORK PLAN — FE_W4
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 4 (26/10/2026 – 31/10/2026) — Sprint 4  
**Member:** Diệu (Frontend Lead)  
**Role:** Frontend Lead (Next.js 16, Mobile PWA, Video UI Integration & Mentoring)  
**Current Milestone:** VIDEO QUALITY ENGINE REFINEMENT, AUDIO DUCKING & SCOPE STABILIZATION  
**Deadline:** 17:00 Thứ Sáu (30/10/2026)  
**Branch:** `feature/fe-w4-video-player-pwa-polish` (tách từ `dev`)  

---

## 1. Context
- Kế thừa thành quả Sprint 3: Đã hoàn thành bộ giải pháp PWA Mobile Suite, Bottom Nav, Reseller Wallet UI, và luồng tạo Video AI từ Media Library qua PR #46 và #47 đã merge vào `dev`.
- **Cập nhật Lộ trình:** Toàn team chính thức dời lộ trình từ **4 tuần sang 5 tuần**. Khối lượng công việc tuần này được giảm tải rõ rệt để tập trung tinh chỉnh trải nghiệm người dùng di động và phối hợp với BE1 nâng tầm chất lượng video AI.
- **Trọng tâm Frontend Tuần 4:**
  1. Tinh chỉnh trình phát video 9:16 (`VideoPlayer`) trên giao diện Reseller Feed và Merchant Library: hỗ trợ phát mượt mà video MP4 chất lượng cao mới từ BE1, thêm nút tải video trực tiếp về thiết bị (Save to Gallery / Download MP4).
  2. Tối ưu trải nghiệm vuốt chạm (Touch Gestures) cho PWA: đảm bảo cuộn mượt mà không bị giật, hiển thị chuẩn xác ở vùng an toàn (Safe Area Inset) trên các thiết bị có tai thỏ / Dynamic Island.
  3. Đóng vai trò Mentor kiêm Reviewer cấp 1 cho Tester 3 (FE phụ): cung cấp mock data, hướng dẫn cắt component tĩnh và kiểm duyệt nghiêm ngặt PR trước khi chuyển sang PM.

---

## 2. Executive Summary
Trong Sprint 4, Frontend Lead không ôm đồm tính năng mới mà tập trung hoàn thiện trải nghiệm thị giác và thao tác cho người dùng di động:
1. **Video UI & Download:** Bổ sung chức năng tải file video MP4 kết xuất từ BE1 về bộ nhớ máy điện thoại kèm thông báo toast trực quan.
2. **PWA Touch Polish:** Tinh chỉnh CSS và hiệu ứng chạm vuốt tab Bottom Navigation, loại bỏ hoàn toàn các lỗi layout shift nhỏ trên mobile.
3. **Tester 3 Supervision:** Giám sát chặt chẽ nhánh của Tester 3, bảo đảm thành viên này không chạm vào bất kỳ file core nào.

---

## 3. TODAY — MUST DO (Thứ Hai 26/10/2026)

| Priority | Task | Why | Dependency | Output | Estimated Effort | Status |
|:---:|---|---|---|---|:---:|:---:|
| **P0** | Họp Kick-off Sprint 4 & Phân định phạm vi giảm tải | Thống nhất kế hoạch tinh chỉnh PWA và hỗ trợ BE1 test video | Toàn team | Kế hoạch FE tuần 4 | 1.5h | DONE |
| **P0** | Tạo nhánh `feature/fe-t3-video-tips-guide` từ `dev` cho Tester 3 | Khóa nhánh an toàn cho Tester 3 làm việc độc lập | Nhánh `dev` sạch | Branch trên GitHub | 0.5h | READY |
| **P1** | Tạo nhánh `feature/fe-w4-video-player-pwa-polish` từ `dev` | Bắt đầu công việc tinh chỉnh của FE Lead | Nhánh `dev` sạch | Local branch | 0.5h | READY |

---

## 4. THIS WEEK — MY TASKS

| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|:---:|:---:|---|:---:|---|:---:|
| **FE-W4-01** | Tối ưu Video Player 9:16 và cơ chế tải video trực tiếp về máy | **P1** | `IN_PROGRESS — code/fixture pass, chờ live/device` | BE1 Video URL | FE Lead | Player component + Nút tải MP4 | 29/10 17:00 |
| **FE-W4-02** | Tinh chỉnh mượt mà thao tác vuốt chạm & Safe Area Inset cho PWA | **P1** | `READY` | PWA code W3 | FE Lead | Trải nghiệm vuốt tab mượt mà 60fps | 30/10 12:00 |
| **FE-W4-03** | Hỗ trợ và Review cấp 1 cho PR của Tester 3 (`T3-FE-W4-01`) | **P0** | `WAITING_HANDOFF` | PR Tester 3 | FE Lead | Chuẩn bị review; chưa review/approve | 29/10 12:00 |
| **FE-W4-04** | Tích hợp modal hướng dẫn của Tester 3 vào giao diện Reseller | **P2** | `WAITING — T3 + 2 approvals` | Approval PR T3 | FE Lead | Nút mở modal mẹo đăng bài | 30/10 17:00 |

---

## 5. TASK BREAKDOWN (CHI TIẾT NHIỆM VỤ)

### A. Những việc tôi PHẢI làm:
- Nâng cấp component `VideoGenerateModal` hoặc `MediaCard` để hỗ trợ phát video 9:16 mượt mà không bị vỡ khung hình.
- Thêm action tải video MP4:
  - Khi người dùng bấm "Tải video về máy", sử dụng kỹ thuật `fetch(blobUrl)` và trigger download file `.mp4`.
  - Hiển thị toast thông báo: *"Đã tải video thành công! Bạn có thể mở TikTok/Reels để đăng ngay."*
- Giám sát 100% commit của Tester 3: Đảm bảo chỉ có duy nhất file `video-posting-tips-modal.tsx` trong PR.

### B. Những việc tôi KHÔNG NÊN làm:
- Không can thiệp vào logic tính toán của Video Engine backend (để BE1 tối ưu).
- Không tự ý thêm trang mới hay sửa đổi cấu trúc routing của dự án.
- Không cho phép Tester 3 tự merge code vào `dev`.

---

## 6. DEFINITION OF DONE (DoD)
- [ ] Trình phát video 9:16 hiển thị sắc nét video mẫu Bà Nà Hills của BE1 trên điện thoại thật.
- [ ] Nút tải video hoạt động hoàn hảo trên cả Safari iOS và Chrome Android.
- [ ] PR của Tester 3 được review sạch sẽ, merge an toàn không gây conflict.
- [ ] 100% Playwright tests và build `npm run build` không lỗi.

## 7. Cập nhật thực thi — Cao Thị Thu Diệu, 28/10/2026 (UTC+7)

Lịch sử kiểm tra ngày 28/10. Kết quả điều tra/chạy lại ngày 29/10 ở mục 8 bên dưới thay thế các trạng thái lỗi cũ, không thay thế nghiệm thu live/device.

### Nền Git và bảo toàn dữ liệu
- Fetch riêng `dev` bằng refspec đã yêu cầu; xác minh nền mới nhất là `d4215160ca99f32dd32d79e474c474dd5383663b`, mới hơn mốc tham khảo `ad933ab` (PR #49 hardening/grounding BE2).
- Nhánh làm việc: `feature/fe-w4-video-player-pwa-polish`, worktree `E:\THUCTAP\ai-travel-reseller\build\fe-w4-worktree`.
- Checkout gốc giữ nguyên nhánh W3, HEAD `74a06df4d29d691383a2592f0f8165ad062c16ea` và sửa local `tsconfig.json`. Không stash/commit/push, không sao chép `.env.local`, không sửa exclude/recovery/secret.
- Sandbox ban đầu chặn fetch credentials và tạo ref `.git`; mỗi lệnh chỉ được chạy lại ngoài sandbox sau cấp quyền và đều thành công. Không có lỗi unlink/DELETE, không merge/pull/reset/clean.
- Đã đọc AGENTS.md, Next.js 16.3.8 local guides (client/server boundary và CLI Webpack), Week4/FE/Tester3/UIUX/BA/BE1 và team log.

### Kế hoạch đủ 4 task
| Task | Mốc UTC+7 | Phần còn lại / phụ thuộc |
|---|---|---|
| FE-W4-03 | 29/10/2026 12:00 | Ưu tiên review khi T3 bàn giao PR/SHA; chỉ 1 file `video-posting-tips-modal.tsx`, props `{isOpen,onClose}`, tĩnh, không network/core; cần tsc/lint và 2 approvals FE + PM trước tích hợp. Lượt này không đăng review. |
| FE-W4-01 | 29/10/2026 17:00 | Code và fixture có sẵn; chờ URL MP4 vật lý từ BE1, MIME/CORS/expiry contract, QA live và thiết bị thật. |
| FE-W4-02 | 30/10/2026 12:00 | Chưa triển khai polish tuần 4: đo touch/scroll, Bottom Nav, safe-area/notch/keyboard trên Android và iOS; không coi responsive automation là 60fps/device pass. |
| FE-W4-04 | 30/10/2026 17:00 | Chưa triển khai; chờ T3 bàn giao và 2 approvals, sau đó nối nút mở modal vào Reseller, test focus/đóng/scroll. Không làm thay component T3. |

### FE-W4-01 đã triển khai
- `VideoPlayer` dùng chung: frame 9:16 tối đa 280px, `object-fit: contain`, controls/playsInline, `preload="none"`, không autoplay, trạng thái chờ/loading/error/thiếu URL. Cleanup pause, remove src, load, abort request và revoke object URL khi đổi record/source hoặc unmount. Có xử lý effect replay của React Strict Mode.
- Merchant Library tiếp tục dùng MediaCard và VideoGenerateModal hiện có; đặt player/tải ở kết quả generation, không biến video tham khảo thành video chiến dịch, không phát/tải hàng loạt card. Modal mất ngữ cảnh/phiên/selection sẽ đóng và giải phóng player. Bổ sung wrap nội dung dài và giữ Tab/Shift+Tab trong modal, Escape/restore focus.
- Reseller Feed hiện không có video trong DTO campaign. Nơi tích hợp an toàn là Content Kit ở route chi tiết chiến dịch đã có. Bổ sung `video_url` vào select/adapter sau server membership gate; giữ nguyên `approved`, campaign, shared/own filters và pagination; không mở quyền `ready`/persona mới. Không thêm route/API hay sửa DB/RLS.
- `video-delivery.ts`: URL http(s)/đường dẫn local hợp lệ, chặn credentials/protocol lạ và domain mock chính xác; không thay URL bằng sample. Download chỉ khi click, `fetch/blob`, kiểm HTTP, `video/mp4`, file rỗng/header ISO BMFF `ftyp`; chống click trùng, timeout 60s, abort, tên file theo title + content ID. Object URL giữ tối đa 60s cho trình duyệt nhận file và revoke ngay khi đổi/đóng.
- Fallback “Mở video gốc” mở đúng URL, hướng dẫn menu Lưu/Chia sẻ. Không `no-cors`, proxy mới hoặc thay quyền storage.
- Câu thông báo thay cho toast dự kiến ở mục 5: **“Đã tải dữ liệu MP4 và gửi yêu cầu lưu tới trình duyệt. Hãy kiểm tra mục Tệp tải về; chưa xác nhận file đã được lưu.”** Không tuyên bố đã lưu Gallery. Hành vi `download` phụ thuộc browser: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a#download.
- Mẫu chỉ trong vùng có nhãn rõ ở `/preview/merchant/library` (development only). Nguồn: file đã tracked `public/campaign-videos/banahills-remediated.mp4`, 2,556,563 bytes, 540×960; SHA256 `d10e8e3211390507e9407ba5b711da8357c84e0f7e6eb7488dbbf0b7c8e1bcc1`. Không phải MP4 mới tuần 4 hoặc kết quả chiến dịch Hội An.

### Blocker contract / tích hợp thật
1. `synthesizeVideoDraft()` mặc định dùng `MockVideoRendererAdapter`; service lưu và trả `status: ready` kèm `storage.travellink.vn` nhưng chưa render/upload file vật lý. FE từ chối URL mock thay vì hiển thị sai video mẫu. Cần BE1 bàn giao file thật + readiness/source metadata đáng tin cậy, MIME `video/mp4`, URL tải và quy tắc expiry/refresh.
2. Reseller chỉ `approved` và persona theo contract xác nhận; generation tạo `ready` với persona khác nên không tự xuất hiện trong Content Kit. Cần BA/BE1 chốt bước duyệt và mapping; FE không nới chính sách. Select URL đối chiếu với tài liệu SDK: https://supabase.com/docs/reference/javascript/select. Changelog markdown bị web reader từ chối content-type; không thay SDK/API.
3. Cần xác minh CORS GET cho origin frontend trên storage thực và URL signed còn hạn, quyền read public/private đúng deployment. Không suy ra bucket thật đã public chỉ từ team log. `credentials: same-origin` không gửi cookie app sang origin khác. HTTP 401/403 báo lỗi/đề nghị tải lại dữ liệu trang; chưa có endpoint refresh URL riêng.
4. File mẫu hiện có 540×960; đầu ra W4 1080×1920 H.264/AAC và mẫu Hội An chưa nghiệm thu. Không gọi API AI/render thật để kiểm thử.

### Kiểm chứng và giới hạn
- PASS unit delivery: 3 tests (URL/filename, byte-identical MP4, HTTP/expired/MIME/empty/fake/network/abort).
- PASS media-library + merchant-video service/schema fixtures: 15 tests, không DB/AI live.
- PASS Content Kit data/query: 15 tests, gồm SDK serializes `video_url` cùng scope và adapter không lộ URL của owner/campaign/status khác.
- PASS Chrome browser script: playback MP4 decode dimensions, download SHA256 trùng source, 320/390/768/1440, nội dung dài, loading/error/thiếu/mock URL, HTTP/MIME/empty/CORS giả lập, double-click, đổi nguồn khi pending, cleanup object URL, modal focus/Tab/Escape/restore + release playback. Ảnh và file tải tại `build/fe-w4-evidence/` (ignored).
- Hồi quy Content Kit: 21/22 pass ở lần chạy trước khi thêm test boundary (lần data/query riêng sau đó 15/15 pass). Test lỗi tại `reseller-content-kit.spec.ts:123` do `getByRole("note")` khớp 3 note đã có trên dev (placeholder + Telegram + preview); assertion `note count 0` phía sau cũng cần được chủ suite rà soát. Không sửa/yếu assertions.
- Lint phần mới và các file sửa ngoài generation modal: pass. Modal còn baseline 2 lỗi `react-hooks/set-state-in-effect` và 1 warning unused `autoStart` từ dev; kiểm tra baseline riêng bằng `git show HEAD:... | eslint --stdin`. Không tắt lint/typecheck.
- TypeScript và production Webpack build đã pass. Build tự thêm include generated types của 2 output W4 trong `tsconfig.json` **chỉ tại worktree mới**.
- Chưa tuyên bố 100% Playwright toàn repository: các suite chuyên biệt live auth/DB, tracking/wallet/chat/merchant campaign và nghiệm thu BE1/QA chưa chạy trong lượt này; không có env thật ở worktree. Kết quả default frontend production suite ghi riêng bên dưới.
- Thiết bị thật realme C21Y/Chrome và Safari iOS: **CHƯA CHẠY**. Chrome desktop/WebKit giả lập không thay thế iPhone thật. Không tự mở tunnel.
- Default production frontend suite (3 viewport, Chrome có sẵn): đã ghi đủ 15 kết quả: **8 pass / 7 fail**. Ba lỗi pages tại `frontend.spec.ts:2` do selector `h1` khớp 2 heading của chat; bốn lỗi chat mobile/small-mobile tại dòng 71/91 do chờ nút gợi ý/textarea khi giao diện hiện nút “Hỏi TravelLink Assistant”. Sau khi in đủ kết quả, runner không thoát khi teardown trên Windows; đã gửi Ctrl+C, không chạy lại để che lỗi. Không đổi code chat hoặc assertions trong lượt này.
- Media Library browser hồi quy cũ: **fail** tại `media-library-browser.mjs:25`, chờ text `Chỉ đánh dấu trong phiên này.` trong khi dev có `Chỉ đánh dấu trong phiên này để tạo video AI từ mẫu.`; chưa đi tiếp phần còn lại suite. Không sửa test/giảm assertion để pass. Browser suite W4 vẫn kiểm riêng được selection → generation modal bằng HTTP mock và focus/playback/download/cleanup.
- FFmpeg decode bổ sung không chạy được: dependency `ffmpeg-static` trỏ tới `node_modules/ffmpeg-static/ffmpeg.exe` không có trên máy (`ENOENT`). Không cài/tạo render thật. Bằng chứng file hiện có là Chrome phát/đọc kích thước MP4, MIME/header và SHA256 file tải trùng toàn bộ source; không nhận là full FFmpeg quality audit.
- Baseline lint kiểm trực tiếp từ HEAD: 3 errors + 2 warnings. Mã sau sửa còn đúng 2 errors effect + 1 warning autoStart ở generation modal; các file mới/phần còn lại 0 errors/warnings. Evidence JSON tại `build/fe-w4-evidence/lint.json`.

### Tester 3 — truy vấn mục tiêu 28/10
- `git ls-remote --heads origin refs/heads/feature/fe-w4-video-player-pwa-polish refs/heads/feature/fe-t3-video-tips-guide`: không có remote refs ở thời điểm kiểm tra; local W4 chưa tồn tại trước khi tạo worktree.
- GitHub connector query `repo:NguyenMTue/ai-travel-reseller head:feature/fe-t3-video-tips-guide`: không trả PR. Không có SHA/file diff bàn giao để review, **chưa reviewed/approved**.
- Cần T3 bàn giao trước 28/10 17:00: PR link, base dev/head SHA, duy nhất `src/components/merchant/video-posting-tips-modal.tsx`, lint/tsc output, ảnh 375px/desktop và thao tác keyboard. Không tự tạo/push nhánh T3, comment/approve/merge trong lượt này.
- Handoff có lịch chưa thống nhất: TESTER3_W4 yêu cầu PR 28/10 17:00 nhưng team log ghi 29/10. Lấy deadline sớm theo yêu cầu hiện tại và giữ review FE 29/10 12:00; chưa có bằng chứng bàn giao để kết luận trạng thái muộn/sớm.

### Chạy lại local / nghiệm thu thủ công
Không cần env cho fixture; dùng dependencies có sẵn ở checkout cha trong cấu trúc worktree hiện tại:
```powershell
Set-Location E:\THUCTAP\ai-travel-reseller\build\fe-w4-worktree
$env:NEXT_BUILD_DIR = 'build/fe-w4-preview'
npm.cmd run dev -- --webpack --hostname 127.0.0.1 --port 3114
# http://127.0.0.1:3114/preview/merchant/library
# Cuộn tới “Kiểm thử phát và tải MP4 · Fixture”; đổi nguồn, phát, tải, mở video gốc.
# Không bấm tạo AI trên portal thật để lấy dữ liệu test.
node tests/video-player-browser.mjs
node --experimental-strip-types --test tests/video-delivery.test.ts tests/media-library.test.ts tests/merchant-video-generate-api.test.ts
node ../../node_modules/@playwright/test/cli.js test --config tests/playwright.fe-w4.config.ts
node ../../node_modules/typescript/bin/tsc --noEmit --incremental false
$env:NEXT_BUILD_DIR = 'build/fe-w4-production'
npm.cmd run build -- --webpack
```
Nếu cổng 3114 đang chạy thì dùng server đó, không khởi động trùng. Mở đúng worktree bằng `code E:\THUCTAP\ai-travel-reseller\build\fe-w4-worktree`. Không sao chép secret tự động; cấu hình live cần chủ máy thiết lập theo cơ chế dự án sau.

Checklist QA thiết bị thật (chờ QA/chủ máy chạy trên môi trường truy cập được đã được cấp quyền, không cần tự mở tunnel):
1. realme C21Y/Chrome và Safari iOS: fixture Bà Nà có nhãn; portrait/landscape, controls, tiếng chỉ phát sau thao tác, phụ đề không bị crop, cuộn modal, đóng/back/focus, safe area/keyboard.
2. Bấm tải 1 lần và liên tiếp; kiểm mục Tệp tải về/Files, tên `.mp4`, mở file offline và đối chiếu đúng video. Ghi browser/version/device, video ID/source, kết quả thực thay vì chỉ toast.
3. Safari nếu mở/chia sẻ thay tải: dùng link gốc → Lưu/Chia sẻ, ghi đúng hành vi thực tế; không mặc định đã vào Photos.
4. Kiểm URL thiếu/sai/403/hết hạn, mạng mất/CORS, chuyển video/đóng khi đang tải; không file giả, không toast thành công cũ hoặc tải nhầm video.
5. Khi BE1 bàn giao URL thật: xác minh readiness/approval/owner, MIME/CORS/expiry và H.264/AAC 1080×1920 bằng mẫu đúng chiến dịch; ghi riêng kết quả live và fixture.

## 8. Điều tra và kiểm chứng FE-W4-01 / bàn giao FE-W4-03 — 29/10/2026 (UTC+7)

### Phạm vi và bằng chứng
- Tiếp tục đúng worktree/nhánh, HEAD `d4215160ca99f32dd32d79e474c474dd5383663b`. Không pull/fetch/merge/đổi nhánh, không sửa env/DB/RLS, không xóa cache, không commit/push/comment/approval. Giữ toàn bộ thay đổi chưa commit từ lượt trước; không triển khai FE-W4-02/04.
- Đọc trước FE_W4, AGENTS.md, Next.js local docs (client/server + CLI), báo cáo lỗi `test-results/*/error-context.md` và JSON lint. Bảo toàn báo cáo cũ tại `build/fe-w4-audit-20261029/original-test-results/` và `original-lint.json` trước khi chạy test.
- So sánh SHA256 nội dung chuẩn hóa newline với **đúng commit d421516**, không dùng dev remote hiện tại: `source-comparison.json`. Chat page/panel/sheet/CSS và 3 file test gây lỗi đều giống baseline trước sửa. Baseline source được lưu thành `*.baseline.txt`; snippets note/Telegram và câu selection được đối chiếu riêng bằng `git show`. Đây là bằng chứng phân loại, không suy diễn từ tên lỗi.

### Nguyên nhân, phân loại và sửa
| Hạng mục | Bằng chứng và phân loại | Cách xử lý / kết quả |
|---|---|---|
| Content Kit, 1 failure | Test baseline `reseller-content-kit.spec.ts:123` chọn toàn bộ note. Baseline UI đã có placeholder + Telegram chưa link + preview note; FE-W4-01 không thêm note này. **Expectation lỗi thời trên nền dev**, không phải URL adapter/player gây lỗi. | Scope đúng placeholder, assert đúng 1 cảnh báo và nội dung; assert riêng 2 note Telegram; đổi variant phải mất placeholder và vẫn giữ 2 note Telegram. Không xóa assertion/copy/ownership checks. Ca lỗi pass, rồi suite data/query/content **23/23 pass**. |
| Frontend production, 3 failures pages | Báo cáo cũ chỉ rõ `h1` khớp 2 phần tử. Baseline mobile sheet và CSS có 2 heading trong DOM nhưng chỉ một heading được hiển thị theo breakpoint; nguồn chat không đổi so d421516. | Kiểm đúng **1 heading accessible và visible**, không dùng `.first()` hoặc bỏ kiểm tra uniqueness. Giữ status 200, overflow, pageerror và screenshot. |
| Frontend production, 4 failures chat mobile | Baseline W3 spec yêu cầu launcher cho <768px; test cũ gửi/tìm prompt khi native dialog còn đóng. **Thiếu thao tác mở UI trong test**, không do video. | Helper assert dialog đóng trên mobile, bấm launcher, assert dialog hiện trước thao tác. Giữ nguyên zero-AI-call, attribution/history, lỗi giữ bản nháp, retry và reject javascript checkout assertions. Targeted 9/9 pass (gồm 7 ca từng lỗi), rồi production suite **15/15 pass**, 0 skipped/flaky. |
| Media Library text | Câu baseline đã là `Chỉ đánh dấu trong phiên này để tạo video AI từ mẫu.`; test vẫn tìm câu có dấu chấm sau “này”. **Expectation lỗi thời** được xác minh source. | Sửa thành exact full text, không nới regex hoặc bỏ assertion. |
| Media Library selection 320px | Sau sửa text mới phát hiện **bug layout thật trong baseline**, không được che bằng đổi expectation: `.selectionActions` không shrink, ép text container rộng **0px**, cao 5346px. Tái hiện với `inspect-media.mjs`, lưu `selection-before-fix.txt`; CSS baseline lưu riêng. Nằm ngay bước mở modal video. | Cho vùng selection/action wrap và giữ text basis 220px; nút wrap trong container. Bổ sung assertion text rộng >100px, không overflow sau chọn và nút nằm trong section. Toàn bộ browser suite Media Library **PASS 320/390/768/1440** (search/page/filter/session/late result/focus/modal/nav), không service request. Không mở rộng sang polish touch/safe-area FE-W4-02. |
| Modal lint 2 errors/1 warning | ESLint trực tiếp `git show d421516:...` xác nhận baseline **3 errors/2 warnings**: 2 state-in-effect, any, unused autoStart/selectedCampaign. Lượt trước giảm còn 2 errors/1 warning, chưa sạch. JSON: `lint-baseline-d421516.json`. | Session component được mount mới theo opening/selected item; dùng state initializers, bỏ reset state trong effect và unused destructuring; abort campaign read khi unmount. Giữ API props và hành vi người dùng, không suppression/queue setState để né lint. Modal và toàn bộ **18 file TS/JS liên quan: 0 errors/0 warnings**. |
| Fixture “URL lỗi” của FE-W4-01 | **Lỗi fixture mới kế thừa rewrite baseline**: đường dẫn `campaign-videos/expired-fixture.mp4` bị rewrite thành sample 200. Intercept 403 trong browser trước đây không chứng minh được URL manual bị lỗi thật. | Chuyển fixture lỗi sang `/fixture-video-unavailable.mp4` ngoài rewrite; GET thật đã xác minh **404**. Giữ test HTTP403 expiry bằng mock riêng. Không coi 404 là bằng chứng signed URL expiry thật. |
| Runner/browser/tooling | Lượt trước Chrome có sẵn chạy được nhưng bundled Playwright Chromium thiếu; FFmpeg binary ENOENT. Sau 15 kết quả cũ runner không thoát, chưa xác định đầy đủ nguyên nhân Windows/process teardown. | Dùng Chrome có sẵn; production test config mới nối server task-owned ở 3115, không dùng npm webServer teardown, không tăng timeout. Targeted/full đều thoát bình thường. Chỉ dừng server production 3115 do lượt này tạo; giữ preview 3114. Không tuyên bố đã full-decode FFmpeg hay test điện thoại. |

### Hồi quy đã chạy / DoD
- Content Kit: chạy lại đúng ca failure trước (**1/1 pass**), rồi data/query/content (**23/23 pass**).
- Frontend production: đúng các test names từng lỗi trên 3 viewport (**9/9 pass**), rồi toàn bộ `frontend.spec.ts` (**15/15 pass**). Report cuối `build/fe-w4-audit-20261029/frontend-report.json`, không skipped/flaky. Cấu hình core `playwright.config.ts` giữ nguyên; config audit riêng không quản lý server 3114.
- Media Library: sau sửa text, giữ lần FAIL phát hiện width 0 làm bằng chứng; sau sửa layout, toàn bộ browser script **PASS 4 viewport**. Không chỉ chạy tới điểm cũ rồi dừng.
- Player/modal: **PASS 4 viewport**, playback/loading/error/HTTP403/thiếu/sai/mock URL, byte/hash MP4, không prefetch/autoplay, duplicate/pending source switch, object URL cleanup, Tab/Shift+Tab/Escape/return focus và release video. Bổ sung đóng modal **khi đang tải**, không có late download, mở lại config sạch/không video cũ/object URL rò rỉ. Mọi generation/campaign response trong browser test chỉ browser route mock, **không gửi tới API tạo video thật**.
- Unit/fixture: delivery + media-library + merchant-video service/schema **18/18 pass**, mock dependencies; không ghi Supabase/AI.
- TypeScript `tsc --noEmit --incremental false`: PASS. Lint 18 file liên quan: PASS, 0 lỗi/0 warning. Webpack production build: PASS, không bỏ typecheck. `git diff --check`: PASS. Build dùng output W4 đã có; giữ diff tsconfig ban đầu của lượt này.
- **Chưa chạy:** toàn bộ Playwright repository ngoài các suite vừa nêu; suite live auth/DB, tracking/wallet, Merchant campaign chuyên biệt, BE1 video-quality/rubric/UAT; test native file saving trên realme C21Y/Chrome và Safari iOS. Không check DoD “100% toàn bộ Playwright” hoặc DoD thiết bị thật/merge T3.

### Tách quan sát thủ công / dữ liệu thật / thiết bị thật
- **Quan sát người dùng:** ngày 29/10 người dùng đã mở preview cổng 3114, thử và thấy hoạt động được. Chỉ ghi nhận quan sát thủ công trên preview; chưa có chi tiết device/browser hoặc xác nhận lưu file trên điện thoại. Không nâng thành nghiệm thu video thật, MP4 mobile hay Safari iOS.
- **Tự động:** các số pass phía trên dùng fixture/local MP4 mẫu đã có (540×960) và HTTP mock. Không phải file kết xuất mới W4 hoặc kết quả chiến dịch khác.
- **Dữ liệu thật:** chưa kiểm chứng readiness, approved/owner/persona mapping, MP4 thật đúng chiến dịch, MIME/CORS/signed expiry trên storage triển khai.
- **Thiết bị thật:** realme C21Y/Chrome và Safari iOS vẫn CHƯA CHẠY; checklist ở mục 7 vẫn áp dụng.

### Blocker còn lại và câu hỏi cần chốt
1. **FE/PM — rewrite cấu hình nền (đã chứng minh):** `next.config.ts:10–15` trong d421516 rewrite mọi `/campaign-videos/:path*` về mẫu Bà Nà. GET local `/campaign-videos/fe-w4-nonexistent-proof.mp4` trả HTTP200 `video/mp4`, 2,556,563 bytes và SHA256 **trùng sample**. Evidence `rewrite-proof.json`. Các URL chiến dịch local không tồn tại có thể phát/tải nhầm video dù MIME/header hợp lệ. Chưa sửa `next.config.ts` vì yêu cầu giữ nguyên cấu hình local. **Cần chốt gỡ/giới hạn rewrite toàn cục và chỉ cho sample trong preview có nhãn trước nghiệm thu live**; không kết luận đã loại hết fallback chỉ vì helper FE đã bỏ fallback. Fixture lỗi mới đã được sửa đúng 404, blocker runtime này vẫn còn.
2. **BE1:** `synthesizeVideoDraft` mặc định mock nhưng trả ready. Khi nào bàn giao URL/file MP4 vật lý đúng chiến dịch (1080×1920 H.264/AAC), flag render-source/readiness, MIME `video/mp4`, CORS cho frontend origin và cách nhận URL mới khi hết hạn? Chưa gọi API/renderer để tự lấy mẫu.
3. **BA/BE1:** Nội dung generation status `ready`/persona hiện tại được chuyển sang `approved` và persona contract Reseller bằng bước nào? Ai phê duyệt, và quyền shared/own có giữ nguyên? FE không tự nới policy.
4. **QA/chủ máy:** Cần chạy realme C21Y và Safari iOS trên môi trường được phép truy cập, kiểm file trong Downloads/Files, tên/nội dung đúng, fallback Save/Share và hành vi khi đóng/đổi nguồn. Không coi desktop Chrome là bằng chứng native save/Gallery.

### FE-W4-03 — kiểm tra bàn giao Tester 3 ngày 29/10
- GitHub API `search_branches(owner=NguyenMTue, repo_name=ai-travel-reseller, query=feature/fe-t3-video-tips-guide)` trả `branches: []`.
- GitHub API `search_prs(query=repo:NguyenMTue/ai-travel-reseller head:feature/fe-t3-video-tips-guide)` trả `issues: []`.
- Chưa có PR/SHA/diff/component bàn giao từ các nguồn này, nên chưa có review finding theo file/vị trí hoặc runtime isolated test T3; **chưa reviewed/approved**, không tự làm thay, không tạo nhánh/tích hợp FE-W4-04. Không suy ra thành viên chưa làm local; cần họ cung cấp link/SHA nếu tên nhánh/repo khác.
- Đã đọc TESTER3_W4/FE_W4: yêu cầu đúng 1 file `src/components/merchant/video-posting-tips-modal.tsx`, props `{isOpen,onClose}`, nội dung 4 tips, không fetch/Supabase/router/core; review sau handoff sẽ kiểm responsive + initial/trap/return focus, Escape, body scroll/cleanup trong harness riêng, không ghi đè worktree W4.
- **Tin nhắn soạn sẵn, chưa gửi:** “Bạn gửi giúp Diệu PR/link nhánh `feature/fe-t3-video-tips-guide`, head SHA và toàn bộ file thay đổi để review FE-W4-03 nhé. Bàn giao cần component `video-posting-tips-modal.tsx`, kết quả lint/tsc, ảnh mobile/desktop và cách thử focus/Tab/Escape/khôi phục cuộn. Nếu dùng tên nhánh hoặc repo khác, gửi đúng link giúp mình. Hiện truy vấn GitHub chưa thấy nhánh/PR dự kiến.”

### Bước tiếp theo
- FE-W4-01 giữ **IN_PROGRESS — code/fixture và hồi quy mục tiêu pass, chờ quyết định rewrite + tích hợp thật + thiết bị thật**; chưa đủ DoD nghiệm thu.
- Ưu tiên nhận bàn giao T3 để review FE-W4-03, đồng thời chốt blocker với FE/PM/BE1/BA và QA. Chưa triển khai FE-W4-02/04 trong lượt này.
- Preview 3114 giữ chạy, URL kiểm tra: `http://127.0.0.1:3114/preview/merchant/library` (HTTP200, có marker fixture). Production3115 chỉ phục vụ test và đã dừng riêng sau test.
