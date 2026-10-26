# MY WORK PLAN — TESTER2_W4
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 4 (26/10/2026 – 31/10/2026) — Sprint 4  
**Member:** Tester 2 (AI Safety & Prompt QA Lead)  
**Role:** AI Safety QA (Video Rubric Evaluation, Audio Sync & Anti-Hallucination Audit)  
**Current Milestone:** VIDEO QUALITY ENGINE REFINEMENT, AUDIO DUCKING & SCOPE STABILIZATION  
**Deadline:** 17:00 Thứ Sáu (30/10/2026)  
**Branch:** `feature/t2-w4-video-rubric-evaluation` (tách từ `dev`)  

---

## 1. Context & Trọng tâm Đánh giá
- Trong Sprint 4, Tester 2 là trọng tài đánh giá độc lập cho thành quả cải tiến của BE1 (Core Video Engine):
  1. Thẩm định các mẫu video kết xuất mới của BE1 theo bảng tiêu chí chuẩn mực [`docs/tester2/AI_VIDEO_RUBRIC_W3.md`](file:///E:/Tue/MyProject/AITravelReseller/ai-travel-reseller/docs/tester2/AI_VIDEO_RUBRIC_W3.md):
     - **Chất lượng hình ảnh & chuyển động (Visual & Motion):** Không giật lag, góc lia camera mượt mà, không vỡ hạt 1080x1920.
     - **Chất lượng âm thanh (Audio & Ducking):** Giọng đọc rõ ràng, nhạc nền tự động giảm âm lượng thông minh khi có voice, hiệu ứng âm thanh khớp cảnh.
     - **Tính an toàn thương hiệu (Brand Compliance & Anti-Hallucination):** Phụ đề hiển thị chính xác giá thật, mẹo thật, không bịa đặt số lượng hay quyền lợi tour.
  2. Rà soát độc lập kết quả kiểm thử Adversarial của BE2 trên AI Sales Agent.

---

## 2. THIS WEEK — MY TASKS

| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|:---:|:---:|---|:---:|---|:---:|
| **QA-W4-01** | Thẩm định 03 video mẫu mới của BE1 theo tiêu chuẩn Rubric W3 | **P0** | `READY` | Video MP4 BE1 | Tester 2 | Báo cáo chấm điểm Rubric Video W4 (Điểm $\ge 9.0$) | 30/10 12:00 |
| **QA-W4-05** | Kiểm tra độc lập tính an toàn chống Hallucination của AI Sales Agent | **P1** | `READY` | Sales Agent code | Tester 2 | Báo cáo an toàn thông tin du lịch | 30/10 17:00 |

---

## 3. DEFINITION OF DONE (DoD)
- [ ] Báo cáo nghiệm thu Video Rubric đạt điểm xuất sắc cho 2 tour Bà Nà Hills và Phố Cổ Hội An.
- [ ] Xác nhận không có hiện tượng nhạc nền át tiếng thuyết minh AI.
- [ ] Xác nhận vùng Safe Zone đảm bảo 100% chữ đọc rõ ràng trên màn hình điện thoại.
