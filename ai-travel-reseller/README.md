# AI Travel Reseller

## Web thử nghiệm TikTok trên Vercel

Web đăng bài nằm riêng trong `web/`, dùng OAuth phía server và giao diện xem trước/chỉnh nội dung trước khi gửi video. Dự án hiện chưa dùng n8n; lịch Python cũ và web Vercel là hai luồng riêng.

Xem [web/README.md](web/README.md) để đặt Root Directory là `web`, cấu hình các biến môi trường trong Vercel và đăng ký callback URL HTTPS với TikTok Developer.

## TikTok: thư viện video và lịch đăng hằng ngày

Ứng dụng dùng video có sẵn trong thư viện riêng, tạo caption theo tour, rồi gửi video lên TikTok theo lịch. Video cần do bạn sở hữu hoặc bạn có quyền sử dụng. Ứng dụng không tải lại video của người khác trên TikTok.

### 1. Chuẩn bị TikTok Developer

1. Tạo ứng dụng tại [TikTok for Developers](https://developers.tiktok.com/).
2. Thêm Login Kit và Content Posting API; xin scope `video.publish`.
3. Cấu hình một OAuth redirect URI HTTPS trong Login Kit và dùng đúng URI đó ở `TIKTOK_REDIRECT_URI` trong `.env`.
4. Điền `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI` vào `.env` ở thư mục gốc.
5. Chạy `python main.py --tiktok-auth-start`, mở liên kết hiện ra, đăng nhập TikTok và cấp quyền `video.publish`.
6. Sau khi TikTok chuyển về callback, sao chép toàn bộ URL trên thanh địa chỉ. Chạy `python main.py --tiktok-auth-finish` rồi dán URL đó. Dự án đổi OAuth code lấy access/refresh token và tự lưu vào `.env`.

Client Secret và refresh token là bí mật: giữ trong `.env`, không gửi qua chat, không commit Git. Ứng dụng tự làm mới token và ghi token mới trở lại `.env`.

TikTok giới hạn bài của ứng dụng chưa được duyệt ở chế độ riêng tư. Muốn đăng công khai, ứng dụng Content Posting API phải vượt qua quy trình audit của TikTok. TikTok cũng không chấp nhận ứng dụng chỉ dùng nội bộ để đăng lên các tài khoản do chính nhóm quản lý; hãy kiểm tra điều kiện Developer trước khi đầu tư triển khai đầy đủ.

### 2. Chép video vào thư viện

Chép video của bạn vào:

```text
media/tiktok/
```

Định dạng nhận: MP4, MOV, WebM. Mỗi ngày ứng dụng chọn ngẫu nhiên một video; nếu có nhiều video, ứng dụng tránh chọn lại video của ngày liền trước. Các tệp video được bỏ qua khỏi Git.

### 3. Thiết lập lịch mỗi ngày

Mở PowerShell tại thư mục dự án và chạy:

```powershell
python main.py --tiktok-schedule-daily 19:30 --tiktok-tour "Bà Nà Hills"
```

Thay `19:30` bằng giờ mong muốn theo múi giờ Việt Nam và thay tên tour tùy ý. Lệnh sẽ hỏi bạn chọn quyền riêng tư và có cho phép bình luận/Duet/Stitch hay không. Tệp lịch được lưu cục bộ trong `data/tiktok_daily_schedule.json`.

### 4. Chạy bộ hẹn giờ

```powershell
python main.py --tiktok-worker
```

Giữ cửa sổ này chạy, máy tính bật và không ở chế độ ngủ. Bộ hẹn giờ kiểm tra lịch định kỳ và thử đăng một lần mỗi ngày. Đóng cửa sổ sẽ dừng tự động đăng; để chạy liên tục khi không dùng máy cá nhân, cần chuyển worker lên máy chủ luôn hoạt động.

### 5. Thông tin cấu hình TikTok

Trong `.env`:

```text
TIKTOK_CLIENT_KEY=Client_Key_từ_TikTok_Developer
TIKTOK_CLIENT_SECRET=Client_Secret_từ_TikTok_Developer
TIKTOK_REDIRECT_URI=https://your-domain.example/tiktok/callback
```

Access/Refresh Token được lưu tự động vào `.env` sau bước OAuth ở trên. Luồng đăng yêu cầu quyền `video.publish`, token hợp lệ, Content Posting API đã được bật và người dùng TikTok đã cấp quyền. Nếu TikTok chưa duyệt ứng dụng, API có thể chỉ cho phép bài ở chế độ `SELF_ONLY`.
