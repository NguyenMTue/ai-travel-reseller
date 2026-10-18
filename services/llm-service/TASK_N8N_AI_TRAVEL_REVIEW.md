# TASK: Xây dựng workflow AI tạo bản nháp review du lịch và lưu Google Sheets

## 1. Thông tin task

- **Dự án:** AI Travel Reseller Network Platform
- **Hạng mục:** Tự động hóa tạo nội dung review trước khi đăng mạng xã hội
- **Công cụ:** n8n Self Hosted, Google Gemini API, Google Sheets
- **Trạng thái:** READY FOR REVIEW (Prototype)
- **Ngày hoàn thành prototype:** 08/10/2026

## 2. Mục tiêu

Xây dựng một workflow n8n nhận dữ liệu sản phẩm du lịch đã được merchant xác nhận, dùng AI tạo bản nháp review tiếng Việt, sau đó lưu kết quả vào Google Sheets để con người kiểm duyệt.

Workflow không tự động đăng nội dung lên mạng xã hội trong giai đoạn thử nghiệm.

## 3. Phạm vi đã thực hiện

### 3.1. Form nhập dữ liệu

Đã tạo Form Trigger trong n8n với các trường:

- `merchant_name`
- `product_name`
- `location`
- `verified_facts`
- `confirmed_price_offer`
- `target_audience`
- `official_booking_url`

### 3.2. Tạo nội dung bằng AI

Đã kết nối Google Gemini API qua node HTTP Request. Prompt yêu cầu:

- Chỉ dùng dữ liệu đã xác nhận.
- Không tự tạo giá, ưu đãi, địa điểm, giờ mở cửa hoặc chính sách.
- Không viết trải nghiệm cá nhân hoặc đánh giá giả.
- Không tạo thông tin khan hiếm giả.
- Dẫn khách hàng tới link đặt chỗ chính thức.
- Ghi rõ đây là bản nháp cần con người duyệt.

Đã bật cơ chế thử lại khi dịch vụ AI tạm thời quá tải:

- Retry on fail: bật
- Số lần thử tối đa: 5
- Thời gian chờ giữa các lần thử: 10 giây

### 3.3. Chuẩn hóa kết quả

Đã dùng node Edit Fields để lấy phần văn bản do AI tạo từ phản hồi của Gemini và lưu vào trường:

- `review_draft`

Kết quả gồm các phần:

- Tiêu đề
- Bản review
- CTA
- Link đặt chỗ chính thức
- Ghi chú kiểm duyệt

### 3.4. Lưu hàng đợi kiểm duyệt

Đã kết nối Google Sheets và thêm một dòng mới cho mỗi lần form được gửi. Sheet thử nghiệm có các cột:

- `created_at`
- `merchant_name`
- `product_name`
- `location`
- `review_draft`
- `status`
- `model`
- `interaction_id`
- `official_booking_url`

Giá trị trạng thái ban đầu là `NEEDS_REVIEW` để ngăn nội dung được hiểu là đã duyệt hoặc đã xuất bản.

## 4. Sơ đồ workflow

```text
Form Trigger
    ↓
HTTP Request - Google Gemini API
    ↓
Edit Fields - Trích xuất review_draft và metadata
    ↓
Google Sheets - Append Row
```

## 5. Kết quả kiểm thử đã ghi nhận

### Dữ liệu mẫu

- Merchant: ABC Theme Park
- Sản phẩm: Vé vui chơi cuối tuần
- Địa điểm: Đà Nẵng
- Giá đã xác nhận: 299.000 VND cho vé người lớn
- Link chính thức: `https://example.com/booking`

### Kết quả

- Form gửi dữ liệu thành công.
- Gemini trả về trạng thái `completed`.
- Phản hồi mẫu sử dụng 858 token, gồm 624 input token và 234 output token.
- Node Edit Fields trích xuất được `review_draft`.
- Google Sheets nhận được một dòng dữ liệu mới.
- Nội dung được đặt ở trạng thái `NEEDS_REVIEW`.

## 6. Lỗi đã xử lý trong quá trình thực hiện

1. Model `gemini-2.5-flash` không còn phục vụ người dùng mới.
2. Model `gemini-3.8-flash` có lúc trả về lỗi 503 do nhu cầu cao.
3. Đã chuyển sang model khả dụng và bật retry để giảm lỗi tạm thời.
4. Node Gemini cũ được loại khỏi luồng chạy chính để tránh hai nhánh AI chạy song song và làm workflow thất bại.

## 7. Tiêu chí nghiệm thu prototype

- [x] Nhận dữ liệu sản phẩm qua form.
- [x] Tạo được bản nháp review bằng AI.
- [x] Có quy tắc hạn chế AI bịa thông tin.
- [x] Trích xuất được nội dung AI thành trường riêng.
- [x] Lưu kết quả vào Google Sheets.
- [x] Đặt trạng thái chờ con người kiểm duyệt.
- [x] Chưa tự động đăng mạng xã hội.
- [ ] Export workflow n8n thành file JSON và lưu trong repository.
- [ ] Kiểm thử lại prompt với nhiều bộ dữ liệu để phát hiện nội dung suy diễn.
- [ ] Xây dựng bước Approve/Reject và ghi nhận phản hồi người duyệt.
- [ ] Tạo nhiều biến thể nội dung cho cùng một sản phẩm.
- [ ] Kết nối đăng mạng xã hội sau khi quy trình kiểm duyệt ổn định.

## 8. Giới hạn hiện tại

- Google Sheets đang là hàng đợi kiểm duyệt và kho kết quả; Gemini không tự học từ các dòng dữ liệu trong Sheet.
- Workflow chưa có file JSON trong repository nên chưa thể cài lại bằng thao tác Import.
- Một kết quả thử nghiệm từng thêm cụm từ chưa được dữ liệu đầu vào xác nhận. Cần tiếp tục siết prompt và kiểm thử hồi quy trước khi dùng cho nội dung thật.
- Chưa có bước phê duyệt tự động, attribution, booking hoặc commission.
- Chưa triển khai tự động đăng Facebook, TikTok hoặc nền tảng mạng xã hội khác trong workflow n8n.

## 9. Kết luận

Prototype đã chứng minh được luồng chính: nhận dữ liệu đã xác nhận, tạo bản nháp review bằng AI, chuẩn hóa đầu ra và đưa vào Google Sheets để kiểm duyệt. Hạng mục phù hợp để demo và nộp bài ở mức proof of concept. Trước khi triển khai thật, cần lưu file workflow JSON, bổ sung quy trình duyệt và kiểm thử an toàn nội dung với nhiều trường hợp.
