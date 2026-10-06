\# AI AGENT DEVELOPMENT RULEBOOK / PROJECT CODING GUIDE



Tài liệu này là nguồn sự thật (Single Source of Truth) dành cho mọi hoạt động lập trình của AI Agent trên dự án \*\*AI-powered Travel Distribution \& Commerce Platform\*\*. AI Agent MUST tuân thủ tuyệt đối các quy tắc trong tài liệu này trước, trong và sau khi viết code.



\---



\## 1. PROJECT OVERVIEW



\*   \*\*Project Name:\*\* AI Travel Reseller Network Platform\[cite: 3].

\*   \*\*Project Purpose:\*\* Xây dựng một mạng lưới phân phối và bán hàng kỹ thuật số ứng dụng AI dành cho các doanh nghiệp du lịch\[cite: 3].

\*   \*\*Problem Being Solved:\*\* Giải quyết vấn đề thiếu kênh phân phối, chi phí sản xuất nội dung cao, tỷ lệ chuyển đổi bán hàng thấp và vấn đề niềm tin của khách hàng khi giao dịch qua mạng xã hội\[cite: 3].

\*   \*\*Target Users:\*\* Khách du lịch tại Đà Nẵng / Hội An, Việt Nam (MVP)\[cite: 3].

\*   \*\*Scope (MVP):\*\* 

&#x20;   \*   Merchant Portal (quản lý sản phẩm, chiến dịch, hoa hồng)\[cite: 3].

&#x20;   \*   AI Content Factory (tạo kịch bản, video, nội dung)\[cite: 3].

&#x20;   \*   Reseller Portal (chọn nội dung, lấy link tracking, xem hoa hồng)\[cite: 3].

&#x20;   \*   AI Sales Agent (tư vấn khách hàng và chốt sales qua link chính thức)\[cite: 3].

\*   \*\*Out of Scope (MUST NOT BUILD IN MVP):\*\* AI livestream, 24/7 autonomous avatar, native mobile apps, travel marketplace, payment wallet, complex booking engine\[cite: 3].



\### 1.1 Actors \& Quyền hạn

AI Agent không được tự ý tạo thêm Actor ngoài danh sách sau:

1\.  \*\*Merchant (Doanh nghiệp du lịch):\*\* Cung cấp sản phẩm, giá cả, kho hàng, URL thanh toán chính thức, thiết lập hoa hồng\[cite: 3].

2\.  \*\*Reseller (Cộng tác viên/Người phân phối):\*\* Sở hữu tài khoản mạng xã hội (TikTok, Facebook), đăng tải nội dung do AI tạo, nhận hoa hồng\[cite: 3].

3\.  \*\*Customer (Khách hàng):\*\* Xem nội dung, chat với AI Sales Agent, thanh toán trực tiếp trên trang của Merchant\[cite: 3].

4\.  \*\*Platform Admin (Quản trị viên):\*\* Quản lý Merchant, Reseller, duyệt nội dung, theo dõi giao dịch và hoa hồng\[cite: 3].



\### 1.2 Core Business Rules

\*   \*\*Thanh toán:\*\* Nền tảng KHÔNG giữ tiền của khách hàng trong giai đoạn MVP. Mọi thanh toán phải được điều hướng trực tiếp đến trang checkout chính thức của Merchant\[cite: 3].

\*   \*\*AI Safety Data:\*\* AI Sales Agent CHỈ được phép sử dụng dữ liệu đã được Merchant duyệt. TUYỆT ĐỐI KHÔNG tự bịa ra giá, khuyến mãi, số lượng vé, hoặc giả mạo là Merchant\[cite: 3].

\*   \*\*Publishing Workflow:\*\* Việc đăng bài lên mạng xã hội là "semi-automatic" (Reseller tự tải video và copy caption để đăng), nền tảng KHÔNG tự động post qua API mạng xã hội trong MVP\[cite: 3].

\*   \*\*Attribution (Ghi nhận hoa hồng):\*\* Ghi nhận thông qua Tracking link hoặc Unique Voucher Code\[cite: 3].



\---



\## 2. TECHNOLOGY STACK

AI Agent MUST sử dụng các công nghệ sau\[cite: 3]:

\*   \*\*Frontend:\*\* Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui.

\*   \*\*Backend \& DB:\*\* Supabase, PostgreSQL.

\*   \*\*AI \& Logic:\*\* LLM API, Image/Video generation API, TTS.

\*   \*\*Infrastructure:\*\* Vercel (Deployment), n8n (Automation), PostHog (Analytics).



\---



\## 3. FOLDER STRUCTURE \& RESPONSIBILITIES

Kiến trúc dự án tuân thủ Next.js App Router kết hợp Backend-as-a-Service (Supabase). AI Agent MUST NOT áp dụng các kiến trúc ngoại lai (như Clean Architecture, CQRS truyền thống với C#) vào cấu trúc này.



| Folder / File | Purpose | Allowed Content | Forbidden Content |

| :--- | :--- | :--- | :--- |

| `supabase/migrations/` | Chứa script thay đổi schema DB. | Các file SQL DDL (Create, Alter). | Logic code, ứng dụng. |

| `src/app/(auth)/` | Giao diện và logic Đăng nhập/Đăng ký\[cite: 2]. | Layout, Pages cho Login, Register. | Chức năng của admin/merchant. |

| `src/app/api/` | API backend nội bộ, webhook, gọi LLM\[cite: 2]. | Next.js Route Handlers (`route.ts`). | Giao diện React Components. |

| `src/app/merchant/` | Portal dành riêng cho Merchant\[cite: 2]. | Pages quản lý sản phẩm, chiến dịch. | Logic hiển thị của Reseller. |

| `src/app/reseller/` | Portal dành riêng cho Reseller\[cite: 2]. | Pages thư viện nội dung, link tracking. | Tính năng duyệt của Admin. |

| `src/app/admin/` | Portal quản trị hệ thống\[cite: 2]. | Bảng điều khiển quản lý tổng quát. | Client-side routing cho user thường. |

| `src/components/ui/` | Chứa các UI tái sử dụng tạo bởi shadcn/ui\[cite: 2]. | Button, Input, Card, Modal... | Business logic, Data fetching. |

| `src/lib/supabase/` | Cấu hình Supabase client\[cite: 2]. | Browser client, Server client logic. | API Routes, UI Components. |

| `src/lib/ai-services.ts` | Wrapper kết nối các LLM, TTS APIs\[cite: 2]. | Functions gọi OpenAI, Anthropic, TTS. | UI components, Database queries trực tiếp. |

| `src/lib/database.types.ts` | Type định nghĩa cấu trúc DB\[cite: 2]. | Auto-generated TypeScript types. | Function logic. |



\---



\## 4. FILE PLACEMENT RULES

Khi cần tạo file mới, hãy làm theo quy tắc sau:



\*   \*\*IF creating a new Page/View:\*\*

&#x20;   \*   Cho Merchant: `→ src/app/merchant/\[feature\_name]/page.tsx`

&#x20;   \*   Cho Reseller: `→ src/app/reseller/\[feature\_name]/page.tsx`

&#x20;   \*   Cho Admin: `→ src/app/admin/\[feature\_name]/page.tsx`

\*   \*\*IF creating a Backend API Endpoint:\*\*

&#x20;   \*   `→ src/app/api/\[feature\_name]/route.ts`

\*   \*\*IF creating a Reusable UI Element (e.g., a specific button/dialog):\*\*

&#x20;   \*   `→ src/components/ui/\[component-name].tsx` (Ưu tiên dùng shadcn CLI nếu có thể).

\*   \*\*IF creating a Utility Function or Service Wrapper:\*\*

&#x20;   \*   Về AI: `→ src/lib/ai-services.ts` (hoặc tạo file mới trong `src/lib/` nếu file quá lớn).

&#x20;   \*   Về logic chung: `→ src/lib/utils.ts`.

\*   \*\*IF updating Database Schema:\*\*

&#x20;   \*   `→ supabase/migrations/\[timestamp]\_\[description].sql`



\---



\## 5. DEPENDENCY RULES

Quy tắc gọi chéo giữa các module trong hệ thống:



| Từ Thành Phần (From) | Được Phép Gọi (Can Depend On) | Không Được Gọi (Should Not Depend On) |

| :--- | :--- | :--- |

| `src/app/.../page.tsx` (Client/Server Comps) | `src/components/ui/`, `src/lib/`, `src/app/api/` (via fetch) | Trực tiếp DB SQL Query, Native Node modules (nếu là Client Component). |

| `src/app/api/.../route.ts` (API Routes) | `src/lib/supabase/`, `src/lib/ai-services.ts` | `src/components/`, DOM APIs. |

| `src/components/ui/` | Các thư viện UI gốc (Radix, Lucide), `tailwind-merge` | `src/app/api/`, Business logic phức tạp. |



\---



\## 6. NAMING CONVENTIONS

\*   \*\*Folders / Directories:\*\* `kebab-case` (VD: `campaign-management`, `ai-services`).

\*   \*\*React Components / Pages:\*\* `PascalCase` cho tên Function Component (VD: `export default function MerchantDashboard()`).

\*   \*\*API Routes:\*\* Bắt buộc đặt tên file là `route.ts`.

\*   \*\*Utility Functions / Variables:\*\* `camelCase` (VD: `generateAiContent`, `fetchMerchantData`).

\*   \*\*Database Tables:\*\* `snake\_case`, số nhiều (VD: `merchants`, `tracking\_events`, `social\_accounts`)\[cite: 3].

\*   \*\*TypeScript Types/Interfaces:\*\* `PascalCase` (VD: `Product`, `Campaign`).



\---



\## 7. FEATURE IMPLEMENTATION WORKFLOW

AI Agent MUST thực hiện tuần tự 6 bước sau khi nhận task:



1\.  \*\*Step 1 — Understand:\*\* Xác định Actor yêu cầu là ai? Business rules nào chi phối (ví dụ: cấm sửa thông tin thanh toán của merchant)?

2\.  \*\*Step 2 — Inspect:\*\* Đọc codebase hiện tại. Kiểm tra xem Component shadcn tương ứng đã có trong `src/components/ui/` chưa. Xem `database.types.ts` có chứa bảng dữ liệu cần dùng chưa.

3\.  \*\*Step 3 — Plan:\*\* Lên danh sách file sẽ tạo mới (`Created`), file sẽ sửa (`Modified`), file sẽ xóa (`Deleted`).

4\.  \*\*Step 4 — Implement:\*\* Viết code tuân thủ Folder Structure và PRD.

5\.  \*\*Step 5 — Validate:\*\* Kiểm tra import paths, type errors, biến môi trường, và API contracts.

6\.  \*\*Step 6 — Report:\*\* Trả về báo cáo theo chuẩn (xem mục 11).



\---



\## 8. RULES FOR MODIFYING EXISTING CODE

\*   \*\*Đọc trước khi sửa:\*\* MUST inspect (xem nội dung) file hiện tại trước khi thực hiện ghi đè.

\*   \*\*Minimal changes:\*\* Chỉ thay đổi các dòng code liên quan trực tiếp đến Task.

\*   \*\*Giữ nguyên Architecture:\*\* KHÔNG ĐƯỢC tự ý tái cấu trúc dự án sang mô hình như Services/Repositories C# vì dự án đang dùng Next.js App Router (Server Actions/API Routes + Supabase Client).



\---



\## 9. DATABASE \& API RULES

\*   \*\*Database:\*\*

&#x20;   \*   Bảng phải dựa trên schema đã định nghĩa (merchants, products, resellers, campaigns, contents, orders, tracking\_events, social\_accounts)\[cite: 3].

&#x20;   \*   Truy xuất dữ liệu sử dụng thư viện Supabase JS Client được setup sẵn trong `src/lib/supabase/`\[cite: 2].

&#x20;   \*   Mọi thay đổi cấu trúc DB phải tạo file `.sql` mới trong `supabase/migrations/`\[cite: 2].

\*   \*\*API Routes:\*\*

&#x20;   \*   Sử dụng chuẩn Web API của Next.js Route Handlers (`export async function GET(request: Request)`, `POST`, v.v.).

&#x20;   \*   Luôn xử lý Authentication qua Supabase Auth trước khi cho phép thay đổi dữ liệu nội bộ.



\---



\## 10. PROHIBITED ACTIONS (CÁC HÀNH ĐỘNG BỊ CẤM)

AI Agent \*\*MUST NOT\*\* thực hiện các hành động sau:

1\.  \*\*DO NOT\*\* tự ý thay đổi Folder Structure (ví dụ: tạo thư mục `Controllers`, `Models` ở root)\[cite: 2].

2\.  \*\*DO NOT\*\* tự ý bịa ra các thông tin quan trọng của Merchant (Giá, Giờ mở cửa, Kho hàng) khi tạo logic cho AI Agent\[cite: 3].

3\.  \*\*DO NOT\*\* xây dựng tính năng thanh toán nội bộ (Payment wallet). Luôn dùng URL checkout chính thức của Merchant\[cite: 3].

4\.  \*\*DO NOT\*\* triển khai tự động đăng bài mạng xã hội (Auto-posting) trong giai đoạn này. Quy trình phải là Semi-automatic\[cite: 3].

5\.  \*\*DO NOT\*\* hard-code các khóa bí mật (API Keys, Supabase Service Key, JWT Secret). Luôn lấy từ biến môi trường (`process.env.XXX`).

6\.  \*\*DO NOT\*\* tự ý xóa code chức năng đang hoạt động nếu không có trong phạm vi task.



\---



\## 11. TASK EXECUTION TEMPLATE

Mỗi khi hoàn thành một yêu cầu sinh code, AI Agent MUST trả về kết quả theo định dạng sau:



```text

\*\*TASK REPORT:\*\*

\- \*\*UNDERSTANDING:\*\* \[Tóm tắt công việc cần làm]

\- \*\*AFFECTED MODULE/ACTOR:\*\* \[VD: Merchant / Product Management]

\- \*\*IMPLEMENTATION DETAILS:\*\*

&#x20; - `Created`: \[Danh sách file tạo mới kèm đường dẫn chuẩn]

&#x20; - `Modified`: \[Danh sách file bị sửa]

\- \*\*BUSINESS RULES APPLIED:\*\* \[Luật áp dụng từ PRD, ví dụ: AI không bịa giá]

\- \*\*VALIDATION:\*\* \[Self-check về import, type, dependency]

