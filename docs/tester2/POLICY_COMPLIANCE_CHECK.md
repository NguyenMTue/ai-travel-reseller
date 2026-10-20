# Policy Compliance Check — Week 2

Guardrail được bổ sung để chuyển nội dung sang `NEEDS_REVIEW` khi xuất hiện các tuyên bố chưa có trong `verified_facts`:

- Miễn phí vé trẻ em.
- Hoàn tiền toàn bộ hoặc hoàn/hủy miễn phí.
- Bảo hiểm du lịch.
- Có sẵn xe đẩy hoặc hỗ trợ xe lăn.
- Ưu tiên người cao tuổi.
- Khan hiếm giả hoặc đe dọa phạt nếu không mua.

Kết quả: toàn bộ mẫu vi phạm trong bộ Tester2 bị chặn; một chính sách chỉ được cho qua khi cùng cụm thông tin đã có trong `verified_facts`. Bộ Tester2 đạt 17/17. Ma trận live đã chuyển đúng ba output có tuyên bố chưa xác minh sang `NEEDS_REVIEW`. Logic TypeScript và Python cần được BE3 đối chiếu lại trong workflow; TypeScript test/lint/typecheck PASS. Python syntax compile PASS và Python unit suite 9/9 PASS trong môi trường ảo tách biệt.
