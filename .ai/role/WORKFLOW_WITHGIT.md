# QUY TRÌNH LÀM VIỆC GIT VÀ QUẢN LÝ NHÁNH (GIT WORKFLOW)

Tài liệu này quy định cách thức 9 thành viên trong đội ngũ phối hợp làm việc trên Git/GitHub. Dự án áp dụng mô hình **Gitflow rút gọn (GitHub Flow + Staging)**, thiết lập môi trường an toàn để tích hợp và kiểm thử trước khi đưa lên Production.

---

## 1. MÔ HÌNH QUẢN LÝ NHÁNH CHÍNH (CORE BRANCHES)

Hệ thống duy trì 2 nhánh cố định chạy xuyên suốt vòng đời dự án:

* **`main` (Production):** Nhánh chứa mã nguồn chạy trên môi trường thật (Live/Production trên Vercel). Code ở đây phải là bản ổn định nhất và đã được PM nghiệm thu. **TUYỆT ĐỐI KHÔNG ai được commit/push trực tiếp vào nhánh này.**
* **`dev` (Staging/Integration):** Nhánh phát triển và tích hợp chính, được sinh ra từ `main`. Mọi tính năng mới đều được gom về đây để chạy thông luồng E2E. Đội QA (Tester 1, 2, 3) sẽ thực hiện kiểm thử toàn diện trên nhánh này.

---

## 2. CÁC NHÁNH LÀM VIỆC TẠM THỜI (TEMPORARY BRANCHES)

Đây là các nhánh vòng đời ngắn, do các dev tự tạo để làm việc hàng ngày và sẽ bị xóa sau khi hoàn thành.

### 2.1. Nhánh Tính năng (`Feature_...`)
* **Mục đích:** Xây dựng tính năng mới hoặc thay đổi cấu trúc hệ thống.
* **Quy tắc:** Bắt buộc tách ra từ `dev` và gộp (merge) ngược trở lại vào `dev`.
* **Cú pháp:** `Feature_[VaiTrò/MãTask]_[Mô_tả_ngắn]` (VD: `Feature_BE1_Init_DB`, `Feature_FE_Merchant_UI`).

### 2.2. Nhánh Sửa lỗi (`Bugfix_...` hoặc `Fix_...`)
* **Mục đích:** Sửa các lỗi (bugs) do nhóm QA hoặc dev phát hiện trong quá trình kiểm thử trên nhánh `dev` chưa phát hành.
* **Quy tắc:** Bắt buộc tách ra từ `dev` và gộp ngược trở lại vào `dev`.
* **Cú pháp:** `Bugfix_[VaiTrò]_[Mô_tả_lỗi]` (VD: `Bugfix_BE2_RAG_Hallucination`, `Fix_UI_Feed_Overflow`).

### 2.3. Nhánh Cứu hộ khẩn cấp (`Hotfix_...`)
* **Mục đích:** Vá các lỗi cực kỳ nghiêm trọng (Critical) đang xảy ra trực tiếp trên Production (nhánh `main`) mà không thể chờ đến lịch phát hành tiếp theo.
* **Quy tắc:** Bắt buộc tách ra từ `main`. Sau khi sửa xong, **phải tạo 2 Pull Request để gộp vào CẢ `main` VÀ `dev`** (để tránh lỗi bị ghi đè lại trong tương lai).
* **Cú pháp:** `Hotfix_[Mô_tả_lỗi_ngắn]` (VD: `Hotfix_Commission_Calculation_Error`).

### 2.4. Nhánh Đóng gói Phát hành (`Release_...`) *(Tùy chọn cho Tuần 4)*
* **Mục đích:** Đóng băng code mới để QA tập trung test hồi quy (Regression Test) chuẩn bị đưa lên Production.
* **Quy tắc:** Tách ra từ `dev`. Chỉ được phép tạo nhánh `Fix_...` từ đây để sửa lỗi, KHÔNG thêm tính năng mới. Khi PM nghiệm thu, gộp vào `main` và gộp lại vào `dev`.
* **Cú pháp:** `Release_[Phiên_bản/Tuần]` (VD: `Release_Week_1_Foundation`, `Release_MVP_v1`).

---

## 3. QUY TRÌNH LÀM VIỆC HÀNG NGÀY (DAILY WORKFLOW)

### Bước 1: Đồng bộ nhánh `dev`
Luôn đảm bảo lấy code mới nhất trước khi làm việc:
```bash
git checkout dev
git pull origin dev
```

### Bước 2: Tạo nhánh làm việc
Xác định loại công việc (Feature hay Bugfix) và tạo nhánh từ `dev`:
```bash
git checkout -b Feature_BE3_n8n_Automation
# hoặc
git checkout -b Bugfix_FE_Chatbot_UI
```

### Bước 3: Lập trình và Commit
Cú pháp Commit Message khuyến nghị: `[Loại]: Mô tả`
* *VD:* `feat: Cấu hình RLS policies cho bảng merchants`
* *VD:* `fix: Cập nhật biến môi trường Supabase UI`

### Bước 4: Đẩy code và Tạo Pull Request (PR)
```bash
git push origin Feature_BE3_n8n_Automation
```
Lên GitHub tạo PR trỏ vào nhánh **`dev`** (kiểm tra kỹ, không trỏ nhầm vào `main`).

### Bước 5: Review & Merge
1. Các thành viên review code lẫn nhau.
2. QA/Tester sử dụng Vercel Preview URL của PR để kiểm thử.
3. Chấp thuận (Approve), gộp vào `dev` và **xóa nhánh tạm** để giữ GitHub sạch sẽ.

---

## 4. LƯU Ý ĐẶC THÙ CỦA DỰ ÁN MVP

1. **Tuân thủ Dependency:** BE2, BE3 và FE không được đẩy code lên `dev` nếu task gốc của BE1 (Database Schema) chưa được gộp vào `dev`.
2. **Cơ sở dữ liệu:** Mọi thay đổi về cấu trúc Supabase (Table, RLS) phải được xuất thành file `.sql` đặt trong thư mục `supabase/migrations/`.
3. **Môi trường Test:** QA ưu tiên test trên Vercel URL sinh ra từ nhánh `dev`. Tránh test trên môi trường Local của dev nếu không cần thiết.