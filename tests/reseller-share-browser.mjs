import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { chromium, expect as baseExpect } from "@playwright/test";
import sharp from "sharp";
import jsQR from "jsqr";
import { createServer } from "node:http";

const expect = baseExpect.configure({ timeout: 60_000 });
const base = "http://127.0.0.1:3185";
const output = "build/fe-w3-share-evidence-20261021";
const path = "/preview/reseller/campaigns/11111111-1111-4111-8111-111111111111?state=approved&tracking=";
await mkdir(output, { recursive: true });
const coast = await readFile("public/coast.svg");
// A local asset fixture, not an app endpoint/proxy; it never fetches remote data.
const imageServer = createServer((_request, response) => { response.writeHead(200, { "Content-Type": "image/svg+xml" }); response.end(coast); });
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {}) });
try {
  await new Promise((resolve, reject) => { imageServer.once("error", reject); imageServer.listen(3186, "127.0.0.1", resolve); });
} catch (error) { await browser.close(); throw error; }
const errors = [], forbidden = [];
let imageFailure = false;
try {
  const context = await browser.newContext({ serviceWorkers: "block", reducedMotion: "reduce" });
  await context.addInitScript(() => {
    window.__shareMode = "complete"; window.__fileSupport = true; window.__shares = [];
    window.__created = []; window.__createdEntries = []; window.__revoked = []; window.__exports = 0;
    const create = URL.createObjectURL.bind(URL), revoke = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = (blob) => { const url = create(blob); window.__created.push(url); window.__createdEntries.push({ url, type: blob.type, size: blob.size }); return url; };
    URL.revokeObjectURL = (url) => { window.__revoked.push(url); revoke(url); };
    window.__nativeShare = async (data) => {
      window.__shares.push({ url: data.url, title: data.title, files: data.files?.map((file) => ({ name: file.name, type: file.type, size: file.size })) });
      if (window.__shareMode === "cancel") throw new DOMException("cancel", "AbortError");
      if (window.__shareMode === "error") throw new DOMException("denied", "NotAllowedError");
      if (window.__shareMode === "pending") await new Promise(resolve => { window.__releaseShare = resolve; });
    };
    Object.defineProperty(navigator, "share", { configurable: true, value: window.__nativeShare });
    Object.defineProperty(navigator, "canShare", { configurable: true, value: () => window.__fileSupport });
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async value => { window.__copied = value; } } });
    const toBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function(callback, ...rest) {
      if (window.__canvasFailure === "once") { window.__canvasFailure = "none"; throw new DOMException("tainted", "SecurityError"); }
      if (window.__canvasFailure === "always") { callback(null); return; }
      return toBlob.call(this, (blob) => { window.__exports++; callback(blob); }, ...rest);
    };
  });
  await context.route("**/*", (route) => {
    const request = route.request(), url = new URL(request.url());
    if (url.href === "http://127.0.0.1:3186/coast.svg") return route.continue();
    if (url.origin !== base || request.method() !== "GET" || /^\/(api|r)(\/|$)/.test(url.pathname)) {
      forbidden.push(`${request.method()} ${request.url()}`); return route.abort();
    }
    if (imageFailure && url.pathname === "/coast.svg") return route.abort();
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(60_000); page.setDefaultNavigationTimeout(180_000);
  page.on("pageerror", error => errors.push(error.message));
  const modal = page.getByRole("dialog", { name: "Link tiếp thị & QR", exact: true });
  const poster = modal.getByRole("img", { name: /^Poster QR/ });
  async function open(scenario = "success", extra = "") {
    await page.goto(scenario === "default" ? base + path.split("?")[0] + "?state=approved" + extra : base + path + scenario + extra, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("navigation", { name: "Điều hướng nhanh Cộng tác viên", includeHidden: true })).toHaveAttribute("aria-busy", "false");
    await page.getByRole("button", { name: "Tạo link", exact: true }).click();
    await modal.getByRole("button", { name: "Tạo link tiếp thị", exact: true }).click();
    if (scenario !== "error") await expect(modal.locator("#tracking-url")).toBeVisible();
  }
  async function exportPoster(name) {
    await modal.getByRole("button", { name: "Tạo poster QR", exact: true }).click();
    await expect(poster).toBeVisible();
    const download = page.waitForEvent("download");
    await modal.getByRole("button", { name: "Tải PNG", exact: true }).click();
    const file = await download;
    const filename = `${output}/${name}.png`;
    await file.saveAs(filename);
    const { data, info } = await sharp(filename).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(info.width, 1080); assert.equal(info.height, 1440);
    const decoded = jsQR(new Uint8ClampedArray(data), info.width, info.height);
    assert.equal(decoded?.data, await modal.locator("#tracking-url").inputValue(), `poster QR mismatch: ${name}`);
    return filename;
  }
  async function screenshot(name) {
    await page.addStyleTag({ content: "nextjs-portal { visibility:hidden !important; }" });
    await modal.getByRole("heading", { name: "Chia sẻ theo cách của bạn" }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${output}/${name}.png` });
  }

  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    await open();
    await modal.getByRole("button", { name: "Chia sẻ link", exact: true }).click();
    await expect(modal.getByText(/thao tác này không xác nhận bài đã đăng/)).toBeVisible();
    assert.equal(await page.evaluate(() => window.__shares[0].url), await modal.locator("#tracking-url").inputValue());
    await exportPoster(`poster-${width}`);
    await screenshot(`modal-${width}`);
    assert.ok(await modal.evaluate(element => element.scrollWidth <= element.clientWidth + 1), `modal overflow ${width}`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `page overflow ${width}`);
    await expect(page.getByTestId("tracking-attempts")).toHaveText("Số lần gửi mô phỏng: 1");
    await modal.getByRole("button", { name: "Chia sẻ ảnh", exact: true }).click();
    assert.equal(await page.evaluate(() => window.__shares.at(-1).files[0].type), "image/png");
    if (width < 768) {
      const nav = await page.getByRole("navigation", { name: "Điều hướng nhanh Cộng tác viên", includeHidden: true }).boundingBox();
      assert.ok(await page.evaluate(({ x, y }) => !document.elementFromPoint(x, y)?.closest("nav"), { x: nav.x + nav.width / 2, y: nav.y + 10 }));
    }
    await modal.getByRole("button", { name: "Chia sẻ link", exact: true }).focus();
    for (let index = 0; index < 12; index++) {
      await page.keyboard.press("Tab");
      assert.ok(await modal.evaluate(element => element.contains(document.activeElement)), "focus escaped Tracking modal");
    }
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Tạo link", exact: true })).toBeFocused();
    console.log(`PASS viewport ${width}: share, PNG download + QR decode, focus, modal/nav`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await open();
  await page.evaluate(() => { window.__shareMode = "pending"; });
  await modal.getByRole("button", { name: "Chia sẻ link", exact: true }).click();
  await expect(modal.getByRole("button", { name: "Đang mở chia sẻ…", exact: true })).toBeDisabled();
  await modal.getByRole("button", { name: "Đang mở chia sẻ…", exact: true }).evaluate(element => element.click());
  assert.equal(await page.evaluate(() => window.__shares.length), 1);
  await page.evaluate(() => window.__releaseShare());
  await expect(modal.getByRole("button", { name: "Chia sẻ link", exact: true })).toBeEnabled();
  await page.evaluate(() => { window.__shareMode = "cancel"; });
  await modal.getByRole("button", { name: "Chia sẻ link", exact: true }).click();
  await expect(modal.getByRole("status").filter({ hasText: "Đã hủy chia sẻ." })).toBeVisible();
  await page.evaluate(() => { window.__shareMode = "error"; });
  await modal.getByRole("button", { name: "Chia sẻ link", exact: true }).click();
  await expect(modal.getByRole("alert").filter({ hasText: "Chưa thể mở chia sẻ." })).toBeVisible();
  await page.evaluate(() => Object.defineProperty(navigator, "share", { configurable: true, value: undefined }));
  await modal.getByRole("button", { name: "Chia sẻ link", exact: true }).click();
  await expect(modal.getByText(/Trình duyệt chưa hỗ trợ chia sẻ trực tiếp/)).toBeVisible();
  await modal.getByRole("button", { name: "Copy link", exact: true }).click();
  assert.equal(await page.evaluate(() => window.__copied), await modal.locator("#tracking-url").inputValue());
  await exportPoster("unsupported-share");
  await expect(modal.getByRole("button", { name: "Chia sẻ ảnh", exact: true })).toHaveCount(0);
  await expect(modal.getByText(/Thiết bị chưa hỗ trợ chia sẻ ảnh trực tiếp/)).toBeVisible();
  console.log("PASS supported/unsupported/cancel/error/pending/dedup and copy/file fallbacks");

  await open("long-link", "&poster=long");
  await exportPoster("long-title-long-link");
  assert.ok(await modal.evaluate(element => element.scrollWidth <= element.clientWidth + 1));
  await open("success", "&poster=no-image");
  await exportPoster("no-image-no-product-label");
  imageFailure = true;
  await open();
  await exportPoster("image-error");
  await expect(modal.getByText(/Không tải được ảnh minh họa/)).toBeVisible();
  imageFailure = false;
  await open("success", "&poster=cors");
  await exportPoster("cors-fallback");
  await expect(modal.getByText(/Không tải được ảnh minh họa/)).toBeVisible();
  await open();
  await page.evaluate(() => { window.__canvasFailure = "once"; });
  await exportPoster("tainted-canvas-fallback");
  await expect(modal.getByText(/Không thể xuất canvas có ảnh/)).toBeVisible();
  await open();
  await page.evaluate(() => { window.__canvasFailure = "always"; });
  await modal.getByRole("button", { name: "Tạo poster QR", exact: true }).click();
  await expect(modal.getByRole("alert").filter({ hasText: "Chưa thể xuất poster PNG" })).toBeVisible();
  await expect(poster).toHaveCount(0);
  await open("localhost");
  await expect(modal.getByText(/Link localhost\/mạng nội bộ/)).toBeVisible();
  await open("default");
  await expect(modal.getByText(/BẢN MÔ PHỎNG/)).toBeVisible();
  await open("error");
  await expect(modal.getByRole("button", { name: "Chia sẻ link", exact: true })).toHaveCount(0);
  console.log("PASS long text/URL, no image/data, image error/CORS/taint/export failure, no-link/local warnings");

  await open("scope");
  await exportPoster("before-session-change");
  const oldUrl = await poster.getAttribute("src");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Đổi session fixture", exact: true }).click();
  assert.ok(await page.evaluate(url => window.__revoked.includes(url), oldUrl));
  await page.getByRole("button", { name: "Tạo link", exact: true }).click();
  await expect(modal.locator("#tracking-url")).toHaveCount(0);
  await expect(poster).toHaveCount(0);
  await modal.getByRole("button", { name: "Tạo link tiếp thị", exact: true }).click();
  await expect(modal.locator("#tracking-url")).toBeVisible();
  let releaseImage;
  const held = new Promise(resolve => { releaseImage = resolve; });
  let imageWasIntercepted;
  const intercepted = new Promise(resolve => { imageWasIntercepted = resolve; });
  await page.route("**/coast.svg?fixture-scope=*", async route => { imageWasIntercepted(); await held; await route.continue(); });
  const before = await page.evaluate(() => ({ created: window.__created.length, exports: window.__exports }));
  await modal.getByRole("button", { name: "Tạo poster QR", exact: true }).click();
  await Promise.race([intercepted, new Promise((_, reject) => setTimeout(() => reject(new Error("Delayed image fixture was not intercepted")), 10_000))]);
  await expect(modal.getByRole("button", { name: "Đang tạo poster…", exact: true })).toBeDisabled();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Đổi campaign fixture", exact: true }).click();
  releaseImage();
  await page.waitForFunction(previous => window.__exports > previous, before.exports);
  assert.equal(await page.evaluate(() => window.__created.length), before.created, JSON.stringify(await page.evaluate(() => window.__createdEntries)));
  await page.unroute("**/coast.svg?fixture-scope=*");
  await page.getByRole("button", { name: "Tạo link", exact: true }).click();
  await expect(modal.locator("#tracking-url")).toHaveCount(0);
  await expect(poster).toHaveCount(0);
  console.log("PASS session/campaign reset, late poster dropped, preview URL revoked");
  assert.deepEqual(errors, []);
  assert.deepEqual(forbidden, []);
  console.log("PASS no page errors or API/write/tracking-click/external requests; all native/clipboard checks mocked");
  await context.close();
} finally { await browser.close(); await new Promise(resolve => imageServer.close(resolve)); }
