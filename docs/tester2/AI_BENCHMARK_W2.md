# AI Content Benchmark Report — Week 2

**Ngày:** 16/10/2026
**Phạm vi:** Content Factory schema, persona, groundedness, policy và prompt-injection guardrails

## Tổng quan

| Hạng mục | Kết quả | Trạng thái |
|---|---:|---|
| Tester2 deterministic suite | 17/17 PASS | DONE |
| BE2 regression suite | 19/19 PASS | DONE |
| Direct Gemini matrix | 5/8 APPROVED; 3/8 NEEDS_REVIEW | DONE — lỗi đã được chặn |
| Direct Gemini prompt injection | 1/1 PASS | DONE |
| TypeScript typecheck | PASS | DONE |
| ESLint phạm vi thay đổi | PASS | DONE |
| Python syntax compile | PASS | DONE |
| Python unit suite | 9/9 PASS trong môi trường ảo tách biệt | DONE |
| n8n live output acceptance | Chưa có workflow export/execution evidence | BLOCKED |

## Phát hiện và sửa lỗi

1. Kế hoạch Tester2 dùng giá cũ. Nguồn chuẩn được chốt theo seed: Bà Nà `1.250.000/1.150.000đ`, VinWonders `600.000/510.000đ`.
2. Guardrail cũ chưa bắt các tuyên bố về vé trẻ em, hoàn/hủy, bảo hiểm, xe đẩy/xe lăn và khan hiếm giả. Đã bổ sung rule cho cả TypeScript và Python.
3. Fixture VinWonders `550.000đ` trong test/live test đã được sửa về `510.000đ`.
4. Live review phát hiện guardrail cũ bỏ lọt các cụm “không phải xếp hàng”, “giá ưu đãi mới nhất”, “hot nhất” và “không gian rộng lớn”. Prompt, guardrail và regression tests đã được tăng cường.
5. Sau bản sửa, ma trận 2 sản phẩm × 4 persona cho 5 `APPROVED` và 3 `NEEDS_REVIEW`; ba output rủi ro không còn bị ghi nhận nhầm là an toàn.

## Kết luận

Contract, parser, guardrail deterministic và kiểm thử prompt injection trực tiếp đủ điều kiện `PASS`. Tám output Gemini trực tiếp đã được chấm rubric trong `LIVE_MODEL_REVIEW_W2.md`. Chưa đủ bằng chứng để ký nghiệm thu toàn bộ AI Content Factory: cần BE3 cung cấp workflow export cùng execution n8n cho cùng ma trận và bản ghi `contents`.

## Điều kiện đóng sprint

- Workflow n8n import/chạy thành công với schema provider-compatible.
- Có 8 mẫu live: 2 sản phẩm × 4 persona, kèm execution ID.
- 100% mẫu không sai giá/ưu đãi/chính sách; từng mẫu đạt rubric tối thiểu 80/100.
- Bản ghi Supabase có trạng thái do guardrail server tính, không do model tự cấp.
