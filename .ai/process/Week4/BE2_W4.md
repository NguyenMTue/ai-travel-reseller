# MY WORK PLAN — BE2_W4
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 4 (26/10/2026 – 31/10/2026) — Sprint 4  
**Member:** Nguyễn Huỳnh (AI / RAG & Multimodal Lead)  
**Role:** Backend Developer 2 (AI Sales Agent, Multimodal Prompts & Guardrails)  
**Current Milestone:** VIDEO QUALITY ENGINE REFINEMENT, AUDIO DUCKING & SCOPE STABILIZATION  
**Deadline:** 17:00 Thứ Sáu (30/10/2026)  
**Branch:** `feature/be2-w4-scene-alignment-guardrails` (tách từ `dev`)  

---

## 1. Context
- Kế thừa thành quả Sprint 3: Phân loại 6 Intent khách hàng của Sales Agent, Gemini Video Analyzer Adapter và Generator Adapter đã được tích hợp và kiểm thử offline deterministic hoàn tất.
- **Cập nhật Lộ trình:** Chu kỳ dự án được nới sang 5 tuần. Khối lượng công việc tuần này được tinh gọn đáng kể. BE2 không mở rộng thêm model hay persona mới mà tập trung làm sâu khớp nối kỹ thuật với BE1 và khóa chặt an toàn thông tin.
- **Trọng tâm BE2 Tuần 4:**
  1. Khớp nối kịch bản phân cảnh 14-scenes: Tinh chỉnh đầu ra JSON của Gemini để mọi trường dữ liệu (`visual_prompt`, `shot_instruction`, `narration`, `on_screen_text`, `camera_motion`) ánh xạ chính xác $100\%$ vào cấu trúc `generator.ts` của BE1.
  2. Tuyệt đối bảo toàn placeholder `[LINK_MUA_VE]`: Không để AI tự sinh URL lung tung.
  3. Rà soát Anti-Hallucination: Chạy lại bộ kiểm thử 10 kịch bản adversarial trên Sales Agent, đảm bảo bot không bịa giá tour hay chính sách hủy vé khi khách hàng hỏi về video giới thiệu tour.

---

## 2. Executive Summary
Trong Sprint 4, BE2 đóng vai trò là "người cung cấp kịch bản chuẩn mực" cho cỗ máy làm video của BE1:
1. **Scene-level Alignment:** Hoàn thiện bridge nối từ kịch bản BE2 sang Core Video Engine của BE1.
2. **Deterministic Guardrails:** Giữ vững tiêu chuẩn Fail-Closed: Thiếu dữ kiện thực tế là dừng ngay, không sinh bừa bãi.
3. **Safety Verification:** Hỗ trợ Tester 2 kiểm tra độ trung thực (Grounding) của kịch bản video AI.

---

## 3. THIS WEEK — MY TASKS

| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|:---:|:---:|---|:---:|---|:---:|
| **BE2-W4-01** | Khớp nối JSON Schema kịch bản 14 scenes vào data contract của BE1 Engine | **P1** | `IN_PROGRESS` | BE1 Video Contract | BE2 | `video-generator.ts` output khớp 100% BE1 input | 28/10 17:00 |
| **BE2-W4-02** | Khóa chặt Anti-Hallucination cho Sales Agent khi tư vấn video chiến dịch | **P1** | `READY` | Hallucination Suite | BE2 | 10/10 Adversarial cases PASS | 30/10 12:00 |
| **BE2-W4-03** | Hỗ trợ Tester 2 kiểm tra độ trung thực kịch bản video theo Rubric W3 | **P2** | `READY` | Rubric W3 | BE2 | Báo cáo Grounding & Brand Safety | 30/10 17:00 |

---

## 4. DEFINITION OF DONE (DoD)
- [ ] Mọi kịch bản sinh ra từ Gemini đều giữ nguyên placeholder `[LINK_MUA_VE]`.
- [ ] Không có bất kỳ vi phạm hallucination nào về giá vé hoặc giờ mở cửa.
- [ ] Unit tests `tests/sales-agent.test.ts` và `tests/content-safety.test.ts` đạt 100% PASS.
