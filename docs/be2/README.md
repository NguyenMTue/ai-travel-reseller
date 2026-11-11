# BE2 Documentation & Handoff Hub
## PHÂN HỆ BACKEND 2 (AI SALES AGENT, CONTENT FACTORY & MULTIMODAL VIDEO)

---

Thư mục lưu trữ toàn bộ tài liệu kỹ thuật, hợp đồng tích hợp (Handoff Agreements), kịch bản kiểm định an toàn AI và bản phân công nhiệm vụ của phân hệ **Backend 2 (Nguyễn Huỳnh — AI & RAG Lead)**.

---

## 1. Nhiệm vụ Nước rút Đóng gói Dự án trong Ngày (Sprint Cuối)

1. **Bảng Phân công Tác vụ Nước rút BE2 (Hoàn thành trong ngày 11/11/2026):**
   - [`final_sprint_task_assignment_be2.md`](./final_sprint_task_assignment_be2.md): **(MỚI)** Bảng đặc tả chi tiết 4 nhiệm vụ của BE2 cam kết Zero Merge Conflict với BE1:
     - **Task BE2-01**: Webhook Nhận kết quả thanh toán đơn hàng đối tác (`POST /api/webhooks/merchant/order`).
     - **Task BE2-02**: Cấp phát & Hiển thị mã Voucher ký tự (`FR-ATT-01`) trên modal phân phối của Reseller.
     - **Task BE2-03**: Chatbot AI nhận diện mã Voucher và tự động gắn vào Checkout URL.
     - **Task BE2-04**: API Polling trạng thái Video AI chống lỗi timeout 504 trên Vercel Serverless.

---

## 2. Danh mục Tài liệu AI Architecture, Safety & Guardrails (Sprint 4 – Sprint 5)

1. **Kiến trúc AI Production & An toàn Đa tầng (Sprint 5):**
   - [`AI_PRODUCTION_ARCHITECTURE_AND_SAFETY.md`](./AI_PRODUCTION_ARCHITECTURE_AND_SAFETY.md): Kiến trúc AI Gateway, Intent Taxonomy, Dual Temperature configuration, Circuit Breaker tự ngắt và cơ chế Fail-Closed.
2. **Nhật ký Giám sát UAT Chatbot & Handoff Nhân sự (Sprint 5):**
   - [`uat-chat-audit-log-w5.md`](./uat-chat-audit-log-w5.md): Ghi nhận 20 phiên trò chuyện thực địa, đối chiếu tỷ lệ trả lời đúng giá vé, bảo vệ PII và xử lý câu hỏi ngoài phạm vi (`FR-AIS-10`..`14`).
3. **Báo cáo Thẩm định Chống Ảo giác Video AI (Sprint 4):**
   - [`video-grounding-audit-w4.md`](./video-grounding-audit-w4.md): Báo cáo thẩm định tính xác thực địa lý, tỷ lệ 9:16 và chống xuyên tạc kiến trúc trong kịch bản video.
4. **Báo cáo An toàn Video Offline (Sprint 3 – 4):**
   - [`video-safety-offline-report.md`](./video-safety-offline-report.md): Thử nghiệm offline an toàn cho pipeline phân tích video mẫu qua Gemini Files API.

---

## 3. Danh mục Bàn giao Kỹ thuật & Hợp đồng Dữ liệu (Sprint 2 – Sprint 3)

1. **Bàn giao Sales Agent & Multimodal Video Prompt (Tuần 3):**
   - [`week3-sales-video-handoff.md`](./week3-sales-video-handoff.md): Bàn giao 6 nhóm Intent của Sales Agent, quy chuẩn Checkout URL, `DefaultVideoUploadTransport` có DNS Pinning và CIDR blocking.
2. **System Prompt Travel Video Director Agent:**
   - [`system_prompt_travel_video_director_agent.md`](./system_prompt_travel_video_director_agent.md): System prompt gốc của Đạo diễn Video Du lịch AI với 14 phân cảnh chuẩn.
3. **Bàn giao Content Factory (Tuần 2):**
   - [`content-factory-handoff.md`](./content-factory-handoff.md): Hợp đồng dữ liệu 4 Persona (`local_guide`, `family`, `foodie`, `budget_traveler`).
   - [`content-factory-test-report.md`](./content-factory-test-report.md): Báo cáo kiểm thử sinh nội dung tiếp thị 10 hooks + 5 scripts.
   - [`be3-integration-review.md`](./be3-integration-review.md): Biên bản đối soát hợp đồng giữa BE2 và BE3 n8n workflow.

---

## 4. Lệnh Kiểm thử Độc lập Dành cho BE2

```powershell
# 1. Kiểm tra kiểu dữ liệu TypeScript toàn dự án
npx tsc --noEmit

# 2. Chạy bộ kiểm thử AI Gateway, Intent & Grounding (96/96 test cases)
npm run test:be2

# 3. Chạy bộ kiểm thử Content Safety & Anti-Hallucination
npm run test:tester2

# 4. Chạy kiểm thử API Merchant Video
npm run test:merchant-video
```

---
*Tài liệu được quản lý bởi: **Nguyễn Huỳnh — Backend 2 Lead (AI & RAG)***
