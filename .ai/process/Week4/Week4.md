# KẾ HOẠCH TRIỂN KHAI TUẦN 4
### DỰ ÁN: AI TRAVEL RESELLER MVP (TRAVELLINK AI)
* **Giai đoạn:** Tuần 4 (26/10/2026 – 31/10/2026) — Sprint 4
* **Chủ đề mốc tiến độ (Milestone):** **VIDEO QUALITY ENGINE REFINEMENT, AUDIO DUCKING & SCOPE STABILIZATION (Chuẩn hóa chất lượng Video AI, Hòa âm đa kênh & Ổn định hệ thống)**
* **Cập nhật Master Roadmap:** Dự án chính thức dời mốc hoàn thành từ **4 tuần sang 5 tuần**. Tuần 4 đóng vai trò bước đệm kỹ thuật chất lượng cao; toàn bộ hoạt động Final UAT, Load Test k6 và Release Production lên Vercel + Supabase được dời sang **Tuần 5**.

---

## 1. MỤC TIÊU TỔNG THỂ CỦA SPRINT 4

Kế thừa toàn bộ kết quả nghiệm thu thành công của Tuần 3 (Core AI Video Engine v1, Media Library, Hệ thống Attribution hoa hồng, RPC Ví tiền Reseller và giải pháp PWA Mobile Suite), Tuần 4 điều chỉnh nhịp độ làm việc nhằm tối ưu hóa chiều sâu chất lượng sản phẩm:

1. **Trọng tâm kỹ thuật số 1 — BE1 tập trung chất lượng đầu ra cho Video AI:**
   * **Nâng tầm chất lượng hình ảnh & chuyển động (Visual & Motion):**
     * Nâng cấp thuật toán chuyển động **2.5D Parallax & Ken Burns Dynamic Zoom**: Triệt tiêu hiện tượng giật khung hình khi lia máy (pan/tilt) trên ảnh tĩnh $1080 \times 1920$ (9:16).
     * Áp dụng lớp phủ điện ảnh (cinematic gradient overlay) và viền chữ màu vàng viền đen chuẩn Safe Zone (cách mép trên 150px, mép dưới 280px) để không bị giao diện TikTok/Reels che khuất.
   * **Hòa âm 3 lớp chuyên nghiệp (Multi-layer Audio with Auto-Ducking):**
     * Tích hợp cơ chế **Auto-Ducking**: Tự động hạ âm lượng nhạc nền (BGM) xuống $-20\text{ dB}$ khi giọng đọc AI (TTS) cất lên và đẩy lên $-10\text{ dB}$ ở các khoảng nghỉ chuyển cảnh.
     * Đồng bộ chính xác hiệu ứng âm thanh (SFX Whoosh/Ding/Camera) khớp theo từng mili-giây nhịp cắt CapCut ($1.5\text{s} - 2.5\text{s}$/cảnh).
   * **Tối ưu hóa Pipeline kết xuất (Render Optimization):**
     * Chuẩn hóa cấu hình FFmpeg (H.264 video, AAC audio, preset medium, CRF 20, bitrate $4500\text{ kbps}$) xuất ra file MP4 mượt mà 30fps tương thích tuyệt đối mọi trình duyệt di động.

2. **Giảm tải khối lượng công việc toàn team (Workload Relaxation):**
   * Do dời roadmap từ 4 sang 5 tuần, toàn bộ các task gây áp lực cao (Load test k6 1.000 user, cổng thanh toán thực tế, tích hợp mở rộng phức tạp) được chuyển sang Tuần 5.
   * Các phân hệ FE, BE2, BE3 và QA tập trung rà soát lỗi tồn đọng, tối ưu trải nghiệm người dùng và hoàn thiện các điểm nối (wiring) đã có.

3. **Duy trì cơ chế kiểm soát an toàn tuyệt đối cho Tester 3 (FE phụ / Trainee):**
   * Tester 3 tiếp tục tuân thủ nghiêm ngặt quy chế cách ly khỏi Core hệ thống, chỉ đảm nhiệm các thành phần giao diện tĩnh độc lập (Dumb UI).

---

## 2. QUY CHẾ AN TOÀN BẮT BUỘC ĐỐI VỚI TESTER 3 (FE PHỤ)

> [!CAUTION]
> **TIẾP TỤC ÁP DỤNG BỘ RÀO CHẮN AN TOÀN TUẦN 3 (STRICT SAFETY GUARDRAILS):**
> 1. **Nguyên tắc cô lập rủi ro:** Tuyệt đối **CẤM** Tester 3 can thiệp, chỉnh sửa hay mở PR chạm vào các tệp tin Core:
>    * App Router gốc: `app/layout.tsx`, `app/page.tsx`, `app/manifest.ts`.
>    * Cấu hình dự án: `proxy.ts`, `next.config.ts`, `package.json`, `tsconfig.json`.
>    * Supabase Core & Auth: `src/lib/supabase/*`, `src/lib/ai/*`, `src/lib/commerce/*`.
>    * Toàn bộ API Route Handlers trong `app/api/*` và Route tracking `/r/[code]`.
> 2. **Giới hạn phạm vi giao việc:** Chỉ giao duy nhất **01 task tĩnh độc lập** (Dumb UI Component nhận props có sẵn, hiển thị modal hướng dẫn, không dùng state phức tạp, không gọi API mạng).
> 3. **Quy chế phê duyệt và gộp nhánh:**
>    * 100% mã nguồn phải được thực hiện trên nhánh riêng biệt `feature/fe-t3-video-tips-guide`.
>    * Phải chạy qua `npm run lint` và `npx tsc --noEmit` đạt 0 lỗi.
>    * Bắt buộc có **2 lượt phê duyệt (Approval)** từ FE Lead (Diệu) và PM/BE1 (Tuệ) trước khi merge vào `dev`. Nghiêm cấm tự ý merge.

---

## 3. PHÂN CÔNG NHIỆM VỤ CHI TIẾT SPRINT 4 (WBS)

### A. Backend 1 & Project Management (Nguyễn Minh Tuệ — Trọng tâm Video Quality)
* `BE1-W4-01 (Motion & Parallax 2.5D)`: Cải tiến chuyển động hình ảnh cho Core Video Engine (`src/lib/video-engine/generator.ts`), hỗ trợ dynamic zoom/pan mượt mà trên khung hình 9:16.
* `BE1-W4-02 (Audio Mixer 3 Lớp & Ducking)`: Xây dựng cơ chế hòa âm thông minh: Voiceover $0\text{ dB}$, BGM tự động ducking $-20\text{ dB}$, Sound FX chuyển cảnh $-12\text{ dB}$.
* `BE1-W4-03 (FFmpeg & Storage Pipeline Optimization)`: Tối ưu pipeline kết xuất MP4 thật chuẩn $1080 \times 1920$, tối ưu tốc độ render và upload an toàn vào Supabase Storage bucket `campaign-videos`.
* `PM-W4-01 (Điều phối & Đồng bộ Roadmap 5 Tuần)`: Cập nhật lộ trình 5 tuần, điều phối nhịp độ làm việc nhẹ nhàng cho team, tổ chức review 2 cấp cho task của Tester 3.

### B. Backend 2 (Nguyễn Huỳnh — AI Prompt & Guardrails)
* `BE2-W4-01 (Scene Script Alignment)`: Tinh chỉnh prompt multimodal để kịch bản 14 phân cảnh khớp chính xác $100\%$ các trường dữ liệu của BE1 Video Engine (đảm bảo giữ nguyên placeholder `[LINK_MUA_VE]`).
* `BE2-W4-02 (Anti-Hallucination Audit)`: Chạy lại bộ kiểm thử 10 kịch bản adversarial trên Sales Agent nhằm đảm bảo bot không bịa giá hoặc lộ thông tin chưa duyệt khi tư vấn video.

### C. Backend 3 (Thái Thanh Tú — Automation & Notification)
* `BE3-W4-01 (n8n Video Render Queue Stabilization)`: Cải tiến workflow n8n lắng nghe webhook render video: bổ sung cơ chế retry lũy tiến (backoff) 3 lần, tránh nghẽn luồng khi nhiều request tạo video đồng thời.
* `BE3-W4-02 (Notification Polish)`: Tinh chỉnh nội dung tin nhắn Telegram gửi cho Reseller khi có video chiến dịch mới hoàn tất render (kèm link xem thử và nút tải nhanh).

### D. Frontend Team (Diệu & Tester 3)
* **Frontend Lead (Diệu):**
  * `FE-W4-01 (Video Player 9:16 & Download Action)`: Tinh chỉnh giao diện trình phát video dọc trên Reseller Feed và Merchant Library; bổ sung nút tải trực tiếp file video MP4 chất lượng cao về máy.
  * `FE-W4-02 (Mobile PWA Touch Optimization)`: Tối ưu trải nghiệm vuốt chạm chuyển tab, hoàn thiện hiển thị an toàn trên các màn hình có tai thỏ / Dynamic Island.
  * `FE-W4-REVIEW`: Giám sát, hỗ trợ và thực hiện Code Review cấp 1 cho nhánh của Tester 3.
* **FE Phụ / Trainee (Tester 3 — Cách ly an toàn):**
  * `T3-FE-W4-01 (Static Video Posting Tips Modal)`: Xây dựng component giao diện tĩnh `src/components/merchant/video-posting-tips-modal.tsx` hiển thị cẩm nang mẹo đăng video TikTok lên xu hướng (chỉ nhận props tĩnh, không gọi API).

### E. QA & Đánh giá An toàn AI (Tester 1 & Tester 2)
* **QA Lead (Tester 1):**
  * `T1-W4-01`: Kiểm thử hiển thị Responsive và PWA của video player trên các dòng máy di động thật thông qua Cloudflared tunnel (Phương án C3).
  * `T1-W4-02`: Kiểm tra chất lượng giao diện tĩnh do Tester 3 xây dựng.
* **AI Safety QA (Tester 2):**
  * `T2-W4-01 (Video Quality Rubric Evaluation)`: Thẩm định 3 mẫu video render mới nhất của BE1 theo bảng tiêu chuẩn `AI_VIDEO_RUBRIC_W3.md` (chấm điểm độ mượt motion, chất lượng âm thanh và độ khớp kịch bản).

### F. UI/UX Designer & Business Analyst
* **UI/UX Designer (`UX-W4-01`):** Thiết kế bộ khung đồ họa overlay tĩnh 9:16 (cinematic vignette, safe-zone guideline, badge ưu đãi).
* **Business Analyst (`BA-W4-01`):** Cập nhật tài liệu nghiệm thu Acceptance Criteria cho Video Engine v2 và chuẩn bị tài liệu UAT cho Tuần 5.

---

## 4. MA TRẬN PHỤ THUỘC (DEPENDENCY MATRIX)

| Mã Task | Phụ thuộc vào | Deliverable cần có | Trạng thái hiện tại |
| :--- | :--- | :--- | :---: |
| **BE1-W4-01** | Core Video Engine Tuần 3 | File `generator.ts` hiện hữu | `READY` (Làm ngay) |
| **BE1-W4-02** | BE1-W4-01 | Khung storyboard 14 scenes hoàn chỉnh | `READY` |
| **BE1-W4-03** | BE1-W4-01, BE1-W4-02 | Logic motion và audio hoàn tất | `NOT_READY` (Chờ 01, 02) |
| **BE2-W4-01** | BE1 Data Contract | Schema `VideoEngineInput` | `READY` |
| **FE-W4-01** | BE1-W4-03 | Video MP4 mẫu đạt chuẩn | `IN_PROGRESS` (Dùng mock chờ file thật) |
| **T3-FE-W4-01**| Giao diện tĩnh có sẵn | Mock props từ FE Lead | `READY` (Làm độc lập) |
| **T2-W4-01** | BE1-W4-03 | Video kết xuất hoàn chỉnh | `NOT_READY` (Chờ BE1) |

---

## 5. KẾ HOẠCH NGIỆM THU CUỐI TUẦN 4
1. **Nghiệm thu BE1 Video Engine:** Xuất bản tối thiểu 02 video MP4 chiến dịch Bà Nà Hills và Phố Cổ Hội An với chất lượng $1080 \times 1920$, chuyển động 2.5D mượt mà, âm thanh hòa trộn tự nhiên không chồng lấn.
2. **Nghiệm thu Tester 3:** Component `video-posting-tips-modal.tsx` được review sạch sẽ và merge an toàn vào `dev`.
3. **Nghiệm thu PWA Mobile:** Trình phát video 9:16 và nút tải video chạy trơn tru trên trình duyệt di động.
4. **Sẵn sàng bước vào Tuần 5:** Toàn bộ hệ thống ổn định, không nợ kỹ thuật, sẵn sàng cho tuần Final Release & UAT.
