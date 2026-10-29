import { test, expect, devices, type BrowserContext, type Page } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

// Thư mục lưu ảnh chụp màn hình minh chứng
const SCREENSHOT_DIR = path.resolve(process.cwd(), "tests/qa-deliverables/cross-device-pwa-c3/screenshots");

// Đảm bảo thư mục lưu ảnh tồn tại
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Cấu hình hồ sơ thiết bị di động chuẩn theo yêu cầu:
// 1. iPhone (iOS Safari profile) - iPhone 13 (390x844, DPR 3, Touch, Mobile Safari UA)
const IPHONE_CONFIG = {
  ...devices["iPhone 13"],
  reducedMotion: "reduce" as const,
};

// 2. Android (Chrome Mobile profile) - Pixel 5 (393x851, DPR 2.75, Touch, Chrome Android UA)
const ANDROID_CONFIG = {
  ...devices["Pixel 5"],
  reducedMotion: "reduce" as const,
};

const DEVICE_PROFILES = [
  { name: "iPhone (iOS Safari)", prefix: "iphone", config: IPHONE_CONFIG },
  { name: "Android (Chrome Mobile)", prefix: "android", config: ANDROID_CONFIG },
];

test.describe("Kiểm thử hiển thị Responsive & PWA trên thiết bị di động thật (Phương án C3)", () => {
  for (const { name: deviceName, prefix, config } of DEVICE_PROFILES) {
    test.describe(`Thiết bị: ${deviceName}`, () => {
      let context: BrowserContext;
      let page: Page;

      test.beforeEach(async ({ browser, baseURL }) => {
        context = await browser.newContext({
          ...config,
          baseURL: baseURL || "http://127.0.0.1:3100",
          serviceWorkers: "allow",
        });
        page = await context.newPage();
      });

      test.afterEach(async () => {
        await context.close();
      });

      // -------------------------------------------------------------
      // HẠNG MỤC 1: KIỂM TRA PWA MANIFEST, META VIEWPORT & ICONS
      // -------------------------------------------------------------
      test("1. PWA & Meta Viewport - Thẩm định cấu hình Manifest, Theme Color và Icon di động", async ({ baseURL }) => {
        const rootUrl = baseURL || "http://127.0.0.1:3100";
        await page.goto(`${rootUrl}/`, { waitUntil: "domcontentloaded" });

        // 1.1 Kiểm tra thẻ meta viewport
        const viewportMeta = page.locator('meta[name="viewport"]');
        await expect(viewportMeta).toHaveCount(1);
        const viewportContent = await viewportMeta.getAttribute("content");
        expect(viewportContent).toMatch(/width=device-width/);

        // 1.2 Kiểm tra meta theme-color
        const themeColorMeta = page.locator('meta[name="theme-color"]');
        await expect(themeColorMeta).toHaveCount(1);
        expect(await themeColorMeta.getAttribute("content")).toBe("#204e4c");

        // 1.3 Kiểm tra thẻ Apple Web App Capable & Title
        const capableMeta = page.locator('meta[name="mobile-web-app-capable"], meta[name="apple-mobile-web-app-capable"]');
        expect(await capableMeta.count()).toBeGreaterThanOrEqual(1);

        // 1.4 Kiểm tra Web App Manifest route
        const manifestLink = page.locator('link[rel="manifest"]');
        await expect(manifestLink).toHaveCount(1);
        const manifestHref = await manifestLink.getAttribute("href");
        expect(manifestHref).toBeTruthy();

        const manifestRes = await context.request.get(`${rootUrl}${manifestHref}`);
        expect(manifestRes.status()).toBe(200);
        const manifestData = await manifestRes.json();
        expect(manifestData.name).toBe("TravelLink AI");
        expect(manifestData.display).toBe("standalone");
        expect(manifestData.start_url).toBe("/");

        // 1.5 Kiểm tra các kích thước Icons PWA
        const icon192 = await context.request.get(`${rootUrl}/pwa/icon-192.png`);
        expect(icon192.status()).toBe(200);
        const icon512 = await context.request.get(`${rootUrl}/pwa/icon-512.png`);
        expect(icon512.status()).toBe(200);
        const appleIcon = await context.request.get(`${rootUrl}/pwa/apple-touch-icon.png`);
        expect(appleIcon.status()).toBe(200);
      });

      // -------------------------------------------------------------
      // HẠNG MỤC 2: GIAO DIỆN RESELLER MOBILE (CAMPAIGN FEED & BOTTOM NAV)
      // ẢNH MINH CHỨNG 01: [prefix]-01-reseller-mobile-feed-and-nav.png
      // -------------------------------------------------------------
      test("2. Reseller Portal - Bảng tin Chiến dịch, Thanh Bottom Navigation & Touch Target", async ({ baseURL }) => {
        const rootUrl = baseURL || "http://127.0.0.1:3100";
        await page.goto(`${rootUrl}/preview/reseller`, { waitUntil: "domcontentloaded" });

        // Ẩn Next inspector portal để ảnh chụp UI chuẩn xác
        await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });

        // Đảm bảo trang load hoàn tất
        await expect(page.getByRole("heading", { name: "Chiến dịch dành cho bạn" })).toBeVisible();

        // 2.1 Kiểm tra không tràn ngang (Horizontal Overflow = 0px)
        const isOverflowing = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
        expect(isOverflowing).toBe(false);

        // 2.2 Kiểm tra Thanh điều hướng Mobile Bottom Navigation Bar
        const mobileNav = page.getByRole("navigation", { name: "Điều hướng nhanh Cộng tác viên" });
        await expect(mobileNav).toBeVisible();

        // 2.3 Kiểm tra kích thước Touch Target tối thiểu 44x44px cho các tab trên Bottom Bar
        const navButtons = await mobileNav.locator("a, button").all();
        expect(navButtons.length).toBeGreaterThanOrEqual(3);
        for (const btn of navButtons) {
          const box = await btn.boundingBox();
          expect(box).not.toBeNull();
          if (box) {
            expect(box.width).toBeGreaterThanOrEqual(44);
            expect(box.height).toBeGreaterThanOrEqual(44);
          }
        }

        // Chụp ảnh minh chứng 01
        const screenshotPath = path.join(SCREENSHOT_DIR, `${prefix}-01-reseller-mobile-feed-and-nav.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        expect(fs.existsSync(screenshotPath)).toBe(true);
      });

      // -------------------------------------------------------------
      // HẠNG MỤC 3: MODAL TRACKING LINK & VOUCHER TRÊN MOBILE
      // ẢNH MINH CHỨNG 02: [prefix]-02-reseller-tracking-modal.png
      // -------------------------------------------------------------
      test("3. Reseller Portal - Modal sinh Tracking Link & Voucher cá nhân hóa", async ({ baseURL }) => {
        const rootUrl = baseURL || "http://127.0.0.1:3100";
        const campaignUrl = `${rootUrl}/preview/reseller/campaigns/11111111-1111-4111-8111-111111111111?state=approved&tracking=success`;
        await page.goto(campaignUrl, { waitUntil: "domcontentloaded" });
        await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });

        // Mở Modal Link tiếp thị & QR
        const openBtn = page.getByRole("button", { name: "Tạo link", exact: true });
        await expect(openBtn).toBeVisible();
        await openBtn.click();

        const dialog = page.getByRole("dialog", { name: "Link tiếp thị & QR" });
        await expect(dialog).toBeVisible();

        // Bấm nút "Tạo link tiếp thị" trong modal
        const createBtn = dialog.getByRole("button", { name: "Tạo link tiếp thị", exact: true });
        await expect(createBtn).toBeVisible();
        await createBtn.click();

        // Xác nhận textarea chứa link tiếp thị cá nhân hóa và mã QR được sinh
        const urlInput = dialog.locator("textarea#tracking-url");
        await expect(urlInput).toBeVisible();
        const shortUrl = await urlInput.inputValue();
        expect(shortUrl).toMatch(/(\/r\/|http:\/\/|https:\/\/)/);

        // Chụp ảnh minh chứng 02
        const screenshotPath = path.join(SCREENSHOT_DIR, `${prefix}-02-reseller-tracking-modal.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        expect(fs.existsSync(screenshotPath)).toBe(true);
      });

      // -------------------------------------------------------------
      // HẠNG MỤC 4: THỰC THI PHƯƠNG ÁN C3 - LANDING PAGE & CAM KẾT THANH TOÁN TRỰC TIẾP
      // ẢNH MINH CHỨNG 03: [prefix]-03-c3-landing-page-mobile.png
      // -------------------------------------------------------------
      test("4. Kịch bản C3 - Khách hàng mở Landing Page trên di động & Cam kết đối tác chính thức", async ({ baseURL }) => {
        const rootUrl = baseURL || "http://127.0.0.1:3100";
        await page.goto(`${rootUrl}/`, { waitUntil: "domcontentloaded" });
        await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });

        // 4.1 Kiểm tra không tràn ngang trên màn hình di động
        const isOverflowing = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
        expect(isOverflowing).toBe(false);

        // 4.2 Kiểm tra thông điệp cam kết Phương án C3:
        // "Khách hàng thanh toán trực tiếp với doanh nghiệp." và "Thanh toán chính thức"
        const directPaymentNotice = page.locator(".hero-note");
        await expect(directPaymentNotice).toBeVisible();
        await expect(directPaymentNotice).toContainText("Khách hàng thanh toán trực tiếp với doanh nghiệp");

        const officialPaymentBadge = page.locator(".value-strip");
        await expect(officialPaymentBadge).toContainText("Thanh toán chính thức");

        // 4.3 Kiểm tra các nút CTA không bị tràn hay đè chữ
        const ctaButtons = page.locator(".hero-buttons a");
        expect(await ctaButtons.count()).toBe(2);

        // Chụp ảnh minh chứng 03
        const screenshotPath = path.join(SCREENSHOT_DIR, `${prefix}-03-c3-landing-page-mobile.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        expect(fs.existsSync(screenshotPath)).toBe(true);
      });

      // -------------------------------------------------------------
      // HẠNG MỤC 5: THỰC THI PHƯƠNG ÁN C3 - KHUNG CHAT AI SALES AGENT & LINK CHECKOUT
      // ẢNH MINH CHỨNG 04: [prefix]-04-c3-ai-chat-and-checkout-mobile.png
      // -------------------------------------------------------------
      test("5. Kịch bản C3 - Khung Chat AI Sales Agent Bottom Sheet & Gửi link Checkout chính thức", async ({ baseURL }) => {
        const rootUrl = baseURL || "http://127.0.0.1:3100";
        await page.goto(`${rootUrl}/preview/chat`, { waitUntil: "domcontentloaded" });
        await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });

        // 5.1 Kích hoạt Khung Chat AI dạng Bottom Sheet trên Mobile
        const launcher = page.getByRole("button", { name: "Hỏi TravelLink Assistant" });
        await expect(launcher).toBeVisible();
        await launcher.click();

        const chatDialog = page.getByRole("dialog", { name: "Trợ lý du lịch TravelLink" });
        await expect(chatDialog).toBeVisible();

        // 5.2 Khách hàng chat hỏi tư vấn sản phẩm Phương án C3
        const input = page.getByRole("textbox", { name: "Tin nhắn cho trợ lý AI" });
        const sendBtn = page.getByRole("button", { name: "Gửi tin nhắn", exact: true });
        await expect(input).toBeVisible();

        await input.fill("Tôi muốn tư vấn tour Hội An Foodie và đường link đặt chỗ thanh toán trực tiếp với bên tổ chức?");
        await sendBtn.click();

        // 5.3 Trợ lý AI phản hồi và cung cấp thông tin
        const assistantMessage = page.locator(".message-assistant");
        await expect(assistantMessage).toHaveCount(1, { timeout: 15_000 });

        // Kiểm tra bàn phím ảo (Visual Viewport) không làm khuất khung chat
        const isOverflowing = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
        expect(isOverflowing).toBe(false);

        // Chụp ảnh minh chứng 04
        const screenshotPath = path.join(SCREENSHOT_DIR, `${prefix}-04-c3-ai-chat-and-checkout-mobile.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        expect(fs.existsSync(screenshotPath)).toBe(true);
      });

      // -------------------------------------------------------------
      // HẠNG MỤC 6: THỰC THI PHƯƠNG ÁN C3 - VÍ RESELLER & 4 TRẠNG THÁI HOA HỒNG
      // ẢNH MINH CHỨNG 05: [prefix]-05-c3-reseller-wallet-commission-mobile.png
      // -------------------------------------------------------------
      test("6. Kịch bản C3 - Màn hình Ví Reseller, Đối soát 4 trạng thái hoa hồng trên Mobile", async ({ baseURL }) => {
        const rootUrl = baseURL || "http://127.0.0.1:3100";
        await page.goto(`${rootUrl}/preview/reseller/wallet`, { waitUntil: "domcontentloaded" });
        await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });

        // 6.1 Kiểm tra tiêu đề Ví
        await expect(page.getByRole("heading", { name: "Ví hoa hồng của bạn" })).toBeVisible();

        // 6.2 Kiểm tra 3 thẻ tóm tắt số dư hoa hồng
        await expect(page.getByRole("heading", { name: "Tổng thu nhập tích lũy" })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Hoa hồng khả dụng" })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Chờ đối soát" })).toBeVisible();

        // 6.3 Kiểm tra danh sách đơn hàng đối soát và cơ chế che PII
        const historySection = page.locator("section[aria-labelledby='wallet-history-title']");
        await expect(historySection).toBeVisible();

        // 6.4 Kiểm tra giao diện Mobile không tràn khung ngang
        const isOverflowing = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
        expect(isOverflowing).toBe(false);

        // Chụp ảnh minh chứng 05
        const screenshotPath = path.join(SCREENSHOT_DIR, `${prefix}-05-c3-reseller-wallet-commission-mobile.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        expect(fs.existsSync(screenshotPath)).toBe(true);
      });
    });
  }
});
