# LỘ TRÌNH 4 TUẦN (MASTER ROADMAP) - AI TRAVEL RESELLER MVP

## 1. TỔNG QUAN DỰ ÁN VÀ ĐỘI NGŨ
* **Mục tiêu MVP:** Chứng minh chuỗi giá trị: `Merchant (Tạo Product)` → `AI Content Factory` → `Reseller (Phân phối)` → `Customer (Tương tác)` → `AI Sales Agent` → `Official Checkout` → `Ghi nhận Hoa hồng`.
* **Hạ tầng công nghệ:** Supabase (DB & Auth), Next.js (FE App & PWA - Progressive Web App), n8n (Automation Workflows), LLM/pgvector (AI Engine), PostHog (Tracking).
* **Cơ cấu đội ngũ (9 thành viên):**
  * **Nghiệp vụ (Product):** 1 Business Analyst (BA Lead / Product Requirements).
  * **Frontend & Design:** 1 UI/UX Designer, 1 Frontend Developer chính (FE Lead), 1 FE phụ/Trainee (Tester 3 tạm thời chuyển sang hỗ trợ FE với các task tĩnh cô lập).
  * **Backend Team:** BE1 (Supabase/Core DB kiêm Trưởng nhóm kỹ thuật / Điều phối PM), BE2 (AI Agent/RAG & Multimodal), BE3 (n8n Automation/Tracking).
  * **QA Team:** Tester 1 (QA Lead & Hybrid Test), Tester 2 (AI Safety & Prompt QA).

---

## 2. LỘ TRÌNH CHI TIẾT THEO TUẦN (WEEKLY MILESTONES)

### Tuần 1: FOUNDATION & DATA STRUCTURE (Nền tảng & Cấu trúc dữ liệu)
* **Mục tiêu (Focus):** Xây dựng xương sống dữ liệu, thiết lập môi trường và ráp khung giao diện tĩnh.
* **Deliverables (Kết quả đầu ra):**
  * Cơ sở dữ liệu (Schema) cho Merchant, Product, Campaign đã chạy trên Supabase.
  * Tích hợp Supabase Auth (Đăng nhập/Đăng ký).
  * Giao diện tĩnh (Dumb UI) bằng Next.js + shadcn/ui cho Merchant Portal.
  * Khởi tạo môi trường pgvector (cho BE2) và n8n (cho BE3).
* **Phân công trọng tâm:**
  * **BE1:** Cấu hình DB Schema và policies bảo mật RLS.
  * **FE + Tester 1:** Dựng form UI và ghép các component tĩnh (Tester 1 hỗ trợ cắt HTML/CSS/Mock Data).
  * **UI/UX:** Handoff Wireframe form nhập liệu cho Merchant.

### Tuần 2: AI CONTENT FACTORY & DISTRIBUTION (Sinh nội dung & Phân phối)
* **Mục tiêu (Focus):** AI tự động đọc dữ liệu sản phẩm để sinh bài đăng, Reseller có thể copy bài kèm Link tiếp thị.
* **Deliverables (Kết quả đầu ra):**
  * Workflow n8n: Tự động gọi LLM API sinh Text (Hooks, Scripts, Captions) khi Merchant tạo xong Campaign.
  * Giao diện Reseller Feed: Hiển thị danh sách chiến dịch và bài đăng do AI gợi ý.
  * Hệ thống Tracking Link: BE sinh API tạo link định danh `[reseller_id] + [campaign_id]`.
* **Phân công trọng tâm:**
  * **BE3:** Hoàn thiện luồng n8n sinh content đẩy vào Database.
  * **BE1:** Xây dựng Edge Function cấp Tracking Link.
  * **FE:** Tích hợp dữ liệu thật hiển thị lên bảng tin (Feed) của Reseller.

### Tuần 3: COMMERCE FLOW, AI SALES AGENT, PWA & MERCHANT VIDEO GENERATION (Thương mại, Bot chốt sale, PWA & Tạo Video AI)
* **Mục tiêu (Focus):** Bắt sự kiện click của khách hàng, triển khai AI Chatbot tư vấn (RAG), nâng cấp trải nghiệm Mobile PWA cho Reseller & Khách hàng, đồng thời kích hoạt tính năng Merchant tải lên Video mẫu để AI tự động nhân bản video chiến dịch.
* **Deliverables (Kết quả đầu ra):**
  * Tracking System: Ghi nhận lượt Click và Lead đẩy về Supabase/PostHog.
  * AI Sales Agent: Giao diện Chatbot + API truy xuất kiến thức (pgvector). AI biết trả lời giá vé, giờ mở cửa và cấp link thanh toán của Merchant.
  * Commission Logic: Hàm tính toán tiền hoa hồng (Platform, Merchant, Reseller) khi có đơn hàng thành công.
  * **PWA Mobile Suite (Reseller & Khách hàng):**
    * Cấu hình PWA (`manifest.json`, icon app, meta tags, Service Worker cơ bản) cho phép "Thêm vào màn hình chính" (Add to Home Screen) chạy Standalone toàn màn hình.
    * Giao diện Reseller Mobile-First: Bottom Navigation Bar, thao tác cảm ứng chạm vuốt, nút chia sẻ nhanh 1-chạm (Web Share API sang Zalo, Facebook, TikTok), tải banner kèm QR cá nhân vào thư viện ảnh.
    * Giao diện Khách hàng Mobile-First: Mở trực tiếp từ link `/r/[code]` trong trình duyệt nhúng (In-App Browser của TikTok, FB, Zalo) không cần cài app, khung chat AI Sales Agent dạng Bottom Sheet / Floating Widget toàn màn hình.
  * **Merchant Video Library & AI Video Generation Engine:**
    * Merchant có thể tải lên/nhập liên kết video mẫu yêu thích, lưu trữ vào Thư viện mẫu (`media_library`).
    * AI Multimodal phân tích phong cách/kịch bản video mẫu và tự động sinh video tương tự dựa trên thông tin sản phẩm và chiến dịch của Merchant.
  * **Quy chuẩn Demo/Báo cáo Mobile khi chưa deploy:**
    * *Phương án chính (C3):* Sử dụng Cloudflared HTTPS Tunnel (`npx cloudflared tunnel --url http://localhost:3000`) để demo trực tiếp tính năng PWA cài đặt trên điện thoại thật.
    * *Phương án dự phòng (C1):* Sử dụng Chrome DevTools Device Emulation (`F12` -> `Ctrl+Shift+M` -> *Show device frame*) để mô phỏng hoàn chỉnh khung viền điện thoại ngay trên laptop khi báo cáo offline.
* **Phân công trọng tâm:**
  * **BE2:** Viết System Prompt chặt chẽ cho AI Sales Agent; xây dựng prompt Multimodal trích xuất kịch bản và visual scenes từ video mẫu.
  * **BE3:** Workflow n8n tích hợp pipeline sinh video / tự động hóa video AI theo kịch bản và dữ liệu sản phẩm.
  * **FE Lead:** Ghép UI khung Chatbot, triển khai PWA (`manifest.json`, Service Worker, Bottom Nav, Web Share API), tích hợp API Video Library.
  * **Tester 3 (FE phụ):** Cắt giao diện tĩnh Dumb UI cho các thẻ hiển thị video mẫu trong thư viện và trang hướng dẫn tĩnh (cách ly hoàn toàn khỏi core).
  * **UI/UX:** Thiết kế UI/UX Mobile cho Reseller & Khách hàng; thiết kế giao diện Media Library cho Merchant.
  * **BE1:** Thiết kế bảng `orders`, `commissions`, bảng `media_references` và API upload/lưu video library.
  * **Tester 2:** Ép AI Sales Agent chống Hallucination và kiểm thử chất lượng kịch bản video AI.
  * **Tester 1:** Phụ trách QA toàn diện hệ thống, kiểm thử tương thích PWA, viewport mobile và kịch bản demo C1, C3.

### Tuần 4: UAT, INTEGRATION & RELEASE (Kiểm thử cuối & Phát hành)
* **Mục tiêu (Focus):** Đảm bảo luồng End-to-End (E2E) chạy mượt mà trên cả Desktop lẫn Mobile PWA, bao gồm cả luồng sinh video AI và tính hoa hồng.
* **Deliverables (Kết quả đầu ra):**
  * Chạy thông luồng: *Tạo Campaign kèm Video mẫu -> AI sinh Content & Video -> Reseller dùng Mobile PWA copy link/share -> Khách hàng mở Mobile Web Click -> Chat với AI -> Redirect Checkout -> Tính Hoa hồng.*
  * Fix 100% các lỗi High/Critical.
  * Live trên môi trường Production (Vercel & Supabase).
* **Phân công trọng tâm:**
  * **Tester 1, 2:** Chạy Regression Test toàn hệ thống trên cả Desktop và Mobile PWA, test chống gian lận (Anti-fraud: Tự click link của chính mình, tự spam chat).
  * **Team Dev (FE Lead, Tester 3, BE1, BE2, BE3):** Trực chiến fix bug theo ticket.
  * **PM:** Bấm nút nghiệm thu (Go/No-go).

---

## 3. NGUYÊN TẮC RÀNG BUỘC CHO HỆ THỐNG AI PHÂN TÍCH TASK (AI PROMPT INSTRUCTIONS)
*(Ghi chú này dành cho các công cụ AI đọc file này để phân rã Task trên Jira/Linear)*
1. **Quy tắc Dependency:** Task thiết kế Database của BE1 là "Gốc". Không khởi tạo task API cho BE2, BE3 nếu BE1 chưa hoàn thành DB Schema. UI/UX task bắt buộc phải là tiền đề của FE task.
2. **Quy tắc Nguồn lực (FE Bottleneck):** Trong Tuần 1 và Tuần 2, các Task dựng UI HTML/CSS tĩnh hoặc tạo JSON Mock Data có thể được gán cho `Tester 1` dưới dạng Sub-task. Next.js Server Components, Server Actions có thể được gán chéo cho `BE1` hoặc `BE2` để giảm tải cho FE.
3. **Quy tắc Cắt Scope (Out of Scope MVP):** Bỏ qua mọi task liên quan đến: Admin UI Dashboard phức tạp (dùng DB GUI thay thế), Livestream, Native Mobile App (iOS Swift / Android Kotlin riêng biệt — đã thay bằng Mobile-First PWA).
4. **Quy tắc Kiểm soát An toàn khi Tester 3 chuyển sang FE (Strict Safety Guardrail):**
   * *Nguyên tắc cô lập rủi ro:* Do Tester 3 kỹ năng FE và AI còn yếu, từng gây lỗi cấu trúc hệ thống, nên **tuyệt đối KHÔNG** phân công Tester 3 can thiệp vào các tệp/phân hệ Core: App Router gốc (`app/layout.tsx`, `app/page.tsx`), các file cấu hình hệ thống (`playwright.config.ts`, `next.config.mjs`, `globals.css`), Supabase Auth/Client, Edge Route Tracking (`app/r/[code]`), hoặc các API routes.
   * *Giới hạn phạm vi công việc:* Chỉ giao các công việc cô lập, độc lập (Dumb UI component, hiển thị tĩnh, nhận props có sẵn, mock data, trang hướng dẫn FAQ tĩnh). Khối lượng task ít, không tạo áp lực và không làm chặn đường gantt của thành viên khác.
   * *Quy chế phê duyệt:* 100% mã nguồn do Tester 3 thực hiện phải được tạo trên nhánh riêng biệt, vượt qua typecheck và bắt buộc có sự phê duyệt (Approve) từ FE Lead hoặc PM/BE1 trước khi gộp vào `dev`. Cấm tự ý merge.