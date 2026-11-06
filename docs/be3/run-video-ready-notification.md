# Workflow n8n thông báo video hoàn tất

Workflow `workflow_video_ready_notification.json` nhận callback từ BE1, kiểm tra sự kiện và trạng thái video, sau đó gửi thông báo Telegram. Workflow được export ở trạng thái **inactive** để tránh chạy trước khi gắn credential và cấu hình URL.

## Luồng sự kiện

`POST /webhook/video-generation-completed` → kiểm tra `event`, `status`, `video_url` → Telegram.

BE1 đã gọi callback sau khi tạo bản ghi `contents` thành công, qua biến môi trường server-side `N8N_VIDEO_COMPLETED_WEBHOOK_URL`. Payload hiện tại gồm `event`, `content_id`, `campaign_id`, `product_name`, `video_url`, `duration_sec`, `status`, `hook_headline`, `created_at`.

## Cấu hình n8n

1. Import file JSON này vào n8n.
2. Mở node **Send video ready notification**, chọn Telegram credential của workspace. Kiểm tra chat ID `-1004373825301` có đúng nhóm cần nhận thông báo.
3. Lưu workflow và publish/activate. Chỉ sau khi activate, production webhook URL mới sẵn sàng nhận request liên tục.
4. Sao chép **Production URL** của node webhook. Đặt URL đó vào biến `N8N_VIDEO_COMPLETED_WEBHOOK_URL` trong môi trường chạy Next.js (ví dụ `.env.local` khi chạy local), rồi khởi động lại Next.js.
5. Dùng **Test URL** khi workflow ở chế độ test; test webhook chỉ nghe một lần sau khi bấm **Listen for test event**. Không cần bấm Execute workflow để mỗi lần nhận production callback.

Credential secret không được đưa vào file JSON. Nếu credential tham chiếu sau import không được nhận diện, chọn credential hiện có ngay trong node Telegram.

## Payload mẫu

```json
{
  "event": "video.generation.completed",
  "content_id": "33333333-3333-4333-8333-333333333333",
  "campaign_id": "22222222-2222-4222-8222-222222222222",
  "product_id": "44444444-4444-4444-8444-444444444444",
  "merchant_id": "55555555-5555-4555-8555-555555555555",
  "product_name": "Vé tham quan",
  "video_url": "https://example.com/campaign-videos/video.mp4",
  "duration_sec": 28,
  "status": "ready",
  "hook_headline": "Một ngày khám phá điểm đến",
  "created_at": "2026-10-21T10:30:00Z",
  "metadata": {
    "title": "Tour Đà Nẵng 3N2Đ",
    "resolution": "1080x1920"
  }
}
```

Tin nhắn Telegram hiển thị đủ bốn ID: `content_id`, `campaign_id`, `product_id` và `merchant_id`. Các trường trong `metadata` được dùng làm title/độ phân giải và fallback khi thử Postman.

## Kiểm tra và nghiệm thu

- Dùng Test URL và payload mẫu để kiểm tra nhánh Telegram trước khi bật workflow production.
- Sau khi publish/activate, gọi luồng tạo video từ ứng dụng và xác nhận execution mới xuất hiện, node Telegram thành công, tin nhắn có đúng bốn ID cùng URL video.
- Nếu Telegram lỗi tạm thời, node được cấu hình retry tối đa 3 lần. Kiểm tra execution log trong n8n khi retry vẫn thất bại.

## Giới hạn hiện tại cần BE1 xử lý

Trong source hiện tại, `synthesizeVideoDraft()` vẫn tạo URL `storage.travellink.vn/...` giả lập và không upload file thật lên Supabase Storage. Vì vậy callback/workflow chỉ chứng minh tín hiệu “ready” đã đi qua; để nghiệm thu video thật, BE1 cần thay renderer giả lập bằng pipeline render/upload thật và chỉ phát callback sau khi upload thành công. Không dùng URL mẫu trong workflow để kết luận video đã được lưu thật.

Webhook URL là bí mật vận hành vì endpoint hiện chưa xác thực bằng header. Chỉ lưu production URL trong biến môi trường server-side, không đặt vào `NEXT_PUBLIC_*`, không commit URL vào repo, và không chia sẻ công khai.
