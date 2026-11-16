# MY WORK PLAN — BE3_W6
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 6 (16/11/2026 – 21/11/2026) — Sprint 6 (Mentor Feedback Alignment & Automation Upgrade)  
**Member:** Thái Thanh Tú (Automation & Analytics Lead)  
**Role:** Backend Developer 3 (TikTok Social Analytics, n8n Automation Workflows & Merchant Gamification Engine)  
**Current Milestone:** TỰ ĐỘNG HÓA CÀO SỐ LIỆU TIKTOK & ENGINE TÍCH ĐIỂM THƯỞNG CHO MERCHANT  
**Deadline:** 17:00 Thứ Bảy (21/11/2026)  
**Branch:** `feature/be3-w6-tiktok-analytics-and-gamification` (tách từ `dev`)  

---

## 1. Context & Trọng tâm Kỹ thuật Sprint 6

### 1.1. Bối cảnh & Yêu cầu từ Mentor:
1. **Reseller dán link TikTok:** Cần tính năng cho Reseller nộp link video TikTok mà họ đã đăng để quảng bá tour $\rightarrow$ Tool tự động bóc tách số liệu View, Like, Comment, Share để đánh giá hiệu quả tiếp thị.
2. **Quy đổi tương tác thành điểm thưởng cho Merchant:** Nếu Merchant tự tạo video và video có tương tác tốt, hệ thống sẽ quy đổi các chỉ số này thành Điểm thưởng (Merchant Reward Points).

### 1.2. Trọng tâm của BE3 trong Tuần 6:
1. **Xây dựng TikTok Metrics Scraper Worker:**
   - Xây dựng module/workflow n8n hoặc worker Python nhận link video TikTok (`https://www.tiktok.com/@.../video/...`).
   - Cào dữ liệu theo thời gian thực: `playCount`, `diggCount` (Likes), `commentCount`, `shareCount`.
   - Tính toán công thức `Engagement Score` và cập nhật vào bảng `reseller_tiktok_posts`.
2. **Hệ thống Điểm Thưởng Gamification cho Merchant:**
   - Thiết lập bảng `merchant_points` và bảng lịch sử giao dịch điểm `merchant_point_transactions`.
   - Trigger tự động: Khi video của Merchant đạt các mốc tương tác (VD: 5.000 views, 500 likes), tự động cộng điểm thưởng cho Merchant tương ứng.
   - Viết API cho phép Merchant kiểm tra số dư điểm và lịch sử cộng điểm.

---

## 2. THIS WEEK — MY TASKS

| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|:---:|:---:|---|:---:|---|:---:|
| **BE3-W6-01** | **Xây dựng API & Worker cào số liệu tương tác video TikTok** | **P0** | `IN_PROGRESS` | TikTok API | BE3 | Endpoint `POST /api/reseller/tiktok-posts` bóc tách view/like/comment | 18/11 17:00 |
| **BE3-W6-02** | **Công thức tính Engagement Score & Sync tự động định kỳ** | **P1** | `TODO` | BE3-W6-01 | BE3 | Job cập nhật lại chỉ số video sau mỗi 6 tiếng | 19/11 17:00 |
| **BE3-W6-03** | **Xây dựng Schema & Logic tích Điểm Thưởng cho Merchant** | **P0** | `TODO` | BE1 DB | BE3 | Bảng `merchant_points`, trigger cộng điểm khi video viral | 20/11 12:00 |
| **BE3-W6-04** | **Bàn giao API Endpoint cho FE Phụ (Tester 3) gắn UI** | **P1** | `TODO` | BE3-W6-01 | BE3 | Tài liệu API contract và mock data phục vụ FE ráp giao diện | 20/11 17:00 |

---

## 3. TASK BREAKDOWN (CHI TIẾT THỰC THI)

### Task `BE3-W6-01`: API & Worker Cào Tương Tác TikTok
* **Công nghệ:** Sử dụng TikTok oEmbed API kết hợp HTTP Scraper nhẹ nhàng không cần API Key phức tạp.
* **Payload xử lý:**
  ```json
  {
    "resellerId": "22222222-2222-2222-2222-111111111111",
    "campaignId": "44444444-4444-4444-4444-444444444444",
    "tiktokUrl": "https://www.tiktok.com/@danangreview/video/73849102938472910"
  }
  ```
* **Dữ liệu trích xuất & lưu DB:**
  - `views_count`: Lượt xem video.
  - `likes_count`: Lượt thả tim.
  - `comments_count`: Lượt bình luận.
  - `shares_count`: Lượt chia sẻ.
  - `engagement_score = views * 0.1 + likes * 1.0 + comments * 2.0 + shares * 3.0`.
* **DoD:** Nộp link TikTok hợp lệ, hệ thống trả về kết quả số liệu trong vòng $< 3$ giây.
