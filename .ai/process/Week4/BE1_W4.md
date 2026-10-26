# MY WORK PLAN — BE1_W4
**Project:** AI Travel Reseller MVP (TravelLink AI)  
**Week:** Tuần 4 (26/10/2026 – 31/10/2026) — Sprint 4  
**Member:** Nguyễn Minh Tuệ (Backend 1 Lead kiêm Project Manager)  
**Role:** Backend Developer 1 (Supabase DB, Video Engine Architect & Render Quality)  
**Current Milestone:** VIDEO QUALITY ENGINE REFINEMENT, AUDIO DUCKING & SCOPE STABILIZATION  
**Deadline:** 17:00 Thứ Sáu (30/10/2026); Demo nghiệm thu chất lượng video: Thứ Bảy (31/10/2026)  
**Branch:** `feature/be1-w4-video-quality-refinement` (tách từ `dev`)  

---

## 1. Context
- Kế thừa thành quả Sprint 3: Toàn bộ nền tảng Database, Auth, Commerce Orders & Commissions, RPC ví tiền, Media References và Core AI Video Engine v1 (`generator.ts`) đã được merge hoàn chỉnh vào nhánh `dev`.
- **Cập nhật Lộ trình:** Ban điều hành và PM quyết định chuyển đổi chu kỳ dự án từ **4 tuần sang 5 tuần**. Tuần 4 giảm tải khối lượng phát triển tính năng mới cho toàn team; toàn bộ Final UAT, Load Test k6 và Release Production được dời sang Tuần 5.
- **Trọng tâm đặc biệt của BE1 trong Tuần 4: CHẤT LƯỢNG ĐẦU RA CHO VIDEO (Video Output Quality):**
  1. Cải tiến chuyển động hình ảnh (Visual Motion): Nâng cấp Parallax 2.5D và Dynamic Ken Burns Zoom/Pan trên khung hình dọc $1080 \times 1920$ (9:16), triệt tiêu cảm giác giật khung hình khi lia cảnh.
  2. Bổ sung cinematic gradient overlay và chuẩn hóa font chữ vàng viền đen chuẩn Safe Zone (không bị UI TikTok/Reels che khuất).
  3. Xây dựng bộ hòa âm 3 lớp chuyên nghiệp có **Auto-Ducking**: Voiceover $0\text{ dB}$, BGM tự động hạ xuống $-20\text{ dB}$ khi có giọng đọc và tăng lên $-10\text{ dB}$ lúc nghỉ chuyển cảnh, Sound FX $-12\text{ dB}$ đồng bộ từng mili-giây nhịp cắt CapCut ($1.5\text{s} - 2.5\text{s}$).
  4. Tối ưu luồng Render FFmpeg: Xuất file MP4 H.264/AAC sắc nét, mượt mà 30fps, dung lượng tối ưu, upload an toàn lên bucket `campaign-videos`.
- Nguồn tham chiếu: [Roadmap.md](../Roadmap.md), [Week4.md](Week4.md), [PromptCreateTask.md](../PromptCreateTask.md), [RuleAIAgentsGenVideo.md](../../role/RuleAIAgentsGenVideo.md).

---

## 2. Executive Summary
Trong Sprint 4, BE1 tập trung $100\%$ nguồn lực vào việc nâng tầm chất lượng nghệ thuật và kỹ thuật của video do AI tạo ra:
1. **Motion Quality:** Nâng cấp thuật toán easing chuyển động trong [`generator.ts`](file:///E:/Tue/MyProject/AITravelReseller/ai-travel-reseller/src/lib/video-engine/generator.ts), giúp ảnh tĩnh chuyển động có chiều sâu không gian (Parallax 2.5D).
2. **Audio Ducking:** Lập trình giải thuật trộn âm 3 lớp (Narration + BGM + SFX) để nhạc nền tự động né giọng đọc AI, không còn hiện tượng át giọng hay chồng chéo âm thanh.
3. **Render Optimization:** Tối ưu hóa preset FFmpeg và pipeline tạo video mẫu thực tế cho chiến dịch Bà Nà Hills và Hội An.
4. **Code Review & Quản trị:** Duy trì kiểm duyệt 2 cấp nghiêm ngặt cho PR của Tester 3 (FE phụ) trên nhánh cô lập.

---

## 3. TODAY — MUST DO (Thứ Hai 26/10/2026)

| Priority | Task | Why | Dependency | Output | Estimated Effort | Status |
|:---:|---|---|---|---|:---:|:---:|
| **P0** | Họp Kick-off Sprint 4 (09:00 AM) & Công bố dời lộ trình sang 5 tuần | Đồng bộ giảm tải cho toàn team, thống nhất mục tiêu video | Toàn team | Biên bản họp Sprint 4 | 1.5h | DONE |
| **P0** | Thẩm định các mẫu video kết xuất hiện tại theo `AI_VIDEO_RUBRIC_W3.md` | Chỉ rõ các điểm yếu hình ảnh/âm thanh cần khắc phục | Sample video W3 | Bảng Audit lỗi Video | 2.5h | READY |
| **P1** | Tạo nhánh `feature/be1-w4-video-quality-refinement` từ `dev` | Cách ly môi trường phát triển nâng cấp video | Nhánh `dev` sạch | Local branch | 0.5h | READY |

---

## 4. THIS WEEK — MY TASKS

| ID | Task | Priority | Status | Dependency | Owner | Deliverable | Deadline |
|---|---|:---:|:---:|---|:---:|---|:---:|
| **BE1-W4-01** | Nâng cấp Motion Ken Burns & Parallax 2.5D cho Video Engine | **P0** | `IN_PROGRESS` | Core Engine W3 | BE1 | `generator.ts` v2 với thuật toán easing chuyển cảnh | 28/10 17:00 |
| **BE1-W4-02** | Hòa âm đa kênh 3 lớp với Auto-Ducking BGM thông minh | **P0** | `READY` | BE1-W4-01 | BE1 | Engine audio mixer 3 lớp không chồng lấn | 29/10 17:00 |
| **BE1-W4-03** | Tối ưu hóa lệnh Render FFmpeg xuất MP4 1080x1920 (9:16) chuẩn 30fps | **P1** | `READY` | BE1-W4-01, 02 | BE1 | Pipeline render MP4 sắc nét + upload Storage | 30/10 17:00 |
| **BE1-W4-04** | Kết xuất 02 video mẫu chất lượng cao (Bà Nà Hills & Hội An) | **P1** | `READY` | BE1-W4-03 | BE1 | 02 file MP4 đạt điểm $\ge 9.0$ theo Rubric QA | 31/10 12:00 |
| **PM-W4-01** | Điều phối team, giám sát quy chuẩn an toàn của Tester 3 và duyệt PR | **P1** | `IN_PROGRESS` | Quy trình Sprint 4 | BE1 (PM) | Review cấp 2 cho PR của Tester 3 | 31/10 17:00 |

---

## 5. TASK BREAKDOWN (CHI TIẾT THỰC THI)

### A. Những việc tôi PHẢI làm:
- Nâng cấp file `src/lib/video-engine/generator.ts`:
  - Thêm tính toán tọa độ pan/zoom mượt mà (smooth easing cubic-bezier) cho từng phân cảnh.
  - Cập nhật định dạng phụ đề: Viền đen $3\text{px}$, màu vàng nghệ, nằm trong vùng an toàn $150\text{px} \le y \le 1640\text{px}$.
  - Viết giải thuật phân bổ âm lượng (Audio Gain): Voiceover ($0\text{ dB}$), BGM ducked ($-20\text{ dB}$ khi voice nói, $-10\text{ dB}$ khi chuyển cảnh), SFX ($-12\text{ dB}$).
- Nâng cấp API hoặc script render FFmpeg để đóng gói các layer thành MP4 chất lượng cao.
- Chạy toàn bộ test suites `tests/video-engine.test.ts` đảm bảo 100% test pass.
- Thực hiện Code Review cấp 2 (PM Approval) cho PR component tĩnh của Tester 3.

### B. Những việc tôi NÊN làm tiếp theo:
- Hỗ trợ FE Lead kiểm tra đường truyền tải video trên điện thoại qua Cloudflared tunnel.
- Bàn giao URL video mẫu cho Tester 2 chấm điểm theo Rubric.

### C. Những việc tôi KHÔNG NÊN làm:
- Không viết lại schema database (giữ nguyên tính ổn định của các bảng `orders`, `commissions`, `media_references`).
- Không can thiệp vào prompt Gemini của BE2 hay workflow n8n của BE3.
- Không nhận thêm bất kỳ tính năng thương mại mới nào ngoài phạm vi video quality.

### D. Những thứ tôi cần bàn giao:
- Mã nguồn Core Engine nâng cấp $\rightarrow$ Handoff cho toàn team trên PR `dev`.
- 02 video MP4 mẫu du lịch chất lượng cao $\rightarrow$ Bàn giao cho FE Lead và Tester 2.

### E. Những thứ tôi cần yêu cầu team:
- Cần UI/UX bàn giao bộ frame overlay vignette tĩnh 9:16.
- Cần BE2 khóa kịch bản 14 scenes không được tự sinh URL thật (giữ nguyên placeholder `[LINK_MUA_VE]`).

---

## 6. DEPENDENCY ANALYSIS

| Task | Dependency | Người phụ thuộc | Trạng thái |
|---|---|---|---|
| BE1-W4-01 | Engine v1 Tuần 3 | BE1 | `READY` |
| BE1-W4-02 | BE1-W4-01 | BE1 | `READY` |
| BE1-W4-03 | BE1-W4-02 | FE Lead, Tester 2 | `WAITING` |
| FE Video Download | BE1-W4-03 | FE Lead | `WAITING` |
| Tester 2 Rubric QA | BE1-W4-04 | Tester 2 | `WAITING` |

---

## 7. DEFINITION OF DONE (DoD)
- [ ] File `src/lib/video-engine/generator.ts` sinh timeline mượt mà có easing chuyển động.
- [ ] Bộ lọc audio 3 lớp xuất ra file nghe rõ tiếng thuyết minh, BGM du lịch êm dịu không át tiếng.
- [ ] Video kết xuất chuẩn $1080 \times 1920$ (9:16), 30fps, phát mượt trên Safari iOS & Chrome Android.
- [ ] 100% unit tests trong `tests/video-engine.test.ts` PASS.
- [ ] Tester 2 nghiệm thu đạt $\ge 9.0/10$ điểm theo Rubric an toàn AI.
