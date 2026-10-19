# MY WORK PLAN — TESTER2_W3 (AI SAFETY QA)
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 3 (19/10/2026 – 24/10/2026) — Sprint 3  
**Member:** Tester 2 (AI Safety & Prompt QA)  
**Role:** AI Quality Assurance & Content Safety Specialist  
**Current Milestone:** COMMERCE FLOW, AI SALES AGENT, PWA & MERCHANT VIDEO GENERATION  
**Deadline:** 17:00 Thứ Sáu (23/10/2026); Demo nghiệm thu: Thứ Bảy (24/10/2026)  
**Branch:** `Feature_QA_W3_AI_Safety` (tách từ `dev`)  

---

## 1. Context
- Kế thừa thành quả Sprint 2: 13/13 bài test an toàn nội dung văn bản đạt 100% PASS, hoàn thành bộ rubric đánh giá Groundedness và báo cáo tuân thủ chính sách du lịch.
- Trọng tâm Tuần 3:
  1. Kiểm thử AI Sales Agent chốt sale: Đảm bảo khi phát hiện Buying Intent, bot không bao giờ bịa đặt chính sách hoàn hủy, không tự cấp voucher ảo ngoài chương trình của Merchant.
  2. Kiểm định chất lượng kịch bản video do Gemini Multimodal sinh ra từ video mẫu: Đảm bảo mô tả visual scenes và lời lồng tiếng khớp 100% với tour thật.
- Nguồn tham chiếu: [Roadmap.md](../Roadmap.md), [Week3.md](Week3.md), [PromptCreateTask.md](../PromptCreateTask.md).

---

## 2. Executive Summary
Tester 2 đóng vai trò chốt chặn an toàn cho mọi output AI trong hệ sinh thái:
1. **Adversarial Testing trên AI Sales Agent:** Tấn công prompt injection, dụ bot giảm giá tour Bà Nà Hills/Hội An, dụ bot cấp mã giảm giá 50% giả mạo.
2. **Video Script Groundedness:** Đánh giá kịch bản video AI tạo ra có phản ánh đúng hình ảnh, giờ mở cửa và địa điểm của điểm đến du lịch hay không.
3. **Safety Rubric v2.0:** Nâng cấp bảng tiêu chí chấm điểm bao gồm cả tiêu chí kịch bản video ngắn (Shorts/Reels 9:16).

---

## 3. THIS WEEK — MY TASKS
| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|---|---|---|---|---|---|
| T2-W3-01 | Nâng cấp Rubric đánh giá kịch bản Video AI & AI Sales Agent | P1 | READY | BE2-W3-01 | Tester 2 | File `docs/tester2/AI_VIDEO_RUBRIC_W3.md` | 20/10 17:00 |
| T2-W3-02 | Chạy Test Suite tấn công chống Hallucination AI Sales Agent | P0 | READY | BE2-W3-01 | Tester 2 | Bộ 10 test cases adversarial + log kết quả | 22/10 12:00 |
| T2-W3-03 | Đánh giá kịch bản video do n8n sinh từ video mẫu Merchant | P0 | READY | BE3-W3-02, BE2-W3-03 | Tester 2 | Báo cáo Groundedness Video Script | 23/10 12:00 |
| T2-W3-04 | Báo cáo Tổng kết An toàn AI Sprint 3 (AI Safety Acceptance) | P0 | READY | T2-W3-01..03 | Tester 2 | Báo cáo nghiệm thu an toàn AI | 23/10 17:00 |

---

## 4. NHỮNG THỨ TÔI BÀN GIAO VÀ YÊU CẦU

### Những thứ tôi bàn giao:
- Báo cáo an toàn AI Sales Agent xác nhận tỷ lệ hallucination = 0%.
- Báo cáo kiểm định kịch bản video mẫu đạt tiêu chuẩn phát hành cho Merchant.

### Những thứ tôi yêu cầu từ team:
- Cần BE2 bàn giao prompt Buying Intent và mẫu kịch bản video trước Thứ Tư (21/10).
- Cần BE3 xuất 3-5 mẫu kịch bản video sinh tự động từ n8n để chạy kiểm tra.
