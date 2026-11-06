# Biên bản xác nhận: PostHog Analytics Funnel 5 bước

## Thông tin nghiệm thu

- **Task:** BE3-W3-02 — Tích hợp PostHog Analytics Dashboard & Phễu chuyển đổi 5 bước
- **Insight:** `TravelLink AI — 5-step conversion funnel`
- **Khoảng thời gian trên ảnh:** 30 ngày gần nhất
- **Kết quả:** Funnel đã được tạo và đang hiển thị dữ liệu event trong PostHog

## Kết quả quan sát trên ảnh

| Bước | Event | Số người đi tiếp | Tỷ lệ hiển thị |
|---:|---|---:|---:|
| 1 | `affiliate_link_clicked` | 3 người bắt đầu | 100% |
| 2 | `chat_opened` | 1 người | 33,33% |
| 3 | `chat_message_sent` | 1 người | 33,33% |
| 4 | `checkout_clicked` | 1 người | 33,33% |
| 5 | `purchase_confirmed` | 1 người | 33,33% |

- **Tổng conversion rate:** 33,33%
- **Thời gian trung vị để chuyển đổi:** 35 giây
- **Thứ tự funnel:** trái sang phải

## Tiêu chí xác nhận

| Tiêu chí | Kết quả | Minh chứng |
|---|---|---|
| Funnel có đủ năm event theo đúng thứ tự | Đạt | Biểu đồ hiển thị đủ các bước 1–5 |
| PostHog tính được số người qua từng bước | Đạt | 3 người ở bước 1; 1 người qua các bước 2–5 |
| Insight hiển thị tỷ lệ và thời gian chuyển đổi | Đạt | 33,33% và median 35s trên ảnh |
| Có breakdown theo `campaign_id` | Chưa xác nhận từ ảnh này | Ảnh không hiển thị bảng breakdown |
| Nguồn event là hành trình người dùng production | Chưa xác nhận từ ảnh này | Ảnh chỉ thể hiện kết quả funnel, không thể hiện nguồn từng event |

## Ghi chú cần đối chiếu

Mô tả bên dưới tiêu đề insight ghi rằng các bước 1, 4 và 5 chưa nhận event, trong khi biểu đồ cùng ảnh lại hiển thị dữ liệu ở cả bước 1, 4 và 5. Cần cập nhật mô tả insight hoặc xác nhận lại nguồn dữ liệu để tránh gây nhầm lẫn khi nghiệm thu.

Người thực hiện cũng báo cáo execution workflow Click trên n8n đã `Succeeded` và cả hai node gửi Telegram/HTTP Request đều thành công. Thông tin này được ghi nhận theo báo cáo; ảnh execution n8n chưa được đính kèm trong biên bản này.

## Kết luận

**Đạt phần cấu hình và hiển thị funnel PostHog 5 bước theo minh chứng giao diện hiện có.** Tỷ lệ 33,33% là số liệu trong khoảng thời gian và dữ liệu đang chọn trên ảnh; không đại diện mặc định cho conversion rate của toàn bộ người dùng thực tế.

Để nghiệm thu end-to-end đầy đủ, lưu thêm ảnh execution n8n và xác nhận event click cùng event mua hàng thực tế dùng đúng `distinct_id` và `campaign_id` xuyên suốt hành trình.

## Minh chứng

Ảnh funnel PostHog do người thực hiện cung cấp trong phiên nghiệm thu ngày 22/10/2026. File ảnh chưa được sao chép vào repository.
