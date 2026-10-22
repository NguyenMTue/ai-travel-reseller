# BE2 Week 3 — Sales Agent & Video Prompt Handoff

## Trạng thái Bàn giao (Handoff Status)

| Task | Offline Deterministic | Live Verification | Ghi chú tích hợp |
|---|---|---|---|
| **BE2-W3-01** Sales Agent Buying Intent | **PASS** (Intent classification, checkout gate, offline stub) | **PENDING** (Live adversarial chưa nghiệm thu ổn định) | Sẵn sàng logic server-side, tương thích FE |
| **BE2-W3-02** Video Reference Analyzer | **PASS** (Prompt, schema, SSRF & `GeminiVideoAnalysisAdapter`) | **PENDING** (Chờ video mẫu 9:16 và database local) | Adapter implementation available; application wiring pending |
| **BE2-W3-03** Campaign Video Script Generator | **PASS** (Prompt, schema, guardrails & `GeminiVideoGenerationAdapter`) | **PENDING** (Chờ dữ liệu phân tích video mẫu live) | Adapter implementation available; application wiring pending |
| **BE2-W3-04** Handoff & BE1 Bridge | **COMPLETE** (Contract, mapper, typed bridge, [LINK_MUA_VE] preservation) | Không áp dụng | BE1 scene-level integration pending (BE1 owner approval) |
| **BE2-W3-05** Safety Benchmark & Rubric | **COMPLETE** (Draft rubric, offline security & safety test suite) | **PENDING** (Tester 2 live acceptance pending) | Đề xuất tại `AI_VIDEO_RUBRIC_W3.md` |

---

## 1. AI Sales Agent

- `src/lib/ai/sales-agent.ts`: taxonomy sáu intent, structured output và server-side checkout gate.
- `src/lib/ai/checkout-url.ts`: chỉ chấp nhận HTTP(S), giữ query hiện có và gắn `ref`, `campaign`, `product`.
- `src/lib/ai/chat.ts`: response bổ sung `intent_detected`; `suggested_checkout_url` chỉ xuất hiện khi intent là `INTENT_PURCHASE_READY` và URL đã được backend xác minh.
- `tests/sales-agent.test.ts`: phân loại sáu intent, chống mismatch structured output và kiểm tra attribution URL.
- `tests/hallucination/test_sales_agent_hallucination.ts`: 10 bộ kịch bản tấn công adversarial được thẩm định qua offline stub runner (`test:tester2:hallucination:node`). Chế độ live được bảo vệ bằng cờ `BE2_HALLUCINATION_LIVE=1`; mặc định chạy offline deterministic, không tự động tiêu tốn quota Gemini.

API vẫn giữ trường `suggested_checkout_url` để tương thích frontend hiện tại. Trường mới `intent_detected` có thể được FE dùng cho analytics hoặc UI chuyên biệt.

---

## 2. Video Reference Analyzer & Concrete Gemini Adapter

Module: `src/lib/ai/video-analyzer.ts` và `src/lib/ai/gemini-video-adapter.ts`

- **Tình trạng tích hợp:** **Adapter implementation available; application wiring pending** (hiện chỉ có test sử dụng trực tiếp).
- **Model Configuration:** Yêu cầu biến môi trường `GEMINI_VIDEO_ANALYSIS_MODEL`; fail-fast ném lỗi rõ ràng nếu thiếu cấu hình. Không sử dụng fallback model cũ đã shut down.
- **Gemini Files API Thật & Transport Hardening:** `DefaultVideoUploadTransport` thực hiện quy trình chuẩn bảo mật nghiêm ngặt:
  1. **Fail-Closed Allowlist:** Bắt buộc allowlist không rỗng từ `options.allowedHosts` hoặc `VIDEO_SOURCE_ALLOWED_HOSTS`. Ném `GeminiAdapterError` ngay lập tức nếu thiếu/rỗng; chặn DNS lookup và download. Hỗ trợ wildcard chuẩn `*.example.com` và loại trừ domain suffix giả (`evil-example.com`).
  2. **Loại bỏ fetchFn & Bắt buộc NodeSafeDownloader:** Xóa bỏ hoàn toàn `fetchFn` khỏi constructor và options. Production path mặc định bắt buộc dùng `NodeSafeDownloader` có DNS pinning. `SafeDownloader` injection chỉ dùng cho unit test / trusted internal dependency injection, tuyệt đối không nhận từ untrusted user input. Không dùng global fetch.
  3. **Chặn IP/CIDR Toàn diện:** Zero-dependency CIDR parser chặn đầy đủ: IPv6 link-local `fe80::/10` (fe80–febf), IPv4-mapped IPv6 (cả dotted-decimal `::ffff:127.0.0.1` và hex `::ffff:7f00:1`), multicast `224.0.0.0/4` (224.0.0.1) & `ff00::/8`, broadcast/reserved `240.0.0.0/4` (255.255.255.255), loopback `127.0.0.0/8` & `::1`, unspecified `0.0.0.0/8` & `::`, private RFC 1918, CGNAT `100.64.0.0/10`, AWS metadata. Chỉ cho phép các IP public hợp lệ (ví dụ: `93.184.216.34`, `2606:2800:220:1:248:1893:25c8:1946`).
  4. **Absolute Deadline Bao phủ DNS & Chuỗi Redirect:** Một deadline tuyệt đối duy nhất được thiết lập ngay khi bắt đầu download: DNS lookup -> connect -> TLS handshake -> headers -> mọi redirect hops -> toàn bộ body stream. Trước mỗi operation, tính `remainingMs = deadline - Date.now()`; DNS lookup bọc timeout theo remainingMs; không reset deadline sau redirect; idle timeout stream bị giới hạn không vượt absolute deadline. `NodeSafeDownloader` nhận `AbortSignal` và thực sự gọi `req.destroy()` để hủy underlying socket kể cả khi connect/TLS/headers bị treo trước khi có response.
  5. **Ngăn Chặn Rò Rỉ Abort Listener:** Vòng lặp đọc stream sử dụng shared abort promise duy nhất cho hop hiện tại, không đăng ký abort listener cho từng chunk; `iterator.return()` được gọi và await; không phát sinh `MaxListenersExceededWarning` khi đọc hàng trăm chunks; dọn dẹp timers và listeners trong `finally`.
  6. **Giới hạn Dung lượng & MIME Type:** Giới hạn đọc stream $\le 50$MB (`MAX_VIDEO_FILE_SIZE_BYTES`) và chỉ chấp nhận MIME types chuẩn (`video/mp4`, `video/quicktime`, `video/webm`).
  7. **Mô tả Trung thực về Timeout Gemini SDK (@google/genai 2.28.0):**
     - Toàn bộ các API `files.upload`, `files.get`, `files.delete`, `models.generateContent` đều được truyền `config.abortSignal` (kích hoạt bởi `AbortController` của `withTimeout`) theo chuẩn type definition của `@google/genai 2.28.0` (`UploadFileConfig`, `GetFileConfig`, `DeleteFileConfig`, `GenerateContentConfig`).
     - Ghi nhận trung thực: AbortSignal là client-side cancellation (hủy request phía client HTTP, không bảo đảm server Gemini dừng xử lý và vẫn có thể phát sinh usage).
     - Nếu upload timeout trước khi nhận được `fileName`, hệ thống không thể gọi `files.delete`.
     - Dừng ngay, không retry tự động; concurrency = 1 qua AsyncMutex.
  8. **Ma trận Dọn dẹp Toàn diện Sau Upload (Cleanup Matrix):** Ngay khi upload trả về fileName hợp lệ, lưu làm cleanup candidate; try/catch bọc toàn bộ các bước sau upload:
     - Upload thiếu URI -> delete 1 lần;
     - Arbitrary / Invalid Gemini URI -> delete 1 lần;
     - Polling state `FAILED` -> delete 1 lần;
     - Polling `files.get` timeout -> delete 1 lần;
     - Polling deadline timeout thật (file duy trì trạng thái `PROCESSING`) -> delete 1 lần;
     - Lỗi xóa file dọn dẹp không bao giờ che giấu lỗi chính;
     - `prepareVideo` thành công không delete trong transport (adapter sẽ dọn dẹp trong `finally` sau khi hoàn tất phân tích);
     - Không double delete. Giới hạn: Không thể cleanup nếu upload timeout trước khi nhận được fileName từ server.
  9. **Thẩm định Nghiêm ngặt Gemini File URI:** Hàm `validateGeminiFileUri()` chỉ chấp nhận định dạng URI HTTPS trỏ tới `generativelanguage.googleapis.com/v1(beta)/files/...`. Chặn hoàn toàn arbitrary HTTPS URL từ custom transport, URL chứa credentials hoặc query parameters/fragments.
- **Bảo mật SSRF & Secret:** Hàm `validateSafeVideoUrl` và `sanitizeErrorMessage` đảm bảo không bao giờ để lộ key, token, URL nhạy cảm ra ngoài error log.
- **Rate-limit / Quota 429:** Ném ngay `GeminiRateLimitError` và dừng ngay, không retry tự động. Concurrency được giới hạn ở mức 1 qua AsyncMutex.

---

## 3. Campaign Video Script Generator & Concrete Gemini Adapter

Module: `src/lib/ai/video-generator.ts` và `src/lib/ai/gemini-video-adapter.ts`

- **Tình trạng tích hợp:** **Adapter implementation available; application wiring pending**.
- **Model Configuration:** Yêu cầu biến môi trường `GEMINI_VIDEO_GENERATION_MODEL`; fail-fast nếu thiếu cấu hình.
- **Input kết hợp:**
  - Thông tin campaign/product đã xác minh;
  - Danh mục `verifiedFacts` với ID cố định;
  - Phân tích hợp lệ từ Video Reference Analyzer.
- **Các điều kiện được chặn bằng schema và guardrails:**
  - Video định dạng 9:16, thời lượng 15–60 giây;
  - Hook không quá 3 giây;
  - Timeline cảnh liên tục, khớp chính xác tổng thời lượng;
  - CTA giữ nguyên placeholder `[LINK_MUA_VE]`, không tự sinh URL;
  - Mọi dữ kiện phải ánh xạ đúng `verified_fact_refs`, chuyển trạng thái `NEEDS_REVIEW` nếu có dữ kiện ngoài luồng.

---

## 4. Tích hợp với BE1 (Core Video Engine Bridge)

Module: `src/lib/ai/video-engine-bridge.ts`

Cầu nối chuyển giao kịch bản từ BE2 sang Core Video Engine của BE1 (`src/lib/video-engine/generator.ts`):

- **Điều kiện cổng (Gate):** Bắt buộc đồng thời:
  - `guardrails.isValid === true`
  - `guardrails.recommendedStatus === "APPROVED"`
  - `guardrails.flags.length === 0`
  Ném `VideoEngineBridgeGateError` nếu bất kỳ điều kiện nào không thỏa mãn.
- **Chính sách Không bịa đặt dữ liệu (Fail-Closed Data Integrity):**
  - `sale_price`: Bắt buộc số dương đã xác minh từ `campaign.salePrice`. Tuyệt đối không fallback giá ảo `?? 1`.
  - `location`: Bắt buộc lấy từ `campaign.targetLocation`. Tuyệt đối không tự điền mặc định `"Việt Nam"`.
  - `authentic_tips`: Lấy từ `campaign.verifiedFacts` và `merchantMetadata.additionalAuthenticTips`. Fail-closed ngay nếu thiếu, tuyệt đối không tự sinh câu tip chung chung.
  - `booking_url`: Bắt buộc là URL giao thức HTTPS hợp lệ.
  - `official_cta`: Bắt buộc giữ placeholder `[LINK_MUA_VE]`.
- **Ghi nhận Kiến trúc & Giới hạn Hiện tại:**
  - BE1 Core Video Engine hiện tại tự tạo dựng timeline phân cảnh mới dựa trên tài nguyên `media_assets` và metadata sản phẩm.
  - Các trường chi tiết phân cảnh của BE2 (`visual_prompt`, `shot_instruction`, `narration`, `on_screen_text`, `verified_fact_refs`) chưa được Core Video Engine consume trực tiếp.
  - Bridge bảo toàn nguyên vẹn kịch bản gốc trong `bridgeResult.approvedScript` kèm `sceneConsumptionNote`.
  - Việc tích hợp tiêu thụ trực tiếp kịch bản phân cảnh ở tầng Scene-level là blocker cần BE1 owner (Tuệ) phê duyệt.

---

## 5. Lệnh Kiểm định Chất lượng (Quality Gate Commands)

Các lệnh kiểm tra offline được thực thi không phụ thuộc vào Gemini live:

```powershell
npm.cmd run build:be2:w3-schemas
npm.cmd run test:be2
npm.cmd run test:tester2
npm.cmd run test:tester2:hallucination:node
npm.cmd run test:video-engine
npx.cmd tsc --noEmit --pretty false
npx.cmd eslint src/lib/ai/gemini-video-adapter.ts src/lib/ai/video-engine-bridge.ts tests/video-pipeline.test.ts tests/hallucination/test_sales_agent_hallucination.ts
git diff --check
```

---

## 6. Ghi nhận Hiện trạng Ứng dụng & Hạn chế Tích hợp

1. **Chế độ kiểm thử:** Mọi kiểm thử tự động hiện tại đều chạy ở chế độ **OFFLINE DETERMINISTIC**. Test hallucination của Sales Agent hiển thị rõ ràng: `CHẾ ĐỘ THỰC THI: OFFLINE STUB GUARDRAIL`, đảm bảo không gọi Gemini live và không tiêu tốn quota API ngoài ý muốn.
2. **Trạng thái Live Multimodal:** Ghi nhận **PENDING / BLOCKED** do chưa có tài nguyên video mẫu 9:16 thực tế và cơ sở dữ liệu local chưa cấu hình an toàn cho bảng `media_references`.
3. **Application Wiring:** Các adapter và bridge functions đã hoàn tất logic và kiểm thử unit/contract. Điểm tích hợp server-side trong Next.js API route đang pending sự đồng thuận từ phía BE1.
