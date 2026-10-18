# MY WORK PLAN — BE3_W3
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 3 (19/10/2026 – 24/10/2026) — Sprint 3  
**Member:** Thái Thanh Tú (Automation & Notifications Lead)  
**Role:** Backend Developer 3 (n8n Workflows, Real-time Notifications & Funnel Analytics)  
**Current Milestone:** COMMERCE FLOW, AI SALES AGENT, PWA & MERCHANT VIDEO GENERATION  
**Deadline:** 17:00 Thứ Sáu (23/10/2026); Demo nghiệm thu: Thứ Bảy (24/10/2026)  
**Branch:** `Feature_BE3_Notifications_Analytics` (tách từ `dev`)  

---

## 1. Context
- Kế thừa thành quả Sprint 2: Workflow Campaign Content n8n (`workflow_campaign_content.json`) đã được export sạch secret và merge thành công vào `dev`.
- Trọng tâm Tuần 3:
  1. Xây dựng workflow n8n gửi thông báo thời gian thực (Webhook $\rightarrow$ Telegram / Zalo Bot) khi Reseller có lượt click hoặc đơn hàng mới.
  2. Tích hợp PostHog Analytics theo dõi phễu chuyển đổi 5 bước (*Click $\rightarrow$ Chat Open $\rightarrow$ Message $\rightarrow$ Checkout $\rightarrow$ Order*).
  3. Xây dựng workflow n8n thông báo thời gian thực khi Video chiến dịch được Core Engine của BE1 sinh thành công ("Ting ting! Video chiến dịch mới đã sẵn sàng để tiếp thị").
  4. **Phân định ranh giới kỹ thuật rõ ràng:** Phần lõi công nghệ tạo video (Core Video Generation Engine, xử lý render và lưu trữ storage) do **BE1 (Tuệ)** trực tiếp làm chủ. BE3 tuyệt đối không làm một mình hoặc ôm phần lõi này, mà tập trung vào tự động hóa thông báo và phễu tracking.
- Nguồn tham chiếu: [Roadmap.md](../Roadmap.md), [Week3.md](Week3.md), [PromptCreateTask.md](../PromptCreateTask.md).

---

## 2. Executive Summary
Trong Sprint 3, BE3 tập trung vào mảng Tự động hóa thông báo và Đo lường chuyển đổi:
1. **Real-time Notifications:** Khi bảng `orders` hoặc `clicks` có bản ghi mới, webhook kích hoạt n8n gửi tin nhắn thông báo đến Reseller ("Ting ting! Bạn có hoa hồng mới...").
2. **PostHog Funnel Tracking:** Thiết lập tích hợp PostHog Dashboard theo dõi 5 bước trong phễu chuyển đổi thương mại theo đặc tả của BA.
3. **Video Completed Alerts:** Lắng nghe webhook từ Core Video Engine của BE1 khi hoàn tất render video để tự động bắn thông báo cho Merchant và Reseller.
4. **Packaging & Documentation:** Xuất các workflow JSON sạch secret vào repo và viết tài liệu vận hành chi tiết.

---

## 3. TODAY — MUST DO (Thứ Hai 19/10/2026)
| Priority | Task | Why | Dependency | Output | Estimated Effort | Status |
|---|---|---|---|---|---|---|
| P0 | Họp Kick-off Sprint 3 & Chốt payload Webhook thông báo | Thống nhất trigger từ Supabase với BE1 | BE1 | Webhook schema | 1.5h | READY |
| P1 | Khởi tạo cấu trúc Bot Telegram / Zalo Webhook cho Reseller | Chuẩn bị kênh nhận thông báo đơn hàng | Nền tảng n8n | Bot token / Webhook node | 2.5h | READY |
| P1 | Thiết lập cấu hình PostHog Project & Funnel taxonomy | Chuẩn bị đo lường phễu chuyển đổi | PostHog API | PostHog setup | 2h | READY |

---

## 4. THIS WEEK — MY TASKS
| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|---|---|---|---|---|---|
| BE3-W3-01 | Workflow n8n thông báo đơn hàng / click mới (Telegram / Zalo) | P0 | READY | BE1-W3-01 | BE3 | File `workflow_reseller_notification.json` + test live | 21/10 17:00 |
| BE3-W3-02 | Tích hợp PostHog Analytics Dashboard & Phễu chuyển đổi 5 bước | P0 | READY | BA-W3-05 | BE3 | Dashboard PostHog + Event webhook tracker | 22/10 17:00 |
| BE3-W3-03 | Workflow n8n thông báo khi Video sinh thành công từ Core Engine BE1 | P1 | READY | BE1-W3-07 | BE3 | File `workflow_video_ready_notification.json` | 23/10 12:00 |
| BE3-W3-04 | Export workflow JSON sạch secret & tài liệu vận hành n8n | P1 | READY | BE3-W3-01, 02, 03 | BE3 | Docs tại `docs/be3/` + JSON workflows | 23/10 15:00 |
| BE3-W3-05 | Phối hợp phiên nghiệm thu E2E toàn diện Sprint 3 | P0 | READY | Toàn team | BE3 | Test log thông luồng n8n | 23/10 17:00 |

---

## 5. TASK BREAKDOWN (THEO PROMPT CREATETASK)

### A. Những việc tôi PHẢI làm:
- Dựng các workflow n8n thông báo hoa hồng/click cho Reseller.
- Thiết lập phễu đo lường PostHog 5 bước chuyển đổi theo quy chuẩn của BA.
- Dựng workflow thông báo khi video được BE1 hoàn thành.
- Đảm bảo cơ chế Retry On Fail cho các node gọi API bên ngoài để chống lỗi mạng.
- Export workflow JSON đã xóa toàn bộ API key, token bí mật trước khi commit.

### B. Những việc tôi NÊN làm tiếp theo:
- Tối ưu hóa template tin nhắn Telegram/Zalo có emoji sinh động và định dạng tiền tệ rõ ràng.

### C. Những việc tôi KHÔNG NÊN làm:
- **Tuyệt đối KHÔNG tự ý làm hoặc ôm một mình Core Video Generation Engine** (phần lõi kỹ thuật này do BE1 Lead trực tiếp phụ trách).
- Không tự ý sửa đổi code React / Next.js của FE.
- Không đưa Service Role Key vào workflow export.

### D. Những thứ tôi cần bàn giao:
- Endpoint Webhook nhận thông báo đơn hàng $\rightarrow$ Bàn giao cho BE1.
- Dashboard PostHog Analytics $\rightarrow$ Bàn giao cho BA và PM nghiệm thu.
- Workflow export n8n $\rightarrow$ Bàn giao cho team vận hành.

### E. Những thứ tôi cần yêu cầu team:
- Cần BE1 cung cấp trigger webhook khi có bản ghi mới trong bảng `orders`.
- Cần BE1 phát webhook sự kiện khi hoàn tất sinh video từ Core Engine.
