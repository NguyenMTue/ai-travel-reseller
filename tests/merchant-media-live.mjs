import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium, expect as baseExpect } from "@playwright/test";

const expect = baseExpect.configure({ timeout: 60000 });
const base = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3195";
const out = "build/fe-w3-live-media-evidence";
await mkdir(out, { recursive: true });

const browser = await chromium.launch({ headless: true });

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(60000);
  page.setDefaultTimeout(60000);
  const consoleMessages = [];
  const pageErrors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleMessages.push(msg.text());
    }
  });
  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
  });

  console.log("1. Testing unauthenticated access to /merchant/library...");
  await page.goto(`${base}/merchant/library`, { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/login\?next=%2Fmerchant%2Flibrary/);
  console.log("✓ Correctly redirected to login page.");

  console.log("2. Logging in with merchant credentials...");
  await page.fill('input[type="email"]', "merchant@example.com");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');

  await page.waitForURL(`${base}/merchant/library`, { timeout: 30000 });
  console.log("✓ Logged in and redirected to /merchant/library.");

  // Wait for media cards to load
  console.log("3. Verifying live Media Library data...");
  const statusEl = page.locator('div[aria-live="polite"]');
  await expect(statusEl).toContainText("mẫu", { timeout: 15000 });
  const statusText = await statusEl.textContent();
  console.log(`✓ Library status: "${statusText?.trim()}"`);

  // Expect 6 cards on page 1
  const articles = page.getByRole("article");
  await expect(articles).toHaveCount(6);
  console.log("✓ Page 1 successfully rendered 6 media cards.");

  // Verify first card contents
  const firstTitle = await articles.first().locator("h3").textContent();
  console.log(`✓ First card title: "${firstTitle?.trim()}"`);
  assert(firstTitle && firstTitle.length > 0, "Card title should not be empty");

  // Take screenshot of desktop view
  await page.screenshot({ path: `${out}/live-merchant-desktop.png`, fullPage: true });

  console.log("4. Testing Card Selection...");
  const selectBtn = page.getByRole("button", { name: "Chọn mẫu", exact: true }).first();
  await selectBtn.click();
  await expect(page.getByRole("button", { name: "Đã chọn", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Chỉ đánh dấu trong phiên này", { exact: false })).toBeVisible();
  console.log("✓ Card selection state and banner verified.");

  const deselectBtn = page.getByRole("button", { name: "Bỏ chọn mẫu" });
  await deselectBtn.click();
  await expect(page.getByText("Chỉ đánh dấu trong phiên này", { exact: false })).toHaveCount(0);
  console.log("✓ Card deselection verified.");

  console.log("5. Testing 'Quy chuẩn video' modal...");
  const guideBtn = page.getByRole("button", { name: "Quy chuẩn video", exact: true });
  await guideBtn.click();
  const modal = page.getByRole("dialog", { name: "Quy chuẩn video du lịch" });
  await expect(modal).toBeVisible();
  await page.screenshot({ path: `${out}/live-guidelines-modal.png` });
  await page.keyboard.press("Escape");
  await expect(modal).not.toBeVisible();
  console.log("✓ Video guidelines modal opened and closed via Escape.");

  console.log("6. Testing Pagination...");
  const nextBtn = page.getByRole("button", { name: "Sau", exact: true });
  await expect(nextBtn).toBeEnabled();
  await nextBtn.click();
  await expect(page.getByText("Trang 2 /", { exact: false })).toBeVisible();
  await expect(articles).toHaveCount(6);
  console.log("✓ Pagination navigated to Page 2 successfully.");

  const prevBtn = page.getByRole("button", { name: "Trước", exact: true });
  await prevBtn.click();
  await expect(page.getByText("Trang 1 /", { exact: false })).toBeVisible();
  console.log("✓ Returned to Page 1.");

  console.log("7. Testing Search...");
  const searchInput = page.getByRole("searchbox", { name: "Tìm theo tiêu đề" });
  await searchInput.fill("Cầu Vàng");
  await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
  await expect(statusEl).toContainText("Cầu Vàng");
  const filteredCount = await articles.count();
  console.log(`✓ Search for 'Cầu Vàng' returned ${filteredCount} item(s).`);
  assert(filteredCount > 0, "Search should return matching items");

  console.log("8. Testing Reset Filters...");
  await page.getByRole("button", { name: "Xóa bộ lọc" }).click();
  await expect(articles).toHaveCount(6);
  console.log("✓ Filter reset restored 6 items.");

  console.log("9. Testing Mobile Viewport (390px)...");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  // Check horizontal overflow
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  assert.equal(hasOverflow, false, "Mobile viewport should not have horizontal overflow");
  await page.screenshot({ path: `${out}/live-merchant-mobile-390.png`, fullPage: true });
  console.log("✓ Mobile viewport 390px rendered cleanly with no horizontal overflow.");

  console.log("10. Checking console errors...");
  console.log("Errors:", pageErrors);
  console.log("Console errors:", consoleMessages);
  assert.deepEqual(pageErrors, [], "Should have no unhandled page errors");

  console.log("=== ALL LIVE MERCHANT MEDIA LIBRARY TESTS PASSED ===");
} finally {
  await browser.close();
}
