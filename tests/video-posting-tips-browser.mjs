import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.PREVIEW_BASE || "http://127.0.0.1:3114";
const route = "/preview/reseller/campaigns/11111111-1111-4111-8111-111111111111?state=approved";
const out = "build/fe-w4-04-integration-b87ecb6";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext({ serviceWorkers: "block", reducedMotion: "reduce" });
const forbidden = [], errors = [], results = [], measurements = [];
await context.route("**/*", requestRoute => {
  const request = requestRoute.request(), url = new URL(request.url());
  if (url.origin !== base || url.pathname.startsWith("/api/") || request.method() !== "GET") {
    forbidden.push(request.method() + " " + url.pathname); return requestRoute.abort();
  }
  return requestRoute.continue();
});
await context.addInitScript(() => {
  const counts = {};
  for (const [label, target, types] of [["window", window, ["resize"]], ["visualViewport", visualViewport, ["resize", "scroll"]]]) {
    const callbacks = new Map(types.map(type => [type, new Set()]));
    const add = target.addEventListener, remove = target.removeEventListener;
    target.addEventListener = function (type, callback, options) { callbacks.get(type)?.add(callback); return add.call(this, type, callback, options); };
    target.removeEventListener = function (type, callback, options) { callbacks.get(type)?.delete(callback); return remove.call(this, type, callback, options); };
    for (const type of types) Object.defineProperty(counts, label + ":" + type, { enumerable: true, get: () => callbacks.get(type).size });
  }
  window.fixtureViewportListeners = () => ({ ...counts });
});
const page = await context.newPage();
page.setDefaultTimeout(20000); page.setDefaultNavigationTimeout(120000);
page.on("pageerror", error => errors.push(error.message));
const opener = page.getByRole("button", { name: "Mẹo đăng video hiệu quả", exact: true });
const modal = page.locator('[aria-labelledby="video-posting-tips-title"]');
const first = modal.getByRole("button", { name: "Đóng mẹo đăng video" });
const last = modal.getByRole("button", { name: "Đã hiểu", exact: true });
const overflow = () => page.evaluate(() => [document.body.style.overflow, document.documentElement.style.overflow]);
const listeners = () => page.evaluate(() => window.fixtureViewportListeners());
const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
async function ready() {
  await expect(opener).toBeVisible();
  // Bottom Nav switches its SSR placeholder to this anchor after hydration.
  // Its own viewport listener belongs in the baseline, not to the tips modal.
  await expect(page.locator('a[href="#reseller-content-kit"]')).toHaveCount(1);
  await settle();
}
async function open() { await opener.click(); await expect(modal).toBeVisible(); await expect(first).toBeFocused(); }
async function close(key = "Escape") { if (key === "Escape") await page.keyboard.press(key); else await last.click(); await expect(modal).not.toBeVisible(); await expect(opener).toBeFocused(); }
async function check(name, run) { try { await run(); results.push({ name, status: "PASS" }); console.log("PASS", name); } catch (error) { results.push({ name, status: "FAIL", error: error.message }); throw error; } }
try {
  for (const [width, height] of [[320, 740], [390, 844], [768, 900], [1440, 1000], [667, 320]]) {
    await page.setViewportSize({ width, height }); await page.goto(base + route); await expect(opener).toBeVisible(); await page.evaluate(() => document.fonts.ready);
    const before = await overflow(); await open();
    await check(`application modal content/bounds/44px ${width}x${height}`, async () => {
      await expect(modal).toHaveAccessibleName("Mẹo Đăng Video AI Triệu View Dành Cho Reseller");
      await expect(modal.locator("li")).toHaveCount(4); await expect(modal.locator("li svg")).toHaveCount(4);
      const text = await modal.innerText(); for (const term of ["11:30", "13:00", "19:30", "21:30", "voiceover", "BGM", "#DuLichDaNang", "#BaNaHills", "bio", "tin nhắn tự động"]) assert(text.includes(term), term);
      const box = await modal.boundingBox(), target = await first.boundingBox(); measurements.push({ width, height, box, target });
      assert(box.x >= 0 && box.y >= 0 && box.x + box.width <= width + 1 && box.y + box.height <= height + 1);
      assert(target.width >= 44 && target.height >= 44);
      assert(await modal.evaluate(el => el.scrollWidth <= el.clientWidth + 1 && document.documentElement.scrollWidth <= innerWidth));
    });
    await check(`application Tab/Shift+Tab ${width}`, async () => {
      await last.focus(); await page.keyboard.press("Tab"); await expect(first).toBeFocused();
      await first.focus(); await page.keyboard.press("Shift+Tab"); await expect(last).toBeFocused();
      for (const key of ["Tab", "Shift+Tab"]) for (let i = 0; i < 6; i++) { await page.keyboard.press(key); assert(await modal.evaluate(el => el.contains(document.activeElement) && document.activeElement !== el)); }
    });
    await check(`application scroll/focus isolation/reduced motion ${width}`, async () => {
      await first.focus(); const outside = page.getByRole("button", { name: "Local Guide", exact: true });
      await outside.evaluate(el => { el.focus(); }); await expect(first).toBeFocused();
      const y = await page.evaluate(() => scrollY); await page.mouse.move(2, height - 2); await page.mouse.wheel(0, 500); await page.waitForTimeout(200);
      assert.equal(await page.evaluate(() => scrollY), y); assert.deepEqual(await overflow(), ["hidden", "hidden"]);
      await expect(first).toHaveCSS("transition-duration", "0s");
    });
    await first.focus(); await page.screenshot({ path: `${out}/reseller-tips-${width}.png` });
    await check(`application Escape/close/focus restore ${width}`, async () => { await close(); assert.deepEqual(await overflow(), before); await open(); await first.click(); await expect(modal).not.toBeVisible(); await expect(opener).toBeFocused(); assert.deepEqual(await overflow(), before); });
  }
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto(base + route); await open();
  await check("application original visualViewport assertion", async () => {
    await page.evaluate(() => { Object.defineProperty(visualViewport, "height", { configurable: true, value: 380 }); Object.defineProperty(visualViewport, "offsetTop", { configurable: true, value: 80 }); visualViewport.dispatchEvent(new Event("resize")); });
    await settle(); const b = await modal.boundingBox(); measurements.push({ syntheticViewport: b });
    assert(b.y >= 92 && b.y + b.height <= 448, JSON.stringify(b));
    await last.focus(); await page.keyboard.press("Tab"); await expect(first).toBeFocused();
    await page.screenshot({ path: `${out}/reseller-tips-viewport.png` });
  });
  await check("application safe area CSS and scrollable long content", async () => {
    await modal.evaluate(el => { for (const [key, value] of Object.entries({ top: 40, bottom: 28, left: 32, right: 24 })) el.style.setProperty("--dialog-safe-" + key, value + "px"); });
    const b = await modal.boundingBox(); assert(b.y >= 120 && b.y + b.height <= 432 && b.x >= 32 && b.x + b.width <= 366, JSON.stringify(b));
    await modal.locator("li p").first().evaluate(el => { el.textContent = "Nội dung dài chỉ để kiểm tra cuộn trong browser fixture. ".repeat(100); });
    await last.scrollIntoViewIfNeeded(); await expect(last).toBeVisible(); await close("button");
  });
  await page.goto(base + route); await ready();
  await check("application 10 cycles: viewport listeners/variables/scroll cleanup", async () => {
    const before = await listeners(); measurements.push({ listenerBaseline: before });
    for (let i = 0; i < 10; i++) { await open(); await settle(); const during = await listeners(); measurements.push({ listenerCycle: i, during }); for (const key of Object.keys(before)) assert.equal(during[key], before[key] + 1, key); await close(i % 2 ? "button" : "Escape"); assert.deepEqual(await listeners(), before); assert.deepEqual(await modal.evaluate(el => [el.style.getPropertyValue("--dialog-viewport-height"), el.style.getPropertyValue("--dialog-viewport-top")]), ["", ""]); assert.deepEqual(await overflow(), ["", ""]); }
  });
  await check("application variant change unmounts open tips and cancels pending measurement", async () => {
    const before = await listeners(); await open(); const old = await modal.elementHandle();
    const select = page.getByLabel("Biến thể", { exact: true }); const next = await select.locator("option").nth(1).getAttribute("value");
    // Simulate caller data changing while modal is open; no backend request.
    await page.evaluate(() => visualViewport.dispatchEvent(new Event("resize")));
    await select.evaluate((el, value) => { el.value = value; el.dispatchEvent(new Event("change", { bubbles: true })); }, next);
    await expect(select).toHaveValue(next); await expect(modal).not.toBeVisible(); await settle();
    assert(await old.evaluate(el => !el.isConnected)); assert.deepEqual(await old.evaluate(el => [el.style.getPropertyValue("--dialog-viewport-height"), el.style.getPropertyValue("--dialog-viewport-top")]), ["", ""]);
    assert.deepEqual(await overflow(), ["", ""]); assert.deepEqual(await listeners(), before);
    await open(); await close();
  });
  await check("application native modal stack without creating tracking data", async () => {
    await open(); await first.focus();
    await page.getByRole("button", { name: "Tạo link", exact: true }).evaluate(el => el.click());
    const tracking = page.getByRole("dialog", { name: "Link tiếp thị & QR" }); await expect(tracking).toBeVisible();
    await page.keyboard.press("Escape"); await expect(tracking).not.toBeVisible(); await expect(modal).toBeVisible(); await expect(first).toBeFocused(); assert.deepEqual(await overflow(), ["hidden", "hidden"]); await close();
  });
  await check("application resize while open", async () => { await open(); await page.setViewportSize({ width: 390, height: 380 }); await settle(); const b = await modal.boundingBox(); assert(b.y >= 12 && b.y + b.height <= 368, JSON.stringify(b)); await close(); });
  await check("Merchant guidelines remain separate and unchanged", async () => {
    await page.setViewportSize({ width: 390, height: 844 }); await page.goto(base + "/preview/merchant/library");
    await expect(opener).toHaveCount(0); const guide = page.getByRole("button", { name: "Quy chuẩn video", exact: true }); await guide.click();
    const dialog = page.getByRole("dialog", { name: "Quy chuẩn video du lịch" }); await expect(dialog).toBeVisible(); await expect(dialog.locator("li")).toHaveCount(3); await page.keyboard.press("Escape"); await expect(dialog).not.toBeVisible(); await expect(guide).toBeFocused();
  });
  assert.deepEqual(errors, []); assert.deepEqual(forbidden, []);
  console.log("PASS application integration; no backend/external/data API requests");
} finally {
  await writeFile(`${out}/application-results.json`, JSON.stringify({ sourceSHA: "b87ecb6578f58e650a793624cdafb3003cf217d9", base, route, results, measurements, errors, forbidden, limitations: "Actual Next app components with fixture data; visualViewport/safe insets simulated, not physical phone/Safari/keyboard or real video acceptance." }, null, 2));
  await browser.close();
}
