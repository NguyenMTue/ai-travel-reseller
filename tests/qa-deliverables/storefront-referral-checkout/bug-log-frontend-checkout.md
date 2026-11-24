# BÁO CÁO GHI NHẬN LỖI & ĐỀ XUẤT TỐI ƯU HÓA FRONTEND
## PHÂN HỆ: STOREFRONT & CHECKOUT MODAL (DÀNH CHO FRONTEND DEV)

- **Dự án:** AI Travel Reseller Network (TravelLink)
- **QA Automation Engineer:** Senior QA Lead
- **Phạm vi kiểm thử:** Giao diện Storefront (`/storefront/[tenant]/[slug]`), Header, Gallery, Package Selector, Sticky CTA, Checkout Modal (`StorefrontCheckoutModal`), Trải nghiệm Responsive Mobile.
- **Ngày ghi nhận:** 19/11/2026

---

### BẢNG TỔNG QUAN PHÂN LOẠI LỖI FRONTEND

| Mã Bug | Tên lỗi / Vấn đề phát hiện | Vị trí file mã nguồn | Mức độ nghiêm trọng | Trạng thái |
| :---: | :--- | :--- | :---: | :---: |
| `BUG-FE-CHK-01` | Lỗi phân giải Subdomain Tenant nhầm lẫn trên dải IP `127.0.0.1` | `proxy.ts` (`extractTenantSubdomain`) | **High / Blocker for Local IP** | Mở (Open) |
| `BUG-FE-CHK-02` | Thiếu thuộc tính WAI-ARIA và Keyboard Navigation trên thẻ chọn gói vé Modal | `src/components/storefront/storefront-checkout-modal.tsx` | **Low / Accessibility** | Đề xuất tối ưu |
| `BUG-FE-CHK-03` | Trùng lặp Text Heading giữa trang chính và Modal gây nhiễu cho screen reader | `src/components/storefront/storefront-tour-content.tsx` & `storefront-checkout-modal.tsx` | **Minor / UI Semantics** | Đề xuất tối ưu |

---

### CHI TIẾT CÁC VẤN ĐỀ GHI NHẬN:

#### 1. BUG-FE-CHK-01: Lỗi phân giải Subdomain Tenant nhầm lẫn trên dải IP `127.0.0.1`
- **Vị trí phát hiện:** `proxy.ts` (dòng 33 - 39)
- **Mức độ:** **High** (Ảnh hưởng nghiêm trọng khi test hoặc chạy local qua IP `127.0.0.1`)
- **Mô tả chi tiết:**
  Hàm `extractTenantSubdomain(hostHeader)` thực hiện tách chuỗi host theo dấu chấm `.`:
  ```ts
  const parts = hostname.split(".");
  if (parts.length >= 3) {
    const sub = parts[0];
    if (sub && !reservedSubdomains.has(sub)) return sub;
  }
  ```
  Khi người dùng hoặc automation test truy cập qua `http://127.0.0.1:3100`, mảng `parts` có 4 phần tử `["127", "0", "0", "1"]`. Do `parts.length >= 3` thỏa mãn và `"127"` không nằm trong danh sách `reservedSubdomains`, hệ thống nhận diện nhầm `"127"` là slug của Doanh nghiệp (Tenant) và thực hiện rewrite sang `/storefront/127/t/...`, dẫn đến lỗi **HTTP 404** cho các đường link chuyển hướng tracking như `/t/sunworld/nguhanhson-01`.
- **Hành vi mong đợi:** Các địa chỉ IP thuần (IPv4: 4 nhóm số, IPv6) phải được bỏ qua việc trích xuất tenant subdomain, giữ nguyên luồng router thông thường.
- **Giải pháp khắc phục đề xuất:**
  Bổ sung điều kiện kiểm tra Regex IPv4/IPv6 trước khi tách subdomain:
  ```ts
  // Bỏ qua nếu hostname là địa chỉ IPv4 thuần
  if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname)) {
    return null;
  }
  ```

---

#### 2. BUG-FE-CHK-02: Thiếu thuộc tính WAI-ARIA và Keyboard Navigation trên thẻ chọn gói vé Modal
- **Vị trí phát hiện:** `src/components/storefront/storefront-checkout-modal.tsx` (dòng 220 - 248)
- **Mức độ:** **Low / Accessibility**
- **Mô tả chi tiết:**
  Các thẻ gói vé được render bằng thẻ `<div onClick={() => setSelectedPackage(pkg)}>` nhưng không có `tabIndex={0}`, không có `role="radio"` hoặc `role="button"`, và không lắng nghe sự kiện phím `onKeyDown` (Enter/Space). Người dùng khuyết tật hoặc người dùng chỉ sử dụng bàn phím không thể chuyển đổi giữa các gói vé tham quan.
- **Giải pháp khắc phục đề xuất:**
  ```tsx
  <div
    key={pkg.id}
    role="radio"
    aria-checked={selectedPackage.id === pkg.id}
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setSelectedPackage(pkg);
      }
    }}
    onClick={() => setSelectedPackage(pkg)}
    className={...}
  >
  ```

---

#### 3. BUG-FE-CHK-03: Trùng lặp Tiêu đề Text giữa trang chính và Modal gây nhiễu ngữ nghĩa (Semantics)
- **Vị trí phát hiện:** `src/components/storefront/storefront-tour-content.tsx` và `storefront-checkout-modal.tsx`
- **Mức độ:** **Minor**
- **Mô tả:** Tên gói vé hiển thị thẻ `<h3 className="...">` ở cả phần nội dung chính bên dưới và bên trong modal pop-up, khiến các bộ chọn truy vấn không gán scope modal dễ bị xung đột và làm tăng độ phức tạp của Accessibility tree.
- **Khắc phục:** Đóng gói modal trong thẻ `<dialog aria-labelledby="modal-title" aria-modal="true">` và gán `id` duy nhất cho tiêu đề modal để screen reader phân tách ngữ cảnh rõ ràng.

---

### GHI CHÚ TIẾN ĐỘ (OUT OF CURRENT IMPLEMENTATION - KHÔNG TÍNH BUG):
- Tính năng thanh toán trực tiếp bằng thẻ Visa/Mastercard quốc tế và cổng Apple Pay/Google Pay hiện chưa nằm trong phạm vi Sprint hiện tại (hệ thống đang vận hành hoàn hảo với VietQR Napas247).
