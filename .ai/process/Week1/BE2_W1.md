# TEAM WORK LOG

Project: AI Travel Reseller MVP
Week: Tuần 1 (06/10/2026 - 09/10/2026)
Member: BE2 — AI Agent / RAG
Last Updated: 08/10/2026 (Asia/Ho_Chi_Minh)

Nguồn đối chiếu: PRD → Roadmap.md → `BE1_W1.md` → code đã merge trong commit `aab945f` → smoke test Supabase local ngày 08/10/2026.
Ghi chú: Chỉ đánh dấu DONE cho deliverable đã có code và kết quả kiểm tra. Team đã thống nhất Google Gemini `gemini-embedding-2`, output 1536 chiều, cho cả document và query embeddings.

---

## 1. ACTIVE WORK

| Task ID | Member | Role | Task | Status | Started | Deadline |
|---|---|---|---|---|---|---|
| BE2-01 | BE2 | AI/RAG | Phối hợp BE1 chốt cấu trúc lưu vector và tham chiếu dữ liệu sản phẩm | DONE | 06/10 | Trước tích hợp DB |
| BE2-02 | BE2 | AI/RAG | Cấu hình pgvector trên Supabase và Vector Store | DONE (Local) | 08/10 | 09/10/2026 12:00 |
| BE2-03 | BE2 | AI/RAG | Triển khai embedding pipeline cho Product seed | DONE (Local) | 08/10 | 09/10/2026 12:00 |
| BE2-04 | BE2 | AI/RAG | API/Function semantic search trả về dữ liệu liên quan | DONE (Local) | 08/10 | 09/10/2026 12:00 |
| BE2-05 | BE2 | AI/RAG | Viết Prompt Template và thử nghiệm RAG với LLM API | DONE (Local) | 08/10 | 09/10/2026 12:00 |

Lịch chung: 07/10 cấu hình RAG vector cơ bản; 08/10 hoàn thiện RPC/Edge Functions và test tích hợp; 09/10 trước 12:00 hoàn thành, merge PR và cập nhật tài liệu. Đây là lịch phối hợp, không phải xác nhận tiến độ.

---

## 2. COMPLETED WORK

| Task ID | Member | Deliverable | Completed At | Handoff To |
|---|---|---|---|---|
| BE2-01 | BE2 | Chốt contract `product_embeddings`, `vector(1536)`, HNSW cosine và RPC với BE1 | 08/10/2026 | BE1 |
| BE2-02 | BE2 | Gemini helper 1536 chiều, service-role client và Vector Store local | 08/10/2026 | BE1, BE3 |
| BE2-03 | BE2 | `POST /api/embeddings/sync`: product-to-text, chunking, SHA-256 hash, upsert và xóa chunk thừa | 08/10/2026 | BE1, BE3, QA |
| BE2-04 | BE2 | Query embedding + RPC `match_product_embeddings`, lọc theo product và format context có nguồn | 08/10/2026 | BE3, QA |
| BE2-05 | BE2 | `POST /api/chat`, LangChain prompt grounded, structured output và checkout URL do server kiểm soát | 08/10/2026 | FE, BE3, QA |

---

## 3. IN PROGRESS

| Task ID | Member | Task | Progress | Blocker | Next Step |
|---|---|---|---|---|---|
| — | BE2 | Không còn task BE2-04/05 đang thực hiện | — | — | Chờ review/cross-test trước khi merge |

---

## 4. BLOCKED

| Task ID | Owner | Blocked By | Required From | Impact |
|---|---|---|---|---|
| — | BE2 | Không có blocker kỹ thuật hiện tại | — | Chờ review/cross-test |

Dependency hiện tại: ~~BE1 schema + contract~~ → ~~BE2 vector store + document embeddings~~ → ~~semantic search~~ → ~~RAG test~~ → BE3/QA tích hợp.

---

## 5. HANDOFFS

| From | To | Deliverable | Status | Date |
|---|---|---|---|---|
| BE1 | BE2 | Migration `product_embeddings`, RPC `match_product_embeddings`, seed product và generated types | DONE (Local) | 08/10/2026 |
| BE2 | BE1 | Gemini embedding pipeline 1536 chiều và `/api/embeddings/sync` | DONE — commit `aab945f`, đã merge `origin/dev` | 08/10/2026 |
| BE2 | BE3 | Sync endpoint: `POST`, body `{ product_id }`, Bearer secret, response thống kê chunk | READY_FOR_HANDOFF | 08/10/2026 |
| BE2 | Tester 2 & Tester 3 | Smoke test product Bà Nà Hills: sinh 1 chunk, 1536 chiều, lần hai skip do hash không đổi | READY_FOR_HANDOFF | 08/10/2026 |
| BE2 | Toàn team | Code document embedding + local verification | DONE; retrieval/prompt còn tiếp tục | 08/10/2026 |
| BE2 | FE, BE3, QA | `POST /api/chat`: request theo `api_contracts.md`, response `{ reply, suggested_checkout_url }` | READY_FOR_HANDOFF | 08/10/2026 |

---

## 6. INTERFACES

| Interface | Owner | Consumer | Contract / Definition | Status |
|---|---|---|---|---|
| DB Schema ↔ Vector Store | BE1: schema; BE2: application pipeline | BE2 | `product_embeddings`, `vector(1536)`, UNIQUE `(product_id, chunk_index)`, HNSW cosine, service-role write | DONE (Local) |
| Test Data ↔ Embedding Pipeline | BE1: seed; BE2: pipeline | BE2 | Product seed `33333333-3333-3333-3333-333333333333` (Bà Nà Hills) | DONE (Local) |
| Embedding ↔ Semantic Search | BE2 | BE2/BE3 | `gemini-embedding-2`, 1536 chiều cho cả document/query; RPC trả Top-K cosine | DONE (Local) |
| Embedding Sync ↔ n8n/webhook | BE2: route; BE3: workflow | BE3 | `POST /api/embeddings/sync`, Bearer secret, body `{ product_id }`; generated/skipped/removed | ROUTE DONE; webhook chưa cấu hình |
| RAG ↔ LLM | BE2 | RAG thử nghiệm | Prompt + context từ dữ liệu được duyệt; thiếu dữ liệu phải nói rõ, không bịa thông tin | DONE (Local) |
| RAG ↔ QA | BE2; Tester 2 & Tester 3 | QA | `/api/chat`; kiểm tra giá từ context, prompt injection, mã giảm giá và checkout URL | READY_FOR_HANDOFF |

Không tự chọn endpoint, tên bảng, field hoặc provider thành contract chính thức khi team chưa chốt.

---

## 7. SHARED RESOURCES

| Resource | Owner | Location | Status |
|---|---|---|---|
| Supabase Project / Schema / ERD | BE1 | `supabase/migrations/` và Supabase local | DONE (Local) |
| GitHub repository | Team | `origin/dev`; BE2 commit `aab945f` | MERGED |
| Product sample / Test data | BE1 | `supabase/seed.sql` | AVAILABLE |
| Gemini / Supabase server credentials | Người quản lý môi trường | `.env.local`, gitignored; không ghi secret trong log | AVAILABLE LOCAL |
| Semantic Search / RAG documentation | BE2 | File này và source BE2 | READY_FOR_REVIEW |
| n8n instance / workflow contract | BE3 | Chưa được cung cấp | NEEDS HANDOFF |
| API Test Suite (Postman/Bruno) | Tester 2 & Tester 3 | Chưa được cung cấp | PLANNED theo Weekly Plan |

---

## 8. CONFLICT / DUPLICATE CHECK

### Potential Duplicate Tasks
- Đã tách ownership: BE1 sở hữu schema/RPC; BE2 sở hữu chunking, embeddings, sync và retrieval logic.

### Ownership Conflicts
- Roadmap giao BE1 schema gốc và BE2 AI/RAG. Contract migration do BE1 bàn giao; BE2 chỉ cập nhật nhãn model theo quyết định provider của team và giữ nguyên cấu trúc 1536 chiều.
- BE2 phụ trách logic ứng dụng; BE1 rà soát schema/quyền DB; BE3 phụ trách webhook/workflow.

### Interface Conflicts
- Pipeline hiện dùng bảng `products` theo schema thực tế. Không tạo entity `tours` mới.
- Contract sync cho BE3 đã có; Database Webhook/workflow vẫn cần được cấu hình và cross-test.

### Dependency Conflicts
- Dependency schema của BE1 đã được giải tỏa; document embedding pipeline đã tích hợp và kiểm thử local.
- ⚠️ TIMELINE / SCOPE NEEDS DECISION: Roadmap đặt AI Sales Agent ở tuần 3; Weekly Plan yêu cầu demo chat AI tuần 1; PRD mục 50 đặt launch AI Sales Agent tuần 4. Cần xác nhận demo tuần 1 chỉ là thử nghiệm kỹ thuật và phân biệt kế hoạch launch với roadmap phát triển.
- ⚠️ REQUIREMENT CONFLICT ngoài phần BE2: PRD có Video generation và Admin Dashboard trong MVP, Roadmap loại AI Video Generation/Admin UI Dashboard. Ghi nhận để BA/team chốt; BE2 không tự giải quyết hoặc nhận thêm task này.

---

## 9. DECISIONS

| Date | Decision | Reason | Decided By | Impact |
|---|---|---|---|---|
| 08/10 | Dùng Google Gemini `gemini-embedding-2`, output 1536 chiều | Team BE1/BE2 thống nhất provider và giữ contract DB 1536 | BE1, BE2 | Document/query phải dùng cùng model; không trộn embedding space |
| 08/10 | Route ứng dụng đặt tại root `app/api/embeddings/sync` | Repo đang dùng root `app/`; Next.js bỏ qua `src/app` khi root `app` tồn tại | BE2 | BE3/webhook gọi endpoint này |
| 08/10 | Ghi embeddings chỉ bằng service-role client phía server | Không lộ secret và tuân thủ RLS/write permission | BE1, BE2 | Browser không được gọi Supabase write trực tiếp |
| 08/10 | Dùng LangChain direct RAG chain và `gemini-3.8-flash` cho câu trả lời | Luồng tuyến tính retrieve → generate, không cần state graph; structured output tách reply/purchase intent | BE2 | API chỉ trả context-grounded reply; URL do server tạo |

Ràng buộc từ nguồn: BE1 phụ trách schema gốc theo Roadmap; AI chỉ dùng dữ liệu merchant được duyệt theo PRD. Không bịa giá, tồn kho, khuyến mãi, giờ mở cửa, chính sách hoàn tiền hoặc trạng thái booking; không tự nhận là merchant.

---

## 10. CHANGE LOG

| Date | Change | Author |
|---|---|---|
| 06/10/2026 | Khởi tạo BE2_W1 theo cấu trúc mẫu BE1; bổ sung task BE2, dependency, handoff và conflict từ tài liệu | AI Planner |
| 08/10/2026 | Cập nhật tiến độ thực tế từ commit `aab945f`, PR merge `af5764e` và smoke test Supabase local | BE2 |
| 08/10/2026 | Hoàn thành BE2-04/05 trên nhánh `feature/be2-query-rag`; smoke-test retrieval, grounded reply, prompt injection và attribution | BE2 |

---

## 11. DAILY UPDATE

### 08/10/2026

#### BE2

**Done**
- Thống nhất Gemini `gemini-embedding-2` với output 1536 chiều, giữ nguyên contract `vector(1536)`.
- Thêm helper document/query embedding dùng chung model constant và kiểm tra đúng 1536 phần tử.
- Thêm service-role Supabase client phía server.
- Thêm `POST /api/embeddings/sync`: đọc product, product-to-text, chunking deterministic, SHA-256 `content_hash`, upsert `(product_id, chunk_index)`, lưu model và xóa chunk thừa.
- Xóa route prototype `/api/embeddings/generate`.
- `npx supabase db reset`, `npx tsc --noEmit` và ESLint đều pass.
- Smoke test local sản phẩm Bà Nà Hills: HTTP 200, 1 row, hash 64 ký tự, model đúng, `vector_dims(embedding) = 1536`; gọi lần hai `generated = 0`, `skipped = 1`.
- Commit `aab945f` đã merge vào `origin/dev` qua merge commit `af5764e`.
- Thêm query pipeline: Gemini query embedding 1536 chiều → RPC `match_product_embeddings` → context có source metadata.
- Thêm LangChain Sales Agent và `POST /api/chat` theo contract; prompt cấm bịa giá/mã giảm giá/URL và chống chỉ dẫn độc hại trong context/user input.
- Smoke test local `/api/chat`: trả đúng giá Bà Nà Hills 900.000/850.000 VNĐ; không bịa `GIAM50`; không tự sinh checkout URL; attribution sai trả HTTP 404.
- `npx tsc --noEmit` và ESLint pass; endpoint đặt timeout LLM 30 giây, retry 1 lần và Gemini thinking level LOW.

**In Progress**
- Chờ team review và QA cross-test nhánh `feature/be2-query-rag`.

**Blocked**
- Không có blocker kỹ thuật hiện tại.

**Next**
- FE/BE3/QA review và cross-test `POST /api/chat`.
- Phối hợp BE3 cấu hình Database Webhook gọi `/api/embeddings/sync` và bổ sung backfill cho sản phẩm hiện có.
- Sau khi được xác nhận: commit/push nhánh và mở merge request theo quy trình team.

**Handoff**
- BE1/BE3/QA có thể dùng embedding sync từ commit `aab945f`; `/api/chat` trên nhánh `feature/be2-query-rag` đã sẵn sàng để review/cross-test.

### 06/10/2026

#### BE2

**Done**
- Chưa có task kỹ thuật được BE2 xác nhận hoàn thành.

**In Progress**
- Mẫu BE1 ghi BE2 đang phối hợp thiết kế trường vector; cần BE2 xác nhận trạng thái hiện tại.

**Blocked**
- Tích hợp DB đang chờ xác nhận schema/contract từ BE1.
- Chưa xác nhận đã có Tour sample và quyền truy cập LLM/Embedding API.

**Next**
- Xác nhận schema handoff và mapping Tour/Product với BE1.
- Chốt ownership migration và cách gọi RAG với BE1/BE3.
- Nhận sample từ Tester 2 & Tester 3; chuẩn bị embedding prototype và prompt.
- Khi prerequisites sẵn sàng: cấu hình pgvector → lưu embeddings → semantic search → RAG test.

**Handoff**
- Chưa có handoff thực tế được xác nhận; cập nhật khi có deliverable và người nhận.

---

# RULES

1. Không tự nhận task của người khác hoặc thay đổi schema gốc khi chưa thống nhất.
2. Không đánh dấu DONE nếu chưa có deliverable và kết quả kiểm tra.
3. Task đang làm phải có owner; không tự gán phần trăm tiến độ.
4. Task bị block phải ghi dependency và người cung cấp.
5. Mọi interface quan trọng phải có owner và contract được chốt.
6. Mọi handoff phải ghi From → To, deliverable và trạng thái nhận.
7. Cảnh báo duplicate task và việc cùng sửa tài nguyên chung.
8. Requirement/ownership chưa rõ phải ghi NEEDS DECISION.
9. Không tự tạo requirement, deadline, API, database field hoặc acceptance criteria.
10. Không im lặng giải quyết conflict giữa tài liệu.
11. Chỉ cập nhật phần bị ảnh hưởng khi có tiến độ mới; tính lại READY/BLOCKED và downstream.
12. Trước 09/10/2026 12:00: hoàn thành task, merge PR main/staging, cập nhật tài liệu và bàn giao; chiều 13:30–17:30 phối hợp cross-test/hotfix theo Weekly Plan.
