# Persona Review Notes — Week 2

## Kết quả hiện tại

| Persona | Kiểm tra định nghĩa/prompt | Sinh mẫu Gemini trước đó | Đánh giá thủ công mẫu n8n |
|---|---|---|---|
| Local Guide | PASS | PASS theo báo cáo BE2 | PENDING |
| Family | PASS | PASS theo báo cáo BE2 | PENDING |
| Foodie | PASS | PASS theo báo cáo BE2 | PENDING |
| Budget Traveler | PASS | PASS theo báo cáo BE2 | PENDING |

Bộ test `T2-W2-02` xác nhận bốn persona có bốn giọng riêng và mỗi persona có ba ưu tiên an toàn. Báo cáo BE2 hiện có bằng chứng 4/4 lượt Gemini parse/guardrail PASS, nhưng repo chưa lưu payload đầu ra và chưa có execution n8n để Tester2 chấm định tính theo rubric.

## Tiêu chí nghiệm thu còn lại

- Lấy tối thiểu một output live cho mỗi persona từ workflow n8n.
- Chấm từng output theo rubric 100 điểm; yêu cầu tối thiểu 80 và không có lỗi nghiêm trọng.
- Ghi execution ID, model, campaign/product ID và thời điểm chạy để truy vết.
