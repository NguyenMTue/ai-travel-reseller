# AI Travel Reseller - LLM & Content Factory Service

Dịch vụ Python phục vụ tự động hóa nội dung du lịch cho Reseller:
1. **RAG Knowledge Base & Engine (`rag_engine.py`)**: Kho tri thức cẩm nang du lịch Đà Nẵng / Hội An (Bà Nà Hills, Cù Lao Chàm, Rừng dừa Bảy Mẫu).
2. **Groq AI Content Generator (`content_generator.py`)**: Sinh kịch bản, hooks, captions, hashtags bán tour với tốc độ cao qua Groq API.
3. **n8n Client & Google Sheets Review Queue (`n8n_client.py`)**: Kết nối workflow n8n để sinh bản nháp review lưu vào Google Sheets chờ duyệt.
4. **FastAPI RAG Service (`rag_api.py`)**: Cung cấp API tra cứu tri thức RAG cho n8n hoặc các service khác.
5. **TikTok Publishing & Scheduler (Thử nghiệm)**: Hỗ trợ tích hợp Content Posting API của TikTok và lập lịch đăng video tự động.


---

## 🚀 Hướng Dẫn Setup & Test n8n Workflow (AI Travel Review Draft)

Workflow này phục vụ tính năng **AI Content Factory (BE3)**:
- Tự động lấy thông tin sản phẩm đã xác thực từ **Supabase Local**.
- Gửi payload sang **n8n Webhook** ➔ gọi **Gemini AI** sinh bản nháp review du lịch tiếng Việt chuẩn xác (không bịa giá, có link đặt chỗ chính thức).
- Ghi bản nháp vào hàng chờ kiểm duyệt trên **Google Sheets** (`review_queue`).
- Lưu bản nháp vào bảng `contents` trên **Supabase Local** với trạng thái `pending_approval`.

### 1. Chuẩn bị môi trường (Prerequisites)

1. **Khởi động Supabase Local:**
   ```powershell
   npx supabase start
   ```
   *(Đảm bảo REST API chạy tại `http://127.0.0.1:54321` và Studio tại `http://127.0.0.1:54323`)*

2. **Khởi động n8n container:**
   ```powershell
   docker run -d --name n8n -p 5678:5678 -v n8n_data:/home/node/.n8n n8nio/n8n:latest
   ```
   *(Hoặc `docker start n8n` nếu container đã được tạo từ trước)*

3. **Quyền truy cập Google Sheet chung của dự án:**
   - Link sheet: [Google Sheet review_queue](https://docs.google.com/spreadsheets/d/1bKKdivQuJT7a1yTmot83Zb8ttDLhP5s_1-2UrhUiT94/edit?gid=0#gid=0)
   - Đảm bảo tài khoản Google của bạn đã được cấp quyền **Editor (Chỉnh sửa)** trên bảng tính này.

4. **Cấu hình file `.env`:**
   Sao chép `.env.example` thành `.env` nếu chưa có:
   ```powershell
   cd services/llm-service
   cp .env.example .env
   ```
   *(Kiểm tra các biến `SUPABASE_URL=http://127.0.0.1:54321`, `N8N_REVIEW_WEBHOOK_URL=http://127.0.0.1:5678/webhook/ai-travel-review`, `REVIEW_SHEET_URL=https://docs.google.com/spreadsheets/d/1bKKdivQuJT7a1yTmot83Zb8ttDLhP5s_1-2UrhUiT94/edit?gid=0#gid=0`)*

---

### 2. Thiết lập Workflow trên n8n (Chỉ làm 1 lần duy nhất)

1. Mở trình duyệt truy cập: [http://127.0.0.1:5678](http://127.0.0.1:5678).
2. Vào mục **Workflows** ➔ bấm menu ba chấm **`...`** (ở góc trên bên phải) ➔ chọn **Import from file**.
3. Chọn file **`workflow_ai_travel_review.json`** nằm trong thư mục `services/llm-service/`.
4. Sau khi import thành công, click đúp vào node **`Append to Google Sheets`**:
   - Ở mục **Credential to connect with**, chọn tài khoản Google của bạn (nếu chưa có thì bấm *Create new credential* ➔ *Sign in with Google* và cấp quyền).
5. Bật công tắc **Active** (ở góc trên bên phải của workflow) sang trạng thái **ON** (màu xanh lá).

> **Lưu ý quan trọng:** File `workflow_ai_travel_review.json` đã được nhúng sẵn API key Gemini, cấu hình sẵn đúng URL Google Sheet và map sẵn 9 cột dữ liệu (`review_queue`). Bạn không cần chỉnh sửa bất kỳ node nào khác!

---

### 3. Cách chạy Test

Bạn có thể test bằng 1 trong 2 cách sau:

#### Cách 1: Test tự động bằng Terminal (Nhanh nhất)
Mở PowerShell tại thư mục `services/llm-service` và chạy:
```powershell
python -m main --demo-n8n
```
Lệnh sẽ tự động chạy thông luồng 3 bước:
1. Đọc sản phẩm từ Supabase Local.
2. Bắn sang n8n tạo bản nháp review và ghi vào Google Sheets.
3. Lưu bản ghi vào bảng `contents` trên Supabase Local.

#### Cách 2: Test bằng Giao diện đồ họa (GUI Desktop)
Chạy lệnh khởi động giao diện:
```powershell
python gui.py
```
**Thao tác:**
1. Ở mục **Sản phẩm**, chọn một tour (vd: *Vé Cáp Treo Bà Nà Hills...*).
2. Bấm nút **`1. TẠO BẢN NHÁP QUA N8N`**: Chờ 3-5 giây, nội dung review AI sinh ra sẽ hiển thị trên khung xem trước.
3. Bấm nút **`2. MỞ GOOGLE SHEETS ĐỂ DUYỆT`**: Trình duyệt sẽ mở Google Sheet để bạn thấy dòng mới vừa được ghi.
4. Bấm nút **`3. LƯU VÀO SUPABASE (LOCAL)`**: Lưu bản nháp vào cơ sở dữ liệu Supabase Local.

---

### 4. Kiểm tra kết quả

- **Trên Google Sheets:** Mở tab **`review_queue`** trên [bảng tính Google Sheet](https://docs.google.com/spreadsheets/d/1bKKdivQuJT7a1yTmot83Zb8ttDLhP5s_1-2UrhUiT94/edit?gid=0#gid=0) để kiểm tra dòng dữ liệu mới.
- **Trên Supabase Local Studio:** Truy cập [http://127.0.0.1:54323](http://127.0.0.1:54323) ➔ **Table Editor** ➔ chọn bảng **`contents`** để kiểm tra bản ghi mới có `status = pending_approval`.

---

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
