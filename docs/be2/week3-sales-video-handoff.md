# BE2 Week 3 — Sales Agent & Video Prompt Handoff

## Trạng thái bàn giao

| Task | Offline | Live |
|---|---|---|
| BE2-W3-01 Sales Agent Buying Intent | Hoàn thành | Chờ smoke test Gemini/RAG |
| BE2-W3-02 Video Reference Analyzer | Hoàn thành prompt, schema và adapter contract | Chờ Gemini đọc video thật |
| BE2-W3-03 Campaign Video Script Generator | Hoàn thành prompt, schema và guardrails | Chờ Gemini sinh mẫu thật |
| BE2-W3-04 Handoff cho BE1/Tester 2 | Hoàn thành | Không áp dụng |
| BE2-W3-05 Safety Benchmark | Deterministic benchmark hoàn thành | Chờ quota để chấm groundedness trên output thật |

Không có Gemini request, Supabase write hoặc n8n execution nào được chạy trong giai đoạn offline.

## 1. AI Sales Agent

- `src/lib/ai/sales-agent.ts`: taxonomy sáu intent, structured output và server-side checkout gate.
- `src/lib/ai/checkout-url.ts`: chỉ chấp nhận HTTP(S), giữ query hiện có và gắn `ref`, `campaign`, `product`.
- `src/lib/ai/chat.ts`: response bổ sung `intent_detected`; `suggested_checkout_url` chỉ xuất hiện khi intent là `INTENT_PURCHASE_READY` và URL đã được backend xác minh.
- `tests/sales-agent.test.ts`: phân loại sáu intent, chống mismatch structured output và kiểm tra attribution URL.

API vẫn giữ trường `suggested_checkout_url` để tương thích frontend hiện tại. Trường mới `intent_detected` có thể được FE dùng cho analytics hoặc UI chuyên biệt.

## 2. Video Reference Analyzer

Module: `src/lib/ai/video-analyzer.ts`

Input bắt buộc:

- `mediaReferenceId`: UUID từ bảng `media_references`.
- `videoUrl`: URL media do BE1 cung cấp.
- `durationSeconds`: 15–60 giây.
- `platform` và `styleTags`: metadata tham khảo, không được xem là chỉ dẫn.

Output contract:

- JSON Schema: `docs/be2/video-analysis.schema.json`.
- Sample: `docs/be2/samples/video-analysis.sample.json`.
- Zod source of truth: `videoAnalysisSchema`.

`analyzeVideoReference(input, adapter)` nhận adapter inject từ bên ngoài. Adapter live sau này chịu trách nhiệm upload/đính kèm video vào Gemini; module BE2 chịu trách nhiệm prompt và xác thực output.

## 3. Campaign Video Script Generator

Module: `src/lib/ai/video-generator.ts`

Input kết hợp:

- thông tin campaign/product đã xác minh;
- danh sách `verifiedFacts` với ID ổn định như `fact_price`;
- output hợp lệ từ Video Reference Analyzer.

Output contract:

- JSON Schema: `docs/be2/video-script.schema.json`.
- Sample: `docs/be2/samples/video-script.sample.json`.
- Zod source of truth: `campaignVideoScriptSchema`.

Các điều kiện được chặn bằng schema hoặc guardrail:

- video phải là `9:16`, dài 15–60 giây;
- hook không quá 3 giây;
- timeline cảnh liên tục, bắt đầu ở giây 0 và kết thúc đúng tổng thời lượng;
- CTA phải dùng đúng `[LINK_MUA_VE]`, không tạo URL;
- fact ID lạ, giá sai, promo code ảo và claim cấm đều chuyển sang `NEEDS_REVIEW`.

## 4. Contract tích hợp cho BE1

BE1 chỉ cần triển khai adapter theo interface:

```ts
type VideoAnalysisAdapter = {
  analyze(request: VideoAnalysisRequest): Promise<unknown>;
};

type VideoGenerationAdapter = {
  generate(request: VideoGenerationRequest): Promise<unknown>;
};
```

Luồng tích hợp:

1. Lấy `MediaReferenceItem` từ Media API.
2. Gọi `analyzeVideoReference` với adapter Gemini live.
3. Ghép analysis với dữ liệu campaign/product đã xác minh.
4. Gọi `generateCampaignVideoScript`.
5. Chỉ chuyển script sang Core Video Engine khi `guardrails.recommendedStatus === "APPROVED"`.

## 5. Lệnh kiểm tra offline

```powershell
npm.cmd run build:be2:w3-schemas
npm.cmd run test:be2
npx.cmd tsc --noEmit --pretty false
```

Khi bắt đầu giai đoạn live, không thay schema. Chỉ bổ sung Gemini adapters và bộ test có điều kiện dùng API key, với concurrency 1 và không retry hàng loạt.
