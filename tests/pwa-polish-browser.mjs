import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.PREVIEW_BASE || "http://127.0.0.1:3114";
const out = "build/fe-w4-touch-evidence";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext({ hasTouch: true, serviceWorkers: "block", reducedMotion: "reduce" });
const forbidden = [], errors = [];
await context.route("**/*", route => {
  const url = new URL(route.request().url());
  if (url.origin !== base || url.pathname.startsWith("/api/")) { forbidden.push(url.pathname); return route.abort(); }
  return route.continue();
});
const page = await context.newPage();
page.setDefaultTimeout(20000); page.setDefaultNavigationTimeout(120000);
page.on("pageerror", error => errors.push(error.message));
await page.addInitScript(() => {
  window.fixtureEvents = [];
  if (PerformanceObserver.supportedEntryTypes.includes("event")) {
    new PerformanceObserver(list => window.fixtureEvents.push(...list.getEntries().filter(e => e.interactionId).map(e => ({ name: e.name, duration: e.duration, inputDelay: e.processingStart - e.startTime })))).observe({ type: "event", buffered: true, durationThreshold: 16 });
  }
  const viewport = window.visualViewport;
  const callbacks = new Map();
  window.fixtureViewportListeners = callbacks;
  const add = viewport.addEventListener.bind(viewport), remove = viewport.removeEventListener.bind(viewport);
  viewport.addEventListener = (type, callback, options) => { if (!callbacks.has(type)) callbacks.set(type, new Set()); callbacks.get(type).add(callback); add(type, callback, options); };
  viewport.removeEventListener = (type, callback, options) => { callbacks.get(type)?.delete(callback); remove(type, callback, options); };
  window.fixtureWindowResize = new Set();
  const addWindow = window.addEventListener.bind(window), removeWindow = window.removeEventListener.bind(window);
  window.addEventListener = (type, callback, options) => { if (type === "resize") window.fixtureWindowResize.add(callback); addWindow(type, callback, options); };
  window.removeEventListener = (type, callback, options) => { if (type === "resize") window.fixtureWindowResize.delete(callback); removeWindow(type, callback, options); };
});
async function noOverflow() { assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false); }
async function withinViewport(dialog) {
  assert(await dialog.evaluate(el => { const b = el.getBoundingClientRect(); return b.left >= 0 && b.top >= 0 && b.right <= innerWidth + 1 && b.bottom <= innerHeight + 1 && el.scrollWidth <= el.clientWidth + 1; }));
}
try {
  for (const [width, height] of [[320,740],[390,844],[768,900],[1440,1000],[844,390],[667,320]]) {
    await page.setViewportSize({ width, height });
    await page.goto(`${base}/preview/reseller`);
    const nav = page.getByRole("navigation", { name: "Điều hướng nhanh Cộng tác viên" });
    await noOverflow();
    if (width < 768) {
      await expect(nav).toBeVisible();
      assert(await nav.locator("a,button").evaluateAll(items => items.every(el => { const r = el.getBoundingClientRect(); return r.width >= 44 && r.height >= 44 && getComputedStyle(el).touchAction === "manipulation"; })));
      await page.locator("footer").scrollIntoViewIfNeeded();
      assert(await page.locator("footer").evaluate(el => el.getBoundingClientRect().bottom <= document.querySelector('nav[aria-label="Điều hướng nhanh Cộng tác viên"]').getBoundingClientRect().top + 1));
      // Synthetic safe inset and keyboard are layout/unit probes, not an iPhone test.
      await page.locator("header").evaluate(el => el.parentElement.style.setProperty("--reseller-safe-area-bottom", "34px"));
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      assert(await page.locator("footer").evaluate(el => el.getBoundingClientRect().bottom <= document.querySelector('nav[aria-label="Điều hướng nhanh Cộng tác viên"]').getBoundingClientRect().top + 1));
      const search = page.getByLabel("Tìm kiếm chiến dịch", { exact: true });
      await search.focus();
      await page.evaluate(() => { Object.defineProperty(visualViewport, "height", { configurable: true, value: innerHeight - 250 }); visualViewport.dispatchEvent(new Event("resize")); });
      await expect(nav).toBeHidden();
      await search.evaluate(el => el.blur());
      await expect(nav).toBeVisible();
      await page.evaluate(() => { delete visualViewport.height; visualViewport.dispatchEvent(new Event("resize")); });
      const opener = nav.getByRole("button", { name: /Nội dung AI/ });
      await opener.tap(); const notice = page.getByRole("dialog", { name: "Chọn chiến dịch trước" });
      await expect(notice).toBeVisible(); await withinViewport(notice);
      await page.keyboard.press("Escape"); await expect(opener).toBeFocused();
    }
    await page.goto(`${base}/preview/merchant/library`);
    const opener = page.getByRole("button", { name: "Quy chuẩn video", exact: true });
    await opener.tap(); const dialog = page.getByRole("dialog", { name: "Quy chuẩn video du lịch" });
    await expect(dialog).toBeVisible(); await withinViewport(dialog);
    if (width === 390) {
      await dialog.evaluate(el => { el.style.setProperty("--dialog-safe-top", "28px"); el.style.setProperty("--dialog-safe-bottom", "34px"); el.style.setProperty("--dialog-safe-left", "34px"); el.style.setProperty("--dialog-safe-right", "24px"); });
      assert(await dialog.evaluate(el => { const r = el.getBoundingClientRect(); return r.left >= 33 && r.right <= innerWidth - 23 && r.top >= 27 && r.bottom <= innerHeight - 33; }), "synthetic asymmetric safe insets must protect all four edges");
    }
    const close = dialog.getByRole("button", { name: "Đóng hướng dẫn quy chuẩn video" });
    assert(await close.evaluate(el => { const r = el.getBoundingClientRect(); return r.width >= 44 && r.height >= 44; }));
    assert.equal(await dialog.evaluate(el => getComputedStyle(el).overscrollBehaviorY), "contain");
    assert.equal(await page.evaluate(() => document.body.style.overflow), "hidden");
    await dialog.getByRole("button", { name: "Đã hiểu", exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${out}/guide-${width}x${height}.png` });
    await page.keyboard.press("Escape"); await expect(opener).toBeFocused();
    assert.equal(await page.evaluate(() => document.body.style.overflow), "");
    await noOverflow();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/preview/merchant/library`);
  const touchCdp = await context.newCDPSession(page);
  await page.evaluate(() => scrollTo(0, 0));
  // Begin on editorial text, away from select/input/video native controls.
  const headingBox = await page.locator("h1").boundingBox();
  const startY = Math.min(headingBox.y + headingBox.height / 2, 500);
  // Chrome desktop synthesizeScrollGesture(touch) produced no input in the
  // diagnostic probe; dispatch an actual touch sequence and keep the scroll assertion.
  await touchCdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 190, y: startY }] });
  for (let distance = 16; distance <= 240; distance += 16) {
    await touchCdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 190, y: startY - distance }] });
    await new Promise(resolve => setTimeout(resolve, 16));
  }
  await touchCdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
  await page.route("**/api/merchant/campaigns", route => route.fulfill({ json: { success: true, data: [{ id: "fixture", name: "Chiến dịch kiểm thử", productId: "fixture", productName: "Mẫu" }] } }));
  await page.getByRole("button", { name: "Chọn mẫu", exact: true }).first().tap();
  const opener = page.getByRole("button", { name: "Tạo video từ mẫu đã chọn" });
  const listenerCount = () => page.evaluate(() => [...window.fixtureViewportListeners.values()].reduce((n, set) => n + set.size, 0));
  const baseline = await listenerCount();
  const baselineWindow = await page.evaluate(() => window.fixtureWindowResize.size);
  const cdp = await context.newCDPSession(page);
  await cdp.send("Performance.enable");
  const before = await cdp.send("Performance.getMetrics");
  for (let i = 0; i < 10; i++) {
    await opener.tap(); const dialog = page.getByRole("dialog", { name: "Tạo video AI từ mẫu tham khảo" });
    await expect(dialog).toBeVisible(); await withinViewport(dialog);
    if (i === 0) {
      await dialog.locator("input[type=text]").focus();
      await page.evaluate(() => { Object.defineProperty(visualViewport, "height", { configurable: true, value: 380 }); Object.defineProperty(visualViewport, "offsetTop", { configurable: true, value: 80 }); visualViewport.dispatchEvent(new Event("resize")); });
      await expect.poll(() => dialog.evaluate(el => el.style.getPropertyValue("--dialog-viewport-height"))).toBe("380px");
      assert(await dialog.evaluate(el => { const b = el.getBoundingClientRect(); return b.top >= 92 - 1 && b.bottom <= 448 + 1; }));
      await expect(dialog.locator("input[type=text]")).toHaveCSS("font-size", "16px");
      assert(await dialog.locator("input[type=text]").evaluate(el => { const r = el.getBoundingClientRect(), d = el.closest("dialog").getBoundingClientRect(); return r.top >= d.top && r.bottom <= d.bottom; }), "focused field must remain visible above the synthetic keyboard");
      await page.screenshot({ path: `${out}/synthetic-keyboard.png` });
      await page.evaluate(() => { delete visualViewport.height; delete visualViewport.offsetTop; visualViewport.dispatchEvent(new Event("resize")); });
    }
    await page.keyboard.press("Escape"); await expect(opener).toBeFocused();
    assert.equal(await listenerCount(), baseline, "viewport listeners must return to baseline");
    assert.equal(await page.evaluate(() => window.fixtureWindowResize.size), baselineWindow, "window resize listeners must return to baseline");
    assert.equal(await page.evaluate(() => document.documentElement.style.overflow), "");
  }
  const after = await cdp.send("Performance.getMetrics");
  const delta = name => after.metrics.find(m => m.name === name).value - before.metrics.find(m => m.name === name).value;
  const events = await page.evaluate(() => window.fixtureEvents);
  const durations = events.map(e => e.duration).sort((a,b) => a-b);
  await writeFile(`${out}/performance.json`, JSON.stringify({ browser: browser.version(), viewport: "390x844", environment: "Windows desktop Chrome; hasTouch emulation; Next dev Webpack; reduced motion", scenario: "10 modal open/Escape cycles; first includes synthetic VisualViewport keyboard", metricsSeconds: { task: delta("TaskDuration"), script: delta("ScriptDuration"), layout: delta("LayoutDuration"), style: delta("RecalcStyleDuration") }, eventTimingThresholdMs: 16, eventSummary: { count: durations.length, medianMs: durations[Math.floor(durations.length/2)] ?? null, p95Ms: durations[Math.min(durations.length-1,Math.floor(durations.length*.95))] ?? null, maxMs: durations.at(-1) ?? null }, events, limitations: "Event Timing is sampled/rounded; excludes shorter interactions. Dev tooling and emulation overhead apply. No real-phone 60fps, Safari, or hardware keyboard claim." }, null, 2));
  assert.deepEqual(errors, []); assert.deepEqual(forbidden, []);
  console.log("PASS touch targets, viewport portrait/landscape, synthetic safe area/keyboard, native scroll/modal focus, repeated cleanup; performance.json records desktop-only measurements.");
} finally { await browser.close(); }
