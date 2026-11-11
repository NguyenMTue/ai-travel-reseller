# MY WORK PLAN — BE3_W4
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 4 (26/10/2026 – 31/10/2026) — Sprint 4  
**Member:** Thái Thanh Tú (Automation & Tracking Lead)  
**Role:** Backend Developer 3 (n8n Workflows, Telegram Bot & Queue Pipeline)  
**Current Milestone:** VIDEO QUALITY ENGINE REFINEMENT, AUDIO DUCKING & SCOPE STABILIZATION  
**Deadline:** 17:00 Thứ Sáu (30/10/2026)  
**Branch:** `feature/be3-w4-n8n-queue-retry-polish` (tách từ `dev`)  

---

## 1. Context
- Kế thừa thành quả Sprint 3: Workflows n8n nhận webhook tạo campaign, thông báo đơn hàng và click tiếp thị qua Telegram đã vận hành ổn định.
- **Cập nhật Lộ trình:** Lộ trình được dời sang 5 tuần. BE3 giảm tải khối lượng công việc, không mở rộng thêm các kênh mạng xã hội mới (như Zalo OA hay TikTok Shop API ngoài scope) mà tập trung vào sự ổn định của luồng hàng đợi (queue) render video AI.
- **Trọng tâm BE3 Tuần 4:**
  1. Xây dựng cơ chế Retry lũy tiến (Exponential Backoff): Khi server render video AI đang bận hoặc quá tải, n8n tự động chờ và thử lại tối đa 3 lần mà không làm gián đoạn workflow.
  2. Nâng cấp thông báo Telegram: Định dạng tin nhắn gửi cho Reseller khi có video du lịch mới gồm ảnh thumbnail sắc nét, thời lượng, tiêu đề và nút bấm "Tải video 9:16 ngay".

---

## 2. THIS WEEK — MY TASKS

| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|:---:|:---:|---|:---:|---|:---:|
| **BE3-W4-01** | Cấu hình hàng đợi retry thông minh cho n8n workflow render video | **P2** | `READY` | Workflow Tuần 3 | BE3 | File workflow JSON có Error Trigger & Retry | 29/10 17:00 |
| **BE3-W4-02** | Tinh chỉnh tin nhắn thông báo video mới trên Telegram cho Reseller | **P2** | `READY` | BE1 Video URL | BE3 | Mẫu tin nhắn Telegram đẹp mắt kèm video preview | 30/10 17:00 |

---

## 3. DEFINITION OF DONE (DoD)
- [ ] Workflow n8n tự động retry 3 lần khi endpoint render trả về mã 429 hoặc 503.
- [ ] Tin nhắn Telegram hiển thị thumbnail video rõ nét và có link tải trực tiếp.
