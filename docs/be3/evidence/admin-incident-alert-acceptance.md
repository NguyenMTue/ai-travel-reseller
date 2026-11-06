# Nghiệm thu — Telegram Bot cảnh báo sự cố n8n cho quản trị viên

**Trạng thái:** Hoàn thành kiểm thử đầu cuối của cơ chế cảnh báo.  
**Ngày kiểm thử:** 05/11/2026 (GMT+7)  
**Môi trường:** n8n Self Hosted 2.42.4

## Mục tiêu

Khi một workflow n8n được cấu hình dùng Error Workflow và execution tự động thất bại, Error Trigger phải kích hoạt workflow cảnh báo và gửi tóm tắt sự cố vào nhóm Telegram quản trị viên.

## Phạm vi đã hoàn thành

- Tạo workflow `[OPS] Admin Incident Alert - Telegram` dùng Error Trigger và Telegram Send Message.
- Tạo workflow thử riêng `[TEST] Admin Incident Alert Smoke Test` với Webhook có Header Auth và node Stop And Error.
- Chọn workflow cảnh báo trong phần **Settings → Error Workflow** của workflow thử.
- Gửi request bằng Postman, tạo lỗi có chủ đích trong chế độ webhook.
- Xác nhận workflow cảnh báo nhận lỗi và Telegram nhận tin nhắn.
- Cấu hình Chat ID nhóm hợp lệ để gửi tin thành công.

## Ghi chú về `services/telegram-alert-bot.py`

Trong repo hiện tại không tìm thấy yêu cầu hoặc tham chiếu nào bắt buộc phải có file `services/telegram-alert-bot.py`; thư mục `services` hiện có `llm-service`. File Python riêng không cần thiết cho kiến trúc đã nghiệm thu: n8n nhận lỗi qua Error Trigger và Telegram node gửi tin trực tiếp bằng Telegram credential. Tạo thêm bot service sẽ trùng chức năng gửi cảnh báo và cần một tiến trình/API riêng để vận hành.

Nếu tài liệu giao task bên ngoài repo liệt kê file Python này như một deliverable bắt buộc, cần đối chiếu rubric đó trước khi kết luận toàn bộ yêu cầu giao bài đã hoàn tất. Trong repo hiện có, phần cảnh báo Telegram qua n8n đã được kiểm thử thành công.

## Bằng chứng kiểm thử

Thông báo Telegram nhận được có các trường:

| Trường | Kết quả |
| --- | --- |
| Tiêu đề | `N8N WORKFLOW FAILURE` |
| Workflow | `[TEST] Admin Incident Alert Smoke Test` |
| Node lỗi | `Fail intentionally for alert test` |
| Execution ID | `321` |
| Mode | `webhook` |
| Thời gian | `2026-11-05 21:00:32 GMT+7` |
| Nội dung lỗi | Lỗi smoke test có chủ đích để xác minh cảnh báo Telegram |
| Link execution | Có trong tin nhắn; link localhost chỉ mở được từ máy đang chạy n8n |

Kết quả xác nhận toàn bộ tuyến **Postman → Webhook test → Stop And Error → Error Workflow → Telegram** hoạt động.

## Kết luận và giới hạn

Task **xây dựng và kiểm thử cơ chế Telegram cảnh báo lỗi workflow n8n** đã hoàn thành. Đây là kết quả smoke test trên workflow thử; chưa đồng nghĩa mọi workflow production trong dự án đã được cấu hình chọn Error Workflow.

Trước khi nghiệm thu triển khai production, cần lần lượt mở từng workflow production cần giám sát, đặt **Settings → Error Workflow** thành `[OPS] Admin Incident Alert - Telegram` và lưu. Không gắn Error Workflow thử vào luồng production.

Workflow thử luôn cố ý gây lỗi. Sau kiểm thử, hãy **deactivate** nó; chỉ bật lại trong lần smoke test tiếp theo. Lỗi hạ tầng khiến n8n không chạy được (ví dụ máy/Docker/tunnel ngừng hoạt động) nằm ngoài khả năng tự gửi Telegram của workflow này.

## Artefact liên quan

- [Workflow cảnh báo](../workflow_admin_incident_alert.json)
- [Workflow thử lỗi](../workflow_admin_incident_smoke_test.json)
- [Hướng dẫn cấu hình cảnh báo](../run-admin-incident-alert.md)
- [Hướng dẫn kiểm thử bằng Postman](../test-admin-incident-alert-with-postman.md)
