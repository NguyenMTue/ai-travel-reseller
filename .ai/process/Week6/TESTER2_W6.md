# MY WORK PLAN — TESTER2_W6
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 6 (16/11/2026 – 21/11/2026) — Sprint 6 (Mentor Feedback Alignment & Automation Upgrade)  
**Member:** Trần Văn Minh (AI Safety & Security QA)  
**Role:** AI Safety QA (Video Quality Rubric Evaluation, TikTok Scraping Security & Point Engine Verification)  
**Current Milestone:** KIỂM ĐỊNH CHẤT LƯỢNG VIDEO REVIEW 40–50s, AN TOÀN DỮ LIỆU & ENGINE TÍCH ĐIỂM  
**Deadline:** 17:00 Thứ Bảy (21/11/2026)  
**Branch:** `test/qa-w6-video-quality-and-points-verification`  

---

## 1. Trọng tâm Kiểm thử Sprint 6

### 1.1. Mục tiêu kiểm định:
1. **Kiểm định Chất lượng Video Review 40–50s (Theo Rubric AI):**
   - Đảm bảo video không còn là ảnh tĩnh ghép lại đơn điệu mà có chuyển động B-roll sống động.
   - Kiểm tra thời lượng video thực tế: phải nằm trong ngưỡng chấp thuận từ **40s đến 50s**.
   - Kiểm tra âm thanh: Giọng đọc tiếng Việt tự nhiên, không bị vấp chữ, nhạc nền tự giảm nhỏ khi có lời thoại (Audio ducking).
   - Kiểm định Anti-Hallucination: Kịch bản không được bịa đặt sai giá vé hoặc địa điểm du lịch không có thật.
2. **Kiểm định An toàn Dữ liệu & Tool Cào TikTok:**
   - Test nhập các link TikTok bất thường (link hỏng, link private, link spam) $\rightarrow$ Đảm bảo tool bắt lỗi an toàn (graceful error handling), không làm crash backend.
   - Rà soát chính sách RLS cho bảng `reseller_tiktok_posts` và `merchant_points`.
3. **Kiểm thử Logic Tích Điểm Merchant:**
   - Giả lập tăng tương tác $\rightarrow$ Đảm bảo điểm thưởng cộng đúng tỷ lệ, không bị lỗi lặp điểm (double-awarding).

---

## 2. THIS WEEK — MY TASKS (TESTER 2)

| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|:---:|:---:|---|:---:|---|:---:|
| **TEST2-W6-01** | **Xây dựng Bộ Rubric & Kiểm định Chất lượng Video 40–50s do AI tự sinh** | **P0** | `DONE` | BE1 & BE2 Video | Văn Minh | Báo cáo đánh giá 5 video mẫu (Thời lượng, Âm thanh, B-roll) $\ge 9.0/10$ | 19/11 17:00 |
| **TEST2-W6-02** | **Kiểm thử An toàn & Khả năng Chịu lỗi của Tool cào tương tác TikTok** | **P1** | `DONE` | BE3 Worker | Văn Minh | Bộ test cases với 10 loại URL TikTok khác nhau, 0 unhandled exception | 20/11 12:00 |
| **TEST2-W6-03** | **Kiểm định Cơ chế Tích Điểm Thưởng Gamification cho Merchant** | **P1** | `DONE` | BE3 DB | Văn Minh | Biên bản test tích điểm đúng quy chế, chống gian lận số liệu | 20/11 17:00 |
| **TEST2-W6-04** | **Phối hợp Tester 1 chạy Regression Suite toàn hệ thống trước Demo** | **P0** | `DONE` | All Features | Văn Minh | Toàn bộ 32 routes chạy ổn định, không phát sinh lỗi bảo mật | 21/11 12:00 |
