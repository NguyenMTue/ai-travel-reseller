# Groundedness Report — Week 2

## Nguồn sự thật

Đối chiếu trực tiếp với `supabase/seed.sql`, không dùng giá cũ trong kế hoạch Tester2.

| Sản phẩm | Giá gốc | Giá bán | Dữ kiện được phép |
|---|---:|---:|---|
| Bà Nà Hills + Buffet | 1.250.000đ | 1.150.000đ | Vé vào cổng, cáp treo khứ hồi, Cầu Vàng, Làng Pháp, buffet hơn 100 món |
| VinWonders Nam Hội An | 600.000đ | 510.000đ | River Safari, công viên nước, đảo dân gian, show 3D Mapping |

## Kết quả deterministic

- Giá hợp lệ được chấp nhận; giá `900.000đ` bị gắn `PRICE_MISMATCH`.
- `GIAM50`, `SALE20`, `FREEVIP` không được xác nhận bị gắn `UNCONFIRMED_PROMO_CODE`.
- Giá fixture VinWonders trong test được sửa từ `550.000đ` về `510.000đ` để khớp seed.
- Bộ Tester2: 17/17 PASS; bộ hồi quy BE2: 19/19 PASS.
- Ma trận Gemini trực tiếp 2 sản phẩm × 4 persona: 5/8 `APPROVED`, 3/8 `NEEDS_REVIEW`.
- Ba lỗi live bị bắt: một CTA “nhận ưu đãi” chưa xác nhận và hai mô tả “không gian rộng lớn” ngoài dữ liệu merchant.

## Phạm vi chưa được chứng minh

Chưa thể tuyên bố toàn bộ bảng `contents` đạt groundedness 100% vì chưa có evidence execution live n8n → Gemini → Supabase và chưa quét dữ liệu production/shared Supabase. Kết luận hiện tại áp dụng cho contract, fixture, guardrail deterministic và tám output Gemini trực tiếp đã lưu trong repo.
