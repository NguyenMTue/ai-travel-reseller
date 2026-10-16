# Báo Cáo Lỗi Database & Auth (Database & Auth Bug Log)
## Chức năng: Copy 1-Click Clipboard & Modal Tracking
**Dự án:** AI Travel Reseller Network  
**Người lập:** Senior QA Automation Engineer  
**Bộ kịch bản kiểm thử tự động liên quan:** `tests/clipboard-modal-tracking.spec.ts`  
**Ngày kiểm thử:** 2026-10-16  

---

### Tổng hợp lỗi Database & Auth:
| Bug ID | Mã SRS | Tên lỗi | Mức độ | Trạng thái |
|---|---|---|---|---|
| `BUG-DB-CLIP-01` | `FR-ATT-01` | Schema bảng `affiliate_links` thiếu cột `voucher_code` và ràng buộc Case-Insensitive Unique | High | Open |
| `BUG-DB-CLIP-02` | `FR-RES-08` | Thiếu bảng lưu trữ sự kiện tương tác Content Kit (`reseller_content_events`) và RLS Policies tương ứng | Medium | Open |

---

## Chi tiết từng lỗi (Defect Details)

### 1. BUG-DB-CLIP-01: Schema bảng `affiliate_links` thiếu cột `voucher_code` và ràng buộc Case-Insensitive Unique
- **Bug ID:** `BUG-DB-CLIP-01`
- **Vị trí phụ trách:** Database / Auth Dev (`supabase/migrations/`)
- **Mã yêu cầu SRS bị vi phạm:** `FR-ATT-01` (Attribution & Voucher Assignment)
- **Test Case bị ảnh hưởng:**
  - `TC-CLIP-03`: `[FR-ATT-01] Modal Tracking Link phai hien thi Ma Voucher rieng cua Reseller`
  - `TC-CLIP-05`: `[FR-ATT-01] [FR-RES-06] Copy 1-Click Ma Voucher tren Modal Tracking va kiem tra Clipboard`
- **Mức độ nghiêm trọng (Severity):** High
- **File source code nguyên nhân (Read-only reference):**
  - File: `supabase/migrations/20261013140000_affiliate_links_and_clicks.sql` (Dòng 11 - 27)
  - Khai báo DDL hiện tại của bảng `affiliate_links`:
    ```sql
    11: CREATE TABLE IF NOT EXISTS public.affiliate_links (
    12:   id              uuid                      NOT NULL DEFAULT extensions.uuid_generate_v4(),
    13:   reseller_id     uuid                      NOT NULL REFERENCES public.resellers(id) ON DELETE CASCADE,
    14:   campaign_id     uuid                      NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    15:   product_id      uuid                      NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    16:   unique_code     character varying(32)     NOT NULL,
    17:   short_url       text,
    18:   destination_url text                      NOT NULL,
    19:   clicks_count    integer                   NOT NULL DEFAULT 0,
    20:   is_active       boolean                   NOT NULL DEFAULT true,
    21:   created_at      timestamp with time zone  NOT NULL DEFAULT timezone('utc'::text, now()),
    22:   updated_at      timestamp with time zone  NOT NULL DEFAULT timezone('utc'::text, now()),
    23:   CONSTRAINT affiliate_links_pkey PRIMARY KEY (id),
    24:   CONSTRAINT uq_affiliate_links_unique_code UNIQUE (unique_code),
    25:   -- Ràng buộc Idempotent: 1 Reseller với 1 Campaign và 1 Product chỉ có duy nhất 1 link tiếp thị
    26:   CONSTRAINT uq_affiliate_links_reseller_campaign_product UNIQUE (reseller_id, campaign_id, product_id)
    27: );
    ```
  - Schema hoàn toàn không có trường để lưu trữ `voucher_code` được gán cho Reseller.
- **Các bước tái hiện (Steps to Reproduce):**
  1. Kiểm tra cấu trúc schema database của bảng `affiliate_links`.
  2. Truy vấn cột `voucher_code` hoặc kiểm tra xem có bảng trung gian gán voucher cho Reseller theo Campaign hay không.
- **Kết quả mong đợi (Expected Result theo SRS v1.1):**
  - Bảng `affiliate_links` (hoặc bảng phân bổ voucher riêng) cần có cột:
    ```sql
    voucher_code VARCHAR(50),
    CONSTRAINT uq_affiliate_links_voucher UNIQUE (lower(voucher_code))
    ```
  - Đảm bảo mã voucher là duy nhất trên toàn hệ thống và không phân biệt chữ hoa, chữ thường khi khách hàng nhập mã thanh toán.
- **Kết quả thực tế (Actual Result):**
  - Schema chưa hỗ trợ lưu trữ mã voucher của Reseller.

---

### 2. BUG-DB-CLIP-02: Thiếu bảng lưu trữ sự kiện tương tác Content Kit (`reseller_content_events`) và RLS Policies tương ứng
- **Bug ID:** `BUG-DB-CLIP-02`
- **Vị trí phụ trách:** Database / Auth Dev (`supabase/migrations/`)
- **Mã yêu cầu SRS bị vi phạm:** `FR-RES-08`
- **Test Case bị ảnh hưởng:** `TC-CLIP-08` (`[FR-RES-08] He thong phai kich hoat event tracking ghi nhan su kien da sao chep khi Reseller bam Copy`)
- **Mức độ nghiêm trọng (Severity):** Medium
- **File source code nguyên nhân (Read-only reference):**
  - Thư mục `supabase/migrations/` hiện chỉ có bảng `clicks` ghi nhận lượt truy cập của khách hàng cuối (End-user click) vào tracking link (`20261013140000_affiliate_links_and_clicks.sql` dòng 30-40).
  - Hoàn toàn chưa có bảng dữ liệu và RLS Policies để cho phép Reseller đã xác thực (`auth.uid()`) lưu các sự kiện hành vi trong Reseller Portal (như `copied_caption`, `copied_cta`, `copied_link`, `copied_voucher`).
- **Các bước tái hiện (Steps to Reproduce):**
  1. Kiểm tra danh sách bảng trong các file migration của Supabase.
  2. Tìm kiếm bảng tương đương `reseller_events` hoặc `content_distribution_logs`.
- **Kết quả mong đợi (Expected Result theo SRS v1.1):**
  - Cần tạo bảng (ví dụ: `reseller_content_events`) với cấu trúc:
    ```sql
    CREATE TABLE public.reseller_content_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      reseller_id UUID NOT NULL REFERENCES public.resellers(id) ON DELETE CASCADE,
      campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
      event_type VARCHAR(50) NOT NULL, -- 'copy_caption', 'copy_cta', 'copy_link', 'copy_voucher'
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT now()
    );
    ALTER TABLE public.reseller_content_events ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Allow resellers to insert their own events"
      ON public.reseller_content_events FOR INSERT
      WITH CHECK (auth.uid() = reseller_id);
    ```
- **Kết quả thực tế (Actual Result):**
  - Thiếu bảng và policy phục vụ tính năng ghi nhận sự kiện sao chép nội dung theo yêu cầu bắt buộc của `FR-RES-08`.
