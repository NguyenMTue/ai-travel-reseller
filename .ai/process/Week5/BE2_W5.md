# MY WORK PLAN — BE2_W5
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 5 (02/11/2026 – 07/11/2026) — Sprint 5 (Sprint Cuối / Final Sprint)  
**Member:** Nguyễn Huỳnh (AI / RAG & Multimodal Lead)  
**Role:** Backend Developer 2 (AI Sales Agent Production RAG, Multi-intent Routing & Guardrails)  
**Current Milestone:** FINAL E2E UAT, PERFORMANCE STRESS TESTING, RLS SECURITY AUDIT & PRODUCTION GO-LIVE  
**Deadline:** 17:00 Thứ Bảy (07/11/2026)  
**Branch:** `feature/be2-w5-production-ai-guardrails` (tách từ `dev`)  

---

## 1. Context & Trọng tâm Kỹ thuật Sprint 5
- Kế thừa thành quả Sprint 4: Khóa chặt 100% Anti-Hallucination với 46/46 tests PASS (10 ca đối kháng + 33 ca thực tế); hoàn thiện bộ Verified Facts Catalog 5 tầng (`video-verified-facts-w4.json`) bảo đảm dữ kiện kịch bản video không bịa đặt.
- **Trọng tâm BE2 trong Tuần 5 — Ổn định AI Sales Agent trên Production & Hỗ trợ UAT:**
  1. **Deploy AI Gateway & Production Endpoints:** Cấu hình khóa API Gemini Production chính thức với hạn ngạch (quota) ổn định, thiết lập cơ chế fallback sang mô hình phụ nếu Google Gemini API tạm thời nghẽn luồng.
  2. **Xác thực Grounding & Intent Routing trên Môi trường Production:** Đảm bảo khi du khách chat với bot từ link tiếp thị `/r/[code]`, chatbot nhận diện chuẩn xác 6 mức độ ý định (Intent Taxonomy) và trả lời đúng giá vé, giờ mở cửa của tour mà không bao giờ bịa đặt.
  3. **Giám sát Hội thoại Real-time trong Phiên UAT (04/11):** Theo dõi logs tương tác giữa người dùng thử nghiệm và bot, can thiệp điều chỉnh prompt ngay lập tức nếu xuất hiện câu hỏi góc khuất (edge cases).
  4. **Đóng gói Báo cáo An toàn AI (AI Safety & Grounding Audit):** Bàn giao báo cáo thẩm định kỹ thuật chứng minh bot an toàn $100\%$, sẵn sàng nghiệm thu trước Hội đồng chuyên môn.

---

## 2. THIS WEEK — MY TASKS

| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|:---:|:---:|---|:---:|---|:---:|
| **BE2-W5-01** | Cấu hình Gemini Production API Gateway, Rate Limiting & Fallbacks | **P0** | `COMPLETED` | Keys Production | BE2 | AI Gateway active, Circuit Breaker & Dual Temperature calibrated | 02/11 17:00 |
| **BE2-W5-02** | Khóa chặt Intent Routing & Production Grounding cho Sales Agent | **P0** | `READY` | BE2-W5-01 | BE2 | 100% intent chốt deal kèm đúng URL mua vé | 03/11 17:00 |
| **BE2-W5-03** | Trực chiến giám sát AI Logs & Tinh chỉnh Prompt trong phiên UAT | **P1** | `READY` | Phiên UAT BA | BE2 | Nhật ký audit 50 phiên chat thực tế | 04/11 17:00 |
| **BE2-W5-04** | Đóng gói Báo cáo Kiến trúc AI & Bằng chứng Grounding Bàn giao | **P1** | `READY` | Hoàn tất UAT | BE2 | `docs/be2/AI_PRODUCTION_ARCHITECTURE_AND_SAFETY.md` | 06/11 17:00 |

---

## 3. TASK BREAKDOWN (CHI TIẾT THỰC THI)

### Task `BE2-W5-01`: Cấu hình AI Production Gateway & Quotas
* **Mục tiêu:** Đảm bảo dịch vụ tư vấn AI phản hồi tức thì và không bị gián đoạn do hết quota trong phiên UAT và Go-Live.
* **Các bước triển khai:**
  - [x] Thiết lập API key Gemini Production có hạn mức thanh toán trả trước (Pay-as-you-go).
  - [x] Cấu hình cơ chế Circuit Breaker: Tự động retry tối đa 2 lần khi gặp lỗi `429 Too Many Requests`, ngắt mạch nhanh failover sang KB nếu lỗi dồn dập.
  - [x] Khóa nhiệt độ mô hình (`temperature = 0.2` cho tư vấn giá vé/chính sách/chốt đơn, `temperature = 0.5` cho lời chào mời tự nhiên).
  - [x] Viết unit test xác thực Gateway và tích hợp vào test suite hồi quy `test:be2` (85/85 tests PASS).
* **DoD:** Đã hoàn thành, 85/85 tests PASS, circuit breaker & dual temperature hoạt động hoàn hảo.

### Task `BE2-W5-02`: Production Grounding & Intent Routing
* **Mục tiêu:** Bảo đảm bot luôn chuyển đổi khách hàng tiềm năng thành đơn hàng qua liên kết tiếp thị chính xác.
* **Các bước triển khai:**
  - [ ] Kiểm tra tích hợp biến ngữ cảnh `reseller_id`, `campaign_id` và `product_id` trong prompt hệ thống.
  - [ ] Xác thực placeholder `[LINK_MUA_VE]` được tự động thay thế bằng đường dẫn thanh toán hợp lệ của Merchant có gắn attribution code.
  - [ ] Chạy lại 10 kịch bản adversarial trên môi trường Staging/Production trước giờ G.
* **DoD:** Tỷ lệ đưa đúng link thanh toán đạt $100\%$ khi người dùng thể hiện ý định mua hàng (Intent: `READY_TO_BUY`).

### Task `BE2-W5-03`: Giám sát Real-time Logs phiên UAT
* **Mục tiêu:** Hỗ trợ người dùng trong phiên UAT có trải nghiệm trò chuyện chân thật và hữu ích nhất.
* **Các bước triển khai:**
  - [ ] Bật chế độ verbose logs ghi nhận câu hỏi của người dùng và câu trả lời của Sales Agent.
  - [ ] Ghi chú các câu hỏi lạ (ví dụ: mang theo trẻ em dưới 1 mét, mang đồ ăn ngoài) để cập nhật bổ sung vào Knowledge Base tức thì.
* **DoD:** Không có cuộc trò chuyện nào bị crash, treo stream hoặc trả về thông tin sai lệch.

---

## 4. DEPENDENCY ANALYSIS

| Task | Dependency | Người phụ trách | Trạng thái |
|---|---|---|:---:|
| BE2-W5-01 | Production Keys & Vercel env | BE1, DevOps | `READY` |
| BE2-W5-02 | Database Staging/Production | BE1 Lead | `WAITING` |
| BE2-W5-03 | Lịch trình phiên UAT | BA Lead | `WAITING` |

---

## 5. TEAM HANDOFF

| From | To | Deliverable | Format | Deadline |
|---|---|---|---|:---:|
| BE2 Lead | FE Lead (Diệu) | Production Chat Streaming API Endpoint | Route Handler docs | 02/11 17:00 |
| BE2 Lead | Tester 2 (Minh) | Bộ test log 10 adversarial cases trên Production | Markdown report | 03/11 17:00 |
| BE2 Lead | PM & BA | Báo cáo hoàn tất nghiệm thu phân hệ AI | Tài liệu kỹ thuật | 06/11 17:00 |

