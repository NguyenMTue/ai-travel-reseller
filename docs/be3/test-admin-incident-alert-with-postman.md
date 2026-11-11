# Kiểm thử cảnh báo sự cố n8n bằng Postman

Workflow thử: [workflow_admin_incident_smoke_test.json](workflow_admin_incident_smoke_test.json)

Workflow nhận một POST có xác thực rồi chủ động dừng bằng **Stop And Error**. Lỗi này được dùng để xác nhận Error Workflow đã gửi Telegram. Đây là luồng thử riêng, không gọi API/backend, không ghi database và không gửi dữ liệu nghiệp vụ.

## Trước khi thử

1. Import `workflow_admin_incident_alert.json` và cấu hình node Telegram: chọn Telegram credential, đặt chat ID nhóm admin. Lưu workflow.
2. Import `workflow_admin_incident_smoke_test.json`.
3. Trong workflow thử, mở node **Receive protected test request** và chọn hoặc tạo credential loại **Header Auth**. Ví dụ đặt tên header `X-Test-Token`, đặt giá trị bí mật do bạn tự tạo. Không đưa token vào file, Git hoặc tin nhắn.
4. Mở **Workflow settings** của workflow thử và đặt **Error Workflow** thành `[OPS] Admin Incident Alert - Telegram`. Lưu.
5. Bật (activate/publish) workflow thử để tạo Production URL. Chỉ bật trong lúc kiểm thử có kiểm soát.

## Cấu hình Postman

- Method: `POST`
- URL nếu Postman chạy trên cùng máy với n8n: `http://localhost:5678/webhook/admin-incident-alert-smoke-test`
- Nếu gọi từ máy khác, thay `localhost` bằng địa chỉ HTTPS công khai hiện đang trỏ tới n8n, ví dụ tunnel của bạn. Không dùng URL `/webhook-test/`.
- Header `Content-Type`: `application/json`
- Header xác thực: dùng đúng tên và giá trị đã cấu hình trong Header Auth credential (ví dụ `X-Test-Token: <giá trị bí mật của bạn>`).
- Body → **raw** → **JSON**:

```json
{
  "test": true,
  "event": "admin.incident.smoke_test",
  "message": "Intentional test failure for Telegram admin alert",
  "source": "Postman",
  "test_id": "incident-alert-smoke-001"
}
```

## Kết quả cần kiểm tra

1. Nhấn **Send** đúng một lần.
2. Webhook có thể trả `200` ngay vì được cấu hình trả lời lúc nhận request. Đây chỉ là xác nhận request đã vào webhook; nó không có nghĩa các node sau thành công.
3. Mở **Executions** của workflow thử: execution phải ở trạng thái **Failed** tại node **Fail intentionally for alert test**.
4. Mở **Executions** của `[OPS] Admin Incident Alert - Telegram`: xác nhận Error Trigger chạy và node Telegram thành công.
5. Xác nhận nhóm Telegram nhận cảnh báo có tên workflow thử và nội dung lỗi chủ động.
6. Sau khi xác nhận, **deactivate** workflow thử. Không để endpoint gây lỗi này bật thường trực.

## Nếu chưa nhận Telegram

- `401/403`: kiểm tra Header Auth credential và header trong Postman khớp chính xác.
- `404`: kiểm tra workflow đã activate và URL dùng `/webhook/`, không phải `/webhook-test/`.
- Workflow thử Failed nhưng Error Workflow không chạy: kiểm tra lại **Workflow settings → Error Workflow** đã chọn đúng workflow cảnh báo và đã lưu.
- Error Workflow chạy nhưng Telegram lỗi: kiểm tra Telegram credential, chat ID, quyền bot trong nhóm và execution của workflow cảnh báo.

Không gửi bot token hoặc header token vào ảnh chụp, Git hay cuộc trò chuyện. Nếu Postman chạy trên máy khác, cần dùng URL tunnel/domain HTTPS đang hoạt động; `localhost` chỉ trỏ tới chính máy đang chạy Postman.
