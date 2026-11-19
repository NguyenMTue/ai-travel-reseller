# TikTok Video Metrics API & Worker

## Phạm vi

Service nhận URL TikTok canonical, đăng ký video cần đồng bộ, và worker định kỳ đọc `view_count`, `like_count`, `comment_count`, `share_count` bằng TikTok API v2. Bản ghi hiện tại nằm trong `public.tiktok_video_posts`; lịch sử chỉ thêm snapshot khi số liệu thay đổi nằm trong `public.tiktok_video_metric_snapshots`.

`engagement_score` là tỷ lệ tương tác theo phần trăm: `(likes + comments) / views * 100`, làm tròn 4 chữ số thập phân; bằng `0` nếu `views = 0`. Share được lưu riêng nhưng không tính vào score để công thức chỉ dựa trên View/Like/Comment theo phạm vi task.

Việc đọc số liệu chỉ áp dụng cho video của tài khoản TikTok đã OAuth và cấp `video.list`. TikTok `video/query` kiểm tra video thuộc người dùng được ủy quyền. Đây không phải crawler HTML cho URL của tài khoản bất kỳ. Research API không phù hợp với người dùng thương mại.

## Điều kiện TikTok

- TikTok Developer App đã bật Login Kit và đã được cấp scope `video.list`.
- Worker có client key/secret và refresh token của creator đã đồng ý kết nối.
- Token cũ chỉ có `video.publish` cần OAuth lại. URI callback phải khớp cấu hình app và `TIKTOK_REDIRECT_URI`.
- Các URL rút gọn `vm.tiktok.com` / `vt.tiktok.com` cần chuyển thành URL đầy đủ trước khi đăng ký.

## Môi trường

Đặt trong `services/llm-service/.env`:

```dotenv
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_KEY=<server-side service role key>
TIKTOK_CLIENT_KEY=<TikTok client key>
TIKTOK_CLIENT_SECRET=<TikTok client secret>
TIKTOK_REDIRECT_URI=https://<your-domain>/tiktok/callback
TIKTOK_ACCESS_TOKEN=<OAuth access token>
TIKTOK_REFRESH_TOKEN=<OAuth refresh token>
TIKTOK_METRICS_API_KEY=<random secret at least 32 characters>
TIKTOK_METRICS_RESELLER_ID=<UUID of the reseller who owns this TikTok account>
```

Không đưa key TikTok, Supabase service-role key hay `TIKTOK_METRICS_API_KEY` vào frontend hoặc Git.

## Database và khởi động

Áp dụng migration `supabase/migrations/20261119120413_tiktok_video_metrics_tracking.sql` và `supabase/migrations/20261119121258_tiktok_engagement_score.sql` trên đúng Supabase project. Hai bảng bật RLS và chỉ cấp quyền Data API cho `service_role`; backend phải dùng service-role key.

Khởi động API từ `services/llm-service`:

```powershell
python -m uvicorn rag_api:app --host 0.0.0.0 --port 8000
```

Khởi động **một** worker riêng nếu dùng lịch chạy độc lập:

```powershell
python main.py --tiktok-metrics-worker --tiktok-metrics-interval 900
```

Worker kiểm tra mỗi 15 phút, retry theo backoff tăng dần và dừng tự retry ở 5 lỗi để chuyển bản ghi sang `needs_attention`. Chạy nhiều worker đồng thời hiện chưa được hỗ trợ.

### Đồng bộ định kỳ qua n8n

Import `services/n8n/tiktok-metrics-sync.json`, thay URL bằng địa chỉ FastAPI có thể truy cập từ n8n và kết thúc bằng `/tiktok/metrics/sync`. Trong HTTP Request, chọn credential **Header Auth** đặt header name `X-API-Key` và value trùng với `TIKTOK_METRICS_API_KEY`. Workflow chạy mỗi 15 phút theo múi giờ `Asia/Ho_Chi_Minh`; khi n8n làm lịch chạy thì không chạy đồng thời `--tiktok-metrics-worker`.

## API

Đăng ký video:

```http
POST /tiktok/metrics/posts
X-API-Key: <TIKTOK_METRICS_API_KEY>
Content-Type: application/json
```

```json
{
  "reseller_id": "<existing reseller UUID>",
  "content_id": "<optional existing content UUID>",
  "video_url": "https://www.tiktok.com/@creator/video/1234567890123456789"
}
```

HTTP `202` trả về bản ghi đã tạo; đăng ký trùng cùng `reseller_id` và video ID trả bản ghi hiện có. Trạng thái và số gần nhất:

```http
GET /tiktok/metrics/posts/<post UUID>
X-API-Key: <TIKTOK_METRICS_API_KEY>
```

Response có `engagement_score` và công thức tính.

Worker chạy một batch định kỳ qua API:

```http
POST /tiktok/metrics/sync
X-API-Key: <TIKTOK_METRICS_API_KEY>
```

Response báo `checked`, `synced`, `skipped`, `failed` và `status` (`ok` hoặc `partial`). TikTok query theo lô tối đa 20 video/lần gọi; một lần sync xử lý tối đa 100 video đến hạn.

Trạng thái `pending` chờ lần đồng bộ đầu, `active` đang được poll định kỳ, `needs_attention` cần kiểm tra quyền hoặc video, và `paused` dành cho tạm dừng thủ công.

## Chẩn đoán

- `401`: thiếu/sai `X-API-Key`.
- `503`: thiếu `TIKTOK_METRICS_API_KEY` hoặc chưa cấu hình service.
- TikTok `scope_not_authorized`: thêm `video.list` vào TikTok Developer App và OAuth lại.
- Không trả video: video không thuộc tài khoản đã OAuth, ID sai hoặc quyền chưa áp dụng.
- Mở `tiktok_video_posts.last_error` và log worker để xem lỗi gần nhất. Các số liệu thuộc nguồn hệ thống cần hiển thị tách biệt với số Reseller tự khai; không dùng metrics mạng xã hội để tính hoa hồng.

## Giới hạn triển khai đầu tiên

Worker hiện chỉ dùng một tài khoản TikTok OAuth của service và API bắt buộc ánh xạ tài khoản đó tới đúng một `TIKTOK_METRICS_RESELLER_ID`. Để đồng bộ video của nhiều Reseller, cần hoàn thiện luồng OAuth theo từng tài khoản và kho credential an toàn theo owner; không dùng chung refresh token của một tài khoản để truy vấn video của tài khoản khác.
