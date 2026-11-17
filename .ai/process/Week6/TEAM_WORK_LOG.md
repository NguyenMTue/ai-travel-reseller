# NHẬT KÝ LÀM VIỆC CẢ NHÓM (TEAM WORK LOG) — TUẦN 6
**Dự án:** AI Travel Reseller MVP (TravelLink AI)  
**Thời gian:** 16/11/2026 – 21/11/2026  
**Mục tiêu Sprint 6:** Tiếp thu & triển khai 5 nhận xét trọng điểm của Mentor, nâng cấp luồng tạo video 40–50s tự động, hoàn thiện tính hoa hồng & cải tổ toàn diện giao diện Storefront Tour + Thanh toán cho khách mở từ link Reseller.

---

## 1. BẢNG THEO DÕI TIẾN ĐỘ THÀNH VIÊN (SPRINT 6)

| Thành viên | Vai trò | Mã Task chính | Trọng tâm tuần này | Trạng thái hiện tại |
| :--- | :--- | :--- | :--- | :---: |
| **Nguyễn Minh Tuệ** | PM & BE1 Lead | `PM-W6-01..03`<br/>`BE1-W6-01..05` | Background Worker sinh Video 40–50s, API Top Reseller theo Budget, điều phối Sprint | `DONE (BE1)` / `IN_PROGRESS (PM)` |
| **Cao Thị Thu Diệu** | FE Lead | `FE-W6-01..04` | **TRỌNG TÂM:** Redesign Header nhận diện Reseller, Tour Content Mobile, Modal VietQR 3 bước | `IN_PROGRESS` |
| **Nguyễn Huỳnh** | BE2 (AI & RAG) | `BE2-W6-01..04` | Kịch bản Review TikTok 40–50s qua Groq, TTS Voiceover tiếng Việt, B-roll tag matcher | `IN_PROGRESS` |
| **Thái Thanh Tú** | BE3 (Automation) | `BE3-W6-01..04` | Microservice cào số liệu video TikTok (View, Like, Comment), Schema tích điểm Merchant | `IN_PROGRESS` |
| **Lê Mỹ Uyên** | BA Lead | `BA-W6-01..04` | Đặc tả nghiệp vụ hoa hồng Reseller, công thức tích điểm Merchant, kịch bản UAT | `IN_PROGRESS` |
| **Nguyễn Phước Quý Bửu** | UI/UX Designer | `UIUX-W6-01..04` | Thiết kế Mobile-First trang Tour, Modal VietQR Napas247, Mockup Top Reseller | `IN_PROGRESS` |
| **Trương Đức Huy** | QA Lead | `TEST1-W6-01..04` | Kịch bản Playwright E2E luồng mua vé qua link Reseller, kiểm thử tương thích Mobile | `IN_PROGRESS` |
| **Trần Văn Minh** | AI Safety QA | `TEST2-W6-01..04` | Kiểm định chất lượng video 40–50s theo Rubric, bảo mật RLS & chống gian lận điểm | `TODO` |
| **Nguyễn Anh Tuấn** | FE Junior (Tester 3) | `FE-T3-W6-01..04` | Form dán link TikTok cho Reseller, Modal Top Reseller & Widget Điểm thưởng Merchant | `IN_PROGRESS` |

---

## 2. NHẬT KÝ HOẠT ĐỘNG HẰNG NGÀY

### Ngày 16/11/2026 (Thứ Hai) — Sprint Kick-off & Alignment
* **09:00 - 10:30:** Họp Sprint Kick-off Tuần 6 do PM Nguyễn Minh Tuệ chủ trì:
  - Phổ biến 5 nhận xét của Mentor về: Video dài 40–50s thay vì ảnh tĩnh, tính hoa hồng cho Reseller, bảng Top Reseller đối soát theo budget, Reseller dán link TikTok để lấy Like/Comment, và tích điểm cho Merchant khi video viral.
  - Thống nhất quyết định: **FE Chính (Diệu) tập trung toàn lực vào trang Thông tin Tour & Thanh toán Mobile khi mở từ link Reseller**.
  - BE1 & BE2 bắt tay vào luồng tự động hóa sinh video ngầm để Merchant chỉ việc vào duyệt.
* **14:00 - 17:30:**
  - UI/UX Quý Bửu bắt đầu dựng wireframe Mobile-First cho trang Storefront có Referral Badge.
  - BE2 Nguyễn Huỳnh thử nghiệm cấu trúc Prompt 4 phân cảnh 40–50s trên Groq Cloud API.
  - BE3 Thái Thanh Tú thử nghiệm cào metadata từ TikTok oEmbed API.

### Ngày 17/11/2026 (Thứ Ba) — Hoàn thành 5/5 Tasks BE1, Tạo PR & Verify Production Build
* **08:30 - 12:00:**
  - BE1 Nguyễn Minh Tuệ hoàn thành `BE1-W6-01` (Auto Video Pipeline 46s, 4 scenes TikTok review, Edge-TTS, FFmpeg audio ducking, lưu Supabase Storage & bảng `contents`).
  - Hoàn thành `BE1-W6-02` (RPC & API Top Reseller theo Budget hoa hồng cho Merchant) và `BE1-W6-05` (Order confirmation & eTicket).
  - Khởi tạo nhánh `feature/be1-w6-auto-video-pipeline-and-commission` và đẩy Pull Request lên origin.
* **13:00 - 15:30:**
  - BE1 tiếp tục hoàn thành `BE1-W6-03` (TikTok engagement metrics scraper qua oEmbed API & heuristic) và `BE1-W6-04` (Bảng `merchant_points`, stored procedure cộng điểm thưởng khi video viral).
  - Khởi tạo nhánh `feature/be1-w6-tiktok-analytics-and-merchant-points` và đẩy Pull Request.
  - Chạy `npm run test:be1:w6` đạt **10/10 PASS**, `npm run test:be1:sprint` đạt **4/4 PASS**.
  - Kiểm tra Production Build (`next build`), phát hiện và xử lý triệt để 4 lỗi TypeScript, tối ưu Turbopack tracing. Build thành công 42/42 routes với mã thoát 0.
  - Cập nhật tài liệu kỹ thuật, phân tích tính khả thi Docker Muse2API và lập Pre-deployment Checklist chi tiết trong `BE1_W6.md`.

