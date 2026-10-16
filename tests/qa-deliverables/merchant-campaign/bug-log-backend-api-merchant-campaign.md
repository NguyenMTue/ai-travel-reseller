# Báo Cáo Lỗi Backend / API (Backend API Bug Log)
## Chức năng: Form tạo Campaign của Merchant trên trang `/merchant`
**Dự án:** AI Travel Reseller Network  
**Người lập:** Senior QA Automation Engineer  
**Bộ kịch bản kiểm thử tự động liên quan:** `tests/merchant-campaign-form.spec.ts`  
**Ngày kiểm thử:** 2026-10-16  

---

### Tổng kết kiểm thử Backend / API:
- **Phạm vi kiểm thử:** Logic xử lý Server Action và Service tại `app/merchant/campaigns/new/actions.ts`, `src/lib/merchant/campaign-server.ts`, `src/lib/merchant/campaign-service.ts`, và `src/lib/merchant/campaign-policy.ts`.
- **Tổng số kịch bản kiểm thử API/Service thực thi:** 10 / 10 kịch bản
- **Số kịch bản đạt (PASS):** 10 / 10 (100%)
- **Số kịch bản lỗi (FAIL):** 0 / 10 (0%)

---

### Kết luận đánh giá chất lượng Backend / API:
> **Không phát hiện lỗi trên các chức năng Backend / API đã triển khai ở tiến độ hiện tại.**

Các hàm xử lý và quy tắc nghiệp vụ backend đã triển khai đều thỏa mãn đúng các ràng buộc nghiêm ngặt:
1. **Xác thực quyền hạn Merchant (Authorization):** Hàm `authorizeMerchant` kiểm tra định danh người dùng qua bảng quan hệ `merchants`, không phụ thuộc vào metadata client gửi lên nhằm chống leo thang đặc quyền.
2. **Kiểm tra quyền sở hữu sản phẩm (Product Ownership Re-check):** Trên mỗi lượt submit, hàm `saveMerchantCampaign` đều xác thực lại xem `product_id` có thực sự thuộc về `merchant_id` của tài khoản đang đăng nhập hay không, chống lỗ hổng IDOR.
3. **Chuẩn hóa ngày chiến dịch theo múi giờ Việt Nam:** Hàm `vietnamCampaignDates` chuyển đổi chính xác ngày bắt đầu và ngày kết thúc thành khoảng thời gian bao trùm trọn vẹn theo múi giờ `Asia/Ho_Chi_Minh` (từ `00:00:00+07:00` đến `23:59:59.999+07:00`).
4. **Phân loại mã lỗi trực quan:** Hàm `classifyCampaignFailure` bắt và phân loại chính xác các mã lỗi Postgres/PostgREST (`42501` thành permission, `401/PGRST301` thành session, `42703` thành schema, `08xxx/PGRST00` thành network), giúp Frontend hiển thị hướng dẫn khắc phục cụ thể cho người dùng.
5. **Chính sách không tự động retry nguy hiểm:** Khi gặp lỗi mạng sau khi đã dispatch POST, hệ thống trả về trạng thái `uncertain` và khóa thao tác để bảo vệ tính toàn vẹn dữ liệu, tránh tạo chiến dịch trùng lặp ngoài ý muốn.
