# Cấu hình Telegram Admin Incident Alert trong n8n

Workflow export: [workflow_admin_incident_alert.json](workflow_admin_incident_alert.json)

## Mục đích

Workflow dùng `Error Trigger` để nhận lỗi chưa được xử lý từ các workflow production đã gắn với nó, rồi gửi thông báo gọn vào nhóm Telegram quản trị viên. Nó báo workflow/node lỗi, thời điểm, thông tin lỗi đã rút gọn và link execution nếu n8n có lưu execution đó.

Workflow export để `active: false` và không chứa bot token hay credential ID của một instance cụ thể. n8n Error Trigger workflow được chọn trong phần cài đặt của workflow cần giám sát; theo tài liệu n8n, error workflow không cần publish/activate riêng.

## 1. Chuẩn bị Telegram

1. Dùng bot Telegram đã được tạo qua BotFather hoặc tạo bot riêng cho vận hành.
2. Tạo nhóm riêng tư dành cho quản trị viên và thêm bot vào nhóm. Nếu nhóm hạn chế gửi tin, cấp quyền gửi tin cho bot.
3. Lấy chat ID nhóm bằng phương thức an toàn của nhóm. Không ghi bot token vào file workflow, `.env`, Git hay tin nhắn trong nhóm.
4. Trong n8n, tạo hoặc chọn credential loại **Telegram API**. Nhập bot token trực tiếp trong màn hình credential của n8n.

## 2. Import và cấu hình workflow

1. Tải file JSON bên cạnh runbook này về máy.
2. Trong n8n, chọn **Workflows → Import from File** và chọn `workflow_admin_incident_alert.json`.
3. Mở node **Send incident alert to admins**.
4. Chọn credential **Telegram API** đúng bot.
5. Đổi `REPLACE_WITH_ADMIN_CHAT_ID` thành chat ID của nhóm quản trị viên.
6. Lưu workflow. File không gắn credential tự động để tránh tham chiếu nhầm credential từ instance khác.

## 3. Gắn vào workflow cần giám sát

Với từng workflow production được phê duyệt:

1. Mở workflow đó.
2. Mở **Options → Settings**.
3. Trong **Error workflow**, chọn `[OPS] Admin Incident Alert - Telegram`.
4. Lưu workflow.

Nên gắn vào các luồng vận hành quan trọng như campaign content, video ready/render queue và click notification sau khi xác nhận chúng đang dùng production credential/endpoint phù hợp. Chỉ gắn một lần cho mỗi workflow.

## 4. Kiểm thử an toàn

Không dùng nút chạy thủ công để kiểm tra Error Trigger: n8n chỉ chạy Error Trigger khi một workflow **tự động** bị lỗi.

Tạo workflow thử riêng có trigger tự động được bảo vệ, thêm node **Stop And Error**, gắn error workflow này vào workflow thử, rồi kích hoạt đúng một lần. Xác nhận Telegram nhận được tên workflow, node lỗi, message và execution link. Sau khi xác nhận, tắt/xóa workflow thử. Không cố tình làm lỗi workflow production để kiểm thử.

## 5. Phạm vi và giới hạn

- Workflow chỉ bắt lỗi từ các workflow n8n đã chọn **Error workflow** này.
- Nó không phát hiện n8n/Docker/tunnel bị tắt hoặc mất mạng, vì khi đó n8n không thể chạy node Telegram. Muốn giám sát uptime cần thêm dịch vụ monitor bên ngoài.
- Nó không báo lỗi backend/frontend nằm ngoài execution n8n. Muốn nhận loại sự cố đó cần tích hợp logging/monitoring hoặc một endpoint incident có xác thực ở phía ứng dụng.
- Nếu Telegram không truy cập được, node gửi tin sẽ retry tối đa 3 lần; sau đó cần xem execution của chính error workflow trong n8n.
- Thông báo cố ý không kèm input payload/stack đầy đủ để hạn chế lộ dữ liệu cá nhân hoặc bí mật. Mở link execution trong n8n để điều tra chi tiết theo quyền truy cập.
- Bất kỳ workflow nào chọn error workflow này sẽ gửi Telegram khi execution tự động thất bại; tránh gắn vào luồng test hoặc luồng có lỗi dự kiến.

## Tiêu chí nghiệm thu

- [ ] Telegram API credential được chọn đúng.
- [ ] Chat ID là nhóm quản trị viên và bot gửi được tin.
- [ ] Workflow thử tự động lỗi gửi đúng một cảnh báo.
- [ ] Cảnh báo có workflow, node, thời gian, lỗi rút gọn và link execution khi có.
- [ ] Các workflow production cần giám sát đã chọn error workflow chung.
- [ ] Workflow thử đã tắt/xóa sau kiểm thử.

## Tham khảo

- [n8n Error Trigger](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.errortrigger/)
- [n8n Telegram node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.telegram/)
