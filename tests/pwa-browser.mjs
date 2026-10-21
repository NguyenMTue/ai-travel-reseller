// Run after the isolated production build, against a local server only.
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const baseURL = "http://127.0.0.1:3183";
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {}),
});
try {
  const context = await browser.newContext({ serviceWorkers: "allow" });
  const page = await context.newPage();
  // This scenario never submits forms or invokes data-writing / AI APIs.
  await page.goto(`${baseURL}/privacy`);
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    if (registration.active?.state !== "activated") {
      await new Promise((resolve) => registration.active.addEventListener("statechange", resolve, { once: true }));
    }
  });
  await page.reload();
  assert.equal(await page.locator('link[rel="manifest"]').count(), 1);
  assert.equal(await page.locator('meta[name="theme-color"]').getAttribute("content"), "#204e4c");
  // Next.js 16.3 emits the standard mobile-web-app-capable name for appleWebApp.capable.
  assert.equal(await page.locator('meta[name="mobile-web-app-capable"]').getAttribute("content"), "yes");
  assert.equal(await page.locator('meta[name="apple-mobile-web-app-title"]').getAttribute("content"), "TravelLink AI");
  const manifestURL = await page.locator('link[rel="manifest"]').getAttribute("href");
  const manifest = await (await context.request.get(`${baseURL}${manifestURL}`)).json();
  assert.equal(manifest.name, "TravelLink AI");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.scope, "/");
  for (const [path, size] of [["icon-192", 192], ["icon-512", 512], ["apple-touch-icon", 180]]) {
    const response = await context.request.get(`${baseURL}/pwa/${path}.png`);
    assert.equal(response.status(), 200);
    const metadata = await sharp(await response.body()).metadata();
    assert.equal(metadata.width, size);
    assert.equal(metadata.height, size);
  }
  const worker = await context.request.get(`${baseURL}/sw.js`);
  assert.match(worker.headers()["cache-control"], /no-store/);
  assert.equal(worker.headers()["service-worker-allowed"], "/");
  const state = await page.evaluate(async () => ({
    scope: (await navigator.serviceWorker.ready).scope,
    controller: navigator.serviceWorker.controller?.scriptURL,
    assets: (await Promise.all((await caches.keys()).map(async (name) => {
      const cache = await caches.open(name);
      return (await cache.keys()).map((request) => new URL(request.url).pathname);
    }))).flat(),
  }));
  assert.equal(state.scope, `${baseURL}/`);
  assert.equal(state.controller, `${baseURL}/sw.js`);
  assert.deepEqual(state.assets.sort(), ["/pwa/apple-touch-icon.png", "/pwa/icon-192.png", "/pwa/icon-512.png", "/pwa/offline.html"]);

  await context.setOffline(true);
  await page.goto(`${baseURL}/reseller`);
  assert.equal(await page.locator("h1").textContent(), "Bạn đang ngoại tuyến");
  await page.goto(`${baseURL}/merchant`);
  assert.equal(await page.locator("h1").textContent(), "Bạn đang ngoại tuyến");
  const beforeTracking = context.pages().length;
  const trackingPage = await context.newPage();
  await assert.rejects(trackingPage.goto(`${baseURL}/r/pwa-test-no-network`));
  await trackingPage.close();
  assert.equal(context.pages().length, beforeTracking);
  await context.setOffline(false);
  await page.goto(`${baseURL}/privacy`);
  assert.notEqual(await page.locator("h1").textContent(), "Bạn đang ngoại tuyến");
  await context.close();
  console.log("PASS: manifest, metadata, icon dimensions, worker scope/headers, static-only cache, portal offline fallback, tracking bypass, online recovery.");
} finally {
  await browser.close();
}
