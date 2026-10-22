# Workflow Campaign Content trên n8n

Tài liệu này mô tả workflow sinh nội dung chiến dịch cho bốn persona, cách import, chạy thử và thu thập bằng chứng nghiệm thu. Hướng dẫn dựng môi trường từ đầu nằm tại [SETUP.md](SETUP.md).

## 1. Source of truth

| Thành phần | File |
|---|---|
| Workflow export để import vào n8n | `services/llm-service/workflow_campaign_content.json` |
| Generator của workflow export | `scripts/build-n8n-campaign-workflow.mjs` |
| Zod schema | `src/lib/ai/schemas/content-schema.ts` |
| Portable JSON Schema | `docs/be2/content-factory.schema.json` |
| Python enrich/persistence API | `services/llm-service/rag_api.py` |
| Docker Compose n8n | `docker-compose.n8n.yml` |

Không chỉnh sửa thủ công workflow JSON như source code lâu dài. Khi thay đổi prompt, schema hoặc node configuration, cập nhật generator, chạy lại generator, review diff rồi chạy test.

```powershell
node scripts\build-n8n-campaign-workflow.mjs
npm.cmd run test:be2
```

Workflow export phải luôn được commit với `active: false`.

## 2. Luồng xử lý

```text
Campaign Created Webhook
  → Enrich Verified Campaign
  → Expand Four Personas
  → Loop Over Personas (batchSize=1)
      → Generate Structured Content
          ↳ Gemini Content Model
          ↳ Validate Content Schema
      → Map Canonical Ten Rows
      → Persist Guarded Content Batch
      → Wait Between Gemini Calls (15 giây)
      → quay lại Loop Over Personas
  → Summarize Persona Results
  → Respond Success (HTTP 200)

Bất kỳ node fallible nào lỗi
  → Normalize Error
  → Respond Sanitized Error (HTTP 502/503)
```

n8n xử lý các nhánh theo thứ tự thực thi, không mặc định chạy song song. Loop `batchSize=1` và Wait 15 giây giữ bốn request Gemini tuần tự. `N8N_CONCURRENCY_PRODUCTION_LIMIT=1` trong Docker Compose giới hạn thêm các production execution chồng lấn.

## 3. Input webhook

Workflow nhận payload sự kiện INSERT campaign:

```json
{
  "type": "INSERT",
  "table": "campaigns",
  "schema": "public",
  "record": {
    "id": "<EXISTING_TEST_CAMPAIGN_UUID>"
  },
  "old_record": null
}
```

Campaign phải tồn tại trong cùng Supabase project mà Python API đang sử dụng và phải tham chiếu tới product hợp lệ.

## 4. Output model bắt buộc

Mỗi iteration chỉ sinh một persona:

- `local_guide`
- `family`
- `foodie`
- `budget_traveler`

Output model phải là JSON object có đúng năm root keys:

```json
{
  "persona": "family",
  "hooks": ["10 hooks"],
  "scripts": ["5 script objects"],
  "captions": ["5 captions with hashtags"],
  "ctas": ["5 CTAs containing [LINK_MUA_VE]"]
}
```

Contract chi tiết:

- `hooks`: đúng 10 chuỗi, mỗi chuỗi 20–100 ký tự.
- `scripts`: đúng 5 object gồm `title`, `duration`, `scenes`.
- `duration`: số nguyên 30–45 giây.
- `captions`: đúng 5 chuỗi, mỗi caption có hashtag chứa chữ hoặc số.
- `ctas`: đúng 5 chuỗi và giữ nguyên `[LINK_MUA_VE]`.
- Không wrapper `output`, không key thừa và không giải thích ngoài JSON.

Structured Output Parser kiểm tra JSON Schema. Code validator sau parser tiếp tục kiểm tra persona, số lượng, độ dài và hashtag Unicode trước khi ghi database. Auto-Fix Parser bị tắt để tránh phát sinh thêm một lượt gọi Gemini.

## 5. Mapping sang `public.contents`

Một persona tạo đúng 10 records:

| Index | hook | script | caption | CTA |
|---|---|---|---|---|
| 0–4 | Có | Có | Có | Có |
| 5–9 | Có | `null` | `null` | `null` |

Không cycle lại năm script/caption/CTA bằng `index % 5`.

Mỗi row dùng khóa idempotency:

```text
campaign_id:persona:index
```

`POST /contents/batch` chạy guardrails rồi upsert theo `generation_key`:

- lần đầu: `inserted_count=10`, `updated_count=0`;
- retry: `inserted_count=0`, `updated_count=10`;
- tổng số row không tăng khi retry;
- nếu không truy vấn được existing keys, API fail-closed với HTTP 502 và không upsert.

## 6. Credentials và endpoint

| Node | Endpoint/provider | Credential |
|---|---|---|
| `Campaign Created Webhook` | n8n webhook | Header Auth chứa `N8N_WEBHOOK_TOKEN` |
| `Gemini Content Model` | Google Gemini | Google Gemini (PaLM) API credential |
| `Enrich Verified Campaign` | `http://host.docker.internal:8000/campaigns/enrich` | Header Auth chứa `RAG_API_KEY` |
| `Persist Guarded Content Batch` | `http://host.docker.internal:8000/contents/batch` | Header Auth chứa `CONTENTS_API_KEY` |

Không hardcode key trong node parameter. Sau mỗi lần import sang instance mới, mở từng node và xác nhận credential đúng; tên credential trong export không đảm bảo n8n tự chọn đúng credential trên máy khác.

## 7. Chạy thử bằng Test Webhook

Điều kiện: hoàn thành [SETUP.md](SETUP.md), Python API healthy, Supabase test có campaign hợp lệ và Gemini có quota.

1. Mở workflow nhưng giữ trạng thái **Inactive**.
2. Mở node Webhook, chọn **Test URL**.
3. Bấm **Listen for test event** hoặc **Execute workflow**.
4. Gửi payload từ PowerShell, thay UUID bằng campaign test thật:

```powershell
$payload = @{
  type = "INSERT"
  table = "campaigns"
  schema = "public"
  record = @{ id = "<EXISTING_TEST_CAMPAIGN_UUID>" }
  old_record = $null
} | ConvertTo-Json -Depth 8

Invoke-RestMethod `
  -Method Post `
  -Uri "http://127.0.0.1:5678/webhook-test/be2-campaign-content-v2" `
  -Headers @{ "X-Webhook-Token" = "<N8N_WEBHOOK_TOKEN>" } `
  -ContentType "application/json" `
  -Body $payload
```

Test URL chỉ hoạt động khi workflow đang lắng nghe. Không đổi sang Production URL để smoke test local khi workflow chưa được duyệt.

## 8. Kết quả cần kiểm tra

Trong execution detail:

1. `Enrich Verified Campaign` trả đúng campaign và product.
2. `Expand Four Personas` tạo đúng bốn items.
3. Loop chạy bốn iteration tuần tự.
4. Mỗi iteration chỉ gọi Gemini một lần.
5. Parser và validator đều thành công.
6. Mapper tạo đúng 10 records cùng một persona.
7. API persistence trả HTTP 201.
8. Lần chạy đầu có 10 `content_ids` cho mỗi persona.
9. `Respond Success` trả tổng hợp đủ bốn persona.

Trong Supabase test:

- mỗi persona có đúng 10 canonical rows;
- 5 rows full và 5 rows hook-only;
- trạng thái là lowercase `approved` hoặc `needs_review` đúng với flags;
- không có duplicate `generation_key`.

## 9. Error handling

Các node HTTP, AI và Code có thể lỗi phải dùng error output. Error path kết thúc tại `Respond Sanitized Error`, không được treo khiến caller timeout.

Response lỗi có cấu trúc:

```json
{
  "error": "service_unavailable",
  "message": "Sanitized message",
  "retryable": true,
  "retry_after_seconds": 60
}
```

Status code do workflow hiện tại trả về:

- Gemini quota/rate-limit: 503 và `retryable: true`;
- các lỗi enrich, schema, mapping hoặc persistence còn lại: 502 và `retryable: false`.

Các endpoint Python nội bộ vẫn có thể trả 4xx cho input/auth không hợp lệ, nhưng error branch của workflow sẽ sanitize chúng thành 502 trước khi trả cho webhook caller.

HTTP nội bộ retry tối đa ba lần với khoảng nghỉ 5 giây. Gemini không auto retry và parser không Auto-Fix để tránh nhân request khi quota cạn.

## 10. Retry và idempotency

Để nghiệm thu retry:

1. Ghi lại execution ID lần đầu.
2. Gửi lại cùng campaign/persona payload.
3. Xác nhận response có `inserted_count=0`, `updated_count=10`.
4. Xác nhận `content_ids` và tổng số rows không tăng.
5. Lưu truy vấn hoặc ảnh evidence đã che thông tin nhạy cảm.

Không chạy retry hàng loạt khi Gemini đang trả 429.

## 11. Production activation

Chỉ activate workflow khi có phê duyệt và đáp ứng tất cả điều kiện:

- credentials production/test được chọn đúng theo môi trường;
- webhook có URL HTTPS mà Supabase truy cập được;
- error branches đã được kiểm tra;
- execution history được bật để có audit trail;
- smoke test có execution ID thành công;
- database evidence đúng 4 persona × 10 rows;
- quota Gemini đủ và có người theo dõi;
- workflow-level error workflow/alerting đã được cấu hình cho vận hành unattended.

Production webhook có dạng:

```text
https://<n8n-host>/webhook/<path>
```

Supabase Cloud không gọi được `localhost`; khi thử local cần HTTPS tunnel ổn định. Không dùng Quick Tunnel cho production lâu dài vì URL có thể đổi sau khi restart.

## 12. Evidence cần lưu

Cho mỗi campaign test, lưu:

- workflow ID và execution ID;
- thời gian, mode và trạng thái execution;
- campaign/product UUID và persona;
- output parser đã loại secret;
- response `/contents/batch`;
- số row theo `campaign_id`, `persona`, `status`;
- kết quả retry/idempotency;
- xác nhận FE/Tester2 nhìn thấy nội dung `approved`.

Không commit execution data chứa token, cookie, email, thông tin cá nhân hoặc service-role key.

## 13. Troubleshooting nhanh

| Triệu chứng | Nguyên nhân thường gặp |
|---|---|
| Không có execution khi gọi Test URL | Workflow chưa ở chế độ Listen hoặc dùng sai webhook path. |
| Không có execution khi Supabase gọi | Workflow chưa active, Supabase dùng URL localhost hoặc tunnel URL đã đổi. |
| Parser fail | Sai persona, sai root keys, thiếu 10/5/5/5 hoặc model bọc output không đúng. |
| HTTP 401 | Sai Header Auth hoặc API chưa restart sau khi đổi `.env`. |
| HTTP 404 | Campaign/product không tồn tại trong đúng Supabase project. |
| HTTP 422 | Batch không đúng 10 records hoặc sai contract full/hook-only. |
| HTTP 502 | Python/Supabase lỗi, migration thiếu hoặc preflight persistence thất bại. |
| HTTP 503 | Gemini quota/rate-limit; dừng và chờ reset. |
| DB có status cũ sau retry | Kiểm tra đang chạy code có `ignore_duplicates=False` và migration unique index. |

## 14. Tài liệu liên quan

- [BE2 Content Factory handoff](../be2/content-factory-handoff.md)
- [BE2 JSON Schema](../be2/content-factory.schema.json)
- [BE3 runbook chi tiết](../be3/run-campaign-content-workflow.md)
- [BE3 persistence notes](../be3/n8n-save-contents.md)
