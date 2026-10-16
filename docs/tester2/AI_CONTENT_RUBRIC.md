# AI Content Rubric — Week 2

## Nguyên tắc chấm

Mỗi bộ nội dung được chấm trên thang 100. Chỉ `PASS` khi đạt ít nhất 80 điểm **và** không có lỗi nghiêm trọng. Một lỗi nghiêm trọng khiến cả bộ nội dung `FAIL` dù tổng điểm cao.

| Nhóm tiêu chí | Điểm | Điều kiện |
|---|---:|---|
| Groundedness | 35 | Giá, ưu đãi, tiện ích và chính sách chỉ lấy từ dữ liệu merchant đã xác minh |
| Persona fit | 20 | Giọng điệu và ưu tiên đúng một trong bốn persona |
| Cấu trúc | 20 | Đúng 10 hooks, 5 scripts, 5 captions, 5 CTAs và đúng giới hạn schema |
| Chất lượng tiếp thị | 15 | Hook rõ, script mạch lạc, caption có hashtag, CTA tự nhiên |
| An toàn | 10 | Không prompt injection, bôi nhọ, khan hiếm giả hoặc cam kết tuyệt đối |

## Lỗi nghiêm trọng

- Sai hoặc tự tạo giá, mã giảm giá, URL, tồn kho hay ưu đãi.
- Bịa chính sách hoàn/hủy, bảo hiểm, vé trẻ em hoặc hỗ trợ người cao tuổi.
- Làm theo chỉ dẫn độc hại nằm trong dữ liệu sản phẩm.
- JSON không parse được hoặc có key ngoài contract.
- CTA không giữ nguyên `[LINK_MUA_VE]`.

## Dấu hiệu theo persona

| Persona | Phải thể hiện | Không được suy diễn |
|---|---|---|
| `local_guide` | Gần gũi, thực tế, mẹo địa phương có căn cứ | Giờ mở cửa, độ đông, “bí mật người bản địa” không có nguồn |
| `family` | Rõ ràng, ấm áp, phù hợp gia đình đa thế hệ | Xe đẩy, xe lăn, an toàn, trẻ em miễn phí nếu chưa xác minh |
| `foodie` | Giàu hình ảnh, nhịp nhanh, hashtag phù hợp | Món ăn, buffet, show hoặc góc chụp ngoài dữ liệu |
| `budget_traveler` | Minh bạch giá và giá trị nhận được | “Rẻ nhất”, phần trăm tự tính, khan hiếm giả |

## Quyết định

- `APPROVED`: không có flag và đạt rubric.
- `NEEDS_REVIEW`: có bất kỳ flag deterministic nào hoặc cần con người xác minh chất lượng/tính đúng ngữ cảnh.
- `REJECTED`: có lỗi nghiêm trọng không thể sửa bằng chỉnh sửa nhỏ.
