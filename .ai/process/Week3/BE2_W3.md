# MY WORK PLAN — BE2_W3
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 3 (19/10/2026 – 24/10/2026) — Sprint 3  
**Member:** Nguyễn Huỳnh (AI / RAG & Multimodal Lead)  
**Role:** Backend Developer 2 (AI Sales Agent, Multimodal Prompts & Guardrails)  
**Current Milestone:** COMMERCE FLOW, AI SALES AGENT, PWA & MERCHANT VIDEO GENERATION  
**Deadline:** 17:00 Thứ Sáu (23/10/2026); Demo nghiệm thu: Thứ Bảy (24/10/2026)  
**Branch:** `feature/be2-week3-live-completion`

---

## 1. Context
- Kế thừa thành quả Sprint 2: Hệ thống Prompt 4 Personas, Zod structured output và guardrails đã được merge vào `dev`.
- Trọng tâm Tuần 3:
  1. Nâng cấp AI Sales Agent: Phát hiện ý định mua hàng (Buying Intent) và chốt sale tự động kèm ref link.
  2. Xây dựng năng lực AI Multimodal: Phân tích video mẫu của Merchant (bóc tách visual scenes, tone, pacing, hook).
  3. Xây dựng Prompt tự động sinh kịch bản video mới bám sát sản phẩm/chiến dịch của Merchant.
  4. Cầu nối chuyển giao kịch bản sang Core Video Engine (BE1) và xây dựng benchmark an toàn.
- Nguồn tham chiếu: [Roadmap.md](../Roadmap.md), [Week3.md](Week3.md), [PromptCreateTask.md](../PromptCreateTask.md).

---

## 2. Executive Summary
Trong Sprint 3, BE2 mở rộng AI từ văn bản sang đa phương tiện (Multimodal):
1. **Sales Agent Conversion:** Tối ưu system prompt để bot nhận biết khi nào khách muốn đặt tour/vé, tự động gợi ý link thanh toán của Merchant có gắn mã tiếp thị cá nhân.
2. **Video Script Analyzer:** Phân tích video mẫu do Merchant tải lên, trích xuất: Hook 3 giây đầu, nhịp dựng, góc quay, phong cách giọng lồng tiếng (Voiceover).
3. **Campaign Video Synthesizer Prompt:** Viết prompt kết hợp kịch bản mẫu vừa bóc tách với thông tin tour thật trong database (`products`, `campaigns`) để sinh kịch bản video du lịch chuẩn 9:16 cho Merchant.
4. **Guardrails & Testing:** Xây dựng unit test kiểm tra tính chính xác và an toàn của kịch bản video sinh ra, bảo vệ SSRF và chống hallucination giá/voucher.

---

## 3. TODAY — MUST DO (Thứ Hai 19/10/2026)
| Priority | Task | Why | Dependency | Output | Estimated Effort | Status |
|---|---|---|---|---|---|---|
| P0 | Họp Kick-off Sprint 3 & Chốt format JSON cho Video Script | Đồng bộ với BE1 (Core Video Engine) để tích hợp vào backend pipeline | Toàn team | Interface contract video | 1.5h | READY |
| P0 | BE2-W3-01: Nâng cấp System Prompt Sales Agent (Buying Intent) | Tăng tỷ lệ chuyển đổi chốt đơn của chatbot | PRD v1.0 | Code `src/lib/ai/sales-agent.ts` | 3h | READY |
| P1 | Khảo sát & thử nghiệm Gemini Multimodal Video API | Đảm bảo Gemini nhận diện tốt video 9:16 du lịch | Gemini API key | Script test python/ts | 2.5h | READY |

---

## 4. THIS WEEK — MY TASKS & REAL TRUTHFUL STATUS

| ID | Task | Priority | Status | Dependency | Owner | Deliverable & Current Evidence | Deadline |
|---|---|---|---|---|---|---|---|
| **BE2-W3-01** | System Prompt AI Sales Agent nhận diện Buying Intent | P0 | **Offline deterministic PASS; Live adversarial pending** | Tuần 2 RAG code | BE2 | `sales-agent.ts`, `checkout-url.ts`, 6 intent unit tests PASS; 10/10 adversarial offline stub PASS (live adversarial chưa nghiệm thu ổn định) | 20/10 17:00 |
| **BE2-W3-02** | Multimodal Gemini phân tích kịch bản video mẫu & Adapter | P0 | **Adapter implementation & test offline PASS; Live video pending** | Gemini API | BE2 | `video-analyzer.ts`, `gemini-video-adapter.ts` (Files API, SSRF, stream byte limit $\le 50$MB, model fail-fast); Live video pending assets | 21/10 12:00 |
| **BE2-W3-03** | Prompt sinh kịch bản video áp dụng thông tin chiến dịch & Adapter | P0 | **Generator, schema & guardrails offline PASS; Live script generation pending** | BE2-W3-02 | BE2 | `video-generator.ts`, `gemini-video-adapter.ts`, Zod schema 9:16, deterministic grounding guardrails; Live script generation pending | 22/10 12:00 |
| **BE2-W3-04** | Handoff prompt, JSON schema kịch bản video cho **BE1 (Core Video Engine)** & Tester 2 | P1 | **Contract & handoff complete; BE1 scene-level integration pending** | BE2-W3-02, 03 | BE2 | `video-engine-bridge.ts`, handoff docs, preflight gates; BE1 scene-level integration pending phê duyệt của BE1 owner | 22/10 17:00 |
| **BE2-W3-05** | Phối hợp Tester 2 chạy benchmark độ an toàn kịch bản video | P1 | **Draft rubric & offline benchmark complete; Live groundedness & Tester 2 acceptance pending** | Tester 2 | BE2 | `video-safety-offline-report.md`, bản đề xuất `AI_VIDEO_RUBRIC_W3.md` (chờ Tester 2 nghiệm thu) | 23/10 17:00 |

### Ghi nhận Thực thi & Tiến độ Chi tiết

- **Quality Gate:** Đã giải quyết triệt để lỗi TypeScript nullability tại `chat-panel.tsx`; `npx tsc --noEmit` đạt 0 lỗi.
- **Secret Redaction:** Sửa triệt để hàm `sanitizeErrorMessage()`, che giấu `apiKey=[REDACTED]`, `token=[REDACTED]`, `secret=[REDACTED]`, `key=[REDACTED]`, `Bearer [REDACTED]` và thông tin xác thực URL. Kiểm thử xác nhận 100% secret giả không còn xuất hiện trong error log.
- **Model Decommissioning:** Đã gỡ bỏ toàn bộ tham chiếu và fallback tới model `gemini-2.0-flash`. Hệ thống yêu cầu cấu hình rõ ràng qua `GEMINI_VIDEO_ANALYSIS_MODEL` và `GEMINI_VIDEO_GENERATION_MODEL`, fail-fast nếu thiếu. Đã cập nhật biến placeholder vào `.env.example`.
- **Gemini Files API Transport & SSRF Enforcer:** Hoàn thiện `DefaultVideoUploadTransport` với quy trình tải xuống an toàn:
  - *Loại bỏ fetchFn & bypass DNS pinning:* Xóa bỏ hoàn toàn `fetchFn` khỏi options và constructor; production path mặc định bắt buộc dùng `NodeSafeDownloader`; injection chỉ dành cho trusted DI/unit test và không nhận từ user input; không dùng global fetch.
  - *Absolute Deadline & Thực sự Hủy Socket:* Một deadline tuyệt đối duy nhất bao phủ toàn bộ: DNS lookup -> connect -> TLS handshake -> headers -> mọi redirect hops -> body stream. `remainingMs = deadline - Date.now()` được tính trước mỗi bước; DNS lookup bọc timeout theo remainingMs; không reset deadline sau redirect; stream idle timeout bị giới hạn không vượt absolute deadline. `NodeSafeDownloader` nhận `AbortSignal` và thực sự gọi `req.destroy()` để đóng socket/connection kể cả khi connect/TLS/headers bị treo trước khi có response.
  - *Chặn IP/CIDR Toàn diện:* Zero-dependency parser chặn đầy đủ: IPv6 link-local `fe80::/10` (fe80–febf), IPv4-mapped IPv6 (dạng dotted-decimal `::ffff:127.0.0.1` và hex `::ffff:7f00:1`), multicast `224.0.0.0/4` & `ff00::/8`, broadcast/reserved `240.0.0.0/4` (`255.255.255.255`), loopback, unspecified, private RFC 1918, CGNAT `100.64.0.0/10`, AWS metadata; cho phép public IPv4 (`93.184.216.34`) và public IPv6 (`2606:2800:220:1:248:1893:25c8:1946`).
  - *Chống Rò rỉ Abort Listener:* Stream reader dùng shared abort promise duy nhất cho hop hiện tại, không tạo abort listener cho từng chunk, await `iterator.return()`, dọn dẹp trong `finally`, không phát sinh `MaxListenersExceededWarning` khi đọc nhiều chunks.
  - *Ma trận Dọn dẹp Sau Upload (Cleanup Matrix):* Ngay khi upload trả về `fileName`, lưu ngay làm candidate; try/catch bọc toàn bộ: upload thiếu URI -> delete 1 lần; arbitrary/invalid URI -> delete 1 lần; polling state FAILED -> delete 1 lần; `files.get` timeout -> delete 1 lần; polling deadline timeout thật (file giữ trạng thái PROCESSING liên tục) -> delete 1 lần; lỗi dọn dẹp không che lỗi chính; prepareVideo thành công không delete trong transport (adapter delete trong `finally`); không double delete.
  - *Timeout Gemini SDK Trung thực (@google/genai 2.28.0):* Toàn bộ các lệnh `files.upload`, `files.get`, `files.delete`, `models.generateContent` đều truyền `config.abortSignal` (qua `AbortController` trong `withTimeout`) để chủ động hủy HTTP request từ phía client theo đúng type definition của `@google/genai 2.28.0` (`UploadFileConfig`, `GetFileConfig`, `DeleteFileConfig`, `GenerateContentConfig`). Ghi nhận trung thực: AbortSignal là client-side cancellation (hủy request phía client HTTP, không bảo đảm server Gemini dừng xử lý và vẫn có thể phát sinh usage). Nếu upload timeout trước khi nhận được `fileName`, hệ thống không thể gọi `files.delete`. Concurrency = 1 qua AsyncMutex, không tự động retry.
- **Video Engine Bridge Không bịa đặt dữ liệu:** Sửa `src/lib/ai/video-engine-bridge.ts`: ném `VideoEngineBridgeGateError` khi thiếu giá bán hoặc giá $\le 0$, khi thiếu verified location, khi thiếu authentic tips. Bắt buộc bookingUrl dùng HTTPS và CTA bảo toàn `[LINK_MUA_VE]`. Cổng kiểm duyệt đồng thời `guardrails.isValid === true && recommendedStatus === "APPROVED" && flags.length === 0`.
- **Tính trung thực Hợp đồng với BE1:** Bridge bảo toàn nguyên vẹn kịch bản `approvedScript` trong kết quả chuyển giao kèm `sceneConsumptionNote`. Xác nhận Core Video Engine hiện tại tự dựng lại timeline từ media assets và việc ingest trực tiếp scene-level của BE2 là blocker cần BE1 owner duyệt.
- **Application Wiring Status:** `GeminiVideoAnalysisAdapter`, `GeminiVideoGenerationAdapter`, `bridgeToVideoEngine` và `mapScriptToVideoEngineInput` hiện tại mới được import và kiểm thử trong tests. Ghi nhận trung thực: adapter implementation available; application wiring pending.
- **Chế độ kiểm thử Offline:** Node test runner (`test:tester2:hallucination:node`) được cấu hình mặc định chạy offline deterministic (`OFFLINE STUB GUARDRAIL`), chỉ chạy live khi có đồng thời `GEMINI_API_KEY` và `BE2_HALLUCINATION_LIVE=1`. Đã bổ sung unit test chứng minh câu phủ định từ chối cam kết được phép trong khi câu khẳng định cam kết 200% bị fail. Live Gemini, application wiring, BE1 scene-level integration và Tester 2 acceptance vẫn ở trạng thái PENDING.

---

## 5. TASK BREAKDOWN (THEO PROMPT CREATETASK)

### A. Những việc tôi PHẢI làm:
- Nâng cấp logic hội thoại của Chatbot trong `src/lib/ai/sales-agent.ts` để nhận diện ý định mua hàng của khách.
- Xây dựng prompt Multimodal đọc video mẫu và prompt sinh kịch bản video du lịch.
- Viết Zod Schema xác thực dữ liệu đầu ra của kịch bản video (scene list, narration, duration, visual_prompts).
- Xây dựng cầu nối fail-closed bảo vệ dữ liệu với Core Video Engine của BE1.

### B. Những việc tôi NÊN làm tiếp theo:
- Chuẩn hóa bộ prompt đa ngôn ngữ (Tiếng Anh, Tiếng Hàn) cho khách quốc tế khi hỏi về tour Đà Nẵng / Hội An.

### C. Những việc tôi KHÔNG NÊN làm:
- Không viết code workflow n8n (thuộc trách nhiệm của BE3).
- Không tự ý can thiệp vào schema bảng `orders` của BE1.
- Không tự ý mở rộng API server-side lớn khi BE1 chưa đồng thuận.

### D. Những thứ tôi cần bàn giao:
- Prompt templates và Zod schema kịch bản video $\rightarrow$ Bàn giao cho **BE1 (Tuệ)** để nạp vào Core Video Generation Engine backend.
- Sample outputs kịch bản video $\rightarrow$ Bàn giao cho Tester 2 chạy rubric kiểm định.

### E. Những thứ tôi cần yêu cầu team:
- Cần BE1 phê duyệt tích hợp kịch bản ở tầng phân cảnh (scene-level consumption).
- Cần Tester 2 thẩm định và nghiệm thu chính thức bộ tiêu chuẩn `AI_VIDEO_RUBRIC_W3.md`.
