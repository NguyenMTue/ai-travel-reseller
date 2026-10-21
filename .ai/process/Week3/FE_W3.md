# MY WORK PLAN — FE_W3
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 3 (19/10/2026 – 24/10/2026) — Sprint 3  
**Member:** Diệu (Frontend Lead)  
**Role:** Lead Frontend Developer (Next.js 16, React 19, PWA Mobile Suite, Merchant & Reseller Portals)  
**Current Milestone:** COMMERCE FLOW, AI SALES AGENT, PWA & MERCHANT VIDEO GENERATION  
**Deadline:** 17:00 Thứ Sáu (23/10/2026); Demo nghiệm thu: Thứ Bảy (24/10/2026)  
**Branch:** `Feature_FE_W3_PWA_Mobile_Commerce` (tách từ `dev`)  

---

## 1. Context
- Kế thừa thành quả Sprint 2: Reseller Feed, Content Kit 4 Persona, Modal Tracking Link/QR, Form tạo chiến dịch Merchant và 2 trang điều khoản/bảo mật đã hoàn thiện sạch sẽ, vượt qua 100% các bài test hồi quy Playwright.
- Trọng tâm Tuần 3:
  1. Triển khai bộ giải pháp **PWA Mobile Suite**: Biến nền tảng thành ứng dụng web tiến bộ hỗ trợ "Thêm vào màn hình chính" (Add to Home Screen) chạy Standalone toàn màn hình không thanh URL.
  2. Xây dựng Bottom Navigation Bar tiện tay cho Reseller; tích hợp **Web Share API** (1 chạm chia sẻ sang Zalo, Facebook, TikTok) và tính năng xuất poster du lịch kèm mã QR.
  3. Tối ưu khung chat AI Sales Agent thành dạng Bottom Sheet di động cho khách hàng.
  4. Xây dựng màn hình Ví hoa hồng Reseller (`/reseller/wallet`).
  5. Tích hợp phân hệ Media Library cho Merchant (tiếp nhận component tĩnh `MediaCard` từ Tester 3).
  6. Đóng vai trò **Người gác cổng kỹ thuật (Gatekeeper)**: Review và phê duyệt nghiêm ngặt 100% code của Tester 3 trước khi merge.
- Nguồn tham chiếu: [Roadmap.md](../Roadmap.md), [Week3.md](Week3.md), [PromptCreateTask.md](../PromptCreateTask.md).

---

## 2. Executive Summary
FE Lead chịu trách nhiệm đưa trải nghiệm di động của Reseller và Khách hàng lên chuẩn ứng dụng nguyên bản (App-like Experience) thông qua PWA:
1. **PWA Core:** Cấu hình `manifest.json`, icon app độ phân giải cao, Service Worker cơ bản để trình duyệt điện thoại nhận diện khả năng cài đặt.
2. **Mobile UX cho Reseller:** Dựng Bottom Nav cố định (Khám phá, Nội dung AI, Link & QR, Ví hoa hồng); xử lý khoảng đệm an toàn `safe-area-inset` cho tai thỏ iPhone.
3. **Thao tác 1 chạm:** Tận dụng `navigator.share` để mở menu native chia sẻ mạng xã hội; dùng HTML Canvas render mã QR lồng vào ảnh banner để tải về máy.
4. **Mobile UX cho Khách hàng:** Khung chat AI tự động co giãn full màn hình, bàn phím ảo không che khuất ô nhập liệu.
5. **Ví hoa hồng:** Kết nối API ví tiền để hiển thị số dư, hoa hồng chờ duyệt và lịch sử đơn hàng.
6. **Kiểm soát rủi ro nhân sự:** Hướng dẫn, giám sát và kiểm tra mã nguồn của Tester 3 (FE phụ) trên nhánh riêng biệt `feature/fe-t3-static-components`.

---

## 3. TODAY — MUST DO (Thứ Hai 19/10/2026)
| Priority | Task | Why | Dependency | Output | Estimated Effort | Status |
|---|---|---|---|---|---|---|
| P0 | Họp Kick-off Sprint 3 & Chốt giao diện Mobile với UI/UX | Nắm rõ specs Bottom Nav và Safe area | UI/UX | Figma specs | 1.5h | READY |
| P0 | Tạo nhánh `feature/fe-t3-static-components` cho Tester 3 | Cô lập hoàn toàn phạm vi làm việc của Tester 3 | Git | Branch mới + skeleton files | 1h | READY |
| P0 | FE-W3-01: Khởi tạo cấu trúc PWA (`public/manifest.json`, icons) | Nền tảng để bật tính năng Add to Home Screen | Không | `manifest.json`, meta tags | 3h | READY |

---

## 4. THIS WEEK — MY TASKS
| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|---|---|---|---|---|---|
| FE-W3-01 | Cấu hình PWA Core (manifest, Service Worker, Meta) | P0 | IN PROGRESS — local PASS, chờ QA thiết bị thật | Không | Diệu | `app/manifest.ts` + `public/sw.js` + metadata layout | 20/10 17:00 |
| FE-W3-02 | Bottom Navigation Bar & Responsive Safe Area cho Reseller | P0 | IN PROGRESS — Chờ UI/UX review | UX-W3-01 | Diệu | Component `bottom-nav.tsx` + layout update | 21/10 12:00 |
| FE-W3-03 | Tích hợp Web Share API 1 chạm & Canvas xuất ảnh QR | P0 | IN PROGRESS — fixture PASS; Git integration blocked; chờ UIUX/thiết bị thật | FE-W3-02 | Diệu | Module `share.ts` + `canvas-qr.ts` + UI modal | 21/10 17:00 |
| FE-W3-04 | Giao diện Chat AI Sales Agent Mobile (Bottom Sheet widget) | P1 | READY | UX-W3-02 | Diệu | Component `mobile-chat-sheet.tsx` | 22/10 17:00 |
| FE-W3-05 | Giao diện Màn hình Ví hoa hồng Reseller (`/reseller/wallet`) | P0 | READY | BE1-W3-04 | Diệu | Route `app/reseller/wallet/page.tsx` | 23/10 12:00 |
| FE-W3-06 | Tích hợp Merchant Media Library (ghép `MediaCard` từ Tester 3) | P1 | READY | T3-FE-W3-01, BE1-W3-03 | Diệu | Route `app/merchant/library/page.tsx` | 23/10 17:00 |
| FE-W3-07 | Code Review & Kiểm duyệt an toàn nhánh của Tester 3 | P0 | READY | T3-FE-W3-01, 02 | Diệu | PR review comments & Approval | 21/10 - 22/10 |
| FE-W3-08 | Phối hợp QA diễn tập kịch bản Demo C3 (Cloudflared Tunnel) | P0 | READY | FE-W3-01, Tester 1 | Diệu | Buổi diễn tập demo PWA thành công | 23/10 17:00 |

---

## 5. TASK BREAKDOWN (THEO PROMPT CREATETASK)

### A. Những việc tôi PHẢI làm:
- Làm chủ toàn bộ kiến trúc Frontend, PWA Core và các màn hình chính của Reseller và Merchant.
- Thiết kế Bottom Navigation Bar chuẩn thumb-friendly và an toàn cho các thiết bị có tai thỏ (iPhone).
- Ghép nối component thẻ `MediaCard` do Tester 3 nộp sau khi đã kiểm tra kỹ lưỡng.
- Trực tiếp kiểm thử kịch bản PWA bằng lệnh `npx cloudflared tunnel --url http://localhost:3000` trên điện thoại thật.

### B. Những việc tôi NÊN làm tiếp theo:
- Thêm hiệu ứng rung phản hồi nhẹ (Haptic feedback qua Vibration API) khi người dùng bấm copy link hoặc bấm nút chia sẻ thành công trên điện thoại.

### C. Những việc tôi KHÔNG NÊN làm:
- Không cho phép Tester 3 merge code trực tiếp vào `dev` dưới bất kỳ hình thức nào.
- Không để code của Tester 3 chạm vào các file cấu hình `playwright.config.ts` hay `app/layout.tsx`.
- Không viết code schema database (thuộc vai trò của BE1).

### D. Những thứ tôi cần bàn giao:
- Ứng dụng PWA hoàn chỉnh có thể mở qua link HTTPS $\rightarrow$ Bàn giao cho Tester 1 và PM để chạy demo C3.
- Giao diện Ví hoa hồng kết nối RPC $\rightarrow$ Bàn giao cho Tester 3 và Tester 1 kiểm thử.

### E. Những thứ tôi cần yêu cầu team:
- Cần UI/UX bàn giao bản vẽ Figma Mobile (390px/320px) vào sáng Thứ Ba (20/10).
- Cần BE1 bàn giao API Ví hoa hồng và API Media Library đúng tiến độ.
- Cần Tester 3 tuân thủ nghiêm ngặt ranh giới công việc, chỉ commit vào nhánh `feature/fe-t3-static-components`.

## 6. FE session handoff — 19/10/2026

### Git đã xác minh
- Worktree sạch trước cập nhật; không có tiến trình `git.exe` khi kiểm tra.
- Chỉ fetch `git fetch --no-tags origin refs/heads/dev:refs/remotes/origin/dev`, sau đó `git merge --ff-only origin/dev` thành công (6 commit).
- Commit nền: `fe50aee54a6a4e17ceba6226d67e758b73f03a3f`; nhánh local mới: `Feature_FE_W3_PWA_Mobile_Commerce`.
- Không sửa lock, refs/config thủ công hoặc các nhánh remote xung đột hoa/thường; không commit/push.

### Kế hoạch theo hạn và phụ thuộc
| ID | Đầu ra | Hạn (GMT+7, 2026) | Phụ thuộc | Hiện trạng | Việc tiếp theo |
|---|---|---|---|---|---|
| FE-W3-01 | Manifest, icons 192/512/180, metadata, SW | 20/10 17:00 | Không | Code và checks local PASS | QA trên điện thoại thật; chờ review |
| FE-W3-02 | Bottom Nav và safe area Reseller | 21/10 12:00 | UX-W3-01, hạn 20/10 12:00 | Bản đề xuất local; viewport/interaction PASS | Chờ UI/UX review và BA xác nhận điều hướng theo chiến dịch |
| FE-W3-03 | Native Web Share, poster Canvas QR | 21/10 17:00 | FE-W3-02 | Đã triển khai UI/helper; unit/Chromium fixture PASS | Gỡ blocker Git, xác minh lại trên dev tích hợp và thiết bị thật; chờ UIUX review |
| FE-W3-07 | Review MediaCard và VideoGuidelinesModal | 21–22/10 | Tester 3 bàn giao 2 component | Chưa có bàn giao xác minh | Review ngay khi nhận, không đợi 06; chưa gửi approval |
| FE-W3-04 | Chat mobile Bottom Sheet | 22/10 17:00 | UX-W3-02, hạn 20/10 17:00 | Chưa triển khai | Nhận specs, xử lý bàn phím và viewport |
| FE-W3-05 | /reseller/wallet | 23/10 12:00 | BE1-W3-04, UX-W3-01 | BE1 log ghi DONE, FE chưa tích hợp | Xác minh contract GET /api/reseller/wallet bằng mock |
| FE-W3-06 | Merchant Media Library | 23/10 17:00 | Component đã review; BE1-W3-03 | Chờ handoff | Tích hợp UI/API sau review, không kích hoạt AI ở lượt này |
| FE-W3-08 | Checklist và diễn tập C1/C3 | 23/10 17:00 | FE-W3-01, Tester 1, thiết bị thật | Chưa diễn tập | Kiểm tra local trước; tunnel/HTTPS demo ở phiên sau |

### Chuẩn bị Tester 3 và điểm cần chốt
- Truy vấn local và `git ls-remote --heads` đúng tên không thấy `feature/fe-t3-static-components`; chưa có bằng chứng PR bàn giao. Không tạo/push hoặc ghi đè công việc Tester 3 trong phiên PWA này.
- Cần chuẩn bị nhánh từ dev đã xác minh, skeleton riêng `src/components/merchant/media-card.tsx` với `MediaCardProps` trong TESTER3_W3.md và `video-guidelines-modal.tsx` với `isOpen/onClose`. Chỉ props/render, không API/Auth/Supabase và không sửa core/config/tests.
- Cần UIUX chốt handoff MediaCard: deadline component 21/10 12:00 sớm hơn specs UX-W3-04 21/10 14:00. TESTER3_W3 có mốc PR 22/10 10:00 trong khi phần mở đầu yêu cầu 21/10 17:00; dành cửa sổ review 21–22/10.
- BA_HANDOFF_MATRIX còn ghi Tester 3 làm API/RLS test và route `/reseller/commissions`; kế hoạch FE_W3/TESTER3_W3 dùng trainee UI và `/reseller/wallet`. Không tự mở rộng phạm vi; cần PM/BA đồng bộ trước tích hợp liên quan.

### PWA Core đã viết
- Một manifest duy nhất qua convention Next.js `app/manifest.ts` → `/manifest.webmanifest`; scope/start_url `/`, standalone, tên TravelLink AI và màu hiện có.
- Icons PNG 192/512/180 raster từ chính Lucide Compass đang dùng trong Brand; script tái tạo `node scripts/generate-pwa-icons.mjs`. Không đổi logo hiện tại.
- `app/layout.tsx`: applicationName, Apple web app/touch icon, `Viewport.themeColor`; một `PwaRegistration` production-only.
- SW chỉ precache 4 đường dẫn `/pwa/` cố định (offline HTML và icons), tải không credentials. Không cache HTML/RSC/Server Actions, token/session, API/Auth/Supabase; `/r/` không respondWith nên không can thiệp redirect/click.
- Navigation dùng network no-store, lỗi mạng trả offline chung không có dữ liệu tài khoản. Không lưu dữ liệu người dùng nên không thể phát lại tài khoản cũ từ SW cache sau logout.
- Lifecycle: tăng `travellink-pwa-v1` khi đổi assets/offline; SW mới chờ các tab cũ đóng hết, không skipWaiting/clients.claim. Activate chỉ xóa cache cũ cùng prefix. `/sw.js` có no-store và root scope. Dev không register, chỉ unregister `/sw.js` của ứng dụng và xóa cache cùng prefix; đóng/mở lại tab khi chuyển từ production sang dev.

### Kiểm tra và tự chạy
- Unit SW: `node --test tests/pwa-worker.test.mjs` — 3/3 PASS.
- TypeScript `node node_modules/typescript/bin/tsc --noEmit`: PASS. Production build Next.js 16.3.8: PASS, gồm TypeScript và prerender 24/24. Build dùng output riêng `build/fe-w3-pwa`, không thay output dev cũ; đã khôi phục phần Next.js tự thêm vào tsconfig và next-env về trạng thái trước build.
- Lint tất cả file code đã sửa/thêm: PASS (`app/manifest.ts`, `app/layout.tsx`, `src/components/pwa/registration.tsx`, `public/sw.js`, `next.config.ts`, script icons và 2 tệp kiểm tra PWA). `git diff --check`: PASS.
- Chromium local: PASS manifest/metadata, icons đúng kích thước, SW active/root scope và headers, cache chính xác 4 static assets, offline `/reseller` + `/merchant` trả trang chung, `/r/` lỗi mạng khi offline (không redirect/fallback), trở lại Online tải trang thật. Không chạy toàn bộ regression suite và chưa test trên thiết bị thật.
- Playwright mặc định đòi revision 1248 chưa cài; dùng Chromium revision 1243 có sẵn qua `$env:PLAYWRIGHT_CHROMIUM_PATH="$env:LOCALAPPDATA\ms-playwright\chromium-1243\chrome-win64\chrome.exe"`, rồi `node tests/pwa-browser.mjs`. Không tải/cài thêm browser. Next.js hiện tại phát `mobile-web-app-capable=yes` và Apple title/status metadata theo tài liệu kèm bản cài; test đã xác nhận HTML thực tế.
- Production local (PowerShell): `$env:NEXT_BUILD_DIR='build/fe-w3-pwa'; npm.cmd run build`, rồi `$env:NEXT_BUILD_DIR='build/fe-w3-pwa'; npm.cmd run start -- --hostname 127.0.0.1 --port 3183`.
- Mở `http://127.0.0.1:3183/privacy`; DevTools → Application → Manifest/Service Workers/Cache Storage. Reload lần hai để tab được worker kiểm soát. Cache chỉ có 4 tài nguyên `/pwa/`.
- Trong DevTools đặt Offline rồi điều hướng `/reseller` hoặc `/merchant`: chỉ thấy thông báo offline chung. `/r/` phải lỗi mạng, không trả trang/redirect đã cache. Bật Online và tải lại để phục hồi.
- Browser check: `node tests/pwa-browser.mjs` khi production local đang nghe 3183. Không gọi API tạo dữ liệu, không test AI.
- Dev: `npm.cmd run dev`; URL theo terminal (thường http://localhost:3000). Dev không dùng SW mới.
- Demo sau: cùng Tester 1 chuẩn bị HTTPS được cho phép, iOS Safari Add to Home Screen và Android Chrome Install, mở standalone, kiểm tra offline/update/logout với tài khoản thử nghiệm. Phiên này không mở tunnel/public deployment và chưa xác nhận cài trên thiết bị thật.
- POST Tracking 500 là lỗi nền chưa kết luận; phiên này không gửi POST Tracking để tái hiện, không sửa backend.

### Kiểm tra thủ công trên Chrome — người dùng xác nhận
Kết quả do người dùng trực tiếp kiểm tra tại `http://127.0.0.1:3183`, ghi nhận riêng với các kiểm tra tự động ở trên:
- Service Worker hiển thị `activated and is running`.
- Bật Offline rồi truy cập `/reseller`: hiển thị trang “Bạn đang ngoại tuyến”.
- Bỏ Offline và bấm “Thử lại”: tải được `/login?next=%2Freseller`.
- Phạm vi xác nhận: SW hoạt động và luồng offline → online → trang đăng nhập trên Chrome local. Chưa kiểm tra cài đặt/Add to Home Screen hoặc standalone trên điện thoại thật; FE-W3-01 vẫn chờ QA thiết bị thật và review.
- Lượt ghi nhận này chỉ cập nhật tài liệu, không chạy lại test, không sửa code, không commit/push.

## 7. FE-W3-02 — Bottom Navigation & Safe Area

### Phạm vi và mapping trước triển khai
- Giữ nhánh `Feature_FE_W3_PWA_Mobile_Commerce`, nền `fe50aee`; không fetch/pull/chuyển nhánh. Giữ toàn bộ PWA Core và bằng chứng thủ công FE-W3-01 ở trên.
- Chưa thấy link Figma/spec bàn giao UX-W3-01 trong repo: đây là bản đề xuất theo token Coastal Editorial hiện có, **Chờ UI/UX review**, chưa xác nhận khớp Figma.

| Mục | Portal thật | Preview fixture local | Trạng thái / cần xác nhận |
|---|---|---|---|
| Khám phá | `/reseller/campaigns`; `/reseller` đã redirect tới danh sách | `/preview/reseller` | Route có sẵn; active cả khi xem chi tiết chưa chọn khu vực |
| Nội dung AI | Trên chi tiết chiến dịch đang mở: `#reseller-content-kit` | Cùng anchor trên chi tiết fixture | Ở danh sách: nút hướng dẫn chọn chiến dịch, không giả route tổng hợp hoặc tự chọn ID; chờ BA/UIUX xác nhận điều hướng dài hạn |
| Link & QR | Trên chi tiết chiến dịch đang mở: `#reseller-tracking` | Cùng anchor trên chi tiết fixture | Chỉ cuộn/focus tới khu vực Tracking đang có, không mở tạo link tự động hoặc đổi cơ chế Tracking; ở danh sách: hướng dẫn chọn chiến dịch |
| Ví hoa hồng | Chưa nối route vì `/reseller/wallet` chưa tồn tại | Không giả số dư/tài khoản | Nút “Sắp có” mở giải thích; FE-W3-05 chưa triển khai. BA matrix còn dùng `/reseller/commissions`, cần đồng bộ |

### Giao diện và tương tác
- `bottom-nav.tsx` + CSS Module dùng nền kem, teal, accent đất nung và Lucide icons 22px/1.75 từ hệ thống có sẵn. Không đổi font/logo/CSS toàn cục.
- Mobile <768px: thay navigation đầu trang bằng dock bốn mục; desktop ≥768px giữ navigation hiện có. Portal chỉ bật dock sau guard `allowed`; preview vẫn dùng fixture development-only, không đọc dữ liệu tài khoản thật.
- Active có nền, viền, chữ đậm và dấu gạch nhỏ, không chỉ khác màu. `aria-current=page` cho Khám phá, `location` cho Content Kit/Tracking theo hash. Anchor focus được, hỗ trợ lịch sử hash và reduced motion.
- Nav cao 88px; shell chừa 88px + `env(safe-area-inset-bottom)` + 16px. Safe area ngang hỗ trợ landscape; `viewportFit=cover` chỉ ở layout Reseller, giữ root PWA như cũ.
- Z-index nav 20; Tracking và hộp hướng dẫn dùng native dialog/top layer, giữ modal cao hơn dock. Nút ít nhất 44×44px, focus rõ; hướng dẫn đóng bằng Escape và trả focus về nút mở.
- Khi đang nhập và visualViewport thu hẹp >150px, dock tạm ẩn để tránh nổi trên bàn phím. Đây là hỗ trợ theo visualViewport, chưa phải bằng chứng bàn phím iOS/Android thật.
- Nút hướng dẫn chờ hydration trước khi nhận thao tác, tránh lần tải đầu bấm khi JavaScript chưa sẵn sàng. Next.js dev indicator chuyển sang góc trên phải trong `next.config.ts` để không che Khám phá khi kiểm tra local; giữ nguyên cấu hình PWA headers.

### Kiểm chứng và cách xem
- TypeScript trước build: PASS. Browser fixture Chromium revision 1243: PASS 320/390/768/1440, không tràn ngang ở danh sách/chi tiết, mobile chỉ một navigation, desktop giữ header nav, active route/hash đúng, nút ≥44×44px, chữ không bị cắt, footer không bị che.
- PASS thao tác hướng dẫn bằng Enter/Escape và trả focus, focus outline, reduced motion, điều hướng Content Kit/Tracking và Back theo hash, modal QR mock giữ focus bên trong/top layer không bị dock đè, quay lại Khám phá, lọc tìm kiếm, ngoài Reseller (`/privacy`) không có dock. Không có page errors hoặc API/write/external requests trong bài test; không dùng session thật.
- PASS mô phỏng visualViewport 420px khi focus tìm kiếm (ẩn dock), phục hồi viewport (hiện lại), và override inset đáy 34px (nav/shell cùng tăng khoảng đệm, footer vẫn không bị che). Đây là mô phỏng, không phải bằng chứng bàn phím/safe area thật.
- Đã chụp và mở xem ảnh trong `build/fe-w3-nav-evidence/`: feed 320/390/768/1440, Content Kit và Tracking modal 320/390, inset 34px ở 390. Sau xem ảnh đã bỏ hàng trống preview mobile và rút chữ phụ thành “Mở chiến dịch” để thoáng hơn ở 320px. Ảnh review chỉ ẩn badge inspector của Next trong trình duyệt test, không ẩn thành phần ứng dụng.
- Lần kiểm tra đầu gặp cold compile/filesystem chậm và badge Next dev chặn click; sau warm-up/điều chỉnh công cụ test, bộ kiểm tra mục tiêu trên đã PASS. Production build `$env:NEXT_BUILD_DIR='build/fe-w3-nav-prod'; npm.cmd run build`: PASS, gồm TypeScript cuối cùng và sinh 24/24 trang. Không chạy toàn bộ suite không liên quan. Đã dừng dev server kiểm chứng và khôi phục các đường dẫn Next.js tự sinh trong tsconfig/next-env về trạng thái đầu phiên; không thay output PWA build cũ.
- Lint phần code sửa/thêm (nav, shell, detail anchors, Reseller layout, next.config, test mục tiêu): 0 lỗi, 1 cảnh báo có sẵn về prop `preview` chưa dùng trong `campaign-detail.tsx`; không sửa logic Tracking để xử lý cảnh báo này.
- Dev fixture: `$env:NEXT_BUILD_DIR='build/fe-w3-nav'; node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3184`.
- Mở `http://127.0.0.1:3184/preview/reseller`, chọn Device Mode 320/390px. Bấm Nội dung AI hoặc Link & QR ở danh sách để xem hướng dẫn; bấm “Xem chi tiết Hội An Foodie” để vào Content Kit/Tracking đúng chiến dịch fixture.
- Chi tiết mock Tracking: `http://127.0.0.1:3184/preview/reseller/campaigns/11111111-1111-4111-8111-111111111111?state=approved&tracking=success`. ID này chỉ phục vụ route preview fixture có sẵn, không đưa vào navigation portal thật.
- Kiểm tra tự động có mục tiêu: `$env:PLAYWRIGHT_CHROMIUM_PATH="$env:LOCALAPPDATA\ms-playwright\chromium-1243\chrome-win64\chrome.exe"; node tests/reseller-bottom-nav.mjs`.
- Chưa thử safe area/bàn phím trên điện thoại thật; chưa có UIUX review hoặc xác nhận của BA về trang tổng hợp. Không đánh dấu cả tuần hoàn thành.
- File của FE-W3-02: `src/components/reseller/bottom-nav.tsx`, `bottom-nav.module.css`, `shell.tsx`, `campaign-detail.tsx` (chỉ thêm wrapper anchor), `app/reseller/layout.tsx`, `next.config.ts` (dev badge), `tests/reseller-bottom-nav.mjs`, FE_W3.md và phần FE TEAM_WORK_LOG.md. `git diff --check`: PASS. Không chỉnh root layout, manifest/SW, Auth/backend/Tracking logic, .env.local, DB hoặc nhánh FE tuần 2 trong phiên này.

## 8. FE-W3-03 — Share link & Canvas poster QR — 21/10/2026

### Bảo toàn và đồng bộ Git: chưa hoàn tất
- Nhánh giữ nguyên `Feature_FE_W3_PWA_Mobile_Commerce`. HEAD đầu phiên `fe50aee54a6a4e17ceba6226d67e758b73f03a3f`.
- Không thấy tiến trình Git/server của dự án khi kiểm tra trước đồng bộ. Fetch đúng một ref: `git fetch --no-tags origin refs/heads/dev:refs/remotes/origin/dev` thành công, `origin/dev` = `86babd02f0a073c0da9a0bc97f5906173da4a675`.
- Đã kiểm tra diff/staged và tạo checkpoint LOCAL `c5137460375923620d1e9a990efdf40d9a3c680c`: 20 file PWA/Bottom Nav/source/test/tài liệu/icons thương hiệu. Không có env/build/cache/ảnh bằng chứng, không stage mù toàn bộ. `tsconfig.json` có sẵn hai đường dẫn `build/fe-w3-nav-local` được giữ riêng, không commit.
- `git merge --no-commit origin/dev` thất bại với lỗi Windows nguyên văn:
  ```text
  error: unable to unlink old 'src/components/reseller/content-kit.tsx': Invalid argument
  error: unable to unlink old 'src/lib/ai/prompts/content-factory.ts': Invalid argument
  Merge with strategy ort failed.
  ```
- Đã dừng thao tác cập nhật Git, không thử merge lại, không xóa lock/sửa ACL/reset/clean. HEAD sau lỗi vẫn `c513746`, không có `MERGE_HEAD`/conflict mở, không có merge commit; **dev 86babd0 CHƯA được tích hợp**.
- Một số file mới từ dev còn untracked sau lần merge lỗi (Merchant Media/Wallet/Telegram APIs, BE2 video modules/schemas/handoff/tests/scripts và Tester 2 evidence). Giữ nguyên để xử lý sau; không gộp/commit các file này như sản phẩm FE-W3-03. Các thay đổi FE-W3-03 sau checkpoint để người dùng review, không commit thêm/push/PR.

### Đối chiếu bàn giao (đọc từ origin/dev đã fetch, không coi là đã merge)
- Dev bổ sung Media Library API `GET/POST/DELETE /api/merchant/media` và `MediaReferenceItem`; Wallet handler được chuyển từ `src/app/api/reseller/wallet` sang `app/api/reseller/wallet`.
- BE2 thêm pipeline video offline/schema/sample và taxonomy intent + checkout attribution; live Gemini còn pending. Content Kit nhận thêm campaign/product/preview props và thao tác Telegram trong dev. Các cập nhật này chưa có đủ trong tracked worktree do merge lỗi; không gọi Telegram/AI để kiểm chứng.
- Không có thay đổi Tracking endpoint/FE parser trong diff dev lần này: vẫn `/api/tracking-links/generate` và `data.short_url`. POST Tracking 500 chưa được tái hiện bằng API thật, **chưa kết luận đã hết**.
- UIUX_W3/BA_HANDOFF_MATRIX/TESTER3_W3 không có bàn giao mới trong diff; chưa thấy spec/asset poster hay Figma mới. FE-W3-02 và bố cục poster FE-W3-03 vẫn **Chờ UI/UX review**.
- `git ls-remote --heads` thấy nhánh `feature/fe-t3-static-components` tại `f66ff8cbb9c40c8917f5cfd9dc7e31fefbf7432f`; tree tại commit đó chưa có `media-card.tsx`/`video-guidelines-modal.tsx`. Chưa có component để review FE-W3-07 được xác minh; chưa merge/review/approve trên GitHub.

### Đã triển khai độc lập với backend
- `share.ts`: payload giữ nguyên link đang hiển thị; Web Share được gọi trực tiếp từ click, không tạo link/đi theo `/r/`. Có pending/chống bấm lặp, phân biệt AbortError (hủy) và lỗi; khi không hỗ trợ hướng dẫn Copy link sẵn có. Không xác nhận đã đăng/gửi từ kết quả native dialog và không hứa có ứng dụng mạng xã hội cụ thể.
- `canvas-qr.ts`: PNG 1080×1440, tên campaign/product đã có, font/màu Coastal Editorial và Compass/icon thương hiệu hiện có. Campaign contract hiện không có trường ảnh sản phẩm, nên dùng minh họa `public/coast.svg` và ghi rõ không phải ảnh sản phẩm; lỗi ảnh/CORS/taint dùng nền thương hiệu. Không thêm proxy backend, không tự bịa giá/ưu đãi/hoa hồng.
- QR dùng nguyên `short_url`, contrast đen/trắng, quiet zone 4 module và ô pixel nguyên; URL/tên dài wrap/ellipsis trong khung cố định, QR vẫn chứa URL đầy đủ. Không dùng destination_url làm QR.
- `share-actions.tsx` trong modal Tracking: xem preview, tải PNG, chia sẻ file khi canShare(files) hỗ trợ; fallback tải ảnh nếu không hỗ trợ. Object URL preview bị revoke khi đổi phạm vi/unmount; URL tải tạm revoke sau dùng. Không cache/lưu poster vào SW/localStorage.
- Kết quả async có generation/mount guard; đổi campaign/product/session/link làm reset dữ liệu và bỏ kết quả cũ. Panel live chỉ quan sát `onAuthStateChange` và guard phiên hiện có, không gọi Auth/DB trong callback; khi phiên thay đổi xóa preview và chặn Share/Poster tới khi tải lại. Cơ chế Tracking request/contract/QR/Copy cũ được tái sử dụng; dialog UI thêm key và bỏ kết quả request của component đã unmount để không nhận link cũ vào phạm vi mới.
- Preview development-only luôn dùng request fixture, kể cả không có query tracking; nhãn mô phỏng/localhost giữ rõ. Fallback Tracking trong CampaignDetail bị chặn nếu preview thiếu injection, không rơi sang API thật. Có fixture chữ/link dài, thiếu ảnh/sản phẩm và CORS.
- Tham chiếu observer phiên: [Supabase onAuthStateChange](https://supabase.com/docs/reference/javascript/auth-onauthstatechange). Đã đọc hướng dẫn Next.js kèm bản cài về Client Components trước khi dùng navigator/canvas.

### Bằng chứng kiểm chứng (không phải kiểm tra thủ công của người dùng)
- Unit `node --experimental-strip-types --test tests/reseller-share.test.ts`: **4/4 PASS**.
- TypeScript riêng phần FE `node node_modules/typescript/bin/tsc --noEmit -p tests/tsconfig.fe-w3-share.json`: **PASS**, gồm lần chốt sau thay đổi cuối. Config này chỉ xác minh FE; không thay thế kết quả toàn repo. Lint tất cả source/test FE-W3-03 sửa/thêm: **PASS, 0 lỗi/0 cảnh báo**.
- TypeScript toàn repo chạy trước phần FE: FAIL với 6 lỗi từ file mới còn lại sau merge lỗi: `toGeminiJsonSchema` không export ở content-schema; `detectSalesIntent`, `salesAgentResponseSchema` và `SalesReply.intentDetected` thiếu ở code Sales Agent tracked cũ. Không sửa backend hay giảm assertions để làm sạch giả.
- Chromium fixture tại 320/390/768/1440: PASS Share payload URL, file PNG, pending/dedup, supported/unsupported/cancel/error, Copy mock, download, layout không tràn, focus trap/return, modal trên Bottom Nav.
- **Đã tải PNG rồi giải mã bằng jsQR** và so đúng URL textarea: PASS poster bình thường, URL/tên tiếng Việt dài, thiếu ảnh/product label, ảnh lỗi, CORS thực bằng HTTP fixture loopback không ACAO, canvas taint fallback. Canvas xuất thất bại hoàn toàn có lỗi rõ và không đưa preview giả.
- PASS đổi session/campaign: thu hồi URL cũ, xóa kết quả, giữ request ảnh đang pending bằng fixture URL riêng theo scope rồi nhả sau đổi campaign; không có object URL/kết quả poster muộn lọt vào phạm vi mới. Preview không query tracking cũng dùng mock; trạng thái chưa có link và cảnh báo localhost PASS.
- Bài test chặn API/POST/tracking redirect/external requests: không phát sinh request bị cấm/page errors. HTTP asset server 3186 chỉ thuộc test, phục vụ SVG local, không proxy/gọi ra ngoài; đã đóng sau test. Native Share và Clipboard được mock, không phải bằng chứng chia sẻ/copy thủ công hay đăng bài thực tế.
- Đã chụp và mở xem poster/modal, ảnh trong `build/fe-w3-share-evidence-20261021/`; ảnh review chỉ ẩn badge dev inspector, không ẩn UI ứng dụng. Bố cục poster vẫn chờ UIUX review.
- Production build output riêng `build/fe-w3-share-prod-20261021`: bundle **Compiled successfully**, nhưng **BUILD FAIL ở TypeScript**, đúng 6 lỗi baseline AI/Sales nêu trên. Không tắt type checking/giảm assertions/sửa backend để che lỗi. Không tái dùng/xóa cache `build/fe-w3-nav`, không sửa quyền Windows.
- Đã dừng dev server do phiên này tạo. Chỉ bỏ các include output `fe-w3-share-*` do Next tự thêm; giữ nguyên hai include `fe-w3-nav-local` đã có đầu phiên. `next-env.d.ts` trỏ lại output dev local `build/fe-w3-nav-local` đang có. Không đụng .env.local/exclude/backups hoặc xóa output cũ. `git diff --check`: PASS.
- File FE-W3-03 mới: `src/lib/reseller/share.ts`, `canvas-qr.ts`, `src/components/reseller/share-actions.tsx`, `tests/reseller-share.test.ts`, `reseller-share-browser.mjs`, `tsconfig.fe-w3-share.json`. File sửa: Tracking modal/CSS, CampaignDetail poster props, preview page/TrackingPreview, fixture Tracking và hai tài liệu FE. Không nhầm các file dev untracked còn lại sau merge lỗi với danh sách này.

### Cách chạy và việc tiếp theo
```powershell
$env:NEXT_BUILD_DIR='build/fe-w3-share-dev-20261021'
npm.cmd run dev -- --hostname 127.0.0.1 --port 3185
```
- Preview: `http://127.0.0.1:3185/preview/reseller/campaigns/11111111-1111-4111-8111-111111111111?state=approved&tracking=success` → Tạo link → Tạo link tiếp thị (mô phỏng) → Chia sẻ link/Tạo poster QR → xem ảnh/Tải PNG/Chia sẻ ảnh nếu thiết bị hỗ trợ.
- Biến thể fixture: `tracking=long-link&poster=long`, `tracking=success&poster=no-image`, `tracking=localhost`, `tracking=error`, `tracking=scope`. Chỉ dùng ID này trong preview, không đưa vào portal thật. `poster=cors` cần HTTP fixture của bài test, không phải asset công khai.
- Chạy test browser khi dev server 3185 đang mở: `$env:PLAYWRIGHT_CHROMIUM_PATH="$env:LOCALAPPDATA\ms-playwright\chromium-1243\chrome-win64\chrome.exe"; node tests/reseller-share-browser.mjs`.
- Portal thật: `http://127.0.0.1:3185/reseller/campaigns` (cần session Reseller hợp lệ) → chọn campaign thật → Link & QR. Phiên này không tạo link/campaign thật, không gọi AI, Telegram, `/r/` hoặc ghi Supabase dùng chung. Chưa xác minh native Share/file download/quét QR bằng điện thoại thật.
- Ưu tiên kế tiếp: xử lý quyền/unlink Windows theo người dùng/PM để tích hợp dev an toàn; kiểm chứng lại type/build/contract sau đồng bộ; review FE-W3-07 ngay khi Tester 3 bàn giao trong 21–22/10; FE-W3-04 trước 22/10 17:00, FE-W3-05 trước 23/10 12:00, FE-W3-06 và 08 trước 23/10 17:00. Giữ nguyên trạng thái chờ thiết bị thật/UIUX của FE-W3-01/02.
