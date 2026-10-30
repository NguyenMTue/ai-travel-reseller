import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";

const base = process.env.PREVIEW_BASE || "http://127.0.0.1:3114";
const out = "build/fe-w4-evidence";
await mkdir(out, { recursive: true });
const bytes = await readFile("public/campaign-videos/banahills-remediated.mp4");
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || "chrome" });
const context = await browser.newContext({ serviceWorkers: "block", acceptDownloads: true });
const errors = [], forbidden = [];
let sampleRequests = 0;
context.on("request", request => { if (new URL(request.url()).pathname === "/campaign-videos/banahills-remediated.mp4") sampleRequests++; });
await context.route("**/*", route => {
  const url = new URL(route.request().url());
  if (url.origin !== base || url.pathname.startsWith("/api/")) { forbidden.push(url.origin + url.pathname); return route.abort(); }
  return route.continue();
});
const page = await context.newPage();
await page.addInitScript(() => {
  window.fixtureObjects = new Set();
  const create = URL.createObjectURL.bind(URL), revoke = URL.revokeObjectURL.bind(URL);
  URL.createObjectURL = blob => { const url = create(blob); window.fixtureObjects.add(url); return url; };
  URL.revokeObjectURL = url => { window.fixtureObjects.delete(url); revoke(url); };
});
page.setDefaultTimeout(20000); page.setDefaultNavigationTimeout(180000);
page.on("pageerror", error => errors.push(error.message));
try {
  await page.goto(`${base}/preview/merchant/library`, { waitUntil: "domcontentloaded" });
  const section = page.getByRole("region", { name: "Mô phỏng player tuần 4" });
  const player = section.getByRole("region", { name: /^Video:/ });
  const select = section.getByRole("combobox");
  const button = player.getByRole("button", { name: "Tải MP4", exact: true });
  await expect(button).toBeEnabled();
  assert.equal(await player.locator("video").getAttribute("preload"), "none");
  assert.equal(await player.locator("video").getAttribute("autoplay"), null);
  assert.equal(await player.locator("video").evaluate(video => video.paused), true);
  await expect(player.getByText("Mô phỏng", { exact: false })).toBeVisible();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `overflow ${width}`);
    const frame = await player.locator("video").evaluate(video => { const r = video.getBoundingClientRect(); return { width: r.width, height: r.height, fit: getComputedStyle(video).objectFit }; });
    assert(Math.abs(frame.width / frame.height - 9 / 16) < 0.001); assert.equal(frame.fit, "contain");
    await section.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${out}/player-${width}.png` });
  }
  assert.equal(sampleRequests, 0, "preload none must not request MP4 before a user action");
  await player.locator("video").evaluate(video => video.play());
  await expect.poll(() => player.locator("video").evaluate(video => video.readyState)).toBeGreaterThanOrEqual(2);
  const dimensions = await player.locator("video").evaluate(video => [video.videoWidth, video.videoHeight]);
  assert(dimensions[0] > 0 && dimensions[1] > 0);
  await player.locator("video").evaluate(video => video.pause());
  const downloaded = page.waitForEvent("download"); await button.click(); const file = await downloaded;
  assert.match(file.suggestedFilename(), /^ba-na-hills-.*fixture-sample\.mp4$/);
  await file.saveAs(`${out}/downloaded.mp4`);
  const hash = b => createHash("sha256").update(b).digest("hex");
  assert.equal(hash(await readFile(`${out}/downloaded.mp4`)), hash(bytes));
  await expect(player.getByRole("status")).toContainText("chưa xác nhận file đã được lưu");
  assert.equal(await page.evaluate(() => window.fixtureObjects.size), 1);
  for (const scenario of ["missing", "invalid", "mock"]) {
    await select.selectOption(scenario); await expect(button).toBeDisabled(); await expect(player.locator("video")).toHaveCount(0);
  }
  assert.equal(await page.evaluate(() => window.fixtureObjects.size), 0, "object URL revoked on source change");
  let failPlayback;
  const playbackGate = new Promise(resolve => { failPlayback = resolve; });
  await page.route("**/campaign-videos/fixture-video-unavailable.mp4", async route => { await playbackGate; await route.fulfill({ status: 403, body: "expired" }); });
  await select.selectOption("expired");
  await player.locator("video").evaluate(video => { void video.play().catch(() => {}); });
  await expect(player.getByText("Đang tải video…", { exact: true })).toBeVisible();
  failPlayback();
  await expect(player.getByRole("alert").filter({ hasText: "Không phát được video." })).toBeVisible();
  await button.click(); await expect(player.getByRole("alert").filter({ hasText: "HTTP 403" })).toBeVisible();
  await select.selectOption("sample");
  const videoPattern = "**/campaign-videos/banahills-remediated.mp4";
  for (const [contentType, body] of [["text/html", "<html>error</html>"], ["video/mp4", ""], ["video/mp4", "<html>fake MP4 content</html>"]]) {
    await page.route(videoPattern, route => route.fulfill({ contentType, body }));
    await button.click(); await expect(player.getByRole("alert")).toBeVisible(); await expect(button).toBeEnabled();
    await page.unroute(videoPattern);
  }
  await page.route(videoPattern, route => route.abort("failed")); await button.click();
  await expect(player.getByRole("alert")).toContainText("kết nối hoặc CORS"); await page.unroute(videoPattern);
  let reads = 0, release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route(videoPattern, async route => { reads++; await gate; await route.fulfill({ contentType: "video/mp4", body: bytes }).catch(() => {}); });
  await button.evaluate(button => { button.click(); button.click(); });
  await expect(player.getByRole("button", { name: "Đang tải MP4…" })).toBeDisabled();
  await expect.poll(() => reads).toBe(1);
  await select.selectOption("missing"); release(); await expect(player.locator("video")).toHaveCount(0);
  await expect(button).toBeDisabled(); await expect(player.getByRole("status")).toBeEmpty(); await page.unroute(videoPattern);
  // Native generation dialog uses mocked HTTP only; no real AI endpoint is called.
  await page.route("**/api/merchant/campaigns", route => route.fulfill({ json: { success: true, data: [{ id: "fixture-campaign", name: "Chiến dịch dài ".repeat(18), productId: "fixture-product", productName: "Sản phẩm fixture" }] } }));
  const result = { content_id: "fixture-content", video_url: "/campaign-videos/banahills-remediated.mp4", status: "ready", hook: "Hook fixture ".repeat(40), script: "Script fixture", caption: "Caption fixture", duration_sec: 28 };
  await page.route("**/api/merchant/video/generate*", route => route.fulfill({ status: route.request().method() === "POST" ? 201 : 200, json: { success: true, data: result } }));
  await page.getByRole("button", { name: "Chọn mẫu", exact: true }).first().click();
  const opener = page.getByRole("button", { name: "Tạo video từ mẫu đã chọn" });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 }); await opener.click();
    const dialog = page.getByRole("dialog", { name: /Tạo video AI từ mẫu/ });
    await expect(dialog).toBeVisible(); await page.getByRole("button", { name: "Bắt đầu tạo video AI", exact: true }).click();
    const readyDialog = page.getByRole("dialog", { name: "Video AI của bạn đã sẵn sàng!" });
    await expect(readyDialog).toBeVisible();
    const overflow = await readyDialog.evaluate(el => ({ width: el.clientWidth, scroll: el.scrollWidth,
      offenders: [...el.querySelectorAll("*")].filter(child => child.getBoundingClientRect().right > el.getBoundingClientRect().right + 1).map(child => [child.tagName, child.className, child.getBoundingClientRect().width]) }));
    await page.screenshot({ path: `${out}/modal-${width}.png` });
    assert(overflow.scroll <= overflow.width + 1, `dialog overflow ${width}: ${JSON.stringify(overflow)}`);
    for (let i = 0; i < 8; i++) { await page.keyboard.press("Tab"); assert(await readyDialog.evaluate(el => el.contains(document.activeElement))); }
    for (let i = 0; i < 8; i++) { await page.keyboard.press("Shift+Tab"); assert(await readyDialog.evaluate(el => el.contains(document.activeElement))); }
    await readyDialog.locator("video").evaluate(video => video.play());
    await readyDialog.locator("video").evaluate(video => { window.fixtureOldVideo = video; });
    await page.screenshot({ path: `${out}/modal-${width}.png` });
    await page.keyboard.press("Escape"); await expect(readyDialog).not.toBeVisible();
    await expect(page.locator("dialog video")).toHaveCount(0); await expect(opener).toBeFocused();
    assert(await page.evaluate(() => window.fixtureOldVideo.paused && !window.fixtureOldVideo.hasAttribute("src")), "closed modal releases video");
  }
  // Closing during a pending download must not save the old result or leak its state.
  await opener.click();
  await page.getByRole("button", { name: "Bắt đầu tạo video AI", exact: true }).click();
  const closingDialog = page.getByRole("dialog", { name: "Video AI của bạn đã sẵn sàng!" });
  let finishDownload, pendingReads = 0, lateDownloads = 0;
  const pendingGate = new Promise(resolve => { finishDownload = resolve; });
  page.on("download", () => { lateDownloads++; });
  await page.route(videoPattern, async route => { pendingReads++; await pendingGate; await route.fulfill({ contentType: "video/mp4", body: bytes }).catch(() => {}); });
  await closingDialog.getByRole("button", { name: "Tải MP4", exact: true }).click();
  await expect.poll(() => pendingReads).toBe(1);
  await closingDialog.getByRole("button", { name: "Đóng cửa sổ tạo video", exact: true }).click();
  finishDownload();
  await expect(closingDialog).toHaveCount(0);
  await expect(page.locator("dialog video")).toHaveCount(0);
  await expect(opener).toBeFocused();
  await opener.click();
  const freshDialog = page.getByRole("dialog", { name: "Tạo video AI từ mẫu tham khảo", exact: true });
  await expect(freshDialog).toBeVisible();
  await expect(freshDialog.getByRole("button", { name: "Bắt đầu tạo video AI", exact: true })).toBeEnabled();
  await expect(freshDialog.locator("video")).toHaveCount(0);
  assert.equal(lateDownloads, 0);
  assert.equal(await page.evaluate(() => window.fixtureObjects.size), 0);
  await page.keyboard.press("Escape"); await expect(opener).toBeFocused();
  await page.unroute(videoPattern);
  assert.deepEqual(errors, []); assert.deepEqual(forbidden, []);
  console.log(`PASS player/download/modal at 320/390/768/1440; MP4 ${dimensions.join("x")}, SHA256 ${hash(bytes)}; failure, duplicate, source change, focus, cleanup. No external/API service requests.`);
} finally { await browser.close(); }
