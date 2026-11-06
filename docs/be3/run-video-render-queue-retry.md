# Video Render Queue and Retry — hướng dẫn cấu hình

File workflow: [`workflow_video_render_queue_retry.json`](./workflow_video_render_queue_retry.json).

Workflow này là **khung chờ contract API cuối cùng của BE1**. Nó nhận job qua Webhook, gửi yêu cầu tới API render BE1, retry giới hạn tối đa 3 lần, rồi báo Telegram thành công hoặc thất bại. Workflow để `active: false`; endpoint `.example.invalid` là placeholder, không thể render nếu chưa thay.

## Phân biệt queue và retry

- Repo đã cấu hình `N8N_CONCURRENCY_PRODUCTION_LIMIT: "1"` trong `docker-compose.n8n.yml`. Với production webhook/trigger, n8n xếp các execution vượt giới hạn FIFO; manual/test execution không nằm trong queue này. Khi chỉnh biến, restart container n8n.
- Node **Call BE1 render API** có Retry On Fail tối đa 3 lần, cách nhau 5 giây. Đây là retry cố định trong một execution, chưa phải backoff động theo 429/5xx.
- Không retry bằng cách tạo `generation_key` mới. BE1 phải đảm bảo cùng key gọi lại không tạo render trùng.

## Contract cần BE1 bàn giao

Trước khi đổi endpoint, xin BE1 chốt các thông tin sau:

1. HTTP method và URL render API; API chạy đồng bộ hay trả `202` kèm `job_id` để polling.
2. Cách xác thực API; cấu hình credential n8n, không ghi token vào node text hoặc file export.
3. Schema request; map vào `body.render_input`.
4. Schema response thành công; hiện template kỳ vọng response có `content_id` và `video_url`.
5. Mã lỗi có thể retry, định dạng `Retry-After`, thời gian tối đa render và cam kết idempotency cho `generation_key`.
6. Nếu render bất đồng bộ: API status/poll URL và trạng thái hoàn tất/lỗi cuối cùng. Khi đó cần thêm bước polling/Wait, không coi HTTP 202 là video đã sẵn sàng.

## Sau khi BE1 chốt API: chỉ đổi cấu hình đầu vào

1. Import JSON vào n8n, mở **Call BE1 render API**.
2. Thay URL placeholder bằng URL BE1. Cấu hình authentication bằng n8n Credential theo contract.
3. Sửa `jsonBody` để gửi đúng schema BE1. Mặc định nó gửi nguyên `{{$json.body.render_input}}`.
4. Giữ `Idempotency-Key: {{$json.body.generation_key}}` nếu BE1 hỗ trợ; nếu BE1 dùng tên header khác, sửa theo contract.
5. Chọn Telegram credential đúng, xác nhận chat ID `-1004373825301`.
6. Gửi Postman tới **Test URL** khi webhook đang Listen for test event. Chỉ publish/activate sau khi API test thành công và credential đã gắn.

## Payload Postman mẫu

```json
{
  "event": "video.render.requested",
  "generation_key": "test-campaign-001:test-product-001:v1",
  "campaign_id": "test-campaign-001",
  "product_id": "test-product-001",
  "merchant_id": "test-merchant-001",
  "render_input": {
    "campaign_id": "test-campaign-001",
    "product_id": "test-product-001",
    "title": "Tour Đà Nẵng 3N2Đ"
  }
}
```

Trong Postman chọn `POST`, Test URL của Webhook, `Body → raw → JSON`, header `Content-Type: application/json`. Các ID trên là dữ liệu giả. Payload này chỉ gọi được endpoint thật sau khi URL/credential đã cấu hình; không dùng Production URL để thử ban đầu.

## Luồng và giới hạn

`Webhook → Validate render job → BE1 render API (3 lần thử tối đa) → Telegram thành công / Telegram lỗi`.

Nếu hết retry, execution vẫn được ghi nhận là lỗi và workflow gửi cảnh báo Telegram. Trước khi chạy lại thủ công, kiểm tra trạng thái job với BE1 theo `generation_key`; không tạo key mới cho cùng một yêu cầu. Với API bất đồng bộ, retry chỉ áp dụng cho việc gửi yêu cầu ban đầu; polling và retry lỗi render sau khi BE1 nhận job phải được làm theo contract riêng.

Workflow này gọi API render, có thể tốn tài nguyên và tạo file thật. Chỉ chạy Postman khi BE1 cấp endpoint test và xác nhận có thể gọi; chưa chạy workflow hoặc gọi API trong lúc chuẩn bị file.
