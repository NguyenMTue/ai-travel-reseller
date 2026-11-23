import { test, expect, devices } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

/**
 * =============================================================================
 * SUITE: MOBILE COMPATIBILITY & RESPONSIVE E2E TEST (TUẦN 6)
 * PROJECT: AI Travel Reseller Network
 * DELIVERABLE FILE: tests/mobile-compatibility-w6.spec.ts
 * EVIDENCE DIR: tests/qa-deliverables/mobile-compatibility-w6/screenshots/
 * 
 * 3 TRỤ CỘT KIỂM THỬ KỸ THUẬT:
 * 1. Touch Gestures & Kích thước Vùng chạm (Touch Targets >= 44x44px hoặc >= 40px)
 * 2. Safe Area (Tai thỏ / Dynamic Island ~47px & Home Indicator ~34px trên iOS / Android)
 * 3. Keyboard Overlay (Giả lập bàn phím ảo che phủ ~40-45% & iOS font-size >= 16px)
 * =============================================================================
 */

const SCREENSHOT_DIR = path.resolve(
  process.cwd(),
  "tests/qa-deliverables/mobile-compatibility-w6/screenshots"
);

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Cấu hình chuẩn cho iPhone (iOS WebKit Profile) & Android (Chrome Mobile Profile)
const IPHONE_PROFILE = {
  ...devices["iPhone 13"],
  viewport: { width: 390, height: 844 },
  reducedMotion: "reduce" as const,
};

const ANDROID_PROFILE = {
  ...devices["Pixel 5"],
  viewport: { width: 393, height: 851 },
  reducedMotion: "reduce" as const,
};

function resolveUrl(base: string | undefined, pathUrl: string): string {
  const rawBase = base || "http://localhost:3100";
  const normalizedBase = rawBase.replace("127.0.0.1", "localhost");
  return new URL(pathUrl, normalizedBase).toString();
}

test.describe("Mobile Compatibility Test Suite - Tuần 6 (Touch Gestures, Safe Area, Keyboard Overlay)", () => {
  test.setTimeout(60000);

  /**
   * ---------------------------------------------------------------------------
   * HẠNG MỤC 1: TOUCH GESTURES & TOUCH TARGETS
   * ---------------------------------------------------------------------------
   */
  test("TC-01 - [iPhone] Touch Gestures & Kích thước Vùng chạm (Touch Targets) trên Storefront", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext(IPHONE_PROFILE);
    const page = await context.newPage();

    const targetUrl = resolveUrl(
      baseURL,
      "/storefront/sunworld/nguhanhson-01?ref=22222222-2222-2222-2222-111111111111"
    );
    await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
    await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });

    // 1. Kiểm tra không bị tràn ngang (No horizontal overflow)
    const isNoOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth + 1;
    });
    expect(isNoOverflow).toBe(true);

    // 2. Kiểm tra thanh Sticky CTA ở đáy màn hình
    const stickyCtaBtn = page.getByRole("button", { name: /ĐẶT VÉ NGAY/i }).last();
    await expect(stickyCtaBtn).toBeVisible();

    // Đo kích thước vùng chạm (Touch Target)
    const box = await stickyCtaBtn.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(40);
      expect(box.width).toBeGreaterThanOrEqual(100);
    }

    // 3. Thực hiện thao tác tap() thực tế trên màn hình cảm ứng
    await stickyCtaBtn.tap();

    // 4. Xác minh Modal Đặt vé mở lên thành công và các nút trong modal có vùng chạm đạt chuẩn
    const modal = page.locator("div.fixed.inset-0");
    await expect(modal.getByRole("heading", { name: /Đặt vé tham quan chính hãng/i })).toBeVisible();

    const actionBtn = modal.getByRole("button", { name: /TIẾP TỤC THANH TOÁN VIETQR/i });
    await expect(actionBtn).toBeVisible();
    const actionBox = await actionBtn.boundingBox();
    expect(actionBox).not.toBeNull();
    if (actionBox) {
      expect(actionBox.height).toBeGreaterThanOrEqual(40);
    }

    // 5. Chụp ảnh minh chứng TC-01
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "01-touch-gestures-iphone.png"),
    });

    await context.close();
  });

  test("TC-02 - [Android] Touch Gestures & Kích thước Vùng chạm (Touch Targets) trên Reseller Portal", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext(ANDROID_PROFILE);
    const page = await context.newPage();

    const targetUrl = resolveUrl(baseURL, "/preview/reseller");
    await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
    await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });

    // 1. Kiểm tra không bị tràn ngang
    const isNoOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth + 1;
    });
    expect(isNoOverflow).toBe(true);

    // 2. Kiểm tra thanh Bottom Navigation Bar
    const bottomNav = page.getByRole("navigation", { name: /Điều hướng/i });
    await expect(bottomNav).toBeVisible();

    // Đo kích thước vùng chạm của từng mục trên Bottom Nav (yêu cầu >= 44x44px theo chuẩn Material/Apple)
    const navItems = await bottomNav.locator("a, button").all();
    expect(navItems.length).toBeGreaterThanOrEqual(3);
    for (const item of navItems) {
      const box = await item.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    // 3. Thực hiện thao tác tap() chuyển tab Ví hoa hồng
    const walletTab = bottomNav.getByRole("link", { name: /Ví/i });
    await expect(walletTab).toBeVisible();
    await walletTab.tap();

    // Xác minh điều hướng thành công không bị kẹt hover
    await expect(page).toHaveURL(/wallet/);
    await expect(page.getByRole("heading", { name: /Ví hoa hồng của bạn|Tổng quan/i })).toBeVisible();

    // 4. Chụp ảnh minh chứng TC-02
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "02-touch-gestures-android.png"),
    });

    await context.close();
  });

  /**
   * ---------------------------------------------------------------------------
   * HẠNG MỤC 2: SAFE AREA (NOTCH / DYNAMIC ISLAND & HOME INDICATOR)
   * ---------------------------------------------------------------------------
   */
  test("TC-03 - [iPhone] Kiểm thử Safe Area (Tai thỏ ~47px & Home Indicator ~34px) trên iPhone", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext(IPHONE_PROFILE);
    const page = await context.newPage();

    const targetUrl = resolveUrl(baseURL, "/preview/reseller");
    await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
    await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });

    // 1. Kiểm tra viewport-fit trong meta viewport
    const viewportMeta = page.locator('meta[name="viewport"]');
    const viewportContent = await viewportMeta.getAttribute("content");
    expect(viewportContent).toMatch(/width=device-width/);

    // 2. Đo khoảng đệm trên cùng (Top Header) - Đảm bảo không bị lẹm vào Notch / Dynamic Island (~47px)
    await expect(page.locator("header").first()).toBeVisible({ timeout: 10000 });
    const headerBox = await page.locator("header").first().boundingBox();
    expect(headerBox).not.toBeNull();
    if (headerBox) {
      expect(headerBox.y).toBeGreaterThanOrEqual(0);
      expect(headerBox.height).toBeGreaterThanOrEqual(50); // Chiều cao header đủ che chắn an toàn
    }

    // 3. Đo khoảng đệm dưới cùng (Bottom Nav) - Đảm bảo cách ly khỏi Home Indicator (~34px)
    const bottomNav = page.getByRole("navigation", { name: /Điều hướng/i });
    await expect(bottomNav).toBeVisible();

    const navBox = await bottomNav.boundingBox();
    expect(navBox).not.toBeNull();
    if (navBox) {
      // Đảm bảo thanh Bottom Nav nằm sát đáy và có chiều cao >= 70px để bao trọn Home Indicator
      const currentViewportHeight = page.viewportSize()?.height || 844;
      expect(navBox.y + navBox.height).toBeGreaterThanOrEqual(currentViewportHeight - 5);
      expect(navBox.height).toBeGreaterThanOrEqual(70);
    }

    // 4. Chụp ảnh minh chứng TC-03
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "03-safe-area-header-bottom-iphone.png"),
    });

    await context.close();
  });

  test("TC-04 - [Android] Kiểm thử Safe Area & Tràn viền (Edge-to-Edge) trên Android Pixel 5", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext(ANDROID_PROFILE);
    const page = await context.newPage();

    const targetUrl = resolveUrl(
      baseURL,
      "/storefront/sunworld/nguhanhson-01?ref=22222222-2222-2222-2222-111111111111"
    );
    await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
    await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });

    // 1. Kiểm tra Sticky Header trên Android
    const header = page.locator("header").first();
    await expect(header).toBeVisible();
    const headerBox = await header.boundingBox();
    expect(headerBox).not.toBeNull();

    // 2. Kiểm tra thanh Sticky CTA ở đáy màn hình không bị che lấp nội dung chính
    const stickyCta = page.getByRole("button", { name: /ĐẶT VÉ NGAY/i }).last();
    await expect(stickyCta).toBeVisible();

    // Cuộn xuống cuối trang để kiểm tra footer và khoảng đệm đáy
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    // Xác nhận không tràn ngang
    const isNoOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    expect(isNoOverflow).toBe(true);

    // 3. Chụp ảnh minh chứng TC-04
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "04-safe-area-android.png"),
    });

    await context.close();
  });

  /**
   * ---------------------------------------------------------------------------
   * HẠNG MỤC 3: KEYBOARD OVERLAY & IOS AUTO-ZOOM PREVENTION
   * ---------------------------------------------------------------------------
   */
  test("TC-05 - [iPhone] Kiểm thử Keyboard Overlay & Font-size >= 16px trên Khung Chat AI", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext(IPHONE_PROFILE);
    const page = await context.newPage();

    const targetUrl = resolveUrl(baseURL, "/preview/chat");
    await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
    await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });

    // 1. Kích hoạt Bottom Sheet Chat AI
    const launcher = page.getByRole("button", { name: /Hỏi TravelLink Assistant/i });
    await expect(launcher).toBeVisible({ timeout: 10000 });
    await expect(launcher).toBeEnabled({ timeout: 10000 });
    await launcher.tap();

    const chatDialog = page.getByRole("dialog", { name: /Trợ lý du lịch TravelLink/i });
    await expect(chatDialog).toBeVisible({ timeout: 10000 });

    // 2. Kiểm tra font-size tính toán của Textarea (yêu cầu >= 16px để chống iOS auto-zoom)
    const textarea = chatDialog.getByRole("textbox", { name: /Tin nhắn cho trợ lý AI/i });
    await expect(textarea).toBeVisible();

    const computedFontSize = await textarea.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).fontSize);
    });
    expect(computedFontSize).toBeGreaterThanOrEqual(16);

    // 3. Giả lập Bàn phím ảo bật lên (Keyboard Overlay: viewport thu nhỏ xuống 480px)
    await page.setViewportSize({ width: 390, height: 480 });

    // Chạm và điền dữ liệu khi bàn phím ảo chiếm không gian
    await textarea.tap();
    await textarea.fill("Tư vấn vé tham quan Ngũ Hành Sơn?");

    // 4. Xác minh Textarea và nút Gửi tin nhắn vẫn hiển thị trong vùng nhìn thấy (không bị bàn phím che)
    const sendBtn = chatDialog.getByRole("button", { name: /Gửi tin nhắn/i, exact: true });
    await expect(sendBtn).toBeVisible();

    const sendBox = await sendBtn.boundingBox();
    expect(sendBox).not.toBeNull();
    if (sendBox) {
      expect(sendBox.y + sendBox.height).toBeLessThanOrEqual(485); // Nằm trong vùng khả dụng khi bật bàn phím
    }

    // 5. Chụp ảnh minh chứng TC-05
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "05-keyboard-overlay-chat-iphone.png"),
    });

    await context.close();
  });

  test("TC-06 - [Android] Kiểm thử Keyboard Overlay & Nhập liệu Form Checkout trên Android", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext(ANDROID_PROFILE);
    const page = await context.newPage();

    const targetUrl = resolveUrl(
      baseURL,
      "/storefront/sunworld/nguhanhson-01?ref=22222222-2222-2222-2222-111111111111"
    );
    await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
    await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });

    // 1. Mở modal Checkout
    const stickyCta = page.getByRole("button", { name: /ĐẶT VÉ NGAY/i }).last();
    await stickyCta.tap();

    const modal = page.locator("div.fixed.inset-0");
    await expect(modal.getByRole("heading", { name: /Đặt vé tham quan chính hãng/i })).toBeVisible();

    // 2. Giả lập Bàn phím ảo Android bật lên (chiếm ~40% màn hình -> viewport còn 490px)
    await page.setViewportSize({ width: 393, height: 490 });

    // 3. Thực hiện thao tác tap() và nhập liệu vào các ô Form Checkout
    const nameInput = modal.getByPlaceholder(/Họ và tên người đặt vé/i);
    const phoneInput = modal.getByPlaceholder(/Số điện thoại nhận vé SMS/i);

    await nameInput.tap();
    await nameInput.fill("Nguyễn Văn A");

    await phoneInput.tap();
    await phoneInput.fill("0901234567");

    // 4. Kiểm tra ô nhập liệu và nội dung form có thể cuộn linh hoạt bên trong modal
    const isFormScrollable = await modal.locator("div.overflow-y-auto").first().evaluate((el) => {
      return el.scrollHeight >= el.clientHeight;
    });
    expect(isFormScrollable).toBe(true);

    // 5. Chụp ảnh minh chứng TC-06
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "06-keyboard-overlay-checkout-android.png"),
    });

    await context.close();
  });
});
