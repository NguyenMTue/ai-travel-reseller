import { expect, test, type Page } from "@playwright/test";

const policies = [
  {
    route: "/terms",
    title: "Điều khoản sử dụng",
    sectionCount: 6,
    relatedRoute: "/privacy",
    relatedTitle: "Chính sách quyền riêng tư",
  },
  {
    route: "/privacy",
    title: "Chính sách quyền riêng tư",
    sectionCount: 7,
    relatedRoute: "/terms",
    relatedTitle: "Điều khoản sử dụng",
  },
] as const;

async function expectNoHorizontalOverflow(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

for (const policy of policies) {
  test(`${policy.route} is a public, readable draft with keyboard section navigation`, async ({
    page,
    context,
  }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await context.clearCookies();

    const response = await page.goto(policy.route);
    expect(response?.status()).toBe(200);
    expect((await response?.request().allHeaders())?.cookie).toBeUndefined();
    await expect(page).toHaveURL(new RegExp(`${policy.route}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    const title = page.getByRole("heading", {
      level: 1,
      name: policy.title,
      exact: true,
    });
    await expect(title).toHaveAttribute("id", "legal-title");
    await expect(title).toHaveAttribute("tabindex", "-1");
    await expect(
      page.getByText("Bản nháp — chờ công ty phê duyệt", { exact: true }),
    ).toBeVisible();

    const main = page.getByRole("main");
    await expect(main).toHaveAttribute("id", "main-content");
    await expect(main).toHaveAttribute("tabindex", "-1");
    await expect(main.getByRole("heading", { level: 2 })).toHaveCount(
      policy.sectionCount + 1,
    );
    const tocTitle = page.locator("#legal-toc-title");
    await expect(tocTitle).toHaveJSProperty("tagName", "H2");
    const toc = page.locator('nav[aria-labelledby="legal-toc-title"]');
    await expect(toc).toHaveAccessibleName(/.+/);
    const tocLinks = toc.getByRole("link");
    await expect(tocLinks).toHaveCount(policy.sectionCount);

    await page.keyboard.press("Tab");
    const skipLink = page.getByRole("link", {
      name: "Đến nội dung chính",
      exact: true,
    });
    await expect(skipLink).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(main).toBeFocused();

    const sectionIds: string[] = [];
    for (const link of await tocLinks.all()) {
      await expect(link).toHaveAccessibleName(/.+/);
      const href = await link.getAttribute("href");
      expect(href).toMatch(/^#[a-z][a-z0-9-]+$/);
      const id = href!.slice(1);
      sectionIds.push(id);
      const heading = page.locator(`[id="${id}"]`);
      await expect(heading).toHaveCount(1);
      await expect(heading).toHaveJSProperty("tagName", "H2");
      await expect(heading).toHaveAttribute("tabindex", "-1");

      await link.focus();
      await expect(link).toBeFocused();
      expect(
        await link.evaluate((element) => {
          const style = getComputedStyle(element);
          return style.outlineStyle !== "none" && parseFloat(style.outlineWidth) >= 2;
        }),
      ).toBe(true);
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(new RegExp(`${href}$`));
      await expect(heading).toBeFocused();
      await expect(heading).toBeInViewport();
    }
    expect(new Set(sectionIds).size).toBe(policy.sectionCount);

    const backToTop = main.locator('a[href="#legal-title"]');
    await expect(backToTop).toHaveCount(1);
    await backToTop.focus();
    await page.keyboard.press("Enter");
    await expect(title).toBeFocused();
    await expect(title).toBeInViewport();

    const paragraphs = await main.locator("p").evaluateAll((elements) =>
      elements
        .filter((element) => element.textContent?.trim())
        .map((element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return {
            lineHeight: parseFloat(style.lineHeight),
            fontSize: parseFloat(style.fontSize),
            fitsWidth: element.scrollWidth <= element.clientWidth + 1,
            fitsHeight: element.scrollHeight <= element.clientHeight + 1,
            left: rect.left,
            right: rect.right,
          };
        }),
    );
    expect(paragraphs.length).toBeGreaterThan(policy.sectionCount);
    for (const paragraph of paragraphs) {
      expect(paragraph.lineHeight / paragraph.fontSize).toBeGreaterThanOrEqual(1.5);
      expect(paragraph.fitsWidth).toBe(true);
      expect(paragraph.fitsHeight).toBe(true);
      expect(paragraph.left).toBeGreaterThanOrEqual(0);
      expect(paragraph.right).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
    }
    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath(
        `${policy.route.slice(1)}-${page.viewportSize()!.width}.png`,
      ),
      fullPage: true,
    });

    const relatedPolicy = main.getByRole("link", {
      name: policy.relatedTitle,
      exact: true,
    });
    await expect(relatedPolicy).toHaveAttribute("href", policy.relatedRoute);
    await relatedPolicy.click();
    await expect(page).toHaveURL(new RegExp(`${policy.relatedRoute}$`));
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: policy.relatedTitle,
        exact: true,
      }),
    ).toBeVisible();
    await page.goBack();
    await expect(title).toBeVisible();

    const homeLink = main.getByRole("link", {
      name: "Trở về trang chủ",
      exact: true,
    });
    await expect(homeLink).toHaveAttribute("href", "/");
    await homeLink.click();
    await expect(page).toHaveURL(/\/$/);
    expect(errors).toEqual([]);
  });
}

test("Landing and Auth link to both policy drafts without changing registration", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  for (const route of ["/", "/login", "/register?role=reseller"]) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expectNoHorizontalOverflow(page);
    const policyLinks = page.getByRole("navigation", {
      name: "Tài liệu chính sách",
      exact: true,
    });
    await expect(policyLinks).toHaveCount(1);
    if (route !== "/") {
      expect(
        await policyLinks.evaluate((element) => element.closest("form") === null),
      ).toBe(true);
    }
    if (route.startsWith("/register")) {
      await expect(page.getByRole("checkbox")).toHaveCount(0);
      await expect(
        page.getByRole("radio", { name: "Cộng tác viên", exact: true }),
      ).toBeChecked();
    }

    for (const policy of policies) {
      const link = policyLinks.getByRole("link", {
        name: policy.title,
        exact: true,
      });
      await expect(link).toHaveAttribute("href", policy.route);
      await link.focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(new RegExp(`${policy.route}$`));
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: policy.title,
          exact: true,
        }),
      ).toBeVisible();
      await page.goBack();
      await expect(page).toHaveURL(
        route === "/" ? /\/$/ : new RegExp(route.replace("?", "\\?") + "$"),
      );
      await expect(policyLinks).toBeVisible();
    }
    if (route.startsWith("/register")) {
      await expect(page.getByRole("checkbox")).toHaveCount(0);
      await expect(
        page.getByRole("radio", { name: "Cộng tác viên", exact: true }),
      ).toBeChecked();
    }
  }
  expect(errors).toEqual([]);
});
