# Hướng dẫn sử dụng và chia sẻ Funnel PostHog 5 bước

## Mục đích

Hướng dẫn thành viên BE3 truy cập, kiểm tra và chia sẻ dashboard funnel TravelLink AI mà không nhầm dữ liệu kiểm thử với dữ liệu production.

## Tài nguyên PostHog

- Project: `Default project` (project ID `676438`)
- Insight: [TravelLink AI — 5-step conversion funnel](https://us.posthog.com/project/676438/insights/QHWlWX1x)
- Dashboard: [TravelLink AI — 5-step conversion funnel](https://us.posthog.com/project/676438/dashboard/2238314)
- Biên bản hiện trạng: [posthog-funnel-acceptance.md](evidence/posthog-funnel-acceptance.md)

> Các đường dẫn insight/dashboard riêng yêu cầu đăng nhập PostHog và quyền vào project. Public link bên dưới là ngoại lệ: người có link có thể xem mà không cần đăng nhập.

## Truy cập dashboard bằng public link

Public dashboard link do người phụ trách cung cấp:

<https://us.posthog.com/shared/Iu7aXZFcQ3PClj-nyh-sDVOxc8RQ1A>

Thành viên có thể mở link này để xem dashboard mà không cần tài khoản PostHog hoặc lời mời vào project. Bất kỳ ai có link cũng có thể xem, vì vậy chỉ gửi trong kênh nội bộ và không đưa vào nơi công khai. Nếu không muốn tiếp tục cho truy cập qua link, người quản lý tắt **Share dashboard publicly** trong cửa sổ **Share** của dashboard.

## Cấu hình funnel cần giữ

| Bước | Event |
|---:|---|
| 1 | `affiliate_link_clicked` |
| 2 | `chat_opened` |
| 3 | `chat_message_sent` |
| 4 | `checkout_clicked` |
| 5 | `purchase_confirmed` |

- Thứ tự: **Sequential**.
- Breakdown: event property `campaign_id`.
- Attribution cho breakdown: **First touchpoint**.
- Conversion: so sánh tổng thể với bước 1.
- Giữ nguyên conversion window hiện có, trừ khi BA/Product owner yêu cầu thay đổi và ghi lại lý do.

PostHog đếm chuyển đổi theo người và các event mà project nhận được; vì thế cần kiểm tra khoảng thời gian, `distinct_id`, và property trước khi diễn giải tỷ lệ. Xem [tài liệu Funnels của PostHog](https://posthog.com/docs/product-analytics/funnels).

## Cách thành viên kiểm tra funnel

1. Đăng nhập PostHog bằng tài khoản đã được mời vào tổ chức/project.
2. Mở dashboard ở liên kết phía trên; kiểm tra đang ở đúng project.
3. Mở insight funnel và xác nhận năm event, thứ tự, breakdown và khoảng ngày.
4. Nếu một campaign chỉ có người ở bước 1, kiểm tra các event tiếp theo có cùng `distinct_id` và có `campaign_id` tương ứng không. Đây là hướng điều tra, chưa đủ để kết luận lỗi tracking.
5. Phân biệt dữ liệu thử nghiệm với production. `campaign-abc`, `test-campaign`, UUID hoặc campaign rỗng chỉ được xem là test khi đối chiếu được nguồn tạo event; UUID tự nó không chứng minh dữ liệu là test.
6. Không xóa event chỉ để làm biểu đồ gọn. Ghi rõ khoảng thời gian và nguồn dữ liệu khi báo cáo tỷ lệ.

## Chia sẻ riêng trong nhóm

1. Trên dashboard, bấm **Share**.
2. Nếu muốn mọi người trong nhóm mở dashboard không cần tài khoản PostHog, bật **Share dashboard publicly** và gửi public link ở phần trên trong kênh nội bộ.
3. Nếu dashboard chỉ dành cho thành viên đã đăng nhập, tắt **Share dashboard publicly**, mời họ vào PostHog project rồi gửi đường dẫn dashboard riêng.
4. Không gửi project token, API key, mật khẩu hoặc token invite trong tài liệu/kênh chung.

### Mời thành viên mới (dành cho owner/admin)

1. Tại trang Home của PostHog, bấm **Invite** hoặc **Invite team members**. Nếu nút không xuất hiện, mở **Settings → Organization → Members** (tên mục có thể khác nhẹ theo phiên bản giao diện).
2. Nhập email của thành viên và chọn vai trò phù hợp theo chính sách nhóm; chỉ cấp quyền quản trị cho người cần quản lý toàn tổ chức.
3. Gửi lời mời. Thành viên mở email mời, đăng nhập/tạo tài khoản PostHog và chấp nhận lời mời.
4. Yêu cầu thành viên mở đúng project `Default project`, sau đó kiểm tra họ vào được dashboard bằng liên kết riêng.

Lời mời thường cấp quyền ở cấp tổ chức/project, không phải riêng dashboard. Xác nhận vai trò/quyền được hiển thị trong giao diện trước khi gửi lời mời. PostHog mô tả lời mời từ trang Home và vai trò thành viên trong [hướng dẫn mời nhóm](https://posthog.com/tutorials/next-steps-after-installing).

### Giới hạn quyền sửa

Tài khoản hiện tại được báo cáo là Free; khi mở **Open access control**, giao diện chuyển sang Billing. Tài liệu PostHog ghi giới hạn quyền sửa dashboard theo từng thành viên yêu cầu **Platform package** ([Dashboard permissions](https://posthog.com/docs/product-analytics/dashboards)). Do đó, tắt public sharing chỉ ngăn truy cập bằng public link; việc này **không khóa riêng quyền sửa dashboard** của thành viên đã có quyền trong project.

Nếu chưa có tính năng này:

- Chỉ mời người thực sự cần truy cập project.
- Nếu nhóm chấp nhận public link, chỉ gửi ở kênh riêng cho đúng người cần xem; tắt public sharing khi không còn cần.
- Trước khi cấp quyền, kiểm tra vai trò thành viên trong phần quản lý tổ chức/project. Không mặc định rằng quyền xem dashboard đồng nghĩa quyền không thể sửa.
- Ghi trạng thái nghiệm thu là: **Funnel/dashboard đã cấu hình và chia sẻ nội bộ; quyền sửa riêng theo dashboard chưa được khóa do giới hạn gói hiện tại.**

## Tiêu chí nghiệm thu

- [ ] Đăng nhập được và mở đúng project/dashboard.
- [ ] Insight có đủ năm event theo đúng thứ tự.
- [ ] Breakdown `campaign_id` được bật; conversion window được ghi lại.
- [ ] Đã xác định event nào là test, event nào đến từ website production.
- [ ] **Share dashboard publicly** tắt nếu dashboard dùng nội bộ.
- [ ] Thành viên nhận link đã được mời/cấp quyền vào project.
- [ ] Ghi rõ nếu chưa thể giới hạn quyền sửa riêng theo dashboard.

## Tham khảo

- [PostHog Funnels](https://posthog.com/docs/product-analytics/funnels)
- [PostHog Dashboard sharing and edit access](https://posthog.com/docs/product-analytics/dashboards)
- [PostHog public sharing](https://posthog.com/docs/product-analytics/sharing-and-embedding-insights-and-dashboards)
