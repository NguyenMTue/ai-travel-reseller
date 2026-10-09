# TEAM WORK LOG
Project: AI Travel Reseller MVP
Week: 1 — 06–09/10/2026
Last Updated: 09/10/2026

Phạm vi cập nhật: Cập nhật đồng bộ tiến độ của FE và BE3 (N8N-001). Không thay thế log độc lập của BE1/BE2.

## 1. ACTIVE WORK
| Task ID | Member | Role | Task | Status | Started | Deadline |
|---|---|---|---|---|---|---|
| FE-W1-01/02 | Thành viên FE | FE | Foundation/Landing | WAITING_REVIEW | 08/10 | 09/10 12:00 |
| FE-W1-03 | Thành viên FE | FE | Auth UI + integration | BLOCKED E2E | 08/10 | 09/10 12:00 |
| FE-W1-04/05 | Thành viên FE | FE | Chat/Dashboard | WAITING_REVIEW | 08/10 | 09/10 12:00 |
| FE-W1-06 | Thành viên FE | FE | QA local & handoff | WAITING_HANDOFF | 08/10 | 09/10 12:00 |
| N8N-001 | Thái Thanh Tú (BE3) | Automation (BE3) | AI Travel Review Draft Automation (n8n + Sheets) | WAITING_REVIEW | 08/10 | 09/10 12:00 |

## 2. COMPLETED WORK
| Task ID | Member | Deliverable | Completed At | Handoff To |
|---|---|---|---|---|
| FE UI implementation (chưa nghiệm thu) | FE | 5 màn hình + states + adapters + tests | 08/10 | UI/UX, BE1/BE2, Tester 1 |
| N8N-001 Prototype | BE3 | Workflow n8n Form-to-Sheets + Gemini Interactions + Studio Python GUI/CLI | 08/10 | Content Reviewer / Merchant / PM |
| BE3 RAG & Service Foundation | BE3 | RAG Engine Đà Nẵng/Hội An + FastAPI + sync Supabase contents | 09/10 | BE1 / FE / Tester 2 |

## 3. IN PROGRESS
| Task ID | Member | Task | Progress | Blocker | Next Step |
|---|---|---|---|---|---|
| FE-W1-06 | FE | Review & bàn giao | Code local có; chờ review | GitHub/QA handoff chưa xác nhận | PR dev; cross-test |
| N8N-001 | BE3 | Kiểm thử guardrail và mở rộng persona | Workflow chạy thông luồng; chờ duyệt chất lượng | Cần reviewer/merchant duyệt | Test dữ liệu biên; tích hợp webhook campaign |

## 4. BLOCKED
| Task ID | Owner | Blocked By | Required From | Impact |
|---|---|---|---|---|
| FE-W1-03 | FE | Public config và tài khoản test | BE1 | Chưa test Auth thật |
| Chat E2E | FE | Attribution link + backend env | BE2/BE1 | Mới xác nhận contract mock |
| Design acceptance | UI/UX (theo roadmap) | Chưa có review chính thức | UI/UX | FE dùng thiết kế đề xuất |
| N8N-001 | BE3 | Chưa có người duyệt nội dung chính thức | Content Reviewer / Merchant | Chưa thể chuyển trạng thái sang APPROVED |

## 5. HANDOFFS
| From | To | Deliverable | Status | Date |
|---|---|---|---|---|
| FE | UI/UX/Tester 1 | UI, ảnh, tests | READY FOR REVIEW; chưa xác nhận nhận | 08/10 |
| FE | BE1 | Auth/config diff | READY FOR REVIEW | 08/10 |
| FE | BE2 | Chat adapter/payload/retry | READY FOR REVIEW | 08/10 |
| FE | PM | FE_W1 + delivery notes | READY FOR REVIEW | 08/10 |
| BE3 | Content Reviewer / Merchant | n8n Review Workflow + Google Sheet Queue | READY FOR REVIEW | 08/10 |
| BE3 | BE1 / FE / Team Dev | services/llm-service/ + migration contents | READY FOR INTEGRATION | 09/10 |

## 6. INTERFACES
| Interface | Owner | Consumer | Contract / Definition | Status |
|---|---|---|---|---|
| Auth | BE1 | FE | Existing app/actions/auth.ts + Supabase cookies | UI wired; E2E blocked |
| Chat | BE2 | FE | api_contracts.md POST /api/chat | Mock verified; E2E pending |
| UI design | UI/UX | FE | FE proposal in docs/fe-w1 | NEEDS REVIEW |
| Dashboard data | BE1 + FE cần chốt | FE | Fixture hiện tại không phải DB contract | INTERFACE NOT DEFINED |
| n8n Review Webhook | BE3 | FE / System | POST N8N_REVIEW_WEBHOOK_URL trả review_draft | DONE (Prototype verified) |
| RAG Search API | BE3 | n8n / System | POST /rag/search với Header X-API-Key | DONE (FastAPI sẵn sàng) |

## 7. SHARED RESOURCES
| Resource | Owner | Location | Status |
|---|---|---|---|
| FE source | FE | app/, src/components/ | Merged vào dev; UI Foundation hoàn tất |
| DB/Auth | BE1 | supabase/, src/lib/supabase/, app/actions/auth.ts | Merged vào dev; RLS và triggers sẵn sàng |
| AI Chat | BE2 | app/api/chat/, src/lib/ai/ | Merged vào dev d435a55 |
| n8n Workflow | BE3 | Instance n8n Self-hosted | Configured & operational |
| Review Sheet | BE3 | Google Sheets 'AI Travel Review Queue' | Connected via OAuth |
| LLM Service | BE3 | services/llm-service/ | Refactored & merged on feat/llm-service |
| Env | BE1/BE2/BE3 | .env.local, services/llm-service/.env.example | Có template rõ ràng |

## 8. CONFLICT / DUPLICATE CHECK
- Scope/Timeline: BE3 đã định hướng đúng theo semi-automatic (duyệt bản nháp trên Sheets trước khi xuất bản). Module TikTok API chỉ đóng vai trò thử nghiệm mở rộng.
- Database: Bảng `contents` đã được bổ sung migration `20261009103000_contents_add_be3_fields.sql` hỗ trợ `product_id UUID`, `persona`, `hook`, `cta`.

## 9. DECISIONS
| Date | Decision | Reason | Decided By | Impact |
|---|---|---|---|---|
| 08/10 | Giữ root app/ theo repo hiện tại | Tránh Next bỏ qua src/app và ảnh hưởng BE routes | FE implementation | Không di chuyển API |
| 08/10 | Giữ hàng chờ review trên Google Sheets | Tuân thủ rulebook semi-automatic; an toàn nội dung | BE3 | Chưa auto-post mạng xã hội |
| 09/10 | Chuẩn hóa code BE3 vào services/llm-service | Thống nhất cấu trúc microservice/scripts của repo | Team Lead / Trợ lý | Dễ import và quản lý |

## 10. CHANGE LOG
| Date | Change | Author |
|---|---|---|
| 08/10 | Khởi tạo registry FE từ nguồn và code quan sát được | FE qua trợ lý |
| 09/10 | Bổ sung cập nhật tiến độ BE3 (N8N-001) từ BE3_W1.md và chuẩn hóa services/llm-service | BE3 / Team Lead |

## 11. DAILY UPDATE
### 08/10/2026 — FE
**Done:** source UI, states, contract adapter, validation và kiểm tra local.
**In Progress:** review/bàn giao.
**Blocked:** credentials/tài khoản test; design approval; E2E staging.

### 09/10/2026 — BE3
**Done:** Workflow n8n Form-to-Sheets, Gemini Interactions API với retry logic, Google Sheets review queue (`NEEDS_REVIEW`), kho tri thức RAG Đà Nẵng / Hội An, Studio Desktop UI & CLI, migration mở rộng bảng `contents`.
**In Progress:** Kiểm thử guardrail độ chính xác AI, chuẩn bị endpoint webhook nhận event tạo Campaign từ Supabase.
**Blocked:** Cần Content Reviewer / Merchant xác nhận duyệt chất lượng bản nháp.
**Next:** Test dữ liệu biên, kết nối webhook tự động khi có Campaign mới ở Tuần 2.

## RULES
1. Không tự nhận task người khác hoặc sửa status của họ từ suy đoán.
2. DONE cần deliverable và bằng chứng; UI code không đồng nghĩa E2E hoàn tất.
3. Task có owner; blocker có người bàn giao; interface có contract.
4. Requirement chưa rõ ghi NEEDS DECISION; không im lặng xử lý conflict.
5. Cập nhật phần bị ảnh hưởng, giữ lịch sử và không tạo log trùng.
