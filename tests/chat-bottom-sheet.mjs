import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium, expect as baseExpect } from "@playwright/test";
const expect = baseExpect.configure({ timeout: 60000 });
const base = "http://127.0.0.1:3187";
const output = "build/fe-w3-chat-evidence";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_PATH ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_PATH}: {}) });
try {
  const context = await browser.newContext({ reducedMotion: "reduce", serviceWorkers: "block" });
  const forbidden = [], errors = [];
  await context.route("**/*", route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin !== base || request.method() !== "GET" || url.pathname.startsWith("/api/") || url.pathname.startsWith("/r/")) {
      forbidden.push(`${request.method()} ${url.origin}${url.pathname}`); return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(180000);
  page.on("pageerror", e => errors.push(e.message));
  const dialog = page.getByRole("dialog", { name: "Trợ lý du lịch TravelLink" });
  const input = page.getByRole("textbox", { name: "Tin nhắn cho trợ lý AI" });
  const send = page.getByRole("button", { name: "Gửi tin nhắn", exact: true });
  const launcher = page.getByRole("button", { name: "Hỏi TravelLink Assistant" });
  const requests = page.getByLabel("Số request mô phỏng");
  async function shot(name) {
    await page.addStyleTag({ content: "nextjs-portal { display:none !important }" });
    await page.screenshot({ path: `${output}/${name}.png` });
  }
  for (const width of [320,390,768,1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`${base}/preview/chat`, {waitUntil:"domcontentloaded"});
    if (width < 768) {
      await expect(dialog).not.toBeVisible(); await expect(requests).toHaveText("0");
      await launcher.click(); await expect(page.getByLabel("Đóng trò chuyện")).toBeFocused();
      assert.equal(await page.evaluate(() => document.body.style.overflow), "hidden");
    }
    await expect(dialog).toBeVisible(); await expect(send).toBeDisabled();
    await input.fill("Chính sách cho trẻ em?\nTôi muốn tìm hiểu thêm."); await send.click();
    await expect(page.getByRole("status").filter({hasText:"Trợ lý đang trả lời"})).toBeVisible();
    await expect(send).toBeDisabled(); await expect(requests).toHaveText("1");
    await expect(page.locator(".message-assistant")).toHaveCount(1);
    await expect(input).toHaveValue("");
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth), false);
    await shot(`chat-${width}`);
    if (width < 768) {
      await page.getByLabel("Mở rộng trò chuyện").click(); await expect(dialog).toHaveAttribute("data-expanded","true");
      await page.keyboard.press("Escape"); await expect(launcher).toBeFocused();
      await expect.poll(() => page.evaluate(()=>document.body.style.overflow)).toBe("");
      await launcher.click(); await expect(page.locator(".message-assistant")).toHaveCount(1);
      await page.getByLabel("Đóng trò chuyện").click();
    }
    console.log(`PASS viewport ${width}: submit/dedup, layout, close/reopen, expand, focus`);
  }
  await page.setViewportSize({width:390,height:844}); await page.goto(`${base}/preview/chat`);
  for (const [scenario, message] of [["error","Mô phỏng lỗi dịch vụ"],["timeout","quá thời gian chờ"]]) {
    await page.getByLabel("Trạng thái mô phỏng").selectOption(scenario); await launcher.click();
    await input.fill(`Giữ bản nháp ${scenario}`); await send.click();
    await expect(dialog.getByRole("alert")).toContainText(message);
    await expect(input).toHaveValue(`Giữ bản nháp ${scenario}`); await expect(send).toBeEnabled();
    await page.getByLabel("Đóng trò chuyện").click();
  }
  const beforeOffline = await requests.textContent();
  await launcher.click(); await input.fill("Tin nhắn ngoại tuyến"); await context.setOffline(true); await send.click();
  await expect(dialog.getByRole("alert")).toContainText("ngoại tuyến"); await expect(input).toHaveValue("Tin nhắn ngoại tuyến");
  await expect(requests).toHaveText(beforeOffline);
  await context.setOffline(false); await page.getByLabel("Đóng trò chuyện").click();
  console.log("PASS service error/timeout/offline preserve draft; no automatic retry");
  await page.getByLabel("Trạng thái mô phỏng").selectOption("slow"); await launcher.click();
  await input.fill("Phản hồi của ngữ cảnh cũ"); await send.click(); await page.getByLabel("Đóng trò chuyện").click();
  await page.getByRole("button",{name:"Đổi campaign/product"}).click(); await launcher.click();
  await expect(page.locator(".message")).toHaveCount(0); await page.waitForTimeout(2800); await expect(page.locator(".message")).toHaveCount(0);
  await page.getByLabel("Đóng trò chuyện").click(); await page.getByRole("button",{name:"Đổi phiên"}).click();
  await launcher.click(); await input.fill("Phản hồi của phiên cũ"); await send.click(); await page.getByLabel("Đóng trò chuyện").click();
  await page.getByRole("button",{name:"Đổi phiên"}).click(); await launcher.click();
  await page.waitForTimeout(2800); await expect(page.locator(".message")).toHaveCount(0); await page.getByLabel("Đóng trò chuyện").click();
  await page.getByLabel("Trạng thái mô phỏng").selectOption("long"); await launcher.click();
  await input.fill("Nội dung dài"); await send.click(); await expect(page.locator(".message-assistant")).toHaveCount(1);
  await expect(page.locator(".message-assistant script")).toHaveCount(0);
  await shot("long-390");
  await page.getByLabel("Đóng trò chuyện").click(); await page.getByLabel("Trạng thái mô phỏng").selectOption("slow"); await launcher.click();
  await input.fill("Đang đọc tin cũ"); await send.click();
  await page.locator(".chat-messages").evaluate(el=>{el.scrollTop=0;el.dispatchEvent(new Event('scroll'));});
  await page.waitForTimeout(2800); await expect(page.locator(".message-assistant")).toHaveCount(2);
  assert.ok(await page.locator(".chat-messages").evaluate(el=>el.scrollTop<30));
  console.log("PASS context/session reset, late reply ignored, safe long text, respect reading position");
  // Native modal focus must remain inside the sheet.
  await input.focus(); for(let i=0;i<9;i++) { await page.keyboard.press("Tab"); assert.ok(await dialog.evaluate(el=>el.contains(document.activeElement))); }
  // Simulated keyboard viewport, not a physical device measurement.
  await page.evaluate(()=>{Object.defineProperty(visualViewport,'height',{configurable:true,value:420});visualViewport.dispatchEvent(new Event('resize'));});
  await input.focus();
  const box=await send.boundingBox(); assert.ok(box && box.y+box.height<=420);
  await shot("keyboard-390");
  await page.evaluate(()=>{delete visualViewport.height;visualViewport.dispatchEvent(new Event('resize'));});
  await page.getByLabel("Đóng trò chuyện").click();
  await page.goto(`${base}/chat`); await launcher.click(); await expect(input).toBeVisible();
  await page.waitForTimeout(300); // Opening real chat must not submit anything.
  assert.deepEqual(forbidden,[]); assert.deepEqual(errors,[]);
  console.log("PASS focus trap, simulated keyboard viewport, real route open without API request; no external/write requests");
  await context.close();
} finally { await browser.close(); }
