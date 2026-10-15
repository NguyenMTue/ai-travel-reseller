# Ghi nội dung Campaign vào Supabase `contents`

## Luồng dữ liệu

```text
Supabase campaign INSERT
  → n8n Webhook
  → đọc Campaign và tạo nội dung có cấu trúc
  → chuẩn hóa thành `records[]`
  → HTTP Request tới Python `/contents/batch`
  → Python xác minh Campaign, lấy product_id và insert vào `public.contents`
```

Python giữ `SUPABASE_KEY` ở server. n8n chỉ giữ `CONTENTS_API_KEY`; không đặt khóa Supabase `service_role`/`sb_secret` trong workflow export, Google Sheet hay frontend.

## Python service

Trong `services/llm-service/.env`, cần có:

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_KEY=<server-side Supabase secret key>
CONTENTS_API_KEY=<random secret riêng, tối thiểu 32 ký tự>
```

Khóa `CONTENTS_API_KEY` là bí mật riêng để n8n gọi API này, không phải khóa Supabase. Khởi động lại FastAPI sau khi thêm hoặc đổi biến môi trường. `SUPABASE_KEY` phải là key có quyền ghi phía server. Không gửi các giá trị bí mật vào chat.

## Node cuối trong n8n

Thêm node **HTTP Request** sau node đã chuẩn hóa nội dung:

| Trường | Giá trị |
|---|---|
| Method | `POST` |
| URL khi n8n chạy trong Docker cùng máy | `http://host.docker.internal:8000/contents/batch` |
| Send Headers | Bật |
| `X-API-Key` | Giá trị `CONTENTS_API_KEY`, lưu bằng n8n Credential |
| `Content-Type` | `application/json` |
| Send Body | Bật, JSON |

Payload phải có dạng sau; UUID phải là ID thật của Campaign đã tồn tại trong Supabase:

```json
{
  "campaign_id": "UUID-CAMPAIGN-THAT",
  "records": [
    {
      "persona": "family",
      "hook": "Một hook hoàn chỉnh tối thiểu 20 ký tự",
      "script": "Kịch bản video hoàn chỉnh",
      "caption": "Caption hoàn chỉnh có hashtag phù hợp #dulich",
      "cta": "Xem chi tiết và đặt vé tại [LINK_MUA_VE]"
    }
  ]
}
```

Endpoint tự đọc `product_id` từ hàng `campaigns`, ghi cùng `campaign_id`, và đặt `status = NEEDS_REVIEW`. Không gửi `id`, `created_at`, `product_id`, `reseller_id` hoặc trạng thái từ Gemini; database/API quản lý các trường này. Mỗi lần gọi nhận từ 1 đến 20 bản ghi hoàn chỉnh.

Nếu n8n không chạy trong Docker, thay URL bằng `http://127.0.0.1:8000/contents/batch`. Nếu n8n chạy trong Docker trên một máy khác, `host.docker.internal` sẽ trỏ sai máy; cần dùng địa chỉ mạng có thể truy cập tới Python service hoặc deploy Python API.

## Đầu ra thành công

```json
{
  "campaign_id": "UUID-CAMPAIGN-THAT",
  "product_id": "UUID-SAN-PHAM-THAT",
  "inserted_count": 1,
  "content_ids": ["UUID-CONTENT-MOI"]
}
```

Sau khi n8n chạy, mở Supabase **Table Editor → `contents`**, lọc theo `campaign_id`, rồi xác nhận các cột `product_id`, `persona`, `hook`, `script`, `caption`, `cta` có dữ liệu và `status` là `NEEDS_REVIEW`.

## Kiểm tra trước khi bật workflow

- `campaign_id` trong webhook phải tồn tại thật và có `product_id`.
- Gemini phải trả JSON có nội dung thật; placeholder như `[Chèn Hook...]` không được gửi vào `records`.
- Mỗi phần tử `records` phải chứa đủ `persona`, `hook`, `script`, `caption`, `cta`.
- Handoff BE2 hiện mô tả 10 hooks nhưng chỉ 5 scripts/captions/CTAs. Chưa có quy tắc nhóm chúng thành rows. Trước khi chuyển toàn bộ output BE2 thành batch, BE2/BE3/FE cần chốt mapping; không lặp assets để tự lấp các hàng.
- API không tự chống gửi lại cùng một batch. Khi bật retry, chỉ retry lỗi trước khi server insert hoặc kiểm tra `content_ids`/bảng trước khi gửi lại để tránh nội dung trùng.

## Lỗi thường gặp

| HTTP | Ý nghĩa / kiểm tra |
|---|---|
| `401` | Header `X-API-Key` thiếu hoặc không trùng `CONTENTS_API_KEY`. |
| `503` | Chưa cấu hình `CONTENTS_API_KEY` đủ dài trong `.env`; khởi động lại Python. |
| `404` | Campaign ID không tồn tại. |
| `422` | Payload không đúng schema hoặc Campaign chưa có `product_id`. |
| `502` | Python không xác minh/ghi được Supabase; xem log terminal Python để biết lỗi quyền, URL, FK hoặc schema. |
