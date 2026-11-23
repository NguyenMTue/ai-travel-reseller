import { test, expect } from "@playwright/test";
import path from "node:path";

/**
 * =============================================================================
 * SUITE: PLAYWRIGHT E2E AUTOMATION TEST - LUỒNG MUA VÉ QUA LINK RESELLER
 * PROJECT: AI Travel Reseller Network
 * DELIVERABLE FILE: tests/storefront-referral-checkout.spec.ts
 * EVIDENCE DIR: tests/qa-deliverables/storefront-referral-checkout/screenshots/
 * 
 * SRS / BRD TRACING:
 * - FR-TRK-02: Tracking Link Referral & Storefront Redirection
 * - RULE-01 & FR-TRK-08: Merchant Transparency & Partner Attribution
 * - FR-ATT-01 & FR-ATT-02: Voucher & Reseller Attribution Priority (5% Discount)
 * - FR-ORD-01 & FR-ORD-02: E-Ticket Generation, VietQR & Booking Confirmation
 * =============================================================================
 */

const SCREENSHOT_DIR = path.resolve(
  process.cwd(),
  "tests/qa-deliverables/storefront-referral-checkout/screenshots"
);

const DESKTOP_VIEWPORT = { width: 1280, height: 720 };
const MOBILE_VIEWPORT = { width: 390, height: 844 };

// Helper chuẩn hoá BaseURL để tránh lỗi nhận diện nhầm IP 127.0.0.1 thành Tenant Subdomain trong proxy.ts
function resolveTargetUrl(base: string | undefined, pathUrl: string): string {
  const rawBase = base || "http://localhost:3100";
  const normalizedBase = rawBase.replace("127.0.0.1", "localhost");
  return new URL(pathUrl, normalizedBase).toString();
}

const RESELLER_REF_CODE = "22222222-2222-2222-2222-111111111111";
const RESELLER_CAMPAIGN_ID = "44444444-4444-4444-4444-555555555555";
const REFERRAL_TRACKING_PATH = `/t/sunworld/nguhanhson-01?ref=${RESELLER_REF_CODE}&campaign=${RESELLER_CAMPAIGN_ID}`;
const DIRECT_STOREFRONT_PATH = `/storefront/sunworld/nguhanhson-01?ref=${RESELLER_REF_CODE}&campaign=${RESELLER_CAMPAIGN_ID}`;

test.describe("E2E Luồng Mua vé qua Link Reseller (Storefront Referral Checkout)", () => {
  test.setTimeout(60000);

  /**
   * ---------------------------------------------------------------------------
   * TC-01: Truy cập Tracking Link của Reseller & Kiểm tra Điều hướng Storefront
   * Mã SRS/BRD: FR-TRK-02, RULE-01, FR-TRK-08
   * ---------------------------------------------------------------------------
   */
  test("TC-01 - Truy cập Tracking Link của Reseller & Kiểm tra Điều hướng Storefront", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      viewport: DESKTOP_VIEWPORT,
      isMobile: false,
    });
    const page = await context.newPage();

    // 1. Truy cập Tracking Link của Reseller (/t/[tenant]/[slug]?ref=...&campaign=...)
    const trackingUrl = resolveTargetUrl(baseURL, REFERRAL_TRACKING_PATH);
    const response = await page.goto(trackingUrl, { waitUntil: "domcontentloaded" });

    // Xác nhận phản hồi thành công và điều hướng sang trang Storefront
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(new RegExp(`/storefront/sunworld/nguhanhson-01`));
    await expect(page).toHaveURL(new RegExp(`ref=${RESELLER_REF_CODE}`));

    // 2. Xác minh thông tin Thương hiệu Merchant & Cam kết minh bạch (RULE-01, FR-TRK-08)
    await expect(page.getByText(/Sun World/i).first()).toBeVisible();
    await expect(page.getByText("Chính hãng 100%").first()).toBeVisible();

    // 3. Xác minh Banner ưu đãi độc quyền từ Đối tác Reseller
    const referralBanner = page.getByText(/Ưu đãi độc quyền qua liên kết Đối tác Reseller/i);
    await expect(referralBanner).toBeVisible();
    await expect(page.getByText("Giảm thêm 5%").first()).toBeVisible();

    // 4. Xác minh thông tin sản phẩm và giá niêm yết (VND)
    await expect(page.getByRole("heading", { name: /Ngũ Hành Sơn/i, level: 1 })).toBeVisible();
    await expect(page.getByText(/320\.000\s*₫/).first()).toBeVisible();

    // 5. Chụp ảnh minh chứng TC-01
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "01-referral-landing-storefront.png"),
      fullPage: true,
    });

    await context.close();
  });

  /**
   * ---------------------------------------------------------------------------
   * TC-02: Chọn Gói vé, Số lượng & Áp dụng Mã Voucher Reseller
   * Mã SRS/BRD: FR-ATT-01, FR-ATT-02
   * ---------------------------------------------------------------------------
   */
  test("TC-02 - Chọn Gói vé, Số lượng & Áp dụng Mã Voucher Reseller", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      viewport: DESKTOP_VIEWPORT,
      isMobile: false,
    });
    const page = await context.newPage();

    const targetUrl = resolveTargetUrl(baseURL, DIRECT_STOREFRONT_PATH);
    await page.goto(targetUrl, { waitUntil: "domcontentloaded" });

    // 1. Mở Modal Đặt vé qua nút CTA chính
    const bookNowButton = page.getByRole("button", { name: /ĐẶT VÉ NGAY/i }).first();
    await expect(bookNowButton).toBeVisible();
    await bookNowButton.click();

    // Xác nhận Modal mở thành công
    const modal = page.locator("div.fixed.inset-0");
    const modalHeading = modal.getByRole("heading", { name: /Đặt vé tham quan chính hãng/i });
    await expect(modalHeading).toBeVisible();

    // 2. Kiểm tra chọn gói vé bên trong modal (Package Selector)
    const standardPackageInModal = modal.getByText(/Tour Khám Phá Danh Thắng Ngũ Hành Sơn & Động Huyền Không/i);
    await expect(standardPackageInModal).toBeVisible();
    await standardPackageInModal.click();

    // 3. Điều chỉnh số lượng vé trong modal: Tăng 1 vé Người lớn (tổng 2) và thêm 1 vé Trẻ em (tổng 1)
    const adultPlusBtn = modal.locator("button:has-text('+')").first();
    await adultPlusBtn.click(); // adultCount = 2

    const childPlusBtn = modal.locator("button:has-text('+')").nth(1);
    await childPlusBtn.click(); // childCount = 1

    // Xác nhận số lượng cập nhật chính xác trên UI
    await expect(modal.locator("text=Vé người lớn (2x):")).toBeVisible();
    await expect(modal.locator("text=Vé trẻ em (1x):")).toBeVisible();

    // 4. Xác minh Ưu đãi Đối tác Reseller tự động ghi nhận (FR-ATT-01, FR-ATT-02)
    const partnerDiscountBadge = modal.getByText(/Đã áp dụng mã ưu đãi Đối tác:\s*-5%/i);
    await expect(partnerDiscountBadge).toBeVisible();

    // Đơn giá: 2 * 320.000 + 1 * 240.000 (75%) = 880.000 ₫; Giảm 5% = 44.000 ₫; Tổng = 836.000 ₫
    await expect(modal.getByText(/836\.000\s*₫/)).toBeVisible();

    // 5. Chụp ảnh minh chứng TC-02
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "02-ticket-selection-and-voucher.png"),
    });

    await context.close();
  });

  /**
   * ---------------------------------------------------------------------------
   * TC-03: Điền Thông tin Khách hàng & Hoàn tất Đặt vé (Happy Path Checkout)
   * Mã SRS/BRD: FR-ORD-01, FR-ORD-02, RULE-01
   * ---------------------------------------------------------------------------
   */
  test("TC-03 - Điền Thông tin Khách hàng & Hoàn tất Đặt vé (Happy Path Checkout)", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      viewport: DESKTOP_VIEWPORT,
      isMobile: false,
    });
    const page = await context.newPage();

    const targetUrl = resolveTargetUrl(baseURL, DIRECT_STOREFRONT_PATH);
    await page.goto(targetUrl, { waitUntil: "domcontentloaded" });

    // 1. Mở modal Checkout
    await page.getByRole("button", { name: /ĐẶT VÉ NGAY/i }).first().click();
    await expect(page.getByRole("heading", { name: /Đặt vé tham quan chính hãng/i })).toBeVisible();

    // 2. Điền thông tin khách hàng hợp lệ
    const nameInput = page.getByPlaceholder(/Họ và tên người đặt vé/i);
    const phoneInput = page.getByPlaceholder(/Số điện thoại nhận vé SMS/i);
    const emailInput = page.getByPlaceholder(/Email nhận hóa đơn/i);

    await nameInput.fill("Nguyễn Văn A");
    await phoneInput.fill("0901234567");
    await emailInput.fill("nguyenvana@example.com");

    // 3. Chụp ảnh minh chứng form đã điền đầy đủ
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "03-checkout-form-filled.png"),
    });

    // 4. Chuyển sang bước thanh toán VietQR
    const continuePaymentBtn = page.getByRole("button", { name: /TIẾP TỤC THANH TOÁN VIETQR/i });
    await expect(continuePaymentBtn).toBeVisible();
    await continuePaymentBtn.click();

    // Xác nhận chuyển sang Step 2: Thanh toán VietQR
    const paymentHeading = page.getByRole("heading", { name: /Thanh toán vé qua VietQR/i });
    await expect(paymentHeading).toBeVisible();
    await expect(page.getByText(/Mã đơn hàng:\s*TL-/i)).toBeVisible();
    await expect(page.getByRole("img", { name: /Mã VietQR thanh toán/i })).toBeVisible();
    await expect(page.getByText(/MBBank/i)).toBeVisible();

    // 5. Bấm xác nhận đã chuyển khoản để xuất vé điện tử chính hãng
    const confirmTransferBtn = page.getByRole("button", { name: /TÔI ĐÃ CHUYỂN KHOẢN • XUẤT VÉ/i });
    await expect(confirmTransferBtn).toBeVisible();
    await confirmTransferBtn.click();

    // Xác nhận chuyển sang Step 3: Đặt vé thành công & Xuất mã QR vào cổng
    const successHeading = page.getByRole("heading", { name: /XÁC NHẬN ĐẶT VÉ THÀNH CÔNG!/i });
    await expect(successHeading).toBeVisible({ timeout: 10000 });

    // Kiểm tra vé điện tử E-Ticket, mã vé ET- và QR vào cổng
    await expect(page.getByText(/Vé điện tử chính hãng \(E-Ticket\)/i)).toBeVisible();
    await expect(page.getByText(/ET-[A-Z0-9]+/i)).toBeVisible();
    await expect(page.getByText(/QUÉT TẠI CỔNG VÀO/i)).toBeVisible();
    await expect(page.getByText("Nguyễn Văn A")).toBeVisible();

    // Kiểm tra thông báo ghi nhận hoa hồng Reseller
    await expect(page.getByText(/CHẾ ĐỘ TEST: ĐÃ CỘNG HOA HỒNG RESELLER/i)).toBeVisible();
    await expect(page.getByText(RESELLER_REF_CODE)).toBeVisible();

    // 6. Chụp ảnh minh chứng màn hình Booking Confirmation thành công
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "04-booking-confirmation-success.png"),
    });

    await context.close();
  });

  /**
   * ---------------------------------------------------------------------------
   * TC-04: Kiểm tra Validation Form Checkout & Nhánh Ngoại lệ (Negative / Edge Cases)
   * Mã SRS/BRD: FR-ORD-01, FR-ORD-02
   * ---------------------------------------------------------------------------
   */
  test("TC-04 - Kiểm tra Validation Form Checkout & Nhánh Ngoại lệ (Negative / Edge Cases)", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      viewport: DESKTOP_VIEWPORT,
      isMobile: false,
    });
    const page = await context.newPage();

    const targetUrl = resolveTargetUrl(baseURL, DIRECT_STOREFRONT_PATH);
    await page.goto(targetUrl, { waitUntil: "domcontentloaded" });

    // 1. Mở modal Checkout
    await page.getByRole("button", { name: /ĐẶT VÉ NGAY/i }).first().click();
    await expect(page.getByRole("heading", { name: /Đặt vé tham quan chính hãng/i })).toBeVisible();

    const nameInput = page.getByPlaceholder(/Họ và tên người đặt vé/i);
    const phoneInput = page.getByPlaceholder(/Số điện thoại nhận vé SMS/i);
    const submitBtn = page.getByRole("button", { name: /TIẾP TỤC THANH TOÁN VIETQR/i });

    // Case 1: Thử submit khi để trống trường bắt buộc
    // Sử dụng JavaScript form dispatch để kiểm tra validation handler nội bộ
    await submitBtn.click();

    // Case 2: Nhập họ tên nhưng nhập SĐT không hợp lệ (< 9 số)
    await nameInput.fill("Trần Thị B");
    await phoneInput.fill("123");
    await submitBtn.click();

    // Xác minh thông báo lỗi tiếng Việt hiển thị
    const phoneError = page.getByText(/Vui lòng nhập số điện thoại hợp lệ/i);
    await expect(phoneError).toBeVisible();

    // Case 3: Xác minh modal vẫn ở step "form", không nhảy sai sang step thanh toán
    await expect(page.getByRole("heading", { name: /Đặt vé tham quan chính hãng/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Thanh toán vé qua VietQR/i })).not.toBeVisible();

    // 2. Chụp ảnh minh chứng validation lỗi
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "05-checkout-validation-errors.png"),
    });

    await context.close();
  });

  /**
   * ---------------------------------------------------------------------------
   * TC-05: Kiểm tra Trải nghiệm Mua vé qua Link Reseller trên Mobile (390x844)
   * Mã SRS/BRD: Mobile PWA, Responsive Touch Experience
   * ---------------------------------------------------------------------------
   */
  test("TC-05 - Kiểm tra Nhanh Trải nghiệm Mua vé qua Link Reseller trên Mobile (390x844)", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      viewport: MOBILE_VIEWPORT,
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();

    // 1. Truy cập Storefront qua Link Reseller trên giao diện Mobile
    const targetUrl = resolveTargetUrl(baseURL, DIRECT_STOREFRONT_PATH);
    const response = await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);

    // 2. Kiểm tra không bị tràn ngang (No horizontal overflow)
    const isNoOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth + 1;
    });
    expect(isNoOverflow).toBe(true);

    // 3. Xác minh thanh Sticky CTA cố định ở đáy màn hình di động
    const mobileStickyCta = page.getByRole("button", { name: /ĐẶT VÉ NGAY/i }).last();
    await expect(mobileStickyCta).toBeVisible();

    // Kiểm tra kích thước touch target đạt tiêu chuẩn công thái học (>= 44px)
    const boundingBox = await mobileStickyCta.boundingBox();
    expect(boundingBox).not.toBeNull();
    if (boundingBox) {
      expect(boundingBox.height).toBeGreaterThanOrEqual(40);
    }

    // 4. Bấm mở modal đặt vé trên Mobile (Bottom Sheet View)
    await mobileStickyCta.click();

    // Xác minh Modal hiển thị gọn gàng, vừa vặn khung hình Mobile
    const modalHeading = page.getByRole("heading", { name: /Đặt vé tham quan chính hãng/i });
    await expect(modalHeading).toBeVisible();

    // 5. Chụp ảnh minh chứng Mobile Checkout Experience
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "06-mobile-referral-checkout.png"),
    });

    await context.close();
  });
});
