# Thiết lập n8n cho AI Travel Reseller

Tài liệu này giúp thành viên mới dựng môi trường n8n local, kết nối Gemini và hai API nội bộ của dự án mà không đưa bí mật vào workflow. Workflow được giữ **inactive** sau khi import; chỉ bật production sau khi hoàn thành checklist ở cuối tài liệu.

Tài liệu vận hành workflow: [WORKFLOW.md](WORKFLOW.md).

## 1. Thành phần cần chạy

```text
Supabase local/test       http://127.0.0.1:54321
Python Content API        http://127.0.0.1:8000
n8n Docker                http://127.0.0.1:5678
Next.js (không bắt buộc)  http://127.0.0.1:3000
```

n8n chạy trong Docker nên gọi API trên máy Windows bằng `host.docker.internal`, không dùng `localhost`:

```text
http://host.docker.internal:8000/campaigns/enrich
http://host.docker.internal:8000/contents/batch
```

## 2. Yêu cầu trước khi cài

- Git, Node.js và npm.
- Docker Desktop đang chạy.
- Python tương thích với `services/llm-service/requirements.txt`.
- Supabase CLI của repo (`npx.cmd supabase ...`).
- Gemini API key có quota.
- Chỉ dùng Supabase local hoặc project test được phép ghi dữ liệu.

Không dùng project production để chạy thử workflow này.

## 3. Chuẩn bị Supabase local

Tại thư mục gốc repo:

```powershell
npx.cmd supabase start
npx.cmd supabase status -o env
```

Lệnh `status -o env` hiển thị URL và key của Supabase local. Không commit hoặc gửi các key này qua chat. Dashboard Supabase local thường có trong output của lệnh `status`.

Kiểm tra migration `generation_key` đã được áp dụng trong local database:

```text
supabase/migrations/20261015165230_contents_generation_key.sql
```

Không chạy migration hoặc reset database cloud nếu chưa xác nhận chính xác project test và phạm vi dữ liệu được phép thay đổi.

## 4. Cấu hình Python Content API

Tạo file môi trường từ mẫu:

```powershell
Copy-Item services\llm-service\.env.example services\llm-service\.env
```

Điền các biến sau trong `services/llm-service/.env`:

```dotenv
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=<local-service-role-key>
RAG_API_KEY=<chuoi-rieng-tu-toi-thieu-32-ky-tu>
CONTENTS_API_KEY=<chuoi-khac-toi-thieu-32-ky-tu>
N8N_WEBHOOK_TOKEN=<chuoi-rieng-bao-ve-campaign-webhook>
```

Quy tắc bắt buộc:

- `RAG_API_KEY`, `CONTENTS_API_KEY` và `N8N_WEBHOOK_TOKEN` phải là các chuỗi riêng biệt.
- Không dùng Supabase service-role key làm API key cho n8n.
- Không commit `.env` hoặc chụp màn hình có giá trị key.
- Gemini key chỉ lưu trong n8n Credential Store, không đưa vào workflow JSON.

Tạo môi trường Python nếu chưa có:

```powershell
py -m venv services\llm-service\.venv
& services\llm-service\.venv\Scripts\Activate.ps1
python -m pip install -r services\llm-service\requirements.txt
```

Khởi động API trong một cửa sổ PowerShell riêng:

```powershell
Set-Location services\llm-service
& .\.venv\Scripts\Activate.ps1
python -m uvicorn rag_api:app --host 0.0.0.0 --port 8000
```

Kiểm tra:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

Response phải có `status: ok`.

## 5. Khởi động n8n

Tại thư mục gốc repo:

```powershell
docker compose -f docker-compose.n8n.yml up -d
docker compose -f docker-compose.n8n.yml ps
```

Mở `http://127.0.0.1:5678`. Lần đầu chạy, tạo owner account local theo giao diện n8n.

File compose đã cấu hình:

- timezone `Asia/Ho_Chi_Minh`;
- persistent volume `n8n_data`;
- workflow directory được mount read-only tại `/workflows`;
- `N8N_CONCURRENCY_PRODUCTION_LIMIT=1` để tránh nhiều production execution đồng thời làm burst Gemini;
- diagnostics và personalization bị tắt.

Dừng n8n nhưng giữ dữ liệu:

```powershell
docker compose -f docker-compose.n8n.yml down
```

Không thêm `-v` trừ khi thật sự muốn xóa volume và toàn bộ dữ liệu n8n local.

## 6. Tạo credentials trong n8n

Vào **Credentials** trong n8n và tạo bốn credential riêng:

| Tên gợi ý | Credential type | Giá trị |
|---|---|---|
| `Gemini Content Model - Test` | Google Gemini (PaLM) API | Gemini API key test |
| `Campaign Webhook Header - Local` | Header Auth | Header `X-Webhook-Token`, value bằng `N8N_WEBHOOK_TOKEN` |
| `RAG API Header - Local` | Header Auth | Header `X-API-Key`, value bằng `RAG_API_KEY` |
| `Contents API Header - Local` | Header Auth | Header `X-API-Key`, value bằng `CONTENTS_API_KEY` |

Tên hiển thị có thể khác, nhưng phải chọn đúng credential ở từng node sau khi import. Không nhập key trong Headers, Code node, Set node hoặc prompt text.

## 7. Import workflow

Trong n8n:

1. Chọn **Import from File**.
2. Chọn `services/llm-service/workflow_campaign_content.json`.
3. Mở từng node có credential và gán lại:
   - `Campaign Created Webhook` → `Campaign Webhook Header - Local`.
   - `Gemini Content Model` → Gemini credential test.
   - `Enrich Verified Campaign` → `RAG API Header - Local`.
   - `Persist Guarded Content Batch` → `Contents API Header - Local`.
4. Kiểm tra hai HTTP URL vẫn dùng `host.docker.internal:8000`.
5. Lưu workflow bằng nút **Save** hoặc `Ctrl+S`.
6. Giữ workflow **Inactive**.

Không dựa vào credential ID có sẵn trong file export; credential reference trong một instance khác không đảm bảo tồn tại ở máy mới.

## 8. Kiểm tra offline trước khi gọi Gemini

```powershell
node scripts\build-n8n-campaign-workflow.mjs
npm.cmd run build:be2:w3-schemas
npm.cmd run test:be2
npm.cmd run test:tester2
```

Sau khi chạy generator, `git status --short` không được xuất hiện thay đổi ngoài dự kiến. Workflow JSON phải tiếp tục có `active: false` và không chứa secret.

## 9. Smoke test local

Chỉ chạy khi:

- Python `/health` trả `ok`;
- campaign test tồn tại trong cùng Supabase mà `.env` đang trỏ tới;
- bốn credential đã được chọn đúng;
- Gemini còn quota;
- nhóm cho phép ghi dữ liệu test.

Thực hiện theo [WORKFLOW.md](WORKFLOW.md#chạy-thử-bằng-test-webhook). Khi gặp `429` hoặc `RESOURCE_EXHAUSTED`, dừng test và chờ quota reset; không bấm chạy lại liên tục.

## 10. Checklist trước production

- [ ] Đã chạy test offline thành công.
- [ ] Đã chạy một smoke test trên Supabase test.
- [ ] Execution có lưu history và có execution ID.
- [ ] Bốn persona chạy tuần tự, mỗi persona đúng một lần gọi Gemini.
- [ ] Mỗi persona lưu đúng 10 rows: 5 full + 5 hook-only.
- [ ] Retry không tạo duplicate `generation_key`.
- [ ] Error path trả JSON 5xx đã sanitize.
- [ ] Credential của từng node đã được kiểm tra thủ công.
- [ ] Webhook production có auth/network boundary phù hợp.
- [ ] Có người phụ trách theo dõi execution và quota.

Chỉ activate/publish workflow sau khi toàn bộ mục trên được duyệt.

## 11. Lỗi thường gặp

| Lỗi | Cách kiểm tra |
|---|---|
| n8n không mở được | Docker Desktop đang chạy chưa; kiểm tra `docker compose ... ps` và port 5678. |
| `ECONNREFUSED :8000` | Python API có bind `0.0.0.0`; node có dùng `host.docker.internal` thay vì `localhost`. |
| HTTP 401 từ API | Node đã chọn đúng Header Auth; value có khớp key trong `.env`; API đã restart sau khi đổi env. |
| Campaign 404 | Campaign UUID và product phải tồn tại trong đúng Supabase project của Python. |
| `/contents/batch` trả 502 | Kiểm tra Supabase local, migration/unique index `generation_key` và log Python. |
| Model trả sai schema | Không bật Auto-Fix; kiểm tra raw output, số lượng 10/5/5/5 và persona. |
| Gemini 429 | Dừng execution, kiểm tra Google AI Studio và chờ reset quota. |
