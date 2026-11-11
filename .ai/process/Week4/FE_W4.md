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
| **FE-W4-02** | Tinh chỉnh mượt mà thao tác vuốt chạm & Safe Area Inset cho PWA | **P1** | `IN_PROGRESS — code/fixture pass, chờ thiết bị/spec swipe` | PWA code W3 | FE Lead | Touch/safe-area polish; chưa chứng minh 60fps mobile | 30/10 12:00 |
| **FE-W4-03** | Hỗ trợ và Review cấp 1 cho PR của Tester 3 (`T3-FE-W4-01`) | **P0** | `IN_REVIEW — b87 functional PASS, PR approvals pending` | PR Tester 3 | FE Lead | Gap viewport được sửa ở nhánh FE local mục17; không sửa PR T3/đăng approval | 29/10 12:00 |
| **FE-W4-04** | Tích hợp modal hướng dẫn của Tester 3 vào giao diện Reseller | **P2** | `LOCAL_INTEGRATED — targeted PASS; full lint FAIL; device/approvals pending` | Local FE được người dùng cho phép; approvals trước merge | FE Lead | Content Kit Reseller + viewport/safe area; chưa nghiệm thu thiết bị/publish | 30/10 17:00 |

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

Lịch sử kiểm tra ngày 28/10. Mục 8 ghi điều tra hồi quy; mục 9 là trạng thái mới nhất sau checkpoint/đồng bộ và triển khai FE-W4-02. Không thay thế nghiệm thu live/device.

### Nền Git và bảo toàn dữ liệu
- Fetch riêng `dev` bằng refspec đã yêu cầu; xác minh nền mới nhất là `d4215160ca99f32dd32d79e474c474dd5383663b`, mới hơn mốc tham khảo `ad933ab` (PR #49 hardening/grounding BE2).
- Nhánh làm việc: `feature/fe-w4-video-player-pwa-polish`, worktree `E:\THUCTAP\ai-travel-reseller\build\fe-w4-worktree`.
- Checkout gốc giữ nguyên nhánh W3, HEAD `74a06df4d29d691383a2592f0f8165ad062c16ea` và sửa local `tsconfig.json`. Không stash/commit/push, không sao chép `.env.local`, không sửa exclude/recovery/secret.
- Sandbox ban đầu chặn fetch credentials và tạo ref `.git`; mỗi lệnh chỉ được chạy lại ngoài sandbox sau cấp quyền và đều thành công. Không có lỗi unlink/DELETE, không merge/pull/reset/clean.
- Đã đọc AGENTS.md, Next.js 16.3.8 local guides (client/server boundary và CLI Webpack), Week4/FE/Tester3/UIUX/BA/BE1 và team log.

### Kế hoạch đủ 4 task
| Task | Mốc UTC+7 | Phần còn lại / phụ thuộc |
|---|---|---|
| FE-W4-03 | 29/10/2026 12:00 | Đã re-review PR #50 tại b87ecb6 (mục15): đủ6nhóm chức năng PASS, probe visualViewport vẫn fail. Chưa chốt owner/scope/nhánh hoặc đủ DoD/2approvals; không suy ra đã được chuyển trách nhiệm hoặc hoàn tất. Không đăng review. |
| FE-W4-01 | 29/10/2026 17:00 | Code và fixture có sẵn; chờ URL MP4 vật lý từ BE1, MIME/CORS/expiry contract, QA live và thiết bị thật. |
| FE-W4-02 | 30/10/2026 12:00 | Chưa triển khai polish tuần 4: đo touch/scroll, Bottom Nav, safe-area/notch/keyboard trên Android và iOS; không coi responsive automation là 60fps/device pass. |
| FE-W4-04 | 30/10/2026 17:00 | Người dùng cho phép ghép local thay giới hạn chuẩn bị: đã tích hợp Content Kit Reseller từb87ecb6, reuse FE-W4-02, appchecks27/27 + ContentKit24/24 + PWA/rewrite/TypeScript/lint/Webpack PASS (mục17). Thiết bị thật/PR approvals và phát hành vẫn chưa hoàn tất. |

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

## 9. Bảo toàn, đồng bộ dev và FE-W4-02 — 29/10/2026 (UTC+7)

### Git, checkpoint và đồng bộ
- Đã đọc AGENTS.md, diff tracked/untracked, remote/worktree/HEAD/merge state. Nhánh vẫn `feature/fe-w4-video-player-pwa-polish`, worktree `E:\THUCTAP\ai-travel-reseller\build\fe-w4-worktree`; checkout W3 giữ nguyên tại `74a06df` và local tsconfig cũ.
- Recovery **ngoài worktree**: `E:\THUCTAP\ai-travel-reseller\build\fe-w4-recovery-20261029-pre-sync-01`. Copy 24 file tracked/untracked cần bảo toàn, xác minh từng SHA256, có manifest/status/diff; gồm tsconfig local. Không xóa/dọn build chứa worktree, không chép secret/env/artifacts/cache vào checkpoint, không thay exclude hoặc recovery trước.
- Đọc diff và stage đích danh 23 file code/test/tài liệu FE-W4-01 + hồi quy; checkpoint LOCAL **`4bebec6544efd0770f69628ff4feb56426ee0d3c`** (`feat(fe): checkpoint week 4 video delivery and regression fixes`). `tsconfig.json` chỉ có include output local được giữ ngoài commit. Không stash/revert/reset/clean.
- Fetch đúng lệnh `git fetch --no-tags --no-write-fetch-head origin refs/heads/dev:refs/remotes/origin/dev` thành công. **origin/dev mới xác minh vẫn `d4215160ca99f32dd32d79e474c474dd5383663b`**, không có commit mới so nền đã tích hợp. Diff player/download/modal/Content Kit/Media/PWA/tests/dependencies/lockfile rỗng; không cần cài hoặc nâng dependencies.
- Chạy `git merge --no-edit origin/dev` trên nhánh W4 sau checkpoint: **Already up to date**. Không phát sinh merge commit hoặc conflict; HEAD vẫn `4bebec6`, không MERGE_HEAD/unmerged paths. Không tạo merge commit giả để ghi nhận một nền đã là ancestor; không đổi nhánh/dev/W3 hoặc remote refs khác.
- Không gặp unlink/Access denied/lock/ref hay merge ghi dở ở lượt này. Không suy ra cloud/migration đã áp dụng từ việc file có trong repo.
- **Toàn bộ phần FE-W4-02 phía dưới và tài liệu cập nhật sau checkpoint chưa commit/stage/push.**

### Phạm vi FE-W4-02 và giả định swipe
- Đọc FE_W4/UIUX_W4, phần FE team log, Bottom Nav/Shell/Library/VideoPlayer/modal thực tế và local Next.js 16.3.8 guides (client/server, viewport export, CLI).
- Tài liệu nói vuốt/chạm/tab nhưng **chưa có đặc tả hướng/threshold/đổi route cho swipe**. Lượt này giữ cuộn dọc native, nút/tab/keyboard hiện có; không thêm carousel, horizontal swipe navigation, preventDefault trên touchmove hay listener lên native video controls. Cần UI/UX chốt nếu muốn swipe đổi tab; chưa coi đó là yêu cầu đã nghiệm thu.
- Theo tài liệu browser, dùng `touch-action: manipulation` cho nút/link, giữ xử lý pan/pinch của browser; không đặt lên video. Nguồn: [MDN touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action), [MDN VisualViewport](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport).

### Đã triển khai (tái sử dụng hệ thống hiện có)
- `mobile-dialog.module.css` và `use-dialog-viewport.ts`: dùng chung cho generation/guidelines/notice của Bottom Nav, không tạo modal system mới. Dialog căn theo visual viewport + safe insets 4 cạnh, max-height hữu dụng, cuộn riêng/overscroll contain, input font16px mobile; khi viewport/keyboard đổi thì đưa input đang focus về vùng nhìn thấy. `resize/scroll` listener passive, coalesce theo 1 requestAnimationFrame, không dùng React state mỗi frame; hủy frame/listener và CSS variables khi đóng/unmount.
- `video-generate-modal.tsx` + CSS: khóa/khôi phục cả body và document scroll; nút đóng **44×44**, sticky trong modal để có thể đóng khi đã cuộn tới input/kết quả; header tránh đè nút. Vẫn giữ Escape/Tab trap/focus return, readiness/download/cleanup FE-W4-01; không thay generation/auth/data contract.
- `video-guidelines-modal.tsx`: tái sử dụng dialog hiện có, áp dụng viewport/safe area và nút đóng44px; không tích hợp component T3.
- `video-player.module.css`: frame 9:16 contain thu theo chiều cao khả dụng khi landscape, không crop phụ đề; nút/link ≥44px. Native video controls/seek/pinch không bị bắt gesture; không autoplay/prefetch mới.
- Reseller Bottom Nav/Shell: giữ 4 tab/link/hash/notice hiện có, tăng tính nhất quán touch-action, safe-area top/left/right header/content và bottom-clearance có sẵn. Notice khóa/khôi phục scroll, hook viewport chỉ khi mở. MutationObserver và keyboard resize/focus đo tối đa 1 lần/frame, cleanup đầy đủ; không đổi session/quyền hoặc tạo route.
- Merchant Library CSS: safe insets cho shell/header/main/footer, touch targets, input16px. Thêm `viewportFit: cover` **chỉ các route hiện có liên quan** Merchant Library live/preview và Reseller preview/detail; Reseller live đã có viewportFit từ layout. Không đổi root layout/global CSS/PWA cache/backend/checkout.
- Reduced motion tắt transition/animation/scroll motion trong dialog và giữ reduced-motion Bottom Nav đã có. Desktop giữ bố cục Coastal Editorial.

### Kiểm chứng và số đo
- **PASS `tests/pwa-polish-browser.mjs`:** Chrome có touch emulation; viewport320×740,390×844,768×900,1440×1000,844×390,667×320. Touch targets ≥44, không document/dialog overflow; footer không bị Bottom Nav che; safe-bottom34px và asymmetric insets4cạnh mô phỏng; keyboard/VisualViewport380px+offset80 mô phỏng, input focused còn trong vùng thấy; scroll lock/return focus/Escape, 10 lần mở/đóng không tăng số window/visualViewport listeners, khôi phục scroll styles.
- Vuốt cuộn dọc bằng CDP `dispatchTouchEvent` start/move/end được kiểm bằng assertion scrollY tăng >100px. Diagnostic `synthesizeScrollGesture(touch)` của Chrome desktop trước đó không phát cuộn, trong khi mouse250px/touch-event335px có cuộn: **giới hạn phương pháp phát input**, không bỏ assertion để pass. Probe nằm `build/fe-w4-touch-evidence/scroll-probe.mjs`.
- **PASS hồi quy liên quan:** `tests/reseller-bottom-nav.mjs` (4viewport, hash/focus/nav/keyboard/safe-bottom/reduced-motion); `tests/media-library-browser.mjs` (4viewport và mapping/filter/paging/session/late result/modal); `tests/video-player-browser.mjs` (4viewport, play/download đúng hash, duplicate/error/source-switch/pending-close/reopen/cleanup). Browser fixture chặn external/API thật, generation response chỉ route mock trong browser; không gọi API tạo video thật/AI/ghi dữ liệu.
- **TypeScript, lint phần sửa, production Webpack build và diff-check: PASS.** Không tắt typecheck/giảm assertions/tăng timeout để pass. Không chạy lại unit18/data-query-content23/frontend-production15 không bị thay đổi chức năng; tái sử dụng kết quả pass ở mục8, không nhận là đã chạy lại toàn bộ repo.
- Ảnh + JSON tại `build/fe-w4-touch-evidence/`; đã xem screenshot landscape667×320, keyboard mô phỏng và modal320 để chỉnh input visibility/close placement. Ảnh fixture có nhãn; không phải video chiến dịch mới.
- **Đo hiệu năng:** Windows10.0.26200, Intel i5-8265U/8 logical CPUs/8GiB RAM, Chrome156.0.8078.49,390×844 hasTouch emulation, Next dev Webpack, reduced motion. CDP Performance metrics + PerformanceObserver Event Timing (`durationThreshold:16`), kịch bản10mở/Escape, lần đầu có keyboard mô phỏng. Lần cuối ghi task0.955s, script0.459s, layout0.031s, style0.133s cho cả kịch bản; 37 Event Timing entries, median32ms/p95 96ms/max208ms. Đây là event entries được lấy mẫu/làm tròn (không phải37lượt tương tác độc lập), không gồm eventngắn<16ms. Không có số baseline so sánh trước/sau đáng tin để nhận phần trăm cải thiện.
- **Giới hạn:** số đo desktop/dev/giả lập có overhead automation/DevTools; không suy ra 60fps, INP field metric, Safari iOS hoặc hiệu năng realme C21Y. Chưa thiết bị thật, chưa chứng minh bàn phím/notch/native video controls bằng iPhone thật. Không đánh dấu cả FE-W4-02/tuần4 nghiệm thu hoàn tất.

### Tester 3: đã tìm thấy bàn giao, chuẩn bị FE-W4-03
- Người dùng báo đã có PR; không dùng kết quả query cũ để kết luận chưa có. Exact head dự kiến không tìm ra; truy vấn GitHub API open PR của đúng repo tìm được **[PR #50](https://github.com/NguyenMTue/ai-travel-reseller/pull/50)**, trạng tháiopen, chưamerged, tác giả `TuanAnhNguyen-2005`.
- Branch thực tế **`feat/video-posting-tips-modal`** (khác tên dự kiến), head **`e8b95d6730fab7996562d9b39b3b798293d3c6dc`**, base `dev` tại `d421516`.
- GitHub API liệt kê **toàn bộ2file thay đổi**: `src/components/merchant/library-client.tsx`; `src/components/merchant/video-posting-tips-modal.tsx`. Ghi phạm vi này để FE Lead đối chiếu quy định1component ở lượt review; chưa kết luận approval từ metadata.
- FE-W4-03 chuyển **READY_FOR_REVIEW**, cần ưu tiên khi có bàn giao. Lượt này chỉ chuẩn bị thông tin, **không tích hợp/fetch branch/làm thay component/đăng review/comment/approval**. FE-W4-04 vẫn chờ review/approvals, chưa triển khai.

### Blocker FE-W4-01 sau đồng bộ
- **Còn bằng chứng:** `next.config.ts` vẫn rewrite `/campaign-videos/:path*` về Bà Nà; GET local `/campaign-videos/w4-polish-nonexistent.mp4` trả200, `video/mp4`,2,556,563bytes. Dev không có sửa mới; không dùng fallback này làm bằng chứng live. Chưa gỡ cấu hình trong nhiệm vụ touch polish.
- **Còn bằng chứng source:** `synthesizeVideoDraft(..., renderer = new MockVideoRendererAdapter())`; chưa có bàn giao runtime MP4 thật/readiness/approval/MIME/CORS/expiry trong lượt này. Không suy ra storage/cloud đã sẵn sàng. Policy Reseller approved/shared/own được giữ nguyên.
- **Vẫn pending:** realme C21Y/Chrome, Safari iOS, lưu MP4 thật/Files/Gallery và output1080×1920. Quan sát preview của người dùng ở mục8 vẫn là quan sát preview, không được nâng thành nghiệm thu FE-W4-02 hoặc thiết bị thật.

### Preview và checklist người dùng
- Giữ server3114 của worktree; không dừng server khác. Kiểm tra URL trước handoff: `http://127.0.0.1:3114/preview/merchant/library` và `http://127.0.0.1:3114/preview/reseller`.
- Nếu cần tự khởi động (không chạy trùng khi3114đã có server):
```powershell
Set-Location E:\THUCTAP\ai-travel-reseller\build\fe-w4-worktree
$env:NEXT_BUILD_DIR = 'build/fe-w4-preview'
npm.cmd run dev -- --webpack --hostname 127.0.0.1 --port 3114
```
- Thử Library: chọn mẫu, mở/đóng Quy chuẩn, mở modal generation **chỉ xem form, không bấm tạo AI thật**, cuộn nội dung dài/nhập tips rồi đóng. Xoay viewport ngang; nút đóng còn thao tác được, input không bị keyboard che; player mẫu không crop, controls vẫn native.
- Thử Reseller preview: tap4tab/nút, Content Kit/Link ở chi tiết chiến dịch; cuộn tớifooter không bịdock che; tập trung search rồi đóngkeyboard. Kiểm keyboard Tab/Shift+Tab/Escape và reducedmotion.
- Tiếp theo: ưu tiên reviewPR50 theo FE-W4-03; UI/UX chốt swipeđổi-tab nếu muốn; QA đo/kiểm trên realme C21Y và Safari iOS; chốt rewrite và hợp đồng video thật với FE/PM/BE1/BA. Chưa commit FE-W4-02 hoặc triển khai FE-W4-04.

## 10. FE-W4-03 — review PR #50, 29/10/2026 (UTC+7)

### Định danh, phạm vi và bảo toàn
- [PR #50](https://github.com/NguyenMTue/ai-travel-reseller/pull/50), tác giả `TuanAnhNguyen-2005`, open, chưa merge; nhánh thực tế `feat/video-posting-tips-modal`. GitHub API xác minh lại sau kiểm thử: HEAD vẫn **`e8b95d6730fab7996562d9b39b3b798293d3c6dc`**, base dev **`d4215160ca99f32dd32d79e474c474dd5383663b`**. Review đúng SHA này; không dùng nội dung nhánh động thay bản đã kiểm chứng.
- Đọc AGENTS.md, tài liệu Next local client/server, FE_W4.md, TESTER3_W4.md và UIUX_W4.md; kiểm tra status/diff trước khi làm. HEAD worktree vẫn `4bebec6`; giữ nguyên source/test/local tsconfig chưa commit FE-W4-02. Không checkout PR, stash/revert/merge/fetch toàn bộ, sửa source Tester 3 hoặc tích hợp FE-W4-04.
- GitHub API compare **toàn bộ base-to-head**, không chỉ commit cuối: 1 commit, 2 file, +8/-8; merge base là d421516. Bản source tải theo SHA được kiểm Git blob hash. Evidence/harness/ảnh tại `build/pr50-review-e8b95d6/` (ignored, không đưa source PR vào app).

| File của toàn PR | Diff và đối chiếu phạm vi |
|---|---|
| `src/components/merchant/video-posting-tips-modal.tsx` | Rename từ `video-guidelines-modal.tsx`; chỉ đổi tên export/interface và aria IDs, giữ nguyên nội dung 3 quy chuẩn cũ. Đúng tên file yêu cầu nhưng chưa thực hiện nội dung 4 mẹo W4. |
| `src/components/merchant/library-client.tsx:6` | Chỉ đổi import sang tên mới, alias `Guidelines` giữ nguyên. Đây là sửa import đi kèm rename hợp lý, không phải tự thân lỗi runtime hay thay đổi backend. Tuy vậy spec giao đúng 1 component tĩnh và FE Lead phụ trách tích hợp ở FE-W4-04; cần FE/PM xác nhận ngoại lệ phạm vi. Không mặc định vi phạm chỉ vì có file thứ hai. |

- Không thêm fetch/Supabase/router/AI, props dữ liệu động, dependency hoặc thay đổi core config/auth/API/DB. Props export đúng `{ isOpen: boolean; onClose: () => void }`, phù hợp caller điều khiển state. Import Library hiện gọi được về mặt API; **chưa kiểm chứng wiring toàn ứng dụng**. Rename đang thay modal Quy chuẩn, trong khi FE-W4-04 yêu cầu thêm mẹo đăng bài cho Reseller; không được thay mất chức năng quy chuẩn cũ hoặc ghi đè polish đang có trong `video-guidelines-modal.tsx` của FE-W4-02.

### Findings cần sửa trước khi sẵn sàng tích hợp

Vị trí dưới đây thuộc file pinned `src/components/merchant/video-posting-tips-modal.tsx` tại SHA e8b95d6, kể cả lỗi kế thừa từ modal cũ. Các lỗi kế thừa là khoảng trống nghiệm thu component W4, không quy thành hồi quy mới do rename.

| Mức | Vị trí | Tái hiện / mong đợi / thực tế | Hướng sửa |
|---|---|---|---|
| **P1 — bắt buộc** | `:70–107` (heading `:73`, list `:87`) | Mở modal: hiện “Quy chuẩn video du lịch”, 3 mục Khung hình/Thời lượng/Chất lượng. Spec yêu cầu “Mẹo Đăng Video AI Triệu View Dành Cho Reseller” và 4 mẹo: 11:30–13:00 + 19:30–21:30; giữ voiceover AI/BGM; caption tò mò + #DuLichDaNang #BaNaHills; link affiliate ở bio/tin nhắn tự động. Tất cả 4 nội dung này còn thiếu. | Thực hiện đúng copy đã chốt TESTER3_W4; sửa nhãn đóng phù hợp nội dung. Bàn giao tips riêng, giữ chức năng Quy chuẩn cũ; không tự thay nội dung spec. |
| **P2 — bắt buộc theo kiểm tra focus** | `:49–57`, nút cuối `:110` | Mở, focus “Đã hiểu”, nhấn Tab: cả 5 viewport focus ra BODY/browser chrome, không vòng về nút đóng. 667×320 còn không vòng Shift+Tab từ nút đóng về nút cuối. Mong đợi chu kỳ Tab/Shift+Tab giữ trong modal. Native dialog vẫn chặn focus control nền (ca inert PASS); không kết luận có thể thao tác nền. | Xử lý biên Tab/Shift+Tab theo các phần tử focusable trong dialog, giữ Escape/initial/return focus hiện đã hoạt động; test cả khi nội dung cuộn. Đây là hành vi kế thừa modal d421516. |
| **P2 — cần đạt chuẩn mobile đang áp dụng FE-W4-02** | `:65` (`size-10`) | Đo bounding box nút đóng ở 320/390/768/1440 và 667×320: **40×40px**. Mong đợi tối thiểu44×44 như modal đang polish FE-W4-02. Outline không làm tăng hit target. | Tăng vùng bấm tối thiểu44px, giữ accessible label/focus indicator; đây cũng là hạn chế kế thừa modal cũ, không phải regression do rename. |

### Điểm cần phối hợp / cải thiện, không gán thành lỗi thiết bị thật
- **`:57`, visualViewport/safe area:** max-height theo `100dvh`, margin2rem; không dùng cơ chế visualViewport/safe insets của modal FE-W4-02. Probe tổng hợp height380/offsetTop80 ở390×844 cho dialog `{x:16,y:109,width:358,height:626}`, đáy735 vượt vùng probe kết thúc460. Đây là bằng chứng component chưa phản ứng với dữ liệu visualViewport mô phỏng, **không phải tái hiện bàn phím/Safari iOS thật**. Viewport thường và landscape667×320 vẫn nằm trong màn hình, nội dung cuộn được. FE Lead cần thống nhất reuse cơ chế viewport/safe area ở lần tích hợp; T3 không tự sửa core/local FE-W4-02. Safe area notch thật còn phải QA.
- Nhánh thực tế khác nhánh cho phép `feature/fe-t3-video-tips-guide`. Cần FE Lead + PM xác nhận tên nhánh và việc rename/import ở trên, hoặc T3 thu hẹp bàn giao thành component mới theo spec. Chưa có bằng chứng ngoại lệ đã được phê duyệt.
- Không kiểm thử hai dialog chồng nhau hoặc app wiring/Reseller vì chưa tích hợp. Không coi kết quả cô lập là nghiệm thu modal/layout toàn app. Khi FE-W4-04 được phép làm, kiểm lại chuyển modal, scroll owner và focus cùng FE-W4-02.

### Kiểm chứng có mục tiêu và giới hạn
- Harness React StrictMode cô lập dùng **nguyên source pinned**, bundle Webpack riêng; stylesheet lấy từ CSS thực của preview3114. HTTP server tạm dùng cổng tự cấp, chỉ phục vụ fixture/static GET; browser chặn origin/method khác, không request service/AI/DB. Không sửa assertion/source PR để đạt pass. Đã sửa lỗi harness remount mỗi lần mở, chạy lại toàn bộ harness với **cùng instance** và kiểm DOM identity 10 vòng.
- `node build/pr50-review-e8b95d6/build-harness.cjs`: PASS build harness. TypeScript strict noEmit qua tsconfig cô lập **chỉ component**: PASS. ESLint qua stdin đúng filename của **cả 2 file pinned**: 0 errors/0 warnings (`lint-component.json`, `lint-library.json`). Không thay tsconfig/env của app, không tắt typecheck.
- `node build/pr50-review-e8b95d6/review.mjs`: **39 PASS / 15 FAIL trên54 checks**, exit1 giữ nguyên failures. 15 checks không phải15 lỗi riêng: 5 target40px + 5 forward Tab + 1 reverse Tab landscape + 3 nội dung + 1 probe visualViewport. Chi tiết `results.json`.
- **PASS:** 320×740,390×844,768×900,1440×1000,667×320 bounds; initial focus/ARIA IDs; nền inert; body+document scroll lock; Escape/return focus/restore scroll; reduced motion theo CSS app; long-content DOM stress cuộn tới footer và đóng; 10 vòng mở/đóng cùng instance; unmount trả đúng overflow trước đó (`clip`/`auto`). Không runtime error/request service. Text contrast đo theo màu computed đang dùng: nhỏ nhất4.577:1, đạt4.5:1 ở text thường; đây không phải audit mọi theme/state.
- Đã chụp và **xem ảnh** 320px và landscape667×320; bộ ảnh đủ320/390/768/1440/landscape, long-content và probe trong thư mục evidence. Ảnh cho thấy nội dung cũ, modal cuộn ở màn hình thấp; không có bằng chứng layout tràn ngang ở các viewport đã thử.
- **Chưa chạy / chưa chứng minh:** full-app PR typecheck/build/lint, toàn bộ Playwright repository, wiring Merchant/Reseller/FE-W4-04, Safari/WebKit hay điện thoại thật, notch/keyboard thật, real MP4/download/storage/renderer. Nội dung dài là DOM stress, visualViewport là probe tổng hợp. Quan sát người dùng trước đây trên3114 chỉ là preview hiện tại, không phải PR đã tích hợp; không nâng thành nghiệm thu dữ liệu/thiết bị thật.

### Quyết định bàn giao và bước tiếp theo
- **FE-W4-03: local review NEEDS_CHANGES; cần Tester 3 sửa trước**, sau đó gửi SHA mới để so toàn diff và chạy lại checks liên quan. Chỉ có thể chuẩn bị checklist/kế hoạch tích hợp, **FE-W4-04 chưa sẵn sàng triển khai**.
- Theo TESTER3_W4 và quy tắc Sprint4 cần **2 approvals: FE Lead Cao Thị Thu Diệu + PM/BE1 Nguyễn Minh Tuệ**, đủ lint/tsc theo DoD, xác nhận phạm vi/nhánh. API reviews sau kiểm thử trả `[]`; lượt này không đăng comment/review/approval, không merge. `mergeable:true` không thay thế approval.
- Bảo toàn FE-W4-02 bằng SHA256 các17 file source/test/local config đã dirty/untracked đầu lượt (`worktree-before.json`): kiểm tra cuối tất cả trùng byte, không thay source PR/app. Chỉ cập nhật tài liệu FE và tạo artifacts ignored; `git diff --check` PASS, không stage. Preview3114 giữ chạy; GET `http://127.0.0.1:3114/preview/merchant/library` trước bàn giao trả **HTTP200, HTML có marker Fixture**.
- **Tin nhắn t/m, soạn để người dùng gửi, chưa gửi:** “t review PR #50 SHA e8b95d6 rồi. m bổ sung đúng tiêu đề + 4 mẹo trong TESTER3_W4, sửa vòng Tab/Shift+Tab và tăng vùng bấm nút đóng lên44px nhé. PR đang rename modal Quy chuẩn + đổi import Library; m trao đổi với t/PM về phạm vi/tên nhánh để giữ chức năng Quy chuẩn cũ và không đè polish FE-W4-02. Xong gửi t SHA mới, kết quả lint/tsc và ảnh mobile/desktop để t kiểm lại trước 2 approvals.”

## 11. FE-W4-01 — loại bỏ fallback rewrite sai video, 29/10/2026

### Nguyên nhân và quyết định trong phạm vi được phép
- Người dùng cho phép sửa cấu hình FE có mục tiêu trong lượt này. Đã đọc AGENTS.md, Next16.3.8 local docs `rewrites.md`/`public-folder.md`, next.config.ts, player/download/preview, các caller và tests; kiểm tra status/diff và lưu hash các file đang thay đổi tại `build/fe-w4-rewrite-audit/before.json`. Giữ nhánh/HEAD/worktree hiện tại, mọi source/test/local config FE-W4-01/02 đã có; chỉ thêm thay đổi liệt kê dưới đây. Không thay backend/storage/DB/quyền/env hoặc commit/push/merge.
- Rewrite mảng `/campaign-videos/:path*` → `/campaign-videos/banahills-remediated.mp4` được Next áp dụng sau filesystem. File có thật đi thẳng, nhưng file thiếu bị proxy sang mẫu, che mất404 và giữ URL chiến dịch bên ngoài. Trước sửa GET `/campaign-videos/w4-rewrite-nonexistent.mp4` **200 video/mp4,2,556,563bytes, SHA256 d10e8e3211390507e9407ba5b711da8357c84e0f7e6eb7488dbbf0b7c8e1bcc1**, trùng mẫu; evidence `before-http.json`.
- **Luồng mẫu:** `app/preview/merchant/library/preview.tsx` chọn URL mẫu cụ thể `/campaign-videos/banahills-remediated.mp4` trong khu vực có nhãn Fixture/Mô phỏng. File vật lý duy nhất hiện có trong `public/campaign-videos/` được giữ nguyên đường dẫn/bytes. Browser tests dùng file này có chủ đích. Không cần wildcard để phát mẫu.
- **Luồng kết quả:** Merchant generation truyền `result.video_url` vào shared VideoPlayer; Reseller Content Kit lấy URL đã có sau gate. Helper `playableVideoUrl`/`fetchVideoMp4` không thay sample; lỗi rewrite là tại routing. Backend mock sinh URL absolute `storage.travellink.vn` được FE nhận diện/chặn; docs BE1 demo riêng dùng absolute localhost54321 storage URL. Không có caller/demo đã tìm thấy bắt buộc alias wildcard local. Không sửa contract/domain/mock backend hay tạo/upload video để kiểm thử.

### File sửa
1. `next.config.ts`: bỏ riêng wildcard rewrites; giữ devIndicators, distDir, allowedDevOrigins và headers SW. Public files vẫn được phục vụ đúng URL có thật, file thiếu dùng404 chuẩn Next. Không chặn toàn namespace, không rewrite sang trang lỗi200 hoặc alias mẫu khác.
2. `app/preview/merchant/library/preview.tsx`: ca “URL hết hạn / HTTP lỗi” chuyển tới `/campaign-videos/fixture-video-unavailable.mp4` để thử trực tiếp namespace từng bị che lỗi. Sample vẫn trỏ file thật có tên rõ ràng, UI có nhãn mẫu; không đổi sang video giả.
3. `tests/video-player-browser.mjs`: chỉ cập nhật route mock403 tương ứng URL fixture mới; giữ toàn bộ assertion và timeout.
4. `tests/video-rewrite-browser.mjs` mới: hồi quy HTTP thật + browser kết quả lỗi; chi tiết bên dưới. Không sửa player/download để che lỗi.
5. Tài liệu FE_W4.md và chỉ phần FE TEAM_WORK_LOG.md. Artifacts ignored ở `build/fe-w4-rewrite-audit/`.

### Kiểm chứng
- `node tests/video-rewrite-browser.mjs`: **PASS**. URL mẫu GET200 video/mp4/hash trùng file; Range bytes0–31 trả206 và đúng bytes. Native video phát được (videoWidth>0); download MP4 đúng hash. Bốn URL thiếu (fixture, kết quả, query và nested path) **GET404 + HEAD404**, không MIME video/mp4, body hash khác mẫu.
- Browser không mock media404: player hiện “Không phát được video”, download hiện HTTP404, không phát sinh download mới. Browser mô phỏng riêng response provider tại boundary để dùng **UI kết quả production** với URL local thiếu: src và “Mở video gốc” giữ URL trả về, error đúng, không request sample hoặc tải nhầm file. Đây là **kiểm chứng UI với dữ liệu mô phỏng, không tạo video thật**. API routes được browser fulfill, mọi service/origin khác bị chặn; không gửi POST tới server/AI/DB.
- Đã chụp/xem ảnh lỗi ở `fixture-real-404.png` và `result-real-404.png`; `after-http.json` ghi status/hash/request list. Ca lỗi chỉ có request URL thiếu, không sample; download count giữ1 từ ca sample hợp lệ.
- TypeScript toàn worktree `tsc --noEmit --incremental false`: PASS. Scoped ESLint next.config/preview/2browser scripts: không diagnostics. Unit delivery/media-library/merchant-video schema+service mock: **18/18 PASS**,0skipped. Node có warning package chưa khai báo module type; không đổi package/dependencies.
- Hồi quy browser player/modal cũ: lần chạy đồng thời build timeout20s khi chờ download tại `tests/video-player-browser.mjs:54`; chưa quy thành lỗi môi trường hoặc code. Giữ failure này và chạy lại riêng sau build, không tăng timeout/làm yếu assertion.
- **Build Webpack:** `NEXT_BUILD_DIR=build/fe-w4-production npm.cmd run build -- --webpack` PASS, gồm TypeScript,32static pages và traces. `routes-manifest.json` xác nhận `beforeFiles/afterFiles/fallback` đều rỗng. Output production riêng, không đổi env file/tsconfig.
- **Browser chạy lại riêng sau build:** `node tests/video-player-browser.mjs` PASS, exit0, giữ nguyên20s timeout/assertions:320/390/768/1440, playback540×960, download/hash,403mock, sai MIME/rỗng/mạng, duplicate/source switch, modal focus/đóng khi đang tải/cleanup. Lần timeout trước không tái diễn; chỉ ghi nhận xảy ra khi chạy đồng thời build, chưa chứng minh nguyên nhân hệ thống cụ thể. Không xóa failure khỏi báo cáo.
- `git diff --check` PASS. SHA256 của toàn bộ17file source/test/local config dirty/untracked trước lượt trùng manifest cuối; chỉ2tài liệu trong snapshot được cập nhật có chủ đích. Không stage/commit; không chạy toàn bộ repo/QA live/device. Các suites không liên quan không được suy ra PASS từ lượt này.

### Trạng thái và thử thủ công
- **Blocker rewrite đã được xử lý trong cấu hình FE local**; các mô tả “rewrite còn blocker” ở mục8/9/10 là lịch sử trước lượt sửa này. Không nâng FE-W4-01 thành DONE: backend mock/readiness/approval/persona, MP4 thật/MIME/CORS/expiry, realme C21Y/Safari iOS và lưu file trên thiết bị thật vẫn chưa được nghiệm thu. Review PR50 và blocker FE-W4-04 ở mục10 không thay đổi.
- Thử `http://127.0.0.1:3114/preview/merchant/library`, tới “Kiểm thử phát và tải MP4 · Fixture”: chọn sample để phát/tải, chọn “URL hết hạn / HTTP lỗi” để thấy lỗi phát và HTTP404 khi tải. Không bấm tạo AI trên portal thật.
- URL mẫu hợp lệ: `http://127.0.0.1:3114/campaign-videos/banahills-remediated.mp4`; URL lỗi404: `http://127.0.0.1:3114/campaign-videos/fixture-video-unavailable.mp4`. Không yêu cầu signed URL hết hạn thật; đây là404 file không tồn tại.
- Preview3114 tự restart khi Next phát hiện đổi config, vẫn dùng output `build/fe-w4-preview`; không dừng server khác, không xóa cache. Trước bàn giao xác minh Library HTTP200, sample200 và file thiếu404; giữ server chạy để người dùng thử.

## 12. FE-W4-03 — review lại PR #50 tại HEAD aba5490, 29/10/2026 (UTC+7)

### Nguồn, SHA và diff đã kiểm tra
- GitHub API đầu/cuối lượt xác nhận HEAD mới **`aba5490d07c88b29eda6dd6857c9d9657307fd98`**, khác bản đã review `e8b95d6730fab7996562d9b39b3b798293d3c6dc`. PR vẫn open, nhánh `feat/video-posting-tips-modal`, base dev `d4215160ca99f32dd32d79e474c474dd5383663b`. Dựa trên API/source pinned, không dựa riêng thông báo đã sửa.
- Compare bản cũ→mới: **3 commit mới,3file** (Library đổi, Guidelines được phục hồi, Tips viết lại). Compare **toàn PR base→HEAD:4commit,2file,+160/-3**: `src/components/merchant/library-client.tsx` modified+5/-3; `src/components/merchant/video-posting-tips-modal.tsx` added155lines. Guidelines không còn là file thay đổi so base.
- Đọc AGENTS.md, local Next client/server docs, TESTER3_W4, FE_W4 và diff/status. Worktree/branch/HEAD giữ nguyên `feature/fe-w4-video-player-pwa-polish` tại `4bebec6`. Hash **21file source/test/local config dirty/untracked đầu lượt** cuối lượt đều trùng, gồm sửa rewrite và FE-W4-01/02; không checkout PR hoặc sửa source Tester 3. Chỉ sửa2tài liệu FE và tạo artifacts ignored.
- Evidence `build/pr50-review-aba5490/`: snapshot PR/2comparisons/reviews,3source pinned theo SHA, blob hashes đối chiếu GitHub, component-delta.diff, baseline Guidelines, harness/ảnh/lint/results. Bản e8b95d6 và evidence trước giữ nguyên.

### Ba findings cũ: đã sửa ở SHA mới
| Finding cũ | Trạng thái / bằng chứng |
|---|---|
| P1 sai tiêu đề/thiếu4mẹo; thay mất Quy chuẩn cũ | **ĐÃ SỬA** ở Tips `:11–35/:115–120`: tiêu đề exact,4cards có icon, đủ giờ11:30–13:00/19:30–21:30, voiceover+BGM,2hashtags,bio/tin nhắn tự động. Copy đúng nội dung spec, không tự đổi source trong review. Pinned Guidelines bằng baseline d421516 sau chuẩn hóa newline, không bị xóa/rename trong toàn PR. Harness riêng mở Guidelines thấy đúng tiêu đề/3quy chuẩn, Escape và return focus PASS; caller Library vẫn import/render Guidelines riêng. Đây chưa phải test Library toàn app. |
| P2 Tab/Shift+Tab thoát BODY | **ĐÃ SỬA** ở `:60–85`: hai chiều wrap PASS tại320/390/768/1440 và667×320; thêm12bước Tab/Shift+Tab mỗi viewport đều giữ focus trong modal. Không đánh đồng với probe focus nền bằng script ở finding mới dưới đây. |
| P2 nút đóng40×40 | **ĐÃ SỬA** `:106`: class `size-[46px]`; bounding box thực **46×46px cả5viewport**, đạt44px. Compile Tailwind riêng từ đúng classes source pinned để không đo sai vì CSS app chưa chứa class mới. |

### Findings mới khi đổi native dialog sang custom overlay
Các vị trí dưới đây thuộc `src/components/merchant/video-posting-tips-modal.tsx` tại aba5490.

| Mức | Vị trí | Tái hiện / mong đợi / thực tế | Hướng sửa |
|---|---|---|---|
| **P2 — bắt buộc: Escape không đóng** | `:60–61/:91–98` | Mở Mẹo, focus nút đóng/Đã hiểu, nhấn Escape: modal vẫn mở ở cả5viewport. Trước đây native dialog có onCancel. Mong đợi gọi onClose và trả focus; hiện handler bỏ mọi key khác Tab. | Thêm xử lý Escape/onClose và test return focus; có thể giữ native dialog cùng xử lý Tab đã sửa để giữ semantics modal. Không bỏ vòng Tab mới. |
| **P2 — bắt buộc: nền vẫn cuộn** | effect `:48–58`, overlay `:91` | Nền có nội dung dài; mở modal rồi wheel500px ngoài panel (x2,y=height−2): scrollY từ0→**500** ở cả5viewport. Mong đợi nền khóa, nội dung dialog vẫn cuộn và trả overflow khi đóng/unmount. Custom overlay fixed không khóa body/document; effect chỉ focus/restore. | Khóa/khôi phục scroll owner khi mở/đóng/unmount, giữ giá trị overflow có trước, phối hợp cơ chế modal FE-W4-02. Không tự sửa shared/core trong PR trainee khi chưa chốt phạm vi. |
| **P2 — khoảng trống isolation sau bỏ native dialog** | `:91–98` | Khi modal mở, `document.querySelector('#outside').focus()` trong fixture đưa activeElement ra control nền; lặp cả5viewport. Mong đợi modal thực sự cô lập nền. `aria-modal=true` chỉ khai báo; hiện không inert hay guard focus ngoài panel. **Normal Tab/Shift+Tab từ trong panel vẫn PASS**, không kết luận thao tác Tab đó gây thoát. | Ưu tiên native showModal hoặc cơ chế inert/focus guard có cleanup phù hợp app; kiểm lại mọi probe focus/return/Escape. Không coi aria-modal tự tạo hành vi native. |

- **Điểm phối hợp còn lại, chưa quy thành lỗi iOS:** `:99` vẫn chỉ `100dvh`/p4, không phản ứng visualViewport probe height380/offset80; bounds390px `{x:16,y:16,width:358,height:812}` không nằm trong vùng probe. Cần FE Lead chốt reuse safe-area/viewport của FE-W4-02 khi tích hợp. Đây là probe tổng hợp; viewport thường/landscape bounds và cuộn nội dung dài PASS, chưa thử notch/keyboard/Safari thật.

### Rename/import, scope và tương thích
- Guidelines đã phục hồi đúng bản base, không còn đụng file Guidelines đang polish trong worktree; giữ API `{isOpen,onClose}` của Tips, không fetch/Supabase/router/AI/dependency/core mới.
- **Library không còn chỉ đổi import:** `library-client.tsx:7/:25/:44/:78` thêm import, state tipsOpen, nút “Mẹo đăng video hiệu quả” và render Tips bên cạnh Guidelines. Cả2nút/state riêng nên source giữ chức năng cũ; nhưng đây là phần nối UI vào Merchant, vượt deliverable đúng1component và cần phân định với FE-W4-04 (Reseller do FE Lead tích hợp). Cần FE/PM xác nhận ngoại lệ/điều chỉnh bàn giao; không kết luận chỉ vì có file thứ2, không giả định exception đã duyệt.
- Nhánh thực tế vẫn khác `feature/fe-t3-video-tips-guide` quy định. Không thấy chứng cứ phê duyệt ngoại lệ qua API reviews. Không đổi nhánh hoặc sửa giúp T3.
- Review source không cho thấy nghiệp vụ mới ngoài việc thêm nút/modal; không sửa query/request/gate. Tuy nhiên chưa kiểm full Library wiring, hai modal chồng nhau, native top-layer so z50, Reseller hay khả năng phối hợp scroll owner với FE-W4-02. Các phần đó phải kiểm sau khi được phép tích hợp; không ghi đè code hiện tại.

### Kiểm chứng cô lập
- Dùng nguyên source GitHub pinned, kiểm cả3Git blob SHA. React StrictMode harness riêng, có Guidelines riêng; bundle Webpack harness PASS. CSS app preview thật + Tailwind compile riêng từ app/globals.css và các classes pinned (gồm46px); chỉ artifacts ignored, không sửa app/globals/source/config/env. HTTP harness cổng tự cấp chỉ GETstatic, browser chặn origin/method khác; không API/service/data write.
- Scoped strict TypeScript **component Tips** qua tsconfig riêng PASS. ESLint stdin với filename canonical của **cả2file toàn PR**:0errors/0warnings (`lint-component.json`, `lint-library.json`). Không suy ra full-app PR tsc/lint/build đã pass. Không tắt typecheck hoặc suppression.
- Browser Chrome156,320×740/390×844/768×900/1440×1000/667×320: **48PASS/16FAIL trên64checks**, exit1. Failures là5Escape +5background focus +5background scroll +1probevisualViewport; không phải16bug độc lập.
- PASS initial focus/ARIA, normal keyboard vòng12bước,46px, bounds/không ngang overflow, reduced motion, text contrast (min4.577:1 ở text thường),4tips, close button/Đã hiểu/return focus, long-content DOM stress cuộn tới footer,10vòng mở/đóng **cùng component instance** và unmount khôi phục focus/giữ overflow trước đó. Vì source render null khi đóng, không dùng DOM identity để suy ra component bị remount; wrapper mount count giữ nguyên. Cleanup PASS không có nghĩa scroll đã được khóa khi mở.
- Đã chụp bộảnh5viewport và long-content; **đã xem ảnh320px và667×320**. Trên màn hình thấp nội dung cuộn trong panel; footer truy cập được. Chưa kiểm mọi theme/state.
- Sửa lỗi đo trong harness: lượt đầu poll scrollY=0 có thể đọc trước khi wheel xử lý. Lượt cuối có ca đối chứng nền cuộn được trước mở, chờ200ms để input wheel được xử lý rồi assert khóa nền; thực tế500px. Giữ `preliminary-results.json` và kết quả cuối; không tăng timeout assertion, không sửa/làm yếu source/assertion để pass.
- Chưa chạy full-app PR suite/build/typecheck, tích hợpFE-W4-04, Safari/WebKit/điện thoại thật, safe inset/keyboard thật hoặc live video/storage/download. Không tái chạy hồi quy rewrite không liên quan; GET cuối xác nhận Library200/sample200/missing404, không nâng thành nghiệm thu video thật.

### Approvals, kết luận và bàn giao
- API reviews đầu/cuối lượt vẫn **`[]`**. `mergeable` đầu lượtfalse, cuối lượttrue tại **cùng HEAD**; không còn căn cứ ghi blocker conflict, cũng không suy ra có approval. Chưa đăng comment/review/approval hoặc merge.
- Theo TESTER3_W4/FE_W4 cần **2approvals FE Lead Diệu + PM/BE1 Tuệ**, kết quả full lint/tsc đúng DoD và xác nhận ngoại lệ phạm vi/nhánh trước merge. Scoped checks trên không thay đủ DoD repository.
- **FE-W4-03 vẫn NEEDS_CHANGES local; FE-W4-04 chưa đủ điều kiện triển khai.** Có thể chuẩn bị checklist, nhưng cần T3 sửa Escape/scroll/isolation, bàn giao SHA mới để review lại, chốt scope/branch và approvals. Các kết luận mới mục12 thay trạng thái cũ mục10 cho HEAD aba5490; rewrite fix mục11 vẫn giữ nguyên.
- Cổng3114 đầu lượt không có listener/ECONNREFUSED, đã khởi động lại **đúng worktree/3114**, `NEXT_BUILD_DIR=build/fe-w4-preview`, `npm.cmd run dev -- --webpack --hostname 127.0.0.1 --port 3114`. Không dừng server khác/xóa cache/sửa envfile. Trước bàn giao GET Library200, sample200, missing404; giữ server chạy. Logs riêng `preview.stdout.log`/`preview.stderr.log` trong evidence.
- **Tin nhắn t/m — soạn, chưa gửi:** “t review lại PR50 SHA aba5490 rồi: tiêu đề/4mẹo, vòng Tab cả667×320 và nút đóng46px đã pass; Quy chuẩn cũ đã riêng. m sửa tiếp Escape đang không đóng, khóa/khôi phục cuộn nền và cô lập focus nền khi dùng overlay nhé. Library hiện thêm state/nút/render modal nên m chốt scope/tên nhánh với t/PM; giữ phần Quy chuẩn/polish FE-W4-02. Xong gửi SHA mới + lint/tsc để t kiểm lại trước2approvals.”

## 13. FE-W4-03 — review HEAD 4f96a33, 29/10/2026 (UTC+7)

### Nguồn và bảo toàn
- GitHub API xác minh đầu và cuối lượt: HEAD **`4f96a339f2a628a04a287841b0922a10626084ab`**, khác bản `aba5490d07c88b29eda6dd6857c9d9657307fd98`; PR #50 open, chưa merge, nhánh `feat/video-posting-tips-modal`, base dev `d4215160ca99f32dd32d79e474c474dd5383663b`.
- Đã đọc AGENTS.md, Next local client/server guide, TESTER3_W4, FE_W4, status/diff và modal hiện có. Không checkout/fetch toàn bộ, pull/merge/cherry-pick/đổi nhánh, sửa source T3/app hoặc tích hợp FE-W4-04. Snapshot hash các file đang thay đổi trước lượt tại `build/pr50-review-4f96a33/worktree-before.json`; giữ nguyên FE-W4-01/02, rewrite và local config chưa commit. Chỉ cập nhật hai tài liệu FE và artifacts ignored.
- Compare aba5490→HEAD: **1 commit mới, chỉ Tips thay đổi +77/-94**. Toàn PR base→HEAD: **5 commit, 2 file, +143/-3**: `src/components/merchant/library-client.tsx` modified +5/-3; `src/components/merchant/video-posting-tips-modal.tsx` added 138 dòng. Đã đọc toàn diff PR và lưu component-delta.diff, không chỉ đọc commit cuối.
- Source tải theo SHA và kiểm Git blob hash: Tips `c7803bbfec3bae014a988e0756d902cfab920da4`; Library `05dce61570942dc6cdd536b621f6a70f33a24a42`; Guidelines `d47b35c5f8e88341bf8de9a738b3942e6eca8360`. Library và Guidelines không đổi so aba5490; Guidelines vẫn bằng base, không bị rename/xóa trong toàn PR.

### Checklist lịch sử đầy đủ
Tiêu đề/nội dung và bảo toàn Quy chuẩn là hai khía cạnh của **cùng finding P1 ban đầu**; tách hàng dưới đây để đối chiếu đủ sáu mục người dùng yêu cầu, không coi thành hai lỗi mới.

| Mục kiểm tra | Trạng thái tại 4f96a33 | Bằng chứng |
|---|---|---|
| 1. Tiêu đề exact và đủ 4 mẹo | **ĐÃ SỬA / vẫn PASS** | Tips `:11–35/:98–103`, heading đúng; 4 cards có icon, đủ giờ, voiceover/BGM, hai hashtags, bio/tin nhắn tự động. Không tự sửa copy khi review. |
| 2. Quy chuẩn video riêng | **ĐÃ SỬA / vẫn PASS** | Guidelines bằng base, import/state/render riêng trong Library. Harness mở đúng modal Quy chuẩn với 3 mục, Escape/return focus pass. Chưa suy ra full Library app đã nghiệm thu. |
| 3. Tab/Shift+Tab vòng trong modal, cả 667×320 | **CHƯA ĐẠT — tái lỗi sau aba5490** | Bỏ handler trapFocus khi đổi về native dialog; ca vòng Tab không còn pass đồng đều. 667×320: Tab từ Đã hiểu ra BODY; Shift+Tab từ nút đóng tới DIALOG thay vì Đã hiểu. Chi tiết finding dưới đây. |
| 4. Nút đóng tối thiểu 44×44 | **ĐÃ SỬA / vẫn PASS** | `:90` giữ `size-[46px]`, đo 46×46 ở cả năm viewport. |
| 5. Escape và return focus | **ĐÃ SỬA** | `:79–82` onCancel gọi onClose; `:66–70` cleanup đóng dialog/trả opener. Cả năm viewport pass. |
| 6. Khóa/khôi phục cuộn và cô lập tương tác/focus nền | **ĐÃ SỬA** | `:61–68` showModal + body/document overflow hidden/restore; wheel ngoài panel không cuộn nền, pointer không kích hoạt control nền và script `.focus()` không đưa focus vào control nền, cả năm viewport pass. Restore cả overflow có trước khi unmount pass. Không đánh đồng nền inert với việc vòng Tab có thể đi tới BODY/browser chrome. |

### Finding bắt buộc còn lại
- **P2 — vòng Tab/Shift+Tab tái lỗi**, file `src/components/merchant/video-posting-tips-modal.tsx:75–83` (dialog không còn onKeyDown), nút cuối `:128–135`.
- **Tái hiện:** mở Mẹo, focus “Đã hiểu”, nhấn Tab; ở 320×740, 390×844, 1440×1000 và **667×320** activeElement thành **BODY**, ngoài dialog. Ca này pass riêng ở 768×900. Từ nút đóng, Shift+Tab tới **DIALOG** tại 320/390/667, tới **BODY** tại 768/1440; không viewport nào đạt vòng về Đã hiểu. Chuỗi 12 bước keyboard cũng fail cả năm viewport.
- **Mong đợi:** Tab cuối→đầu và Shift+Tab đầu→cuối, focus luôn trong modal theo yêu cầu; **thực tế** native dialog vẫn làm control nền inert nhưng cho chu kỳ focus khác yêu cầu/browser chrome. Không kết luận control nền có thể bấm/focus bằng người dùng từ lỗi này; các probe nền đều pass.
- **Nguyên nhân có bằng chứng diff:** commit mới xóa `focusableSelector` và `trapFocus` của aba5490, không gắn xử lý biên tương ứng vào native dialog. Việc dùng native dialog hợp lý cho top-layer/Escape/inert; không yêu cầu bỏ nó hay viết lại toàn bộ cơ chế.
- **Hướng sửa:** giữ showModal/onCancel/scroll/cleanup hiện đã pass; bổ sung hoặc reuse xử lý biên Tab/Shift+Tab đúng cách và chạy lại assertions cả hai chiều. Modal generation hiện có trong worktree đã dùng native dialog cùng xử lý biên tại `video-generate-modal.tsx:306`; đây là tham chiếu cách phối hợp, không yêu cầu T3 sửa file generation/core. Lượt review không làm thay source.
- Probe visualViewport fail `{x:16,y:16,width:358,height:812}` được điều tra riêng ở mục14: xác nhận gap đáp ứng visualViewport độc lập Tab trong mô phỏng, cần xử lý/chốt trách nhiệm tương thích FE-W4-02 trước nghiệm thu tích hợp. Chưa phải lỗi bàn phím/Safari thật đã tái hiện; không gộp vào lỗi Tab hoặc mặc định bỏ qua vì là probe.

### Harness, lifecycle và modal hiện có
- Tái sử dụng harness/assertions từ aba5490, nguyên source pinned; React StrictMode, CSS thực app + Tailwind compile các class pinned riêng. Bundle harness PASS. Không sửa source Tester 3, tắt typecheck, tăng timeout hoặc giảm assertion để đạt pass.
- Chỉ điều chỉnh locator theo `aria-labelledby` để phân biệt hai native dialog. Native dialog đóng vẫn ở DOM, nên assertions đóng chuyển từ DOM count=0 sang **not visible + return focus**, đúng semantics; assertion unmount vẫn count=0. Giữ toàn bộ assertions keyboard/focus/scroll/content/target cũ, bổ sung pointer nền và stacked dialogs. Lượt chạy lại chỉ thêm log activeElement trước assertion để làm rõ bằng chứng, giữ cùng failures.
- Bản này dùng **native HTML dialog**, không import một shared Dialog component. Cách showModal/onCancel/overflow/focus tương đồng modal Guidelines/generation trong repo; không đòi viết cơ chế thay native chỉ vì thay implementation.
- Browser Chrome156: **55 PASS / 15 FAIL trên 70 checks**, exit1. 15 failures gồm **14 assertions keyboard** (4 forward, 5 reverse, 5 chuỗi focus) + **1 probe visualViewport**; không phải 15 bug độc lập. Viewport: 320×740, 390×844, 768×900, 1440×1000, 667×320. `results.json` ghi activeElement theo chiều/viewport; `first-results.json` giữ lần chạy trước bổ sung logging.
- PASS: initial focus/ARIA, 46px, bounds/không tràn ngang, contrast (text thường min4.577:1), reduced motion, đủ nội dung, Escape, nút đóng/Đã hiểu, return focus, wheel lock, programmatic focus isolation, pointer isolation; long-content DOM stress cuộn tới footer; 10 lần đóng/mở cùng instance **xen kẽ Escape và Đã hiểu**; unmount trả focus và khôi phục overflow có trước (`clip`/`auto`).
- **Tương tác modal chuẩn:** Guidelines riêng mở/đóng pass. Harness xếp Tips lên Guidelines native đang mở: Escape đóng Tips, focus trả nút đóng Guidelines, nền còn hidden; Escape tiếp đóng Guidelines, focus về opener và overflow trả như ban đầu. Đây là kiểm chứng stack hai component pinned trong fixture, chưa phải wiring toàn ứng dụng/FE-W4-02 hoặc generation thật.
- Scoped strict TypeScript component Tips: **PASS**. ESLint stdin đúng canonical filename **cả hai file PR: 0 errors/0 warnings**. Không tuyên bố full-app PR lint/tsc/build hoặc toàn bộ suite đã pass. Không gọi API tạo dữ liệu; harness chỉ GET static, chặn service/origin khác.
- Đã chụp ảnh đủ năm viewport/nội dung dài và **xem ảnh 320px/667×320**. Trên màn hình thấp panel cuộn và footer tới được. Chưa kiểm mọi theme/state, Safari/WebKit/điện thoại thật, notch/keyboard thật, video/storage/MP4 thật hoặc tích hợp FE-W4-04.

### Scope, approvals và điều kiện FE-W4-04
- Library không đổi so aba5490: thêm icon/import, tipsOpen, nút Mẹo và render Tips riêng ở `:7/:25/:44/:78`; không đổi query/transport/gate hoặc thêm nghiệp vụ mạng. Đây là nối UI Merchant, **không tự thân là lỗi chức năng**. Cần FE/PM chốt phạm vi giao một component và phần tích hợp FE Lead/Reseller của FE-W4-04; không coi mọi file ngoài component là vi phạm tự động. Nhánh vẫn khác nhánh quy định `feature/fe-t3-video-tips-guide`, chưa có chứng cứ chấp thuận ngoại lệ.
- GitHub reviews cuối lượt **`[]`**, chưa có hai approvals Diệu + Tuệ theo repo. `mergeable` đầu lượtfalse, cuối lượttrue tại cùng HEAD; không suy ra conflict cố định hoặc approval từ metadata đó. Không đăng comment/review/approval/merge.
- **FE-W4-03 vẫn NEEDS_CHANGES local** vì vòng Tab; ngoài ra còn **gap visualViewport độc lập**, được làm rõ ở mục14, không còn mô tả là “duy nhất Tab” cho toàn bộ tương thích mobile. **FE-W4-04 chưa đủ điều kiện triển khai**. Tiếp theo T3 giữ các sửa đã pass, sửa biên Tab, gửi SHA mới; FE/PM chốt trách nhiệm đáp ứng viewport giữa dumb component và tích hợp FE-W4-02, scope/branch, đủ lint/tsc DoD và hai approvals trước tích hợp. Vẫn cần xác minh real-device/full-app. Mục13/14 thay trạng thái mục12 cho HEAD 4f96a33, giữ lịch sử các finding.
- Artifacts ở `build/pr50-review-4f96a33/`; không stage/commit/push, không sửa env/DB/backend/rewrite hoặc dữ liệu. Kiểm tra cuối: cả 21 file source/test/local config đầu lượt trùng SHA256, branch/HEAD giữ nguyên; diff-check PASS, không staged file. Preview3114 giữ nguyên server, GET Library200/sample200/missing404 trước bàn giao.
- **Tin nhắn t/m — soạn, chưa gửi:** “t review PR50 SHA4f96a33 rồi: Escape, khóa/khôi phục cuộn, chặn focus/tương tác nền và lifecycle đã pass; tiêu đề/4mẹo/Quy chuẩn riêng/nút46px vẫn đúng. Còn vòng Tab tái lỗi khi bỏ trapFocus:667×320 Tab từ Đã hiểu ra BODY, Shift+Tab từ nút đóng về DIALOG. m giữ native dialog và các sửa đã pass, bổ sung xử lý biên hai chiều rồi gửi SHA mới + lint/tsc nhé. Scope Library/tên nhánh vẫn cần chốt với t/PM trước approvals.”

## 14. Làm rõ probe visualViewport tại 4f96a33 — 29/10/2026

### Assertion, expected và actual
Assertion gốc giữ nguyên trong evidence mục13, không bị bỏ hoặc đổi để pass:
```js
assert(b.y >= 92 && b.y + b.height <= 448, JSON.stringify(b));
```
- Harness có layout viewport **390×844**. Probe dùng `Object.defineProperty` ghi đè giá trị đọc `visualViewport.height=380`, `offsetTop=80`, rồi dispatch `resize`. Vùng visual giả lập là **[80,460]**. Expected chừa tối thiểu12px mỗi đầu: **top≥92, bottom≤448**, tương đương height≤356 khi nằm trọn vùng đó.
- **Nguồn expectation12px:** tiêu chí fit/safe inset của `.surface.surface` FE-W4-02 (min12px trên/dưới), không phải yêu cầu tự động của native dialog, cũng không phải con số ghi trong spec nội dung TESTER3_W4. Probe kiểm khả năng tương thích với chiến lược FE-W4-02; không phải phép thử mọi implementation CSS phải tự phản ứng với getter giả lập.
- **Actual PR pinned:** `{x:16,y:16,width:358,height:812}`, bottom**828**; top thiếu76px so giới hạn92, đáy vượt380px so448. Cả đo ngay và sau hai requestAnimationFrame đều fail. Không nhấn Tab hoặc Escape trong đối chứng này, nên độc lập finding keyboard.

### Đối chứng có mục tiêu, source giữ nguyên
Evidence mới `build/pr50-viewport-4f96a33/`; source Tips copy pinned được giữ nguyên, không thay class/hook để đạt pass. Assertion gốc được chạy cho PR và đối chứng. Harness gốc/results mục13 không đổi.

| Ca | innerHeight / 100dvh | visualViewport height / offsetTop | Dialog top / height / bottom | Kết quả và ý nghĩa |
|---|---|---|---|---|
| PR baseline, chưa override | 844 / 844 | 844 / 0 | 16 / 812 / 828 | Layout bình thường, vừa viewport thật. |
| PR sau override, đo ngay | 844 / 844 | 380 / 80 | 16 / 812 / 828 | **FAIL assertion gốc**; CSS max-height vẫn812px. |
| PR sau override, đợi2frame | 844 / 844 | 380 / 80 | 16 / 812 / 828 | **FAIL như cũ**, không chỉ lỗi đo quá sớm/rAF. |
| PR resize viewport thật390×380, document mới không override | 380 / 380 | 380 / 0 | 16 / 348 / 364 | **PASS** kiểm fit vùng thực với min12px (top≥12,bottom≤368). Không áp sai92/448 cho offset0; assertion gốc vẫn được giữ/rerun ở các ca đúng giả thiết. CSS responsive theo `100dvh` hoạt động. |
| Shell đối chứng dùng hook `useDialogViewport` và nguyên CSS surface FE-W4-02, cùng override | 844 / 844 | 380 / 80 | 92 / 356 / 448 | **PASS chính assertion gốc**. Hook đọc380/80 và ghi CSS variables, nên môi trường có thể biểu diễn chính xác hành vi expected. Đây không phải PR được sửa hoặc app đã tích hợp. |

- Diagnostic runner: **5PASS/2FAIL trên7checks**, exit1 vì hai lần assertion gốc vẫn fail trên PR. Không chạy lại suite không liên quan. Build Webpack riêng cho harness PASS sau bổ sung loader `.ts` để import hook hiện có; không thay config app. Không API/service/data write.
- Lượt diagnostic đầu đo baseline trước ổn định font/layout có height805.25 thay vì812. Giữ `pre-font-settle-results.json`; lượt cuối đợi `document.fonts.ready` và2frame trước baseline ở mọi ca. Baseline và sau override trùng bounds, diagnostic “CSS viewport không đổi” PASS. Đây là vấn đề đồng bộ đo đã xử lý trong harness, **không làm mất failure gốc**.
- Đã chụp và xem ảnh PR với override và shell đối chứng; có thêm ảnh resize thật. Screenshot vẫn rộng390/cao844 ở ca override, không có bàn phím thật/clipping compositor. Số đo, variables và lỗi từng assertion nằm trong `results.json`. Control shell chỉ xác minh geometry/hook, không nghiệm thu UI hay source PR.

### Phân loại và điều chỉnh kết luận
- **Bằng chứng phía component:** Tips `:83` chỉ dùng `max-h-[calc(100dvh-2rem)]`; effect `:45–72` không đăng ký visualViewport resize/scroll hoặc nhận CSS variables tương ứng. Với layout/dvh giữ844, thay visual height/offset không thay bounds. Đối chứng hook FE-W4-02 trong cùng môi trường pass. Vì vậy có **gap đáp ứng visualViewport độc lập với Tab**; không thể gộp hai failures hoặc gọi đây chỉ là timing/harness không chạy được.
- **Giới hạn phía harness:** override getter readonly chỉ đổi giá trị JavaScript; không thay native visual viewport, layout viewport, compositor, zoom hoặc bàn phím. `scale` vẫn1, innerHeight/clientHeight/dvh vẫn844; screenshot không phải bằng chứng “bị bàn phím che trên iPhone”. Không có input trong Tips để tái hiện OSK trong lượt này, không test Safari/iOS hay tích hợp thật.
- MDN mô tả bàn phím có thể thu visual viewport mà không đổi layout viewport; Chrome ghi nhận trong một số hành vi đó viewport-relative units giữ nguyên. Vì vậy kịch bản split viewport có cơ sở kỹ thuật, nhưng dữ liệu380/80 tại đây vẫn là synthetic, chưa chứng minh thiết bị/browser mục tiêu tạo đúng kịch bản này. Nguồn: [MDN VisualViewport](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport), [Chrome viewport resize behavior](https://developer.chrome.com/blog/viewport-resize-behavior).
- **Kết luận cập nhật:** có hai mục mở riêng: **(1) P2 Tab** đã tái hiện bằng keyboard; **(2) P2 compatibility gap với tiêu chí visualViewport FE-W4-02**, chứng minh bằng đối chứng tổng hợp, cần giải quyết trước khi nhận tích hợp là đáp ứng mobile/safe-area. Chưa gắn nhãn lỗi Safari/bàn phím thật đã nghiệm thu. Không tự quy T3 phải sửa shared/core ngoài scope: FE/PM cần chốt nhận contract viewport ở component hay reuse hook/surface tại bước tích hợp do FE Lead làm. Probe/assertion phải được giữ và chạy lại đúng cơ chế cuối cùng, sau đó QA split viewport/keyboard thật.
- Câu kết luận cũ “còn duy nhất blocker chức năng là Tab” quá hẹp nếu dùng cho toàn FE-W4-04/mobile; đã sửa ở mục13. FE-W4-03 vẫn NEEDS_CHANGES, FE-W4-04 chưa đủ điều kiện; approvals/scope/full-app/device checks từ lượt trước không được suy ra đã hoàn tất. Lượt này chỉ làm rõ SHA4f96a33, không review HEAD khác hay cập nhật approvals qua suy đoán.
- Không sửa source Tester 3/app, không bỏ assertion gốc; không env/DB/backend/commit/push/merge/comment/approval. Kiểm tra cuối: 21 file source/test/local config trùng SHA256 đầu lượt, bản source PR dùng đối chứng trùng byte bản pinned; diff-check PASS, không staged file. Preview3114 giữ chạy, Library HTTP200.

## 15. FE-W4-03 — kiểm tra sửa Tab tại HEAD b87ecb6, 29/10/2026 (UTC+7)

### SHA, diff và phạm vi
- GitHub API đầu/cuối xác minh HEAD **`b87ecb6578f58e650a793624cdafb3003cf217d9`**, khác `4f96a339f2a628a04a287841b0922a10626084ab`; PR #50 vẫn open, chưa merge, branch `feat/video-posting-tips-modal`, base dev `d4215160ca99f32dd32d79e474c474dd5383663b`. Không dùng thông báo đã push thay bằng chứng API.
- Delta từ bản review: **1 commit, chỉ `src/components/merchant/video-posting-tips-modal.tsx`, +20/-1**. Thêm type KeyboardEvent, ref nút Đã hiểu, handler `handleTabKeyDown` và gắn onKeyDown/ref; không đổi copy/CSS/visualViewport/scroll/Escape. Đã đọc diff mới và toàn diff PR.
- Toàn PR **6 commit, 2 file, +162/-3**: `src/components/merchant/library-client.tsx` modified+5/-3; `src/components/merchant/video-posting-tips-modal.tsx` added157dòng. Library và Guidelines vẫn trùng byte bản pinned4f96a33; Guidelines không nằm trong diff toàn PR và vẫn giữ chức năng riêng.
- Đã đọc AGENTS.md, Next local guide, TESTER3_W4/FE_W4, kiểm status/diff. Chỉ tạo harness/artifacts ignored và cập nhật hai tài liệu FE; không checkout/integrate PR hoặc sửa source Tester 3. Git blob đối chiếu: Tips `eb1fca556c2121691bc175c865633cca148d7824`, Library `05dce61570942dc6cdd536b621f6a70f33a24a42`, Guidelines `d47b35c5f8e88341bf8de9a738b3942e6eca8360`. Evidence `build/pr50-review-b87ecb6/` gồm snapshot/compares/delta/source/lint/ảnh/results.

### Từng finding và hồi quy
| Nhóm lịch sử | Kết quả tại b87ecb6 |
|---|---|
| Tiêu đề exact và4mẹo | **PASS**: đủ cards/icons và toàn bộ nội dung giờ vàng, voiceover/BGM,hashtags,bio/tin nhắn tự động; copy không đổi. |
| Giữ Quy chuẩn video riêng (cùng findingP1 gốc với nội dung) | **PASS**: source riêng/caller riêng, harness mở đúng3quy chuẩn; Escape/return focus pass. |
| Tab/Shift+Tab | **ĐÃ SỬA / PASS** cả5viewport: Tab nút cuối→nút đóng; Shift+Tab nút đóng→Đã hiểu. ActiveElement đều BUTTON bên trong dialog, đúng button theo assertions; không BODY hoặc DIALOG. Chuỗi12bước hai chiều mỗi viewport pass. Handler `:75–90`, onKeyDown`:96`, ref footer`:147`. |
| Nút đóng ≥44px | **PASS**,46×46px ở cả5viewport, không đổi class/layout. |
| Escape và trả focus | **PASS** ở cả5viewport, vẫn dùng native showModal/onCancel/cleanup. |
| Khóa/restore cuộn, cô lập pointer/programmatic focus nền | **PASS** ở cả5viewport, wheel không cuộn nền, control nền không nhận focus/click. Restore overflow và focus khi đóng/unmount pass. |

- Cùng instance10vòng mở/đóng xen kẽ Escape/Đã hiểu PASS; unmount khôi phục giá trị có trước (`clip`/`auto`) PASS; nội dung dài cuộn tới footer PASS. Stack Tips trên Guidelines native: đóng trên trả focus và giữ lock của dưới; đóng dưới trả opener/overflow, PASS. Đây là fixture hai component pinned, chưa phải tích hợp toàn ứng dụng hoặc generation/live.
- Không phát hiện lỗi chức năng mới trong phạm vi kiểm tra. Handler dùng refs của đúng hai button trong component tĩnh hiện tại; không yêu cầu thêm cơ chế động hoặc viết lại native dialog khi không có nhu cầu.

### Kiểm chứng và giới hạn
- Tái dùng **nguyên assertions70checks** từ4f96a33, kiểm bằng script equality (chỉ thay metadata SHA); không xóa/bỏ/nới assertion hoặc sửa source PR. Bundle Webpack harness PASS. CSS dùng output đã compile đúng cùng classes của bản trước vì diff không đổi classes; không thay stylesheet app.
- Browser Chrome156: **69PASS/1FAIL trên70checks**, exit1 được giữ. 320×740,390×844,768×900,1440×1000,667×320 đều pass forward/reverse/12bướcfocus và toàn bộ hồi quy chức năng trên. `results.json` lưu activeElement/target/bounds từng viewport; không suy ra toàn repository đã pass.
- Scoped strict TypeScript **component Tips PASS**; ESLint stdin canonical filenames **cả hai file PR 0errors/0warnings**. Không thay tsconfig/env, không tắt typecheck. Chưa chạy full-app PR lint/tsc/build theo DoD; không dùng checks của worktree hiện tại để thay bằng chứng PR.
- UI/copy/CSS không đổi so4f96a33; harness vẫn chụp đủ5viewport và long-content, đã xem lại ảnh667×320. Bounds/không tràn ngang, contrast/reduced motion pass. Chưa test Safari/WebKit/phone/notch/keyboard thật hoặc real MP4/storage/AI. Không gọi service/data API; browser harness chỉ GET static, origin/method khác bị chặn.

### VisualViewport theo dõi riêng — chưa sửa, chưa chuyển trách nhiệm
- Diff không có thay đổi liên quan. Assertion gốc **`b.y>=92 && b.y+b.height<=448`** tiếp tục fail với getter height380/offset80: `{x:16,y:16,width:358,height:812}`, bottom828. CSS vẫn `max-height:calc(100dvh - 2rem)` ở `:101`; không có hook/variables đáp ứng split viewport.
- Giữ là **gap tương thích P2 với FE-W4-02**, độc lập Tab, chưa được giải quyết. Kết quả/đối chứng mục14 vẫn áp dụng cho cơ chế viewport không đổi; không chạy lại matrix đối chứng không cần thiết. Probe không tạo native keyboard/viewport/compositor; **không phải bằng chứng lỗi Safari hay bàn phím thật**.
- **Chưa có xác nhận FE/PM về owner/phân công**. Các phương án reuse hook/surface khi tích hợp hay truyền contract vào component chỉ là phương án cần chốt, không phải chấp thuận chuyển trách nhiệm cho FE Lead hoặc cho phép T3 sửa core. Giữ assertion để kiểm lại cơ chế cuối cùng và QA thiết bị thật trước nghiệm thu mobile/safe-area.

### Scope, approvals và mức sẵn sàng
- Library vẫn thêm import/icon,state tipsOpen,nút Mẹo và render Tips riêng (`:7/:25/:44/:78`); không đổi query/gate/transport hay thêm network/Supabase/router/backend. Không coi file ngoài component tự thân là lỗi chức năng; nhưng deliverable1component, phần nối UI Merchant so với FE-W4-04/Reseller, và nhánh khác quy định vẫn cần FE/PM xác nhận phạm vi. Chưa có bằng chứng ngoại lệ đã được duyệt.
- GitHub API reviews cuối lượt **`[]`**. `mergeable` đầu false/cuối true tại cùng HEAD, không thay approval. Còn thiếu **hai approvals Diệu + Tuệ** theo repo, full lint/tsc DoD và chốt scope/nhánh/owner viewport. Không đăng comment/review/approval hoặc merge.
- **Phần đủ cơ sở chuẩn bị:** component tĩnh, keyboard, accessibility/lifecycle và regressions đã pass trong harness; finding Tab được đóng ở SHA này. Có thể chuẩn bị checklist/kế hoạch tích hợp dựa trên bản pinned. **Chưa đủ điều kiện tuyên bố toàn component/PR hoàn tất DoD, triển khai FE-W4-04 hoặc nghiệm thu mobile:** viewport gap vẫn mở, chưa chốt owner/scope/approvals, chưa test full-app/device. Không ghi toàn PR69/69pass hoặc coi69PASS che1FAIL.
- FE-W4-03 ghi **IN_REVIEW — functional PASS; viewport OPEN**, chưa DONE/approved. FE-W4-04 vẫn chờ xử lý gap/chốt phạm vi/phân công và approvals; chưa tích hợp trong lượt này. Lịch sử Tab lỗi ở mục13 không còn áp dụng cho b87ecb6; phân tích viewport mục14 vẫn còn hiệu lực.
- Kiểm tra cuối: 21 file source/test/local config đầu lượt trùng SHA256, bảo toàn FE-W4-01/02/rewrite; branch vẫn `feature/fe-w4-video-player-pwa-polish`, HEAD `4bebec6`. Diff-check PASS, không staged file. Giữ nguyên preview3114, GET Library200/sample200/missing404. Không pull/merge/cherry-pick/đổi nhánh/stash/revert/commit/push, không env/DB/backend hoặc API tạo dữ liệu.

## 16. FE-W4-04 — chuẩn bị phương án tích hợp cô lập, 29/10/2026 (UTC+7)

### Quyền chuẩn bị và nguồn
- Người dùng nhận **chuẩn bị xử lý viewport khi tích hợp với FE-W4-02**, cho phép tạo/sửa harness và tài liệu local trong lượt này. Đây là quyền chuẩn bị cụ thể, **không phải Tuệ đã xác nhận phạm vi, chuyển trách nhiệm chính thức hoặc cho phép ghép portal**. Vẫn chờ Tuệ xác nhận scope và Tester3 gửi lint/TypeScript toàn PR.
- Đã đọc AGENTS.md, FE_W4, Next local guide, status/diff, hook/CSS FE-W4-02, Content Kit/route/layout Reseller. Nhánh giữ `feature/fe-w4-video-player-pwa-polish`, worktree W4 hiện tại. Snapshot hash đầu lượt tại `build/fe-w4-04-prep-b87ecb6/worktree-before.json`; giữ nguyên source FE-W4-01/02, rewrite, config và tài liệu lịch sử.
- Prototype bắt đầu từ **đúng SHA đã review `b87ecb6578f58e650a793624cdafb3003cf217d9`**. `prepare.cjs` kiểm Git blob original phải bằng **`eb1fca556c2121691bc175c865633cca148d7824`** mới tạo bản thử. Bản gốc giữ riêng nguyên byte; không sửa nhánh/source Tester3. API kiểm tra cuối HEAD PR vẫn b87ecb6, PR open, reviews `[]`, comments API `[]`; không đăng comment/review/approval/merge.
- Toàn bộ code thử nằm trong **ignored `build/fe-w4-04-prep-b87ecb6/`**, không thêm/sửa component hoặc route production trong `src/`/`app/`, không merge/cherry-pick/checkout PR. Hai file tracked được cập nhật trong lượt này chỉ là FE_W4 và phần FE TEAM_WORK_LOG.

### Phương án đã thử, tránh cơ chế trùng
- Tạo `video-posting-tips-modal.adapted.tsx` từ original, thay đổi có mục tiêu: import **hook `useDialogViewport` hiện có**, import **`mobile-dialog.module.css` hiện có**, gọi `useDialogViewport(dialogRef,isOpen)`, thêm class **`surface`** vào native dialog. Không thêm state/handler resize/safe-area mới, không sửa hook/CSS dùng chung.
- Giữ nguyên props, bốn nội dung mẹo, native showModal/onCancel, handler Tab/Shift+Tab đã review,46px, return focus và body/document overflow capture/restore của b87ecb6. `proposed-adaptation.diff` là bản sửa cụ thể để review; đường dẫn import trong artifact trỏ tới source worktree. Khi ghép thật vào `src/components/merchant/`, import dự kiến là `../use-dialog-viewport` và `../mobile-dialog.module.css`.
- CSS module dùng nguyên nội dung FE-W4-02, chỉ namespace selector theo cách CSS Modules trong loader harness. Adapter CSS loader là tooling của harness; production Next dùng pipeline CSS Modules bình thường, không cần đưa adapter hoặc CSS bản sao vào app. `preparation.json` ghi hash hook/CSS thực đã dùng.
- Hook cập nhật CSS variables theo visualViewport height/offset và dùng rAF coalesce; surface tính top/max-height/insets4cạnh. Cleanup đã có trong hook được reuse, không tạo vòng đời viewport thứ hai.

### Kết quả thử
- `node build/fe-w4-04-prep-b87ecb6/review.mjs`: **74/74 PASS, exit0**, Chrome156, StrictMode. Gồm nguyên70checks của bản review và4checks mới cho wiring hook/CSS. Giữ **predicate assertion viewport gốc** `b.y>=92 && b.y+b.height<=448`; chỉ đồng bộ thêm2rAF sau resize vì hook hiện có cập nhật qua rAF, không tăng timeout hoặc nới expected.
- VisualViewport mô phỏng height380/offsetTop80: **top92,height356,bottom448**, PASS chính assertion từng fail. Safe insets4cạnh mô phỏng top40/bottom28/left32/right24: **x32,y120,width334,height312**, đúng trong vùng yêu cầu. Không nhận đây là notch/keyboard thật.
- Hồi quy **320×740,390×844,768×900,1440×1000,667×320** PASS: title/4tips/icons, Quy chuẩn riêng, initial focus, Tab/Shift+Tab/12bước không raBODY/DIALOG,46px, Escape/return focus, wheel lock, pointer/programmatic focus isolation, bounds/không tràn ngang, contrast/reduced motion; nội dung dài cuộn tới Đã hiểu và đóng được.
- 10vòng cùng instance xen kẽ Escape/Đã hiểu, unmount trả overflow có trước và stack native Tips/Guidelines đều PASS. Kiểm thêm10vòng của hook: trong lúc mở có đúng1listener cho window resize và mỗi visualViewport resize/scroll; đóng trả baseline, sau10vòng đều0; CSS variables height/top được xóa. Unmount khi còn frame resize chờ cũng xóa listeners/variables, không pageerror. Resize viewport browser thật khi dialog mở xuống390×380: top12,height356,bottom368 PASS; không coi resize desktop là keyboard thật.
- Strict TypeScript bản thích ứng và hook dependency **PASS**; lint bản thích ứng theo canonical filename **0errors/0warnings**; bundle Webpack riêng harness **PASS**. Không chạy build/typecheck toàn ứng dụng vì chưa ghép source; không dùng kết quả này thay lint/tsc toàn PR còn chờ Tester3.
- Đã chụp bộ5viewport, long-content, synthetic viewport và safe-insets; **đã xem ảnh viewport mô phỏng và landscape667×320**. Evidence `results.json`, `proposed-adaptation.diff`, `lint-adapted.json`, `preparation.json`, `preview-smoke.json` trong thư mục prep.
- **Tách kết quả:** PR nguyên gốc vẫn có kết quả review **69PASS/1FAIL**, viewport gap chưa được sửa trên PR. **74/74 là bản thích ứng thử của FE Lead trong harness**, không phải PR đã pass toàn bộ hoặc gap đã được chấp thuận đóng. Phương án đã chứng minh có thể đáp ứng assertion local, còn chờ chốt scope/owner và kiểm trong app/thiết bị thật.

### Preview cô lập để kiểm tra
- Preview chuẩn bị: **http://127.0.0.1:60377/**, có nhãn rõ “FE-W4-04 · Chuẩn bị local · Chưa tích hợp portal”; bấm “Mẹo đăng video hiệu quả”. Đây là harness mô phỏng vị trí nút, **không phải Content Kit thật hoặc route portal mới**. Smoke test HTTP200, modal mở/focus đúng. Server loopback dùng cổng tự cấp, không thay server3114; fonts/CSS đọc static từ preview3114, không service/API/data write.
- Có thể tự chạy lại bằng `node build/fe-w4-04-prep-b87ecb6/serve.mjs` trong worktree; script in cổng/URL mới do OS cấp, không cố chiếm hoặc dừng server khác. Lần hiện tại giữ preview60377 chạy để xem; preview3114 vẫn giữ nguyên.
- Bản chuẩn bị không gọi AI/API tạo dữ liệu, DB/storage/Telegram/tracking. Bộ regression dùng fixture/static, không phải video thật hay mobile/Safari được nghiệm thu.

### Vị trí tích hợp Reseller và file dự kiến khi được phép ghép
1. **`src/components/merchant/video-posting-tips-modal.tsx`**: đưa component đúng bản được duyệt vào W4 khi đủ điều kiện, áp dụng phần thích ứng tối thiểu như prototype. Giữ file spec và props hiện có để tránh một đợt di chuyển/đổi API ngoài phạm vi. Hook/CSS dùng chung **không cần sửa** theo kết quả thử.
2. **`src/components/reseller/content-kit.tsx:144`**: đặt nút **“Mẹo đăng video hiệu quả” cạnh VideoPlayer/phần chuẩn bị đăng**, bên trong nhánh contentStatus ready + selected đã được phép hiển thị. Đề xuất một action wrapper local giữ isOpen/onClose, key theo campaignId/selected.id để thay campaign/variant hoặc nhánh ready biến mất thì unmount/cleanup modal. Không thêm fetch/query/quyền, không dùng modal làm lý do mở content blocked/error/empty hoặc nới approved/shared/own gates. Không sửa CTA/link/tracking/Telegram.
3. **Tests dự kiến:** mở rộng `tests/reseller-content-kit.spec.ts` kiểm nút/modal ở đúng Content Kit và các trạng thái/gates, và `tests/pwa-polish-browser.mjs` kiểm viewport/focus/scroll/cleanup tại wiring cuối. Tái sử dụng fixtures/preview hiện có; chưa sửa các file test chính thức trong lượt chuẩn bị.
4. **Không mặc định Merchant Library là đủ:** PR đang nối nút vào Merchant; FE-W4-04 yêu cầu giao diện Reseller. Content Kit nằm trong `CampaignDetailView` và route `/reseller/campaigns/[id]`; đó là điểm đích đề xuất. Feed chưa có contract video, không tự thêm nút vào mọi card/feed hoặc mở router mới.
5. **Không cần thêm viewport export theo điều tra hiện tại:** `app/reseller/layout.tsx:7` đã `viewportFit:cover`; preview detail cũng đã có. Không sửa layout/routes chỉ để lặp cấu hình. Route preview sẵn có để test sau ghép là `/preview/reseller/campaigns/11111111-1111-4111-8111-111111111111?state=approved`; hiện chưa có nút mới vì chưa ghép ContentKit.

### Điều kiện trước ghép chính thức và trạng thái
- Chờ **Tuệ xác nhận bằng chứng phạm vi/phân công viewport, phần Library ngoài component và nhánh PR thực tế khác quy định**. Người dùng nhận làm chuẩn bị viewport được ghi nhận; không thay sự xác nhận PM còn chờ.
- Chờ Tester3 cung cấp **lint/TypeScript toàn PR tại SHA được chốt**, sau đó đủ **2approvals Diệu+Tuệ** theo repo. Scoped checks/prep harness không thay DoD PR hay approvals.
- Sau khi được phép ghép, cần kiểm App/CSS Modules pipeline thật, Content Kit/route/selection lifecycle/gates, regression Media/Reseller/player/download, TypeScript/lint/Webpack phù hợp và QA realme/Safari iOS/safe-area/keyboard thật. Không coi74/74 mô phỏng là nghiệm thu mobile, MP4 hay dữ liệu thật.
- **FE-W4-04 = PREPARING_LOCAL, chưa tích hợp, chưa hoàn thành.** Phương án và diff đã cụ thể để review; không có mutation GitHub/portal hoặc commit/push/merge. FE-W4-03 giữ kết luận PR gốc mục15; ghi chú giải pháp thử ở mục16 không đóng gap trên PR hoặc coi owner đã được Tuệ duyệt.
- Kiểm tra cuối: 21 file source/test/local config đầu lượt trùng SHA256, original PR trùng byte bản reviewed; branch/HEAD vẫn W4/4bebec6, diff-check PASS, không staged file. Preview3114 Library200, previewcôlập60377 HTTP200, URL video thiếu vẫn404. Tài liệu lịch sử giữ nguyên ngoại trừ cập nhật trạng thái hiện tại và bổ sung phần chuẩn bị này.

## 17. FE-W4-04 — triển khai trên nhánh FE local, 29/10/2026 (UTC+7)

### Quyền và cách tích hợp
- Người dùng **thay thế giới hạn chỉ harness/preview bằng quyền triển khai FE-W4-04 vào code nhánh FE local**, nhận xử lý viewport trong phạm vi FE và không yêu cầu chờ BE cho lựa chọn kỹ thuật FE thông thường. Vì vậy các dòng chờ ghép/owner kỹ thuật ở mục15/16 là lịch sử trước quyền mới, không còn chặn việc local này. Quyền local không phải GitHub approval/publish/merge; không tự đăng thay người dùng.
- Tiếp tục đúng worktree `E:\THUCTAP\ai-travel-reseller\build\fe-w4-worktree`, nhánh `feature/fe-w4-video-player-pwa-polish`, HEAD vẫn `4bebec6`. Đã đọc AGENTS.md/Next local docs/status/diff. Không xóa/làm lại phần chuẩn bị, không tạo task/agent thứ hai; các kiểm thử và build chạy nối tiếp, giữ preview3114.
- Dùng đúng component **PR #50 SHA `b87ecb6578f58e650a793624cdafb3003cf217d9`**, original blob `eb1fca556c2121691bc175c865633cca148d7824`. Source mới đối chiếu với bản thích ứng đã pass ở mục16: giống hoàn toàn sau đổi hai import sang vị trí source thật. Không merge/cherry-pick toàn PR, không áp diff Library, không đổi nhánh T3.

### Đối chiếu file/hunk
| File | Thay đổi local lượt này |
|---|---|
| `src/components/merchant/video-posting-tips-modal.tsx` mới | Nguyên nội dung/API/native dialog/keyboard/Escape/focus/overflow từ b87ecb6; thêm import và gọi `useDialogViewport(dialogRef,isOpen)`, thêm class surface của `mobile-dialog.module.css` như prototype. Không tạo cơ chế viewport/safe-area thứ hai. |
| `src/components/reseller/content-kit.tsx` | Chỉ thêm import, action giữ isOpen/onClose, bọc player hiện có với nút “Mẹo đăng video hiệu quả”. Action key theo campaignId/selected.id để đổi context/variant unmount modal cũ. Nằm trong nhánh ready+selected, không xuất hiện với blocked/error/empty/persona trống. Các props player, copy/CTA, queries/gates/tracking/Telegram giữ nguyên. |
| `tests/reseller-content-kit.spec.ts` | Thêm ca vị trí nút trong đúng region Content Kit, không lộ ở mọi trạng thái không có nội dung hợp lệ và persona trống, mở4mẹo/Escape/return focus. Giữ nguyên tests/assertions trước đó. |
| `tests/video-posting-tips-browser.mjs` mới | Test UI Next app thực với fixture,5viewport, Tab/Escape/viewport gốc/safe insets/cleanup/source change/modal stack và Quy chuẩn Merchant, chặn request API/service. Không dựa vào component harness thay cho app. |
| `tests/video-rewrite-browser.mjs` | Chỉ thêm precondition đợi nút Chọn mẫu của fixture đã load trước playback/download. Không đổi timeout hoặc bất kỳ assertion HTTP/hash/404/no-fallback nào; bảo toàn toàn bộ nội dung file trước lượt trừ3dòng được thêm. Bằng chứng bên dưới. |
| FE_W4.md / phần FE TEAM_WORK_LOG.md | Cập nhật quyền local, source/diff, kết quả, URL và giới hạn nghiệm thu/approval. Không sửa phần vai trò khác. |

- **Library/Quy chuẩn riêng:** `library-client.tsx` trùng SHA256 đầu lượt; không thay file bằng bản PR hoặc thêm nút Merchant của T3. `video-guidelines-modal.tsx` cùng các thay đổi FE-W4-02 hiện có giữ nguyên byte. User-facing tips được nối vào **Reseller Content Kit**, không coi Merchant là vị trí thay thế.
- **Bảo toàn:** `preservation.json` kiểm20file source/test/local config dirty/untracked trước lượt vẫn nguyên byte; file thứ21 (rewrite test) chỉ thêm precondition kể trên, script bỏ đúng3dòng mới rồi so với snapshot trước sửa phải bằng nhau. Hook/CSS FE-W4-02, rewrite config, player, TS config/local và các hunk FE-W4-01/02 giữ nguyên. File ContentKit/spec trước lượt sạch được sửa theo hunk trên; các file mới được thêm có mục tiêu. Không env/DB/backend/dependency/lockfile.

### Kiểm thử trong ứng dụng đã tích hợp
- `node tests/video-posting-tips-browser.mjs`: **27/27 nhóm kiểm tra PASS**, không pageerror hoặc backend/external/data API request. Chạy trên preview3114 với **component/caller/CSS Modules Next thật**, fixture chỉ thay dữ liệu tại route preview. Khác với74checks harness ở mục16.
- PASS tại **320×740,390×844,768×900,1440×1000,667×320**: heading exact/4cards/icons/đủcopy,46px, initial focus, Tab cuối→đầu/Shift+Tab đầu→cuối/12bước không BODY hoặc DIALOG, Escape/nút đóng/Đã hiểu/return focus, scroll lock/restore, programmatic focus nền bị chặn, reduced motion/bounds/không tràn ngang. Đã chụp và xem ảnh app thực ở viewport mô phỏng và667×320.
- **Assertion visualViewport gốc đã PASS trong app local:** `b.y>=92 && b.y+b.height<=448`, giả lập height380/offset80 cho **top92,height356,bottom448**. Safe insets4cạnh mô phỏng và nội dung rất dài cuộn tới footer PASS. Resize viewport browser thật khi mở cũng PASS. Predicate không bị bỏ/nới; chờ2rAF đúng lịch đo của hook đã chuẩn bị.
- 10vòng mở/đóng xen kẽ Escape/Đã hiểu: listener/variables/overflow trở lại baseline. **Đổi biến thể bằng event fixture khi modal mở** unmount dialog cũ, cancel frame đang chờ, xóa variables/listeners và mở lại ở trạng thái đóng mới PASS. Native stack với modal Link tiếp thị hiện có PASS khi chỉ mở/đóng cửa sổ, không bấm tạo link hoặc gọi API. Quy chuẩn Merchant riêng mở3mục/Escape/return focus PASS.
- Lần app runner đầu tiên lấy baseline trước Bottom Nav hydrate nên gặp vvResize2 thay vì expected1. Giữ `application-first-results.json`; đợi anchor ContentKit của Nav đã hydrate và2rAF rồi đo, baseline là **vvResize1** của Nav, mở Tips tăng đúng1 và đóng trả baseline. Assertion increment/cleanup giữ nguyên, không sửa source để né lỗi; kết quả cuối `application-results.json` PASS.
- Suite data/query/Content Kit qua config W4: **24/24 PASS**, **0skipped/0flaky**, gồm ca mới và toàn bộ kiểm quyền/persona/selection/copy/auth redirect/unknown campaign/empty/error hiện có. Output riêng `content-kit-results/`, report `content-kit-report.json`, không xóa báo cáo cũ.
- `node tests/pwa-polish-browser.mjs`: **PASS** hồi quy Bottom Nav/Guidelines/generation form, touch targets/portrait/landscape/safe-area/keyboard mô phỏng/cleanup. Script hiện có giữ nguyên, không coi Event Timing desktop là60fps thiết bị thật.
- **Rewrite/player/download:** script cũ gặp2lần timeout20s chờ download tại line59; bản diagnostic cùng assertions pass, log trước download cho thấy fixture chưa có card (`cards:0`) dù button đã có React handler. Không có bằng chứng đủ để quy timeout cho component T3/BE hoặc kết luận chắc nguyên nhân duy nhất. Bổ sung đợi UI fixture load xong, sau đó **script gốc PASS2lần liên tiếp**, nguyên timeout/assertions. Sample200/hash/range206,4URL thiếu GET/HEAD404 thật, player/download hiện lỗi404 và không thay bằng mẫu. Diagnostic/snapshot/diff readiness được giữ; không sửa sản phẩm để che lỗi test.
- **Lint5file liên quan:0errors/0warnings** (`lint.json`, `lint-rewrite.json`). **TypeScript toàn worktree `tsc --noEmit --incremental false`:PASS**. **Webpack production build PASS**, gồm TypeScript/32static pages/traces, output W4 production đã có; không skiptypecheck hoặc sửa config. Manifest production xác nhận rewrites beforeFiles/afterFiles/fallback đều rỗng.
- Evidence: `build/fe-w4-04-integration-b87ecb6/` chứa application-results/ảnh/source-comparison/preservation/reports/lint/rewrite diagnostic/diff; source/74checks/previews chuẩn bị trước giữ nguyên.

### URL bàn giao, trạng thái và giới hạn
- Dùng **http://127.0.0.1:3114/preview/reseller/campaigns/11111111-1111-4111-8111-111111111111?state=approved#reseller-content-kit** → cạnh player trong Content Kit, bấm **“Mẹo đăng video hiệu quả”**. Đây là app component đã ghép, dữ liệu fixture; không phải preview cô lập60377. Layout Reseller vốn đã viewportFitcover nên không thêm route/layout mới. Code cũng áp dụng cho `/reseller/campaigns/[id]` sau gate hiện có.
- **Gap viewport đã được xử lý trên nhánh FE local và kiểm app**, không còn là blocker kỹ thuật local. PR T3/b87 trên GitHub và kết quả review original69/1 không tự thay đổi; không sửa source PR hoặc tuyên bố PR đã tự pass bởi kết quả nhánh FE.
- FE-W4-04 **LOCAL_INTEGRATED — automated PASS**, chưa nhận hoàn tất DoD device/UAT/publish. Không chạy toàn bộ Playwright repo/live auth/DB/renderer/storage/real campaign MP4 hoặc test vật lý realme/Safari iOS/keyboard/notch/native file saving. Các getter/insets vẫn mô phỏng; fixture approved chưa phải dữ liệu thật được nghiệm thu.
- Quyền FE local mới đủ cho lựa chọn kỹ thuật/ghép code trong lượt này, **không cần chờ BE cho phần FE thường lệ đã làm**. Scoped lint/TypeScript của worktree không thay báo cáo T3 toàn PR. Bằng chứng T3 mới và full lint local FAIL được đối chiếu tại mục18; approvals trước merge/publish vẫn theo repo. API reviews kiểm lại ở lượt tích hợp `[]`; không đăng comment/review/approval, không commit/push/merge GitHub. Phần Library/nhánh của handoff T3 vẫn là nội dung review cần chốt trước quy trình merge PR đó, không chặn local Reseller đã được người dùng cho phép.
- Preview3114 giữ nguyên server, không restart cần thiết; kiểm HTTP và bảo toàn cuối trước bàn giao. Không gọi AI/API tạo dữ liệu, sửa env/DB/RLS/backend; không stash/revert/đổi nhánh/merge/cherry-pick.

## 18. Tiếp tục sau gián đoạn — đối chiếu lint Tester 3 và bàn giao FE-W4-04 local, 29/10/2026 (UTC+7)

### Điểm dừng và kết quả được tái sử dụng
- Đã đọc lại hướng dẫn repo, tiến độ mục17, status/diff và báo cáo trước khi chạy thêm. Code tích hợp đã có đầy đủ: Tips từ b87ecb6 trong Reseller Content Kit, reuse hook/CSS visualViewport/safe-area FE-W4-02; không cần triển khai lại. Audit preservation chạy lại PASS:20file cũ nguyên byte, rewrite-test chỉ có3dòng đồng bộ đã ghi nhận, Library nguyên byte, component app khớp prototype đã kiểm chứng sau đổi importpath. Giữ nguyên nhánh/HEAD4bebec6 và tất cả hunk FE-W4-01/02/rewrite.
- Tái sử dụng các lần **đã hoàn tất** ở mục17: app modal27/27, Content Kit24/24 (0skip/0flaky), PWA PASS, rewrite PASS2lần, scoped lint5file0/0, TypeScript toàn worktree PASS và build Webpack production PASS gồm TypeScript/32static pages/traces. Không tính lần runner lỗi/timeout hoặc bị ngắt là pass. Không chạy lại build/suite chỉ vì lượt chat bị gián đoạn khi source/config liên quan không đổi.
- Khi tiếp tục không thấy tiến trình Node test/build đang chạy qua Get-Process; truy vấn command line/CIM không lấy được quyền, không suy diễn từ truy vấn đó. HTTP3114 thực tế ECONNREFUSED. Đã chỉ khởi động đúng preview W4 bằng lệnh mục7, process-only NEXT_BUILD_DIR=build/fe-w4-preview, không sửa env file/xóa cache/dừng server khác. Log mới `resumed-preview.stdout.log` ghi Next16.3.8 webpack Ready. Kiểm HTTP sau khởi động: Library200, Reseller approved200, sample200, missing404. Đây là lần khởi động lại sau gián đoạn, bổ sung cho lịch sử giữ server ở mục17.

### Bằng chứng Tester 3: nguồn và giới hạn
- Ba ảnh PowerShell do người dùng chuyển: cwd **E:\\ai-travel-reseller**, `npm run lint` báo **18errors/10warnings, full lint chưa pass**; hai lần `npx tsc --noEmit` không in diagnostic rồi trở về prompt. Ảnh **không ghi branch, HEAD, trạng thái dirty, exit code hay versions**. Ghi nhận kết quả quan sát trên máy T3; **không gán chắc lần chạy cho b87ecb6** và không thay bằng kết quả máy FE. Cần T3 gửi branch/HEAD/status + commands/exit codes để đóng bằng chứng DoD tại SHA cụ thể.
- So sánh GitHub API **base d4215160ca99f32dd32d79e474c474dd5383663b → reviewed b87ecb6578f58e650a793624cdafb3003cf217d9**: ahead6, behind0, merge-base đúng d421516, không truncated; toàn diff chỉ Library+5/-3 và Tips+157. **11file có diagnostic, eslint.config.mjs, package.json và package-lock.json đều không thay đổi giữa base/head.** Đã kiểm cả phạm vi source và cấu hình/dependency, không kết luận nền chỉ vì file nằm ngoài PR.
- Tái hiện **từng file source đúng base lấy bằng git show dạng Buffer, lint canonical filename với cấu hình repo không đổi**, không làm checkout hoặc chuyển nhánh. Kết quả đúng **18errors/10warnings**; các vị trí/rules khớp ảnh bên dưới. Vì source/config/dependency này không đổi trên toàn diff, các diagnostic quan sát được **có sẵn tại nền và tiếp tục tồn tại ở b87ecb6**, không do PR thêm. Đây là tái hiện có mục tiêu + đối chiếu full diff, **không phải chạy full isolated repository tại PR HEAD**. Hai file PR đã có ESLint pinned0errors/0warnings trong mục15; không thấy lỗi lint mới từ hai file này.

| File / vị trí đúng base và b87ecb6 | Errors / warnings | Diagnostic và phân loại |
|---|---:|---|
| `app/api/merchant/campaigns/route.ts:51:41,64:17` | 2 / 0 | no-explicit-any; tái hiện ở base, source không đổi |
| `app/api/merchant/video/generate/route.ts:153:19,216:19` | 2 / 0 | no-explicit-any; tái hiện ở base, source không đổi |
| `scripts/render-remediated-pipeline.mjs:510:17` | 0 / 1 | updateContent unused; tái hiện ở base, source không đổi |
| `src/components/merchant/video-generate-modal.tsx:118:5,150:7,262:19;59:3,308:9` | 3 / 2 | set-state-in-effect2 + any1; autoStart/selectedCampaign unused; có sẵn base, PR không sửa file này |
| `src/lib/database.types.ts:1:0` | 1 / 0 | Parsing error: File appears to be binary; tái hiện từ **raw Git blob**, không coi là lỗi môi trường chưa rõ |
| `src/lib/merchant/video-generate-schema.ts:6:8,7:8` | 0 / 2 | ContentType/TargetPlatform unused; base có sẵn |
| `src/lib/merchant/video-generate-service.ts:151:18,176:53,239:28` | 3 / 0 | no-explicit-any; base có sẵn |
| `src/lib/supabase/middleware.ts:15:9,24:48` | 0 / 2 | supabase/options unused; base có sẵn |
| `tests/commerce-attribution.test.ts:8:3` | 0 / 1 | normalizePhoneNumber unused; base có sẵn |
| `tests/merchant-campaign-form.spec.ts:2:32` | 0 / 1 | merchantProductFixtures unused; base có sẵn |
| `tests/merchant-video-generate-api.test.ts:41:14,42:13,43:14,44:15,45:21,200:20,202:8;7:3` | 7 / 1 | no-explicit-any7 + UUID_PATTERN unused; base có sẵn |
| **Tổng diagnostic đã đối chiếu** | **18 / 10** | **Full lint chưa pass; không phải PR có18lỗi mới** |

- Binary evidence: base raw blob **02c837f9d4ac5790577c0c54e1abe730483a8f3e**,58722bytes,29360NUL bytes; parser reproduces exactly line1/column0. GitHub API tại b87ecb6 trả cùng blob SHA. Không dùng nội dung API đã decode/re-encode để thay raw bytes hoặc làm mất lỗi. Không sửa generated DB types/encoding/backend trong lượt này.
- **Máy FE khác máy T3:** full lint local qua `ESLint.lintFiles(["."])` dùng config repo hiện có cho **15errors/8warnings → FAIL**. Riêng video-generate-modal.tsx tại worktree FE0/0 do sửa độc lập FE-W4-01/02 trước đó; đây là chênh lệch3errors/2warnings so nền, **không phải T3 đã sửa file hoặc PR đã sửa hết lint**. Các15/8 còn lại vẫn hiện hữu; scoped5file tích hợp0/0 không thay global gate. Audit script kết thúc exit0 vì thu thập dữ liệu, không được gọi exit0 đó là lint pass.
- Runtime đối chiếu local Node24.16.0/ESLint9.39.5/TypeScript5.9.3; versions máy T3 chưa biết. Không tắt rule, sửa backend/tests backend để làm sạch báo cáo hoặc thay yêu cầu DoD. Evidence bổ sung cùng thư mục `build/fe-w4-04-integration-b87ecb6/`: `lint-base-observed-files.json`, `lint-local-full.json`, `lint-pr-compare.json`, `lint-provenance.json`, `lint-versions.json`, `resume-http.json` và script tái hiện. Runner lint đầu bị treo/đã dừng, không có report/pass; lần thu thập tiếp theo hoàn tất mới được dùng.

### Kết luận hiện tại và việc còn lại
- **Bổ sung xác nhận commit hiện tại từ Tester 3:** theo `git log -1 --oneline` do người dùng chuyển, **HEAD và `origin/feat/video-posting-tips-modal` cùng ở `b87ecb6`**, trùng SHA đầy đủ đã review/tích hợp `b87ecb6578f58e650a793624cdafb3003cf217d9`. Bằng chứng này xác nhận commit hiện tại của local/remote-tracking ref trên máy T3; **không gắn hồi tố log lint/TypeScript trước đó với SHA**, không chứng minh trạng thái working tree sạch, không bổ sung exit code hay log kiểm tra gắn trực tiếp với SHA. Giữ kết luận **full lint chưa PASS**; không đổi code/chạy lại test chỉ vì bổ sung bằng chứng này.
- **FE-W4-04 đã tích hợp code local; kiểm thử có mục tiêu/TypeScript/build đạt. Full lint toàn repo chưa đạt.** Không ghi DONE toàn DoD hoặc toàn ứng dụng pass. Không sửa source sản phẩm trong lượt tiếp tục này; chỉ bổ sung artifacts kiểm chứng và tài liệu FE.
- Giữ nguyên title/4tips/native dialog/Tab/Escape/return focus/scroll/inert, Quy chuẩn riêng và gap viewport local đã xử lý như mục17. Mô phỏng visualViewport/safe-insets không chứng minh Safari/keyboard/notch thật. Quan sát preview của người dùng trước đó chỉ là quan sát thủ công, chưa nghiệm thu MP4/mobile.
- Còn: xử lý/triage lint nền theo owner, T3 cung cấp status và log lint/TypeScript kèm SHA/exit codes trong cùng lần kiểm tra; **commit hiện tại đã được xác nhận như trên**. Hai approvals FE Lead+PM theo repo, xác nhận scope Library/nhánh khi merge PR, UAT thiết bị thật và dữ liệu/video thật vẫn còn thiếu. Không tự đăng approval hoặc thay quy trình merge. Các điểm này không yêu cầu làm lại phần tích hợp local đã được người dùng cho phép.
- **URL thử:** http://127.0.0.1:3114/preview/reseller/campaigns/11111111-1111-4111-8111-111111111111?state=approved#reseller-content-kit → cạnh player, bấm **Mẹo đăng video hiệu quả**; thử4mẹo, Tab/Shift+Tab, Escape/Đã hiểu/đóng, cuộn và đổi kích thước. Library giữ **Quy chuẩn video** riêng. Không cần gọi AI hoặc tạo dữ liệu để thử.
- Smoke sau restart **PASS**: mở Tips trong app, Escape đóng, focus trả đúng opener; request API/external/nonGET bị chặn. Hai bản smoke phụ đầu không được tính pass: assert isVisible ngay sau click chưa chờ React commit; tiếp đó chờ Nav anchor visible sai ở desktop vì Nav bị CSS ẩn. Dùng đúng precondition anchor attached theo helper đã có và chờ modal visible trước assertion, không thay source hoặc assertions chức năng của bộ27nhóm gốc. Kết quả cuối `resume-smoke.json`, không page/component fix phát sinh từ probe phụ.
- Tin nhắn ngắn để chuyển T3 (cập nhật sau xác nhận commit): **“t đã nhận log xác nhận HEAD và origin/feat/video-posting-tips-modal cùng b87ecb6, trùng bản review/tích hợp. Còn thiếu status và log lint/tsc gắn SHA, kèm exit code trong cùng lần kiểm tra nhé m. Full lint vẫn chưa pass; phần lỗi nền cần Tuệ chốt owner xử lý.”**

## 19. Chuẩn bị portal thật và bàn giao — chờ cấu hình local, 29/10/2026 (UTC+7)

### Hiện trạng và kiểm tra đã làm
- Đúng worktree W4/nhánh `feature/fe-w4-video-player-pwa-polish`, HEAD `4bebec6544efd0770f69628ff4feb56426ee0d3c`. Đã đọc AGENTS/Next local CLI và environment-variable guide/FE_W4; áp dụng skill Supabase cho kiểm tra cấu hình auth. Không đổi source/config/env hoặc checkout gốc; không fetch/pull/merge/reset/clean/revert. Không xóa thư mục build chứa worktree.
- `Get-Process` thấy các Node hiện có; probe HTTP **3114/login200**, giữ server đó. **3116 không có phản hồi, ECONNREFUSED** ở thời điểm kiểm tra; đây chỉ là cổng dự kiến cho portal production, **chưa có server portal thật tại3116**, không báo đã sẵn sàng. Không khởi động trùng test/build/server hoặc dừng tiến trình khác.
- Kiểm tra env bằng `@next/env` tại đúng worktree, production mode; chỉ lưu trạng thái tên biến. **Thiếu/rỗng NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY và NEXT_PUBLIC_SUPABASE_ANON_KEY; .env.local không tồn tại.** Portal đọc chỉ cần URL và **một trong hai public key**; không yêu cầu service-role/secret key để kiểm tra đăng nhập và dữ liệu theo session. Không đọc/copy env checkout khác, không in giá trị hoặc tự chọn project.
- **Blocker cấu hình thật:** chủ máy tự cấu hình `.env.local` ở đúng worktree bằng project đã được duyệt, URL + publishable key (hoặc anon key tương thích) của cùng project, rồi báo đã cấu hình; không gửi mật khẩu/key/cookie/token trong chat. Đã gửi yêu cầu này khi tiếp tục độc lập phần rà bàn giao. Chưa nhận xác nhận cấu hình trong lượt này.
- **Chưa build/start production mới:** các NEXT_PUBLIC_* được inline lúc build theo Next local guide. Build đã PASS ở mục17 không có bằng chứng cấu hình thật khớp môi trường mới, nên không tái dùng nó để tuyên bố portal đăng nhập được. Sau khi cấu hình đủ cần build Webpack lại trong output riêng hiện có `build/fe-w4-production` rồi start trên cổng khác còn trống; không xóa cache/output để thực hiện bước này. Typecheck giữ nguyên. Không dùng placeholder.invalid hoặc fixture thay cấu hình/dữ liệu thật.

### Luồng thật đối chiếu bằng source — chưa xác nhận bằng session
- Route Reseller: `/login?next=%2Freseller%2Fcampaigns` → `/reseller/campaigns` → `/reseller/campaigns/<id-thật>`. Session server getUser và membership gate giữ nguyên. Query/adapter `contents` giữ campaign/status **approved**, owner shared hoặc đúng reseller, persona mapping và bộ lọc hiện có. ContentKit chỉ đưa `selected.videoUrl` vào VideoPlayer với `selected.id`; nút Tips chỉ ở nhánh ready+selected, key theo campaign/variant. Không lấy UUID fixture làm ID chiến dịch thật.
- Player và download dùng chung nguồn đã qua playableVideoUrl; thiếu URL hiện thiếu, URL lỗi hiện playback/download error; download kiểm HTTP, MIME video/mp4 và ftyp. next.config không còn wildcard rewrite sang Bà Nà. Source không thêm fallback mẫu vào luồng thật; đây là rà source và kế thừa regression đã pass, **chưa chứng minh URL/video thật hiện có phát/tải được**.
- Route Merchant: `/login?next=%2Fmerchant%2Flibrary` → `/merchant/library`. Library giữ Quy chuẩn video và các bộ lọc; card là tư liệu tham khảo, không tự coi là video kết quả. **Player hiện ở kết quả VideoGenerateModal trong phiên**, state videoResult chỉ được đặt sau generate/poll; chưa có nút chỉ đọc để mở lại kết quả đã lưu từ DB. Vì không được tạo video mới, chưa thể tái hiện player Merchant từ phiên mới nếu không có kết quả sẵn trong phiên. Ghi nhận giới hạn luồng hiện có, không tự thêm history route/caller hoặc gọi generation để vượt giới hạn.
- Chưa có session trình duyệt được người dùng đăng nhập; không yêu cầu gửi thông tin xác thực. Không gọi service/data API để tạo mẫu, không Tracking link/Telegram/AI/Campaign/video mới, không mở `/r/`. Không suy ra dữ liệu thật bị thiếu vì chưa truy cập dữ liệu sau đăng nhập.

### Dữ liệu cần bàn giao và checklist thủ công sau khi portal có cấu hình
1. **Reseller:** tự đăng nhập bằng tài khoản đã có membership vào URL login thật ở cổng portal được xác minh. Mở campaign thật từ danh sách và chọn persona/variant có nội dung approved/shared hoặc owned đúng session. BE cần cung cấp ID campaign/content/persona đủ điều kiện và MP4 vật lý đúng content; không cần gửi key/token. URL không phải mock `storage.travellink.vn`, có thời hạn đủ test, MIME video/mp4, range/CORS/expiry contract phù hợp trình duyệt. Hiện chưa xác minh bản ghi nào đáp ứng.
2. **Player/download:** phát/tạm dừng, xác nhận nội dung/âm thanh đúng video; tải MP4, mở file tải và đối chiếu video/ID/variant. Đổi variant, xác nhận player/download theo nguồn mới. Nếu URL thiếu/lỗi, ghi thông báo thực tế, không coi sample Bà Nà là kết quả thật. Không sửa DB/URL để cố tạo lỗi.
3. **Tips:** nút Mẹo đăng video hiệu quả cạnh player trong Content Kit, đủ4mẹo; Tab/Shift+Tab vòng trong modal, Escape/Đã hiểu/nút đóng trả focus, nền không nhận focus/cuộn khi mở, cuộn trong modal dài và mở/đóng lặp. Không nới gates để làm nút hiện ở blocked/empty.
4. **Merchant:** dùng phiên/profile riêng hoặc tự đăng xuất/đăng nhập tài khoản Merchant, mở Library thật, kiểm Quy chuẩn riêng/bộ lọc. Chỉ kiểm player nếu có kết quả sẵn trong phiên; **không bấm tạo video/Thử lại** để có mẫu. Nếu không có kết quả sẵn, đánh dấu phần này chưa kiểm chứng theo giới hạn phía trên.
5. **Ghi kết quả:** lỗi cấu hình khi auth chưa configured; sai membership/403 là kiểm tra session/quyền; schema/API/network/CORS/expiry/MP4 cần đối chiếu response đúng nguồn; không tự quy tất cả lỗi dữ liệu thành FE. Ghi URL route/content ID/browser/device/thao tác/expected/actual và HTTP code nếu có, không gửi cookie/token/signed query nhạy cảm. **Chỉ ghi manual PASS sau khi người dùng xác nhận.**

### Rà diff và mức sẵn sàng bàn giao
- Snapshot hash đầu lượt `build/fe-w4-portal-handoff/before.json`; trước cập nhật tài liệu **mọi file dirty/untracked hiện có trùng hash**, không sửa code/hunk cũ. Rà added lines + untracked source/tests bằng heuristic secret scan: **0findings**; không thay thế audit bí mật toàn hệ thống. Không thấy env/build/node_modules/test-results/tsbuildinfo nằm trong tập file Git-visible thay đổi. Build/artifacts/env local được ignore; không stage/push chúng.
- Có6file source/test mới cần chọn khi bàn giao: Tips, mobile-dialog CSS, use-dialog-viewport, pwa-polish-browser, video-posting-tips-browser, video-rewrite-browser. **tsconfig.json có include generated types W3/W4 theo đường dẫn output local**, giữ nguyên nhưng cần review chọn hunk trước commit; không tự loại/revert hunk của người dùng. next.config rewrite là thay đổi FE có chủ đích, không phải secret/local credential.
- Tái sử dụng các kết quả đã hoàn tất mục17/18 do code không đổi:27/27modal app,24/24ContentKit,PWA/rewrite,scopedlint0/0,TypeScript/WebpackPASS. Không chạy lại suite chỉ vì chuẩn bị bàn giao. **Full lint worktree vẫn FAIL15errors/8warnings**, diagnostic nền đã đối chiếu d421516/b87ecb6 ở mục18; không có bằng chứng lint mới từ phần tích hợp. T3 ảnh18/10 + HEADhiện tạib87 không phải full lintPASS hoặc log kiểm tra gắnSHA/exitcode.
- **Chưa đủ điều kiện tuyên bố bàn giao đã nghiệm thu/commit-push-ready theo yêu cầu lượt này:** cấu hình portal thật còn thiếu, chưa chạy production với cấu hình đó/chưa có manual confirmation, dữ liệu và thiết bị thật chưa kiểm chứng, full lintFAIL/owner xử lý còn mở; approvals FE Lead+PM và scope Library/nhánh theo repo còn cần hoàn tất trước merge. Code local đã tích hợp và targeted checks đạt, không cần viết lại FE để giải quyết thiếu môi trường/dữ liệu. Không commit/push/tạo PR/approval/merge; không env/DB/RLS/seed/backend/tunnel.

Lệnh tiếp tục **sau khi chủ máy tự cấu hình và kiểm tra cổng3116 còn trống**:
```powershell
Set-Location E:\THUCTAP\ai-travel-reseller\build\fe-w4-worktree
$env:NEXT_BUILD_DIR = 'build/fe-w4-production'
npm.cmd run build -- --webpack
# Chỉ chạy start khi build kết thúc thành công; không bỏ typecheck.
npm.cmd run start -- --hostname 127.0.0.1 --port 3116
```
URL dự kiến sau start và probe thành công: `http://127.0.0.1:3116/login?next=%2Freseller%2Fcampaigns` và `http://127.0.0.1:3116/login?next=%2Fmerchant%2Flibrary`. **Hiện chưa khởi động/xác minh hai URL này.** Preview3114 là fixture/public UI còn chạy, không thay portal thật.

## 20. Portal production đã khởi động sau cấu hình của chủ máy — 29/10/2026 (UTC+7)

- Chủ máy xác nhận đã tự tạo/lưu `.env.local` trong worktree W4. Đã kiểm bằng `@next/env` production tại đúng worktree: **NEXT_PUBLIC_SUPABASE_URL configured, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY configured**; NEXT_PUBLIC_SUPABASE_ANON_KEY thiếu nhưng **không bắt buộc khi publishable key đã có**. Kiểm cú pháp URL hợp lệ, key loại publishable, không phải secret/service-role. Không in giá trị, không sửa/copy env hoặc thay project. Đây là kiểm tra cấu hình local, **chưa xác thực tài khoản/project quyền dữ liệu bằng một phiên đăng nhập thành công**.
- `git check-ignore -v .env.local` khớp `.gitignore:47:.env*`; `git ls-files --error-unmatch .env.local` không tìm thấy: **file ignored và không tracked**. Output production/log/ảnh/artifacts trong build cũng ignored; heuristic scan diff/untracked tiếp tục0findings, không env/output lọt vào danh sách thay đổi Git. Không force-add/stage/commit/push.
- **Build mới với cấu hình đã lưu**, không dùng lại build thiếu env ở mục17: `NEXT_BUILD_DIR=build/fe-w4-production npm.cmd run build -- --webpack` **exit0/PASS**; compile60s, TypeScript37.4s, static32/32, page optimization hoàn tất. Không tắt typecheck/lint rule, không xóa cache/build checkout gốc. Tái dùng output W4 riêng đã có để không phát sinh include path mới trong tsconfig. Log `build/fe-w4-portal-handoff/portal-build.log`.
- **Server thật đã chạy tại http://127.0.0.1:3116**, loopback, Next production `npm.cmd run start -- --hostname 127.0.0.1 --port 3116`, cùng NEXT_BUILD_DIR trên. Start qua process Hidden, log Ready2.1s. Chỉ tạo server này sau khi probe3116ECONNREFUSED; không dừng server khác. Preview3114 vẫn giữ và được kiểm LibraryHTTP200 sau khi production sẵn sàng. Các dòng chờ cấu hình/chưa start ở mục19 là **lịch sử đã được cập nhật bởi mục20**.
- **Kiểm phản hồi thực tế:** GET/login200; GET/reseller/campaigns307→/login; GET/merchant/library307→/login khi không có session; GET/campaign-videos/fixture-video-unavailable.mp4 trả404 thật trên production, không200sample. Browser Chrome mở form login thật: submit enabled, không có notice thiếu cấu hình,0pageerrors, đã chụp/xem ảnh. Không nhập/gửi thông tin đăng nhập, không tạo dữ liệu, browser smoke chặn API/external/nonGET; kiểm redirect không thay xác minh membership sau đăng nhập. Evidence `portal-smoke.json`, `portal-login.png`, `config-validation.json`, `environment.json`, `portal-server.*.log` trong ignored `build/fe-w4-portal-handoff/`.
- Bảo toàn: sau build/smoke, `diff-review.json` so snapshot đầu lượt cho **0file source/config/test thay đổi**, sau cập nhật tài liệu chỉ hai tài liệu FE khác hash; toàn bộ FE-W4-01/02/04/rewrite/T3 giữ nguyên. Không fetch/pull/đổi nhánh/commit/push/merge/DB/RLS/backend/AI/Telegram/tracking hoặc mở/r/. Các regression đã hoàn tất không chạy lại vì source không đổi; build mới và portal smoke là kiểm tra thêm cho cấu hình production mới. **Full lint vẫn FAIL15errors/8warnings** như mục18, không gọi production buildPASS là full lintPASS.

### URL và thao tác chủ máy
1. **Reseller:** http://127.0.0.1:3116/login?next=%2Freseller%2Fcampaigns → tự đăng nhập tài khoản Reseller có sẵn, mở campaign thật trong danh sách, chọn persona/variant có nội dung approved được phép xem. Trong Content Kit: phát/tạm dừng, tải MP4 và mở file để đối chiếu đúng video đang chọn; thử nút **Mẹo đăng video hiệu quả** cạnh player,4mẹo/Tab/Shift+Tab/Escape/Đã hiểu/khóa nền. Không mở Tracking redirect hoặc tạo link/Telegram/video để thử.
2. **Merchant:** http://127.0.0.1:3116/login?next=%2Fmerchant%2Flibrary → dùng profile/phiên riêng để tự đăng nhập Merchant, kiểm Library/Quy chuẩn riêng/bộ lọc. Nếu không có kết quả generation sẵn trong phiên, player Merchant chưa thể mở chỉ đọc theo luồng hiện có (mục19); **không bấm tạo video mới**. Không dùng previewfixture thay dữ liệu thật để ghi nghiệm thu.
3. Nếu dữ liệu không có video: cần BE/owner cung cấp campaign/content/persona hợp lệ + MP4 vật lý/MIME/CORS/range/expiry như mục19. ThiếuURL/lỗiURL phải ghi đúng thông báo; chưa xác minh video thật đủ điều kiện, không khẳng định DB trống và không viết lại FE chỉ để có mẫu. Nếu đăng nhập lỗi, ghi thông báo/route/browser/mã HTTP không kèm secret; tách cấu hình/auth/API/dữ liệu khỏi lỗi UI.

**Mức sẵn sàng:** portal production đã sẵn sàng để chủ máy kiểm tra thủ công, blocker thiếu cấu hình local đã được gỡ. **Chưa có xác nhận manualPASS**, chưa nghiệm thu video/MP4/device/Safari thật, full lint chưa pass và PR approvals/DoD vẫn như mục18. Chưa tuyên bố bàn giao đã nghiệm thu/đủ mọi điều kiện commit-push; chờ kết quả thủ công và xử lý các gate còn lại. Không commit/push trong lượt này.

## 21. Điều tra URL video campaign thật sau quan sát thủ công — 29/10/2026 (UTC+7)

### Quan sát được người dùng xác nhận
- Trên portal production3116, campaign **67ff407f-2853-4755-beeb-ea7ce137aa71**: các persona có nội dung mà người dùng đã mở đều hiện **“Chưa có URL video hợp lệ để phát”**, Tải MP4 disabled. Chỉ ghi phạm vi đã mở, không suy ra mọi persona/record đều như vậy hoặc bảng contents không có video.
- Merchant Library hiển thị **9mẫu** và mở được **Quy chuẩn video**, có ảnh minh chứng. Ghi nhận manual observation cho đọc Library/mở Quy chuẩn; không nâng thành pass tất cả hành vi modal, generation, player/download Merchant, MP4 thật/mobile/Safari. **Phát/tải MP4 thật vẫn chưa kiểm chứng.**

### Đường đi dữ liệu đã đối chiếu
| Tầng | Bằng chứng code/contract | Kết luận trong phạm vi kiểm tra |
|---|---|---|
| Schema/contract | Generated `src/lib/database.types.ts`, contents Row có **video_url:string\|null**, đọc đúng encoding của file; service Merchant lưu/trả renderDraft.video_url vào cùng trường. Docs Fe-update-2026-10-15 xác nhận approved/persona và đủ hook/script/caption/cta, không cam kết có MP4 cho campaign thật đang xem. | Trường hiện hành là **contents.video_url**, không có bằng chứng cần đổi sang trường tên khác. Contract text-content không tự chứng minh video vật lý tồn tại. |
| Query/select | `src/lib/reseller/content-query.ts` query contents select **id,campaign_id,reseller_id,persona,status,hook,script,caption,cta,video_url**, có campaign/approved/shared-or-own/pagination. getCampaignDetail dùng trực tiếp queryContentKit→loadContentKit sau getUser+membership. | **Không bỏ video_url khỏi select** trong source hiện có. Kiểm bundle production xác nhận select này có trong server JS đang build; không dùng kết luận chỉ từ file source chưa build. |
| Adapter/schema | `src/lib/reseller/content-kit.ts`: video_url z.string().nullish(), return **videoUrl:row.video_url??null**; các bước status/campaign/owner/persona lọc toàn record, không xóa riêng URL. | String được giữ nguyên, null/undefined→null. Không dùng z.url để tự loại URL ở adapter; sai kiểu non-string sẽ thành schema error của Content Kit, không tự biến thành URL trống. |
| Route/view/ContentKit | page result.variants→CampaignDetailView variants→ContentKit variants; chọn đúng persona/variant, truyền **selected.videoUrl** với selected.id cho VideoPlayer. Không truyền ready=false; player mặc định ready=true. | Không thấy mapping trung gian làm mất trường hoặc hardcode URL mẫu; gates/selection không sửa. |
| Validator/player | `src/lib/video-delivery.ts` playableVideoUrl trim, trả null với missing/empty, control/space/backslash, path/protocol không hợp lệ, embedded credentials, parse lỗi hoặc **storage.travellink.vn**. Player chỉ đặt video src khi validator nhận; Tải disabled khi source null. | Thông báo trong ảnh **không phân biệt null/rỗng với URL bị validator từ chối**. Đây không phải bằng chứng HTTP404/CORS vì chưa có source để bắt đầu phát/tải. |

- Căn cứ block domain mock: generator.ts MockVideoRendererAdapter tạo URL **storage.travellink.vn**, synthesizeVideoDraft mặc định dùng adapter mock; comment ghi chưa transcode/upload MP4 vật lý. Service hiện lưu draft với statusready, trong khi Reseller chỉ đọc approved. **Không suy ra campaign đang xem do mock tạo hoặc approved record hiện có video_url nào**; cần runtime evidence. Nếu BE đã chuyển domain đó sang file thật, cần xác nhận contract/readiness/file đúng content để đánh giá block domain có trở thành false-positive FE hay không; chưa tự nới validator chỉ vì domain có thể hợp lệ.
- Log production hiện có stdout chỉ startup/Ready, stderr0bytes tại lúc đọc; diagnose trong reseller/server chỉ in khi NODE_ENVdevelopment và không ghi giá trị URL. **Không có log raw URL cho session của người dùng**, không đọc cookie/token/session từ trình duyệt để tự truy vấn DB. Không kết luận DB thiếu video khi chưa có bằng chứng.

### Kiểm chứng có mục tiêu, không sửa code sản phẩm
- Chạy đúng suite query/data: **15/15PASS**, exit0; SDK serialization kiểm exact select chứa video_url + campaign/status/owner trên mọi page; adapter kiểm URL giữ nguyên và không lọt URL của owner/campaign/status khác, missing→null. Output riêng `build/fe-w4-portal-handoff/url-path-tests/`, giữ assertions cũ.
- `node --experimental-strip-types --test tests/video-delivery.test.ts`: **3/3PASS**, exit0: valid relative/HTTP signed query URL giữ nguyên; missing/unsafe/mock bị từ chối, không substitute sample; bytes download đúng, lỗiHTTP/MIME/structure/network/cancel báo lỗi. Đây là dữ liệu kiểm soát, không phải video thật của campaign trên.
- `bundle-video-proof.json`: production server JS có select video_url, client JS có domain mock check; chỉ ghi boolean/path artifact, không dump bundle/env/key. Không sửa FE/backend/env/DB hoặc rebuild/restart vì source/config không thay đổi; giữ server3116/preview3114. Full lint vẫn FAIL15errors/8warnings như mục18; không chạy full suite hoặc lint nền lại để điều tra một trường URL.

### Bằng chứng runtime còn cần — không thu token/key/URL nhạy cảm
- Đã chuẩn bị **`build/fe-w4-portal-handoff/inspect-video-props.js`**, đã thử trên route fixture với đúng Next HTML/RSC shape, trích được5variants (`inspector-fixture-proof.json`). Script **chỉ đọc payload HTML/RSC có sẵn**, JSON.parse, không eval/fetch/API/cookie/storage; chỉ in **route,contentId,persona,videoUrlState**, không in raw/signed URL, host bất kỳ, query string, key/token. Các state gồm missing-or-null/empty-or-whitespace/rejected-known-mock-host/rejected-format-reason/accepted-by-current-validator. Dùng bản validator hiện tại để phân loại, không sửa logic sản phẩm.
- Người dùng mở trực tiếp URL campaign thật trên3116, reload rồi copy script từ file local vào DevTools Console; chỉ gửi JSON đã che thông tin như trên. Nếu parser không trích được variants, **không gọi đó là thiếu dữ liệu**; kiểm full reload/shape thay vì thu toàn HAR/cookie/HTML. Đã gửi yêu cầu qua câu hỏi text; chưa nhận kết quả runtime trong lần cập nhật này.
- Props này là **sau adapter**, không phải raw DB response. Nếu state null/rỗng, cần BE/owner xác nhận bằng một lần đọc có quyền: **contentId, campaign_id khớp67ff407f-2853-4755-beeb-ea7ce137aa71, persona/statusapproved/owner shared-or-self và trạng thái video_url null/rỗng/nonempty**; không cần gửi raw signed URL hay ID tài khoản/session token. Nếu nonempty, bàn giao nguồn MP4 vật lý/readiness/MIME/CORS/range/expiry đúng content và xác nhận domain mock đã được thay bằng renderer thật hay chưa. Không yêu cầu ghi/seed/approve/generate mới để tạo bằng chứng.
- **Kết luận hiện tại:** chưa phát hiện FE bỏ select/mất mapping; validator có thể từ chối đúng thiết kế nhưng **chưa biết giá trị live nên chưa chốt nguyên nhân campaign** là dữ liệu, mock hay false-positive validator. Giữ nguyên code cho đến khi có bằng chứng cụ thể. Không dùng sample/Bà Nà fallback, bỏ quyền/filter hoặc tự tạo dữ liệu. FE01/02/04 và tất cả thay đổi chưa commit giữ nguyên; không commit/push/merge.

## 22. Chẩn đoán server có giới hạn — tiếp tục 30/10/2026 (UTC+7)

- Người dùng không dán được Console, cho phép log tạm server trước/sau adapter, chỉ contentId/persona/videoUrlState và chỉ restart3116. Không lấy token/key/cookie/URL đầy đủ, không ghi DB. Campaign duy nhất **67ff407f-2853-4755-beeb-ea7ce137aa71**. Script Console mục21 không còn là bước bắt buộc.
- Đã đối chiếu artifacts của lượt bị ngắt: build đầu **FAIL** do bản sao bằng chứng `.ts` có import tương đối không hợp lệ; chỉ đổi **bản sao** thành helper.snapshot.txt/server.instrumented.txt, không đổi đuôi source thật, không tắt typecheck hoặc exclude để né lỗi. Build sau **đã hoàn tất exit0**, compile18.9s/TypeScript11s/static32/32, không phải lượt bị ngắt được tính PASS. Log build.first.log/build.log giữ riêng trong ignored `build/fe-w4-portal-handoff/url-diagnostic/`.
- Instrumentation trước đó: helper server tạm gọi playableVideoUrl hiện có để phân loại missing-field/null/empty/non-string/known-mock/invalid-format/accepted; mỗi row chỉ3trường. contentId kiểm UUID, persona whitelist; không in dữ liệu bất thường làm giả id/persona. Gọi trace trước query rows được adapter parse và sau kit.variants; không đổi query/gates/mapping. Test redaction trước/sau PASS với dữ liệu signed-URL/token giả không xuất hiện trong output; ESLint2file0errors/0warnings.
- **Source hiện đã sạch phần chẩn đoán:** sau build riêng `build/fe-w4-url-diagnostic`, đã trả server.ts và tsconfig.json **đúng byte trước instrumentation**, xóa riêng helper tạm. Hai include mới do Next tự thêm cho output chẩn đoán được khôi phục về snapshot, giữ nguyên mọi include/hunk local W3/W4 trước đó. Bản compile chẩn đoán vẫn có log để chạy riêng; output production sạch `build/fe-w4-production` và env không đổi, có thể quay lại sau khi lấy bằng chứng. `source-restored.json`/`resume-proof.json` xác nhận, audit mọi source/config/test FE vẫn nguyên byte.
- Lượt khởi động trước **chưa thành công**: `.ps1` bị execution policy chặn; lệnh Stop-Process gặp NullReference nên start tiếp theo báo EADDRINUSE. Không gọi lần đó Ready/PASS. Khi tiếp tục sáng30/10, xác minh cổng3116 không có listener và GETECONNREFUSED,3114 cũng không phản hồi; không dừng server khác. Lần này chỉ start bản chẩn đoán3116 từ build đã hoàn tất, log mới không ghi đè lỗi lần trước (`first-start.*.log`). Next Ready9.6s, **GET/login200 đã kiểm thực tế**;3114 không đang chạy nên không restart/dừng nó.
- **Đang chờ runtime từ session chủ máy:** đã báo mở trực tiếp URL campaign trên3116/reload, tự đăng nhập nếu cần, không Console/credentials gửi vào chat. Chỉ log từ request đọc campaign có quyền hiện tại mới dùng kết luận. `collect.cjs` giữ duy nhất sự kiện trước/sau gồm3trường trong observations.json; tới lúc chuẩn bị server chưa có event campaign. **Chưa có căn cứ mới để kết luận URL null, mock, validator lỗi hoặc DB thiếu video.**
- **Cleanup còn phải làm khi có bằng chứng:** đọc cặp before/after, xác định tầng lỗi; nếu lỗi FE mới sửa có mục tiêu. Sau đó restart **đúng listener3116 đã xác minh** về output production sạch, probe thực tế và xác nhận compiled log không còn hoạt động. Không coi source đã khôi phục là toàn bộ cleanup khi3116 còn phục vụ artifact chẩn đoán. Artifact/log che dữ liệu giữ ngoài Git, không commit/push/merge/env/backend/DB/AI/datawrites. Full lint vẫnFAIL15errors/8warnings; manual MP4 thật chưa pass.

## 23. Kết quả runtime và đã gỡ chẩn đoán — 30/10/2026 (UTC+7)

### Bằng chứng từ lần tải lại bằng session chủ máy
- Người dùng xác nhận **đã tải lại, thấy nội dung persona**. Đọc log chẩn đoán campaign **67ff407f-2853-4755-beeb-ea7ce137aa71** nhận **2cặp before/after**, mỗi cặp20rows, cùng20contentId trước và sau. Tập quan sát có2persona raw `family` và `local_guide`; sau adapter `local_guide` đổi thành `local-guide` theo contract, không đổi contentId. Không suy ra persona khác không có dữ liệu ngoài tập trả về/session hiện tại.
- **20/20rows trước adapter: video_url là null;20/20rows sau adapter: videoUrl vẫn null**, lặp lại ở cả2cặp. Không có missing-field, empty-string, nonempty URL bị từ chối hoặc accepted URL trong tập quan sát. `conclude.cjs` assert số lượng, tập contentId bằng nhau và trạng thái null trước/sau; `conclusion.json` lưu tóm tắt, `observations.json` lưu đúng3trường cho mỗi row. Tất cả nằm trong **ignored build/fe-w4-portal-handoff/url-diagnostic/**, không đưa bản log row vào file Git/commit. Không in URL đầy đủ/key/token/cookie.

### Phân loại nguyên nhân theo từng tầng
| Tầng | Kết quả xác minh cho request quan sát |
|---|---|
| Query/select | Select `contents.video_url` đã có trong source và bundle production. Dữ liệu query trả về **đã mang video_url:null trước adapter**; không phải FE quên chọn trường. |
| Adapter/mapping |20contentId được giữ, null→null; không làm mất URL có giá trị. Các bộ lọc campaign/approved/shared-own/persona không bị nới hoặc bỏ. |
| Content Kit/VideoPlayer | selected.videoUrl nhận null, thiếu source nên hiện “Chưa có URL video hợp lệ để phát” và disable Tải MP4, đúng code/contract hiện có. |
| Validator | Không có URL nonempty nào ở20rows này để validator từ chối. **Không phải bằng chứng false-positive của block domain mock trong ca này.** Không cần bỏ validator hoặc thay sample. |
| Dữ liệu đầu vào/BE | Blocker cụ thể là **URL null trong các row do query có quyền trả về**. Chưa biết lý do null, chưa kiểm trực tiếp asset/storage hoặc các bảng/trường khác. Không kết luận toàn DB/storage thiếu video, renderer hỏng, hay không tồn tại video thật ở nơi khác. |

- **Không có lỗi FE cần sửa được chứng minh trong luồng này**, nên không sửa production source/query/filter/backend để làm nút tải hoạt động khi chưa có nguồn video. Kế thừa các checks query/data15/15 và URL/download3/3 đã hoàn tất ở mục21, không chạy lại toàn suite vì final source vẫn cùng byte. Không tuyên bố MP4 thật đã pass.
- **Bàn giao BE cần chính xác:** kiểm tra đọc-only đúng20contentId trong observations.json của campaign trên và session scope đã được phép xem, lý do `contents.video_url` trả null; xác nhận `contents.video_url` có phải contract chính thức để Reseller lấy MP4 vật lý hay URL đang ở trường/bảng khác. Nếu khác, bàn giao field/join/relation/readiness contract được duyệt trước khi FE đổi mapping. Cần một **content hiện có, approved, đúng campaign/persona/shared-or-owned** có nguồn MP4 vật lý được bàn giao hợp lệ, cùng MIME/CORS/range/expiry/refresh và tình trạng render/upload; không yêu cầu FE seed/ghi/approve hoặc gọi AI để tạo mẫu. Chưa có đủ bằng chứng để đổi bộ lọc approved thành ready.

### Cleanup đã hoàn tất và server hiện tại
- Xác minh PID20992 là Next start đúng repo, listener127.0.0.1:3116. Chỉ dừng PID này bằng taskkill/PID/F sau guard owner/command line, không /T hoặc stop server khác; dùng native process command vì Stop-Process lượt trước gặp lỗi. Start Hidden lại **output sạch build/fe-w4-production**, không build lại hoặc sửa env; env hash và BUILD_ID sạch khớp snapshot trước chẩn đoán.
- **GET/login200**; HTML trả đúng BUILD_ID production sạch và khác diagnostic BUILD_ID; quét server JS sạch không có marker log `[FE-W4 video-url ...]`, stdout server mới cũng không có event chẩn đoán. Source/server.ts không còn diff, helper tạm không tồn tại, tsconfig/env khớp byte/hash trước instrumentation. **Cleanup cả source lẫn compiled logging đang chạy đã xong**, supersede trạng thái chờ ở mục22. `cleanup.json` ghi bằng chứng.
- Server3116 production sạch Ready497ms và đã probe thực tế; GETcampaign khi không gửi session307→login là đúng gate, không thay kết quả từ session của chủ máy. File local thiếu vẫn404 thật. Preview3114 đã không chạy khi tiếp tục lượt này, không dừng hoặc khởi động thêm nó.
- Chỉ2tài liệu FE đổi so snapshot đầu chẩn đoán; FE-W4-01/02/04/rewrite/Tester3 và mọi hunk config/test hiện có giữ nguyên. Full lint vẫnFAIL15errors/8warnings, approvals/live-device/video gates chưa đổi. Không commit/push/merge, env/backend/DB/RLS/AI/Telegram/tracking/datawrites.

Tin nhắn ngắn chuyển BE/PM: **“t đã trace campaign67ff407f-2853-4755-beeb-ea7ce137aa71 từ session thật:2lần đọc,20content mỗi lần đều video_url=null trước adapter và videoUrl=null sau adapter, contentId giữ nguyên. FE select/mapping không làm mất URL; player khóa tải vì thiếu nguồn. M kiểm tra read-only các content này và xác nhận nguồn MP4/contract contents.video_url hay field khác, bàn giao một content approved hiện có đủ quyền kèm MIME/CORS/expiry nhé. Chưa kết luận storage không có video và không cần FE tạo video mới.”**

## 24. Gói bàn giao nhánh FE riêng — 30/10/2026 (UTC+7)

- Người dùng cho phép **commit/push đúng feature/fe-w4-video-player-pwa-polish**, giữ checkpoint4bebec6 và thêm commit, không amend/squash/force/rebase/merge/dev-main/PR/approval. Đã kiểm đúng worktree, remote origin NguyenMTue/ai-travel-reseller, không merge/conflict/staged việc khác; truy vấn riêng ref đích trước bàn giao chưa có nhánh remote, dev=d421516. Đây là quyền bàn giao code, **không phải phê duyệt hoặc nghiệm thu cả tuần**; các dòng không commit/push trước mục này là phạm vi lịch sử.
- **Xác nhận thủ công bổ sung từ người dùng:** đã mở modal và xác nhận vòng **Tab/Shift+Tab hoạt động**. Giữ riêng với kiểm tra tự động và quan sát Library9mẫu/Quy chuẩn ở mục21. Kết quả runtime20/20null trước/sau adapter ở mục23 không đổi; phát/tải MP4 thật chờ BE nguồn video/contract, Realme C21Y và Safari iOS chưa nghiệm thu. Không ghi full lintPASS: gần nhất15errors/8warnings nền theo mục18; approvals vẫn chưa xác nhận.
- Gói commit gồm code FE01/02/04, viewport/safe-area/Tips từb87ecb6 đã review, rewrite404, regression tests và2tài liệu FE; **không stage tsconfig.json với include output local**, giữ file đó nguyên trạng local. Env/log/output/ảnh/backup/scripts chẩn đoán vẫn ignored và ngoài commit; helper server tạm đã gỡ cả source và runtime (mục23). Tái sử dụng bằng chứng kiểm thử/build đã hoàn tất do source/config chức năng không đổi; rà danh sách staged, secret/conflict markers/diff-check trước commit và giữ nguyên hook/check bắt buộc. SHA/push/upstream/remote verification được báo sau thao tác, không ghi trước thành công.
