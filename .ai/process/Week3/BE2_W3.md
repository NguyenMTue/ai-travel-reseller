# MY WORK PLAN — BE2_W3
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 3 (19/10/2026 – 24/10/2026) — Sprint 3  
**Member:** Nguyễn Huỳnh (AI / RAG & Multimodal Lead)  
**Role:** Backend Developer 2 (AI Sales Agent, Multimodal Prompts & Guardrails)  
**Current Milestone:** COMMERCE FLOW, AI SALES AGENT, PWA & MERCHANT VIDEO GENERATION  
**Deadline:** 17:00 Thứ Sáu (23/10/2026); Demo nghiệm thu: Thứ Bảy (24/10/2026)  
**Branch:** `Feature_BE2_Multimodal_Video_Sales` (tách từ `dev`)  

---

## 1. Context
- Kế thừa thành quả Sprint 2: Hệ thống Prompt 4 Personas, Zod structured output và guardrails đã được merge vào `dev`; kiểm thử live Gemini/n8n vẫn theo dõi riêng do rate limit.
- Trọng tâm Tuần 3:
  1. Nâng cấp AI Sales Agent: Phát hiện ý định mua hàng (Buying Intent) và chốt sale tự động kèm ref link.
  2. Xây dựng năng lực AI Multimodal: Phân tích video mẫu của Merchant (bóc tách visual scenes, tone, pacing, hook) qua Gemini 1.5/2.0 Flash.
  3. Xây dựng Prompt tự động sinh kịch bản video mới bám sát sản phẩm/chiến dịch của Merchant.
- Nguồn tham chiếu: [Roadmap.md](../Roadmap.md), [Week3.md](Week3.md), [PromptCreateTask.md](../PromptCreateTask.md).

---

## 2. Executive Summary
Trong Sprint 3, BE2 mở rộng AI từ văn bản sang đa phương tiện (Multimodal):
1. **Sales Agent Conversion:** Tối ưu system prompt để bot nhận biết khi nào khách muốn đặt tour/vé, tự động gợi ý link thanh toán của Merchant có gắn mã tiếp thị cá nhân.
2. **Video Script Analyzer:** Sử dụng Gemini Multimodal để đọc video mẫu do Merchant tải lên, trích xuất: Hook 3 giây đầu, nhịp dựng, góc quay, phong cách giọng lồng tiếng (Voiceover).
3. **Campaign Video Synthesizer Prompt:** Viết prompt kết hợp kịch bản mẫu vừa bóc tách với thông tin tour thật trong database (`products`, `campaigns`) để sinh kịch bản video du lịch chuẩn 9:16 cho Merchant.
4. **Guardrails & Testing:** Xây dựng unit test kiểm tra tính chính xác và an toàn của kịch bản video sinh ra.

---

## 3. TODAY — MUST DO (Thứ Hai 19/10/2026)
| Priority | Task | Why | Dependency | Output | Estimated Effort | Status |
|---|---|---|---|---|---|---|
| P0 | Họp Kick-off Sprint 3 & Chốt format JSON cho Video Script | Đồng bộ với BE1 (Core Video Engine) để tích hợp vào backend pipeline | Toàn team | Interface contract video | 1.5h | READY |
| P0 | BE2-W3-01: Nâng cấp System Prompt Sales Agent (Buying Intent) | Tăng tỷ lệ chuyển đổi chốt đơn của chatbot | PRD v1.0 | Code `src/lib/ai/sales-agent.ts` | 3h | READY |
| P1 | Khảo sát & thử nghiệm Gemini Multimodal Video API | Đảm bảo Gemini nhận diện tốt video 9:16 du lịch | Gemini API key | Script test python/ts | 2.5h | READY |

---

## 4. THIS WEEK — MY TASKS
| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|---|---|---|---|---|---|
| BE2-W3-01 | System Prompt AI Sales Agent nhận diện Buying Intent | P0 | DONE | Tuần 2 RAG code | BE2 | Code cập nhật `sales-agent.ts` + 5/5 test intent PASS | 20/10 17:00 |
| BE2-W3-02 | Prompt Multimodal Gemini phân tích kịch bản video mẫu | P0 | OFFLINE DONE — LIVE PENDING | Gemini API | BE2 | Module `video-analyzer.ts` + schema JSON trích xuất | 21/10 12:00 |
| BE2-W3-03 | Prompt sinh kịch bản video áp dụng thông tin chiến dịch | P0 | OFFLINE DONE — LIVE PENDING | BE2-W3-02 | BE2 | Module `video-generator.ts` + Zod schema kịch bản 9:16 | 22/10 12:00 |
| BE2-W3-04 | Handoff prompt, JSON schema kịch bản video cho **BE1 (Core Video Engine)** & Tester 2 | P1 | DONE | BE2-W3-02, 03 | BE2 | Tài liệu Handoff + Test samples | 22/10 17:00 |
| BE2-W3-05 | Phối hợp Tester 2 chạy benchmark độ an toàn kịch bản video | P1 | OFFLINE PASS — LIVE PENDING | Tester 2 | BE2 | Báo cáo benchmark an toàn video | 23/10 17:00 |

### Cập nhật thực thi 20/10/2026

- Offline suite: 38/38 test BE2 PASS; 17/17 regression test Tester 2 PASS.
- TypeScript typecheck và ESLint cho toàn bộ file thay đổi: PASS.
- Chưa gọi Gemini, chưa chạy n8n và chưa ghi Supabase trong giai đoạn offline.
- Handoff: `docs/be2/week3-sales-video-handoff.md` cùng hai JSON Schema và hai sample output.

---

## 5. TASK BREAKDOWN (THEO PROMPT CREATETASK)

### A. Những việc tôi PHẢI làm:
- Nâng cấp logic hội thoại của Chatbot trong `src/lib/ai/sales-agent.ts` để nhận diện ý định mua hàng của khách.
- Xây dựng prompt Multimodal đọc video mẫu và prompt sinh kịch bản video du lịch.
- Viết Zod Schema xác thực dữ liệu đầu ra của kịch bản video (scene list, narration, duration, visual_prompts).

### B. Những việc tôi NÊN làm tiếp theo:
- Chuẩn hóa bộ prompt đa ngôn ngữ (Tiếng Anh, Tiếng Hàn) cho khách quốc tế khi hỏi về tour Đà Nẵng / Hội An.

### C. Những việc tôi KHÔNG NÊN làm:
- Không viết code workflow n8n (thuộc trách nhiệm của BE3).
- Không tự ý can thiệp vào schema bảng `orders` của BE1.

### D. Những thứ tôi cần bàn giao:
- Prompt templates và Zod schema kịch bản video $\rightarrow$ Bàn giao cho **BE1 (Tuệ)** để nạp vào Core Video Generation Engine backend.
- Sample outputs kịch bản video $\rightarrow$ Bàn giao cho Tester 2 chạy rubric kiểm định.

### E. Những thứ tôi cần yêu cầu team:
- Cần BE1 cung cấp trường dữ liệu `media_references` để khớp ID video mẫu.
- Cần Tester 2 cung cấp bộ test cases ép AI bịa đặt khuyến mãi trong video.
