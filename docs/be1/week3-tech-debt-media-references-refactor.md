# BÁO CÁO NỢ KỸ THUẬT & KẾ HOẠCH TỐI ƯU CẤU TRÚC BẢNG `media_references`
**Phân hệ:** Backend 1 (BE1) — Commerce, Media Library & AI Video Generation Engine  
**Dự án:** AI Travel Reseller MVP (TravelLink AI)  
**Sprint:** Tuần 3 (19/10/2026 – 24/10/2026)  
**Tác giả:** Nguyễn Minh Tuệ (Backend 1 Lead)  
**Trạng thái:** [DEFERRED] Tạm hoãn thực hiện đến sau buổi báo cáo nghiệm thu Tuần 3  

---

## 1. TỔNG QUAN VẤN ĐỀ (PROBLEM STATEMENT)

Trong quá trình nghiệm thu tính năng và phối hợp tích hợp với Frontend (FE) tại Sprint 3, đã phát sinh sự không nhất quán giữa thiết kế Cơ sở dữ liệu và dữ liệu vận hành thực tế ở bảng `public.media_references`:

1. **Tên cột sai lệch bản chất dữ liệu:**
   - Schema định nghĩa cột là: `video_url TEXT NOT NULL`.
   - Dữ liệu thực tế được nạp vào phục vụ AI Video Engine cắt cảnh (tư liệu tour Bà Nà Hills từ Traveloka/Unsplash) lại là **đường link hình ảnh tĩnh (`.png`, `.jpg`)**.
2. **Gây nhầm lẫn trong giao tiếp kỹ thuật:**
   - FE và QA khi kiểm tra Table Editor trong Supabase tưởng nhầm là tính năng bị lỗi hoặc chưa upload được video, vì cột tên là `video_url` nhưng giá trị lại là link ảnh.
   - Dễ gây hiểu lầm giữa **Tư liệu thô đầu vào** (`media_references`) và **Video thành phẩm đầu ra** (`contents.video_url` nằm ở Storage `campaign-videos`).
3. **Phát sinh mã xử lý tạm thời (Workaround Code):**
   - Trong `src/lib/merchant/video-generate-service.ts`, hệ thống đang phải kiểm tra thủ công phần mở rộng đuôi file (`endsWith('.mp4')`, `.mov`, `.webm`) để suy đoán tài nguyên đó là `"VIDEO"` hay `"IMAGE"`. Cách này tiềm ẩn rủi ro khi URL ảnh/video từ CDN không có đuôi mở rộng rõ ràng.

---

## 2. NGUYÊN NHÂN GỐC RỄ (ROOT CAUSE)

1. **Thay đổi phạm vi nghiệp vụ trong thực tế:**
   - Thiết kế ban đầu (Task BE1-W3-02) giả định Merchant sẽ tải lên các video mẫu tham chiếu phong cách (Style Reference Video).
   - Tuy nhiên, trong nghiệp vụ du lịch thực tế, các đơn vị lữ hành/Merchant chủ yếu chỉ sở hữu **ảnh chụp tour chất lượng cao**, rất hiếm khi có sẵn clip quay flycam chuyên nghiệp.
2. **Cơ chế vận hành của AI Video Engine:**
   - Theo quy chuẩn `RuleAIAgentsGenVideo.md`, lõi AI thực hiện cơ chế: **Nhận ảnh thật $\rightarrow$ Áp dụng hiệu ứng chuyển động máy quay (Drone Pan, Zoom, 2.5D Parallax, nhịp cắt CapCut 1.5s - 2.5s) + Lồng tiếng AI $\rightarrow$ Render kết xuất ra video hoàn chỉnh 9:16**.
   - Do đó, ảnh chụp tour chính là "nguyên liệu đầu vào" quan trọng nhất.
3. **Ưu tiên tiến độ Sprint 3:**
   - Để kịp tiến độ bàn giao cho FE dựng giao diện và BE3 kết nối n8n, team đã tận dụng cột `video_url` sẵn có để lưu trữ link ảnh tư liệu thay vì tạo Migration thay đổi cấu trúc bảng giữa chừng, tránh làm gãy các API đang chạy test.

---

## 3. ĐÁNH GIÁ MỨC ĐỘ ẢNH HƯỞNG (IMPACT ASSESSMENT)

| Khía cạnh | Mức độ ảnh hưởng hiện tại (Tuần 3) | Đánh giá rủi ro dài hạn |
| :--- | :--- | :--- |
| **Vận hành hệ thống** | **Không ảnh hưởng (LOW):** Toàn bộ 9/9 unit tests và luồng render video hoàn chỉnh (`banahills-remediated-master.mp4`) vẫn chạy chính xác 100%. | **Trung bình (MEDIUM):** Dễ gãy nếu Merchant upload ảnh/video qua URL dạng pre-signed không có đuôi file. |
| **Bảo mật & Phân quyền** | **Đã kiểm soát:** Backend đã hỗ trợ auth session và chặn can thiệp trái phép. | **Thấp (LOW):** Chỉ cần siết RLS `USING (merchant_id = auth.uid())`. |
| **Độ rõ ràng kiến trúc** | **Bị ảnh hưởng (MEDIUM):** Tên trường gây hiểu nhầm cho các bên tích hợp (FE, Mobile, Third-party). | **Cao (HIGH):** Tích tụ nợ kỹ thuật, khó mở rộng sang các định dạng media khác (Audio, 360 VR, 3D Assets). |

---

## 4. QUYẾT ĐỊNH XỬ LÝ (ACTION DECISION)

> **QUYẾT ĐỊNH:** 
> - **Trong buổi báo cáo / Demo Tuần 3:** Giữ nguyên cấu trúc hiện tại để đảm bảo tính ổn định tuyệt đối cho buổi báo cáo tiến độ và demo luồng sinh video AI E2E.
> - **Ngay sau khi báo cáo xong (Bắt đầu Tuần 4):** Tiến hành refactor cấu trúc bảng và chuẩn hóa mã nguồn theo kế hoạch bên dưới.

---

## 5. KẾ HOẠCH CHỈNH SỬA CHI TIẾT (REFACTORING SPECIFICATION)

### Bước 1: Tạo Migration chuẩn hóa Database Schema
Tạo migration mới `20261025100000_refactor_media_references_schema.sql`:

```sql
-- 1. Đổi tên cột video_url thành media_url (hoặc asset_url)
ALTER TABLE public.media_references 
  RENAME COLUMN video_url TO media_url;

-- 2. Bổ sung cột phân loại định dạng rõ ràng
ALTER TABLE public.media_references
  ADD COLUMN IF NOT EXISTS media_type VARCHAR(16) NOT NULL DEFAULT 'IMAGE';

-- 3. Ràng buộc kiểm tra định dạng media hợp lệ
ALTER TABLE public.media_references
  ADD CONSTRAINT chk_media_references_type 
  CHECK (media_type IN ('IMAGE', 'VIDEO', 'AUDIO'));

-- 4. Bổ sung thông tin MIME type và dung lượng (nếu có)
ALTER TABLE public.media_references
  ADD COLUMN IF NOT EXISTS mime_type VARCHAR(64),
  ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT;

-- 5. Cập nhật dữ liệu hiện có dựa trên phần mở rộng file
UPDATE public.media_references
SET media_type = CASE 
  WHEN media_url ILIKE '%.mp4' OR media_url ILIKE '%.mov' OR media_url ILIKE '%.webm' THEN 'VIDEO'
  ELSE 'IMAGE'
END;

-- 6. Siết chặt bảo mật RLS: Merchant chỉ được xem tư liệu của chính mình
DROP POLICY IF EXISTS "Allow public read access to media_references" ON public.media_references;
CREATE POLICY "Allow merchants to view own media_references"
ON public.media_references FOR SELECT
USING (merchant_id = auth.uid());
```

---

### Bước 2: Cập nhật TypeScript Types & Schema Layer
1. **`src/lib/database.types.ts`:**
   - Chạy lệnh `npx supabase gen types typescript` để đồng bộ lại schema mới.
2. **`src/lib/merchant/media-schema.ts`:**
   - Đổi `videoUrl` $\rightarrow$ `mediaUrl`.
   - Bổ sung trường `mediaType: z.enum(["IMAGE", "VIDEO", "AUDIO"]).default("IMAGE")`.
3. **`src/lib/merchant/media-service.ts`:**
   - Cập nhật hàm `mapMediaRow` và bộ lọc `listMediaReferences` hỗ trợ lọc theo `media_type`.

---

### Bước 3: Cập nhật Lõi Video Engine & Service
1. **`src/lib/merchant/video-generate-service.ts`:**
   - Thay thế hoàn toàn logic đoán mò đuôi file (`endsWith('.mp4')`) bằng trường `row.media_type === 'VIDEO' ? 'VIDEO' : 'IMAGE'`.
2. **Thông báo cho Frontend (FE):**
   - Hướng dẫn FE đổi tên field từ `video_url` sang `media_url` và hiển thị badge tương ứng (`[Ảnh]` hoặc `[Video]`) trên giao diện Thư viện tư liệu.

---

## 6. KẾT LUẬN & CAM KẾT

Tài liệu này ghi nhận chính thức hiện trạng nợ kỹ thuật của bảng `media_references` tại Tuần 3. Việc giữ nguyên mã nguồn trong thời điểm hiện tại nhằm đảm bảo an toàn tuyệt đối cho đợt báo cáo tiến độ. Toàn bộ các bước refactor trong tài liệu này sẽ được thực thi ngay trong Sprint 4 qua một Pull Request độc lập.
