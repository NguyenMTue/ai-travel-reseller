# Báo Cáo Lỗi Frontend (Frontend Bug Log)
## Chức năng: Form tạo Campaign của Merchant trên trang `/merchant`
**Dự án:** AI Travel Reseller Network  
**Người lập:** Senior QA Automation Engineer  
**Bộ kịch bản kiểm thử tự động liên quan:** `tests/merchant-campaign-form.spec.ts`  
**Ngày kiểm thử:** 2026-10-16  

---

### Tổng kết kiểm thử Frontend:
- **Phạm vi kiểm thử:** Các thành phần giao diện, trường nhập liệu, cơ chế validation, điều hướng và phản hồi người dùng đã được Frontend Developer triển khai tại `src/components/merchant/` (`campaign-form.tsx`, `campaign-create.tsx`, `dashboard.tsx`).
- **Tổng số kịch bản kiểm thử Frontend thực thi:** 10 / 10 kịch bản
- **Số kịch bản đạt (PASS):** 10 / 10 (100%)
- **Số kịch bản lỗi (FAIL):** 0 / 10 (0%)

---

### Kết luận đánh giá chất lượng Frontend:
> **Không phát hiện lỗi trên các chức năng Frontend đã triển khai ở tiến độ hiện tại.**

Toàn bộ các tính năng Frontend đã xây dựng đều hoạt động ổn định và đáp ứng tốt tiêu chuẩn kỹ thuật:
1. **Điều hướng & Cấu trúc trang:** Nút "Tạo chiến dịch" trên Dashboard liên kết chính xác đến trang tạo chiến dịch. Giao diện có bố cục rõ ràng, responsive, không bị vỡ layout/tràn màn hình (`scrollWidth <= innerWidth`).
2. **Trải nghiệm tiếp cận (Accessibility):** Hỗ trợ đầy đủ phím Tab/Enter, focus outline rõ ràng, nhãn `aria-label`, `aria-describedby`, `aria-invalid`, và `aria-busy` được cập nhật đồng bộ theo trạng thái form.
3. **Client-side Validation:** Cơ chế kiểm tra dữ liệu bằng Zod hoạt động chính xác:
   - Chặn submit form rỗng và tự động focus vào trường lỗi đầu tiên (`#product_id`).
   - Chặn mức hoa hồng ngoài khoảng 5.0% - 30.0% (`#commission_rate`).
   - Chặn ngày kết thúc sớm hơn ngày bắt đầu (`#end_date`).
   - Giới hạn độ dài ký tự tối đa qua thuộc tính `maxlength` (150 cho tên, 1000 cho đối tượng, 160 cho địa điểm).
4. **Bảo vệ người dùng khi gặp sự cố:** Khi hệ thống trả về lỗi (mất mạng, hết phiên, lỗi phân quyền), Frontend không xóa dữ liệu người dùng đã nhập mà giữ nguyên 100% trên form để người dùng có thể thử lại ngay sau khi khắc phục sự cố.
5. **Chống Submit lặp (Double Submit):** Nút lưu lập tức chuyển sang trạng thái "Đang lưu…" và bị vô hiệu hóa khi người dùng bấm, triệt tiêu nguy cơ tạo nhiều bản ghi trùng lặp do double click.

*(Lưu ý: Các trường nâng cao như Ngôn ngữ, Mục tiêu nội dung, Claim được phép/bị cấm theo SRS v1.1 chưa được đưa vào báo cáo này vì thuộc backlog Nhóm B - Chưa triển khai ở sprint hiện tại).*
