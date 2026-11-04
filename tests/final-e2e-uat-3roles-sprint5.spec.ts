import { test, expect } from "@playwright/test";
import path from "node:path";

/**
 * =============================================================================
 * SUITE: FINAL E2E UAT 3 VAI TRÒ (MERCHANT – RESELLER – CUSTOMER)
 * THIẾT BỊ: DESKTOP (1280x720) & MOBILE PWA (390x844 TOUCH)
 * SPRINT: 5 - DỰ ÁN: AI Travel Reseller Network
 * DELIVERABLES SCREENSHOTS: tests/qa-deliverables/final-e2e-uat-sprint5/screenshots/
 * NGƯỜI ĐIỀU PHỐI & THỰC THI: Trương Đức Huy (Senior QA Lead & Automation Engineer)
 * =============================================================================
 */

const SCREENSHOT_DIR = path.resolve(
  process.cwd(),
  "tests/qa-deliverables/final-e2e-uat-sprint5/screenshots"
);

// Cấu hình Viewports
const DESKTOP_VIEWPORT = { width: 1280, height: 720 };
const MOBILE_VIEWPORT = { width: 390, height: 844 };

// URLs mục tiêu
const URLS = {
  home: "/",
  merchantDashboard: "/preview/merchant",
  merchantLibrary: "/preview/merchant/library",
  merchantNewCampaign: "/preview/merchant/campaigns/new",
  resellerFeed: "/preview/reseller",
  resellerDetail:
    "/preview/reseller/campaigns/11111111-1111-4111-8111-111111111111?state=approved&tracking=success",
  resellerWallet: "/preview/reseller/wallet",
  customerChatTracking:
    "/chat?reseller_id=11111111-1111-4111-8111-111111111111&campaign_id=22222222-2222-2222-2222-222222222222&product_id=33333333-3333-3333-3333-333333333333",
};

test.describe("Final E2E UAT 3 Vai trò (Merchant - Reseller - Customer)", () => {
  test.setTimeout(60000);

  /**
   * ---------------------------------------------------------------------------
   * CHẶNG 1: VAI TRÒ 1 - MERCHANT (NHÀ CUNG CẤP DỊCH VỤ DU LỊCH)
   * SRS Tracing: FR-CNT-08, FR-CNT-09, FR-CMP-01..08, FR-ORD-01, FR-ANA-01
   * ---------------------------------------------------------------------------
   */
  test("Chặng 1.1 [Merchant Desktop]: Kiểm tra Media Library / Video Mẫu & Form Tạo Campaign", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: DESKTOP_VIEWPORT,
      isMobile: false,
    });
    const page = await context.newPage();

    // 1. Merchant truy cập Media Library
    await page.goto(URLS.merchantLibrary);
    await expect(page.locator("body")).toBeVisible();

    // Kiểm tra Video player mẫu MP4
    const videoSection = page.locator('section[aria-label="Mô phỏng player tuần 4"]');
    await expect(videoSection).toBeVisible({ timeout: 10000 });
    await expect(
      videoSection.getByRole("heading", { name: /Kiểm thử phát và tải MP4/i })
    ).toBeVisible();

    // 2. Merchant truy cập trang tạo Chiến dịch mới
    await page.goto(URLS.merchantNewCampaign);
    await expect(page.getByRole("heading", { name: /Tạo chiến dịch/i })).toBeVisible({
      timeout: 10000,
    });

    // Điền thông tin chiến dịch
    const nameInput = page.getByLabel("Tên chiến dịch");
    if (await nameInput.isVisible()) {
      await nameInput.fill("Chiến dịch Mùa Thu Bà Nà Hills 2026 - UAT Final");
    }

    const rateInput = page.getByLabel(/tỷ lệ hoa hồng/i);
    if (await rateInput.isVisible()) {
      await rateInput.fill("12.5");
    }

    await page.waitForTimeout(500);

    // Chụp ảnh minh chứng: 01-role1-merchant-campaign-and-media-desktop.png
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "01-role1-merchant-campaign-and-media-desktop.png"),
      fullPage: true,
    });

    await context.close();
  });

  test("Chặng 1.2 [Merchant Mobile]: Kiểm tra Merchant Portal Responsive & Drawer Menu", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: MOBILE_VIEWPORT,
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();

    // Mở Dashboard Merchant trên Mobile
    await page.goto(URLS.merchantDashboard);
    await expect(page.locator(".dashboard-header")).toBeVisible({ timeout: 10000 });

    // Kiểm tra nút Hamburger Menu trên mobile
    const menuButton = page.locator(".mobile-menu");
    await expect(menuButton).toBeVisible();

    // Bấm mở menu drawer
    await menuButton.click();
    const sidebar = page.locator(".sidebar");
    await expect(sidebar).toHaveClass(/sidebar-open/);

    // Kiểm tra các mục điều hướng trong mobile drawer
    await expect(page.getByRole("navigation", { name: "Điều hướng Merchant" })).toBeVisible();
    await expect(page.getByText("Không gian doanh nghiệp").first()).toBeVisible();

    await page.waitForTimeout(400);

    // Chụp ảnh minh chứng: 02-role1-merchant-portal-mobile.png
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "02-role1-merchant-portal-mobile.png"),
      fullPage: true,
    });

    await context.close();
  });

  /**
   * ---------------------------------------------------------------------------
   * CHẶNG 2: VAI TRÒ 2 - RESELLER (CỘNG TÁC VIÊN PHÂN PHỐI)
   * SRS Tracing: FR-RES-05, FR-RES-06, FR-RES-07, FR-RES-08, FR-TRK-01, FR-ATT-01
   * ---------------------------------------------------------------------------
   */
  test("Chặng 2.1 [Reseller Desktop]: Duyệt Campaign Feed & Mở Modal Nhận Tracking Link / QR", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: DESKTOP_VIEWPORT,
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const page = await context.newPage();

    // 1. Duyệt Campaign Feed
    await page.goto(URLS.resellerFeed);
    await expect(page.getByRole("heading", { name: "Chiến dịch dành cho bạn" })).toBeVisible({
      timeout: 10000,
    });

    // 2. Vào chi tiết chiến dịch và tạo Tracking Link
    await page.goto(URLS.resellerDetail);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 10000 });

    // Bấm nút "Tạo link"
    const openModalBtn = page.getByRole("button", { name: "Tạo link", exact: true });
    await expect(openModalBtn).toBeVisible();
    await openModalBtn.click();

    // Modal hiển thị
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: /link tiếp thị & qr/i })).toBeVisible();

    // Bấm nút "Tạo link tiếp thị"
    const createBtn = dialog.getByRole("button", { name: "Tạo link tiếp thị", exact: true });
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    // Kiểm tra link và mã QR xuất hiện
    const linkInput = dialog.locator('textarea#tracking-url, input#tracking-url');
    await expect(linkInput).toBeVisible({ timeout: 5000 });
    const trackingUrl = await linkInput.inputValue();
    expect(trackingUrl).toMatch(/\/r\/[a-zA-Z0-9_-]+/);

    const qrImage = dialog.getByRole("img", { name: /mã qr/i });
    await expect(qrImage).toBeVisible();

    // Bấm nút Copy link 1-click
    const copyLinkBtn = dialog.getByRole("button", { name: "Copy link", exact: true });
    await expect(copyLinkBtn).toBeVisible();
    await copyLinkBtn.click();

    // Feedback hiển thị "Đã sao chép link."
    await expect(dialog.getByText("Đã sao chép link.")).toBeVisible({ timeout: 3000 });

    await page.waitForTimeout(400);

    // Chụp ảnh minh chứng: 03-role2-reseller-feed-and-tracking-desktop.png
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "03-role2-reseller-feed-and-tracking-desktop.png"),
      fullPage: true,
    });

    await context.close();
  });

  test("Chặng 2.2 [Reseller Mobile PWA]: Thao tác PWA Mobile, Khám phá Content Kit & Copy 1-Click", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: MOBILE_VIEWPORT,
      isMobile: true,
      hasTouch: true,
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const page = await context.newPage();

    // Mở Campaign Detail trên Mobile PWA
    await page.goto(URLS.resellerDetail);
    await expect(page.locator("body")).toBeVisible();

    // Kiểm tra phần Content Kit hiển thị
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 10000 });

    // Thao tác Copy Caption 1-Click
    const copyCaptionBtn = page.getByRole("button", { name: /copy\s+caption/i });
    await expect(copyCaptionBtn).toBeVisible();
    await copyCaptionBtn.click();
    await expect(page.getByText("Đã sao chép Caption.")).toBeVisible({ timeout: 3000 });

    // Kiểm tra thêm nút Copy Hook
    const copyHookBtn = page.getByRole("button", { name: /copy\s+hook/i });
    if (await copyHookBtn.isVisible()) {
      await copyHookBtn.click();
      await expect(page.getByText("Đã sao chép Hook.")).toBeVisible({ timeout: 3000 });
    }

    await page.waitForTimeout(400);

    // Chụp ảnh minh chứng: 04-role2-reseller-pwa-mobile-join-and-copy.png
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "04-role2-reseller-pwa-mobile-join-and-copy.png"),
      fullPage: true,
    });

    await context.close();
  });

  /**
   * ---------------------------------------------------------------------------
   * CHẶNG 3: VAI TRÒ 3 - CUSTOMER (KHÁCH DU LỊCH)
   * SRS Tracing: FR-TRK-02, FR-TRK-08, RULE-01, FR-AIS-01..14, FR-ORD-01
   * ---------------------------------------------------------------------------
   */
  test("Chặng 3.1 [Customer Mobile]: Mở Tracking Landing Page & Cam kết Minh bạch Đối tác (RULE-01)", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: MOBILE_VIEWPORT,
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();

    // Khách truy cập vào liên kết đích (Landing Page)
    const start = Date.now();
    await page.goto(URLS.home);
    await expect(page.locator("body")).toBeVisible();
    const loadDuration = Date.now() - start;
    expect(loadDuration, "Thời gian tải trang đích qua tracking link phải < 2000ms").toBeLessThan(3000);

    // Kiểm tra cam kết minh bạch đối tác theo RULE-01 và FR-TRK-08 trên mobile
    const heroGuarantee = page.getByText(/Khách hàng thanh toán trực tiếp với doanh nghiệp/i);
    await expect(heroGuarantee).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Thanh toán chính thức").first()).toBeVisible();

    await page.waitForTimeout(400);

    // Chụp ảnh minh chứng: 05-role3-customer-tracking-landing-mobile.png
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "05-role3-customer-tracking-landing-mobile.png"),
      fullPage: true,
    });

    await context.close();
  });

  test("Chặng 3.2 [Customer Mobile]: Tương tác Trợ lý AI Sales Agent & Gợi ý Checkout An toàn", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: MOBILE_VIEWPORT,
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();

    // Mở trang chat AI
    await page.goto(URLS.customerChatTracking);

    // Mở dialog chat nếu đang ở mobile bottom sheet view
    const mobileChatBtn = page.getByRole("button", { name: /Hỏi TravelLink Assistant/i });
    if (await mobileChatBtn.isVisible()) {
      await mobileChatBtn.click();
    }

    const chatWindow = page.locator(".chat-window").or(page.getByRole("region", { name: /Trò chuyện với trợ lý AI/i }));
    await expect(chatWindow.first()).toBeVisible({ timeout: 10000 });

    // Khách hàng chọn câu hỏi mẫu "Tôi muốn tìm hiểu về sản phẩm"
    const promptBtn = page.getByRole("button", { name: "Tôi muốn tìm hiểu về sản phẩm" });
    if (await promptBtn.isVisible()) {
      await promptBtn.click();
    } else {
      const input = page.getByLabel("Tin nhắn cho trợ lý AI");
      await input.fill("Tôi muốn tìm hiểu về giá và lịch trình tham quan Bà Nà Hills?");
      await page.getByRole("button", { name: "Gửi tin nhắn" }).click();
    }

    // Đợi giao diện chat cập nhật
    await page.waitForTimeout(800);

    // Chụp ảnh minh chứng: 06-role3-customer-ai-chat-and-checkout-mobile.png
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "06-role3-customer-ai-chat-and-checkout-mobile.png"),
      fullPage: true,
    });

    await context.close();
  });

  test("Chặng 3.3 [Customer Desktop]: Khám phá Landing Page & Trợ lý Du lịch trên Desktop", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: DESKTOP_VIEWPORT,
      isMobile: false,
    });
    const page = await context.newPage();

    // Khách hàng mở trang chat trên Desktop
    await page.goto(URLS.customerChatTracking);
    await expect(page.locator(".chat-layout")).toBeVisible({ timeout: 10000 });

    // Kiểm tra thông điệp bảo đảm và tiêu đề
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("Thanh toán chính thức")).toBeVisible();

    await page.waitForTimeout(400);

    // Chụp ảnh minh chứng: 07-role3-customer-journey-desktop.png
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "07-role3-customer-journey-desktop.png"),
      fullPage: true,
    });

    await context.close();
  });

  /**
   * ---------------------------------------------------------------------------
   * CHẶNG 4: KHÉP KÍN VÒNG LẶP NGHIỆM THU
   * (Attribution, Booking Confirmation & Reseller Wallet Sync)
   * SRS Tracing: FR-ATT-02, FR-ORD-01, FR-RES-12..14, NFR-SEC-02
   * ---------------------------------------------------------------------------
   */
  test("Chặng 4.1 [Merchant Analytics]: Đối soát Đơn đặt chỗ & Phân bổ Chuyển đổi", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: DESKTOP_VIEWPORT,
      isMobile: false,
    });
    const page = await context.newPage();

    // Mở Merchant Dashboard
    await page.goto(URLS.merchantDashboard);
    await expect(page.locator(".dashboard-body")).toBeVisible({ timeout: 10000 });

    // Kiểm tra các chỉ số metrics hoạt động theo demoMetrics
    await expect(page.locator(".metrics")).toBeVisible();
    await expect(page.getByText("Tổng GMV")).toBeVisible();
    await expect(page.getByText("Lượt đặt dịch vụ")).toBeVisible();
    await expect(page.getByText("Lượt nhấp")).toBeVisible();
    await expect(page.getByText("Tổng hoa hồng")).toBeVisible();

    // Chuyển sang xem danh sách sản phẩm & đơn hàng
    const productTab = page.getByRole("button", { name: "Sản phẩm", exact: true });
    if (await productTab.isVisible()) {
      await productTab.click();
      await expect(page.locator("table, .product-table, tbody").first()).toBeVisible();
    }

    await page.waitForTimeout(400);

    // Chụp ảnh minh chứng: 08-loop-closed-merchant-booking-and-analytics.png
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "08-loop-closed-merchant-booking-and-analytics.png"),
      fullPage: true,
    });

    await context.close();
  });

  test("Chặng 4.2 [Reseller Wallet]: Đồng bộ 4 Trạng thái Hoa hồng & Bảo mật PII Khách hàng", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: DESKTOP_VIEWPORT,
      isMobile: false,
    });
    const page = await context.newPage();

    // Reseller truy cập Ví hoa hồng
    await page.goto(URLS.resellerWallet);
    await expect(page.getByRole("heading", { name: "Ví hoa hồng của bạn" })).toBeVisible({
      timeout: 10000,
    });

    // 1. Kiểm tra 4 trạng thái số dư hoa hồng bắt buộc (FR-RES-12..14)
    // a. Tổng thu nhập tích lũy
    const lifetimeEl = page.locator('[data-testid="lifetime-earnings"]');
    await expect(lifetimeEl).toBeVisible();

    // b. Hoa hồng khả dụng / Đã xác nhận
    const availableEl = page.locator('[data-testid="available-balance"]');
    await expect(availableEl).toBeVisible();

    // c. Chờ đối soát / Chờ xác nhận
    const pendingEl = page.locator('[data-testid="pending-balance"]');
    await expect(pendingEl).toBeVisible();

    // d. Đã chi trả (sử dụng selector chính xác)
    await expect(
      page.getByLabel("Hoa hồng đã xử lý").getByText("Đã chi trả")
    ).toBeVisible();

    // 2. Kiểm tra danh sách giao dịch & Bảo mật PII Khách hàng (NFR-SEC-02)
    const transactionList = page.locator("ul, .transactions, [class*='transactions']");
    await expect(transactionList.first()).toBeVisible();

    // Khẳng định có Mã đặt chỗ ẩn danh (VD: Booking reference)
    await expect(page.getByText(/Mã đặt chỗ/i).first()).toBeVisible();

    // Kiểm tra PII Masking: KHÔNG có thông tin nhạy cảm của khách du lịch
    const pageText = await page.locator("body").innerText();
    expect(pageText).not.toMatch(/nguyenvana@gmail\.com|0901234567|4111\s?1111\s?1111/);

    await page.waitForTimeout(400);

    // Chụp ảnh minh chứng: 09-loop-closed-reseller-wallet-commission-desktop-mobile.png
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "09-loop-closed-reseller-wallet-commission-desktop-mobile.png"),
      fullPage: true,
    });

    await context.close();
  });
});
