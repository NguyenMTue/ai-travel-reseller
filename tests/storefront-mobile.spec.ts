import { expect, test } from "@playwright/test";

const base = "/storefront/sunworld/ba-na-hills?campaign=44444444-4444-4444-4444-444444444444";
const scenarios = [
  { name: "missing-ref", url: base, displayed: "950.000", modal: "950.000" },
  { name: "invalid-ref", url: base + "&ref=invalid", displayed: "950.000", modal: "950.000" },
  { name: "valid-unconfirmed", url: base + "&ref=22222222-2222-2222-2222-111111111111", displayed: "950.000", modal: "950.000" },
  { name: "confirmed-5-fixture", url: "/storefront/fixture-confirmed", displayed: "902.500", modal: "902.500" },
];

test.beforeEach(async ({ page }) => {
  await page.route("**/*", route => {
    const url = new URL(route.request().url());
    if (url.origin !== "http://127.0.0.1:3216") return route.abort();
    expect(route.request().method()).toBe("GET");
    return route.continue();
  });
});

for (const scenario of scenarios) {
  test(scenario.name + " — read, scroll, CTA and modal pricing", async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto(scenario.url);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const card = page.getByRole("complementary", { name: "Giá vé đã chọn" });
    await expect(card.getByTestId("price-card-amount")).toHaveText(scenario.displayed + " ₫");
    const mobile = testInfo.project.use.viewport!.width < 768;
    const bar = page.getByRole("region", { name: "Đặt vé nhanh" });
    await expect(bar).toBeVisible({ visible: mobile });
    if (mobile) {
      await expect(bar.getByTestId("sticky-cta-amount")).toHaveText(scenario.displayed + " ₫");
      const button = await bar.getByRole("button").boundingBox();
      expect(button!.height).toBeGreaterThanOrEqual(48);
      expect(button!.width).toBeGreaterThanOrEqual(48);
    }
    await page.getByRole("heading", { name: "Lịch trình trải nghiệm gợi ý" }).scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const footer = await page.locator("footer").boundingBox();
    if (mobile) {
      const barBox = await bar.boundingBox();
      expect(footer!.y + footer!.height).toBeLessThanOrEqual(barBox!.y);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("end-of-tour.png") });
    const trigger = mobile ? bar.getByRole("button", { name: "Đặt vé ngay", exact: true }) : card.getByRole("button", { name: /ĐẶT VÉ NGAY/ });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Đặt vé tham quan" });
    await expect(dialog).toBeVisible();
    await expect(bar).toHaveCount(0);
    const total = dialog.getByText("Tổng tiền thanh toán:").locator("..");
    await expect(total).toContainText(scenario.modal + " ₫");
    const continueButton = dialog.getByRole("button", { name: "TIẾP TỤC THANH TOÁN VIETQR" });
    await continueButton.scrollIntoViewIfNeeded();
    await expect(continueButton).toBeInViewport();
    const box = await continueButton.boundingBox();
    expect(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest("button")?.type, { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 })).toBe("submit");
    // Exercise form validation only: no order creation or payment request.
    await continueButton.click();
    await expect(dialog).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("checkout-total.png") });
    await testInfo.attach("pricing", { body: JSON.stringify({ scenario: scenario.name, card: scenario.displayed, sticky: mobile ? scenario.displayed : "hidden", modal: scenario.modal }), contentType: "application/json" });
    expect(errors).toEqual([]);
  });
}

test("package pills update both prices and checkout selection", async ({ page }, testInfo) => {
  await page.goto(base);
  const selector = page.getByRole("group", { name: "Chọn gói vé" });
  await selector.getByRole("button").nth(1).click();
  await expect(selector.getByRole("button").nth(1)).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("price-card-amount")).toHaveText("1.250.000 ₫");
  const mobile = testInfo.project.use.viewport!.width < 768;
  if (mobile) await expect(page.getByTestId("sticky-cta-amount")).toHaveText("1.250.000 ₫");
  const trigger = mobile ? page.getByRole("region", { name: "Đặt vé nhanh" }).getByRole("button") : page.getByRole("complementary", { name: "Giá vé đã chọn" }).getByRole("button");
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText(/Combo Cáp Treo.*70 Món/).first().locator("../..")).toHaveClass(/bg-emerald/);
  await expect(dialog.getByText("Tổng tiền thanh toán:").locator("..")).toContainText("1.250.000 ₫");
});
