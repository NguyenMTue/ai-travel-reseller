# MY WORK PLAN — BE3_W5
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 5 (02/11/2026 – 07/11/2026) — Sprint 5 (Sprint Cuối / Final Sprint)  
**Member:** Thái Thanh Tú (Automation & Analytics Lead)  
**Role:** Backend Developer 3 (n8n Production Workflows, Telegram Bot & PostHog Analytics Funnel)  
**Current Milestone:** FINAL E2E UAT, PERFORMANCE STRESS TESTING, RLS SECURITY AUDIT & PRODUCTION GO-LIVE  
**Deadline:** 17:00 Thứ Bảy (07/11/2026)  
**Branch:** `feature/be3-w5-production-n8n-analytics` (tách từ `dev`)  

---

## 1. Context & Trọng tâm Kỹ thuật Sprint 5
- Kế thừa thành quả Sprint 4: Thiết lập thành công hàng đợi retry thông minh (Exponential Backoff 3 lần) cho n8n render video; tối ưu hóa tin nhắn thông báo Telegram gửi Reseller kèm ảnh thumbnail và nút tải video 9:16.
- **Trọng tâm BE3 trong Tuần 5 — Tự động hóa Production & Trực quan hóa Phễu chuyển đổi:**
  1. **Di chuyển toàn bộ Workflows n8n lên Môi trường Production:** Đảm bảo instance n8n Production có domain HTTPS riêng, webhook endpoints được bảo vệ bằng Webhook Secret Token, sẵn sàng tiếp nhận sự kiện từ Supabase Database Webhooks.
  2. **Hoàn thiện Phễu Chuyển đổi 5 bước trên PostHog (Analytics Funnel):** Đo lường trực quan toàn bộ hành trình:
     $$\text{Click link tiếp thị} \longrightarrow \text{Mở Chat AI} \longrightarrow \text{Nhận diện Buying Intent} \longrightarrow \text{Click Checkout} \longrightarrow \text{Ghi nhận Commission}$$
     Sẵn sàng biểu đồ trực quan sắc nét để trình chiếu trong buổi báo cáo nghiệm thu dự án.
  3. **Hệ thống Cảnh báo Sự cố Real-time qua Telegram cho Đội ngũ Kỹ thuật:** Bot tự động gửi thông báo khẩn khi phát hiện lỗi thanh toán, lỗi kết xuất video thất bại hoặc lỗi hệ thống nghiêm trọng trong phiên UAT và sau khi Go-Live.

---

## 2. THIS WEEK — MY TASKS

| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|:---:|:---:|---|:---:|---|:---:|
| **BE3-W5-01** | Triển khai & Khóa bảo mật n8n Workflows trên Production Instance | **P0** | `READY` | n8n Cloud Server | BE3 | Workflows active, webhook có xác thực Bearer token | 02/11 17:00 |
| **BE3-W5-02** | Khóa cấu hình Phễu Chuyển đổi 5 bước trên PostHog Analytics | **P1** | `READY` | PostHog API key | BE3 | Dashboard phễu chuyển đổi trực quan, dữ liệu real-time | 03/11 17:00 |
| **BE3-W5-03** | Xây dựng Telegram Bot cảnh báo sự cố khẩn cấp cho Quản trị viên | **P1** | `READY` | Telegram Bot API | BE3 | Bot alert bắn tin nhắn khi có đơn hàng lỗi / crash | 04/11 12:00 |
| **BE3-W5-04** | Đóng gói Tài liệu Hướng dẫn Vận hành n8n & Báo cáo Analytics Funnel | **P2** | `READY` | Hoàn tất UAT | BE3 | `docs/be3/PRODUCTION_N8N_WORKFLOWS_AND_ANALYTICS.md` | 06/11 17:00 |

---

## 3. TASK BREAKDOWN (CHI TIẾT THỰC THI)

### Task `BE3-W5-01`: Triển khai n8n Workflows Production
* **Mục tiêu:** Tự động hóa 100% các luồng hậu cần kinh doanh không cần can thiệp thủ công.
* **Các bước triển khai:**
  - [ ] Xuất khẩu (Export) các workflows đã test ổn định: `workflow_campaign_content.json`, `workflow_video_render_queue_retry.json`, `workflow_order_notification.json`.
  - [ ] Nạp vào n8n Production instance, liên kết thông tin đăng nhập (Credentials) Supabase Service Role và Telegram Bot Production.
  - [ ] Kích hoạt (Activate) toàn bộ workflows và thực hiện test trigger giả lập.
* **DoD:** Mọi webhook đều phản hồi HTTP 200 trong vòng $< 1.5\text{s}$.

### Task `BE3-W5-02`: Phễu Chuyển đổi 5 Bước trên PostHog
* **Mục tiêu:** Chứng minh cho Ban Quản trị thấy năng lực đo lường hiệu quả chuyển đổi từ link của Reseller.
* **Các bước triển khai:**
  - [ ] Kiểm tra các sự kiện frontend và backend gửi về PostHog:
    1. `tracking_link_clicked` (kèm `reseller_id`, `campaign_id`).
    2. `ai_chat_session_started`.
    3. `ai_intent_ready_to_buy_detected`.
    4. `checkout_link_redirected`.
    5. `commission_attributed_success`.
  - [ ] Tạo bảng biểu Insights Funnel trên PostHog Dashboard với tỷ lệ chuyển đổi phần trăm (%) qua từng bước.
* **DoD:** Dữ liệu phễu hiển thị chính xác trong phiên UAT ngày 04/11.

### Task `BE3-W5-03`: Bot Telegram Cảnh báo Sự cố
* **Mục tiêu:** Kịp thời phát hiện và xử lý sự cố trong suốt tuần Go-Live.
* **Nội dung cảnh báo:** Gửi vào group kỹ thuật: Thời gian, loại lỗi, mã lỗi, payload và link truy vết logs.
* **DoD:** Bot gửi tin nhắn cảnh báo trong vòng 5 giây kể từ khi có lỗi phát sinh.

---

## 4. DEPENDENCY ANALYSIS

| Task | Dependency | Người phụ trách | Trạng thái |
|---|---|---|:---:|
| BE3-W5-01 | Instance n8n Production & SSL | BE3, DevOps | `READY` |
| BE3-W5-02 | Client tracking code từ FE Lead | FE Lead (Diệu) | `WAITING` |
| BE3-W5-03 | Telegram Bot Credentials | BE3 Lead | `READY` |

---

## 5. TEAM HANDOFF

| From | To | Deliverable | Format | Deadline |
|---|---|---|---|:---:|
| BE3 Lead | BE1 & FE | Webhook URLs Production có bảo mật Secret | Markdown doc | 02/11 17:00 |
| BE3 Lead | PM & BA | Link Dashboard PostHog Funnel trực quan | Dashboard URL | 04/11 17:00 |
| BE3 Lead | Toàn team | Tài liệu bàn giao vận hành n8n Workflows | Tài liệu kỹ thuật | 06/11 17:00 |

