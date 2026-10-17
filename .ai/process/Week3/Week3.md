# KẾ HOẠCH TRIỂN KHAI TUẦN 3
### DỰ ÁN: AI TRAVEL RESELLER MVP (TRAVELLINK AI)
* **Giai đoạn:** Tuần 3 (19/10/2026 – 24/10/2026) — Sprint 3
* **Chủ đề mốc tiến độ (Milestone):** **COMMERCE FLOW, AI SALES AGENT, PWA & MERCHANT VIDEO GENERATION (Thương mại, Bot chốt sale, PWA Mobile & Tạo Video AI)**

---

## 1. MỤC TIÊU TỔNG THỂ CỦA SPRINT 3

Kế thừa kết quả nghiệm thu thành công của Tuần 2 (Nhà máy nội dung AI Content Factory, phân phối kịch bản 4 Persona và hệ thống Tracking Link / Anti-bot Redirect), Tuần 3 là giai đoạn then chốt mở rộng năng lực sản xuất nội dung đa phương tiện, thương mại hóa hoa hồng và tối ưu hóa toàn diện trải nghiệm người dùng:

1. **Thương mại hóa luồng hoa hồng (Order Attribution & Commission Engine):** 
   * Thiết kế bảng `orders`, `commissions` và cơ chế trích xuất `click_id` / `reseller_id` khi khách đặt mua vé thành công.
   * Xây dựng hàm tính toán và phân bổ hoa hồng đa tầng (Merchant, Reseller, Platform Fee).
2. **AI Sales Agent đa kênh & RAG nâng cao:**
   * Hoàn thiện khung chat tư vấn bán hàng tự động, truy vấn dữ liệu tour/vé qua `pgvector`.
   * Tự động nhận diện ý định mua hàng (Buying Intent) để đề xuất link thanh toán có gắn ref cá nhân của Reseller.
3. **Phát triển bộ giải pháp PWA Mobile Suite (Reseller & Khách hàng):**
   * **Định hướng chiến lược:** Áp dụng giải pháp **Progressive Web App (PWA)** trực tiếp trên nền Next.js 16 + React 19 để tối ưu trải nghiệm chạm vuốt di động mà không cần phát triển Native App cồng kềnh, tiết kiệm tài nguyên và ra mắt tức thì.
   * **Dành cho Reseller:**
     * Hỗ trợ cài đặt "Thêm vào màn hình chính" (Add to Home Screen), mở toàn màn hình (Standalone) không thanh URL trình duyệt.
     * Thiết kế Bottom Navigation Bar tiện tay (Thumb-friendly): Bảng tin, Kho nội dung AI, Link & QR, Ví hoa hồng.
     * Tích hợp **Web Share API**: 1 chạm mở ngay menu chia sẻ native của điện thoại (Zalo, Messenger, TikTok, Facebook) kèm kịch bản và link tiếp thị.
     * Tự động ghép mã QR cá nhân vào poster du lịch và hỗ trợ tải trực tiếp về Thư viện ảnh (Photo Gallery).
   * **Dành cho Khách hàng:**
     * Mở link tiếp thị `/r/[code]` trong trình duyệt nhúng (In-App Browser của TikTok, Zalo, Facebook) siêu nhanh (< 1.5 giây), không bắt cài app.
     * Giao diện Chat AI Sales Agent tự động co giãn toàn màn hình dạng Bottom Sheet mô phỏng Messenger.
4. **Phân hệ Thư viện Video Mẫu & Tạo Video AI cho Merchant (Merchant Video Generation):**
   * Cho phép Merchant tải lên hoặc dán liên kết video mẫu yêu thích (Shorts/TikTok/Reels phong cách du lịch).
   * Lưu trữ metadata video vào Thư viện mẫu (`media_library` / `media_references`).
   * AI Multimodal phân tích phong cách, góc quay, hook và nhịp độ của video mẫu; từ đó tự động tạo kịch bản/video tương tự áp dụng chính xác cho sản phẩm và chiến dịch của Merchant.
5. **Quy chuẩn Demo & Báo cáo Mobile khi chưa Deploy (Local Environment):**
   * **Phương án chính (C3 — Trình diễn thực tế trên Điện thoại thật):** Sử dụng Cloudflared HTTPS Tunnel (`npx cloudflared tunnel --url http://localhost:3000`) để cấp chứng chỉ HTTPS tạm thời, biểu diễn quét QR và cài đặt icon PWA ra màn hình chính điện thoại thật ngay tại buổi báo cáo.
   * **Phương án dự phòng (C1 — Trình diễn Offline trên Máy tính):** Sử dụng Chrome DevTools Device Mode (`F12` -> `Ctrl+Shift+M` -> *Show device frame*) để hiển thị khung viền điện thoại chuẩn (iPhone / Samsung) có cảm ứng chạm ngay trên màn hình trình chiếu.

---

## 2. ĐIỀU CHUYỂN NHÂN SỰ & QUY CHẾ AN TOÀN CHO TESTER 3

> [!CAUTION]
> **Quyết định điều chuyển và khoanh vùng rủi ro đối với Tester 3:**
> * **Hiện trạng nhân sự:** Tester 3 tạm thời chuyển hoàn toàn sang đội ngũ Frontend (FE phụ / Trainee). Thành viên này có kỹ năng FE yếu, hiểu biết AI còn thấp, và có tiền sử tạo nhánh làm hỏng cấu trúc hệ thống, lỗi Playwright và vượt quyền trái phép trong Sprint 2.
> * **Nguyên tắc giao việc:** 
>   1. **Làm rất ít việc**: Chỉ giao tối đa 1-2 task tĩnh nhỏ lẻ, đơn giản.
>   2. **Cách ly tuyệt đối khỏi Core hệ thống**: Nghiêm cấm Tester 3 chỉnh sửa các tệp `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, cấu hình Playwright/test chung, Supabase Client/Auth, API routes và Tracking router `/r/[code]`.
>   3. **Chỉ làm Dumb Component**: Chỉ viết các UI Component nhận props tĩnh hiển thị thẻ card hoặc modal chữ tĩnh, không can thiệp logic state phức tạp, không gọi API mạng.
>   4. **Cơ chế kiểm soát nhánh & merge:** Làm việc trên nhánh cô lập `feature/fe-t3-static-components`. Cấm tự ý merge vào `dev`. Bắt buộc phải có Approval từ FE Lead (Diệu) và PM/BE1 (Tuệ).

---

## 3. PHÂN CÔNG NHIỆM VỤ CHI TIẾT (WORK BREAKDOWN STRUCTURE)

### A. Frontend & UI/UX Team
* **UI/UX Designer (UX-W3):**
  * `UX-W3-01`: Thiết kế Figma Mobile UI cho Reseller Portal (kích thước chuẩn 390px và 320px): Bottom Navigation Bar, Thẻ chiến dịch tối ưu chạm, Màn hình Ví hoa hồng.
  * `UX-W3-02`: Thiết kế UI khung Chat AI Sales Agent dạng Bottom Sheet di động cho Khách hàng.
  * `UX-W3-03`: Thiết kế giao diện Media Library & Form tải video mẫu cho Merchant.
* **Frontend Lead (Diệu — FE-W3):**
  * `FE-W3-01 (PWA Core Setup)`: Cấu hình `public/manifest.json`, Web App Manifest meta tags, Icons đa kích thước (192x192, 512x512, apple-touch-icon), Service Worker cơ bản hỗ trợ Add to Home Screen.
  * `FE-W3-02 (Mobile Bottom Nav & Safe Area)`: Dựng Bottom Navigation Bar cố định cho phân hệ `/reseller`, xử lý padding an toàn (safe-area-inset) cho màn hình tai thỏ.
  * `FE-W3-03 (Native Web Share & Canvas QR)`: Tích hợp `navigator.share` (Web Share API) cho nút "Chia sẻ nhanh" sang Zalo/TikTok; tạo tiện ích canvas xuất ảnh poster kèm mã QR tiếp thị.
  * `FE-W3-04 (Customer Mobile Chat)`: Tối ưu hóa giao diện chat mobile thành Bottom Sheet toàn màn hình, xử lý bàn phím ảo không che input.
  * `FE-W3-05 (Reseller Wallet UI)`: Dựng màn hình Ví hoa hồng (`/reseller/wallet`): Số dư khả dụng, hoa hồng chờ duyệt, lịch sử đơn hàng.
  * `FE-W3-06 (Merchant Video Library Integration)`: Tích hợp tab Media Library trên Merchant Portal, gọi API lưu video mẫu và kích hoạt AI sinh video.
* **FE Phụ / Trainee (Tester 3 — T3-FE-W3):** *(Phạm vi cô lập, Dumb UI tĩnh)*
  * `T3-FE-W3-01 (Media Video Card Component)`: Viết component tĩnh `src/components/merchant/media-card.tsx` nhận dữ liệu mẫu (title, duration, thumbnailUrl, styleTag) và hiển thị thẻ video đơn giản. Không viết logic gọi API, không sửa CSS toàn cục.
  * `T3-FE-W3-02 (Static Video Guidelines Modal)`: Viết component modal tĩnh `src/components/merchant/video-guidelines-modal.tsx` hiển thị nội dung hướng dẫn quy chuẩn video 9:16 (độ phân giải, thời lượng khuyến nghị 15-60s) cho Merchant.

### B. Backend Team
* **Backend 1 — Core Database & Attribution (BE1-W3):**
  * `BE1-W3-01`: Thiết kế migration bảng `orders` (id, booking_ref, amount, merchant_id, product_id, reseller_id, click_id, status) và bảng `commissions`.
  * `BE1-W3-02`: Migration bảng `media_references` (id, merchant_id, title, video_url, platform, style_tags, created_at) cho Merchant Video Library.
  * `BE1-W3-03`: Xây dựng API `POST /api/merchant/media` quản lý tải lên/lưu trữ liên kết video mẫu.
  * `BE1-W3-04`: Engine ghi nhận đơn hàng (Attribution Engine): liên kết chính xác đơn hàng với lượt click hợp lệ trong bảng `clicks` và tính toán chia sẻ hoa hồng qua RPC `get_reseller_wallet_summary`.
  * `BE1-W3-05`: Dọn dẹp dứt điểm các trigger hòa giải tạm thời của Tuần 2.
* **Backend 2 — AI Sales Agent & Multimodal Video Prompt (BE2-W3):**
  * `BE2-W3-01`: Tinh chỉnh System Prompt cho AI Sales Agent: Nhận diện ý định mua hàng (Buying Intent) để chủ động đưa ra link thanh toán có gắn ref.
  * `BE2-W3-02`: Thiết kế bộ Prompt Multimodal cho Gemini: Phân tích kịch bản video mẫu (Video Script & Visual Scenes Extractor) để bóc tách phong cách quay, âm thanh, nhịp cắt cảnh.
  * `BE2-W3-03`: Bộ Prompt sinh kịch bản video mới tự động áp dụng thông tin sản phẩm và chiến dịch của Merchant.
* **Backend 3 — Automation & Video Pipeline (BE3-W3):**
  * `BE3-W3-01`: Xây dựng Workflow n8n tự động bắn thông báo (Webhook / Telegram / Zalo) khi Reseller có lượt click mới hoặc đơn hàng phát sinh.
  * `BE3-W3-02`: Workflow n8n tích hợp pipeline sinh video / tự động hóa video từ kịch bản mẫu và asset sản phẩm du lịch của Merchant.

### C. QA Team
* **Tester 1 (QA Lead & Hybrid QA):**
  * `T1-W3-01`: Kiểm thử toàn diện tính năng PWA trên Safari (iOS) và Chrome (Android).
  * `T1-W3-02`: Kiểm thử hiển thị responsive trên 3 viewport Playwright: `desktop` (1440px), `mobile` (390px), `small-mobile` (320px).
  * `T1-W3-03`: Chuẩn bị kịch bản và chạy thử quy trình demo báo cáo C1 (Chrome Device Frame) và C3 (Cloudflared Tunnel).
  * `T1-W3-04`: Kiểm thử luồng tải video mẫu của Merchant và hiển thị trong Media Library.
* **Tester 2 (AI Safety & Prompt QA):**
  * `T2-W3-01`: Kiểm thử AI Sales Agent chống Hallucination về giá vé, chính sách trẻ em và ưu đãi ảo.
  * `T2-W3-02`: Kiểm định chất lượng kịch bản video do AI sinh từ video mẫu (độ tương đồng phong cách, tính chân thực của nội dung tour).

### D. Nghiệp Vụ & Điều Phối Dự Án
* **Business Analyst (BA Lead / Product Requirements):**
  * `BA-W3-01`: Bàn giao & Giải đáp Đặc tả Nghiệp vụ tại Kick-off Sprint 3 (dựa trên các bộ đặc tả `BA_COMMERCE_AND_COMMISSION_SPEC.md`, `BA_AI_SALES_AGENT_SPEC.md`, `BA_HANDOFF_MATRIX.md`).
  * `BA-W3-02`: Khóa Business Rules cho BE1: Migration `orders`, `media_references` & RPC ví.
  * `BA-W3-03`: Khóa Kịch bản RAG, Buying Intent & Multimodal Prompt cho BE2.
  * `BA-W3-04`: Handoff Yêu cầu Giao diện PWA Mobile & Merchant Library cho UI/UX.
  * `BA-W3-05`: Khóa Event Taxonomy & Webhook Schema cho BE3.
  * `BA-W3-06`: Hỗ trợ FE Lead (Diệu) & Tester 3 (FE phụ) xác thực luồng giao diện thẻ video.
  * `BA-W3-07`: Đồng hành cùng QA Team (Tester 1, 2) chạy Bộ Test Nghiệp Vụ.
  * `BA-W3-08`: Thực hiện Nghiệm thu Nghiệp vụ (Business UAT) & Đánh giá Demo Sprint 3.
* **Nguyễn Minh Tuệ (Backend 1 Lead kiêm Điều phối PM / Tech Lead):**
  * Chủ trì họp Kick-off Sprint 3, điều phối tiến độ toàn đội ngũ 9 thành viên, giám sát quy chế an toàn cho Tester 3 và duyệt release cuối tuần.

---

## 4. LỊCH TRÌNH THỰC HIỆN HÀNG NGÀY (SPRINT SCHEDULE)

| Ngày | Trọng tâm công việc |
| :--- | :--- |
| **Thứ Hai (19/10)** | Họp Kick-off Sprint 3 (09:00 AM). Phổ biến quy chế an toàn cho Tester 3. Chốt cấu trúc PWA Manifest, Hợp đồng bảng `orders`, schema `media_references` và kịch bản Demo C1/C3. UI/UX bàn giao bản vẽ Mobile & Media Library. |
| **Thứ Ba (20/10)** | BE1 tạo migration bảng `orders`, `commissions`, `media_references`. FE Lead cấu hình PWA Core (`manifest.json`, Service Worker) và Bottom Nav. Tester 3 bắt đầu cắt component tĩnh `MediaCard`. BE2 viết prompt Multimodal video. |
| **Thứ Tư (21/10)** | FE Lead hoàn thiện Web Share 1 chạm và Canvas QR. Tester 3 hoàn thành Modal Video Guidelines và nộp PR cho FE Lead review. BE1 hoàn thiện API Video Library. BE3 dựng workflow n8n thông báo đơn hàng. |
| **Thứ Năm (22/10)** | Tích hợp E2E: Merchant tải video mẫu $\rightarrow$ AI phân tích kịch bản $\rightarrow$ Đặt đơn hàng thử nghiệm $\rightarrow$ Ghi nhận hoa hồng vào Ví Reseller. Tối ưu khung chat mobile cho khách hàng. |
| **Thứ Sáu (23/10)** | QA chạy Regression Test toàn sàn (Desktop, PWA Mobile, Video Library). Rà soát và fix 100% bug High/Critical. Chạy diễn tập kịch bản Demo C3 và C1. Freeze code lúc 17:00. |
| **Thứ Bảy (24/10)** | Họp Review Sprint 3 & Diễn tập Demo nghiệm thu MVP toàn diện (Showcase PWA trên điện thoại thật bằng Cloudflared và trình diễn Merchant Video Library). |

---

## 5. QUY TRÌNH HƯỚNG DẪN DEMO BÁO CÁO KHI CHƯA DEPLOY

Để đảm bảo buổi báo cáo diễn ra trơn tru, toàn đội thống nhất áp dụng quy trình sau:

### Quy trình A: Demo trực tiếp trên Điện thoại thật (Phương án C3)
1. Trên máy tính phát triển, chạy Next.js: `npm run dev` (cổng 3000).
2. Mở một terminal mới, kích hoạt HTTPS Tunnel:
   ```powershell
   npx cloudflared tunnel --url http://localhost:3000
   ```
3. Lấy đường dẫn HTTPS (ví dụ: `https://xxx.trycloudflare.com`) tạo thành mã QR trên màn hình laptop.
4. Người báo cáo dùng điện thoại cá nhân quét mã QR để mở ứng dụng.
5. Thực hiện thao tác:
   * **Cài đặt:** Bấm *"Thêm vào màn hình chính"* (Add to Home Screen) $\rightarrow$ thoát ra màn hình chính để người xem thấy Icon App.
   * **Trải nghiệm PWA:** Chạm vào Icon để mở ứng dụng toàn màn hình không thanh URL.
   * **Thao tác nhanh:** Vào Bảng tin, chọn bài viết AI $\rightarrow$ bấm **"Chia sẻ nhanh"** (mở native share Zalo/TikTok) $\rightarrow$ bấm **"Tải ảnh kèm QR"**.
   * **Khách hàng trải nghiệm:** Dán link tiếp thị vào trình duyệt, bấm chat với AI Sales Agent và nhận link thanh toán vé.

### Quy trình B: Demo mô phỏng khung điện thoại trên Laptop (Phương án C1 - Dự phòng)
1. Mở trang web trên Google Chrome máy tính (`http://localhost:3000/reseller`).
2. Bấm `F12` $\rightarrow$ bấm `Ctrl + Shift + M` (Device Mode).
3. Chọn thiết bị: **iPhone 14 Pro Max**.
4. Bấm vào nút 3 chấm góc phải thanh công cụ $\rightarrow$ chọn **"Show device frame"**.
5. Thu nhỏ tỉ lệ zoom về 75% để vừa vặn với máy chiếu. Trình diễn toàn bộ thao tác cảm ứng bằng chuột một cách trực quan và an toàn tuyệt đối.
