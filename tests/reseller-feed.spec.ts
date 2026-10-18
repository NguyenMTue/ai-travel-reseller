import { expect, test as base } from "@playwright/test";

const test = base.extend<{ isolatedNetwork: undefined }>({
  isolatedNetwork: [
    async ({ context, page }, use) => {
      const externalRequests: string[] = [];
      const backendRequests: string[] = [];
      const runtimeErrors: string[] = [];

      page.on("pageerror", (error) => runtimeErrors.push(error.message));
      context.on("request", (request) => {
        const url = new URL(request.url());
        if (/^\/api\/(campaigns|contents|tracking)(?:\/|$)/.test(url.pathname)) {
          backendRequests.push(url.pathname);
        }
      });
      await context.route("**/*", async (route) => {
        const url = new URL(route.request().url());
        if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) {
          externalRequests.push(`${url.origin}${url.pathname}`);
          await route.abort();
          return;
        }
        await route.continue();
      });

      await use(undefined);

      expect(externalRequests, "The isolated UI must not contact external services").toEqual([]);
      expect(backendRequests, "Preview must not request campaign, content or tracking APIs").toEqual([]);
      expect(runtimeErrors).toEqual([]);
    },
    { auto: true },
  ],
});

test("fixture campaigns render without horizontal overflow or invented content counts", async ({ page }, testInfo) => {
  await page.goto("/preview/reseller");
  await expect(page.getByRole("heading", { name: "Chiến dịch dành cho bạn" })).toBeVisible();
  await expect(page.getByTestId("campaign-card")).toHaveCount(4);
  await expect(page.getByTestId("campaign-card").getByText("Xem Content Kit", { exact: true })).toHaveCount(4);
  await expect(page.getByTestId("campaign-card").locator("a")).toHaveCount(4);
  await expect(page.getByTestId("campaign-card").first().getByRole("link")).toHaveAttribute("href", "/preview/reseller/campaigns/11111111-1111-4111-8111-111111111111");

  const missing = page.getByTestId("campaign-card").filter({ hasText: "Chiến dịch chưa cập nhật" });
  await expect(missing.getByText("Chưa có danh mục", { exact: true })).toBeVisible();
  await expect(missing.getByText("Chưa có địa điểm", { exact: true })).toBeVisible();
  await expect(missing.getByText("Chưa có hoa hồng", { exact: true })).toBeVisible();
  await expect(missing).not.toContainText("0%");
  await expect(missing).not.toContainText("0 bài");

  await page.evaluate(() => document.fonts.ready);
  const navContrast = await page
    .getByRole("navigation", { name: "Điều hướng Cộng tác viên" })
    .locator('[aria-current="page"]')
    .evaluate((element) => {
      const styles = getComputedStyle(element);
      const luminance = (color: string) => {
        const channels = (color.match(/[\d.]+/g) ?? []).slice(0, 3).map((value) => {
          const channel = Number(value) / 255;
          return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        });
        return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
      };
      const foreground = luminance(styles.color);
      const background = luminance(styles.backgroundColor);
      return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
    });
  expect(navContrast, "Active navigation text must retain readable contrast").toBeGreaterThanOrEqual(4.5);

  const searchTextGap = await page.getByLabel("Tìm kiếm chiến dịch", { exact: true })
    .evaluate((element) => {
      const icon = element.parentElement?.querySelector("svg");
      if (!icon) throw new Error("Search icon is missing");
      const styles = getComputedStyle(element);
      const textStart = element.getBoundingClientRect().left
        + parseFloat(styles.borderLeftWidth) + parseFloat(styles.paddingLeft);
      return textStart - icon.getBoundingClientRect().right;
    });
  expect(searchTextGap, "Search text and placeholder must clear the icon").toBeGreaterThanOrEqual(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("reseller-feed.png"), fullPage: true });
});

test("accentless search combines with category, location and commission filters", async ({ page }) => {
  await page.goto("/preview/reseller");
  await page.getByLabel("Tìm kiếm chiến dịch", { exact: true }).fill("hoi an");
  await page.getByLabel("Danh mục", { exact: true }).selectOption("Ẩm thực");
  await page.getByLabel("Địa điểm", { exact: true }).selectOption("Hội An");
  await page.getByLabel("Hoa hồng", { exact: true }).selectOption("under-10");
  await expect(page.getByTestId("campaign-card")).toHaveCount(1);
  await expect(page.getByTestId("campaign-card")).toContainText("Hội An Foodie");
  await expect(page.getByRole("status")).toHaveText("1 chiến dịch phù hợp");

  await page.getByLabel("Hoa hồng", { exact: true }).selectOption("10-to-20");
  await expect(page.getByTestId("campaign-card")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Chưa tìm thấy chiến dịch phù hợp" })).toBeVisible();
  await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).first().click();
  await expect(page.getByTestId("campaign-card")).toHaveCount(4);
  await expect(page.getByLabel("Tìm kiếm chiến dịch", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Danh mục", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Địa điểm", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Hoa hồng", { exact: true })).toHaveValue("all");
});

test("commission ranges exclude unknown rates and show their matching campaigns", async ({ page }) => {
  await page.goto("/preview/reseller");
  for (const [range, campaign] of [
    ["under-10", "Hội An Foodie"],
    ["10-to-20", "Đà Nẵng Family"],
    ["over-20", "Huế Local Guide"],
  ]) {
    await page.getByLabel("Hoa hồng", { exact: true }).selectOption(range);
    await expect(page.getByTestId("campaign-card")).toHaveCount(1);
    await expect(page.getByTestId("campaign-card")).toContainText(campaign);
    await expect(page.getByTestId("campaign-card")).not.toContainText("Chiến dịch chưa cập nhật");
  }
  await page.getByLabel("Hoa hồng", { exact: true }).selectOption("over-10");
  await expect(page.getByTestId("campaign-card")).toHaveCount(2);
  await expect(page.getByTestId("campaign-card").getByRole("heading")).toHaveText([
    "Đà Nẵng Family",
    "Huế Local Guide",
  ]);
  await page.getByLabel("Hoa hồng", { exact: true }).selectOption("over-15");
  await expect(page.getByTestId("campaign-card")).toHaveCount(1);
  await expect(page.getByTestId("campaign-card")).toContainText("Huế Local Guide");
});

test("loading, empty and failed feed states stay distinct and retry recovers locally", async ({ page }) => {
  await page.goto("/preview/reseller");
  const state = page.getByLabel("Trạng thái giao diện", { exact: true });

  await state.selectOption("loading");
  await expect(page.getByRole("status")).toContainText("Đang tải chiến dịch");
  await expect(page.locator('[aria-busy="true"]')).toBeVisible();
  await expect(page.getByTestId("campaign-card")).toHaveCount(0);

  await state.selectOption("empty");
  await expect(page.getByRole("heading", { name: "Chưa có chiến dịch", exact: true })).toBeVisible();
  await expect(page.getByTestId("campaign-card")).toHaveCount(0);

  await state.selectOption("error");
  await expect(page.getByTestId("campaign-card")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Chưa thể tải chiến dịch", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Thử lại", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Thử lại", exact: true }).click();
  await expect(page.getByTestId("campaign-card")).toHaveCount(4);
  await expect(state).toHaveValue("ready");
});

test("authorization and expired sessions stay distinct without exposing campaign cards", async ({ page }) => {
  await page.goto("/preview/reseller");
  const state = page.getByLabel("Trạng thái giao diện", { exact: true });

  await state.selectOption("forbidden");
  await expect(page.getByTestId("campaign-card")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Bạn chưa có quyền Cộng tác viên" })).toBeVisible();
  await expect(page.locator("main").getByRole("link", { name: /đăng nhập/i })).toHaveAttribute(
    "href",
    "/login?next=/reseller/campaigns",
  );
  await state.selectOption("session-expired");
  await expect(page.getByTestId("campaign-card")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Phiên đăng nhập đã hết hạn", exact: true })).toBeVisible();
  await expect(page.locator("main").getByRole("link", { name: /đăng nhập/i })).toHaveAttribute(
    "href",
    "/login?next=/reseller/campaigns",
  );
});

test("keyboard skip link moves focus into the reseller main region", async ({ page }) => {
  await page.goto("/preview/reseller");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Đến nội dung chính" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("unauthenticated feed navigation preserves its destination on the login redirect", async ({ page }) => {
  await page.goto("/reseller/campaigns");
  await expect(page).toHaveURL(/\/login\?/);
  const url = new URL(page.url());
  expect(url.pathname).toBe("/login");
  expect(url.searchParams.get("next")).toBe("/reseller/campaigns");
});
