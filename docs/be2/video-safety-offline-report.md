# BE2 Week 3 — Offline Video Safety & Security Benchmark Report

## 1. Phạm vi

Báo cáo này tổng hợp kết quả kiểm định tự động về an toàn nội dung, bảo mật dữ liệu, khả năng chống prompt injection, SSRF transport, và tính bám sát dữ kiện thương mại của AI Sales Agent và Video Engine Pipeline (BE2-W3-01..05) trên môi trường kiểm thử **OFFLINE DETERMINISTIC**.

## 2. Kết quả Kiểm định An toàn & Kháng Tấn công (Offline Suite)

| Nhóm kiểm tra | Loại kiểm thử | Kết quả | Ghi chú kỹ thuật & Bằng chứng thực tế |
|---|---|---|---|
| Hook video $\le 3$ giây | Schema / Deterministic | **PASS** | 100% video cảnh đầu hoàn tất trong 3s |
| Scene index và timeline liên tục | Schema / Deterministic | **PASS** | Thời lượng 15–60s, không đứt đoạn |
| Video script đúng định dạng 9:16 | Schema / Deterministic | **PASS** | Bố cục chuẩn dọc Reels / TikTok |
| CTA bắt buộc giữ `[LINK_MUA_VE]` | Schema / Deterministic | **PASS** | Chặn tự sinh link lạ / phishing; bảo toàn placeholder |
| Booking URL bảo mật HTTPS | Transport / Bridge Gate | **PASS** | Từ chối HTTP không an toàn; không echo URL vào error log |
| Metadata prompt-injection isolation | Prompt Architecture | **PASS** | Thẻ untrusted cách ly khỏi system instruction |
| Fact reference không tồn tại bị chặn | Content Guardrails | **PASS** | Cờ `UNKNOWN_FACT_REFERENCE` |
| Giá bán sai lệch hoặc thiếu bị chặn | Content Guardrails & Bridge | **PASS** | Cờ `PRICE_MISMATCH`; từ chối fallback giá ảo |
| Promo code tự sinh bị chặn | Content Guardrails | **PASS** | Cờ `UNCONFIRMED_PROMO_CODE` |
| Claim khan hiếm giả bị chặn | Content Guardrails | **PASS** | Cờ `PROHIBITED_CLAIM` |
| Schema JSON đồng bộ với Zod | Schema Sync | **PASS** | Schema portable xuất bản cho BE1/Tester 2 |
| Loại bỏ bypass DNS pinning & Không dùng fetch | Security Transport | **PASS** | Đã xóa bỏ hoàn toàn `fetchFn` khỏi transport options và constructor; production path mặc định bắt buộc dùng `NodeSafeDownloader`; injected downloader chỉ dùng cho trusted DI/unit tests và không nhận từ request/user input; không dùng global fetch |
| Host Allowlist Fail-Closed | Security Transport | **PASS** | Bắt buộc allowlist không rỗng (`options.allowedHosts` hoặc `VIDEO_SOURCE_ALLOWED_HOSTS`). Nếu thiếu/rỗng: fail-closed ngay lập tức, không DNS lookup, không download |
| Ngăn chặn DNS Rebinding & Chặn IP/CIDR toàn diện | Security Transport | **PASS** | Zero-dependency CIDR parser chặn đầy đủ: IPv6 link-local `fe80::/10` (fe80–febf), IPv4-mapped IPv6 (dạng dotted-decimal `::ffff:127.0.0.1` và hex `::ffff:7f00:1`), multicast `224.0.0.0/4` (224.0.0.1) & `ff00::/8`, broadcast/reserved `240.0.0.0/4` (255.255.255.255), loopback, unspecified, private RFC 1918, CGNAT `100.64.0.0/10`, AWS metadata; cho phép public IPv4 (`93.184.216.34`) và public IPv6 (`2606:2800:220:1:248:1893:25c8:1946`); `NodeSafeDownloader` pin connection với TLS SNI và `Host` header bảo toàn |
| Absolute Deadline bảo vệ DNS & toàn bộ redirect chain | Security Transport | **PASS** | Một absolute deadline duy nhất bao phủ toàn bộ: DNS lookup -> connect -> TLS handshake -> headers -> mọi redirect hops -> body stream. `remainingMs = deadline - Date.now()` được tính trước mỗi bước; DNS lookup được bọc timeout theo remainingMs; không reset overall deadline sau redirect; idle timeout cho stream bị giới hạn không vượt absolute deadline. `NodeSafeDownloader` nhận `AbortSignal` và thực sự gọi `req.destroy()` để đóng socket ngay cả khi connect/TLS/headers bị treo trước khi có response |
| Ngăn ngừa rò rỉ Abort Listener | Stream Reader Enforcer | **PASS** | Stream reading sử dụng shared abort promise duy nhất cho hop hiện tại, không tích lũy abort listener cho từng chunk; `iterator.return()` được gọi và await; không phát sinh `MaxListenersExceededWarning` khi đọc hàng trăm chunks; dọn dẹp timers và listeners trong `finally` |
| Giới hạn dung lượng video $\le 50$MB | Stream Reader Enforcer | **PASS** | Hủy stream và ném `GeminiAdapterError` khi vượt quá 50MB |
| MIME type video nghiêm ngặt | Transport Enforcer | **PASS** | Chỉ chấp nhận video/mp4, video/quicktime, video/webm |
| Redaction làm sạch secret & tokens | Sanitizer | **PASS** | Che giấu apiKey, token, Bearer, secret, credentials trong URL |
| Timeout trung thực cho Gemini SDK calls (@google/genai 2.28.0) | SDK Caller Enforcer | **PASS** | `files.upload`, `files.get`, `files.delete`, `models.generateContent`: Toàn bộ đều được truyền `config.abortSignal` (kích hoạt bởi `AbortController` trong `withTimeout`) để chủ động hủy HTTP request từ phía client theo đúng type definition của `@google/genai 2.28.0` (`UploadFileConfig`, `GetFileConfig`, `DeleteFileConfig`, `GenerateContentConfig`). Ghi nhận trung thực: AbortSignal là client-only cancellation (hủy request phía client HTTP, không bảo đảm server Gemini dừng xử lý và vẫn có thể phát sinh usage). Nếu upload timeout trước khi nhận được `fileName`, hệ thống không thể gọi `files.delete`. Không retry tự động; concurrency = 1 qua AsyncMutex |
| Xử lý Quota / Rate-limit 429 | Rate Limit Guard | **PASS** | 429 được giữ nguyên là `GeminiRateLimitError`, dừng ngay không retry |
| Dọn dẹp tài nguyên sau upload (Cleanup Matrix) | Resource Lifecycle | **PASS** | Ngay khi upload trả về fileName, lưu làm candidate; try/catch bảo vệ toàn bộ: upload thiếu URI -> delete 1 lần; invalid/arbitrary URI -> delete 1 lần; polling state FAILED -> delete 1 lần; `files.get` timeout -> delete 1 lần; polling deadline timeout thật với PROCESSING liên tục -> delete 1 lần; lỗi dọn dẹp không che giấu lỗi chính; prepareVideo thành công không delete trong transport (adapter delete trong `finally`); không double delete. Giới hạn: không thể cleanup nếu upload timeout trước khi nhận fileName |
| Thẩm định nghiêm ngặt Gemini File URI | URI Security Validator | **PASS** | `validateGeminiFileUri()` chỉ chấp nhận URI HTTPS trỏ tới `generativelanguage.googleapis.com/v1(beta)/files/...`; từ chối arbitrary HTTPS, HTTP, URL có credentials hoặc query parameters |
| Kháng tấn công Adversarial AI Sales Agent | Offline Deterministic Stub | **PASS (10/10 offline)** | Live adversarial chưa nghiệm thu ổn định (pending) |
| Cổng kiểm duyệt Core Video Engine Gate | Bridge Gate | **PASS** | Chỉ script APPROVED (0 flags) mới vào Core Engine |
| Bảo toàn script gốc BE2 | Bridge Contract | **PASS** | `approvedScript` lưu nguyên vẹn; scene-level pending BE1 |

## 3. Tổng hợp Trạng thái Các Task BE2 Tuần 3

- **BE2-W3-01 (AI Sales Agent Buying Intent):**
  - Offline deterministic: **PASS** (Phân loại intent, checkout gate, offline stub adversarial).
  - Live adversarial: **PENDING** (Chưa được nghiệm thu ổn định trên live Gemini model).
- **BE2-W3-02 (Gemini Video Reference Analyzer):**
  - Adapter implementation / test offline: **PASS** (`GeminiVideoAnalysisAdapter`, allowlist fail-closed, DNS pinning, stream timeout, upload failure cleanup, strict URI validation).
  - Live video analysis: **PENDING** (Chưa có video mẫu 9:16 và database table `media_references`).
- **BE2-W3-03 (Campaign Video Script Generator):**
  - Generator / schema / guardrails offline: **PASS** (`GeminiVideoGenerationAdapter`, Zod 9:16, deterministic grounding, model call timeout).
  - Live script generation: **PENDING** (Chờ dữ liệu video mẫu đã phân tích và nghiệm thu live).
- **BE2-W3-04 (Handoff & Video Engine Bridge):**
  - Contract & mapper typed: **COMPLETE** (`video-engine-bridge.ts`, fail-closed gating, [LINK_MUA_VE] preservation).
  - BE1 scene-level integration: **PENDING** (Core Video Engine của BE1 hiện tại dựng lại timeline từ media assets; tích hợp tiêu thụ trực tiếp scenes của BE2 cần BE1 owner phê duyệt).
- **BE2-W3-05 (Safety Benchmark & Rubric):**
  - Draft rubric & offline benchmark: **COMPLETE** (Bản đề xuất `AI_VIDEO_RUBRIC_W3.md`, 100% offline tests PASS).
  - Live groundedness & Tester 2 acceptance: **PENDING** (Tester 2 chưa nghiệm thu live và chưa phê duyệt rubric).

## 4. Ghi chú Tích hợp Ứng dụng (Application Wiring Status)

Theo rà soát toàn bộ repository, các adapter (`GeminiVideoAnalysisAdapter`, `GeminiVideoGenerationAdapter`) và hàm cầu nối (`bridgeToVideoEngine`, `mapScriptToVideoEngineInput`) hiện tại:
- **Tình trạng:** **Adapter implementation available; application wiring pending**.
- **Phạm vi sử dụng hiện tại:** Đã được kiểm thử toàn diện qua unit tests và contract tests trong `tests/video-pipeline.test.ts`.
- **Kế hoạch tiếp theo:** Đề xuất mở API endpoint server-side nhỏ (ví dụ: `POST /api/campaigns/[id]/video-script`) sau khi BE1 sẵn sàng consume scene-level và môi trường Supabase migration hoàn tất. Không tự ý mở rộng scope trong đợt sửa này.
