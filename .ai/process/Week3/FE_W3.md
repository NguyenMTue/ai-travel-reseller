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
| FE-W3-01 | Cấu hình PWA Core (manifest, Service Worker, Meta) | P0 | ĐÃ TRIỂN KHAI — local PASS; chưa nghiệm thu thiết bị thật | Không | Diệu | `app/manifest.ts` + `public/sw.js` + metadata layout | 20/10 17:00 |
| FE-W3-02 | Bottom Navigation Bar & Responsive Safe Area cho Reseller | P0 | ĐÃ TRIỂN KHAI — chờ UIUX/QA thiết bị thật | UX-W3-01 | Diệu | Component `bottom-nav.tsx` + layout update | 21/10 12:00 |
| FE-W3-03 | Tích hợp Web Share API 1 chạm & Canvas xuất ảnh QR | P0 | ĐÃ TRIỂN KHAI — fixture/PNG thủ công; chưa native Share/điện thoại thật | FE-W3-02 | Diệu | Module `share.ts` + `canvas-qr.ts` + UI modal | 21/10 17:00 |
| FE-W3-04 | Giao diện Chat AI Sales Agent Mobile (Bottom Sheet widget) | P1 | ĐÃ TRIỂN KHAI — mock PASS; chờ UIUX/QA, chưa AI thật | UX-W3-02 | Diệu | Component `mobile-chat-sheet.tsx` | 22/10 17:00 |
| FE-W3-05 | Giao diện Màn hình Ví hoa hồng Reseller (`/reseller/wallet`) | P0 | ĐÃ TRIỂN KHAI — fixture/quan sát UI thật; chờ QA dữ liệu/quyền | BE1-W3-04 | Diệu | Route `app/reseller/wallet/page.tsx` | 23/10 12:00 |
| FE-W3-06 | Tích hợp Merchant Media Library (ghép `MediaCard` từ Tester 3) | P1 | DONE — Đã sửa quyền RLS & API, nối Live Media Library, E2E test PASS | T3-FE-W3-01, BE1-W3-03 | Diệu | Route `app/merchant/library/page.tsx` | 23/10 17:00 |
| FE-W3-07 | Code Review & Kiểm duyệt an toàn nhánh của Tester 3 | P0 | IN PROGRESS — component f9a5509 không đổi, đã ghép từ dev; PR33 đã merge bởi PM, chưa có bằng chứng BE review riêng service | T3-FE-W3-01, 02 | Diệu | PR review comments & Approval | 21/10 - 22/10 |
| FE-W3-08 | Phối hợp QA diễn tập kịch bản Demo C3 (Cloudflared Tunnel) | P0 | CHƯA KIỂM realme C21Y/Chrome; chưa diễn tập QA | FE-W3-01, Tester 1 | Diệu | Buổi diễn tập demo PWA thành công | 23/10 17:00 |

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
| FE-W3-03 | Native Web Share, poster Canvas QR | 21/10 17:00 | FE-W3-02 | Đã triển khai UI/helper; fixture PASS; Git đã đồng bộ | Chưa native Share/quét QR điện thoại thật; chờ UIUX/QA |
| FE-W3-07 | Review MediaCard và VideoGuidelinesModal | 21–22/10 | Tester 3 bàn giao 2 component | PR33 đã merge vào dev; canonical blob f9a5509 không đổi, đã ghép (mục19) | Không tự approval; chưa có bằng chứng BE review riêng media-service |
| FE-W3-04 | Chat mobile Bottom Sheet | 22/10 17:00 | UX-W3-02, hạn 20/10 17:00 | Đã triển khai UI và transport fixture | Chờ UIUX review, BE chốt contract phiên và QA thiết bị thật |
| FE-W3-05 | /reseller/wallet | 23/10 12:00 | BE1-W3-04, UX-W3-01 | UI + luồng đọc hiện có được nối; fixture kiểm chứng riêng | UIUX review, BE xác nhận contract còn thiếu và QA phiên thật |
| FE-W3-06 | Merchant Media Library | 23/10 17:00 | Component đã review; BE1-W3-03 | Live Media Library hoàn tất (mục 21) | Đã nối API thật, sửa RLS/quyền, test E2E đạt |
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

### Lịch sử trước khôi phục Git (kết quả mới xem mục 9)
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
- Production build output riêng `build/fe-w3-share-prod-20261021`: bundle **Compiled successfully**, nhưng **BUILD FAIL ở TypeScript**, đúng 6 lỗi AI/Sales trong cây mã tích hợp thiếu nêu trên (không phải kết luận baseline dev). Không tắt type checking/giảm assertions/sửa backend để che lỗi. Không tái dùng/xóa cache `build/fe-w3-nav`, không sửa quyền Windows.
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


## 9. Khôi phục Git và đồng bộ dev — 21/10/2026

- Giữ nhánh `Feature_FE_W3_PWA_Mobile_Commerce`; không fetch/pull/push hoặc triển khai FE-W3-04 trong phiên này. Kiểm tra ban đầu: HEAD `c5137460375923620d1e9a990efdf40d9a3c680c`, index khớp HEAD, staged rỗng, không `MERGE_HEAD`, không unmerged entries. Không suy diễn merge đang mở từ lần merge thất bại.
- Backup ngoài repo: `E:\THUCTAP\ai-travel-reseller-recovery\snapshot-20261021T031151Z-c201fe00`. Đã đọc lại và xác minh SHA-256 của 55 file: toàn bộ 9 tracked thay đổi, 31 untracked, ignored config/env cần bảo toàn và bằng chứng Git (binary staged/unstaged patches, index, stage manifest, status, untracked/ignored inventory). Không in secret. Build/cache/node_modules/output ignored được giữ tại chỗ. Backup bổ sung `merge-materialization/` xác minh 53 file hiện có trước khi materialize merge, gồm route Wallet cũ; có manifest, phân loại và merge plan. Đã kiểm lại hash backup sau khôi phục.
- Phân loại bằng Git blob hash (có normalization theo path): 25 untracked khớp chính xác dev `86babd0`; 6 file mới FE-W3-03; 8 tracked FE03 (trong đó CampaignDetail và TEAM_WORK_LOG có thay đổi incoming dev cần kết hợp); `tsconfig.json` là cấu hình output local có sẵn, giữ ngoài commit. Không xóa/gộp bừa untracked.
- Chẩn đoán unlink: hai file `src/components/reseller/content-kit.tsx`, `src/lib/ai/prompts/content-factory.ts` không ReadOnly; effective access khi chạy tài khoản hiện tại ngoài sandbox cho phép `GENERIC_WRITE` nhưng từ chối `DELETE` và quyền `FILE_DELETE_CHILD` của thư mục cha với `Win32=5`. ACL Users chỉ Write/Read, không Modify/Delete; owner Administrators. Windows Restart Manager trả thành công, danh sách holder rỗng; không tìm thấy Git/Node của dự án trước phục hồi. Không có bằng chứng server giữ file; không dừng tiến trình không liên quan, đổi ACL, chạy Administrator hay xóa lock.
- Checkpoint LOCAL `4df3972c03daee946f9a932818a48805a448d01f`: chỉ 14 file FE-W3-03 đã kiểm staged diff; không đưa 25 file dev hoặc tsconfig/env/build vào checkpoint.
- Dùng `git merge-tree --write-tree` tính merge ba chiều vào object database và index tạm; conflict duy nhất CampaignDetail được kết hợp: giữ wrapper anchor Bottom Nav, blocked preview và poster props của FE; thêm `campaignId`, `productId`, `preview` cho ContentKit từ dev. TEAM_WORK_LOG tự merge giữ đủ nội dung BE và FE. Ghi đúng blob kết quả tại chỗ để tránh unlink trên hai file thiếu quyền Delete; chỉ bỏ route Wallet cũ đã xác minh rename sang `app/api/reseller/wallet/route.ts` và backup trước đó. Không restore/reset/abort/clean hàng loạt.
- Sau khi xác minh worktree/index và staged diff: tạo merge LOCAL bằng `git commit-tree` với tree đã giải quyết `6801ce3fc7bed641140422582f0972cf28463349`, hai cha `4df3972` và `86babd02f0a073c0da9a0bc97f5906173da4a675`; `git update-ref` compare-and-swap trên đúng nhánh hiện tại. Merge commit **`e5ceb164a28a6b18f71f480bf3def526d9d4bd81`**; dev là ancestor của HEAD, không MERGE_HEAD/unmerged entries, không untracked còn lại. Quyền Delete Windows chưa thay đổi; thao tác Git sau này cần lưu ý cùng hạn chế quyền.
- Bảo toàn FE: so object xác nhận PWA root layout/manifest/SW/registration/icons và Bottom Nav/layout/shell không thay so checkpoint `c513746`; các file FE03 ngoài CampaignDetail và log merge giữ đúng blob checkpoint `4df3972`. `.env.local`, ignored audit files và exclude giữ nguyên hash; tsconfig local/next-env được bảo toàn khi kết thúc kiểm chứng.

### Phân loại lại sáu lỗi AI/Sales
- Sau đồng bộ đầy đủ, `node node_modules/typescript/bin/tsc --noEmit`: **PASS**. AI modules, Sales/Video tests và ContentKit khớp chính xác tree dev `86babd0`; không sửa backend để làm pass.
- `toGeminiJsonSchema` đã có trong `content-schema.ts`; `detectSalesIntent`, `salesAgentResponseSchema`, `SalesReply.intentDetected` đã có trong `sales-agent.ts` đầy đủ từ dev. Sáu lỗi trước đây là **lỗi do tích hợp thiếu sau merge thất bại**, không phải bằng chứng lỗi dev thật hoặc lỗi FE mới. Các ghi chép FAIL mục 8 là lịch sử kiểm tra trên cây mã chưa nhất quán, được thay thế bởi kết quả mục này.
- Lần typecheck đầu của phiên khôi phục phát hiện 3 import tương đối từ file `.tsx` tạm phục vụ giải conflict trong `build/`; đổi file audit sang `.txt`, không đổi cấu hình typecheck; chạy lại toàn repo PASS.
- Offline: PWA worker **3/3 PASS**; Share **4/4**, Sales **5/5**, Video **9/9** (tổng **18/18 PASS**). Lint CampaignDetail/Share/Canvas/test Share **0 lỗi, 0 cảnh báo**. Không chạy live AI hoặc toàn suite không liên quan.


### Kết quả cuối phiên khôi phục
- Production build `$env:NEXT_BUILD_DIR='build/fe-w3-recovery-prod-20261021'; npm.cmd run build`: **PASS**, bao gồm TypeScript và sinh **27/27 trang**. Không tắt typecheck hoặc sửa backend. Output mới độc lập, không tái dùng/xóa output cũ.
- Chromium production `node tests/pwa-browser.mjs`: **PASS** manifest/meta/icons/headers/scope, static-only cache, offline portal chung, bypass Tracking và online recovery. Giữ riêng bằng chứng Chrome thủ công FE-W3-01 người dùng đã xác nhận; không diễn giải browser test là cài đặt điện thoại thật.
- Chromium fixture Bottom Nav và Share: **PASS 320/390/768/1440**, navigation/hash/focus/modal, keyboard visualViewport và inset 34px mô phỏng; Share/native mock, PNG download + QR decode, text/URL dài, ảnh lỗi/CORS/taint, fallback, session/campaign reset và kết quả muộn. Không page errors/API write/Tracking click/external requests. Test dùng Chromium local revision 1243. Lần Nav đầu timeout khi cold compile/filesystem chậm; chạy lại sau warm-up PASS, không thay assertion hoặc code sản phẩm.
- Bài test gốc giữ nguyên; bản chạy tạm dưới `build/git-recovery-20261021/` chỉ đổi base Nav sang server 3185 và output evidence để không ghi đè bằng chứng cũ. Ảnh mới `build/fe-w3-recovery-nav-evidence/`, `build/fe-w3-recovery-share-evidence/`; đã mở xem feed 390px và modal Share 320px, không thấy lệch thiết kế do đồng bộ.
- Đã dừng đúng hai server test do phiên này tạo (3185 dev, 3183 production), khôi phục nguyên byte `tsconfig.json` và ignored `next-env.d.ts` từ snapshot đầu phiên sau khi Next tự thêm output mới. Hai include `fe-w3-nav-local` vốn có vẫn giữ ngoài commit. `.env.local` và ignored audit files/exclude khớp SHA-256 đầu phiên.
- HEAD cuối: `e5ceb164a28a6b18f71f480bf3def526d9d4bd81`. Không merge mở, staged/conflict/untracked rỗng. Worktree còn đúng hai tài liệu FE của phiên này và `tsconfig.json` local có sẵn; không commit tài liệu kết quả này. `git diff --check` PASS.
- Không còn lỗi TypeScript/build hoặc test mục tiêu sau đồng bộ. Còn chờ UIUX review và kiểm chứng native Share/install/standalone/safe-area/bàn phím trên điện thoại thật; không đánh dấu cả tuần hoàn thành. Quyền Windows Delete chưa đổi; không có yêu cầu người dùng thao tác để hoàn tất merge phiên này.

## 10. FE-W3-04 — Customer Chat Bottom Sheet — 21/10/2026

### Đồng bộ trước triển khai
- Nhánh `Feature_FE_W3_PWA_Mobile_Commerce`; HEAD đầu phiên `e5ceb164`, không MERGE_HEAD/unmerged. Xem diff cả ba file có sẵn; checkpoint LOCAL `0b06f19` chỉ hai tài liệu FE, giữ tsconfig output local ngoài commit, không đưa env/build vào Git.
- Fetch đúng một ref dev: `86babd0` → `0b1d607`. Dev thêm PostHog instrumentation/ChatPanel events, Core Video Engine, workflow Telegram/click và test plan PWA; không có thay đổi Auth, PWA Core hoặc Wallet trong diff. Migration từ dev được merge nguyên trạng, KHÔNG chạy migration/seed/DB. Media thêm generator/types/test, chưa tích hợp UI video.
- Merge LOCAL `7116ac640dad77cbbc7f74753dc0b34554ec0086` thành công, không conflict/unlink hoặc merge mở. Incoming Markdown có trailing whitespace được giữ nguyên. Dev `0b1d607` đã là ancestor của HEAD; không coi fetch là đã merge.
- TypeScript sau merge phát hiện dependency PostHog chưa cài và lỗi narrowing `m.checkout` trong callback analytics mới từ dev. Cài dependency bằng `npm.cmd install --ignore-scripts --no-audit --no-fund`, lockfile không đổi; bổ sung guard trong callback FE. TypeScript toàn repo sau đó PASS. Đã đối chiếu nguồn lỗi, không gán bừa là baseline.

### Phạm vi, thiết kế và contract
- Theo BA_AI_SALES_AGENT_SPEC/UIUX_W3/BA_HANDOFF_MATRIX: chat dành cho KHÁCH HÀNG tại `/chat` sau liên kết sản phẩm với reseller/campaign/product attribution. Không gắn vào portal Reseller/Merchant hoặc mở `/r/` để thử.
- Tái sử dụng ChatPanel, không thêm hệ thống chat thứ hai. Runtime: POST `/api/chat`, `message`, `conversation_history` tối đa 12, `attribution_context`; response JSON `reply`, `intent_detected`, `suggested_checkout_url`. Không streaming. BA còn mô tả `conversation_id`/checkout card; runtime chưa có, không tự đổi backend/contract hoặc mở rộng checkout.
- MobileChatSheet nhận khóa session/context UI trong bộ nhớ; thay reseller/campaign/product/sessionKey remount ChatPanel, abort request cũ và bỏ phản hồi muộn kể cả transport cố ý không tuân abort. `/chat` hiện không có server conversation/session ID; cần BE xác nhận contract nếu mở rộng vòng đời phiên thật. Không tuyên bố đã nối quản lý session server mới.
- `/chat` tái sử dụng live transport đã có khi người dùng chủ động gửi, không gửi AI khi mount/mở. Desktop giữ ChatPanel hai cột và checkout hiện có. Chưa kiểm chứng AI thật. Preview `/preview/chat` chỉ development, noindex, nhãn **Mô phỏng**, truyền transport fixture vào chính ChatPanel; không đưa phản hồi giả vào route thật, không analytics fixture/AI/DB.
- Chưa thấy Figma/spec UX-W3-02 bàn giao cụ thể: bản đề xuất Coastal Editorial theo token/font/Lucide hiện có, **Chờ UI/UX review**. CSS Module riêng, không sửa font/logo/global CSS/PWA.
- Mobile <768px: launcher trong nội dung khách hàng, không che CTA; native dialog 90% visualViewport, mở rộng toàn viewport, safe area, compose cố định trong flex và log cuộn. Focus đầu/Tab vòng/Escape/trả focus, khóa và khôi phục scroll nền, reduced motion. Desktop chỉ một ChatPanel; đóng/mở và đổi breakpoint giữ hội thoại cùng context.
- Gửi rỗng/lặp bị chặn, lỗi/timeout/offline giữ bản nháp để tự sửa/gửi, không retry tự động. Cuộn theo phản hồi chỉ khi gần đáy; reply plain text giữ xuống dòng, không chèn HTML. Không localStorage/IndexedDB/cache PWA cho hội thoại cá nhân.
- Files chính: `mobile-chat-sheet.tsx`/CSS Module, ChatPanel, `src/lib/chat/transport.ts`, `/chat` page/scoped viewport layout, `app/preview/chat/*`, fixture và hai test Chat mục tiêu.

### Bàn giao và giới hạn giữ nguyên
- Người dùng đã tải PNG poster từ preview FE-W3-03 thành công: ghi nhận thủ công riêng, chưa xác nhận native Share hoặc quét QR bằng điện thoại.
- Tracking credential lần kiểm tra chỉ đọc trước trả 401 Invalid API key; chờ BE xác nhận. Phiên này không thử key, gọi Tracking/AI/Telegram/webhook/tạo đơn, sửa DB hoặc .env.local. Không gán kết quả Tracking thành nguyên nhân Chat.
- Tester 3: chưa thấy MediaCard/VideoGuidelinesModal trong dev mới hoặc worktree, chưa có bằng chứng PR bàn giao mới, chưa review/approve. Cửa sổ FE-W3-07 21–22/10 trước FE-W3-06, cần PM/UIUX xác nhận handoff. Không fetch nhánh Tester 3 hoặc sửa công việc của Tester 3.
- Chỉ tạo checkpoint/merge local phục vụ đồng bộ; FE-W3-04 mới và tài liệu phiên này chưa commit. Giữ trạng thái chờ review/thiết bị thật FE-W3-01/02/03, không đánh dấu cả tuần hoàn thành.

### Kiểm chứng và cách chạy
- Unit transport `node --experimental-strip-types --test tests/chat-transport.test.ts`: **2/2 PASS**; payload/history/attribution, HTTP/JSON invalid và không retry. PWA worker **3/3 PASS**. TypeScript toàn repo và lint phần sửa/thêm **PASS, 0 lỗi/0 warning** sau các sửa lỗi FE.
- Chromium fixture: **PASS 320/390/768/1440**, send/receive/pending/dedup, close/reopen/expand, focus return/Tab vòng, lỗi/timeout/offline giữ bản nháp, đổi session/campaign/product và bỏ phản hồi muộn, nội dung dài an toàn, không tự kéo khi đọc tin cũ. Mở `/chat` không gửi API. Không page errors/API write/Tracking click/external requests; không kiểm chứng AI thật.
- Kiểm tra thêm: **PASS** reduced motion, mô phỏng visualViewport cao 420px và inset đáy 34px; không coi đây là kiểm chứng bàn phím/safe area trên điện thoại thật. Ảnh `build/fe-w3-chat-evidence/` đã mở xem mobile 320, desktop 1440, keyboard 390 và màn hình ban đầu. Sau xem ảnh tăng nhãn người gửi lên 11px và quick reply lên 12px.
- Browser test phát hiện click trước hydration và vòng focus native có thể thoát modal; đã sửa launcher chờ hydration và thêm Tab trap, không giảm assertions. Harness được giới hạn alert trong dialog (không nhầm Next route announcer) và đợi native close event khôi phục scroll. Có lần chụp bổ sung bị lỗi encoding command shell; sửa lệnh chụp, không đổi sản phẩm để làm test pass.
- Production guard đã kiểm bằng GET local `/preview/chat`: **404** trong production, không in body hoặc gọi endpoint ghi dữ liệu. Build kết quả cuối được ghi bên dưới; không tái sử dụng output của user.

Hai lệnh PowerShell riêng biệt, chạy ở repo root:
```powershell
$env:NEXT_BUILD_DIR='build/fe-w3-chat-dev'
```
```powershell
npm.cmd run dev -- --hostname 127.0.0.1 --port 3187
```
- Mở `http://127.0.0.1:3187/preview/chat`, Device Mode 320/390px → Hỏi TravelLink Assistant → nhập và Gửi. Đóng để chọn Lỗi/Timeout/Phản hồi chậm/Nội dung dài, đổi campaign/product hoặc phiên; mở lại. Offline dùng DevTools khi trang đã tải. Desktop 768/1440 hiển thị khung chat hiện có. Đều là fixture, không dùng để tạo đơn hoặc xác nhận tư vấn thật.
- Chạy browser: đặt `PLAYWRIGHT_CHROMIUM_PATH` tới Chromium local revision 1243 rồi `node tests/chat-bottom-sheet.mjs`. Live route `/chat` chỉ nhận attribution đã có; không tự thêm ID fixture vào route thật.
- Tiếp theo: UX-W3-02 review, BE xác nhận khác biệt session/checkout card trong BA, QA iOS/Android thật; tiếp nhận FE-W3-07 từ Tester 3, sau đó FE-W3-05/06 theo kế hoạch. Không có bằng chứng để đánh dấu UIUX reviewed hoặc cả tuần hoàn tất.
- Chốt phiên: production build cuối `$env:NEXT_BUILD_DIR='build/fe-w3-chat-release'; npm.cmd run build` **PASS**, gồm TypeScript và **28/28 trang**; browser rerun sau chỉnh chữ cuối cùng **PASS**. Các build trước được dừng chủ động để sửa hydration/focus/độ dễ đọc; không báo các lần bị dừng là build pass. Không tắt typecheck hoặc làm yếu assertions.
- Đã dừng đúng server kiểm chứng 3187/3188 của phiên; server 3185 của người dùng không bị dừng. Khôi phục nguyên byte tsconfig/next-env đầu phiên sau khi Next tự thêm output test; giữ các include nav-local/share-manual vốn có. SHA-256 `.env.local` và `.git/info/exclude` không đổi. PWA/Nav/Share/source backend không đổi bởi FE-W3-04; package-lock không đổi sau cài dependency dev.
- HEAD cuối vẫn `7116ac640dad77cbbc7f74753dc0b34554ec0086`; không MERGE_HEAD, staged hoặc unmerged. Git status còn source/test/docs FE-W3-04 mới chưa commit và tsconfig local cũ. `git diff --check` PASS. Không push/PR, chạy migration/seed, gọi AI/Tracking/Telegram thật hoặc mở tunnel.

## 11. Chẩn đoán 404 chi tiết chiến dịch — 21/10/2026
- Báo cáo người dùng: Feed 3185 tải 45 chiến dịch nhưng `/reseller/campaigns/44444444-4444-4444-4444-111111111111` trả 404 mặc định. Kiểm tra nhánh/HEAD/status và giữ nguyên mọi thay đổi FE-W3-04, không fetch/pull/merge/commit/push.
- Server cũ nghe 127.0.0.1:3185 là PID 3124, Next trong đúng repo `E:\THUCTAP\ai-travel-reseller`; worker xác nhận output `build/fe-w3-share-manual`. Trước sửa, `dev/types/routes.d.ts` không chứa `/reseller/campaigns/[id]` hoặc preview detail, dù có Feed; log có auth VERIFIED, membership ALLOWED_POSTGRES_UUID và feed READY nhưng không có detail.query, chỉ compile trang 404. App-paths manifest mới có Feed (manifest dev chỉ phản ánh phần đã compile, không dùng riêng nó để kết luận route vắng).
- Đối chiếu source: Feed dùng `/reseller/campaigns/${encodeURIComponent(campaign.id)}`; page đọc `await params`, gọi getCampaignDetail. Validator dùng `databaseUuidSchema = z.guid()` và chấp nhận chính ID báo lỗi; `z.uuid()` RFC từ chối ID này nhưng chỗ còn dùng trong access.ts chỉ phục vụ diagnostic, vẫn trả allowed, không làm guard. Không có regression UUID cần sửa source.
- Feed/detail cùng getResellerAccess, xác minh getUser + membership theo đúng user và dùng session client/RLS; cùng lọc campaign status active. Detail thêm id và projection products qua cùng FK; thiếu product có thể là null, product ID lệch bị schema error. Loader chỉ trả not-found khi ID sai hoặc query không lỗi nhưng data null. Query/schema/quyền có nhánh error riêng; không được diễn giải data null là đã chứng minh bản ghi không tồn tại trong toàn DB.
- Kiểm chứng độc lập trên server output mới cổng 3189, không sửa source: route inventory có đầy đủ detail và preview detail HTTP 200. Bằng chứng định vị lỗi ở đăng ký route của server dev đang chạy, trước loader; chưa xác định được tác nhân khiến inventory cũ thiếu route. Không kết luận do Supabase/credential hoặc cache chỉ từ triệu chứng 404.
- Khôi phục tối thiểu: xác minh cổng 3185 vẫn do PID 3124 nắm trước khi dừng đúng PID đó; chạy lại Next dev cổng 3185, **giữ cùng output `build/fe-w3-share-manual`**, không xóa cache/lock, đổi ACL hay sửa source/config. Sau restart, `dev/types/routes.d.ts` chứa `/reseller/campaigns/[id]` và preview detail HTTP 200 trên chính 3185; log tiếp tục xác nhận auth/membership/Feed thành công. Không dùng admin client để vượt quyền hoặc gọi API Tracking.
- Không có session trình duyệt được cấp trực tiếp cho agent; không thu thập cookie/token. Do đó chưa xác minh query campaign cụ thể bằng session người dùng; kết quả admin đọc 200 trước đây không được dùng để tuyên bố portal hoạt động đúng. Người dùng thử lại chính URL báo lỗi sau khi route đã được nhận diện; nếu còn lỗi cần đối chiếu các bước detail.query/detail.validation theo lần truy cập đó.
- Thêm `tests/reseller-detail-route.test.mjs`: chạy chính page + loader qua module harness với session/query giả lập, không network/admin/DB. **5/5 PASS**: ID PostgreSQL báo lỗi và promised params đi tới query active/id; ID sai chặn trước DB; data null trả notFound; lỗi permission/schema không bị nhầm 404; không session/membership không đọc campaign. Giữ nguyên toàn bộ validation, guard và query sản phẩm.
- Chốt kiểm tra: TypeScript toàn repo **PASS**, lint test mới **PASS, 0 lỗi/0 warning**, rerun regression **5/5 PASS**, `git diff --check` PASS. Không build lại vì không thay source/layout/config ứng dụng. Lint ban đầu bắt tên biến `module` trong harness; đã đổi tên biến, không tắt rule.
- Chỉ thêm regression test và hai phần tài liệu FE; source FE-W3-04/env/exclude được xác minh hash không đổi. Khôi phục nguyên byte tsconfig/next-env đầu phiên sau server kiểm chứng; dừng server phụ 3189, **để server 3185 chạy** đúng output share-manual để người dùng thử lại. Không commit/push hoặc sửa DB/RLS/seed. Nếu URL vẫn lỗi, cần log detail.query của lần mới trước khi quy lỗi cho dữ liệu/BE.

## 12. Xác nhận thủ công của người dùng trước FE-W3-05 — 21/10/2026
- Trang chi tiết chiến dịch thật đã mở lại được.
- Sau cập nhật credential cloud và restart, người dùng đã tạo link thật và nhìn thấy link cùng QR. Ghi nhận riêng với test fixture và lần kiểm tra credential chỉ đọc; không phải agent tự gọi Tracking.
- Chưa xác nhận redirect/click, quét QR bằng điện thoại hoặc native Share. Không ghi toàn bộ Tracking đã nghiệm thu. Kết quả 401 credential cũ là lịch sử, không còn được dùng làm kết luận nguyên nhân hiện tại.

## 13. FE-W3-05 — Ví hoa hồng Reseller — 21/10/2026

### Contract đã đối chiếu từ source, không phải xác nhận cloud
- Tái sử dụng `app/api/reseller/wallet/route.ts` và `src/lib/commerce/wallet-service.ts`, không sửa backend/RPC. Client chỉ GET `/api/reseller/wallet`, không body/query reseller_id, credentials same-origin, cache no-store, không retry tự động. Response `{success:true,data}` hoặc 401/403/500 `{success:false,error,code}`; header private/no-cache/no-store. Raw lỗi BE không đưa ra UI hoặc log frontend.
- Handler getUser phía server, đọc membership resellers bằng user.id, rồi gọi `get_reseller_wallet_summary({p_reseller_id:user.id})` bằng session client. Leaf `/reseller/wallet` tái kiểm getResellerAccess; không dựa riêng layout, role client hoặc service-role frontend. UI kiểm reseller_id trong response khớp viewer đã được server xác minh, chỉ dùng phép so sánh này để chặn lệch tài khoản, không làm nguồn phân quyền.
- SQL đối chiếu: `20261019184500_reseller_wallet_rpc_and_attribution.sql`, phần RPC; schema/type: wallet-service và `20261019100000_commerce_attribution_and_media.sql`. available_balance = net_amount commission confirmed; pending_balance = pending; paid_balance = paid; refunded_balance = refunded; lifetime_earnings do RPC trả = confirmed + paid. FE chỉ hiển thị trường trả về, không cộng số dư/tổng 10 dòng hoặc khấu trừ hoàn trả.
- order_metrics total_orders đếm orders; confirmed_orders gồm confirmed/paid; pending_orders gồm pending; total_gmv chỉ confirmed/paid. Không đồng nhất trạng thái đơn với trạng thái hoa hồng. UI không tự tính AOV/CR hoặc tỷ lệ hoa hồng từ các con số khác.
- recent_commissions là tối đa 10 hoa hồng mới nhất theo commissions.created_at DESC, join orders và LEFT JOIN campaign; không phải toàn bộ đơn hàng, không có cursor/page/date/status filter. Mã booking do BE mask; không hiển thị thêm tên khách hoặc raw IDs không cần thiết. Net/gross/phí/giá trị đơn hiển thị riêng; trạng thái pending/confirmed/paid/cancelled/refunded có nhãn Việt, giá trị lạ hiển thị Chưa xác định.
- Currency RPC là VND; BA quy định hoa hồng làm tròn nguyên VNĐ. FE dùng số nguyên an toàn JSON, không nhân/chia 100, không tự làm tròn fractional/unsafe/khác currency. Dữ liệu thiếu/null/sai đơn vị là lỗi contract, không thành 0. Nếu thực tế trả tiền lẻ hoặc vượt giới hạn number, cần BE chốt biểu diễn chính xác (ví dụ chuỗi decimal) trước khi mở rộng adapter; không sửa backend ở phiên này.
- Commission created_at là TIMESTAMPTZ, tôn trọng offset có sẵn; last_updated từ timezone('utc',now()) không có offset nên diễn giải UTC đúng theo SQL. UI hiển thị Asia/Ho_Chi_Minh, nhãn UTC+7. Thời gian trống/sai hiển thị chưa có thời gian hợp lệ, không tự dùng ngày hiện tại. Ngày lịch sử là ngày ghi nhận hoa hồng, không tự đổi nhãn thành ngày đặt đơn.

### Giao diện và ranh giới
- Thêm `/reseller/wallet` và loading; thẻ thu nhập tích lũy/khả dụng/chờ đối soát/đã chi trả/hoàn trả, thống kê đơn và danh sách tối đa 10 hoa hồng. Số dư 0 chỉ xuất hiện sau response hợp lệ; empty history không xóa số dư tổng quan. Không filter/phân trang giả, rút tiền, duyệt hoặc cập nhật đơn.
- Dùng token Coastal Editorial, font/component/Lucide đang có; CSS Module riêng, không sửa global font/CSS/PWA/Tracking. Chưa có Figma UX-W3-01 cụ thể bàn giao trong repo: **Chờ UI/UX review**, không xác nhận khớp Figma.
- Bottom Nav Wallet đã là link `/reseller/wallet`, preview tương ứng `/preview/reseller/wallet`; active page đúng, bỏ Sắp có. Navigation desktop tái cấu trúc nhỏ để thêm Wallet và tránh aria-current luôn trỏ Chiến dịch. Safe-area/padding đáy/modal/ẩn nav khi nhập giữ cơ chế hiện có.
- Wallet chỉ đọc sau INITIAL_SESSION đúng viewer. Đổi user/đăng xuất/đổi phiên ẩn dữ liệu ngay, abort read và bỏ response muộn; token refresh cùng user không tự đọc lại. Pagehide/pageshow persisted vô hiệu hóa số dư cũ khi quay lại; retry do người dùng chủ động, không lưu localStorage/IndexedDB/cache PWA. Luôn xác minh lại API phía server sau retry.
- Preview development-only/noindex dùng chính component với request/session fixture; không âm thầm dùng fixture ở portal. Có ready/zero/empty-history/loading/error/schema/session/forbidden/slow/long và đổi tài khoản; không đọc Supabase thật hoặc ghi dữ liệu chung để tạo fixture.
- BA còn dùng `/reseller/commissions`, có bộ lọc/CR/% hoa hồng/ngày đặt đơn; FE theo kế hoạch dùng `/reseller/wallet` và chỉ các trường có thật. BE/BA cần chốt endpoint lịch sử đầy đủ/phân trang/lọc và các trường còn thiếu. BE cần đối chiếu triển khai RPC và EXECUTE/guard cho anon: source dùng SECURITY DEFINER, guard ownership có điều kiện authenticated; chưa kiểm quyền deployed hoặc thử truy cập anon, không tự sửa RPC/RLS.

### Kiểm chứng UI, API và quyền bằng mock
- `node --experimental-strip-types --test tests/wallet.test.ts`: **8/8 PASS**. Kiểm tra VNĐ đúng đơn vị/0/âm/tổng từ server, null/missing/fractional/unsafe/khác currency/khác owner không thành 0, GET no-store không gửi reseller_id và không retry, UTC/VN và trạng thái lạ. Chạy chính handler API cùng wallet-service qua harness: user.id là nguồn RPC, 401/403 không gọi RPC, RPC fail 500 không sinh data 0, headers private/no-store.
- Auth SDK cài sẵn có thể phát SIGNED_IN khi khôi phục session. Observer chỉ lấy session_id trong bộ nhớ từ session hiện có để phân biệt phiên mới với cùng phiên; không lưu/in token/payload, không dùng claim giải mã làm căn cứ cấp quyền. Test xác nhận cùng session_id SIGNED_IN/TOKEN_REFRESHED không làm mất UI; owner/session_id mới hoặc signout làm vô hiệu hóa dữ liệu. API vẫn getUser phía server.
- `node tests/wallet-browser.mjs`: **PASS 320/390/768/1440**, tiền/zero/empty/error/schema/loading/session/forbidden, dữ liệu dài/unknown fields, active Nav, focus/vùng chạm, footer không bị dock che. PASS đổi account trong lúc slow request (fixture cố ý bỏ qua abort), bỏ kết quả cũ, refresh thủ công đúng một read mới, Feed → Wallet, route portal chưa login chuyển `/login?next=%2Freseller%2Fwallet` và không hiển thị fixture.
- `tests/reseller-bottom-nav.mjs` được cập nhật đúng hành vi mới Wallet là link (không bỏ assertions các mục khác); chạy bản đổi cổng/output dưới build để giữ bằng chứng cũ: **PASS 320/390/768/1440**, Content Kit/Tracking mock/modal/history, keyboard visualViewport, reduced motion và inset 34px. Wallet không có trường nhập cần bàn phím; safe area/bàn phím mới là mô phỏng, chưa kiểm thiết bị thật.
- Hai bộ browser không có page errors, API/write/Tracking-click/external requests. Unit PWA worker **3/3 PASS**, không đổi SW hoặc cache policy. Chưa có lần đọc RPC/GET ví thật bằng session người dùng trong phiên; không dùng admin đọc 200 trước đó để coi quyền ví đã nghiệm thu.
- Đã chụp/xem ảnh trong `build/fe-w3-wallet-evidence/` (full page và viewport), gồm 320/390/768/1440, nội dung dài và các trạng thái lỗi. Sau xem ảnh, thu gọn bảng điều khiển fixture để thẻ số liệu dễ nhìn trên 320px; nhãn Mô phỏng vẫn luôn hiện. UI dùng cỡ tiền co giãn/wrap và màu token hiện có, không cắt dữ liệu để hết overflow.
- Test phát hiện signout ẩn cả thông báo do React dùng lại div đã đặt hidden: đã tách key DOM dữ liệu riêng khỏi feedback và test PASS lại, không làm yếu assert. Một lần dev inventory thiếu nhiều route có sẵn nên preview mặc định 404; xác minh generated routes rồi restart riêng server kiểm chứng 3190 cùng output, không xóa cache/lock, đổi source guard hoặc ghi DB. Nav cold compile timeout được chạy lại sau warm-up và PASS.

### Cách chạy và phần còn chờ
Tại repo root, dùng terminal mới (không cần dừng server 3185/Chat đang có):
```powershell
$env:NEXT_BUILD_DIR='build/fe-w3-wallet-dev'
```
```powershell
npm.cmd run dev -- --hostname 127.0.0.1 --port 3190
```
- Preview: `http://127.0.0.1:3190/preview/reseller/wallet`. Mở Tùy chọn mô phỏng để chọn zero/empty/error/session/forbidden/slow/long, đổi tài khoản hoặc mô phỏng đăng xuất. Đây không phải dữ liệu tài chính thật.
- Portal: `http://127.0.0.1:3190/reseller/wallet`, cần đăng nhập Reseller hợp lệ; tự đọc endpoint hiện có, không có hành động ghi/chi trả. Nếu RPC chưa deploy hoặc data không đúng contract, UI hiện lỗi, không fallback fixture/0.
- Các file chính mới: wallet page/loading, wallet-client/dashboard/CSS, frontend wallet adapter + observer session, preview/fixture/tests. Tái sử dụng BE API/RPC/service và getResellerAccess, FeedNotice/Button/Shell; chỉ sửa Nav/Shell để nối Wallet và active desktop. Không sửa hoặc ghi đè backend, schema/RLS, Tracking, .env.local hay FE-W3-04.
- Còn chờ UIUX review, QA phiên thật/thiết bị thật; BE/BA chốt các trường/lịch sử chưa có và biểu diễn tiền nếu khác nguyên VNĐ an toàn. Tiếp nhận bàn giao Tester 3 và review FE-W3-07 trước FE-W3-06. Không tự đánh dấu cả tuần hoàn thành.
- Chốt phiên: TypeScript toàn repo, lint toàn bộ code/test sửa/thêm và `git diff --check` **PASS**. Build cuối `$env:NEXT_BUILD_DIR='build/fe-w3-wallet-release'; npm.cmd run build` **PASS**, TypeScript và **30/30 trang**. Build trước được dừng chủ động khi chỉnh preview theo ảnh, không báo là build PASS. GET local production `/preview/reseller/wallet` **404**, không lộ fixture ở production.
- Đã dừng đúng server kiểm chứng 3190/3191; không dừng server 3185 hoặc Chat của người dùng. Khôi phục nguyên byte tsconfig/next-env đầu phiên (giữ cả include share-manual/chat-manual-01 vốn có), không thêm cấu hình bỏ qua typecheck. Hash source FE-W3-04, `.env.local`, exclude, SW, API và wallet-service BE không đổi. Không sửa DB/RLS/schema/RPC/seed, Tracking hoặc PWA cache, không gọi AI/Telegram.
- Nhánh và HEAD vẫn `Feature_FE_W3_PWA_Mobile_Commerce` / `7116ac640dad77cbbc7f74753dc0b34554ec0086`; không stage/commit/push/fetch/merge. Worktree giữ nguyên FE-W3-04 chưa commit và thêm code/test/docs Wallet; tsconfig local có sẵn được giữ nguyên. Chỉ cập nhật phần FE của TEAM_WORK_LOG, không thay các dòng BE.

## 14. Chẩn đoán Ví thật cổng 3190 — 21/10/2026

### Bổ sung bằng chứng Network thật do người dùng cung cấp
- GET Wallet trả **HTTP 500**, `code: PGRST202`, error: `Could not find the function public.get_reseller_wallet_summary(p_reseller_id) in the schema cache.` Đây là response phiên thật do người dùng lấy, không phải mock hay truy vấn mới của agent; cập nhật kết luận trước đó đang chờ response.
- Đối chiếu khớp: `app/api/reseller/wallet/route.ts:66` gọi service với `user.id`; `src/lib/commerce/wallet-service.ts:65–68` gọi `.rpc("get_reseller_wallet_summary", {p_reseller_id: resellerId})`; migration `supabase/migrations/20261019184500_reseller_wallet_rpc_and_attribution.sql:42–43` định nghĩa `public.get_reseller_wallet_summary(p_reseller_id uuid) RETURNS jsonb`. Dòng 419 cấp EXECUTE cho authenticated và service_role. Không thấy sai tên hàm/tham số trong source repo.
- Đã định vị lần lỗi này tại bước PostgREST phân giải RPC trên cloud: không tìm thấy signature trong schema cache. [Tài liệu PostgREST](https://docs.postgrest.org/en/stable/references/errors.html#group-2-schema-cache) nêu PGRST202 ứng với signature cũ trong cache hoặc function không tồn tại. Chưa phân biệt function/migration chưa được triển khai, signature deployed khác repo hay cache chưa cập nhật. Không kết luận key sai, thiếu số dư, lỗi parser FE hoặc lỗi mạng; chưa có kết quả RPC hợp lệ để parse. API hiện quy mọi lỗi service thành HTTP 500 tại route.ts:68–81 và giữ mã PGRST202; không suy ra HTTP upstream là 500 từ status ứng dụng.
- Phần BE cần kiểm tra trên **đúng project cloud mà URL local đang trỏ tới**: lịch sử áp dụng migration trên cùng DB; sự tồn tại trong public và signature thực tế (tên input p_reseller_id, kiểu uuid, kết quả jsonb); schema được Data API expose và metadata/cache PostgREST; nếu function/signature đã đúng thì BE xử lý cập nhật schema cache theo quy trình của nhóm. Kiểm tra thêm EXECUTE cho authenticated và guard theo auth.uid(), rồi kiểm chứng bằng phiên Reseller của chính chủ; không dùng service-role thay cho kiểm tra luồng người dùng. PGRST202 hiện chưa phải bằng chứng thiếu GRANT/RLS.
- Câu gửi BE: “GET /api/reseller/wallet trả HTTP 500, code PGRST202: không tìm thấy public.get_reseller_wallet_summary(p_reseller_id) trong schema cache. API/service khớp migration 20261019184500: public.get_reseller_wallet_summary(p_reseller_id uuid) RETURNS jsonb. Nhờ kiểm tra trên đúng cloud project migration/function/signature đã có chưa, Data API schema/cache đã cập nhật chưa và EXECUTE cho authenticated; sau xử lý kiểm chứng bằng session Reseller. FE giữ trạng thái lỗi, không đổi số dư thành 0.”
- Lượt bổ sung chỉ đọc source/status và cập nhật tài liệu FE. Giữ nguyên toàn bộ công việc FE-W3-04/05, không đổi source/env/backend/DB/RLS, chạy migration, gọi lại API/RPC hoặc commit/push; không chạy lại test cho thay đổi tài liệu. Ví thật vẫn lỗi và chưa nghiệm thu; kết quả UI/fixture trước đó được giữ riêng.

### Nhật ký chẩn đoán trước khi có Response thật (giữ để đối chiếu)
- Người dùng báo `/reseller/wallet` bằng tài khoản Reseller hiện “Chưa thể tải ví hoa hồng” / “Dịch vụ ví chưa trả về kết quả hợp lệ. Không thể xác định số dư lúc này.” **Ví thật đang lỗi, chưa nghiệm thu**. UI/fixture đã kiểm tra riêng, không chứng minh live RPC thành công.
- Kiểm tra chỉ đọc xác nhận server nghe 127.0.0.1:3190 PID 23560, Next trong đúng repo; worker con trỏ output `build/fe-w3-wallet-manual-01`. Generated routes có cả page và GET `/api/reseller/wallet`. Log đúng output `dev/logs/next-development.log` có auth VERIFIED, membership ROW/ALLOWED_POSTGRES_UUID ở lớp trang; không có Status/Response GET Wallet hoặc lỗi WALLET_API_ERROR. Log `wallet-dev` của phiên test trước rỗng, không phải output đang chạy. Không suy diễn log trang thành chứng cứ API/RPC đã qua quyền. Handler trả lỗi RPC thông thường trong response, không console.log chúng; thiếu log không chứng minh RPC thành công.
- Điều kiện chính xác: `src/lib/reseller/wallet.ts:39–45` trả session cho 401, forbidden cho 403; HTTP không thành công còn lại trả error/service mà không đọc error body. `wallet-client.tsx:51` cũng trả error/service nếu khởi tạo observer phiên ném exception, có thể trước request. Cả hai dẫn tới đúng thông báo đã báo. Fetch/timeout dẫn thông báo network khác; HTTP 200 không phải JSON hoặc sai schema/owner dẫn thông báo schema khác. Chưa có bằng chứng trực tiếp để kết luận 500, credential sai, lỗi migration hay lỗi FE.
- API dùng public Supabase config + cookie session, getUser và resellers.id=user.id; không dùng SERVICE_ROLE_KEY. `resellerError` và membership không tồn tại đều thành 403 (chưa phân biệt lỗi truy vấn membership với thiếu vai trò trong response). RPC nhận p_reseller_id từ server user.id. Credential admin đã đọc HTTP 200 trước đây không kiểm chứng RPC theo phiên người dùng; không thử lại credential hoặc vượt quyền bằng admin.
- Đối chiếu source migration `20261019184500_reseller_wallet_rpc_and_attribution.sql:42–172`: RPC trả **một object JSONB**, không array/envelope; wallet-service validate object rồi API bọc `{success:true,data}`. Tên trường khớp `reseller_id`, `balances` (available_balance/pending_balance/paid_balance/refunded_balance/lifetime_earnings/currency), `order_metrics` (total_orders/confirmed_orders/pending_orders/total_gmv/flagged_self_purchase_orders), `recent_commissions`, `last_updated`. Đây là source repo, chưa xác minh schema/function đã triển khai trên cloud.
- Contract kiểu/null: balances/metrics và gross_amount/platform_fee/net_amount/order_amount là JSON number, không numeric string/null; FE yêu cầu tiền nguyên an toàn VNĐ và count nguyên không âm. recent_commissions là array tối đa 10, mỗi phần tử có id/order_id/booking_reference/campaign_name/status/customer_name/created_at dạng string, flag_self_purchase boolean; chỉ campaign_id cho phép null. SQL COALESCE tổng tiền/số đơn về 0 và lịch sử về []; đó là kết quả hợp lệ của SQL, không phải fallback FE khi lỗi. BE default currency VND và recent_commissions [] chỉ khi trường undefined, không chấp nhận null; FE yêu cầu response đã có cả hai. Không thấy mismatch tên/cấu trúc trong source, chưa có payload thật để xác định trường sai.

| Bằng chứng cần lấy từ GET Wallet | Phân loại và bên kiểm tra tiếp |
| --- | --- |
| 401 / UNAUTHORIZED | Session/getUser; BE kiểm tra lỗi auth, không suy ra key admin sai |
| 403 / FORBIDDEN | Membership/quyền hoặc truy vấn resellers; BE phân biệt nguyên nhân |
| 500 + code RPC/Postgres | BE kiểm tra function/signature, schema, EXECUTE và lỗi SQL theo mã thực tế; ví dụ PGRST202 chỉ là khả năng cần xác nhận |
| 500 + VALIDATION_ERROR | RPC có data nhưng không qua schema BE; BE cần kiểm tra field path/type/null an toàn, không gửi dữ liệu cá nhân |
| 500 + EMPTY_DATA / EXCEPTION / INTERNAL_SERVER_ERROR | BE đối chiếu response/log; cần chi tiết để tách null result, mạng upstream hoặc cấu hình/exception |
| 200 + lỗi schema của UI | FE/BE đối chiếu envelope, owner và kiểu/đơn vị tiền; không đổi giá trị lỗi thành 0 |
| Không có request, hiện đúng lỗi dịch vụ | Cần đối chiếu khởi tạo browser session client/config; chưa có bằng chứng observer đã ném lỗi |

- Không có công cụ gắn phiên Chrome hiện tại hoặc stdout session của server do người dùng khởi chạy. Bước tối thiểu: mở DevTools Network → Fetch/XHR, lọc `wallet`, chọn GET `/api/reseller/wallet`; nếu mất entry, giữ DevTools mở và bấm **Tải lại ví** một lần để ghi nhận luồng chỉ đọc. Gửi Request URL, Status Code và riêng `code`/`error` trong Response lỗi sau khi che thông tin nhạy cảm; không gửi cookie/token/Authorization/HAR. Nếu 200, chỉ gửi cấu trúc, tên trường/kiểu/null, không số liệu hay định danh cá nhân. Nếu không có request, báo rõ và gửi thông báo lỗi Console đã che secret nếu có.
- Câu hỏi BE: “Nhờ kiểm tra get_reseller_wallet_summary(p_reseller_id uuid) trên cloud đang cấu hình đã được triển khai đúng migration BE1-W3-04 và gọi được bằng phiên authenticated Reseller chưa? GET /api/reseller/wallet hiện báo lỗi dịch vụ; đang chờ HTTP status/code/error từ Network. Xin đối chiếu function/grant/schema và object JSONB với wallet-service, không dùng service-role để thay cho kiểm chứng quyền người dùng.”
- Kiểm chứng lượt chẩn đoán: chạy lại `node --experimental-strip-types --test tests/wallet.test.ts` **8/8 PASS**, chỉ mock/fixture (có warning Node MODULE_TYPELESS_PACKAGE_JSON). Không sửa source nên không chạy lại TypeScript/lint/build đã PASS ở mục 13. Chỉ bổ sung tài liệu FE; giữ nguyên source/config và mọi thay đổi FE-W3-04/05. Không gọi API thật, RPC, Tracking, AI, mở /r/, sửa env/backend/DB, restart server hay thực hiện Git mutation. Cần response phiên thật để chốt nguyên nhân và bên sửa; không đánh dấu UIUX reviewed hoặc nghiệm thu Ví.

## 15. FE-W3-07 — review bàn giao Tester 3 — 21/10/2026

### Bản review, nguồn so sánh và bảo toàn hiện trạng
- **Kết luận: CẦN SỬA, chưa sẵn sàng tích hợp.** Có bản bàn giao xác minh trong [PR #33](https://github.com/NguyenMTue/ai-travel-reseller/pull/33), đang open, không draft/merged; API reviews trả danh sách rỗng lúc kiểm tra. Chưa gửi comment/approval hoặc sửa tiến độ Tester 3. FE-W3-07 còn IN PROGRESS chờ bản sửa và review lại, không đánh dấu cả tuần hoàn thành.
- Nhánh PR thực tế **`Feature/fe-t3-static-components`**, commit review **`24740ea4959f6eabde2f38a218c99b4d9314d64e`**. `git ls-remote --heads` có mục tiêu còn thấy **`feature/fe-t3-static-components`** tại **`f66ff8cbb9c40c8917f5cfd9dc7e31fefbf7432f`**; đây là hai remote ref phân biệt hoa/thường. Dừng bước fetch ngay khi phát hiện cặp xung đột Windows, không fetch toàn bộ, sửa refs/config/xóa lock. Truy vấn đầu trong sandbox lỗi `schannel: AcquireCredentialsHandle failed: SEC_E_NO_CREDENTIALS (0x8009030E)`; truy vấn chỉ đọc ngoài sandbox thành công. Không đổi nhánh, tạo checkout Git, merge/cherry-pick/commit/push.
- Remote dev đối chiếu **`cd249e3f40be73fdeeba954c84b51ff339f8dfcf`**, đọc qua GitHub API, không fetch. Local origin/dev giữ **`0b1d607c8b0b95c13d63ab69b7e754342cbbf731`**, không coi nó là dev mới nhất. PR info ghi base_sha `86babd02f0a073c0da9a0bc97f5906173da4a675`; compare dev mới...head xác định **merge-base `f66ff8cbb9c40c8917f5cfd9dc7e31fefbf7432f`**, Tester 3 ahead 2 / behind dev 15. Diff theo merge-base chỉ có 3 file dưới đây; không gán các commit dev mới hoặc thay đổi FE hiện tại cho Tester 3.
- Hai file mới đúng đường dẫn bàn giao: `src/components/merchant/media-card.tsx` (78 dòng, blob `6a5c205bd3a2b0688c3eaee3170e359728016e81`) và `src/components/merchant/video-guidelines-modal.tsx` (81 dòng, blob `2afbe8c5c1f5fc1d261d6f944eba1b636622738d`). File thứ ba là sửa backend/service `src/lib/merchant/media-service.ts`. Đọc canonical paths của hai component trên dev mới bằng GitHub Contents API đều 404; tìm PR liên quan thấy #33 và handoff BE [PR #29](https://github.com/NguyenMTue/ai-travel-reseller/pull/29). Chưa thấy bằng chứng bàn giao thay thế/tích hợp hai component vào dev tại đường dẫn đã chốt; không khẳng định đã tìm hết mọi file đổi tên hoặc PR không có từ khóa liên quan.
- Giữ nhánh FE và HEAD **`7116ac640dad77cbbc7f74753dc0b34554ec0086`**, không MERGE_HEAD/unmerged. Git status/diff được đọc; bảo toàn tracked/untracked FE-W3-04/05, config local, ignored/env/exclude và backup. Chỉ sửa hai tài liệu FE; snapshot/harness/evidence review nằm riêng trong ignored `build/fe-w3-t3-review-24740ea/`, không chép source vào app/src hoặc sao chép `.env.local`.

### Phát hiện cần sửa trước tích hợp

| Mức độ | File/vị trí tại commit review | Bằng chứng, tác động và đề xuất |
| --- | --- | --- |
| **P1** | `video-guidelines-modal.tsx:15–24,27–33,68–77` | Chỉ render div/section aria-modal, không quản lý focus, Escape, nền inert hoặc scroll lock. Fixture cả 4 viewport: mở vẫn focus opener ngoài dialog, Tab từ Đã hiểu ra nền, Escape không đóng, nền cuộn 600px, đóng không trả focus về opener. Người dùng bàn phím có thể thao tác nền trong khi UI tuyên bố modal. Dùng native dialog/showModal hoặc dialog primitive đã kiểm chứng; bảo đảm initial focus, Tab/Shift+Tab trap, Escape gọi onClose, khóa nền/scroll, restore focus và kiểm tra lại trên mobile. Không chỉ thêm aria-modal. |
| **P1 — phạm vi bàn giao** | `src/lib/merchant/media-service.ts:7–8,24–44,131` | File thứ ba sửa backend: Row/Insert typed thay any, unknown platform chuyển other, analysis_metadata array thành {}. Thay đổi map dữ liệu đọc và payload ghi nằm ngoài hai Dumb UI được giao. Cần tách sang PR BE có owner review hoặc loại khỏi PR UI bằng bản sửa của tác giả; FE không tự revert. Hai any có từ base, không kết luận là lỗi mới của Tester 3; dev mới vẫn cùng blob service base `a1fb5cb5d5e8cb3ef65871aedf2035eb6f8b472c`. Không chạy service ghi hoặc gọi DB để review. |
| **P2** | `media-card.tsx:52–62` | `w-fit` tag không ngắt chuỗi làm grid con giãn và bị article overflow-hidden cắt, kéo cả nút chọn vượt card. Với **tag không khoảng trắng 50 ký tự** (đúng max API), tại 320px card.right=304 nhưng button.right≈453; 390px 374/453; 768px 752/829. Document không tràn ngang do clip, nhưng nội dung/nút bị cắt. Thêm min-w-0 cho grid children, max-w-full và wrap/overflow-wrap cho tag, giữ button trong card; kiểm tra tag dài, nhiều tag qua adapter. |
| **P2** | `media-card.tsx:7–9,15–20,40–50` | Next Image không có onError/fallback: fixture ảnh hỏng hiển thị biểu tượng ảnh lỗi, không placeholder trung thực. Props thumbnail/duration bắt buộc trong khi MediaReferenceItem cho phép thumbnailUrl và duration null; styleTags là array thay vì styleTag string. Chưa có adapter bàn giao. Cần fallback ảnh trong component và thống nhất mapping null/array khi tích hợp; không bịa thumbnail, 0:00 hoặc tag nghiệp vụ. NaN fixture bổ sung cho ra NaN:NaN (ngoài kiểu dữ liệu API hợp lệ, chỉ kiểm tra phòng vệ, không quy là lỗi dữ liệu production). |

### Góp ý giao diện và giới hạn
- Dùng token primary/secondary/background/border hiện có và Lucide, không thêm dependency, API/Auth/effect fetch/useRouter, video autoplay/download, HTML thô hoặc secret trong 3-file diff. Semantic button, aria-pressed, dialog label và close label có sẵn. Selected state đổi nhãn/viền/ring, không chỉ dựa màu. Không thấy sửa app/layout.tsx, globals.css, playwright config, auth, schema hay artifact trong diff của Tester 3.
- Nút chọn và nút X đo 40px; đề nghị tăng ít nhất 44px cho thao tác mobile (góp ý usability, không gọi đây là vi phạm WCAG chỉ từ kích thước 40px). Tôn trọng reduced motion được kế thừa từ globals.css:1900, không khẳng định component tự có rule này. Cần UIUX review font/spacing/contrast/selected state sau tương tác ổn định; fixture chưa nạp asset font dự án nên không dùng ảnh này xác nhận font/Figma. Không có link frame/spec chi tiết bàn giao trong PR body hoặc tài liệu đã đọc, chưa xác nhận khớp Figma.
- TESTER3_W3 phần mở đầu nói độ dài 15–60s, chi tiết task ghi khuyến nghị 15–45s; modal đang theo phần chi tiết 15–45s. BE Media API nhận duration tới 3600s, không đồng nghĩa khuyến nghị UI là validator bắt buộc. Nhờ BA/UIUX thống nhất khuyến nghị và giới hạn cứng trước FE-W3-06; không tự thay business rule.

### Kiểm chứng thực hiện
- Đọc AGENTS, FE_W3, TESTER3_W3, UIUX_W3, BA_HANDOFF_MATRIX, TEAM_WORK_LOG/BE1_W3 và handoff PR #29. Đọc Next docs cài sẵn image/accessibility. Kiểm tra scripts trước khi chạy; không npm install, không chạy live scripts/suite không liên quan hoặc build ứng dụng chứa env.
- Snapshot hai component lấy trực tiếp từ commit SHA qua GitHub API; Git blob SHA tính lại khớp cả hai. `tsc --noEmit --strict --skipLibCheck --jsx react-jsx --module esnext --moduleResolution bundler --target es2017 --esModuleInterop` cho **hai file snapshot PASS**; không phải full-repo typecheck của branch Tester 3. ESLint lintText hai source với filePath canonical và config repo: **0 errors / 0 warnings**, không chạy lint backend ngoài phạm vi hoặc ghi đè config.
- Fixture riêng bundle TypeScript/React/Next Image thực tế bằng dependency đã cài, parent state giả, Coastal CSS repo; không checkout branch vào working tree đang làm. Chromium chạy **320/390/768/1440**, select callback đổi aria-pressed/nhãn thành công, không document overflow; phát hiện clip nội bộ tag/nút, ảnh lỗi/NaN và các lỗi modal ở bảng trên. `report.json`, ảnh `cards-{width}.png`/`modal-{width}.png` và harness nằm trong `build/fe-w3-t3-review-24740ea/`. Đã mở xem ảnh cards 320/1440 và modal 390. Report không có pageerror; chỉ 4 request ảnh hỏng cố ý bị chặn, ảnh hợp lệ và document được fulfill trong bộ nhớ, không request API/Supabase/AI/webhook/Telegram hoặc tải video/file thật.
- Các lần runner bị dừng/chưa trả kết quả và fixture đầu lỗi origin about:blank/Next Image không tính PASS. Sửa **harness riêng** bằng origin giả review.invalid được route.fulfill, runtime mock rỗng; bản component review giữ nguyên blob. Lần fixture cuối hoàn tất phát hiện đúng lỗi, không sửa assertions để coi lỗi thành pass. Browser đã đóng, không restart/dừng server của người dùng. Đây là mô phỏng Chromium desktop viewport; chưa iOS/Android thật, screen reader, contrast audit đầy đủ, UIUX approval hoặc test tích hợp API/session.

### Nhận xét soạn sẵn và checklist chuẩn bị FE-W3-06
- Tin nhắn Tester 3 (chưa gửi): “Đã review PR #33 tại 24740ea, hiện cần sửa trước tích hợp: modal thiếu initial/trap/restore focus, Escape và khóa cuộn nền; tag 50 ký tự làm cắt nút chọn trên mobile; thêm fallback ảnh lỗi và thống nhất props với null duration/thumbnail, styleTags của Media API. Nhờ tách thay đổi media-service.ts sang PR BE, gửi lại commit cùng kết quả typecheck/lint và preview/Figma. PR đang dùng Feature/… trong khi kế hoạch ghi feature/…; nhờ xác nhận nhánh bàn giao với PM, FE chưa approve/merge.”
- **Chưa đủ điều kiện tích hợp component hoặc nghiệm thu FE-W3-06.** Có thể chuẩn bị contract/fixture; chưa triển khai FE-W3-06 trong lượt review này. Chờ bản sửa 4 mục, re-review, handoff UIUX và hai approve FE Lead/PM theo quy chế khi đến bước merge; lượt này chưa đăng bất kỳ approval/comment nào.
- Checklist tích hợp sau review: dùng GET `/api/merchant/media` trả `{success:true,data:MediaReferenceItem[],pagination:{total,page,limit,totalPages}}`; query platform/tag/search/page/limit<=100. Dùng session Merchant đúng chủ, không tin merchant_id/x-merchant-id client làm căn cứ phân quyền; nhờ BE xác nhận GET scope vì code hiện nhận merchant_id query và có fallback header/query ngoài production (đã có ở base, không phải thay đổi Tester 3). Giữ dữ liệu private/no-store, không đưa vào PWA cache.
- Adapter UI cần thống nhất thumbnailUrl/duration null, styleTags[], title tối đa255, tag tối đa50, URL an toàn và ảnh fallback; loading/empty/error/unauth/forbidden, phân trang server; selection là callback chủ động, không tự gọi AI/video khi mount/chọn. POST tạo media và DELETE chỉ sau hành động/ủy quyền phù hợp ở FE-W3-06, không gọi trong review; xác minh contract video generate/job/status thực tế với BE trước nối nút, không dựa riêng task DONE. Xác minh UIUX/BA quy chuẩn video và fixture responsive/modal/focus trước bàn giao QA.
- Ví thật FE-W3-05 vẫn lỗi PGRST202, chờ BE kiểm tra RPC cloud như mục 14; không sửa trong lượt này. Giữ nguyên mọi thay đổi hiện tại, .env.local/ignored/exclude/backup; chỉ cập nhật FE_W3.md và phần FE của TEAM_WORK_LOG, không source Tester 3/backend/DB/RLS/seed, commit/push/PR/comment/approval/tunnel.

## 16. FE-W3-07 — review lại PR #33 và quan sát Wallet — 22/10/2026

### Bản bàn giao mới và phạm vi diff
- Snapshot review **`f9a5509cbc98b5d6ab4c37e9a4210ca398a21045`**, PR #33 nhánh **`Feature/fe-t3-static-components`**, open/not merged. PR info ghi base `dev`, base_sha **`86babd02f0a073c0da9a0bc97f5906173da4a675`**; compare `dev...HEAD` xác định tip dev **`cd249e3f40be73fdeeba954c84b51ff339f8dfcf`**, merge-base **`f66ff8cbb9c40c8917f5cfd9dc7e31fefbf7432f`**, ahead3/behind15. Ghi riêng hai giá trị base do API trả để không nhầm PR metadata với tip dev đối chiếu.
- Compare **24740ea → f9a5509**: đúng một commit mới, chỉ hai component thay đổi — MediaCard +83/-26; VideoGuidelinesModal +52/-12. Không có merge/cập nhật dev trong đoạn này. Toàn PR theo merge-base vẫn có **3 file**: hai component mới và `src/lib/merchant/media-service.ts` +14/-4 như lượt trước. Chỉ push hai file mới chưa loại bỏ thay đổi backend đã có.
- Đọc qua GitHub connector, không fetch hoặc tác động hai remote refs khác hoa/thường. PR comments và reviews đều trả rỗng lúc kiểm tra; chưa có bằng chứng BE review/approve thay đổi service trên PR. Không tự comment/approve/merge hoặc yêu cầu sửa lại các mục đã đạt. Source/ảnh/tests review cũ mục15 giữ nguyên để đối chiếu.

### Quan sát Wallet do người dùng xác nhận ngày 22/10 — tách khỏi test tự động
- Sau khi BE báo cập nhật cloud, người dùng mở `/reseller/wallet` và **không còn màn hình lỗi PGRST202**. UI hiển thị hoa hồng **0đ**, tổng **2 đơn**, **1 đã xác nhận/thanh toán**, **1 chờ xử lý**, doanh số **2.300.000đ**, chưa có lịch sử hoa hồng.
- Đây là **quan sát UI của người dùng**, chưa đối chiếu từng bản ghi hoặc xác minh toàn bộ phép tính/phân quyền. **Chưa có bằng chứng quan sát HTTP 200**; không biến thông tin này thành kết quả Network/RPC mới hoặc nghiệm thu toàn bộ Ví. Không sửa Wallet, env, backend/DB hoặc gọi lại API để xác nhận trong lượt review này. Cập nhật này bổ sung tình trạng mới, không xóa lịch sử PGRST202 ở mục14–15.

### Kết quả từng phát hiện cũ tại f9a5509

| Phát hiện cũ | Kết quả | Bằng chứng source tại HEAD mới và kiểm chứng |
| --- | --- | --- |
| P1 modal: focus/Escape/cuộn nền | **Đã sửa — PASS fixture** | `video-guidelines-modal.tsx:18–46,50–58`: native dialog/showModal, closeButtonRef, lưu/khôi phục focus và hai overflow styles, cleanup unmount, onCancel preventDefault rồi onClose. 320/390/768/1440: focus nút X khi mở; 8 Tab và 8 Shift+Tab không tới nút nền/opener; Escape, X, Đã hiểu đều đóng, trả focus và khôi phục chính xác inline body=clip/html=auto. Nền không cuộn khi wheel. Mỗi viewport 3 chu kỳ đóng/mở và 1 unmount khi mở đều đạt. Có accessible name/description. Không yêu cầu sửa lại mục đã đạt. |
| P2 tag 50 ký tự kéo giãn/cắt nút | **Đã sửa — PASS fixture** | `media-card.tsx:61–64,94–122,129–135`: min-w-0, break-all cho tag, styleTags list, nút w-full, MediaCardGrid shrink-safe. Kiểm tra cùng tag X lặp50, nhiều tag và title dài ở 4 viewport: không document overflow, không internal card overflow; mọi nút nằm trong bounds card. Width card tương ứng 288/358/360/312px. Không dùng overflow-hidden toàn trang để che lỗi; article mới không còn overflow-hidden. Callback nhận đúng id selected và aria-pressed/nhãn đổi đúng. |
| P2 thumbnail null/lỗi, duration thiếu, props contract | **Đã sửa — PASS fixture** | `media-card.tsx:12–35,49–91,101–113`: thumbnailUrl/durationSeconds optional nullable, styleTags[]; ảnh lỗi đổi sang placeholder role img có nhãn, không gán URL fallback có thể lặp onError. Mỗi viewport chỉ 1 request broken.jpg bị chặn, không lặp; null/undefined/whitespace không tạo request ảnh. Duration null/undefined/NaN không hiện NaN hoặc bịa 0:00; duration30 hiện0:30. Thay URL hỏng sang URL hợp lệ render ảnh lại. API duration→durationSeconds là mapping adapter FE rõ ràng, **không còn blocker contract component**. |
| P1 phạm vi: media-service.ts | **Chưa sửa — blocker toàn PR** | Toàn diff PR vẫn +14/-4 ở `src/lib/merchant/media-service.ts:7–8,24–44,131`: typed Row/Insert, platform fallback other, array analysisMetadata đổi {}. Commit mới không sửa service, nên việc chỉ push hai component không loại thay đổi cũ. PR comments/reviews rỗng lúc kiểm tra, chưa có bằng chứng BE phê duyệt. Yêu cầu tách backend hoặc cung cấp review BE có thẩm quyền và chốt phạm vi với PM; FE không tự revert hoặc chạy service ghi DB. |

- **Lỗi chức năng mới:** chưa phát hiện trong phạm vi source + fixture nêu trên; không khẳng định toàn branch/portal không còn lỗi. Hai component có thể dùng để **chuẩn bị tích hợp FE-W3-06** tại đúng commit đã review, nhưng **toàn PR #33 chưa sẵn sàng tích hợp/approve** do backend ngoài phạm vi. Chưa triển khai FE-W3-06.
- Góp ý thẩm mỹ/usability tách khỏi blocker: nút chọn và X vẫn40px, nên cân nhắc44px; font/spacing/contrast cần UIUX review, chưa có Figma handoff xác minh. Không yêu cầu sửa lại modal/card/nullable đã đạt để xử lý những góp ý này. Chưa kiểm tra screen reader, iOS/Android thật hoặc nested modal.

### Kiểm chứng và mapping chuẩn bị FE-W3-06
- Snapshot hai file lấy bằng API theo SHA, lưu riêng ignored `build/fe-w3-t3-review-f9a5509/`. Git blob tính lại khớp **MediaCard `e2bdf4a42317fcff10026135405d0821fb2488f2`**, **Modal `d47b35c5f8e88341bf8de9a738b3942e6eca8360`**. Không ghi đè snapshots/evidence cũ.
- **Lint PASS 0 errors/0 warnings** cho hai component bằng ESLint lintText với canonical filePath và config repo. **TypeScript hai component PASS**, dùng strict/noEmit/skipLibCheck/react-jsx/moduleResolution bundler như lượt trước; không suy ra full-repo/PR build đã pass. Không thay config, assertions hay source để đạt kết quả; không chạy suite không liên quan.
- Fixture dùng đúng source snapshot mới, React/Next Image thật + parent state mock và MediaCardGrid mới, CSS Coastal repo. **Assertions PASS ở 320/390/768/1440**, không page errors hay unexpected requests. Document/ảnh hợp lệ route.fulfill trong bộ nhớ tại origin giả review.invalid; chỉ 4 request ảnh hỏng cố ý bị chặn (1/viewport). Không nạp `.env.local`, gọi Supabase/AI/webhook/Telegram hoặc tạo dữ liệu. Browser đóng khi test xong, không mở server/tunnel hay tác động server của người dùng.
- Đã chụp **và mở xem** cả cards/modal ở 4 kích thước: `build/fe-w3-t3-review-f9a5509/cards-{width}.png`, `modal-{width}.png`; report/harness cùng thư mục. Không đánh đồng viewport Chromium với QA thiết bị thật, ảnh fixture không nạp asset font dự án nên không xác nhận Figma/font/contrast audit hoàn chỉnh. Không kiểm tra API/session live, full-branch build hoặc backend service trong lượt này.
- Adapter khi làm FE-W3-06: truyền `id/title/thumbnailUrl/styleTags` trực tiếp từ MediaReferenceItem; **`durationSeconds: item.duration`** (seconds nullable, không /1000, không đổi null thành0); isSelected/onSelect do state UI quản lý, callback chỉ chọn ID chưa gọi AI/video. Component hỗ trợ thiếu optional values và fallback, không cần API đổi tên hoặc thay dữ liệu giả vào portal. Dùng MediaCardGrid hoặc grid tương đương giữ min-width/overflow đúng; vẫn phải kiểm tra tích hợp session/GET Media/phân trang/error/private cache theo checklist mục15.
- Tin nhắn Tester 3 (soạn sẵn, **chưa gửi**): “Đã review lại PR #33 @f9a5509. Modal, tag dài và ảnh lỗi/null/duration/styleTags đã kiểm chứng đạt ở 320/390/768/1440; lint và TypeScript hai component pass, không cần sửa lại các mục này. Toàn PR vẫn còn media-service.ts +14/-4 từ commit cũ. Nhờ tách backend khỏi PR UI hoặc gửi review BE/PM xác nhận phạm vi để chốt; FE chưa approve/merge.”
- Giữ nhánh FE/HEAD `7116ac6`, mọi thay đổi tracked/untracked FE-W3-04/05, env/ignored/exclude/backup. Chỉ cập nhật hai tài liệu FE và thêm fixture/evidence ignored; không sửa source bàn giao/backend/DB/RLS/seed, fetch/checkout/merge/cherry-pick/commit/push, đăng comment/approval hoặc tích hợp FE-W3-06. Không coi quan sát Wallet mới là đã nghiệm thu toàn bộ FE-W3-05.

## 17. FE-W3-06 — Merchant Media Library độc lập bằng fixture — 22/10/2026

### Phần đã triển khai và ranh giới production
- **IN PROGRESS**, không đánh dấu hoàn thành cả task/tuần. Thêm `/merchant/library` với `getMerchantPortalAccess` ở leaf (ngoài guard layout), redirect đúng next khi chưa đăng nhập, notice hiện có cho forbidden/unavailable. Route `force-dynamic`, không cache trang tài khoản công khai. Portal thật hiện trạng thái **Thư viện đang được hoàn thiện**, không đọc Media API hoặc hiển thị mock.
- Navigation Dashboard Merchant nối route thật và route preview tương ứng khi preview=true. Shell mới dùng Brand/Button/tokens Coastal hiện có, font/kem/teal/terracotta; không đổi logo/font/global CSS, Auth, PWA cache hoặc các luồng Reseller/Chat/Wallet.
- `src/lib/merchant/media-library.ts`: schema response, adapter và transport GET chuẩn bị sẵn, **chưa gọi bằng fetch thật trong portal**. `src/components/merchant/library-client.tsx`, `library-shell.tsx`, `library.module.css`: shell, danh sách, loading/empty/error/session/forbidden, search/platform/pagination, selection và điểm ghép component. Không viết bộ MediaCard/VideoGuidelinesModal thay thế.
- `/preview/merchant/library` development-only, noindex, import động preview sau guard NODE_ENV. Preview dùng **snapshot nguyên bản** hai component tại f9a5509 trong `tests/fixtures/tester3-f9a5509/`, kèm README provenance; không tạo canonical production components, không nhập media-service.ts của Tester3. Git blobs khớp `e2bdf4a42317fcff10026135405d0821fb2488f2` và `d47b35c5f8e88341bf8de9a738b3942e6eca8360`. Route production không import snapshot/fixture.
- Fixture transport trong `tests/fixtures/media-library.ts` mô phỏng toàn bộ collection8item và response API; search/platform áp dụng trước pagination ở transport, không lọc chỉ trang đang hiển thị rồi gọi là tìm toàn thư viện. Preview có bộ điều khiển tách biệt (collapsed mặc định), context A/B và session invalidation giả; không phiên Supabase thật. Ảnh hợp lệ lấy `/coast.svg` có sẵn từ chính origin preview, null/ảnh404 dùng fallback component. Không cần Playwright intercept để người dùng xem được ảnh hợp lệ; videoUrl giả không được mở/tải/link vào hành động.
- Nút **Chọn mẫu** chỉ đánh dấu ID trong state phiên xem, có thể bỏ chọn. Thông báo rõ **bước tạo video chưa sẵn sàng; chưa tạo hoặc gửi video**. Đổi trang/filter/context sẽ bỏ chọn; observer invalidation ẩn danh sách đồng bộ, abort read và chặn phản hồi muộn, không cache localStorage/SW hoặc lưu lựa chọn xuyên tài khoản. Không upload, POST/DELETE media, render video hoặc AI.

### Contract đã đối chiếu và phần BE/BA còn cần xác nhận
- Nguồn hiện tại: `app/api/merchant/media/route.ts`, `src/lib/merchant/media-schema.ts`, **media-service.ts local không thay đổi** (không phụ thuộc bản sửa PR#33); migration `20261019100000_commerce_attribution_and_media.sql`, BE1_W3, UIUX_W3/handoff đã đọc. Next docs installed về layouts/pages, server/client và image được đọc trước viết code.
- GET `/api/merchant/media`: query merchant_id/platform/tag/search/page/limit, default page1/limit20, limit<=100; trả **`{success:true,data:MediaReferenceItem[],pagination:{total,page,limit,totalPages}}`**, không phải items nested. Service order created_at DESC, range server, search ilike title, tag contains array. Empty hợp lệ total0/totalPages1. Success header private/no-cache/no-store; validation400, query/service500. **GET hiện chưa trả 401/403 tường minh** khi không có Merchant; UI có state/mock401/403 và transport chuẩn bị xử lý chúng, không khẳng định API thật đã có contract lỗi auth đó.
- `MediaReferenceItem`: id/merchantId/title/videoUrl/thumbnailUrl/platform/duration/styleTags/analysisMetadata/createdAt/updatedAt. duration integer seconds positive tới3600 hoặc null, thumbnail null, styleTags array tối đa20 tag, mỗi tag<=50; title<=255. UI adapter truyền id/title/thumbnailUrl/styleTags trực tiếp, **duration→durationSeconds, giữ null**, không chia đơn vị/bịa thời lượng. Reject response thiếu/sai/null không đúng contract, unsafe URL scheme/credentials, pagination sai/duplicate IDs; không biến error thành danh sách trống. Không suy ra ownership từ trường merchantId trong response.
- **Scope chưa thống nhất đủ để nối portal:** GET dùng resolveMerchantId session user+membership rồi **mặc định merchant_id=current Merchant**, nhưng merchant_id query có thể override và khi không có membership GET vẫn tiếp tục list. Migration source lại có SELECT policy **USING(true)** cho media_references, trong khi ALL management policy theo auth.uid() và ghi chú mục đích “video mẫu Merchant”. Có thể là nguồn tham khảo đọc chung nhưng chưa đủ bằng chứng để tự gọi đó là thư viện chung hoặc tự khóa mỗi card theo chủ. Đây là đối chiếu source, **chưa xác minh RLS/cloud thực tế**, không sửa DB hoặc coi quyền đọc cloud đã đạt.
- Cần BE/BA chốt: màn hình mặc định là media riêng hay mẫu dùng chung, cách chọn scope chuẩn, vai trò/session cần cho GET, dữ liệu được public và contract401/403; không dùng x-merchant-id/merchant_id từ client làm quyền đọc. Hỏi thêm chọn mẫu sẽ chỉ lưu draft hay gắn bước nào vào campaign/generation. API hiện có POST create và DELETE(id) nhưng **không thuộc lượt này**. Không nối endpoint video generation chỉ dựa trên task DONE.
- FE-W3-07 giữ kết quả: **hai component đạt tại f9a5509**, toàn PR còn backend ngoài phạm vi và chưa có approval/merge xác minh. Sau khi PR scope được xử lý: đưa canonical component được duyệt vào code qua quy trình team, đổi preview slot imports sang canonical ở điểm ghép thích hợp; chỉ bật live loader sau khi scope/guard/API contract được BE/BA chốt và QA bằng session Merchant. Không cần sửa lại nullable mapping đã rõ. Chưa có Figma/spec mới bàn giao xác minh; giao diện là đề xuất **Chờ UI/UX review**.

### Kết quả kiểm chứng và giới hạn
- `node --experimental-strip-types --test tests/media-library.test.ts`: **6/6 PASS**. Bao gồm nullable mapping, thiếu/sai response không thành empty, URL không an toàn, metadata phân trang sai, GET no-store một lần không merchant identity/retry, mock full-collection search/filter/page, asset preview local và guard thật của page qua dependency mock. Bounds đọc được adapter áp dụng theo schema tạo media đã có/DB types, chưa coi là đã QA tất cả dữ liệu lịch sử cloud. Node có MODULE_TYPELESS_PACKAGE_JSON warning sẵn theo cơ chế strip-types, không sửa package.json để che warning.
- TypeScript toàn repo `tsc --noEmit --incremental false` **PASS**; production build cuối **PASS**, gồm typecheck và **31/31** trang, `/merchant/library` là dynamic. Output riêng **`build/fe-w3-media-release`**, sử dụng public config placeholder ở tiến trình kiểm thử để chặn cloud, không dùng làm artifact triển khai. Một build trước dừng chủ động khi rút gọn tiêu đề theo ảnh; không báo lần bị dừng là PASS. Build cuối đã gồm sửa fixture dùng asset local.
- ESLint tất cả code/test sửa/thêm liên quan **0 errors/0 warnings**; rerun các file đổi cuối **PASS**. Lượt đầu đưa CSS module vào ESLint có 1 warning vì repo không cấu hình CSS lint, không phải warning code; lệnh cuối chỉ lint TS/JS đúng scope, CSS được compile trong Next/build và kiểm tra UI. Không đổi config/làm yếu assertions.
- `tests/media-library-browser.mjs`: **PASS 320/390/768/1440**, card/tag50/title dài/ảnh hỏng/null, naturalWidth ảnh local thực >0, callback chọn/bỏ chọn, query search từ trang2 (thấy Hội An ở toàn collection), filter platform, phân trang/back disabled states, error/network/schema/empty/loading/session/forbidden, context B không bị read chậm A ghi đè, keyboard focus/modal/Escape và navigation Dashboard→Library. Không page errors, không API/Tracking/AI/video/Telegram/write/external requests. Test chặn ảnh hỏng có chủ ý và mọi request dịch vụ; ảnh đúng lấy public asset local như preview người dùng, không dựa vào intercept ảnh hợp lệ.
- Đã chụp **và xem** ảnh mobile320/390, desktop1440, modal và error; evidence **`build/fe-w3-media-evidence/`**, đủ ảnh 320/390/768/1440 và viewport. Sau xem ảnh rút gọn h1 thành “Thư viện media”, làm rõ title khu danh sách và chụp lại từ đầu trang. Phát hiện fixture ban đầu chỉ có ảnh do driver mock nên sửa sang `/coast.svg` repo, bổ sung regression và chạy lại UI/build cuối; không sửa snapshot Tester3. Next dev có advisory LCP ảnh có thể ưu tiên tải khi thực sự above-fold; chưa chỉnh loading props trên snapshot đã review. Không ghi là UIUX reviewed/Figma matched, contrast audit đầy đủ hoặc đã thử điện thoại thật.
- Kiểm tra guard production local cổng3193: GET `/preview/merchant/library` **404**; `/merchant/library` không có session chuyển **307 /login?next=%2Fmerchant%2Flibrary**. Page guard allowed/forbidden/unavailable được mock unit riêng; chưa có session Merchant thật để kiểm chứng dữ liệu/quyền cloud. Không dùng admin hoặc x-merchant-id để vượt guard.
- Dừng **đúng server kiểm thử3192/3193 của lượt này**; không dừng server người dùng. Khôi phục **nguyên byte** tsconfig.json và next-env.d.ts đầu lượt, giữ include manual cũ. Snapshot kiểm tra `build/fe-w3-media-local-state/hashes.json` (chỉ hash) xác nhận các file được bảo toàn không đổi ngoài hai docs FE và dashboard được phép sửa, gồm FE-W3-04/05, `.env.local`, `.git/info/exclude`, SW, Media API/service. Snapshot component vẫn nguyên blob SHA, không đổi source Tester3 hoặc backend. Giữ HEAD/nhánh `7116ac6` / Feature_FE_W3_PWA_Mobile_Commerce; không stage/commit/push/merge/fetch.

### Chạy xem và bước tích hợp tiếp theo
- Mở **terminal riêng chỉ dùng fixture**. Bước cấu hình dưới đây chỉ đặt biến của tiến trình/terminal, không sửa .env.local. URL placeholder khiến hasSupabaseConfig=false, chặn proxy Auth gọi cloud kể cả browser có cookie từ cổng khác; portal thật trong terminal này chỉ dùng để kiểm tra đóng guard, không để kiểm chứng session thật.

```powershell
& { $env:NEXT_BUILD_DIR='build/fe-w3-media-manual'; $env:NEXT_PUBLIC_SUPABASE_URL='https://placeholder.invalid' }
```

```powershell
npm.cmd run dev -- --hostname 127.0.0.1 --port 3192
```

- Preview: **http://127.0.0.1:3192/preview/merchant/library**. Device Mode320/390, thử Quy chuẩn video bằng Tab/Shift+Tab/Escape, Chọn mẫu/Bỏ chọn, Sau/Trước, tìm “Hội An” và lọc Reels. Mở “Tùy chọn mô phỏng thư viện” để chọn loading/empty/error/session/forbidden, phản hồi chậm và đổi ngữ cảnh. Chọn mẫu không tạo video. Nếu3192 đã bị chiếm, chọn cổng khác trong lệnh dev; fixture ảnh dùng window.location.origin nên vẫn hoạt động. Không dừng server của người khác để lấy cổng.
- Portal: **http://127.0.0.1:3192/merchant/library**. Với cấu hình placeholder sẽ về login; khi dùng cấu hình thật trong terminal/server riêng và Merchant hợp lệ sẽ thấy trạng thái chờ tích hợp, không có mock hay tự đọc Media API. Lượt này không kiểm tra live session/cloud.
- Còn chờ: (1) Tester3/BE/PM xử lý backend ngoài phạm vi PR#33; (2) BE/BA chốt shared/private GET scope, authorization/error contract và hành vi sau chọn; (3) UIUX review; (4) ghép canonical components, bật read adapter tại nơi có session/role guard và kiểm tra dữ liệu/quyền riêng trước mở production. Generation/upload là phạm vi khác, không tự thêm. Các kết quả PWA/Nav/Share/Chat/Wallet trước được giữ, quan sát Wallet22/10 vẫn là UI thủ công, chưa nâng thành nghiệm thu toàn bộ.

## 18. FE-W3-06 — ghi nhận thủ công và sửa grid khi ít kết quả — 22/10/2026

### Kết quả thủ công do người dùng xác nhận — tách khỏi test tự động
- Tại preview Media Library, bấm **Chọn mẫu** chuyển nhãn thành **Đã chọn**.
- Modal **Quy chuẩn video mở được** trên desktop và **viewport390px**.
- Chọn trạng thái **Lỗi mạng** hiện thông báo lỗi tương ứng.
- Chỉ ghi đúng các thao tác quan sát trên; chưa xác nhận thủ công focus trap/Escape hoặc toàn bộ luồng. Đây là **preview/fixture**, **không phải kiểm chứng API thật hoặc điện thoại thật**, không nâng task/tuần hay toàn PR#33 thành hoàn thành/approved.

### Chẩn đoán và sửa layout tích hợp
- Ảnh người dùng cho thấy một card sau tìm “Hội An” giãn gần hết hàng. Tái hiện độc lập trên cổng fixture3194, viewport1440: grid rộng1168px, computed columns **1168px 0px 0px 0px**, card1168px, thumbnail1166×2072.875px. **Tỷ lệ ảnh vẫn đúng9:16**; vấn đề là chính sách lưới khi chỉ còn một kết quả, không có bằng chứng sai tỷ lệ hay lỗi render Card.
- `MediaCardGrid` snapshot dùng auto-fit/minmax/1fr nên cột trống bị collapse, cột còn lại nhận hết chiều rộng. Đây là helper responsive có thể hợp lệ cho bố cục khác; **composition Media Library chưa giới hạn trường hợp ít kết quả**. Không quy mọi lỗi cho Tester3. Đối chiếu UIUX_W3 chỉ có grid9:16, chưa có kích thước/Figma mới được xác minh.
- Sửa tối thiểu `library-client.tsx:51` thêm wrapper `collection`; `library.module.css:22–25` áp chính sách **auto-fill** trong wrapper và align-items:start. Giữ track trống để1/2card có cùng chiều rộng card khi nhiều kết quả, không giãn full row; không dùng ẩn overflow toàn trang. Snapshot card/modal/grid của Tester3 giữ nguyên byte, không đổi9:16, font/globalCSS, backend hoặc PR.
- Đo lại cùng viewport và query: grid vẫn1168px, columns **280px 280px 280px 280px**, card **280px**, thumbnail **278×494.21875px**, aspect9/16. Mobile vẫn một cột vừa viewport; tablet/desktop giữ card gọn. Ảnh/JSON trước-sau: **`build/fe-w3-media-grid-state/before.*` / `after.*`**.

### Chốt kiểm chứng và tiếp tục sau gián đoạn

- **Đã hoàn tất trước khi bị ngắt:** browser regression `tests/media-library-browser.mjs` PASS tại **320/390/768/1440px**, với danh sách đầy đủ 6 card, trang cuối 2 card, tìm kiếm còn 1 card và không có kết quả. Không tràn ngang; card ít kết quả giữ kích thước như danh sách đầy đủ, thumbnail giữ9:16. Chọn/bỏ chọn, phân trang/lọc, modal, Tab/Shift+Tab/Escape và trả focus, lỗi/phiên/quyền, đổi ngữ cảnh và phản hồi đến muộn đều PASS bằng fixture; không request API/cloud hoặc thao tác ghi.
- **Ảnh lỗi được kiểm tra riêng với HTTP404 thật**, không abort request hoặc tắt log: `tests/media-library-image-fallback.mjs` PASS. Mount đầu có đúng1request404 và hiện fallback; idle, chọn/bỏ chọn và mở/đóng modal không phát sinh request ảnh mới. Bỏ card khỏi danh sách rồi dựng lại sinh đúng1request404 mới; idle sau đó vẫn ổn định. Tổng2response404 cho2lần mount, không JavaScript pageerror; không thấy vòng lặp tải lại trong các tình huống đã kiểm tra. Bằng chứng: `build/fe-w3-media-grid-evidence/image-fallback-console.json` và ảnh fallback cùng thư mục. Không suy ngược thời điểm phát sinh bốn entry lịch sử khi thiếu trace.
- **Kiểm tra kỹ thuật đã hoàn tất với exit code0 trước gián đoạn:** TypeScript toàn repo (`tsc --noEmit --incremental false`), ESLint client và hai browser test liên quan, production build output `build/fe-w3-media-grid-release` gồm TypeScript và **31/31 trang**. Không tính lần connection refused ban đầu khi server chưa sẵn sàng là PASS; lượt sau khi server sẵn sàng mới hoàn tất. Unit adapter6/6 thuộc lần triển khai trước, không chạy lại vì thay đổi này chỉ ảnh hưởng composition/grid.
- Đã chụp và xem ảnh full/single/modal tại các viewport trong `build/fe-w3-media-grid-evidence/`; đối chiếu thêm before.png/after.png trong `build/fe-w3-media-grid-state/`. Desktop một card giữ rộng280px, mobile một cột vừa khung; modal390px vừa viewport. Đây là **mô phỏng viewport và bàn phím desktop**, chưa phải safe area/bàn phím hoặc điện thoại thật.
- **Lượt tiếp tục sau hết hạn mức:** chỉ kiểm tra lại status/diff, source, JSON/ảnh và bằng chứng kết thúc các lệnh trước; không chạy lại test/build đã hoàn tất hoặc sửa thêm source. Đã xem lại ảnh full1440, single1440/390 và modal390. Snapshot Tester3 vẫn đúng blob gốc; hash các phần được bảo toàn khớp, tsconfig.json và next-env.d.ts khớp bản đầu lượt sửa grid; env/backend/SW/Git config không đổi. HEAD vẫn `7116ac640dad77cbbc7f74753dc0b34554ec0086`, nhánh `Feature_FE_W3_PWA_Mobile_Commerce`; giữ mọi thay đổi chưa commit. Server test3194 đã dừng; lúc tiếp tục không thấy listener3192/3194.
- **Còn chờ:** tích hợp Media API thật và kiểm chứng session/quyền/dữ liệu sau khi BE/BA chốt contract shared/private và phạm vi PR#33; canonical component và UIUX review. Portal thật không âm thầm dùng fixture. Không approve/merge PR, không đánh dấu toàn task/tuần nghiệm thu. Build/test dùng placeholder ở process để tránh cloud; không sửa .env.local, không dùng output này làm bản triển khai có cấu hình thật.
- Xem lại bằng hai lệnh PowerShell và URL ở mục17: terminal riêng với NEXT_BUILD_DIR=build/fe-w3-media-manual, NEXT_PUBLIC_SUPABASE_URL=https://placeholder.invalid, chạy dev cổng3192 rồi mở **http://127.0.0.1:3192/preview/merchant/library**. Thử danh sách đầy đủ, tìm “Hội An”, xóa bộ lọc, trang cuối, Chọn mẫu và Quy chuẩn video. Nếu cổng bận, chọn cổng khác; không dừng server hiện có.

### Console: bằng chứng thu được và giới hạn
- Không gắn được vào Console cũ của tab Chrome người dùng. Log server output `build/fe-w3-media-manual/dev/logs/next-development.log` không có nội dung bốn lỗi đỏ; không suy nguyên nhân chỉ từ bộ đếm hoặc Network đang lọc wallet.
- Tái hiện bằng **Console event + response thực**, không abort ảnh hỏng trong lượt chẩn đoán: một **error “Failed to load resource…404”** tại **`/fixture-missing-thumbnail.jpg`**, response404 tương ứng; file này **cố ý không tồn tại** trong fixture để kiểm tra onError/fallback. Trước/sau sửa layout đều ghi nhận cùng nguồn lỗi, fallback hoạt động. Không phải bằng chứng lỗi Media API hoặc Supabase; không đổi dữ liệu lỗi thành empty hoặc tắt Console để che.
- Có thêm **warning LCP** của Next Image cho `/coast.svg`, khuyến nghị loading eager nếu ảnh above-fold; đây là warning hiệu năng, không phải exception hoặc bằng chứng giải thích bộ đếm đỏ. **Không có pageerror JavaScript** trong hai lượt chẩn đoán; mọi request chỉ local fixture, không API/cloud. Payload Console/URL đã lưu trong before.json/after.json, không secret/cookie/token.
- **Đã bổ sung Console do người dùng gửi:** cả **4 dòng đỏ giống nhau**, đều HTTP404 tại `http://127.0.0.1:3192/fixture-missing-thumbnail.jpg`; có HMR/Fast Refresh và React DevTools, không thấy lỗi JavaScript khác trong phần Console đang hiển thị. Như vậy bốn entry đã được đối chiếu đúng **nguồn ảnh lỗi fixture** trong source, không còn là suy luận từ bộ đếm. Chưa có timestamp/network trace của lịch sử bốn lần nên không tự khẳng định thao tác nào đã dựng lại từng card; kiểm tra riêng idle/rerender/remount để xác minh không retry loop. Không cần chờ ảnh hoặc yêu cầu HAR/cookie/token.

## 19. FE-W3-06/07 — đồng bộ dev và ghép component chính thức — 22/10/2026

### Bảo toàn, quyền Windows và merge local

- Giữ nhánh `Feature_FE_W3_PWA_Mobile_Commerce`. Checkpoint local `443dddd2b295a720402886f17a8849f25fc2835f` bảo toàn FE-W3-04/05/06, grid auto-fill, tests và tài liệu trước đồng bộ. Backup gốc `E:\THUCTAP\ai-travel-reseller-recovery\fe-sync-2026-10-22T10-38-03-086Z` có manifest SHA-256, staged/unstaged diff, index và file local; giữ nguyên, không ghi secret vào báo cáo.
- Fetch trước dùng đúng refspec dev với `--no-write-fetch-head`, thành công tới `add4f07aad89628ef63852d1f06f8dc776772002`. Không fetch toàn remote hoặc sửa ACL/config/refspec. Lượt merge trước lỗi unlink tại `docs/be2/content-factory.schema.json` và `src/lib/ai/prompts/content-factory.ts`; không MERGE_HEAD sau lỗi, không giả định merge đang mở.
- Người dùng cấp Delete đúng hai file. Kiểm tra lại dưới `ADMIN\Admin`, token medium/non-elevated (Administrators deny-only), mở/đóng handle DELETE đều thành công; không xóa file trong phép kiểm tra. Không sửa ACL rộng hoặc dừng server/Node khác.
- Xác minh checkpoint, backup gốc và manifest sau lỗi: 30 file untracked không thêm/mất/đổi, khớp bản sao và blob `origin/dev`; 52 file bảo toàn nguyên hash. Chuyển đúng 30 file này tới `verified-dev-files-before-retry` trong recovery, kèm move-manifest và kiểm lại hash; không git clean/reset, không xóa bằng chứng. Worktree sạch trước merge lại.
- Merge LOCAL `031d81b5df2c72e8d6df5fe27e1753bc47427023` tích hợp dev `add4f07`. Có đúng hai conflict nội dung: ChatPanel giữ `!preview && m.checkout` để chặn analytics fixture và bảo đảm narrowing thay cho non-null assertion của dev; TEAM_WORK_LOG giữ tiến độ FE và cập nhật BE/PM/Tester3 từ dev. Không chọn nguyên ours/theirs; package.json/lockfile từ dev, tsconfig FE giữ nguyên. Không conflict marker, unmerged entry hoặc MERGE_HEAD sau commit; dev là ancestor của HEAD. Incoming Markdown/log có trailing whitespace từ dev được giữ, không gọi staged diff-check toàn merge là sạch.

### Component, contract và chặn API thật

- PR33 đã merge trên GitHub vào dev tại `add4f07`; component vẫn là `f9a5509cbc98b5d6ab4c37e9a4210ca398a21045`. Blob MediaCard `e2bdf4a42317fcff10026135405d0821fb2488f2`, Modal `d47b35c5f8e88341bf8de9a738b3942e6eca8360` không đổi; tái sử dụng kết quả review, không chạy lại toàn bộ review component độc lập.
- LibraryClient import canonical MediaCard/MediaCardGrid/VideoGuidelinesModal; preview chỉ truyền mock transport, không còn import snapshot hoặc inject bản component khác. Hai snapshot nguyên blob được giữ làm bằng chứng lịch sử, README ghi rõ đã ngừng dùng runtime. Không sửa source Tester3; CSS auto-fill ở composition vẫn nguyên, giữ thumbnail9:16 và fallback, không giãn card khi ít kết quả.
- **BE đã xác nhận media RIÊNG từng Merchant**, không còn hỏi lại shared/private. Prepared GET dùng cookie same-origin, không merchant_id/x-merchant-id; nhận page/limit/search/platform và tag tùy chọn theo schema. UI hiện dùng 6 mẫu/trang (backend cho phép1–100); test contract có page1/limit20. Mapping duration giây → durationSeconds, null giữ nguyên. Không xác lập ownership bằng cách lọc dữ liệu đã tải xuống client.
- Route thật `/merchant/library` vẫn lặp guard Merchant ở leaf, chỉ hiển thị trạng thái chờ, không import mock hoặc gọi readLibrary. Nội dung pending cập nhật đúng contract media riêng; preview development-only dùng cùng canonical UI với fixture, không âm thầm mở API thật hoặc tạo video.
- **Blocker BE còn thực tế trong dev đã merge:** GET `app/api/merchant/media/route.ts:76` vẫn lấy query merchant_id trước session; resolveMerchantId còn header/query fallback ở non-production, GET không explicit401/403 khi thiếu Merchant. Migration commerce media vẫn public SELECT USING(true) tại dòng174. Cần BE xử lý/kiểm chứng unauthenticated, sai role, giả mạo Merchant và cross-account; không sửa backend/RLS trong lượt FE. Code/migration đã có trong Git không chứng minh cloud đã áp dụng. PR33 vẫn chứa media-service; PM worklog review hai component không phải bằng chứng BE review riêng service.

### Kiểm chứng và bàn giao

- Unit mock **30/30 PASS**: Media7, Chat transport2, Content Factory21 (mở rộng có mục tiêu vì dev đổi prompt/schema). TypeScript toàn repo `tsc --noEmit --incremental false` **PASS**. ESLint9file liên quan **0 errors/0 warnings**. Không chạy suite AI/cloud hoặc toàn suite không liên quan.
- Browser canonical Media **PASS320/390/768/1440**: full6/ít2/ít1/0kết quả, card không giãn thêm,9:16, nullable/fallback, chọn/bỏ chọn, search/filter/page, modal Tab/Shift+Tab/Escape/trả focus, lỗi/phiên/quyền/context/late response; không API/cloud/write requests. Browser Chat cũng **PASS4viewport**, submit/dedup, lỗi/timeout/offline giữ draft, không auto retry, session/context reset, late reply, focus trap và visualViewport giả lập. Không thay guard preview để pass.
- Test ảnh404 thật **PASS**: idle/chọn mẫu/modal không tải lại, remount đúng1request mới, không retry loop/pageerror; giữ Console lỗi fixture. Evidence `build/fe-w3-canonical-media-evidence/` (gồm image-fallback-console.json) và `build/fe-w3-canonical-chat-evidence/`. Đã chụp và xem full1440/768, single1440/320, viewport390 và modal390; grid auto-fill gọn, ảnh9:16 giữ nguyên. Đây là mô phỏng viewport/keyboard, chưa điện thoại thật hoặc UIUX acceptance.
- **Giới hạn bundler:** lượt browser đầu trên Turbopack FAIL vì HTTP404/0card; `/preview/merchant` và `/preview/chat` có sẵn cũng404. Compiled Media route tồn tại, guard production đã bị loại trong development. Cùng source trên server Webpack riêng trả200 và regression đạt, không sửa route/guard/config để che. Chưa kết luận nguyên nhân sâu của Turbopack; bàn giao lệnh Webpack đã kiểm chứng, không gọi lượt FAIL ban đầu là PASS.
- **Production build Webpack PASS** (exit0), TypeScript và **32/32 trang** tại `build/fe-w3-canonical-release`. Release smoke tại3196: `/login`200, `/preview/merchant/library`404, `/merchant/library`307 đúng `/login?next=%2Fmerchant%2Flibrary`, không API/cloud. Đã dừng server test3194/3196 do lượt này tạo; khôi phục nguyên byte tsconfig.json/next-env.d.ts từ đầu lượt, TypeScript toàn repo chạy lại sau khôi phục **PASS**.
- Kiểm tra bảo toàn cuối:52file gốc được đối chiếu, chỉ9file FE/test/docs dự kiến thay đổi; không thay đổi ngoài dự kiến, backup gốc không sai hash.30file dev đã merge khớp blob origin/dev,30bản chuyển recovery khớp hash; env/config/exclude giữ nguyên, tsconfig/next-env khớp byte đầu lượt. Git cuối có10file modified chưa stage (gồm lockfile bổ sung), không untracked/staged/unmerged/MERGE_HEAD; `git diff --check` phần chưa commit PASS. Giữ checkpoint443dddd và merge031d81b, không commit phần FE sau merge.
- Build đầu **FAIL** do2generated file của lượt Turbopack mới có đoạn dư cuối: `dev/types/routes.d.ts` và `validator.ts`, gây lỗi parse. Không sửa generated bằng tay hoặc exclude/tắt strict/typecheck. Giữ toàn bộ output lỗi ở `failed-turbopack-output` trong recovery ngoài repo, có hash2file; restore config gốc và build lại Webpack mới đạt. Đây là artifact phát sinh trong lượt thử nghiệm, không gán lỗi cho source BE/FE hoặc coi build dở là PASS.
- Dependencies: npm ci phát hiện lockfile từ dev thiếu entry optional đa nền tảng; giữ bản gốc `build/fe-w3-canonical-state/package-lock.json.before`, dùng npm tạo bổ sung, không sửa bằng tay. Npm install hoàn tất; thêm87entry/metadata, không xóa entry, không đổi phiên bản đã khóa hay dependencies gốc. `npm ci --ignore-scripts --no-audit --no-fund --dry-run` **PASS** sau bổ sung. Không chạy lifecycle scripts/AI/video generation. Bước install với package-lock=false trước đó được dừng vì không bảo đảm dùng lockfile; không lấy trạng thái cài dở làm bằng chứng PASS.
- Chỉ checkpoint và merge local được commit; mọi chỉnh FE/test/tài liệu sau merge và bổ sung lockfile nếu có để chưa commit. Không push/PR/approval, DB/RLS/seed, Tracking, Telegram, tunnel hoặc sửa .env.local. Chờ UIUX và QA thiết bị thật; không đánh dấu cả tuần hoàn thành.
- Xem fixture trong terminal PowerShell riêng: `$env:NODE_ENV='development'`, `$env:NEXT_BUILD_DIR='build/fe-w3-canonical-manual'`, `$env:NEXT_PUBLIC_SUPABASE_URL='https://placeholder.invalid'`, `$env:NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=''`, rồi `npm.cmd run dev -- --webpack --hostname 127.0.0.1 --port 3192`. Preview **http://127.0.0.1:3192/preview/merchant/library**; thử full list, tìm “Hội An”, trang cuối2card, chọn/bỏ chọn, modal bằng Tab/Shift+Tab/Escape và viewport320/390/768/1440. Portal `/merchant/library` ở server cấu hình thật vẫn chờ quyền đọc, không mock; server fixture placeholder không dùng để kiểm session thật. Nếu cổng bận, chọn cổng khác, không dừng server của người dùng.

## 20. Gói bàn giao FE tuần3 — Draft PR vào dev — 22/10/2026

- FE-W3-01 đến05 đã triển khai. Giữ riêng bằng chứng tự động và quan sát thủ công: PWA activated/offline/retry và Tracking tạo link/QR đã được người dùng xác nhận; chưa nghiệm thu cài/standalone, native Share, quét QR/redirect-click điện thoại hoặc toàn bộ Tracking. Wallet có fixture và quan sát UI thật, chưa nghiệm thu toàn bộ dữ liệu/phân quyền. Chat kiểm mock, chưa gọi AI thật trong lượt bàn giao. Không tự đánh dấu UIUX/QA approved hoặc hoàn thành tuần.
- FE-W3-06 đã ghép component chính thức, grid auto-fill, adapter cookie/no-Merchant-ID và test mock. Media API thật vẫn chặn, chưa nghiệm thu tích hợp thật. **Người dùng dự định bàn giao phần tích hợp Media thật cho BE tiếp tục; chưa có xác nhận BE nhận việc hoặc hoàn thành.** Điều kiện mở thật: xác thực session/role, chặn giả Merchant/cross-account, RLS phù hợp media riêng và kiểm chứng môi trường cloud.
- FE-W3-07 đã review hai component f9a5509; PR33 được nhóm merge. Không tự gửi approval. FE-W3-08 **chưa kiểm realme C21Y/Chrome và chưa diễn tập QA**; cần kiểm điện thoại thật, PWA install/offline, Share/QR, safe area/bàn phím và phối hợp QA trước Ready for review.
- Rà soát source/test sau merge không có thay đổi runtime so với lượt kiểm chứng mục19: tái sử dụng unit30/30, lint, browser Chat/Media4viewport, fallback404, Webpack build32/32 và release guards. TypeScript toàn repo được chạy lại ở lượt bàn giao vì Next đã bổ sung2include canonical-manual trong tsconfig local. Không chạy lại build/suite không bị ảnh hưởng, không gọi cloud/AI/Tracking/Telegram hoặc tạo dữ liệu thật. Git diff-check/conflict-marker audit thực hiện trước stage.
- Lockfile thêm87entry đều optional, không xóa entry, không đổi phiên bản đã khóa/dependencies gốc; giữ nguyên bổ sung cần thiết cho npm ci (dry-run đã PASS), không revert theo kích thước diff. Commit có chọn lọc10file FE/test/docs/lockfile. Giữ tsconfig.json local ngoài commit (2include canonical-manual), giữ env/ignored/exclude và recovery; không đưa build/cache/log/ảnh kiểm thử hoặc backup vào Git. Hai snapshot review đã versioned là bằng chứng lịch sử, không runtime import; không thêm snapshot tạm.
- GitHub dev tại thời điểm rà soát: `2559b878d9002b5acdf4083a98fd53c58acc5325`, thêm PR44 sau dev `add4f07` đã tích hợp, có thay đổi ChatPanel. Không tự merge/rebase trong lượt bàn giao. Trước Ready cần đối chiếu/tích hợp cập nhật Chat mới và chạy kiểm tra bị ảnh hưởng, đồng thời giữ guard analytics preview. Draft PR sẽ nêu rõ branch kiểm chứng dựa trên add4f07; chưa kiểm thử nhánh FE sau tích hợp dev2559b87.
- Chỉ cho phép commit/push nhánh `Feature_FE_W3_PWA_Mobile_Commerce` và tạo/cập nhật Draft PR base dev; không force-push hoặc merge PR/dev/main. Kết quả commit/push/URL PR được xác minh và báo sau thao tác, không ghi trước thành công.

## 21. FE-W3-06 — Hoàn tất tích hợp Media Library thật và giải quyết conflict dev — 23/10/2026

### Đồng bộ dev và giải quyết conflict
- Merge nhánh `origin/dev` (commit `2559b87`, PR #44) vào `Feature_FE_W3_PWA_Mobile_Commerce`.
- Conflict duy nhất tại `src/components/chat/chat-panel.tsx:227–270`: Tích hợp giải pháp bọc `try...catch` parse hostname URL thanh toán từ `dev` với điều kiện `!preview` tránh kích hoạt PostHog analytics trong môi trường mock từ FE. Commit merge: `0a0058a`.

### Sửa quyền và phân quyền dữ liệu (BE/DB)
- **Database RLS:** Tạo migration `supabase/migrations/20261023090000_restrict_media_references_to_merchant.sql`. Gỡ bỏ policy SELECT công khai (`USING (true)`), áp dụng policy bảo mật phân quyền theo Merchant:
  ```sql
  CREATE POLICY "Allow merchants to view their own media_references"
  ON public.media_references FOR SELECT
  USING (merchant_id = auth.uid());
  ```
  Đã áp dụng thành công vào cơ sở dữ liệu local (`npx supabase migration up --include-all`).
- **API Authorization:** Cập nhật `app/api/merchant/media/route.ts` với hàm `resolveMerchantAccess`:
  - Trả về `401 Unauthorized` nếu không có phiên đăng nhập hợp lệ.
  - Trả về `403 Forbidden` nếu người dùng đăng nhập nhưng không có vai trò Merchant trong bảng `merchants`.
  - Trả về `403 Forbidden` nếu client cố tình truyền `?merchant_id=` khác với Merchant đang đăng nhập (chống mạo danh / rò rỉ dữ liệu chéo).
  - Cung cấp header bảo mật `Cache-Control: private, no-cache, no-store, must-revalidate`.

### Nối API thật vào Giao diện
- `src/lib/merchant/media-library.ts`: Cung cấp giá trị mặc định `send: typeof fetch = fetch` cho hàm `readLibrary` để có thể sử dụng trực tiếp trong client components.
- `src/components/merchant/library-client.tsx`: Xuất component `MerchantLibraryLive` nhận `merchantId`, khởi tạo `LibraryClient` kết nối với `readLibrary`.
- `app/merchant/library/page.tsx`: Thay thế component chờ (`LibraryPending`) bằng `MerchantLibraryLive` bên trong `LibraryShell`.

### Kiểm chứng E2E với tài khoản Merchant thật
- **Unit & Auth API:** `tests/media-library.test.ts`, `tests/merchant-media-api.test.ts`, `tests/merchant-media-auth.test.ts` đạt **16/16 PASS**.
- **Playwright E2E live test:** Chạy `tests/merchant-media-live.mjs` trên dev server cổng 3195 với tài khoản Merchant thật (`merchant@example.com` / `password123` - Sun World Đà Nẵng, 25 mẫu video tour):
  1. Chưa đăng nhập: Redirect đúng `/login?next=%2Fmerchant%2Flibrary`.
  2. Đăng nhập Merchant: Đăng nhập thành công và chuyển hướng về `/merchant/library`.
  3. Tải dữ liệu thật từ DB: Render 6 card/trang, status "25 mẫu", tiêu đề, thời lượng, tag đầy đủ.
  4. Chọn mẫu / Bỏ chọn: State UI cập nhật "Đã chọn" (`aria-pressed="true"`), hiển thị banner xác nhận; bỏ chọn xóa banner.
  5. Modal Quy chuẩn video: Dialog mở mượt mà, bẫy focus, đóng bằng phím Escape.
  6. Phân trang: Sang Trang 2 / Trang 1 dữ liệu cập nhật tức thì.
  7. Tìm kiếm: Tìm "Cầu Vàng" trả về đúng 4 kết quả từ DB; nút Xóa bộ lọc khôi phục lại 6 card.
  8. Responsive 390px (mobile): 1 cột gọn gàng, tỷ lệ thumbnail 9:16, không tràn ngang (`scrollWidth === innerWidth`).
  9. Console: 0 lỗi JavaScript runtime, 0 warning đỏ.
- Ảnh bằng chứng lưu tại: `build/fe-w3-live-media-evidence/`.
- TypeScript toàn repo PASS (`tsc --noEmit`), ESLint 0 errors / 0 warnings. Commit: `5aebb74`.
