# AI Content Benchmark Report — Week 2

**Ngày:** 16/10/2026
**Phạm vi:** Content Factory schema, persona, groundedness, policy và prompt-injection guardrails

## Tổng quan

| Hạng mục | Kết quả | Trạng thái |
|---|---:|---|
| Tester2 deterministic suite | 13/13 PASS | DONE |
| BE2 regression suite | 17/17 PASS | DONE |
| TypeScript typecheck | PASS | DONE |
| ESLint phạm vi thay đổi | PASS | DONE |
| Python syntax compile | PASS | DONE |
| Python unit suite | Không chạy: thiếu `fastapi` | ENV BLOCKED |
| n8n live output acceptance | Chưa có workflow export/execution evidence | BLOCKED |

## Phát hiện và sửa lỗi

1. Kế hoạch Tester2 dùng giá cũ. Nguồn chuẩn được chốt theo seed: Bà Nà `1.250.000/1.150.000đ`, VinWonders `600.000/510.000đ`.
2. Guardrail cũ chưa bắt các tuyên bố về vé trẻ em, hoàn/hủy, bảo hiểm, xe đẩy/xe lăn và khan hiếm giả. Đã bổ sung rule cho cả TypeScript và Python.
3. Fixture VinWonders `550.000đ` trong test/live test đã được sửa về `510.000đ`.

## Kết luận

Contract, parser và guardrail deterministic đủ điều kiện `PASS`. Chưa đủ bằng chứng để ký nghiệm thu toàn bộ AI Content Factory: cần BE3 cung cấp workflow export cùng execution live cho hai sản phẩm và bốn persona, sau đó Tester2 chấm rubric và quét bản ghi `contents`.

## Điều kiện đóng sprint

- Workflow n8n import/chạy thành công với schema provider-compatible.
- Có 8 mẫu live: 2 sản phẩm × 4 persona, kèm execution ID.
- 100% mẫu không sai giá/ưu đãi/chính sách; từng mẫu đạt rubric tối thiểu 80/100.
- Bản ghi Supabase có trạng thái do guardrail server tính, không do model tự cấp.
