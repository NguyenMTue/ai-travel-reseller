# BE3 — Hướng dẫn chạy Campaign Content Workflow

> Tài liệu này hướng dẫn chuẩn bị và kiểm tra workflow Campaign Content. Bản export trong repo đang **inactive** để có thể phát triển/test offline mà không gọi Gemini hoặc ghi Supabase. Chỉ bật workflow sau khi quota đã hồi và nhóm duyệt smoke test live.

## 1. Luồng xử lý

```text
Supabase INSERT campaigns
  → n8n Webhook
  → Python POST /campaigns/enrich (đọc campaign, product, RAG)
  → Expand Four Personas
  → Loop Over Personas (batchSize = 1)
      → Basic LLM Chain + Gemini (không auto retry)
      → Structured Output Parser (không gọi fixer model)
      → map 10 hooks thành 10 records
      → Python POST /contents/batch (guardrails + lưu Supabase)
      → Wait 15 giây → quay lại loop
  → tổng hợp kết quả → HTTP 200
```

Workflow Campaign Content đã được export tại [workflow_campaign_content.json](../../services/llm-service/workflow_campaign_content.json). Workflow chạy độc lập với workflow cũ `workflow_ai_travel_review.json`. Structured Output Parser đã nối vào chain; Code node vẫn kiểm tra lại contract trước khi ghi database.

### Chế độ offline hiện tại

- Không khởi động n8n/Python API và không bấm **Execute workflow**.
- Không publish/activate workflow; trường `active` trong JSON phải là `false`.
- Chỉ chạy generator và test tĩnh trong repo. Các test này không dùng network, Gemini hoặc Supabase.
- Auto-fix parser bị tắt vì fixer cũng là một lượt Gemini. Model chain không retry để lỗi 429 không nhân số request.
- Enrich/Persist là HTTP nội bộ, retry tối đa 3 lần với khoảng nghỉ 5 giây.
- Khi Gemini trả `429`, `RESOURCE_EXHAUSTED`, quota hoặc rate-limit, webhook trả sanitized HTTP `503`, `retryable: true`, `retry_after_seconds: 60`.
- Loop chỉ giới hạn request trong một execution. Trước khi publish trên n8n self-hosted, bắt buộc đặt `N8N_CONCURRENCY_PRODUCTION_LIMIT=1` để các campaign đồng thời được xếp hàng FIFO thay vì cùng gọi Gemini.

Lệnh kiểm tra offline:

```powershell
node scripts\build-n8n-campaign-workflow.mjs
npm.cmd run test:be2
```

## 2. Contract nội dung cần giữ

Mỗi lần gọi Basic LLM Chain sinh **một persona**: `local_guide`, `family`, `foodie` hoặc `budget_traveler`. Output là một object theo schema [content-factory.schema.json](../be2/content-factory.schema.json):

- `persona`: đúng persona của lượt chạy.
- `hooks`: đúng 10 chuỗi.
- `scripts`: đúng 5 object `title`, `duration`, `scenes`.
- `captions`: đúng 5 chuỗi, mỗi chuỗi có hashtag.
- `ctas`: đúng 5 chuỗi, mỗi chuỗi có `[LINK_MUA_VE]`.

Mapper theo handoff BE2 tạo 10 records cho một persona: 5 records đầu có đủ hook/script/caption/CTA; 5 records sau chỉ có hook, ba trường asset còn lại là `null`. **Đây là mapping chuẩn cần dùng; không lặp assets bằng `index % 5`.** Người dùng xác nhận mapping đã được kiểm tra trên Supabase; lưu lại campaign/persona, execution ID và truy vấn 10 dòng trong bộ bằng chứng E2E để hoàn tất nghiệm thu. Xem [BE2 handoff](../be2/content-factory-handoff.md#database-persistence-contract-ready-for-review).

API nhận một batch gồm đúng 10 records và một persona. Chạy đủ bốn persona sẽ tạo 4 batch, tức tối đa 40 records cho mỗi campaign. Trạng thái do guardrails trong API quyết định; nội dung có thể là `approved` hoặc `needs_review`. Nếu database đang có trigger duyệt tạm của BE1, kiểm tra trigger trước khi dùng trạng thái để kết luận guardrails đã duyệt nội dung.

## 3. Chuẩn bị môi trường

### Python API

Mở PowerShell tại thư mục gốc repo:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\.venv\Scripts\Activate.ps1
python -m pip install -r services\llm-service\requirements.txt
```

Tạo `services/llm-service/.env` từ `services/llm-service/.env.example` nếu chưa có. Điền đúng project Supabase test mà campaign/product đang nằm trong đó:

```dotenv
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_KEY=<service-role-key-cua-project-test>
RAG_API_KEY=<chuoi-ngau-nhien-rieng-tu-32-ky-tu-tro-len>
CONTENTS_API_KEY=<chuoi-ngau-nhien-khac-32-ky-tu-tro-len>
```

Không commit file `.env`, không dán key vào prompt/node text, Google Sheet hoặc ảnh chụp màn hình. `SUPABASE_KEY` chỉ ở Python service; n8n chỉ giữ `RAG_API_KEY` và `CONTENTS_API_KEY` trong Credentials.

Khởi động API trong cửa sổ PowerShell riêng:

```powershell
Set-Location services\llm-service
python -m uvicorn rag_api:app --host 0.0.0.0 --port 8000
```

Giữ cửa sổ này mở. Kiểm tra API từ trình duyệt trên máy host tại `http://localhost:8000/health`; kết quả cần có `"status":"ok"`. Tài liệu API tương tác có tại `http://localhost:8000/docs`.

### n8n, Supabase, model và network

1. Mở n8n tại `http://localhost:5678` và chọn đúng workflow Campaign Content.
2. Mở từng node có credential, kiểm tra đúng credential test cho Gemini và Header Auth. Không cần đưa API key vào prompt.
3. Với node HTTP chạy bên trong n8n Docker, URL Python API thường là `http://host.docker.internal:8000`, không phải `localhost:8000` (localhost trong container là chính container đó).
4. Node `/campaigns/enrich` gửi header `X-API-Key` bằng credential chứa `RAG_API_KEY`; node `/contents/batch` dùng credential riêng chứa `CONTENTS_API_KEY`.
5. Structured Output Parser dùng schema BE2 và **tắt Auto-Fix Format**. Nếu output sai schema, execution dừng qua error branch; không bật fixer vì nó tạo thêm request Gemini.
6. Nếu Supabase Cloud cần gọi webhook trên máy local, Supabase không thể gọi `localhost`. Dùng HTTPS tunnel Cloudflare đang chạy và cấu hình URL đầy đủ gồm `/webhook/<path>` trong trigger/DB webhook. Quick Tunnel có thể đổi URL sau khi restart; cập nhật lại cấu hình nếu URL thay đổi. Giữa n8n Docker và Python trên cùng máy Windows, gọi Python qua `host.docker.internal`; không cần Cloudflare cho kết nối này.
7. Trên n8n self-hosted, thêm `N8N_CONCURRENCY_PRODUCTION_LIMIT: "1"` vào `environment` của service n8n rồi restart container trước khi publish. Giới hạn này áp dụng cho production webhook/trigger; manual execution không nằm trong hàng đợi concurrency.

## 4. Chạy thử live sau khi quota đã hồi

Phần này chưa được thực hiện trong chế độ offline. Chỉ làm khi Google AI Studio không còn báo rate limit, credential test đã được xác nhận và nhóm cho phép ghi vào Supabase test.

Chỉ dùng campaign đã tồn tại trong **cùng Supabase project** mà Python `.env` trỏ tới. `/campaigns/enrich` sẽ tra campaign và product theo UUID; truyền một UUID giả hoặc chỉ có trong project khác sẽ không chạy.

### Test webhook từ n8n

1. Trong node Webhook, chọn **Test URL** và bấm **Listen for test event** / **Execute workflow** để n8n chờ request.
2. Từ PowerShell khác, gửi một sự kiện test. Thay UUID bằng campaign test thật:

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
  -Uri "http://localhost:5678/webhook-test/supabase-campaign-created-content-test" `
  -ContentType "application/json" `
  -Body $payload
```

Đường dẫn test ở ví dụ phải khớp **Path** của Webhook node. Nếu path của workflow khác, thay cả URL theo node. Test webhook chỉ hoạt động khi n8n đang lắng nghe; nó không phải URL để Supabase gọi thường trực.

### Chạy production webhook / tạo campaign từ FE

Để Supabase hoặc FE kích hoạt workflow thật:

1. Bật Active/Published workflow.
2. Dùng **Production URL** của Webhook node: `https://<n8n-host>/webhook/<path>` (hoặc địa chỉ tunnel đang hoạt động nếu n8n chạy local).
3. Kiểm tra DB Webhook/trigger của Supabase đang trỏ đúng URL production đó. Payload cần có `type: INSERT`, `table: campaigns`, `schema: public`, `record.id`.
4. Tạo campaign test từ FE hoặc thực hiện một INSERT test đã được nhóm cho phép. Không dùng campaign production để kiểm tra vì nhánh `/contents/batch` ghi vào Supabase.

Để mở FE cục bộ, cấu hình `.env.local` theo README và trỏ nó vào đúng Supabase test, rồi mở PowerShell thứ ba ở thư mục gốc:

```powershell
npm.cmd run dev
```

Mở `http://localhost:3000`, đăng nhập tài khoản test được nhóm cấp và tạo campaign gắn với product test. Nếu trigger Supabase đã được cấu hình đúng, sự kiện sẽ tới n8n Production Webhook. Theo dõi execution ngay trong n8n; nếu không xuất hiện, kiểm tra URL webhook và Cloudflare tunnel trước khi tạo campaign lần nữa.

## 5. Kiểm tra một campaign và bốn persona

1. Chạy đúng một campaign test và mở **Executions** → execution mới nhất.
2. Xác nhận `Loop Over Personas` chạy bốn iteration tuần tự, mỗi iteration chỉ có một persona và có `Wait Between Gemini Calls` 15 giây trước iteration kế tiếp.
3. Xác nhận mỗi persona chỉ gọi `Gemini Content Model` một lần; không có `Gemini Schema Fixer` và không có retry ở `Generate Structured Content`.
4. Trong output mapper, xác nhận `campaign_id` đúng, có đúng 10 records, cùng một persona. Records 1–5 có script/caption/CTA; records 6–10 có `null` cho cả ba trường này.
5. Mỗi `/contents/batch` cần trả HTTP `201`, `inserted_count: 10`, đúng 10 `content_ids`; `status` là `approved` hoặc `needs_review` và `flags` phản ánh guardrails.
6. Kiểm tra `public.contents` theo `campaign_id` + `persona`: kỳ vọng 10 rows cho từng persona, tối đa 40 rows/campaign sau lần đầu. Chỉ rows `approved` được FE hiển thị theo contract hiện tại.
7. Nếu nhận HTTP 503 rate-limit, không chạy lại liên tục. Dừng test, kiểm tra quota/reset trên Google AI Studio rồi retry campaign sau.

### Retry / idempotency

API dùng `generation_key` dạng `campaign_id:persona:index` và unique index để nhận diện lần chạy lặp. Trước khi kiểm tra retry trên DB, xác nhận migration [20261015165230_contents_generation_key.sql](../../supabase/migrations/20261015165230_contents_generation_key.sql) đã được apply vào đúng project. Gửi lại đúng cùng batch; xác nhận response trả lại cùng IDs và số rows trong DB không tăng. Test unit giả lập không thay thế kiểm chứng này trên Supabase thật.

Nếu migration chưa apply, người có quyền quản lý database phải xác nhận project trước khi chạy lệnh deploy migration. Sau khi apply, regenerate `src/lib/database.types.ts` từ chính project đã cập nhật. Không chạy lệnh migration lên Cloud khi chưa xác nhận đây là project test được phép thay đổi.

## 6. Bằng chứng nghiệm thu cần lưu

### Các mục BE2 đang ghi nhận còn thiếu

- `workflow_campaign_content.json` đã có trong repo, đang inactive; credential references còn nguyên để nhận diện credential nhưng không chứa giá trị bí mật. Khi import sang instance khác, chọn lại credentials.
- Structured Output Parser đã nối vào Basic LLM Chain; vẫn cần một execution live hợp lệ để nghiệm thu trên đúng phiên bản n8n đang dùng.
- Đã có ảnh execution `#223` succeeded (version `b23bbb6e`); chưa có raw output/response API được lưu và đối chiếu với 10 dòng Supabase trong repo.
- Ảnh SQL Editor trên project Supabase `main` (Production) xác nhận cột `public.contents.generation_key` kiểu `text` và unique index `contents_generation_key_uidx` đã tồn tại.
- `src/lib/database.types.ts` chưa có trường `generation_key`; cần regenerate từ đúng Supabase project.
- SQL evidence xác nhận mapping persona `family` của campaign Bà Nà Hills: index 0–4 full-kit, index 5–9 hook-only, đủ 10 dòng approved. Chưa xác nhận đủ bốn persona cho cả Bà Nà Hills và VinWonders.
- Chưa có Tester 2 acceptance.

Không đánh dấu các mục này là hoàn tất chỉ dựa trên unit test giả lập hoặc một response API rời; cần đính kèm bằng chứng tương ứng.

Mỗi campaign/persona cần lưu:

- campaign UUID, product UUID và persona;
- n8n execution ID cùng trạng thái thành công;
- raw output của model/parser (đã loại thông tin nhạy cảm);
- response `/contents/batch` gồm `inserted_count`, `content_ids`, `status`, `flags`;
- truy vấn/xác nhận số dòng trong `public.contents`;
- execution ID lần retry và xác nhận IDs/số dòng không đổi;
- xác nhận FE hoặc Tester 2 nhìn thấy sample `approved`.

Export workflow trước khi commit phải giữ `active: false`, loại secret và kiểm tra cả credential IDs/tham chiếu môi trường. Không đưa execution data chứa token, email hoặc dữ liệu cá nhân lên Git. Sau khi smoke test live, export lại từ n8n và kiểm tra diff trước khi commit.

## 7. Xử lý lỗi thường gặp

| Lỗi | Kiểm tra trước |
|---|---|
| `ECONNREFUSED` tới Python | API còn chạy không; n8n Docker dùng `host.docker.internal:8000` chưa; API có bind `0.0.0.0` không. |
| `/campaigns/enrich` trả 401/503 | Credential header đúng `RAG_API_KEY` chưa; key trong `.env` có từ 32 ký tự và API đã restart sau khi cập nhật chưa. |
| Campaign/product 404 | UUID có tồn tại trong Supabase project của Python `.env` không; campaign có `product_id` hợp lệ không. |
| `/contents/batch` trả 401/503 | HTTP node đang dùng `CONTENTS_API_KEY` riêng chưa; không dùng nhầm `RAG_API_KEY` hoặc Supabase service-role key. |
| `/contents/batch` trả 422 | Đúng 10 records, một persona, hook hợp lệ; theo contract BE2, 5 records đầu đủ assets và 5 records cuối chỉ có hook với `script`, `caption`, `cta` là `null`; CTA có `[LINK_MUA_VE]`; caption có hashtag. API có thể giữ tương thích với tail đầy đủ, nhưng workflow chuẩn phải gửi mapping BE2. |
| `/contents/batch` trả 502 khi upsert | Kiểm tra migration/unique index `generation_key` đã apply vào đúng DB chưa, rồi xem log Python. |
| `Model output doesn't fit required format` | Mở input/raw text của Basic LLM Chain; kiểm tra JSON bị bọc code fence/`output`, sai persona, sai số lượng, trường thừa hoặc sai kiểu. So với schema BE2; không đổi schema để che lỗi. |
| Model trả rỗng / 429 | Workflow phải trả HTTP 503 và dừng execution. Không bật model retry/auto-fix; kiểm tra quota/reset trước khi chạy lại. |
| FE không thấy nội dung | Kiểm tra `campaign_id`, persona, `status` chính xác là lowercase `approved`, và trigger tạm nếu có đang can thiệp status. |

## Tài liệu liên quan

- [BE2 Content Factory handoff](../be2/content-factory-handoff.md)
- [BE2 JSON Schema](../be2/content-factory.schema.json)
- [BE3 API/persistence notes](n8n-save-contents.md)
- [BE3 completion report](../../.ai/process/Week2/BE3_W2_COMPLETION_REPORT.md)
