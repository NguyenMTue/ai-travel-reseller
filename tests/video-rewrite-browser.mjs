import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const base = process.env.PREVIEW_BASE || "http://127.0.0.1:3114";
const out = "build/fe-w4-rewrite-audit";
const sample = "/campaign-videos/banahills-remediated.mp4";
const absent = "/campaign-videos/fixture-video-unavailable.mp4";
const resultUrl = "/campaign-videos/w4-result-not-rendered.mp4";
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
await mkdir(out, { recursive: true });
const expected = await readFile("public" + sample);
const http = [];
const good = await fetch(base + sample);
assert.equal(good.status, 200);
assert.match(good.headers.get("content-type"), /^video\/mp4/);
assert.equal(hash(Buffer.from(await good.arrayBuffer())), hash(expected));
http.push({ path: sample, status: 200, sha256: hash(expected) });
const range = await fetch(base + sample, { headers: { Range: "bytes=0-31" } });
assert.equal(range.status, 206);
assert.deepEqual(Buffer.from(await range.arrayBuffer()), expected.subarray(0, 32));
for (const path of [absent, resultUrl, "/campaign-videos/w4-rewrite-nonexistent.mp4?download=1", "/campaign-videos/nested/missing.mp4"]) {
  const response = await fetch(base + path);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(response.status, 404, `${path} must be a real HTTP 404`);
  assert.doesNotMatch(response.headers.get("content-type") || "", /^video\/mp4/);
  assert.notEqual(hash(bytes), hash(expected), "missing result must not contain sample bytes");
  const head = await fetch(base + path, { method: "HEAD" });
  assert.equal(head.status, 404);
  http.push({ path, status: response.status, head: head.status, sha256: hash(bytes) });
}

const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || "chrome" });
const context = await browser.newContext({ serviceWorkers: "block", acceptDownloads: true });
const forbidden = [], errors = [], requestedVideos = [];
await context.route("**/*", route => {
  const request = route.request(), url = new URL(request.url());
  if (url.origin !== base || url.pathname.startsWith("/api/") || request.method() !== "GET") {
    forbidden.push(`${request.method()} ${url.origin}${url.pathname}`);
    return route.abort();
  }
  if (url.pathname.startsWith("/campaign-videos/")) requestedVideos.push(url.pathname);
  return route.continue();
});
const page = await context.newPage();
page.setDefaultTimeout(20000);
page.setDefaultNavigationTimeout(180000);
page.on("pageerror", error => errors.push(error.message));
let downloads = 0;
page.on("download", () => downloads++);
try {
  await page.goto(base + "/preview/merchant/library", { waitUntil: "domcontentloaded" });
  // The player is server-rendered while the fixture library is still loading.
  // Wait for the hydrated fixture UI before playback/download interactions.
  await expect(page.getByRole("button", { name: "Chọn mẫu", exact: true }).first()).toBeVisible();
  const section = page.getByRole("region", { name: "Mô phỏng player tuần 4" });
  const player = section.getByRole("region", { name: /^Video:/ });
  await player.locator("video").evaluate(video => video.play());
  await expect.poll(() => player.locator("video").evaluate(video => video.videoWidth)).toBeGreaterThan(0);
  await player.locator("video").evaluate(video => video.pause());
  const downloadEvent = page.waitForEvent("download");
  await player.getByRole("button", { name: "Tải MP4", exact: true }).click();
  const file = await downloadEvent;
  await file.saveAs(out + "/sample-download.mp4");
  assert.equal(hash(await readFile(out + "/sample-download.mp4")), hash(expected));
  assert.equal(downloads, 1);
  requestedVideos.length = 0;

  // No route fulfillment for missing media: exercise the real Next 404.
  await section.getByRole("combobox").selectOption("expired");
  await expect(player.locator("video")).toHaveAttribute("src", absent);
  await player.locator("video").evaluate(video => { void video.play().catch(() => {}); });
  await expect(player.getByRole("alert").filter({ hasText: "Không phát được video." })).toBeVisible();
  await player.getByRole("button", { name: "Tải MP4", exact: true }).click();
  await expect(player.getByRole("alert").filter({ hasText: "HTTP 404" })).toBeVisible();
  assert.equal(downloads, 1, "404 must never create a download");
  await page.screenshot({ path: out + "/fixture-real-404.png", fullPage: true });

  // Synthetic provider response at the browser boundary, never a service call.
  // Use the production generation-result UI with an absent campaign URL.
  await page.route("**/api/merchant/campaigns", route => route.fulfill({ json: { success: true, data: [{ id: "rewrite-fixture", name: "Fixture only", productId: "fixture", productName: "Fixture" }] } }));
  await page.route("**/api/merchant/video/generate*", route => route.fulfill({
    status: route.request().method() === "POST" ? 201 : 200,
    json: { success: true, data: { content_id: "rewrite-result", video_url: resultUrl, status: "ready", hook: "Fixture", script: "Fixture", caption: "Fixture", duration_sec: 28 } },
  }));
  await page.getByRole("button", { name: "Chọn mẫu", exact: true }).first().click();
  await page.getByRole("button", { name: "Tạo video từ mẫu đã chọn" }).click();
  await page.getByRole("button", { name: "Bắt đầu tạo video AI", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Video AI của bạn đã sẵn sàng!" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("video")).toHaveAttribute("src", resultUrl);
  await expect(dialog.getByRole("link", { name: "Mở video gốc" })).toHaveAttribute("href", resultUrl);
  await dialog.locator("video").evaluate(video => { void video.play().catch(() => {}); });
  await expect(dialog.getByRole("alert").filter({ hasText: "Không phát được video." })).toBeVisible();
  await dialog.getByRole("button", { name: "Tải MP4", exact: true }).click();
  await expect(dialog.getByRole("alert").filter({ hasText: "HTTP 404" })).toBeVisible();
  assert.equal(downloads, 1);
  assert(requestedVideos.includes(absent));
  assert(requestedVideos.includes(resultUrl));
  assert(!requestedVideos.includes(sample), "error/result flow must not request the sample");
  await page.screenshot({ path: out + "/result-real-404.png", fullPage: true });
  await page.keyboard.press("Escape");
  assert.deepEqual(errors, []);
  assert.deepEqual(forbidden, []);
  await writeFile(out + "/after-http.json", JSON.stringify({ base, http, range: 206, downloads, requestedVideos, errors, forbidden }, null, 2));
  console.log("PASS exact sample playback/download/hash/range; real GET+HEAD 404; player/download errors; synthetic result preserves URL and never requests sample. No service calls.");
} finally {
  await context.close();
  await browser.close();
}
