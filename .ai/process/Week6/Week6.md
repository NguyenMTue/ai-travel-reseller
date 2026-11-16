# KẾ HOẠCH TRIỂN KHAI TUẦN 6
### DỰ ÁN: AI TRAVEL RESELLER MVP (TRAVELLINK AI)
* **Giai đoạn:** Tuần 6 (16/11/2026 – 21/11/2026) — Sprint 6
* **Chủ đề mốc tiến độ (Milestone):** **MENTOR FEEDBACK ALIGNMENT — AUTOMATED 40–50s VIDEO PIPELINE, RESELLER COMMISSION & STOREFRONT CHECKOUT REVAMP (Điều chỉnh theo nhận xét Mentor — Luồng tự động hóa sinh Video 40–50s, Tính hoa hồng Reseller & Cải tổ trang Tour/Thanh toán)**
* **Mục tiêu tối thượng (North Star Metric):** Hoàn thiện 100% trải nghiệm mua vé & thanh toán VietQR trên di động khi truy cập từ link Reseller; vận hành luồng tạo video 40–50s tự động trong nền cho Merchant duyệt; giải quyết triệt để 5 đầu mục góp ý của Mentor.

---

## 1. MỤC TIÊU TỔNG THỂ CỦA SPRINT 6

Dựa trên phản hồi chính thức từ Mentor:
1. **Video từ ảnh tĩnh $\rightarrow$ Video Review 40–50s:** Chuyển đổi công nghệ từ ghép ảnh tĩnh sang sử dụng kịch bản review 40–50s có B-roll chuyển động và lồng tiếng AI truyền cảm.
2. **Quy trình tạo video tự động (Zero-touch Generation):** Merchant chỉ cần đẩy thông tin Tour/Chiến dịch, hệ thống tự động chọn asset và render video ngầm; Merchant chỉ cần vào duyệt tại `/merchant/contents`.
3. **Tính hoa hồng & Đối soát ngân sách (Commission & Budget Matching):** Bổ sung danh sách Top Reseller (hoa hồng, tương tác, giá) để Merchant lựa chọn theo ngân sách.
4. **Phân tích tương tác TikTok:** Cho phép Reseller nộp link video TikTok, hệ thống tự động cào số liệu Like/Comment/View để đánh giá độ viral.
5. **Cơ chế tích điểm cho Merchant:** Quy đổi tương tác video tự tạo của Merchant thành điểm thưởng nền tảng.
6. **Trọng tâm FE Chính:** Cải tổ toàn diện giao diện trang Chi tiết Tour (`/storefront/[tenant]/[slug]`) và Luồng Thanh toán Mobile khi khách mở từ link đối tác Reseller.

---

## 2. PHÂN CÔNG NHIỆM VỤ CHI TIẾT SPRINT 6 (WBS)

### A. Frontend Chính (Lead FE) — TRỌNG TÂM SPRINT
* `FE-W6-01 (Redesign Header & Identity Card Reseller)`: Thẻ nhận diện KOC/Reseller giới thiệu, thông báo ưu đãi độc quyền 5%, lưu giữ mã tracking `refCode` xuyên suốt phiên.
* `FE-W6-02 (Tối ưu UI/UX Tour Content & Pricing Card Mobile-First)`: Thanh đặt vé nổi ghim đáy màn hình (Sticky CTA), hiển thị giá ưu đãi qua Reseller, phân tầng các gói vé rõ ràng.
* `FE-W6-03 (Nâng cấp Modal Thanh toán 3 bước & Dynamic VietQR Napas247)`: Form điền thông tin nhanh trên di động, bảng chiết khấu minh bạch, thanh toán VietQR tự động điền nội dung, hiển thị vé điện tử QR Code E-Ticket tức thì.

### B. Project Management & Backend 1 (Nguyễn Minh Tuệ)
* `BE1-W6-01 (Background Worker Tự động sinh Video 40–50s)`: API non-blocking tiếp nhận job, LLM Groq tạo kịch bản 4 phân cảnh, matcher tự động chọn clip B-roll, FFmpeg ráp video + TTS voiceover, lưu bảng `contents` với status `pending`.
* `BE1-W6-02 (API Top Reseller & Đối soát Budget cho Merchant)`: View/RPC tổng hợp chỉ số doanh số, hoa hồng và bộ lọc ngân sách theo commission rate.
* `BE1-W6-03 (Microservice Bóc tách Tương tác TikTok)`: Endpoint nhận URL TikTok của Reseller, tự động cào View/Like/Comment và tính Engagement Score.
* `BE1-W6-04 (Cơ chế Tích điểm thưởng Merchant)`: Schema và trigger quy đổi lượt xem/tim của video thành điểm thưởng cho Merchant.
* `BE1-W6-05 (Tối ưu API Attribution & Thanh toán Storefront)`: Phối hợp cùng FE Chính đảm bảo ghi nhận đơn hàng và cộng ví Reseller không bị duplicate.

### C. Frontend Phụ / Hỗ trợ
* `FE-W6-04 (Trang Top Reseller & Budget Filter cho Merchant)`: Bảng xếp hạng Reseller kèm bộ lọc ngân sách hoa hồng trên Merchant Portal.
* `FE-W6-05 (Giao diện Reseller nộp link TikTok & Thống kê Video)`: Form dán link TikTok và widget hiển thị chỉ số tương tác theo thời gian thực.
* `FE-W6-06 (Widget Điểm thưởng Merchant trên Dashboard)`: Hiển thị số điểm tích lũy và nút đổi điểm ưu đãi.

### D. Quality Assurance & Testing
* `QA-W6-01 (E2E Test Luồng Mua vé qua Link Reseller)`: Kiểm thử từ click link `/r/[code]` $\rightarrow$ Xem tour $\rightarrow$ Quét VietQR $\rightarrow$ Kiểm tra ví Reseller nhảy số.
* `QA-W6-02 (Kiểm định Chất lượng Video 40–50s)`: Đánh giá độ dài, độ mượt của B-roll và chất lượng giọng đọc AI theo rubric review.
