# BÁO CÁO THEO DÕI LỖI (BUG LOG) - DÀNH CHO BACKEND / API DEVELOPER
## Chức năng: Thư viện Media & Luồng tải Video mẫu của Merchant (Merchant Media Library)
**Dự án:** AI Travel Reseller Network  
**Vai trò:** Senior QA Automation Engineer  
**Đối tượng bàn giao:** Backend Lead (BE1 - Tuấn) & BE2 / API Developer  
**Ngày báo cáo:** 22/10/2026  
**Mã Task triển khai liên quan:** `BE1-W3-03` (Merchant Video Library API & Zod Validator)  

---

## 1. TỔNG QUAN TRẠNG THÁI KIỂM THỬ (TEST SUMMARY)

- **Tổng số lỗi phát hiện (Open Bugs):** **0 Lỗi (0 Open Bugs)** trên các chức năng đã triển khai ở tiến độ hiện tại.
- **Đánh giá chất lượng API Backend:** **XUẤT SẮC (CLEAN PASS)**
  - Các endpoint API tại `app/api/merchant/media/route.ts` xử lý chuẩn xác cả 3 phương thức `GET`, `POST`, `DELETE`.
  - Bộ kiểm thực dữ liệu Zod (`src/lib/merchant/media-schema.ts`) đạt độ tin cậy 100%, chặn đứng toàn bộ payload độc hại, chuỗi rỗng, URL không hợp lệ hoặc dữ liệu vượt ngưỡng.
  - Tầng dịch vụ (`src/lib/merchant/media-service.ts`) ánh xạ dữ liệu chuẩn hóa, hỗ trợ phân trang và lọc đa tiêu chí (`platform`, `tag`, `search`).
  - Cơ chế bảo mật Production hoạt động nghiêm ngặt: Tự động vô hiệu hóa cơ chế bypass `x-merchant-id` khi chạy ở môi trường Production, bắt buộc phải có phiên đăng nhập Supabase Auth chính thống (HTTP 401 Unauthorized).

---

## 2. BẢNG CHI TIẾT TÌNH TRẠNG KIỂM TRA API ĐÃ PHÁT TRIỂN (NHÓM A)

| API Endpoint | Phương thức | Chức năng kiểm thử | Kết quả mong đợi | Kết quả kiểm tra thực tế | Trạng thái |
| :--- | :---: | :--- | :--- | :--- | :---: |
| `/api/merchant/media` | `POST` | Chặn truy cập khi thiếu thông tin xác thực | Trả về `HTTP 401 Unauthorized`, mã lỗi `UNAUTHORIZED` | Trả về chính xác `401 Unauthorized` kèm message lỗi tiếng Việt rõ ràng. | **PASS** |
| `/api/merchant/media` | `POST` | Bảo mật chống giả mạo danh tính trên Production | Vô hiệu hóa `x-merchant-id` header trên Production mode, chặn `HTTP 401` | Chặn đứng hành vi bypass header ngoài môi trường dev, bảo vệ an toàn danh tính Merchant. | **PASS** |
| `/api/merchant/media` | `POST` | Validation dữ liệu đầu vào với Zod Schema | Chặn payload có tiêu đề rỗng, URL sai cú pháp, thời lượng âm (Trả `HTTP 400`) | Zod chặn chuẩn xác ở tầng schema, trả về `400 Bad Request` kèm chi tiết `fieldErrors`. | **PASS** |
| `/api/merchant/media` | `GET` | Phân trang & Lọc danh sách theo platform | Lọc chính xác, trả về cấu trúc `{ success: true, data: [...], pagination: {...} }` | Cấu trúc JSON chuẩn mực, header `Cache-Control: private, no-cache` được thiết lập đúng. | **PASS** |
| `/api/merchant/media` | `DELETE` | Xóa video với ID không hợp lệ | Chặn ID sai định dạng UUID hoặc thiếu `?id=` (Trả `HTTP 400`) | Chặn chính xác `400 Bad Request` khi ID không khớp `UUID_PATTERN`. | **PASS** |

---

## 3. KHUYẾN NGHỊ KỸ THUẬT & TỐI ƯU HÓA CHO BACKEND DEV

Mặc dù tầng API hiện tại đã đạt chất lượng bàn giao cao, QA khuyến nghị 2 điểm cải tiến để tối ưu hóa trải nghiệm tải file lớn và nâng cao tính tuân thủ pháp lý:

1. **Bổ sung API cấp Presigned Upload URL cho File Video lớn (`FR-CNT-09`):**
   - *Hiện trạng:* Endpoint `POST /api/merchant/media` hiện tại nhận payload JSON chứa `videoUrl` đã có sẵn.
   - *Khuyến nghị:* Với các Merchant tải trực tiếp file video MP4 lớn (dung lượng từ 20MB đến 100MB), nên bổ sung endpoint `POST /api/merchant/media/upload-url` để sinh Presigned URL từ Supabase Storage bucket `merchant-media`. Điều này giúp client upload trực tiếp lên Storage mà không làm nghẽn Next.js API server.

2. **Lưu vết thời điểm cam kết bản quyền (`NFR-SEC-04`):**
   - *Khuyến nghị:* Trong `analysisMetadata` của `createMediaReferenceSchema`, nên định nghĩa thêm trường:
     ```ts
     complianceMetadata: z.object({
       copyrightConfirmed: z.boolean().default(true),
       confirmedAt: z.string().datetime().optional(),
       confirmedIp: z.string().optional(),
     }).optional()
     ```
     Điều này giúp lưu vết kiểm toán pháp lý (Audit Trail) khi có tranh chấp bản quyền xảy ra đối với video do Merchant đăng tải.
