# Persona Review Notes — Week 2

## Kết quả hiện tại

| Persona | Kiểm tra định nghĩa/prompt | Sinh mẫu Gemini trước đó | Đánh giá thủ công mẫu n8n |
|---|---|---|---|
| Local Guide | PASS | 1 APPROVED, 1 NEEDS_REVIEW | PENDING n8n |
| Family | PASS | 2/2 APPROVED | PENDING n8n |
| Foodie | PASS | 0 APPROVED, 2 NEEDS_REVIEW | PENDING n8n |
| Budget Traveler | PASS | 2/2 APPROVED | PENDING n8n |

Bộ test `T2-W2-02` xác nhận bốn persona có bốn giọng riêng và mỗi persona có ba ưu tiên an toàn. Repo hiện lưu đủ tám output Gemini trực tiếp và bảng chấm rubric tại `LIVE_MODEL_REVIEW_W2.md`. Ba output bị chuyển `NEEDS_REVIEW` vì tuyên bố chưa xác minh. Phần chấm output n8n vẫn chờ BE3.

## Tiêu chí nghiệm thu còn lại

- Lấy tối thiểu một output live cho mỗi persona từ workflow n8n.
- Chấm từng output theo rubric 100 điểm; yêu cầu tối thiểu 80 và không có lỗi nghiêm trọng.
- Ghi execution ID, model, campaign/product ID và thời điểm chạy để truy vết.
