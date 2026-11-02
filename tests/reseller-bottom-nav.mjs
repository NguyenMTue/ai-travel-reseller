// Targeted UI checks on existing development-only fixtures; never writes backend data.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium, expect as baseExpect } from "@playwright/test";

const expect = baseExpect.configure({ timeout: 60_000 });

const base = process.env.PREVIEW_BASE || "http://127.0.0.1:3184";
const output = process.env.NAV_EVIDENCE_DIR || "build/fe-w3-nav-evidence";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {}),
});
const blocked = [];
try {
  const context = await browser.newContext({ reducedMotion: "reduce", serviceWorkers: "block" });
  await context.route("**/*", (route) => {
    const request = route.request();
    if (new URL(request.url()).origin !== base || request.method() !== "GET" || new URL(request.url()).pathname.startsWith("/api/")) {
      blocked.push(`${request.method()} ${request.url()}`);
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(120_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  async function screenshot(name) {
    // Hide only Next's development inspector badge in review images, not app UI.
    await page.addStyleTag({ content: "nextjs-portal { visibility: hidden !important; }" });
    await page.screenshot({ path: `${output}/${name}.png` });
  }
  const nav = page.getByRole("navigation", { name: "Điều hướng nhanh Cộng tác viên", exact: true, includeHidden: true });
  const detail = `${base}/preview/reseller/campaigns/11111111-1111-4111-8111-111111111111?state=approved&tracking=success`;
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: width >= 768 ? 1000 : 844 });
    await page.goto(`${base}/preview/reseller`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Chiến dịch dành cho bạn" })).toBeVisible();
    await expect(nav).toHaveAttribute("aria-busy", "false");
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `feed overflow ${width}`);
    if (width < 768) {
      await expect(nav).toBeVisible();
      await expect(nav.getByRole("link", { name: /Khám phá/ })).toHaveAttribute("aria-current", "page");
      await expect(page.getByRole("navigation", { name: "Điều hướng Cộng tác viên", exact: true })).toBeHidden();
      for (const item of await nav.locator("a,button").all()) {
        const box = await item.boundingBox();
        assert.ok(box.width >= 44 && box.height >= 44);
      }
      assert.ok(await nav.locator("span").evaluateAll((nodes) => nodes.every((node) => node.scrollWidth <= node.clientWidth + 1)), `nav text clips ${width}`);
      await nav.getByRole("button", { name: /Nội dung AI/ }).focus();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByRole("heading", { name: "Chọn chiến dịch trước" })).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(nav.getByRole("button", { name: /Nội dung AI/ })).toBeFocused();
      assert.equal(await nav.getByRole("button", { name: /Nội dung AI/ }).evaluate((element) => getComputedStyle(element).outlineStyle), "solid");
      assert.equal(await nav.getByRole("button", { name: /Nội dung AI/ }).evaluate((element) => getComputedStyle(element).transitionDuration), "0s");
      await expect(nav.getByRole("link", { name: /Ví hoa hồng/ })).toHaveAttribute("href", "/preview/reseller/wallet");
      await page.getByLabel("Tìm kiếm chiến dịch", { exact: true }).fill("Hội An");
      await page.getByLabel("Tìm kiếm chiến dịch", { exact: true }).fill("");
      await page.locator("footer").scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      const footer = await page.locator("footer").boundingBox();
      const dock = await nav.boundingBox();
      assert.ok(footer.y + footer.height <= dock.y + 1, `footer covered ${width}`);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    } else {
      await expect(nav).toBeHidden();
      await expect(page.getByRole("navigation", { name: "Điều hướng Cộng tác viên", exact: true })).toBeVisible();
    }
    await page.getByRole("heading", { name: "Chiến dịch dành cho bạn" }).click();
    await screenshot(`feed-${width}`);
    await page.goto(detail, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Hội An Foodie", exact: true })).toBeVisible();
    await expect(nav).toHaveAttribute("aria-busy", "false");
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `detail overflow ${width}`);
    if (width < 768) {
      await expect(nav.getByRole("link", { name: /Nội dung AI/ })).toBeVisible();
      await expect(nav.getByRole("link", { name: /Khám phá/ })).toHaveAttribute("aria-current", "page");
      await nav.getByRole("link", { name: /Nội dung AI/ }).click();
      await expect(nav.getByRole("link", { name: /Nội dung AI/ })).toHaveAttribute("aria-current", "location");
      await expect(page.locator("#reseller-content-kit")).toBeFocused();
      await screenshot(`content-${width}`);
      await nav.getByRole("link", { name: /Link & QR/ }).click();
      await expect(nav.getByRole("link", { name: /Link & QR/ })).toHaveAttribute("aria-current", "location");
      await expect(page.locator("#reseller-tracking")).toBeFocused();
      await page.getByRole("button", { name: "Tạo link", exact: true }).click();
      const modal = page.getByRole("dialog", { name: "Link tiếp thị & QR", exact: true });
      await expect(modal).toBeVisible();
      await modal.getByRole("button", { name: "Tạo link tiếp thị", exact: true }).click();
      await expect(modal.locator("textarea")).toBeVisible();
      for (let index = 0; index < 8; index++) {
        await page.keyboard.press("Tab");
        assert.ok(await modal.evaluate((element) => element.contains(document.activeElement)), "modal focus escaped");
      }
      const dock = await nav.boundingBox();
      assert.ok(await page.evaluate(({ x, y }) => !document.elementFromPoint(x, y)?.closest('nav'), { x: dock.x + dock.width / 2, y: dock.y + 10 }), "dock above dialog backdrop");
      await screenshot(`tracking-${width}`);
      await page.keyboard.press("Escape");
      await expect(page.getByRole("button", { name: "Tạo link", exact: true })).toBeFocused();
      await page.goBack();
      await expect(nav.getByRole("link", { name: /Nội dung AI/ })).toHaveAttribute("aria-current", "location");
      await nav.getByRole("link", { name: /Khám phá/ }).click();
      await expect(page).toHaveURL(`${base}/preview/reseller`);
    }
    console.log(`PASS viewport ${width}: layout, navigation, focus, dialogs`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/preview/reseller`);
  await page.getByLabel("Tìm kiếm chiến dịch", { exact: true }).focus();
  await page.evaluate(() => {
    Object.defineProperty(window.visualViewport, "height", { configurable: true, value: 420 });
    window.visualViewport.dispatchEvent(new Event("resize"));
  });
  await expect(nav).toBeHidden();
  await page.evaluate(() => {
    delete window.visualViewport.height;
    window.visualViewport.dispatchEvent(new Event("resize"));
  });
  await expect(nav).toBeVisible();
  console.log("PASS simulated visualViewport keyboard resize; reduced-motion navigation");
  const normalHeight = (await nav.boundingBox()).height;
  await page.locator('div[class*="shell"]').first().evaluate((element) => element.style.setProperty("--reseller-safe-area-bottom", "34px"));
  assert.equal((await nav.boundingBox()).height, normalHeight + 34);
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  const safeFooter = await page.locator("footer").boundingBox();
  assert.ok(safeFooter.y + safeFooter.height <= (await nav.boundingBox()).y + 1);
  await screenshot("safe-area-390");
  console.log("PASS simulated 34px bottom inset with content clearance");
  await page.goto(`${base}/privacy`);
  await expect(nav).toHaveCount(0);
  assert.deepEqual(errors, []);
  assert.deepEqual(blocked, []);
  console.log("PASS scope, no page errors, no API/write/external requests");
  await context.close();
} finally {
  await browser.close();
}
