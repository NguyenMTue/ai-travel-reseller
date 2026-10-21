# BE2 Week 3 — Offline Video Safety Benchmark

## Phạm vi

Báo cáo này chỉ bao phủ validation xác định được bằng code. Không phải bằng chứng Gemini đã phân tích video thật hoặc tạo output live.

## Kết quả

| Nhóm kiểm tra | Kết quả |
|---|---|
| Hook phải nằm trong 3 giây đầu | PASS |
| Scene index và timeline liên tục | PASS |
| Video script đúng định dạng 9:16, 15–60 giây | PASS |
| CTA chỉ dùng `[LINK_MUA_VE]` | PASS |
| Prompt injection nằm trong metadata/reference không đi vào system prompt | PASS |
| Fact reference không tồn tại bị chặn | PASS |
| Giá ngoài dữ liệu xác minh bị chặn | PASS |
| Promo code tự sinh bị chặn | PASS |
| Claim khan hiếm giả bị chặn | PASS |
| Schema JSON bàn giao đồng bộ với Zod | PASS |

## Tiêu chí nghiệm thu live còn lại

1. Gemini đọc được ít nhất ba video 9:16 đại diện cho ba phong cách khác nhau.
2. Timeline quan sát sai lệch không quá một giây so với video mẫu.
3. Không mô tả vật thể, lời thoại hoặc địa điểm không xuất hiện trong video.
4. Script sinh ra vượt qua cùng guardrail deterministic ở chế độ offline.
5. Không có request burst; concurrency bằng 1 và dừng ngay khi nhận 429.

Trạng thái cuối: **OFFLINE PASS — LIVE PENDING**.
