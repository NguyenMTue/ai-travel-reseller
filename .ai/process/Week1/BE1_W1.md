# TEAM WORK LOG

Project: AI Travel Reseller MVP
Week: Tuần 1 (06/10/2026 - 09/10/2026)
Last Updated: 08/10/2026

---

## 1. ACTIVE WORK

| Task ID | Member | Role | Task | Status | Started | Deadline |
|---|---|---|---|---|---|---|
| BE1-01 | BE1 | BE | Khởi tạo Supabase & ERD sơ bộ | DONE | 06/10 | 06/10 |
| BE1-02 | BE1 | BE | Thiết lập Migration Quyền (GRANT) & RLS | DONE | 07/10 | 07/10 |
| BE1-03 | BE1 | BE | Cấu hình Supabase Auth Middleware (proxy.ts) | DONE | 07/10 | 07/10 |
| BE1-04 | BE1 | BE | Tạo dữ liệu mẫu (seed.sql) | DONE | 07/10 | 08/10 |
| BE1-05 | BE1 | BE | Thiết lập Product Embeddings (pgvector, bảng `product_embeddings`, RPC search) | DONE (Local) | 08/10 | 08/10 |
| BE2-01 | BE2 | BE | Phối hợp thiết kế trường vector | IN_PROGRESS | 06/10 | 06/10 |
| UX-01 | UI/UX | UI | Khởi tạo Design System | IN_PROGRESS | 06/10 | 07/10 |

---

## 2. COMPLETED WORK

| Task ID | Member | Deliverable | Completed At | Handoff To |
|---|---|---|---|---|
| BE1-01 | BE1 | Khởi tạo Supabase & 8 bảng schema gốc | 06/10/2026 | BE2, BE3 |
| BE1-02 | BE1 | Migration RLS Policies & GRANT | 07/10/2026 | Toàn team |
| BE1-03 | BE1 | Cấu hình proxy.ts và Auth session refresh | 07/10/2026 | FE |
| BE1-04 | BE1 | Dữ liệu mẫu seed.sql | 07/10/2026 | Toàn team |
| BE1-05 | BE1 | Migration `20261008110000_product_embeddings.sql` + RPC `match_product_embeddings` + cập nhật `database.types.ts` | 08/10/2026 | BE2 |

---

## 3. IN PROGRESS

| Task ID | Member | Task | Progress | Blocker | Next Step |
|---|---|---|---|---|---|
| BE1-06 | BE1 | Đồng bộ migrations lên Supabase remote | 0% – Remote mới có `20261006162951`; còn 4 migration chưa push (07/10 ×3 + 08/10) | Cần PM/team xác nhận trước khi `db push` (sẽ áp cả RLS + auth trigger lên DB thật) | `npx supabase db push` sau khi PR vào `dev` được duyệt |

---

## 4. BLOCKED

| Task ID | Owner | Blocked By | Required From | Impact |
|---|---|---|---|---|
| BE2-02 | BE2 | None (Đã giải quyết) | BE1 | Có thể bắt đầu cấu hình Pgvector |
| BE3-01 | BE3 | None (Đã giải quyết) | BE1 | Có thể bắt đầu làm Webhook với cấu trúc DB |

---

## 5. HANDOFFS

| From | To | Deliverable | Status | Date |
|---|---|---|---|---|
| BE1 | Toàn team | ERD Diagram | DONE | 06/10 |
| BE1 | BE2, BE3, FE | Supabase DB Schema gốc | DONE | 06/10 |
| BE1 | Toàn team | RLS Policies & Quyền truy cập | DONE | 07/10 |
| BE1 | FE | Supabase Auth Proxy (Next.js) | DONE | 07/10 |
| BE1 | BE2 | Bảng `product_embeddings` + RPC `match_product_embeddings` + types (local) | DONE | 08/10 |

---

## 6. INTERFACES

| Interface | Owner | Consumer | Contract / Definition | Status |
|---|---|---|---|---|
| DB Schema Contract | BE1 | Toàn team | Bảng, Enums theo PRD | DONE |
| Supabase Auth API | BE1 | FE | Trả về token & session proxy | DONE |
| `product_embeddings` table | BE1 | BE2 | `product_id` (FK cascade), `chunk_index` (UNIQUE cùng product_id → dùng cho UPSERT), `content`, `content_hash`, `metadata` jsonb, `embedding vector(1536)`, `model`. Ghi: chỉ `service_role` | DONE (Local) |
| RPC `match_product_embeddings` | BE1 | BE2 | Input: `query_embedding vector(1536)`, `match_count` (mặc định 3, tối đa 50), `match_threshold` (mặc định 0), `filter_product_id` (tuỳ chọn). Output: `id, product_id, chunk_index, content, metadata, similarity` (cosine, sắp xếp giảm dần) | DONE (Local) |

---

## 7. SHARED RESOURCES

| Resource | Owner | Location | Status |
|---|---|---|---|
| Supabase Project | BE1 | DB Schema và RLS local | DONE (Local) |

---

## 8. CONFLICT / DUPLICATE CHECK

### Potential Duplicate Tasks
- BE1-05 và BE2-01/BE2-02 cùng đụng tới vector: **BE1 chỉ làm phần DB** (extension, bảng, index, RLS, RPC). **BE2 làm phần ứng dụng** (chunking, gọi OpenAI Embeddings, Route Handler `/api/embeddings/sync`, Database Webhook, backfill).

### Ownership Conflicts
- **Database Schema:** Đã xác nhận BE1 là Primary Owner. Không ai được phép tạo bảng trực tiếp ngoài BE1.

### Interface Conflicts
- Chưa có.

### Dependency Conflicts
- Toàn bộ backend phụ thuộc vào tốc độ xuất Data Schema của BE1. Block đã được giải tỏa cho BE2 và BE3.

---

## 9. DECISIONS

| Date | Decision | Reason | Decided By | Impact |
|---|---|---|---|---|
| 06/10 | BE1 sở hữu Database Gốc | Bắt buộc theo Master Roadmap | System | Không tạo task API khác nếu Schema chưa xong |
| 07/10 | Cấu hình proxy.ts (Next.js 16) | Đổi tên từ middleware.ts sang proxy.ts để xử lý auth | BE1 | FE cần để ý file proxy khi làm tính năng check login |
| 08/10 | Vector 1536 chiều, model `text-embedding-3-small` | Theo system_architecture.md mục 4 | BE1 | Đổi model sau này ⇒ phải migration đổi chiều vector + re-embed toàn bộ |
| 08/10 | Bảng riêng `product_embeddings` (1 sản phẩm → nhiều chunk) thay vì thêm cột vào `products` | Hỗ trợ chunking cho RAG, không làm nặng bảng `products` | BE1 | BE2 UPSERT theo `(product_id, chunk_index)` và xoá chunk thừa khi mô tả ngắn đi |
| 08/10 | Index HNSW + cosine (`vector_cosine_ops`) | Không cần train/rebuild như IVFFlat, phù hợp dữ liệu tăng dần | BE1 | BE2 phải dùng cosine (toán tử `<=>`) để tận dụng index |
| 08/10 | Chỉ `service_role` được ghi embeddings; anon/authenticated chỉ đọc | Tránh client giả mạo dữ liệu RAG | BE1 | Endpoint sync phải dùng Service Role Key (server-side) |

---

## 10. CHANGE LOG

| Date | Change | Author |
|---|---|---|
| 06/10 | Khởi tạo Team Work Log & Cập nhật BE1 Tasks | AI Planner |
| 07/10 | Hoàn thiện Migration RLS, thiết lập proxy.ts và dọn dẹp repo | BE1 |
| 08/10 | Thêm migration `20261008110000_product_embeddings.sql` (pgvector, bảng, index HNSW, RLS, RPC) | BE1 |
| 08/10 | Verify migration local thành công; regenerate `src/lib/database.types.ts` (chuyển từ UTF-16 sang UTF-8, format Prettier) | BE1 |

---

## 11. DAILY UPDATE

### 08/10/2026

#### BE1

**Done**
- Tạo migration `supabase/migrations/20261008110000_product_embeddings.sql`:
  - Kích hoạt extension `vector` (v0.8.2) trong schema `extensions`.
  - Tạo bảng `product_embeddings` (FK → `products` ON DELETE CASCADE, UNIQUE `(product_id, chunk_index)`, `content_hash` để bỏ qua re-embed khi nội dung không đổi).
  - Index HNSW cosine trên cột `embedding`; trigger tự cập nhật `updated_at`.
  - RLS: public read, chỉ `service_role` được ghi.
  - RPC `match_product_embeddings` (SECURITY INVOKER, `search_path` rỗng) trả về Top-K chunk theo cosine similarity.
- `npx supabase db reset` local: toàn bộ 5 migration + seed chạy thành công.
- Test SQL (trong transaction, đã rollback) – **PASS**:
  - INSERT 2 chunk + UPSERT theo `(product_id, chunk_index)` hoạt động.
  - RPC trả đúng thứ tự similarity (chunk A 0.9806 > chunk B 0.1961).
  - `anon` đọc được, INSERT bị chặn (`permission denied`).
  - Xoá product ⇒ embeddings bị xoá theo (cascade).
- Regenerate `src/lib/database.types.ts` (có `product_embeddings` + `match_product_embeddings`), typecheck OK.

**In Progress**
- None.

**Blocked**
- `db push` lên remote: chờ team/PM xác nhận (remote mới có migration `20261006162951`, push sẽ áp cả 3 migration RLS/auth trigger ngày 07/10).

**Next**
- Commit lên nhánh `Feature_ProductEmbeddings` → tạo PR vào `dev`.
- Sau khi được duyệt: `npx supabase db push`.
- Viết Edge Function / API Route cấp Tracking Link.

**Handoff**
- BE2: Contract bảng `product_embeddings` & RPC `match_product_embeddings` (xem mục 6). BE2 tiếp tục: Route Handler `/api/embeddings/sync` + Database Webhook trên `products` (INSERT/UPDATE) + script backfill sản phẩm hiện có.

### 07/10/2026

#### BE1

**Done**
- Tạo Migration cấu hình Quyền (GRANT) và RLS Policies cho 8 bảng.
- Tạo file `proxy.ts` và thiết lập hàm `updateSession()` trong middleware Supabase để bảo vệ routes `/merchant`, `/reseller`, `/admin`.
- Gỡ file chứa biến môi trường nhạy cảm `env.text` ra khỏi git tracking.
- Viết file dữ liệu mẫu `seed.sql` với user giả lập (1 Merchant, 1 Reseller) cùng các dữ liệu liên quan (Product, Campaign, Content).
- Cố định lỗi duplicate key trong `seed.sql` (bổ sung `ON CONFLICT DO UPDATE`) để trigger Auth chạy mượt mà cùng seed data.
- Sửa lỗi encoding file `.gitignore`.
- Chạy thành công lệnh `npx supabase db reset` local, xác nhận database đã nạp đầy đủ cấu trúc và dữ liệu.

**In Progress**
- Khởi tạo pgvector (BE2 đang chờ).

**Blocked**
- None (Đã test thành công `db reset` trên Docker local).

**Next**
- Tạo file migration kích hoạt extension pgvector và tạo bảng `product_embeddings` cho team AI (BE2).
- Viết Edge Function / API Route cấp Tracking Link.

### 06/10/2026

#### BE1

**Done**
- Nhận task tuần 1.

**In Progress**
- Khởi tạo Supabase và thiết kế ERD.

**Blocked**
- None.

**Next**
- Chốt ERD với team và bắt tay vào tạo bảng.

**Handoff**
- Chưa bàn giao.