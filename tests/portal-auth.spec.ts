import { expect, test, type Page } from "@playwright/test";

async function login(page: Page, account: string, next?: string) {
  await page.goto(`/login${next === undefined ? "" : `?next=${encodeURIComponent(next)}`}`);
  await page.getByLabel("Email", { exact: true }).fill(`${account}@fixture.invalid`);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("fixture-only");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
}
test.beforeEach(async ({ page }) => {
  await page.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.pathname.startsWith("/api/tracking") || url.pathname.startsWith("/r/")) throw new Error("Auth fixture attempted a shared/external/tracking request");
    await route.continue();
  });
});

test("login without next routes Reseller to Feed and Merchant to Merchant using SSR session", async ({ page }) => {
  await login(page, "reseller");
  await expect(page).toHaveURL(/\/reseller\/campaigns$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".dashboard-main")).toHaveCount(0);
  await login(page, "merchant");
  await expect(page).toHaveURL(/\/merchant$/);
  await expect(page.locator(".dashboard-main")).toBeVisible();
});

test("next honors Reseller destination and rejects wrong-role, external and encoded URLs", async ({ page }) => {
  for (const next of ["/reseller/campaigns", "/merchant", "/merchant/campaigns/new", "https://evil.invalid", "//evil.invalid", "/reseller/%2f%2fevil"]) {
    await login(page, "reseller", next);
    await expect(page).toHaveURL(/\/reseller\/campaigns$/);
    await expect(page.locator(".dashboard-main")).toHaveCount(0);
  }
});

test("direct wrong-role portals never render Dashboard, Campaign form or Feed data", async ({ page }) => {
  await login(page, "reseller");
  await expect(page).toHaveURL(/\/reseller\/campaigns$/);
  for (const path of ["/merchant", "/merchant/campaigns/new"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: "Bạn chưa có quyền Merchant" })).toBeVisible();
    await expect(page.locator(".dashboard-main")).toHaveCount(0);
    await expect(page.getByRole("form", { name: "Thông tin chiến dịch" })).toHaveCount(0);
    expect(new URL(page.url()).pathname).toBe(path);
  }
  await login(page, "merchant");
  await expect(page).toHaveURL(/\/merchant$/);
  await page.goto("/reseller/campaigns");
  await expect(page.getByRole("heading", { name: "Bạn chưa có quyền Cộng tác viên" })).toBeVisible();
  expect(new URL(page.url()).pathname).toBe("/reseller/campaigns");
});

test("unauthenticated portals preserve exact next; public preview stays separate", async ({ page }) => {
  for (const path of ["/merchant", "/merchant/campaigns/new", "/reseller/campaigns"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login\?next=/);
    expect(new URL(page.url()).searchParams.get("next")).toBe(path);
  }
  await page.goto("/login");
  await expect(page.locator('input[name="next"]')).toHaveValue("");
  await page.goto("/preview/merchant");
  await expect(page.locator(".dashboard-main")).toBeVisible();
  await page.goto("/preview/reseller");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("both roles retain existing Merchant default and allowed next; no membership grants no portal", async ({ page }) => {
  await login(page, "both");
  await expect(page).toHaveURL(/\/merchant$/);
  await login(page, "both", "/reseller/campaigns");
  await expect(page).toHaveURL(/\/reseller\/campaigns$/);
  await login(page, "none", "/merchant");
  await expect(page.locator(".auth-form").getByRole("alert")).toContainText("chưa tìm thấy hồ sơ Merchant hoặc Reseller");
  expect(new URL(page.url()).pathname).toBe("/login");
  await page.goto("/merchant");
  await expect(page.getByRole("heading", { name: "Bạn chưa có quyền Merchant" })).toBeVisible();
  await expect(page.locator(".dashboard-main")).toHaveCount(0);
});

test("profile query failure differs from no-row and expired session without exposing details", async ({ page }) => {
  await login(page, "profile-error");
  await expect(page.locator(".auth-form").getByRole("alert")).toContainText("chưa đọc được hồ sơ quyền truy cập");
  await expect(page.getByText("private fixture query details")).toHaveCount(0);
  await page.goto("/merchant");
  await expect(page.getByRole("heading", { name: "Chưa thể xác minh quyền truy cập" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Bạn chưa có quyền Merchant" })).toHaveCount(0);
  await login(page, "expired");
  await expect(page.locator(".auth-form").getByRole("alert")).toContainText("Phiên đăng nhập không còn hợp lệ");
  expect(new URL(page.url()).pathname).toBe("/login");
});

test.afterAll(async ({ request }) => {
  const result = await request.get("http://127.0.0.1:3116/health");
  expect(await result.json()).toEqual({ fixture: true, writes: 0 });
});
