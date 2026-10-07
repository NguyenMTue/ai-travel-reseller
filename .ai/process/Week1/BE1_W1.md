# TEAM WORK LOG

Project: AI Travel Reseller MVP
Week: Tuần 1 (06/10/2026 - 09/10/2026)
Last Updated: 07/10/2026

---

## 1. ACTIVE WORK

| Task ID | Member | Role | Task | Status | Started | Deadline |
|---|---|---|---|---|---|---|
| BE1-01 | BE1 | BE | Khởi tạo Supabase & ERD sơ bộ | DONE | 06/10 | 06/10 |
| BE1-02 | BE1 | BE | Thiết lập Migration Quyền (GRANT) & RLS | DONE | 07/10 | 07/10 |
| BE1-03 | BE1 | BE | Cấu hình Supabase Auth Middleware (proxy.ts) | DONE | 07/10 | 07/10 |
| BE1-04 | BE1 | BE | Tạo dữ liệu mẫu (seed.sql) | DONE | 07/10 | 08/10 |
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

---

## 3. IN PROGRESS

| Task ID | Member | Task | Progress | Blocker | Next Step |
|---|---|---|---|---|---|
| | | | | | |

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

---

## 6. INTERFACES

| Interface | Owner | Consumer | Contract / Definition | Status |
|---|---|---|---|---|
| DB Schema Contract | BE1 | Toàn team | Bảng, Enums theo PRD | DONE |
| Supabase Auth API | BE1 | FE | Trả về token & session proxy | DONE |

---

## 7. SHARED RESOURCES

| Resource | Owner | Location | Status |
|---|---|---|---|
| Supabase Project | BE1 | DB Schema và RLS local | DONE (Local) |

---

## 8. CONFLICT / DUPLICATE CHECK

### Potential Duplicate Tasks
- Chưa có.

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

---

## 10. CHANGE LOG

| Date | Change | Author |
|---|---|---|
| 06/10 | Khởi tạo Team Work Log & Cập nhật BE1 Tasks | AI Planner |
| 07/10 | Hoàn thiện Migration RLS, thiết lập proxy.ts và dọn dẹp repo | BE1 |

---

## 11. DAILY UPDATE

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