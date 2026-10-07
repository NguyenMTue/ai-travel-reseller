# ARCHITECTURE & SYSTEM DATA FLOW

Tài liệu này mô tả bức tranh tổng thể về kiến trúc hạ tầng và luồng dịch chuyển dữ liệu của dự án AI Travel Reseller Platform. Mục đích là để chuẩn hóa cách các module giao tiếp với nhau, giúp AI Agent và team member mới nắm bắt nhanh chóng.

## 1. Tổng quan Hạ tầng (Infrastructure Overview)

*   **Frontend (FE):** Next.js App Router (React) host trên Vercel.
*   **Database & Auth (BE1):** Supabase (PostgreSQL, GoTrue Auth, pgvector, Storage).
*   **AI Agent / RAG (BE2):** Tích hợp qua Next.js Route Handlers (`src/app/api/...`) kết hợp với OpenAI/Anthropic API.
*   **Automation (BE3):** n8n host độc lập (hoặc qua cloud), quản lý luồng trigger sinh content nội dung.

## 2. Luồng dữ liệu Frontend (Next.js) và Supabase

Để tối ưu hiệu suất và bảo mật, dự án áp dụng chiến lược giao tiếp "Hybrid" (Kết hợp):

*   **Gọi trực tiếp (Direct Client/Server Component -> Supabase):**
    *   **Áp dụng cho:** Thao tác CRUD cơ bản (Xem danh sách campaign, tạo product, update profile) và Authentication.
    *   **Cơ chế:** Sử dụng Supabase JS Client (`src/lib/supabase/client.ts` hoặc `server.ts`). Dữ liệu được bảo vệ nghiêm ngặt bởi **Row Level Security (RLS)** trên PostgreSQL. FE gửi kèm JWT token của user đang đăng nhập.
*   **Gọi qua Route Handlers (FE -> `src/app/api/...` -> Supabase):**
    *   **Áp dụng cho:** Các tác vụ có Business Logic phức tạp, cần giấu API Key, hoặc không thể xử lý an toàn ở client.
    *   **Ví dụ:** Xin Tracking Link (cần mã hóa/tạo logic riêng), Chat với AI Sales Agent (cần gọi LLM API).
    *   **Cơ chế:** Gọi API nội bộ của Next.js, tại đây Server dùng Supabase Client (có thể dùng Service Role Key nếu cần bypass RLS cho tác vụ admin nội bộ, nhưng ưu tiên truyền JWT của user để đảm bảo an toàn).

## 3. Cách n8n kết nối vào Supabase (Luồng AI Content Factory - BE3)

Luồng sinh nội dung tự động giữa Supabase và n8n diễn ra theo 2 chiều rõ rệt:

1.  **Supabase -> n8n (Trigger):**
    *   **Cơ chế:** Dùng **Database Webhooks** của Supabase.
    *   **Quy trình:** Khi một bản ghi mới được `INSERT` vào bảng `campaigns`, Supabase tự động bắn một Webhook HTTP POST mang theo payload dữ liệu sang Endpoint (Webhook URL) của n8n.
2.  **n8n -> Supabase (Write back):**
    *   **Cơ chế:** n8n sử dụng **Supabase Service Role Key**.
    *   **Quy trình:** Sau khi n8n nhận webhook, gọi LLM xử lý sinh Hooks/Scripts/Captions, n8n cần ghi dữ liệu này vào bảng `contents`. Vì n8n hoạt động như một hệ thống backend độc lập (không có context của user đăng nhập), nó buộc phải dùng Service Role Key thông qua HTTP Request node hoặc Supabase node trong n8n để bypass RLS và `INSERT` dữ liệu.
    *   *Lưu ý bảo mật:* Service Role Key tuyệt đối chỉ lưu ở biến môi trường của n8n, không bao giờ lộ ra FE.

## 4. Quy trình RAG và Vector Database (pgvector cho BE2)

Để AI Sales Agent có thể tư vấn chính xác (không hallucination), dữ liệu sản phẩm phải được đưa vào pgvector.

*   **Cơ chế Embedding:** **Real-time (Gần thời gian thực)** thông qua Supabase Database Webhooks kết hợp Edge Functions (hoặc Next.js Route Handler nội bộ). Việc dùng Cron Job không phù hợp vì Merchant cần bot cập nhật ngay lập tức khi họ sửa giá.
*   **Quy trình chi tiết (Data Pipeline):**
    1.  **Trigger:** Merchant tạo mới hoặc cập nhật một dòng trong bảng `products`.
    2.  **Webhook:** Supabase bắn Webhook sang một Endpoint xử lý Embedding (ví dụ: `/api/embeddings/sync`).
    3.  **Chunking:** Backend nhận dữ liệu product (name, description, price, policy, ...), chia nhỏ thành các đoạn văn bản (chunks) có ý nghĩa.
    4.  **Embedding:** Gọi OpenAI Embeddings API (text-embedding-3-small) để biến các chunks này thành vector (mảng số thực).
    5.  **Upsert:** Lưu trữ các vectors này vào một bảng chuyên dụng (ví dụ: `product_embeddings`) trên Supabase với kiểu dữ liệu `vector` của extension pgvector, kèm theo `product_id` để map với dữ liệu gốc.
*   **Quy trình Truy xuất (Retrieval lúc Chat):** Khi khách hàng chat, BE2 nhúng câu hỏi thành vector -> Dùng phép tính cosine similarity (tích hợp sẵn trong Supabase/pgvector) để tìm Top 3 chunks liên quan nhất -> Nhét vào System Prompt của LLM để sinh câu trả lời.