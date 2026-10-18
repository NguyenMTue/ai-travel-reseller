# Báo Cáo Lỗi Database & Auth (Database & Auth Bug Log)
## Chức năng: Form tạo Campaign của Merchant trên trang `/merchant`
**Dự án:** AI Travel Reseller Network  
**Người lập:** Senior QA Automation Engineer  
**Bộ kịch bản kiểm thử tự động liên quan:** `tests/merchant-campaign-form.spec.ts`  
**Ngày kiểm thử:** 2026-10-16  

---

### Tổng kết kiểm thử Database & Auth:
- **Phạm vi kiểm thử:** Mô hình dữ liệu và phân quyền RLS liên quan đến tạo Campaign của Merchant (`campaigns`, `products`, `merchants`, và các chính sách bảo mật Supabase).
- **Tổng số kịch bản kiểm thử luồng dữ liệu & phân quyền thực thi:** 10 / 10 kịch bản
- **Số kịch bản đạt (PASS):** 10 / 10 (100%)
- **Số kịch bản lỗi (FAIL):** 0 / 10 (0%)

---

### Kết luận đánh giá chất lượng Database & Auth:
> **Không phát hiện lỗi trên các luồng Database & Auth đã triển khai ở tiến độ hiện tại.**

Các chính sách bảo mật dữ liệu và cấu trúc lưu trữ hiện tại hoạt động đúng thiết kế:
1. **Ràng buộc toàn vẹn dữ liệu (Data Integrity):**
   - Khóa ngoại `merchant_id` và `product_id` đảm bảo chiến dịch luôn gắn liền với một đối tác Merchant hợp lệ và một sản phẩm du lịch cụ thể.
   - Các trường `start_date`, `end_date`, `status` được định nghĩa kiểu dữ liệu đồng nhất.
2. **Kiểm soát bảo mật & Phân quyền (Row-Level Security):**
   - Chỉ tài khoản thuộc role `merchant` và có bản ghi trong bảng `merchants` mới được phép thao tác chèn chiến dịch.
   - Khi Merchant không có quyền hoặc cố tình chèn chiến dịch cho sản phẩm của Merchant khác, hệ thống chặn lại với mã lỗi phân quyền `42501` và phản hồi đúng thông báo "Tài khoản chưa có quyền Merchant hoặc không được phép thao tác với dữ liệu này."
3. **Quản lý phiên đăng nhập (Session Lifecycle):**
   - Khi token phiên đăng nhập hết hạn hoặc người dùng chưa xác thực, cơ chế auth chặn ngay tại tầng truy vấn và điều hướng người dùng đến trang đăng nhập an toàn (`/login?next=/merchant/campaigns/new`).

*(Lưu ý về kế hoạch mở rộng Schema trong tương lai: Để hỗ trợ các tính năng thuộc Nhóm B như ghi chú AI `FR-CMP-01` hay điều kiện reseller `FR-CMP-05`, Database Dev cần bổ sung các cột `ai_notes`, `target_kpi`, `allowed_claims`, `prohibited_claims` trong các đợt migration tiếp theo).*
