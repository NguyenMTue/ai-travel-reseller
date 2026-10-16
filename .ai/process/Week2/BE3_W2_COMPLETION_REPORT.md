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

Đã chứng minh webhook thử nhận payload `INSERT` và một lượt thử cũ chạy tới Google Sheets. Sau khi merge `origin/dev` (BE2 PR #18), API Python được cập nhật theo contract mới: batch 10 dòng/persona, script object được định dạng, trạng thái lowercase do guardrails phía server quyết định. Theo thống nhất BE1–BE3 ngày 16/10, API hiện nhận được cả 10 dòng có đủ Hook/Script/Caption/CTA; mapper demo cần xoay vòng 5 bộ script/caption/CTA bằng `index % 5`. Tám unit tests cục bộ cho contract, guardrails, định dạng script và retry giả lập đều qua. Người dùng đã cung cấp kết quả chạy `/contents/batch` với `inserted_count: 10`, `status: approved`, `flags: []`; chưa xác nhận độc lập bộ campaign Bà Nà Hills đủ bốn persona, trigger Supabase thật, hoặc dữ liệu DB/FE hiện tại.

**Kết luận:** Có tiến triển và prototype chạy thử một phần; chưa thể nộp là toàn bộ nhiệm vụ BE3-W2 đã hoàn thành.

## 3. Tiến độ theo task

| Task | Yêu cầu trong kế hoạch | Trạng thái | Bằng chứng hiện có / việc còn thiếu |
|---|---|---|---|
| BE3-W2-01 | Webhook tiếp nhận Campaign | `PARTIAL` | Webhook POST và Header Auth đã nhận payload thử bằng Postman; output có `type: INSERT`, `table: campaigns`, `schema: public`, `record.id`. Chưa xác nhận sự kiện INSERT thật từ Supabase tới Production URL ổn định. |
| BE3-W2-02 | Tích hợp prompt/schema LLM của BE2 vào n8n | `PARTIAL` | Workflow có node gọi Gemini. Output đã tới bước chuẩn bị dữ liệu, nhưng bản nháp vẫn có các đoạn `[Chèn ...]`; cần sửa mapping/prompt và xác nhận cấu trúc theo contract BE2. |
| BE3-W2-03 | Parse, kiểm duyệt và ghi vào `public.contents` | `API UPDATED / DB NOT VERIFIED` | API Python theo contract BE2 và guardrails đã có unit test. Chưa có ghi thật vào Supabase. API cần cột `generation_key` + unique index; migration chưa sinh/applied vì workspace chưa cài Supabase CLI. |
| BE3-W2-04 | Retry tối đa 5 lần và xử lý 429/503 | `CONFIGURED — WAITING TEST` | Ảnh node Gemini xác nhận `Retry On Fail` bật, `Max. Tries = 5`, `Wait Between Tries = 5000 ms`. Chưa có execution chứng minh lỗi 429/503 đã được retry và xử lý thành công. |
| BE3-W2-05 | Python fallback generator độc lập | `NOT VERIFIED` | Dịch vụ Python hiện có trong repo, nhưng chưa có bằng chứng hàm/script fallback tự đọc Campaign, sinh nội dung và lưu `contents` theo Definition of Done tuần 2. |
| BE3-W2-06 | E2E và export JSON workflow Campaign | `NOT DONE / NOT VERIFIED` | Chưa thấy file `workflow_campaign_content.json` trong repo; chưa có bằng chứng E2E từ tạo Campaign tới bản ghi trong `contents`. File `workflow_ai_travel_review.json` là workflow review tuần 1, không thay thế deliverable này. |

## 4. Bằng chứng được cung cấp

- Kết quả Postman/n8n cho thấy webhook test nhận payload Campaign với `record.id`.
- Ảnh node Python cho thấy request thử gọi `http://host.docker.internal:8000/campaigns/enrich`; lượt đầu báo `ECONNREFUSED`, sau đó người thực hiện cho biết workflow đã chạy thành công.
- Ảnh Settings của node `Gemini - Generate Campaign Draft` cho thấy `Retry On Fail` bật, tối đa 5 lần, chờ 5000 ms giữa các lần thử; ảnh không hiển thị execution có lỗi được retry.
- Output Google Sheets do người thực hiện gửi có các trường Campaign/Product và `content_draft`; các giá trị có dấu `=` ở đầu và Sheet hiển thị `#ERROR!`.
- Ảnh/nội dung đầu ra Gemini có placeholder như `[Chèn Hook từ dữ liệu Campaign]`, nên chất lượng/mapping nội dung chưa đạt yêu cầu sử dụng.
- Sau merge BE2 PR #18, unit tests `python -m unittest tests.test_rag_api_contents -v` chạy 6/6 thành công với Supabase giả lập; đây không phải bằng chứng ghi DB thật.
- Sau khi đồng bộ với quyết định BE1–BE3, unit tests `python -m unittest tests.test_rag_api_contents -v` chạy 8/8 thành công với Supabase giả lập; API chấp nhận full kit cho cả mười biến thể và vẫn tương thích đuôi hook-only cũ.
- Người dùng cung cấp response của `/contents/batch`: campaign `409695b2-9eed-43f2-b8a0-49dac50eabb9`, `inserted_count: 10`, `status: approved`, `flags: []`. Response này chưa chứng minh bốn persona cho campaign demo `44444444-4444-4444-4444-444444444444`.
- `docs/be3/n8n-save-contents.md` đã cập nhật flow/contract và nêu rõ cần migration unique index trước khi retry chống trùng hoạt động thật.

Các bằng chứng trên xác nhận một lượt thử một phần; chúng chưa xác nhận toàn bộ tiêu chí nghiệm thu của BE3-W2.

## 5. Vấn đề cần khắc phục trước khi xác nhận hoàn thành

1. **Webhook production:** Cấu hình Supabase gửi sự kiện vào URL HTTPS đang hoạt động; kiểm tra execution trong n8n sau khi tạo Campaign thật. Quick Tunnel có thể đổi URL khi khởi tạo lại, nên cần cập nhật nơi cấu hình webhook nếu URL đổi.
2. **Payload:** Bảo đảm payload thực có `record.id`, `record.product_id` và các trường Campaign cần thiết; Python không thể truy vấn đầy đủ sản phẩm chỉ từ một ID Campaign nếu thiếu contract/truy vấn tương ứng.
3. **Gemini:** Hoàn thiện workflow thực theo parser schema BE2, auto-fix, guardrails, mapper 10 rows; kiểm tra prompt không còn placeholder.
4. **Google Sheets (nếu còn dùng để debug):** Gỡ dấu `=` thừa ở đầu các giá trị văn bản/UUID để Google Sheets không diễn giải chúng như công thức.
5. **Supabase:** Sinh và apply migration `generation_key` unique index, sau đó chạy ghi/retry trên project test. Không đưa Service Role Key vào workflow export hoặc file Git.
6. **Reliability/fallback:** Kiểm thử retry 429/503 trong n8n và chứng minh Python fallback độc lập nếu vẫn thuộc deliverable BE3-W2.
7. **Bàn giao:** Export workflow n8n Campaign thành JSON đã loại bỏ credential/secret, thêm hướng dẫn import/cấu hình môi trường và test E2E.

## 6. Tiêu chí để chuyển báo cáo sang DONE

- [ ] Campaign mới tạo trên Supabase kích hoạt đúng webhook Production và tạo execution thành công trong n8n.
- [ ] Workflow lấy đúng Campaign/Product và Gemini trả nội dung thật, không còn placeholder.
- [ ] Nội dung hợp lệ được ghi vào `public.contents` với liên kết Campaign và status lowercase `approved` / `needs_review` theo kết quả guardrails.
- [ ] Có bằng chứng retry khi gặp lỗi 429/503 hoặc xác nhận rõ giới hạn đã được nhóm chấp thuận.
- [ ] Python fallback đã được demo/test nếu giữ trong scope task cá nhân.
- [ ] Có file export workflow Campaign không chứa secret và script/test E2E trong repo.
- [ ] FE/QA nhận được mẫu dữ liệu và xác nhận có thể đọc nội dung từ bảng `contents`.
- [ ] Commit và PR nhắm vào `dev` theo quy trình Git của nhóm; được review/merge trước khi ghi trạng thái hoàn tất.

## 7. Kế hoạch tiếp tục

| Ưu tiên | Việc cần làm | Deliverable kiểm chứng được |
|---|---|---|
| P0 | Chốt URL webhook production và xác nhận Supabase INSERT Campaign thực kích hoạt n8n | Execution ID n8n và payload đã ẩn thông tin bí mật |
| P0 | Sửa nội dung Gemini placeholder và bỏ dấu `=` thừa trong mapping | Output mẫu hợp lệ, không còn `#ERROR!` |
| P0 | Ghi nội dung vào Supabase `contents`, đối chiếu schema/contract hiện tại | Bản ghi DB truy vấn được theo `campaign_id` |
| P1 | Thử retry lỗi API và hoàn thiện xử lý lỗi | Execution/log cho thấy node thử lại khi gặp lỗi tạm thời và kết quả cuối cùng |
| P1 | Hoàn thiện Python fallback, export JSON và test E2E | Script, file JSON sạch secret, hướng dẫn chạy |

## 8. Nội dung cập nhật ngắn cho `TEAM_WORK_LOG.md`

Chỉ cập nhật trạng thái trong log nhóm sau khi đối chiếu bằng chứng mới. Tại thời điểm báo cáo này, đề xuất ghi BE3-W2-01/02 là `IN_PROGRESS`; BE3-W2-03/04/05/06 là `BLOCKED` hoặc `NOT VERIFIED` tùy blocker thực tế. Không đánh dấu `DONE` cho việc ghi `contents` hay E2E khi chưa có bản ghi và execution chứng minh.
