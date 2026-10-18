# BE3_W2 — Báo cáo tiến độ và xác nhận bàn giao

**Dự án:** AI Travel Reseller MVP (TravelLink AI)
**Tuần:** 2 — AI Content Factory & Distribution
**Thành viên:** Thái Thanh Tú (`ThaiThanhTu0212`)
**Vai trò:** BE3 — Automation / n8n và dịch vụ Python tạo nội dung
**Nhánh làm việc:** `Feature_BE3_n8n_Campaign_Content`
**Ngày cập nhật:** 15/10/2026
**Trạng thái báo cáo:** `IN_PROGRESS — API ĐÃ CẬP NHẬT, CHƯA ĐỦ ĐIỀU KIỆN XÁC NHẬN HOÀN THÀNH`

> Báo cáo này đối chiếu Roadmap, kế hoạch Tuần 2, kế hoạch cá nhân `BE3_W2.md`, API contract và bằng chứng người thực hiện đã cung cấp. Chỉ đánh dấu hoàn thành khi có deliverable và bằng chứng chạy tương ứng; không suy đoán trạng thái từ kế hoạch.

## 1. Mục tiêu được giao

Theo `.ai/process/Roadmap.md` và `.ai/process/Week2/Week2.md`, BE3 phụ trách workflow n8n nhận sự kiện Campaign, lấy dữ liệu sản phẩm, gọi LLM tạo nội dung, kiểm tra/đặt trạng thái và lưu các bản ghi nội dung vào `public.contents`. Các yêu cầu cá nhân được chia thành BE3-W2-01 đến BE3-W2-06 trong `BE3_W2.md`.

## 2. Tóm tắt kết quả

Đã chứng minh webhook thử nhận payload `INSERT` và có response `/contents/batch` do người dùng cung cấp với `inserted_count: 10`, `status: approved`, `flags: []`. Người dùng xác nhận mapping 10 hooks/5 assets trên Supabase cho persona `family`, campaign Bà Nà Hills: 10 dòng index 0–9, trong đó 0–4 đủ hook/script/caption/CTA và 5–9 chỉ có hook; tất cả `approved`. Ảnh SQL Editor xác nhận migration `generation_key` và unique index đã có trên project Supabase `main` (Production). Ảnh execution n8n cho thấy execution `#223`, version `b23bbb6e`, trạng thái Succeeded lúc 11:16:35 ngày 16/10/2026. Export workflow Campaign Content đã có trong repo; Structured Output Parser trong export chưa nối vào Basic LLM Chain. API Python có contract batch 10 dòng/persona, guardrails và khóa idempotency `generation_key`; unit tests hiện có dùng Supabase giả lập. Còn thiếu raw output/response gắn với execution #223, bằng chứng retry/idempotency trên Supabase, regenerate `database.types.ts`, E2E các persona/campaign còn lại, cùng Tester 2 acceptance.

**Kết luận:** Có tiến triển và prototype chạy thử một phần; chưa thể nộp là toàn bộ nhiệm vụ BE3-W2 đã hoàn thành.

## 3. Tiến độ theo task

| Task | Yêu cầu trong kế hoạch | Trạng thái | Bằng chứng hiện có / việc còn thiếu |
|---|---|---|---|
| BE3-W2-01 | Webhook tiếp nhận Campaign | `PARTIAL` | Webhook POST và Header Auth đã nhận payload thử bằng Postman; output có `type: INSERT`, `table: campaigns`, `schema: public`, `record.id`. Chưa xác nhận sự kiện INSERT thật từ Supabase tới Production URL ổn định. |
| BE3-W2-02 | Tích hợp prompt/schema LLM của BE2 vào n8n | `EXECUTION SUCCEEDED / PARSER WIRING GAP` | Ảnh execution `#223` cho thấy workflow đã chạy thành công sau khi Publish. Export xác nhận prompt/schema và Code validator hiện có, nhưng Structured Output Parser không nối vào Basic LLM Chain. Cần quyết định nối parser rồi retest hoặc xin BE2 chấp thuận validator hiện tại; không yêu cầu thay đổi input User Message. |
| BE3-W2-03 | Parse, kiểm duyệt và ghi vào `public.contents` | `API UPDATED / FAMILY MAPPING VERIFIED / PARTIAL E2E` | API Python và unit test mock đã có. SQL evidence do người dùng cung cấp xác nhận campaign Bà Nà Hills/persona `family` có 10 dòng index 0–9 theo contract BE2 (0–4 full-kit; 5–9 hook-only), tất cả approved. Migration và unique index đã được xác nhận trên Supabase `main` Production; `src/lib/database.types.ts` vẫn chưa có `generation_key`. Chưa gắn query rows với execution #223/raw output và chưa xác minh các persona/campaign còn lại. |
| BE3-W2-04 | Retry tối đa 5 lần và xử lý 429/503 | `CONFIGURED — WAITING TEST` | Ảnh node Gemini xác nhận `Retry On Fail` bật, `Max. Tries = 5`, `Wait Between Tries = 5000 ms`. Chưa có execution chứng minh lỗi 429/503 đã được retry và xử lý thành công. |
| BE3-W2-05 | Python fallback generator độc lập | `NOT VERIFIED` | Dịch vụ Python hiện có trong repo, nhưng chưa có bằng chứng hàm/script fallback tự đọc Campaign, sinh nội dung và lưu `contents` theo Definition of Done tuần 2. |
| BE3-W2-06 | E2E và export JSON workflow Campaign | `PARTIAL / EXPORT ADDED; EVIDENCE PENDING` | Đã thêm `services/llm-service/workflow_campaign_content.json` từ file người dùng cung cấp; đã loại `meta.instanceId` và scan không thấy secret dạng API key/token/bearer. Execution `#223` thành công theo ảnh nhưng chưa có raw output/response API gắn kèm. Mapping family trên campaign Bà Nà Hills đã được đối chiếu bằng SQL; chưa có E2E đủ 4 persona cho cả Bà Nà Hills và VinWonders. File `workflow_ai_travel_review.json` là workflow review tuần 1, không thay thế deliverable này. Chưa có Tester 2 acceptance. |

## 4. Bằng chứng được cung cấp

- Kết quả Postman/n8n cho thấy webhook test nhận payload Campaign với `record.id`.
- Ảnh node Python cho thấy request thử gọi `http://host.docker.internal:8000/campaigns/enrich`; lượt đầu báo `ECONNREFUSED`, sau đó người thực hiện cho biết workflow đã chạy thành công.
- Ảnh Settings của node `Gemini - Generate Campaign Draft` cho thấy `Retry On Fail` bật, tối đa 5 lần, chờ 5000 ms giữa các lần thử; ảnh không hiển thị execution có lỗi được retry.
- Output Google Sheets do người thực hiện gửi có các trường Campaign/Product và `content_draft`; các giá trị có dấu `=` ở đầu và Sheet hiển thị `#ERROR!`.
- Ảnh/nội dung đầu ra Gemini có placeholder như `[Chèn Hook từ dữ liệu Campaign]`, nên chất lượng/mapping nội dung chưa đạt yêu cầu sử dụng.
- Sau merge BE2 PR #18, unit tests `python -m unittest tests.test_rag_api_contents -v` chạy 6/6 thành công với Supabase giả lập; đây không phải bằng chứng ghi DB thật.
- Unit tests `python -m unittest tests.test_rag_api_contents -v` chạy 8/8 thành công với Supabase giả lập; chúng kiểm tra payload full-kit và hook-only tail. Mapping chuẩn đã được BE2 mô tả là 5 dòng full-kit + 5 dòng hook-only, và người dùng xác nhận đã kiểm tra mapping trên Supabase.
- Người dùng cung cấp response của `/contents/batch`: campaign `409695b2-9eed-43f2-b8a0-49dac50eabb9`, `inserted_count: 10`, `status: approved`, `flags: []`. Response này chưa chứng minh bốn persona cho campaign demo `44444444-4444-4444-4444-444444444444`.
- Người dùng xác nhận mapping 10 hooks/5 assets đã được kiểm tra trên Supabase. Mapping cần bàn giao theo BE2 là 5 dòng đủ hook/script/caption/CTA và 5 dòng chỉ hook; không lặp vòng assets.
- Ảnh n8n do người dùng cung cấp hiển thị execution `#223`, version `b23bbb6e`, `Succeeded` trong 30.308 giây vào 11:16:35 ngày 16/10/2026. Ảnh là bằng chứng workflow chạy thành công, nhưng chưa chứa raw output hoặc response `/contents/batch` để đối chiếu với dữ liệu Supabase.
- Ảnh SQL Editor của project `main` (Production) xác nhận `public.contents.generation_key` kiểu `text` và unique index `contents_generation_key_uidx` tồn tại. `src/lib/database.types.ts` hiện chưa có `generation_key`; cần regenerate từ đúng project.
- Truy vấn SQL của campaign Bà Nà Hills xác nhận persona `family` có 10 dòng index 0–9: index 0–4 có đủ hook/script/caption/CTA; index 5–9 chỉ có hook; toàn bộ approved. Các persona khác/campaign VinWonders chưa được xác minh đủ 10 dòng/persona.
- Export Campaign Content đã được lưu tại `services/llm-service/workflow_campaign_content.json`; đã bỏ `meta.instanceId`, giữ credential references (không phải secret), và scan mẫu secret không phát hiện giá trị nhúng.
- Chưa có raw output/response API được lưu gắn với execution `#223` hoặc xác nhận Tester 2 nghiệm thu. Export cho thấy Structured Output Parser chưa nối vào Basic LLM Chain.

Các bằng chứng trên xác nhận một lượt thử một phần; chúng chưa xác nhận toàn bộ tiêu chí nghiệm thu của BE3-W2.

## 5. Vấn đề cần khắc phục trước khi xác nhận hoàn thành

1. **Webhook production:** Cấu hình Supabase gửi sự kiện vào URL HTTPS đang hoạt động; kiểm tra execution trong n8n sau khi tạo Campaign thật. Quick Tunnel có thể đổi URL khi khởi tạo lại, nên cần cập nhật nơi cấu hình webhook nếu URL đổi.
2. **Payload:** Bảo đảm payload thực có `record.id`, `record.product_id` và các trường Campaign cần thiết; Python không thể truy vấn đầy đủ sản phẩm chỉ từ một ID Campaign nếu thiếu contract/truy vấn tương ứng.
3. **Gemini:** Export hiện có prompt, Code validator và mapper 10 rows, nhưng Structured Output Parser chưa nối vào Basic LLM Chain. Chốt với BE2 việc yêu cầu parser native hay chấp nhận validator hiện tại; nếu nối parser, retest trước khi Publish. Kiểm tra prompt không còn placeholder.
4. **Google Sheets (nếu còn dùng để debug):** Gỡ dấu `=` thừa ở đầu các giá trị văn bản/UUID để Google Sheets không diễn giải chúng như công thức.
5. **Supabase:** Migration `generation_key` và unique index đã được xác nhận trên project `main` Production; regenerate `src/lib/database.types.ts` từ đúng project, sau đó chứng minh retry/idempotency live. Không đưa Service Role Key vào workflow export hoặc file Git.
6. **Reliability/fallback:** Kiểm thử retry 429/503 trong n8n và chứng minh Python fallback độc lập nếu vẫn thuộc deliverable BE3-W2.
7. **Bàn giao:** Lưu raw output + response API gắn với execution `#223`, chốt parser wiring với BE2, rồi nhận Tester 2 acceptance. Workflow export đã có trong repo.

## 6. Tiêu chí để chuyển báo cáo sang DONE

- [ ] Campaign mới tạo trên Supabase kích hoạt đúng webhook Production và tạo execution thành công trong n8n.
- [ ] Workflow lấy đúng Campaign/Product và Gemini trả nội dung thật, không còn placeholder.
- [ ] Nội dung hợp lệ được ghi vào `public.contents` với liên kết Campaign và status lowercase `approved` / `needs_review` theo kết quả guardrails.
- [ ] Có bằng chứng retry khi gặp lỗi 429/503 hoặc xác nhận rõ giới hạn đã được nhóm chấp thuận.
- [ ] Python fallback đã được demo/test nếu giữ trong scope task cá nhân.
- [x] Có file export workflow Campaign không chứa secret trong repo: `services/llm-service/workflow_campaign_content.json` (credential references còn lại; cần chọn lại khi import instance khác).
- [ ] Chốt và nghiệm thu Structured Output Parser: hiện node có trong export nhưng chưa nối vào Basic LLM Chain.
- [ ] Lưu execution `#223` cùng raw output đã khử thông tin nhạy cảm và response API; đối chiếu campaign/persona với 10 dòng trong Supabase.
- [x] Migration `generation_key` và unique index đã xác nhận tồn tại trên Supabase `main` Production.
- [ ] `src/lib/database.types.ts` đã regenerate từ đúng project và có trường `generation_key`.
- [ ] Retry cùng batch trên Supabase thật trả lại cùng IDs, không phát sinh thêm records.
- [ ] FE/QA nhận được mẫu dữ liệu và xác nhận có thể đọc nội dung từ bảng `contents`.
- [ ] Tester 2 đã kiểm tra output/guardrails và ghi nhận acceptance.
- [ ] Commit và PR nhắm vào `dev` theo quy trình Git của nhóm; được review/merge trước khi ghi trạng thái hoàn tất.

## 7. Kế hoạch tiếp tục

| Ưu tiên | Việc cần làm | Deliverable kiểm chứng được |
|---|---|---|
| P0 | Chốt URL webhook production và xác nhận Supabase INSERT Campaign thực kích hoạt n8n | Execution ID n8n và payload đã ẩn thông tin bí mật |
| P0 | Chốt BE2 acceptance cho parser wiring và lưu bằng chứng model/API của execution `#223` | Quyết định parser native hay Code validator; raw output/response đã khử nhạy cảm |
| P0 | Đối chiếu execution `#223` với response API và 10 rows trong Supabase | Raw output/response khử nhạy cảm, campaign/persona, query result và execution ID |
| P1 | Thử retry lỗi API và hoàn thiện xử lý lỗi | Execution/log cho thấy node thử lại khi gặp lỗi tạm thời và kết quả cuối cùng |
| P1 | Hoàn thiện Python fallback nếu vẫn thuộc scope; đóng gói bằng chứng E2E | Script (nếu còn yêu cầu), raw output và execution ID |
| P1 | Chốt database và nghiệm thu | Migration applied, database types mới, bằng chứng retry/idempotency live, Tester 2 acceptance |

## 8. Nội dung cập nhật ngắn cho `TEAM_WORK_LOG.md`

Chỉ cập nhật trạng thái trong log nhóm sau khi đối chiếu bằng chứng mới. Mapping BE2 đã được người dùng xác nhận là đã kiểm tra trên Supabase; execution `#223` đã thành công theo ảnh; workflow JSON đã được thêm. Raw output/response gắn với execution, parser wiring acceptance, migration/types, live retry/idempotency và Tester 2 acceptance vẫn chưa có đủ bằng chứng để đánh dấu `DONE`.
