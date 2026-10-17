# MY WORK PLAN — BE3_W3
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 3 (19/10/2026 – 24/10/2026) — Sprint 3  
**Member:** Thái Thanh Tú (Automation & Video Pipeline Lead)  
**Role:** Backend Developer 3 (n8n Workflows, Notification & AI Video Pipeline)  
**Current Milestone:** COMMERCE FLOW, AI SALES AGENT, PWA & MERCHANT VIDEO GENERATION  
**Deadline:** 17:00 Thứ Sáu (23/10/2026); Demo nghiệm thu: Thứ Bảy (24/10/2026)  
**Branch:** `Feature_BE3_Video_Notification_Pipeline` (tách từ `dev`)  

---

## 1. Context
- Kế thừa thành quả Sprint 2: Workflow Campaign Content n8n (`workflow_campaign_content.json`) đã được export sạch secret và merge thành công vào `dev`.
- Trọng tâm Tuần 3:
  1. Xây dựng workflow n8n gửi thông báo thời gian thực (Webhook $\rightarrow$ Telegram / Zalo Bot) khi Reseller có lượt click hoặc đơn hàng mới.
  2. Xây dựng workflow n8n tự động hóa pipeline sinh video AI dựa trên kịch bản video mẫu của Merchant (kết hợp prompt của BE2 và asset sản phẩm du lịch).
- Nguồn tham chiếu: [Roadmap.md](../Roadmap.md), [Week3.md](Week3.md), [PromptCreateTask.md](../PromptCreateTask.md).

---

## 2. Executive Summary
Trong Sprint 3, BE3 tập trung vào 2 luồng tự động hóa trọng yếu:
1. **Real-time Notifications:** Khi bảng `orders` hoặc `clicks` có bản ghi mới, webhook kích hoạt n8n gửi tin nhắn thông báo đến Reseller ("Ting ting! Bạn có hoa hồng mới...").
2. **AI Video Generation Pipeline:** Tạo workflow n8n nhận ID video mẫu từ `media_references`, gọi Gemini Multimodal qua prompt của BE2 để bóc tách cảnh, sau đó ghép nối hình ảnh/video asset của tour du lịch để tạo video hoàn chỉnh và cập nhật `contents.video_url`.
3. **Packaging & Documentation:** Xuất file workflow JSON vào repo và viết tài liệu vận hành chi tiết.

---

## 3. TODAY — MUST DO (Thứ Hai 19/10/2026)
| Priority | Task | Why | Dependency | Output | Estimated Effort | Status |
|---|---|---|---|---|---|---|
| P0 | Họp Kick-off Sprint 3 & Chốt payload Webhook thông báo | Thống nhất trigger từ Supabase với BE1 | BE1 | Webhook schema | 1.5h | READY |
| P1 | Khởi tạo cấu trúc Bot Telegram / Zalo Webhook cho Reseller | Chuẩn bị kênh nhận thông báo đơn hàng | Nền tảng n8n | Bot token / Webhook node | 2.5h | READY |
| P1 | Tiếp nhận interface contract video từ BE2 | Hiểu cấu trúc JSON kịch bản video để cấu hình node | BE2 | Tài liệu contract | 2h | READY |

---

## 4. THIS WEEK — MY TASKS
| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|---|---|---|---|---|---|
| BE3-W3-01 | Workflow n8n thông báo đơn hàng / click mới (Telegram / Zalo) | P0 | READY | BE1-W3-01 | BE3 | File `workflow_reseller_notification.json` + test live | 21/10 17:00 |
| BE3-W3-02 | Workflow n8n tạo video AI từ kịch bản mẫu & asset tour | P0 | READY | BE2-W3-02, 03 | BE3 | File `workflow_merchant_video_generation.json` | 23/10 12:00 |
| BE3-W3-03 | Export workflow JSON sạch secret & tài liệu vận hành video | P1 | READY | BE3-W3-01, 02 | BE3 | Docs tại `docs/be3/` + JSON workflows | 23/10 15:00 |
| BE3-W3-04 | Phối hợp phiên nghiệm thu E2E toàn diện Sprint 3 | P0 | READY | Toàn team | BE3 | Test log thông luồng n8n | 23/10 17:00 |

---

## 5. TASK BREAKDOWN (THEO PROMPT CREATETASK)

### A. Những việc tôi PHẢI làm:
- Dựng 2 workflows mới trên n8n: (1) Thông báo hoa hồng cho Reseller, (2) Tạo video AI cho Merchant.
- Đảm bảo cơ chế Retry On Fail cho các node gọi API bên ngoài để chống lỗi mạng.
- Export workflow JSON đã xóa toàn bộ API key, token bí mật trước khi commit.

### B. Những việc tôi NÊN làm tiếp theo:
- Kiểm thử luồng video generation với cả video mẫu dọc 9:16 trên TikTok và YouTube Shorts.

### C. Những việc tôi KHÔNG NÊN làm:
- Không tự ý sửa đổi code React / Next.js của FE.
- Không đưa Service Role Key vào workflow export.

### D. Những thứ tôi cần bàn giao:
- Endpoint Webhook nhận thông báo đơn hàng $\rightarrow$ Bàn giao cho BE1.
- Workflow export và kết quả video AI sinh mẫu $\rightarrow$ Bàn giao cho FE Lead và Tester 2.

### E. Những thứ tôi cần yêu cầu team:
- Cần BE1 cung cấp trigger webhook khi có bản ghi mới trong bảng `orders`.
- Cần BE2 bàn giao prompt Multimodal phân tích video mẫu đúng hạn (Thứ Tư 21/10).
