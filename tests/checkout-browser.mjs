import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium, expect as baseExpect } from "@playwright/test";
const expect = baseExpect.configure({timeout: 30000});
const base = process.env.CHAT_BASE_URL ?? "http://127.0.0.1:3195";
const output = "build/fe-w5-checkout-evidence";
await mkdir(output, {recursive:true});
const browser = await chromium.launch({headless:true, ...(process.env.PLAYWRIGHT_CHROMIUM_PATH ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_PATH} : {})});
try {
  const context = await browser.newContext({serviceWorkers:"block", reducedMotion:"reduce"});
  const forbidden = [], errors = [];
  await context.route("**/*", route => {
    const req = route.request(), url = new URL(req.url());
    if (url.origin !== base || req.method() !== "GET" || url.pathname.startsWith("/api/") || url.pathname.startsWith("/r/")) {
      forbidden.push(req.method() + " " + url.origin + url.pathname);
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.on("pageerror", error => errors.push(error.message));
  page.setDefaultNavigationTimeout(180000);
  const launcher = page.getByRole("button", {name:"Hỏi TravelLink Assistant"});
  const close = page.getByLabel("Đóng trò chuyện");
  const input = page.getByRole("textbox", {name:"Tin nhắn cho trợ lý AI"});
  const send = page.getByRole("button", {name:"Gửi tin nhắn",exact:true});
  const scenario = page.getByLabel("Trạng thái mô phỏng");
  const count = page.getByLabel("Số request mô phỏng");
  const card = page.getByRole("region", {name:"Đặt vé với doanh nghiệp"});
  async function fresh(width = 390) {
    await page.setViewportSize({width,height:844});
    await page.goto(base + "/preview/chat");
  }
  async function open() { if ((await page.viewportSize()).width < 768) await launcher.click(); }
  async function ask(text = "Tôi muốn đặt vé") { await input.fill(text); await send.click(); }
  for (const width of [320,390,768,1440]) {
    await fresh(width); await scenario.selectOption("checkout"); await open();
    await input.fill("Đặt vé");
    await input.press("Enter"); await input.press("Enter");
    await expect(count).toHaveText("1");
    await expect(card).toBeVisible();
    const link = card.getByRole("link");
    await expect(link).toHaveAttribute("href", /https:\/\/sunworld.vn\/booking\/ba-na-hills-buffet\?ref=/);
    await expect(link).toHaveAttribute("target","_blank");
    await expect(link).toHaveAttribute("rel","noopener noreferrer");
    await expect(card).toContainText("sunworld.vn");
    const href = new URL(await link.getAttribute("href"));
    assert.equal(href.searchParams.get("ref"), "22222222-2222-4222-8222-222222222222");
    assert.equal(href.searchParams.get("campaign"), "11111111-1111-4111-8111-111111111111");
    assert.equal(href.searchParams.get("product"), "33333333-3333-4333-8333-333333333333");
    assert.ok((await link.boundingBox()).height >= 44);
    const contrast = await link.evaluate(el => {
      const style = getComputedStyle(el);
      const luminance = color => {
        const rgb = color.match(/[\d.]+/g).slice(0,3).map(Number).map(v => {
          const s = v / 255;
          return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        });
        return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
      };
      const foreground = luminance(style.color), background = luminance(style.backgroundColor);
      return (Math.max(foreground,background) + 0.05) / (Math.min(foreground,background) + 0.05);
    });
    assert.ok(contrast >= 4.5, "CTA text must meet WCAG AA contrast");
    await link.focus(); await page.keyboard.press("Enter");
    await expect(link).toHaveAttribute("aria-disabled","true");
    await link.dispatchEvent("click");
    await expect(card).toContainText("Mô phỏng mở checkout");
    assert.equal(context.pages().length,1);
    await expect(link).toHaveAttribute("aria-disabled","false");
    if (width < 768) {
      await close.click(); await launcher.click();
      await expect(card).toBeVisible();
      await input.focus();
      const dialog = page.getByRole("dialog", {name:"Trợ lý du lịch TravelLink"});
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press(i % 2 ? "Shift+Tab" : "Tab");
        assert.ok(await dialog.evaluate(el => el.contains(document.activeElement)));
      }
    }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({path:output + "/checkout-" + width + ".png"});
    console.log("PASS checkout, attribution, dedup, focus and layout " + width);
  }
  await fresh(); await scenario.selectOption("be-contract"); await open(); await ask();
  const beLink=card.getByRole("link");
  await expect(beLink).toHaveAttribute("href","https://sunworld.vn/booking/ba-na-hills-buffet?ref=22222222-2222-2222-2222-222222222222&campaign=44444444-4444-4444-4444-222222222222&product=33333333-3333-3333-3333-333333333333");
  await beLink.click(); await expect(card).toContainText("M\u00f4 ph\u1ecfng m\u1edf checkout");
  assert.equal(context.pages().length,1);
  console.log("PASS exact BE1 payload and safe simulated navigation");
  for (const value of ["missing-url","unsafe-url","untrusted-domain","wrong-attribution"]) {
    await fresh(); await scenario.selectOption(value); await open(); await ask();
    await expect(card).toContainText("Chưa có liên kết đặt vé hợp lệ");
    await expect(card.getByRole("link")).toHaveCount(0);
  }
  console.log("PASS missing/unsafe/mismatched URL remains unavailable");
  await fresh(); await scenario.selectOption("checkout"); await open(); await ask();
  await expect(card.getByRole("link")).toBeVisible();
  await context.setOffline(true); await card.getByRole("link").click();
  await expect(card).toContainText("Bạn đang ngoại tuyến");
  await expect(count).toHaveText("1"); await context.setOffline(false);
  await close.click(); await scenario.selectOption("slow"); await launcher.click(); await ask("Phản hồi chậm");
  await expect(card.getByRole("link")).toHaveAttribute("aria-disabled","true");
  await close.click(); await page.getByRole("button", {name:"Đổi campaign/product"}).click(); await launcher.click();
  await page.waitForTimeout(2800);
  await expect(page.locator(".message")).toHaveCount(0);
  await close.click(); await scenario.selectOption("checkout"); await launcher.click(); await ask();
  await expect(card.getByRole("link")).toHaveAttribute("href", /product=44444444-4444-4444-8444-444444444444/);
  console.log("PASS offline, loading and changed context drops late reply; new attribution retained");
  await close.click(); await scenario.selectOption("expired"); await launcher.click(); await ask();
  await expect(page.locator(".chat-compose").getByRole("alert")).toContainText("hết hạn");
  await expect(card).toContainText("Phiên hoặc liên kết không còn hợp lệ");
  await expect(card.getByRole("link")).toHaveCount(0); await expect(send).toBeDisabled();
  await expect(count).toHaveText("4");
  console.log("PASS expired session disables old checkout without retry");
  for (const value of ["error","timeout"]) {
    await fresh(); await scenario.selectOption(value); await open(); await ask("Giữ bản nháp");
    await expect(page.locator(".chat-compose").getByRole("alert")).toBeVisible();
    await expect(input).toHaveValue("Giữ bản nháp"); await expect(count).toHaveText("1");
    await expect(send).toBeEnabled(); await expect(card).toHaveCount(0);
  }
  await fresh(); await scenario.selectOption("slow"); await open(); await ask();
  await close.click(); await page.getByRole("button",{name:"Đổi phiên"}).click(); await launcher.click();
  await page.waitForTimeout(2800); await expect(page.locator(".message")).toHaveCount(0);
  await page.goto(base + "/chat?status=success");
  await expect(page.getByText("Đặt vé thành công",{exact:true})).toHaveCount(0);
  assert.deepEqual(forbidden,[]); assert.deepEqual(errors,[]);
  console.log("PASS error, timeout, session isolation, no query-based success or external/write requests");
} finally { await browser.close(); }