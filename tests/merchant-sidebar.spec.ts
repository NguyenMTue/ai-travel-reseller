import { expect, test, type Page } from "@playwright/test";

const labels = ["Tổng quan", "Sản phẩm", "Chiến dịch", "Kiểm duyệt AI", "Thư viện media", "Trợ lý AI"];
const nav = (page: Page) => page.getByRole("navigation", { name: "Điều hướng Merchant" });
async function login(page: Page, role = "merchant") {
  await page.goto(role === "merchant" ? "/login?next=/merchant" : "/login?next=/reseller/campaigns");
  await page.getByLabel("Email", { exact: true }).fill(role + "@fixture.invalid");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("fixture-only");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(role === "merchant" ? /\/merchant$/ : /\/reseller\/campaigns$/);
  await expect(page.getByRole("heading", { name: "Đăng nhập", exact: true })).toHaveCount(0, { timeout: 30000 });
}
async function showMenu(page: Page) {
  if (page.viewportSize()!.width > 760) return;
  const button = page.getByRole("button", { name: "Mở điều hướng", exact: true });
  if (await button.getAttribute("aria-expanded") !== "true") await button.click();
  await expect(button).toHaveAttribute("aria-expanded", "true");
}
async function assertPage(page: Page, label: string) {
  await expect(page.locator("#main-content")).toHaveCount(1);
  await showMenu(page);
  await expect(nav(page)).toHaveCount(1);
  await expect(nav(page).getByRole("link")).toHaveCount(6);
  expect(await nav(page).getByRole("link").allTextContents()).toEqual(labels.map(text => text === "Sản phẩm" ? "Sản phẩm0" : text));
  await expect(nav(page).locator('[aria-current="page"]')).toHaveCount(1);
  await expect(nav(page).locator('[aria-current="page"]')).toContainText(label);
  await expect(nav(page).locator("svg")).toHaveCount(7);
  if (page.viewportSize()!.width <= 760) {
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Mở điều hướng", exact: true })).toBeFocused();
  }
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) console.log("Overflow diagnostic", await page.evaluate(() => ({ url: location.pathname, width: innerWidth, scroll: document.documentElement.scrollWidth, nodes: Array.from(document.querySelectorAll("body *")).map(el => ({ tag: el.tagName, cls: String(el.className), right: el.getBoundingClientRect().right, width: el.getBoundingClientRect().width })).filter(el => el.right > innerWidth + 1).slice(0, 18) })));
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

test.beforeEach(async ({ page }) => {
  page.on("pageerror", error => { throw error; });
  await page.route("**/*", route => {
    const url = new URL(route.request().url());
    if (!["127.0.0.1", "localhost"].includes(url.hostname)) return route.abort();
    // Auth is synthetic; no business-data write, AI, tracking or payment call.
    if (url.pathname.startsWith("/api/") && route.request().method() !== "GET") throw new Error("Unexpected business mutation in navigation QA");
    return route.continue();
  });
});

test("one persistent sidebar through overview, approval, lists, forms, reload and Back", async ({ page }, info) => {
  await login(page); await assertPage(page, "Tổng quan");
  await page.locator("#merchant-sidebar").evaluate(el => el.setAttribute("data-persist-check", "original"));
  await page.screenshot({ path: info.outputPath("overview.png"), fullPage: true });
  if (page.viewportSize()!.width <= 760) { await showMenu(page); await page.screenshot({ path: info.outputPath("overview-menu.png") }); await page.keyboard.press("Escape"); }
  const paths = [["contents", "Kiểm duyệt AI"], ["products", "Sản phẩm"], ["campaigns", "Chiến dịch"], ["library", "Thư viện media"]];
  for (const [path, label] of paths) {
    await showMenu(page); await nav(page).getByRole("link", { name: new RegExp("^" + label) }).click();
    await expect(page).toHaveURL(new RegExp("/merchant/" + path + "$"));
    await expect(page.locator("#merchant-sidebar")).toHaveAttribute("data-persist-check", "original");
    await assertPage(page, label);
    if (path === "contents") { await page.screenshot({ path: info.outputPath("contents.png"), fullPage: true }); if (page.viewportSize()!.width <= 760) { await showMenu(page); await page.screenshot({ path: info.outputPath("contents-menu.png") }); await page.keyboard.press("Escape"); } }
    if (path === "products") {
      await page.getByRole("link", { name: "Thêm sản phẩm mới", exact: true }).first().click();
      await expect(page).toHaveURL(/\/merchant\/products\/new$/); await assertPage(page, "Sản phẩm");
      await page.goBack(); await assertPage(page, "Sản phẩm");
    }
  }
  await page.getByRole("link", { name: "Tạo chiến dịch", exact: true }).first().click();
  await expect(page).toHaveURL(/\/merchant\/campaigns\/new$/); await assertPage(page, "Chiến dịch");
  await page.reload(); await assertPage(page, "Chiến dịch");
  await page.goBack(); await expect(page).toHaveURL(/\/merchant\/library$/); await assertPage(page, "Thư viện media");
  await showMenu(page);
  await expect(page.getByRole("button", { name: "Đăng xuất", exact: true })).toHaveCount(1); await expect(nav(page).getByRole("link", { name: "Trợ lý AI" })).toHaveAttribute("href", "/chat");
});

test("content tabs and filters stay functional; role/anonymous guards still apply", async ({ page }) => {
  await login(page); await assertPage(page, "Tổng quan");
  const tabs = page.getByRole("group", { name: "Nội dung Tổng quan" });
  await tabs.getByRole("button", { name: "Sản phẩm", exact: true }).click(); await expect(tabs.getByRole("button", { name: "Sản phẩm", exact: true })).toHaveAttribute("aria-pressed", "true");
  await tabs.getByRole("button", { name: "Tổng quan", exact: true }).click();
  await page.goto("/merchant/contents");
  await expect(page.locator("#main-content select")).toHaveCount(2);
  await page.locator("#main-content select").nth(1).selectOption({ index: 1 });
  await assertPage(page, "Kiểm duyệt AI");
  await page.goto("/merchant/products"); await expect(page.locator("#main-content select")).not.toHaveCount(0);
  await page.context().clearCookies(); await page.goto("/merchant/contents"); await expect(page).toHaveURL(/\/login\?next=/); await expect(page.locator("#merchant-sidebar")).toHaveCount(0);
} );

test("Reseller cannot acquire the Merchant shell", async ({ page }) => {
  await login(page, "reseller"); await page.goto("/merchant/contents"); await expect(page.locator("#merchant-sidebar")).toHaveCount(0);
});

test("preview routes share navigation without requiring a real account", async ({ page }) => {
  for (const [path, label] of [["", "Tổng quan"], ["/contents", "Kiểm duyệt AI"], ["/products", "Sản phẩm"], ["/products/new", "Sản phẩm"], ["/campaigns", "Chiến dịch"], ["/library", "Thư viện media"]]) {
    const response = await page.goto("/preview/merchant" + path);
    expect(response?.status()).toBe(200);
    await showMenu(page);
    await expect(nav(page)).toHaveCount(1);
    await expect(nav(page).locator("[aria-current=page]")).toContainText(label);
    if (page.viewportSize()!.width <= 760) await page.keyboard.press("Escape");
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
