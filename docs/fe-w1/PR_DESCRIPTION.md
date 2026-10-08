## Vì sao cần thay đổi
Repo dev hiện chỉ có trang mặc định Next.js trong khi Auth và Chat backend đã có. FE tuần 1 cần các màn hình để UI/UX, BE và Tester 1 cùng review, tránh tự tạo thêm Auth/API trùng lặp.

## Thay đổi
- Landing, Login/Register, Chatbot và Dashboard Merchant responsive, tiếng Việt.
- Tái sử dụng Auth Server Actions và POST /api/chat; bổ sung validation, safe redirect, timeout/error/retry và attribution.
- Preview Dashboard công khai chỉ dùng fixtures có nhãn; portal Merchant vẫn yêu cầu login.
- Hỗ trợ ANON_KEY/PUBLISHABLE_KEY theo env.text/code hiện tại; thiếu env không làm sập public UI.
- Task registry FE_W1, TEAM_WORK_LOG, hướng dẫn chạy và ảnh chụp.

## Validation
Production build/TypeScript pass; ESLint 0 error, 2 warning cũ; 15/15 Playwright tests pass ở 320/390/1440px. Chat dùng API mock trong test. Auth/AI thật, Vercel và role authorization chưa được xác nhận.

## Review cần thiết
BE1: Auth/config/middleware; UI/UX: design system và actor Dashboard; Tester 1: responsive/forms; BE2: chat attribution/contract. Cần môi trường thật và tài khoản test trước nghiệm thu E2E.

## Phạm vi và giới hạn
Không thay DB/RLS, pipeline AI/n8n; chưa có CRUD/KPI thật. shadcn registry bị chặn, primitive local cần UI Kit review. Các conflict với Weekly Plan/PRD/Roadmap đã ghi FE_W1.

Base branch: dev. Không merge main từ PR này.
