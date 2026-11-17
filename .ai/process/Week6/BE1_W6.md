# MY WORK PLAN — BE1_W6
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 6 (16/11/2026 – 21/11/2026) — Sprint 6 (Mentor Feedback Alignment & Automation Upgrade)  
**Member:** Nguyễn Minh Tuệ (Backend 1 Lead kiêm Project Manager)  
**Role:** Backend Developer 1 (Database Architect, AI Pipeline, Asynchronous Background Workers & Commission Engine)  
**Current Milestone:** MENTOR REVIEW ITERATION — AUTOMATED 40–50s VIDEO PIPELINE, RESELLER COMMISSION & TIKTOK ENGAGEMENT ANALYTICS  
**Deadline:** 17:00 Thứ Bảy (21/11/2026)  
**Branch:** `feature/be1-w6-auto-video-pipeline-and-commission` (tách từ `dev`)  

---

## 1. Context & Trọng tâm Kỹ thuật Sprint 6

### 1.1. Bối cảnh từ nhận xét của Mentor:
1. **Video gen từ ảnh tĩnh cũ:** Mentor nhận xét việc ghép ảnh tĩnh đơn điệu không phù hợp với yêu cầu thực tế; video review du lịch cần đạt thời lượng 40–50s.
2. **Cải tiến quy trình tạo video:** Thay vì bắt Merchant tự chọn từng ảnh thủ công, nâng cấp sang luồng tự động (Auto-Generation): Merchant chỉ cần cung cấp thông tin Tour/Chiến dịch, hệ thống tự động chọn B-roll/ảnh phù hợp và dựng video ngầm, Merchant chỉ cần vào duyệt nội dung tại `/merchant/contents`.
3. **Tính năng tính hoa hồng cho Reseller:** Hoàn thiện bảng tính và đối soát hoa hồng cho Reseller.
4. **Tool phân tích tương tác TikTok:** Cho phép Reseller dán link TikTok, hệ thống tự động bóc tách số liệu View, Like, Comment để đánh giá hiệu quả.
5. **Cơ chế tích điểm cho Merchant:** Nếu Merchant tự làm video và đạt tương tác tốt, quy đổi thành điểm thưởng trên nền tảng.

### 1.2. Trọng tâm của BE1 trong Tuần 6:
* **Background Worker Video 40–50s:** Xây dựng worker bất đồng bộ (non-blocking) sinh video review hoàn chỉnh từ kịch bản Groq, khớp B-roll clip, lồng tiếng TTS và lưu vào Supabase Storage/bảng `contents` với `status = 'pending'`.
* **Commission & Budget Matching Engine:** Viết view/RPC tổng hợp dữ liệu Top Reseller (doanh số, hoa hồng, tương tác, rate) phục vụ Merchant đối soát ngân sách.
* **TikTok Engagement Scraper:** Xây dựng endpoint/worker nhận link TikTok và lấy chỉ số tương tác (View, Like, Comment, Share).
* **Merchant Gamification Points:** Xây dựng schema và trigger cộng điểm thưởng cho Merchant khi video đạt mốc tương tác cao.

---

## 2. THIS WEEK — MY TASKS

| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|:---:|:---:|---|:---:|---|:---:|
| **BE1-W6-01** | **Xây dựng Background Worker Tự động sinh Video Review 40–50s cho Merchant duyệt** | **P0** | `DONE` | Groq / Storage | BE1 | API non-blocking `< 500ms`, video MP4 9:16 dài 40-50s lưu bảng `contents` status `pending` | 18/11 17:00 |
| **BE1-W6-02** | **Hoàn thiện Logic Tính toán & API Top Reseller theo Budget cho Merchant** | **P0** | `DONE` | DB Schema | BE1 | RPC/View `get_top_resellers_for_merchant`, filter theo commission budget | 19/11 12:00 |
| **BE1-W6-03** | **Xây dựng Microservice cào chỉ số tương tác TikTok (Views, Likes, Comments)** | **P1** | `DONE` | TikTok API | BE1 | Worker phân tích link video TikTok, lưu bảng `reseller_tiktok_posts` | 20/11 12:00 |
| **BE1-W6-04** | **Schema & Logic tích Điểm thưởng Merchant (Gamification Points) khi video viral** | **P1** | `DONE` | BE1-W6-03 | BE1 | Bảng `merchant_points`, trigger quy đổi engagement $\rightarrow$ điểm thưởng | 20/11 17:00 |
| **BE1-W6-05** | **Hỗ trợ FE Chính tích hợp API Attribution & Xác nhận Thanh toán Storefront** | **P0** | `DONE` | FE Chính | BE1 | API `/api/storefront/orders/confirm` ghi nhận đơn hàng và cộng ví Reseller mượt mà | 21/11 12:00 |

---

## 3. TASK BREAKDOWN (CHI TIẾT THỰC THI)

### Task `BE1-W6-01`: Xây dựng Background Worker Tự động sinh Video Review 40–50s
* **Mục tiêu:** Tự động hóa hoàn toàn luồng tạo video, loại bỏ thao tác chọn ảnh thủ công của Merchant.
* **Chi tiết triển khai:**
  1. **Event Trigger Non-blocking:**
     - Xây dựng endpoint `POST /api/merchant/video/auto-pipeline` (hoặc trigger từ action tạo campaign).
     - Trả về `HTTP 202 Accepted` ngay lập tức; kích hoạt xử lý nền với `after()` của Next.js hoặc Python Worker.
  2. **LLM Script Engine 40–50s:**
     - Tích hợp tại `services/llm-service/content_generator.py` với Groq API (`llama-3.3-70b-versatile`).
     - Sinh kịch bản review 4 phân cảnh phân bổ 40–50s:
       * *Scene 1 (0s–7s) - The Hook:* Mở đầu ấn tượng, visual thu hút.
       * *Scene 2 (7s–25s) - Trải nghiệm thực tế:* 2-3 điểm nhấn tour, góc check-in, ăn uống.
       * *Scene 3 (25s–38s) - Chi phí & Giá vé:* Ưu đãi độc quyền, quét mã QR vào cổng không cần xếp hàng.
       * *Scene 4 (38s–48s) - CTA:* Kêu gọi bấm link bio nhận voucher giảm giá.
  3. **Thuật toán Khớp B-roll Clips (Asset Matcher):**
     - Truy vấn kho media theo `visual_tag` hoặc `destination_tags`.
     - Ưu tiên chọn các clip B-roll ngắn (MP4 dọc 9:16) khớp với nội dung từng Scene.
     - Fallback sang ảnh chất lượng cao kèm hiệu ứng 4K Pre-scale nếu thiếu clip.
  4. **Compositing Engine:**
     - Lồng tiếng AI (TTS tiếng Việt tự nhiên) từ voiceover script.
     - Dùng FFmpeg ghép các clip B-roll khớp thời lượng giọng đọc, lồng nhạc nền (audio ducking tự giảm âm lượng khi có giọng nói).
  5. **Lưu trữ & Đẩy vào Hàng đợi Duyệt:**
     - Upload file MP4 lên Supabase Storage bucket `campaign-videos`.
     - Chèn bản ghi vào bảng `contents` với `status = 'pending'` để Merchant vào trang `/merchant/contents` bấm **Duyệt (Approve)** hoặc **Tạo lại**.
* **DoD:** Gọi API thành công, video 40–50s render xong xuất hiện tại trang duyệt nội dung của Merchant với trạng thái `pending`.

---

### Task `BE1-W6-02`: API Top Reseller & Đối soát Budget cho Merchant
* **Mục tiêu:** Cung cấp danh sách đối tác Reseller hiệu quả nhất kèm mức hoa hồng và tương tác để Merchant lựa chọn theo ngân sách.
* **Chi tiết triển khai:**
  - Viết Database View/RPC `get_top_resellers_for_merchant(p_merchant_id UUID, p_max_commission_rate NUMERIC)`:
    - Tổng hợp từ bảng `affiliate_links`, `clicks`, `orders`, `commissions`.
    - Trả về: `reseller_id`, `reseller_name`, `avatar_url`, `total_clicks`, `total_orders`, `conversion_rate`, `total_commission_paid`, `average_commission_rate`.
    - Cho phép lọc theo ngân sách hoa hồng (ví dụ: chỉ hiện reseller có rate $\le 15\%$).
* **DoD:** Query phản hồi $< 30\text{ ms}$, trả về danh sách đối soát chuẩn xác cho Merchant Dashboard.

---

### Task `BE1-W6-03`: Microservice Bóc Tách Tương Tác TikTok
* **Mục tiêu:** Reseller nộp link video TikTok đã đăng $\rightarrow$ Hệ thống tự động lấy chỉ số tương tác.
* **Chi tiết triển khai:**
  - Tạo bảng `reseller_tiktok_posts`:
    - `id`, `reseller_id`, `campaign_id`, `tiktok_url`, `views_count`, `likes_count`, `comments_count`, `shares_count`, `engagement_score`, `last_synced_at`.
  - Xây dựng hàm `fetch_tiktok_metrics(tiktok_url)`:
    - Sử dụng TikTok oEmbed API hoặc HTTP parser lấy metadata video.
    - Công thức tính điểm tương tác:
      $$\text{Engagement Score} = \text{Views} \times 0.1 + \text{Likes} \times 1.0 + \text{Comments} \times 2.0 + \text{Shares} \times 3.0$$
* **DoD:** Nhập link TikTok hợp lệ, hệ thống trích xuất được số lượt View/Like/Comment và tính ra điểm tương tác.

---

### Task `BE1-W6-04`: Cơ Chế Tích Điểm Thưởng Cho Merchant (Gamification)
* **Mục tiêu:** Hiện thực hóa nhận xét của Mentor: *"Nếu merchant tự tạo video và video có tương tác tốt sẽ được quy ra điểm"*.
* **Chi tiết triển khai:**
  - Tạo bảng `merchant_points`:
    - `id`, `merchant_id`, `points_balance`, `tier` (`silver`, `gold`, `diamond`), `history` (jsonb).
  - Viết Stored Procedure / Trigger tự động cộng điểm khi video do Merchant upload/duyệt đạt các mốc tương tác (ví dụ: mỗi 1.000 views = 10 điểm, mỗi 100 likes = 15 điểm).
  - Điểm có thể dùng để khấu trừ phí nền tảng hoặc boost hiển thị tour lên đầu danh sách giới thiệu cho Reseller.
* **DoD:** Khi số liệu tương tác video tăng, điểm Merchant tự động nhảy và ghi nhật ký lịch sử tích điểm.

---

### Task `BE1-W6-05`: Hỗ Trợ FE Chính Tích Hợp Đặt Vé & Thanh Toán VietQR
* **Mục tiêu:** Đảm bảo luồng mua vé qua link Reseller hoạt động trơn tru 100% từ giao diện đến database.
* **Chi tiết triển khai:**
  - Tối ưu route `POST /api/storefront/orders/confirm`:
    - Đảm bảo idempotency (chống tạo trùng đơn khi bấm 2 lần).
    - Tính đúng chiết khấu cho khách (ví dụ 5%) và chia hoa hồng chuẩn (80% về ví Reseller, 20% phí nền tảng).
    - Trả về payload chứa thông tin vé điện tử QR Code để FE render màn hình thành công.
* **DoD:** Đơn hàng từ Storefront tạo xong cập nhật trực tiếp vào số dư ví của Reseller trong bảng `commissions` và `reseller_wallets`.

---

## 4. GIAO TIẾP & PHỐI HỢP TRONG NHÓM

* **Bàn giao cho FE Chính:**
  - Cung cấp API schema `/api/storefront/orders/confirm` hỗ trợ tracking `refCode` và trả về `commission` chi tiết.
* **Bàn giao cho FE Phụ:**
  - API Top Reseller (`get_top_resellers_for_merchant`) để gắn vào Merchant Portal.
  - API nộp link TikTok (`POST /api/reseller/tiktok-posts`) để làm form dán link.
* **Yêu cầu hỗ trợ:**
  - Cần FE Chính hoàn thiện mockup giao diện Storefront & Modal thanh toán Mobile-First theo đúng tiến độ.

---

## 5. BÁO CÁO KẾT QUẢ TRIỂN KHAI, VERIFY VÀ HƯỚNG DẪN DEPLOY PRODUCTION (17/11/2026)

### 5.1. Tình trạng Nhánh & Pull Requests
Toàn bộ 5/5 tasks của BE1 Sprint 6 đã hoàn thành và được tổ chức trên 2 nhánh Git riêng biệt, kèm Pull Request chờ review (chưa merge trực tiếp):

1. **Nhánh 1:** `feature/be1-w6-auto-video-pipeline-and-commission` (Commit: `d58c19c`)
   - **Phạm vi:** `BE1-W6-01`, `BE1-W6-02`, `BE1-W6-05`.
   - **Files cốt lõi:**
     - [app/api/merchant/video/auto-pipeline/route.ts](file:///e:/Tue/MyProject/AITravelReseller/ai-travel-reseller/app/api/merchant/video/auto-pipeline/route.ts)
     - [src/lib/video-engine/auto-pipeline-worker.ts](file:///e:/Tue/MyProject/AITravelReseller/ai-travel-reseller/src/lib/video-engine/auto-pipeline-worker.ts)
     - [services/llm-service/content_generator.py](file:///e:/Tue/MyProject/AITravelReseller/ai-travel-reseller/services/llm-service/content_generator.py)
     - [supabase/migrations/20261117100000_get_top_resellers_for_merchant.sql](file:///e:/Tue/MyProject/AITravelReseller/ai-travel-reseller/supabase/migrations/20261117100000_get_top_resellers_for_merchant.sql)
     - [app/api/merchant/resellers/top/route.ts](file:///e:/Tue/MyProject/AITravelReseller/ai-travel-reseller/app/api/merchant/resellers/top/route.ts)
     - [app/api/storefront/orders/confirm/route.ts](file:///e:/Tue/MyProject/AITravelReseller/ai-travel-reseller/app/api/storefront/orders/confirm/route.ts)
   - **Pull Request URL:** [Compare/PR Nhánh 1](https://github.com/NguyenMTue/ai-travel-reseller/compare/dev...feature/be1-w6-auto-video-pipeline-and-commission?expand=1)

2. **Nhánh 2:** `feature/be1-w6-tiktok-analytics-and-merchant-points` (Commit: `099326b`)
   - **Phạm vi:** `BE1-W6-03`, `BE1-W6-04` kèm fix lỗi TypeScript & tối ưu Turbopack.
   - **Files cốt lõi:**
     - [supabase/migrations/20261117140000_tiktok_analytics_and_merchant_points.sql](file:///e:/Tue/MyProject/AITravelReseller/ai-travel-reseller/supabase/migrations/20261117140000_tiktok_analytics_and_merchant_points.sql)
     - [src/lib/tiktok/tiktok-service.ts](file:///e:/Tue/MyProject/AITravelReseller/ai-travel-reseller/src/lib/tiktok/tiktok-service.ts)
     - [app/api/reseller/tiktok-posts/route.ts](file:///e:/Tue/MyProject/AITravelReseller/ai-travel-reseller/app/api/reseller/tiktok-posts/route.ts)
     - [app/api/merchant/points/route.ts](file:///e:/Tue/MyProject/AITravelReseller/ai-travel-reseller/app/api/merchant/points/route.ts)
     - [services/llm-service/tiktok_publisher.py](file:///e:/Tue/MyProject/AITravelReseller/ai-travel-reseller/services/llm-service/tiktok_publisher.py)
   - **Pull Request URL:** [Compare/PR Nhánh 2](https://github.com/NguyenMTue/ai-travel-reseller/compare/dev...feature/be1-w6-tiktok-analytics-and-merchant-points?expand=1)

---

### 5.2. Kết quả Kiểm thử & Production Build
- **Kiểm thử tự động:**
  - `npm run test:be1:w6`: **10/10 PASS** (Bao gồm video worker, top reseller calculation, storefront order attribution, TikTok metrics và gamification points).
  - `npm run test:be1:sprint`: **4/4 PASS** (Đảm bảo tính tương thích hồi quy).
- **Kiểm tra TypeScript & Clean Production Build:**
  - Lệnh: `npm run build` (`next build`).
  - **Kết quả:** **Thành công 100% (Mã thoát 0)**, biên dịch toàn bộ **42/42 dynamic/static routes** chỉ trong 9.7 giây.
  - **Các bản sửa lỗi type checking đã áp dụng:**
    1. [app/actions/auth.ts](file:///e:/Tue/MyProject/AITravelReseller/ai-travel-reseller/app/actions/auth.ts#L47): An toàn hóa kiểm tra `error.code` khi ép kiểu `AuthError`.
    2. [app/api/tracking/generate/route.ts](file:///e:/Tue/MyProject/AITravelReseller/ai-travel-reseller/app/api/tracking/generate/route.ts#L267): Sửa cơ chế bất đồng bộ gọi `.catch` trên Supabase query builder.
    3. [src/components/merchant/video-generate-modal.tsx](file:///e:/Tue/MyProject/AITravelReseller/ai-travel-reseller/src/components/merchant/video-generate-modal.tsx#L196): Đồng bộ `style_tags` sang `styleTags` đúng interface `LibraryItem`.
    4. [src/lib/video-engine/ffmpeg-compositor.ts](file:///e:/Tue/MyProject/AITravelReseller/ai-travel-reseller/src/lib/video-engine/ffmpeg-compositor.ts#L10-L16): Mở rộng interface `TextOverlayConfig` với `act1Text..act4Text` và gắn cờ `/*turbopackIgnore: true*/` tại các lệnh `spawn` để ngăn Turbopack trace toàn bộ filesystem vào serverless bundle.

---

### 5.3. Đánh giá Khả thi Triển khai Docker Muse2API trên Production
- **Thực tế môi trường:**
  - Docker container đang chạy ngầm trên máy local (`http://localhost:18610`) không thể được gọi trực tiếp từ cloud serverless (Vercel).
- **Tính sẵn sàng của hệ thống (Zero Blocking):**
  - **Auto Video Pipeline 40–50s (`BE1-W6-01`):** Hoàn toàn độc lập với Docker Muse2API. Pipeline này vận hành 100% trên nền tảng Cloud (Groq Cloud API, Edge-TTS, `ffmpeg-static` nhúng trong serverless runtime và Supabase Storage). Do đó, việc tự động sinh video review 46s khi tạo chiến dịch hoặc bấm sinh video hoàn toàn trơn tru trên Production.
  - **Luồng Video Thủ công cũ (`BE1-W5`):** Trong [src/lib/merchant/video-generate-service.ts](file:///e:/Tue/MyProject/AITravelReseller/ai-travel-reseller/src/lib/merchant/video-generate-service.ts#L42-L65), hệ thống có sẵn cơ chế `isMuse2ApiConfigured()` và try/catch fallback sang `createSingleImageMotionClip` (FFmpeg Ken Burns motion). Khi không có Muse2API, hệ thống vẫn tạo clip chuyển động mượt mà từ ảnh mà không gây lỗi hoặc crash ứng dụng.
- **Giải pháp đưa Muse2API lên Production (nếu muốn sử dụng model sinh chuyển động nặng):**
  - Build Docker image Muse2API và deploy lên các dịch vụ container cloud riêng biệt (như Railway, Render, Fly.io, RunPod, hoặc VPS DigitalOcean/AWS).
  - Cấu hình biến môi trường trên Vercel: `MUSE2API_BASE_URL=https://<your-remote-host>`.

---

### 5.4. Pre-deployment Checklist (Trước khi Ship Production)

| STT | Hạng mục kiểm tra | Trạng thái | Hướng dẫn thực hiện |
|:---:|---|:---:|---|
| 1 | **Codebase & Tests** | **READY** | Toàn bộ 5 task BE1 đã pass 10/10 test và commit lên 2 nhánh feature. |
| 2 | **Next.js Production Build** | **READY** | `npm run build` thành công 42/42 routes, không lỗi type checking. |
| 3 | **Database Migrations (Supabase Cloud)** | **PENDING** | Cần copy và chạy 2 script sau trong Supabase SQL Editor:<br/>1. `supabase/migrations/20261117100000_get_top_resellers_for_merchant.sql`<br/>2. `supabase/migrations/20261117140000_tiktok_analytics_and_merchant_points.sql` |
| 4 | **Environment Variables (Vercel)** | **PENDING** | Đảm bảo Dashboard Vercel có đủ các biến:<br/>- `NEXT_PUBLIC_SUPABASE_URL`<br/>- `NEXT_PUBLIC_SUPABASE_ANON_KEY`<br/>- `SUPABASE_SECRET_KEY`<br/>- `GROQ_API_KEY`<br/>- `NEXT_PUBLIC_APP_URL` |
| 5 | **Review & Merge PR** | **PENDING** | Tiến hành review 2 PR vào nhánh `dev`. |
| 6 | **Frontend Binding** | **IN_PROGRESS** | FE Phụ gắn dữ liệu từ 2 endpoint mới (`/api/merchant/resellers/top` và `/api/reseller/tiktok-posts`) vào giao diện UI. |

