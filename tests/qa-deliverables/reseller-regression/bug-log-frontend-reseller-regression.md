# Bug Log — Frontend Reseller Regression

## Kết quả

**Không phát hiện lỗi hồi quy (0 Open Bugs) trên phạm vi đã triển khai** và được xác minh bằng `reseller-regression-evidence.spec.ts` (6/6 PASS): form đăng ký cơ bản, Campaign Feed/tìm kiếm, trang chi tiết/Content Kit, tracking modal/link/QR, phản hồi copy link và copy caption.

Hai mươi hai assertion FAIL từ các bộ test cũ được ghi nhận trong [báo cáo Regression](./regression-test-report-reseller.md), nhưng không được tạo bug vì đang kiểm tra các màn hình/tính năng ngoài sprint scope hoặc kỳ vọng vượt quá hành vi hiện tại. Không chỉnh sửa các test cũ theo guardrail task.

## Giới hạn xác minh

Ảnh và bộ test mới dùng fixture local tại `/preview/reseller`, không đại diện cho dữ liệu thật. Voucher, trang profile, tài khoản MXH, khai báo bài đăng, canned responses và dashboard chưa có UI tương ứng; các mục này được theo dõi là ngoài phạm vi hiện tại, không phải bug.
