# BE3 — n8n Operations & Analytics

Tài liệu đầu mối cho thành viên vận hành workflow n8n và theo dõi Funnel PostHog. Các file workflow JSON trong repo là bản export; sau import phải gắn lại credentials và kiểm tra URL ở instance n8n đang dùng.

## Bắt đầu

1. Đọc [Sổ tay vận hành n8n và báo cáo Analytics Funnel](operations-and-analytics-handbook.md).
2. Dùng [Thiết lập n8n](../n8n/SETUP.md) để dựng môi trường; dùng [vận hành Campaign Content](run-campaign-content-workflow.md) riêng khi cần chạy pipeline Gemini/Supabase.
3. Chọn runbook đúng theo workflow bên dưới.

## Danh mục vận hành

| Chủ đề | Hướng dẫn | Workflow export | Trạng thái theo tài liệu/bằng chứng |
|---|---|---|---|
| Sinh nội dung campaign | [Campaign Content](run-campaign-content-workflow.md) | [`services/llm-service/workflow_campaign_content.json`](../../services/llm-service/workflow_campaign_content.json) | Export inactive; live E2E, audit execution và nghiệm thu đầy đủ còn các mục pending được ghi trong runbook |
| Thông báo click link | [Biên bản click notification](evidence/click-notification-acceptance.md) | [Reseller Click Notification](workflow_reseller_click_notification.json) | Có ảnh Telegram xác nhận đã nhận tin; bản export trong repo inactive |
| Video sẵn sàng | [Video Ready](run-video-ready-notification.md) | [Video Ready Notification](workflow_video_ready_notification.json) | Export inactive; xác nhận tích hợp với file/video thật theo runbook trước production |
| Hàng đợi/retry render video | [Video Render Queue & Retry](run-video-render-queue-retry.md) | [Workflow JSON](workflow_video_render_queue_retry.json) | Khung chờ API contract BE1; placeholder, inactive |
| Cảnh báo lỗi n8n | [Cấu hình cảnh báo](run-admin-incident-alert.md), [kiểm thử Postman](test-admin-incident-alert-with-postman.md) | [Incident Alert](workflow_admin_incident_alert.json), [Smoke Test](workflow_admin_incident_smoke_test.json) | Smoke test đã gửi Telegram thành công; bật test chỉ trong lúc thử |
| PostHog Funnel 5 bước | [Chia sẻ và kiểm tra Funnel](posthog-funnel-sharing-guide.md), [biên bản Funnel](evidence/posthog-funnel-acceptance.md) | Insight/Dashboard trên PostHog | Đã có funnel và ảnh số liệu; xem các giới hạn minh chứng trong biên bản |

## Quy tắc an toàn nhanh

- Mọi workflow export đưa lên Git phải có `active: false`; trạng thái activation thực tế phải được kiểm tra riêng trong n8n.
- Không commit Telegram/Gemini/Supabase/PostHog secrets, Header Auth values, webhook secret URLs hoặc execution payload chứa dữ liệu cá nhân.
- Mỗi n8n instance cần được gán lại credentials sau khi import JSON.
- Chỉ activate sau khi endpoint, credential, quyền ghi dữ liệu, test environment và error path đã được kiểm tra.
- Dữ liệu PostHog test phải được phân biệt với production; không kết luận tỷ lệ conversion production từ event thử.
