# LỘ TRÌNH 4 TUẦN (MASTER ROADMAP) - AI TRAVEL RESELLER MVP

## 1. TỔNG QUAN DỰ ÁN VÀ ĐỘI NGŨ
* **Mục tiêu MVP:** Chứng minh chuỗi giá trị: `Merchant (Tạo Product)` → `AI Content Factory` → `Reseller (Phân phối)` → `Customer (Tương tác)` → `AI Sales Agent` → `Official Checkout` → `Ghi nhận Hoa hồng`.
* **Hạ tầng công nghệ:** Supabase (DB & Auth), Next.js (FE App), n8n (Automation Workflows), LLM/pgvector (AI Engine), PostHog (Tracking).
* **Cơ cấu đội ngũ (9 thành viên):**
  * **Frontend & Design:** 1 UI/UX, 1 Frontend Developer (FE).
  * **Backend Team:** BE1 (Supabase/Core DB), BE2 (AI Agent/RAG), BE3 (n8n Automation/Tracking).
  * **QA Team:** Tester 1 (Hybrid: Hỗ trợ FE 2 tuần đầu), Tester 2 (AI Safety), Tester 3 (System/Commission Tracking).

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

### Tuần 3: COMMERCE FLOW & AI SALES AGENT (Thương mại & Bot chốt sale)
* **Mục tiêu (Focus):** Bắt sự kiện click của khách hàng và triển khai AI Chatbot tư vấn dựa trên tài liệu (RAG).
* **Deliverables (Kết quả đầu ra):**
  * Tracking System: Ghi nhận lượt Click và Lead đẩy về Supabase/PostHog.
  * AI Sales Agent: Giao diện Chatbot + API truy xuất kiến thức (pgvector). AI biết trả lời giá vé, giờ mở cửa và cấp link thanh toán của Merchant.
  * Commission Logic: Hàm tính toán tiền hoa hồng (Platform, Merchant, Reseller) khi có đơn hàng thành công.
* **Phân công trọng tâm:**
  * **BE2:** Viết System Prompt chặt chẽ, tối ưu thuật toán tìm kiếm RAG.
  * **FE:** Ghép UI khung Chatbot mô phỏng Messenger/Widget.
  * **Tester 2:** Ép AI bằng các bài test cực đoan (Hallucination test - dụ AI bịa giá vé, tự cấp mã giảm giá ảo).

### Tuần 4: UAT, INTEGRATION & RELEASE (Kiểm thử cuối & Phát hành)
* **Mục tiêu (Focus):** Đảm bảo luồng End-to-End (E2E) chạy mượt mà, không gián đoạn, không lỗi nghiêm trọng.
* **Deliverables (Kết quả đầu ra):**
  * Chạy thông luồng: *Tạo Campaign -> AI sinh Content -> Reseller Copy link -> Khách hàng Click -> Chat với AI -> Redirect Checkout -> Tính Hoa hồng.*
  * Fix 100% các lỗi High/Critical.
  * Live trên môi trường Production (Vercel & Supabase).
* **Phân công trọng tâm:**
  * **Tester 1, 2, 3:** Chạy Regression Test toàn hệ thống, test chống gian lận (Anti-fraud: Tự click link của chính mình, tự spam chat).
  * **Team Dev (FE, BE1, BE2, BE3):** Trực chiến fix bug theo ticket.
  * **PM:** Bấm nút nghiệm thu (Go/No-go).

---

## 3. NGUYÊN TẮC RÀNG BUỘC CHO HỆ THỐNG AI PHÂN TÍCH TASK (AI PROMPT INSTRUCTIONS)
*(Ghi chú này dành cho các công cụ AI đọc file này để phân rã Task trên Jira/Linear)*
1. **Quy tắc Dependency:** Task thiết kế Database của BE1 là "Gốc". Không khởi tạo task API cho BE2, BE3 nếu BE1 chưa hoàn thành DB Schema. UI/UX task bắt buộc phải là tiền đề của FE task.
2. **Quy tắc Nguồn lực (FE Bottleneck):** Trong Tuần 1 và Tuần 2, các Task dựng UI HTML/CSS tĩnh hoặc tạo JSON Mock Data có thể được gán cho `Tester 1` dưới dạng Sub-task. Next.js Server Components, Server Actions có thể được gán chéo cho `BE1` hoặc `BE2` để giảm tải cho FE.
3. **Quy tắc Cắt Scope (Out of Scope MVP):** Bỏ qua mọi task liên quan đến: AI Video Generation, Admin UI Dashboard (dùng DB GUI thay thế), Livestream, Mobile App.