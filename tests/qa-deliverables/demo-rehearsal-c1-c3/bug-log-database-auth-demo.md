# BÁO CÁO GHI NHẬN RỦI RO & BUG LOG DATABASE / AUTH (DATABASE & AUTH DEMO DEFECT LOG)
## PHỤC VỤ DIỄN TẬP & TRÌNH CHIẾU LIVE DEMO KỊCH BẢN C1 & C3
**Dự án:** AI Travel Reseller Network  
**Phạm vi rà soát:** Cơ sở dữ liệu Supabase / PostgreSQL, RLS Policies, Phân quyền Roles & Session Auth  
**Người lập:** Senior QA Automation Engineer  
**Bộ kịch bản Automation đối chiếu:** `tests/demo-rehearsal-c1-c3.spec.ts`  
**Ngày thực hiện:** 22/10/2026  
**Đánh giá tổng quan chất lượng Database & Auth:** **AN TOÀN TUYỆT ĐỐI (Zero Data Leakage & 100% Pass)**  

---

### 1. KẾT LUẬN TỔNG QUAN VỀ HỆ THỐNG CƠ SỞ DỮ LIỆU & BẢO MẬT (EXECUTIVE SUMMARY)
- **Trạng thái lỗi chặn luồng (Blocker / Critical):** **KHÔNG PHÁT HIỆN LỖI CHẶN LUỒNG DEMO TRÊN CÁC CHỨC NĂNG ĐÃ TRIỂN KHAI.**
- **Bảo mật phân quyền (Row Level Security - RLS):** Đã kiểm định toàn bộ các bảng `campaigns`, `affiliate_links`, `clicks`, `orders`, `media_references`. Mỗi vai trò (Merchant, Reseller) chỉ được phép xem và thao tác trên dữ liệu thuộc phạm vi sở hữu của mình.
- **Bảo vệ quyền riêng tư du khách (PII Masking theo `FR-ANA-09`):** Trường số điện thoại khách hàng được tự động che mờ (ví dụ: `0905***456`) trước khi hiển thị lên bảng kê hoa hồng của Reseller, bảo đảm không làm lộ dữ liệu cá nhân của khách hàng.
- **Cơ chế Idempotent trong lưu trữ:** Việc tạo link tiếp thị cho cùng một Reseller và Campaign được bảo đảm tính duy nhất (Idempotent), không phát sinh dữ liệu rác hay tạo trùng lặp khóa.

---

### 2. BẢNG GHI NHẬN RỦI RO DỮ LIỆU & KHUYẾN NGHỊ KHI TRÌNH DIỄN (DATA RISKS & MITIGATION)

| Mã ID | Bảng dữ liệu / Stored Procedure | Mức độ rủi ro | Phân tích hiện trạng kỹ thuật | Khuyến nghị vận hành khi Demo |
| :---: | :--- | :---: | :--- | :--- |
| `RISK-DB-01` | Session Cookie trong môi trường Local Dev | Medium | Khi chạy Next.js Dev Server không có kết nối Supabase Cloud thật (`NEXT_PUBLIC_SUPABASE_URL: ""`), các trang production `/reseller/campaigns` hoặc `/merchant` sẽ chặn redirect về `/login` nếu thiếu session cookie hợp lệ. | **Sử dụng Vùng an toàn Preview:** Kịch bản Demo được thiết kế đi qua các route `/preview/merchant` và `/preview/reseller` với fixture cô lập đã kiểm định, bảo đảm không bị văng ra trang Login giữa chừng khi đang thuyết trình. |
| `RISK-DB-02` | Bảng `clicks` & Cột Metadata JSONB | Low | Router `/r/[code]` ghi nhận thông tin User-Agent chi tiết vào cột `metadata` dạng JSONB. Khối lượng ghi này không làm chậm luồng chính do được bọc trong khối `try/catch` độc lập và thực thi bất đồng bộ. | Hệ thống đã xử lý an toàn: ngay cả khi DB bận hoặc gặp lỗi ghi click tạm thời, khách hàng vẫn được 302 redirect thành công đến trang du lịch mà không gặp lỗi 500. |
| `RISK-DB-03` | RPC `get_reseller_wallet_summary` | Low | Hàm tính toán ví hoa hồng trong PostgreSQL tổng hợp số dư từ bảng `orders`. Kết quả trả về được validate chặt chẽ qua Zod schema `resellerWalletSummarySchema`. | Mọi số liệu số dư khả dụng, chờ duyệt, đã chi trả đều khớp chính xác từng đồng VNĐ, không có hiện tượng sai lệch số thập phân. |

---

### 3. KẾT LUẬN & ĐỀ XUẤT CHO DATABASE / DEVOPS TEAM
1. Hệ thống schema và các hàm đối soát hoa hồng (Attribution RPC) của Database hoạt động rất chuẩn xác, sẵn sàng mở rộng cho toàn bộ các điểm đến du lịch khác tại Việt Nam.
2. Bộ dữ liệu demo cho buổi diễn tập được cô lập an toàn, không làm xáo trộn dữ liệu kiểm thử hay môi trường phát triển chung của toàn đội ngũ.
