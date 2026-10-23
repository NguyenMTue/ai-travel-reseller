import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium, expect as baseExpect } from "@playwright/test";

const expect = baseExpect.configure({ timeout: 60000 });
const base = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3195";
const out = "build/fe-merchant-ai-video-evidence";
await mkdir(out, { recursive: true });

const browser = await chromium.launch({ headless: true });

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(60000);
  page.setDefaultTimeout(60000);

  const consoleMessages = [];
  const pageErrors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Bỏ qua lỗi DNS của domain mock storage trong môi trường kiểm thử
      if (text.includes("storage.travellink.vn") || text.includes("ERR_NAME_NOT_RESOLVED")) return;
      consoleMessages.push(text);
    }
  });
  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
  });

  console.log("1. Logging in with Merchant account...");
  await page.goto(`${base}/login?next=%2Fmerchant%2Flibrary`, { waitUntil: "domcontentloaded" });
  await page.fill('input[type="email"]', "merchant@example.com");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');

  await page.waitForURL(`${base}/merchant/library`, { timeout: 30000 });
  console.log("✓ Logged in and redirected to /merchant/library.");

  // Wait for media cards to load
  console.log("2. Selecting a media reference template...");
  const statusEl = page.locator('div[aria-live="polite"]');
  await expect(statusEl).toContainText("mẫu", { timeout: 15000 });

  const articles = page.getByRole("article");
  await expect(articles).toHaveCount(6);

  const selectBtn = page.getByRole("button", { name: "Chọn mẫu", exact: true }).first();
  await selectBtn.click();

  // Verify selection banner
  const banner = page.locator('section[role="status"]');
  await expect(banner).toBeVisible();
  await expect(banner).toContainText("Đã chọn mẫu tham khảo");

  const generateBtn = page.getByRole("button", { name: "Tạo video từ mẫu đã chọn", exact: true });
  await expect(generateBtn).toBeVisible();
  console.log("✓ Button 'Tạo video từ mẫu đã chọn' displayed beside the selection banner.");

  await page.screenshot({ path: `${out}/01-selection-banner-with-button.png` });

  console.log("3. Opening Video Generation Modal...");
  await generateBtn.click();

  const modal = page.locator('dialog[aria-labelledby="video-generate-title"]');
  await expect(modal).toBeVisible();
  await expect(page.locator("#video-generate-title")).toContainText("Tạo video AI từ mẫu tham khảo");

  // Verify campaign selection
  const campaignSelect = page.locator("#select-campaign");
  await expect(campaignSelect).toBeVisible();
  const campaignText = await campaignSelect.textContent();
  console.log(`✓ Campaign select loaded: "${campaignText?.trim()}"`);
  assert(campaignText?.includes("Bà Nà Hills"), "Must load Sun World campaign");

  await page.screenshot({ path: `${out}/02-generation-modal-config.png` });

  console.log("4. Triggering AI Video Generation Pipeline...");
  const startBtn = page.getByRole("button", { name: "Bắt đầu tạo video AI", exact: true });
  await startBtn.click();

  // Verify progress / generating indicator
  await expect(page.locator("#video-generate-title")).toContainText("Đang tổng hợp video AI", { timeout: 5000 });
  await page.screenshot({ path: `${out}/03-generation-in-progress.png` });
  console.log("✓ Progress bar and pipeline stages visible.");

  // Wait for completion (ready status)
  console.log("5. Waiting for AI Video completion and Polling Status...");
  await expect(page.locator("#video-generate-title")).toContainText("Video AI của bạn đã sẵn sàng!", { timeout: 30000 });
  console.log("✓ AI Video generation finished and polling status returned ready.");

  // Verify video preview element
  const videoEl = modal.locator("video");
  await expect(videoEl).toBeVisible();
  const videoSrc = await videoEl.getAttribute("src");
  console.log(`✓ Video preview player loaded with src: ${videoSrc}`);
  assert(videoSrc && videoSrc.includes("campaign-videos"), "Video URL must point to generated campaign video");

  // Verify Hook and script
  await expect(modal).toContainText("Hook mở đầu");
  await expect(modal).toContainText("Kịch bản lồng tiếng");
  await expect(modal).toContainText("Tỷ lệ: 9:16");

  await page.screenshot({ path: `${out}/04-generated-video-preview.png` });

  console.log("6. Testing Copy Video Link button...");
  const copyBtn = modal.getByRole("button", { name: "Sao chép link video" });
  await copyBtn.click();
  await expect(modal.getByRole("button", { name: "Đã sao chép link!" })).toBeVisible();
  console.log("✓ Copy video link feedback verified.");

  console.log("7. Closing Modal...");
  const doneBtn = modal.getByRole("button", { name: "Hoàn tất", exact: true });
  await doneBtn.click();
  await expect(modal).not.toBeVisible();
  console.log("✓ Modal closed successfully.");

  // Check console errors
  console.log("8. Checking console errors...");
  console.log("Errors:", pageErrors);
  console.log("Console errors:", consoleMessages);
  assert.deepEqual(pageErrors, [], "Should have no unhandled page errors");

  console.log("=== ALL AI VIDEO GENERATION LIVE TESTS PASSED SUCCESSFULLY ===");
} finally {
  await browser.close();
}
