# Biên bản xác nhận: Thông báo khi có lượt click vào link

## Thông tin task

- **Mã task:** BE3-W3-01
- **Chức năng:** Gửi thông báo khi phát sinh lượt click hợp lệ vào link cộng tác viên
- **Kênh nhận thông báo:** Telegram, nhóm **AI Travel**
- **Kết quả:** Đạt theo minh chứng giao diện được cung cấp

## Minh chứng quan sát được

Ảnh chụp Telegram do người thực hiện cung cấp cho thấy bot **AI Travel Publisher** đã gửi thông báo click mới trong nhóm AI Travel. Nội dung thông báo hiển thị các thông tin:

- Reseller: `test-reseller`
- Campaign: `test-campaign`
- Product: `test-product`
- Mã link: `TEST123`
- Thời gian: `2026-10-20T10:00:00Z`
- Thiết bị: `mobile / Android`

Ảnh hiển thị thông báo vào ngày 20/10 và một thông báo tương tự vào ngày 21/10. Vì vậy, minh chứng xác nhận rằng thông báo click đã được gửi và có thể nhận trên Telegram, đồng thời các trường thông tin chính được đưa vào nội dung tin nhắn.

## Tiêu chí nghiệm thu

| Tiêu chí | Kết quả | Căn cứ |
|---|---|---|
| Có thông báo click mới trong nhóm Telegram | Đạt | Tin nhắn từ AI Travel Publisher hiển thị trong ảnh |
| Thông báo có thông tin reseller, campaign, product và mã link | Đạt | Các trường được hiển thị trong nội dung tin nhắn |
| Thông báo có thời gian và thiết bị | Đạt | Hiển thị thời gian UTC và `mobile / Android` |

## Kết luận

**Xác nhận hoàn thành phần nhận thông báo khi có lượt click vào link trên Telegram theo minh chứng giao diện hiện có.**

Ảnh xác nhận kết quả hiển thị ở Telegram; riêng việc kiểm tra cấu hình nội bộ của workflow, xử lý gửi trùng, thử lại khi Telegram lỗi và đối chiếu từng thông báo với một click duy nhất không thể kết luận chỉ từ ảnh này.

## Lưu trữ minh chứng

Ảnh chụp được người thực hiện gửi trong phiên trao đổi này. File ảnh chưa được sao chép vào repository; biên bản này ghi lại nội dung và kết quả nghiệm thu quan sát được.
