# FE Week 1 — Hướng dẫn chạy và bàn giao

## Kết quả
Landing, đăng nhập, đăng ký, Chatbot AI, Dashboard Merchant đã dựng bằng Next.js App Router, TypeScript, Tailwind 4. Thiết kế tiếng Việt: xanh biển trầm, kem và cam đất; font Be Vietnam Pro + Lora được đóng gói local; minh họa SVG local. Hướng thiết kế “Coastal editorial”; điểm DFII đề xuất 14 (4+5+5+4−4). Mốc nhận diện: serif tiêu đề, compass mark, đường bờ biển và bố cục bất đối xứng. Đây là đề xuất FE, chưa được UI/UX phê duyệt.

## Chạy trên máy của bạn
```bash
npm ci
npm run dev
```
Mở `http://localhost:3000`. UI public và Dashboard preview chạy được khi chưa có Supabase.

| Màn hình | Đường dẫn | Hành vi |
|---|---|---|
| Landing | `/` | CTA dẫn tới Auth, Chat, Dashboard preview |
| Đăng nhập | `/login` | Server Action BE1; cần config thật |
| Đăng ký | `/register` | Vai trò Merchant/Reseller, validation, email confirmation |
| Chatbot | `/chat` | Không attribution: preview có nhãn; đủ attribution: API thật |
| Dashboard preview | `/preview/merchant` | Public, chỉ dữ liệu giả lập, không quyền truy cập DB |
| Dashboard Merchant | `/merchant` | Auth gate hiện có; UI vẫn dùng fixtures có nhãn |

## Cấu hình env.text
Đã đọc `env.text`: chỉ có placeholder, hướng dẫn đổi thành `.env.local`. Không copy nguyên cả văn bản hướng dẫn vào dotenv.
1. Copy `.env.example` thành `.env.local` (PowerShell: `Copy-Item .env.example .env.local`).
2. Nhận `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` từ BE1/Supabase Connect. Legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` được hỗ trợ nếu chưa có publishable key.
3. Không dùng service-role key cho biến `NEXT_PUBLIC_*`.
4. `.env.local` đã gitignore. Không commit credential. Restart dev server hoặc rebuild sau khi đổi env.
5. BE2 cấu hình server secrets cho `/api/chat` theo backend hiện có; FE không tự tạo key, DB hay migrations.

Thiếu env: public UI vẫn render; Auth submit bị vô hiệu hóa, `/merchant` chuyển về login. Cơ chế này không bỏ auth gate. Dữ liệu thật chưa được truy xuất trong Dashboard.

## Chat contract
`/chat?reseller_id=<UUID>&campaign_id=<UUID>&product_id=<UUID>`.
- Chỉ khi đủ 3 UUID mới gọi `POST /api/chat`.
- Body `{ message, conversation_history, attribution_context }`; history tối đa 12 tin, message tối đa 2.000 ký tự.
- Response `{ reply, suggested_checkout_url }`; chỉ hiện URL HTTPS, backend vẫn là nơi xác minh URL chính thức.
- Khi lỗi: giữ câu hỏi trong ô nhập, không để tin lỗi trong history; có thể gửi lại. Timeout 45 giây, abort khi unmount.
- Preview không gọi model, không bịa giá/chính sách. Fixtures Dashboard không đi vào API.

## Quyền sở hữu và file thay đổi
**Created:** app/(auth)/, app/chat/page.tsx, app/merchant/page.tsx, app/preview/merchant/page.tsx; src/components/{ui,auth,chat,merchant}, Brand/Header; src/lib/{utils,auth-validation,merchant-demo}.ts; src/lib/supabase/config.ts; public/coast.svg; components.json; .env.example; tests/frontend.spec.ts; playwright.config.ts; FE_W1 và TEAM_WORK_LOG.

**Modified:** app/page.tsx, layout.tsx, globals.css; app/actions/auth.ts (validation, lỗi có kiểm soát, safe redirect); Supabase client/server/middleware (config shared + public UI fallback, protected portal vẫn đóng); package files; .gitignore (loại ký tự NUL cũ, thêm test artifacts).

**Không có file bị xóa.** API Chat/embeddings, DB/RLS, n8n giữ nguyên. Thay đổi trong Auth/config cần BE1 review.

`components.json` ánh xạ UI tới `src/components/ui`. Lệnh shadcn init thất bại do kết nối registry bị chặn. Button/Input được triển khai cục bộ theo cấu trúc shadcn (Radix Slot/CVA/cn); không tuyên bố CLI đã cài thành công. Team có thể so sánh với registry trước khi chuẩn hóa UI Kit.

## Kiểm tra thực tế — 08/10/2026
- `npm run build`: PASS, bao gồm TypeScript.
- `npm run lint`: 0 error; 2 warning có sẵn ở middleware helper (`supabase`, `options` không dùng).
- HTTP: các trang public trả 200; `/merchant` thiếu auth trả 307 tới `/login?next=...`.
- Playwright: **15/15 PASS**, 5 nhóm kiểm tra trên 1440×1000, 390×844, 320×740.
- Không tràn document theo chiều ngang; bảng sản phẩm có vùng cuộn riêng.
- Kiểm tra không có pageerror; tìm/lọc Dashboard; loading/error/retry/empty; Auth input validation và visibility; chat preview không gọi API; giữ attribution khi gọi API giả lập; retry không nhân history; loại checkout `javascript:`.
- Đã xem ảnh chụp desktop và mobile; sửa overflow Landing/table và tương phản phần chữ trên minh họa Auth.
- Môi trường kiểm thử Chromium headless; mock Chat không chứng minh RAG/backend thật hoạt động.

Chạy lại:
```bash
npm run build
npx playwright install chromium
npm run test:ui
```
Suite trên mặc định yêu cầu môi trường không cấu hình Supabase vì có test auth submit disabled. Chạy ở checkout sạch, không copy `.env.local` thật khi chạy suite này. `PLAYWRIGHT_CHROMIUM_PATH` là override tùy chọn cho môi trường QA có Chromium riêng.

**Chưa kiểm chứng:** sign-up/login/logout/email/session thật, role authorization, RAG/checkout thật, Safari/Firefox, Vercel staging, QA/PM acceptance. Không đánh dấu E2E hoàn tất.

## Git và nộp bài
- Base: dev tại d435a55; branch `Feature_FE_W1_UI_Foundation`.
- PR base bắt buộc `dev`. BE1 schema đã có trên base; không chỉnh migration.
- Bản nguồn này chỉ làm FE tuần 1; xem FE_W1 để biết blockers/conflicts/dependencies.
- File nộp: `.ai/process/Week1/FE_W1.md`, kèm `TEAM_WORK_LOG.md`, source và link PR.
- Hạn: 09/10/2026 12:00 giờ Việt Nam; review/QA buổi chiều theo weekly plan.
- Sau approve, team merge dev và xóa branch; PM quản lý release main.
- Trạng thái Git sẽ được cập nhật bên dưới sau khi thử bàn giao.

## Ảnh giao diện
Ảnh tại `screenshots/`: landing/login/register/chat/dashboard desktop và mobile. Chúng là bằng chứng giao diện của bản build local, không phải số liệu kinh doanh thật.

### Trạng thái bàn giao Git
- Đã commit source trên `Feature_FE_W1_UI_Foundation` (commit implementation `70d3abb`).
- Push đã thử nhưng thất bại: phiên làm việc chưa có xác thực GitHub HTTPS. Chưa có remote branch, PR hoặc merge được tạo bởi lần làm việc này.
- `FE_W1.bundle` kèm source ZIP là cách chuyển nguyên nhánh sang máy có quyền GitHub. Bundle chỉ chứa commit mới sau base dev, cần fetch repo gốc trước.

Trong repo trên máy bạn (đặt bundle vào thư mục Downloads, chỉnh đường dẫn đúng):
```bash
git fetch origin dev
git fetch /path/to/FE_W1.bundle Feature_FE_W1_UI_Foundation:Feature_FE_W1_UI_Foundation
git switch Feature_FE_W1_UI_Foundation
npm ci
npm run dev
git push -u origin Feature_FE_W1_UI_Foundation
```
Sau đó mở GitHub tạo PR `Feature_FE_W1_UI_Foundation` → `dev`, dùng nội dung `docs/fe-w1/PR_DESCRIPTION.md`. Không ghi đè nhánh đang có thay đổi chưa commit trên máy bạn.
