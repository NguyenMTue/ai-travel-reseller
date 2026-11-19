# Chạy lại QA FE tuần 6 (TASK-233/234/235)

Các kết quả browser đã ghi trong handoff là kiểm tra local bằng fixture, không phải thanh toán sandbox thật. API quote/status/ticket thật còn chờ BE1; TASK-236 còn chờ đúng PR/nhánh/SHA của Tester 3. Không chạy migration, seed hoặc test tạo đơn thật để tái tạo bằng chứng này.

## Checkout và dependencies

Chạy tại thư mục gốc của một checkout riêng của nhánh `feature/fe-w6-storefront-checkout-revamp`. Dùng Node hỗ trợ `--experimental-strip-types` (Node 22.18+ hoặc 24), npm và package-lock.json của repo:

```powershell
npm.cmd ci
npx.cmd playwright install chromium
```

Nếu đã có Chromium tương thích, có thể đặt `$env:PLAYWRIGHT_CHROMIUM_PATH` tới executable thay cho bước tải browser. Không đổi lockfile hoặc nâng phiên bản dependencies. Các config Playwright không tự khởi động server.

## Logic tests không gọi dịch vụ thật

```powershell
node --experimental-strip-types --test tests/storefront-checkout.test.mjs tests/storefront-pricing.test.mjs tests/storefront-referral.test.mjs
```

Kỳ vọng 8 test. Resolver referral có timeout 1200ms hiện hữu; một lần chạy đồng thời với browser bị thiếu identity, chạy riêng sau đó pass. Không coi retry pass là đã giải quyết tính chập chờn này.

Offline suite cần không có Supabase credentials trong process. Trong terminal QA riêng, xóa các biến process sau (không đọc/sửa file env):

```powershell
'NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SECRET_KEY','SUPABASE_SERVICE_ROLE_KEY' | ForEach-Object { Remove-Item -LiteralPath ('Env:' + $_) -ErrorAction SilentlyContinue }
node --experimental-strip-types --test --test-name-pattern='^SF-0[1-68]:' tests/storefront-subdomain-and-booking.test.ts
```

Kỳ vọng 7 pass, SF-07 bị skip. **Không chạy SF-07** trong quy trình offline này: ca đó gọi API ghi nhận đơn cũ.

## Browser và tạo lại ảnh

Không đặt `.env`, `.env.local`, `.env.development` hoặc `.env.development.local` trong checkout QA. Nếu checkout hiện có env, tạo checkout riêng thay vì sao chép/đổi tên/xóa env. Launcher từ chối khi có các file này. Cổng 3216 và 3217 phải trống; không dừng server khác để lấy cổng.

Terminal A:

```powershell
node tests/fixtures/start-storefront-checkout.mjs
```

Launcher dùng Next dev + PostgREST fixture chỉ đọc ở loopback; tạo tạm `/storefront/fixture-confirmed` và `/storefront/fixture-checkout`, không đưa hai trang sinh ra vào commit. Dữ liệu ưu đãi 5% và phản hồi xác nhận vé là fixture rõ ràng. Các request prepare/check được Playwright intercept; không có endpoint production tương ứng. Không mở fixture thanh toán ngoài test rồi suy rằng nó nối backend.

Terminal B, sau khi Next báo Ready:

```powershell
npm.cmd run test:ui -- --config=playwright.storefront-checkout.config.ts --output=test-results/checkout-verified
npm.cmd run test:ui -- --config=playwright.storefront-mobile.config.ts --output=test-results/mobile-after-checkout --trace=retain-on-failure
npm.cmd run test:ui -- --config=playwright.storefront-referral.config.ts --output=test-results/referral-after-checkout --trace=retain-on-failure
```

Kỳ vọng checkout 20 ca, mobile/tour 20 ca tại 320/390/768/1440px; referral 10 ca tại 390/1440px. Không chạy nhiều bộ đồng thời khi điều tra timeout referral. Mỗi test browser ghi ảnh bằng `testInfo.outputPath`; thư mục con có tên scenario/viewport do Playwright tạo, không phải tên thư mục cố định giữa mọi phiên bản.

- `checkout-verified`: quote-edited.png, server-ticket-fixture.png, retry-result.png và các ảnh trạng thái của suite.
- `mobile-after-checkout`: end-of-tour.png, checkout-total.png và attachment đối chiếu giá.
- `referral-after-checkout`: ảnh từng ref và confirmed-voucher-fixture.png.
- Trace được giữ khi thất bại; dùng `npx.cmd playwright show-trace <đường-dẫn-trace.zip>` để xem. Muốn giữ trace khi pass, thêm `--trace=on` và dùng output khác.

Ảnh/trace trong `test-results`, báo cáo Playwright, log và `.next` là artifact ignored, **không được đính kèm trong commit**. Các đường dẫn trong handoff chỉ mô tả bằng chứng local. Handoff TASK-234 ghi giá modal cũ là lịch sử trước TASK-235; kết quả hiện hành là bảng giá TASK-235. Ảnh/trace `checkout-before` thuộc code trước sửa, không tái tạo bằng code hiện hành; chỉ dựng bản trước sửa trong checkout độc lập nếu cần điều tra lịch sử, không ghi đè nhánh này.

Dừng đúng fixture launcher sau QA. Việc kill cưỡng bức có thể để lại trang fixture: trước khi chạy lại, kiểm tra nội dung hai page.tsx có guard NODE_ENV/TASK234_UI_FIXTURES và marker Fixture TASK-234/TASK-235; chỉ xóa file đã xác minh do launcher tạo và thư mục rỗng tương ứng. Không xóa đệ quy hoặc đưa generated pages vào commit. Không dừng server/output của worktree khác.

## Static checks và giới hạn hiện tại

```powershell
node node_modules/typescript/bin/tsc --noEmit --incremental false
npm.cmd run lint -- src/components/storefront src/lib/storefront tests/storefront-checkout.spec.ts tests/storefront-checkout.test.mjs tests/storefront-mobile.spec.ts tests/storefront-pricing.test.mjs tests/storefront-referral.spec.ts tests/storefront-referral.test.mjs tests/storefront-subdomain-and-booking.test.ts tests/fixtures/checkout-view.tsx tests/fixtures/start-storefront-checkout.mjs tests/fixtures/start-storefront-mobile.mjs tests/fixtures/start-storefront-referral.mjs tests/fixtures/storefront-referral.mjs playwright.storefront-checkout.config.ts playwright.storefront-mobile.config.ts playwright.storefront-referral.config.ts
git diff --check
```

TypeScript nền tại dev `59d21b4507d7dd28e440591575d1cfe2c542d902` có 11 lỗi: auth.ts, tracking/generate/route.ts, merchant/video-generate-modal.tsx và video-engine/ffmpeg-compositor.ts. Lint toàn thư mục có lỗi nền ngoài phạm vi; ba no-explicit-any trong data.ts đã tồn tại trước thay đổi. Không gọi static checks toàn repo là PASS và không tắt rule/typecheck để che lỗi. Các kết quả trước commit được mô tả trong handoff TASK-235.
