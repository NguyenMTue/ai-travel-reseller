import { expect, test, type Page } from "@playwright/test";
import { validCampaignFixture } from "./fixtures/merchant-campaigns";

const preview = "/preview/merchant/campaigns/new";
async function fillCampaign(page: Page) {
  await page.getByLabel("Sản phẩm của doanh nghiệp").selectOption(validCampaignFixture.product_id);
  await page.getByLabel("Tên chiến dịch", { exact: false }).fill(validCampaignFixture.name);
  await page.getByLabel("Đối tượng mục tiêu", { exact: false }).fill(validCampaignFixture.target_audience);
  await page.getByLabel("Địa điểm mục tiêu", { exact: false }).fill(validCampaignFixture.target_location);
  await page.getByLabel("Hoa hồng (%)", { exact: false }).fill(validCampaignFixture.commission_rate);
  await page.getByLabel("Ngày bắt đầu", { exact: false }).fill(validCampaignFixture.start_date);
  await page.getByLabel("Ngày kết thúc", { exact: false }).fill(validCampaignFixture.end_date);
}

async function noOverflow(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

test("public fixture is labeled, responsive and keyboard-accessible; Dashboard CTA and protected real route", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/merchant/campaigns/new");
  await expect(page).toHaveURL(/\/login\?next=/);
  await page.goto("/preview/merchant");
  await noOverflow(page);
  const createLink = page.getByRole("link", { name: "Tạo chiến dịch" });
  await expect(createLink).toHaveAttribute("href", preview);
  await createLink.click();
  await page.waitForURL(`**${preview}`);
  await expect(page.getByRole("heading", { level: 1, name: "Tạo chiến dịch" })).toBeVisible();
  await expect(page.getByText(/Dữ liệu mô phỏng, không lưu vào hệ thống thật/)).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Ghi chú cho AI — chưa hỗ trợ" })).toBeDisabled();
  await expect(page.locator('[name="ai_notes"]')).toHaveCount(0);
  await page.reload();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Đến nội dung chính" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  const product = page.getByLabel("Sản phẩm của doanh nghiệp");
  await product.focus();
  await page.keyboard.press("ArrowDown");
  // Enter opens the native select popup on Windows; Tab should advance directly.
  await expect(product).toHaveValue(validCampaignFixture.product_id);
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Tên chiến dịch", { exact: false })).toBeFocused();
  expect(await page.locator("#name").evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe("none");
  await fillCampaign(page);
  await noOverflow(page);
  await page.getByLabel("Sản phẩm của doanh nghiệp").selectOption({ index: 2 });
  await noOverflow(page);
  await page.screenshot({ path: testInfo.outputPath(`campaign-form-${page.viewportSize()!.width}.png`), fullPage: true });
  expect(errors).toEqual([]);
});

test("client validation points focus to required fields and rejects commission/date ranges without saving", async ({ page }) => {
  await page.goto(preview);
  await page.getByRole("button", { name: "Lưu mô phỏng" }).click();
  await expect(page.getByLabel("Sản phẩm của doanh nghiệp")).toBeFocused();
  await expect(page.locator("#product_id")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#product_id-error")).toBeVisible();
  await expect(page.getByText("Lượt lưu mô phỏng: 0")).toBeVisible();
  await fillCampaign(page);
  await page.locator("#commission_rate").fill("31");
  await page.getByRole("button", { name: "Lưu mô phỏng" }).click();
  await expect(page.locator("#commission_rate")).toBeFocused();
  await expect(page.locator("#commission_rate-error")).toBeVisible();
  await page.locator("#commission_rate").fill("10.5");
  await page.locator("#end_date").fill("2028-02-28");
  await page.getByRole("button", { name: "Lưu mô phỏng" }).click();
  await expect(page.locator("#end_date-error")).toContainText("không được trước");
  await expect(page.locator("#end_date")).toBeFocused();
  await expect(page.getByText("Lượt lưu mô phỏng: 0")).toBeVisible();
});

test("pending prevents repeated submissions and success confirms only a simulated campaign", async ({ page }) => {
  await page.goto(`${preview}?state=pending`);
  await fillCampaign(page);
  await page.getByRole("button", { name: "Lưu mô phỏng" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Đang lưu…" })).toBeDisabled();
  await expect(page.getByRole("form", { name: "Thông tin chiến dịch" })).toHaveAttribute("aria-busy", "true");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Mô phỏng thành công — không tạo chiến dịch thật.")).toBeVisible();
  await expect(page.getByText("Lượt lưu mô phỏng: 1")).toBeVisible();
  await expect(page.getByRole("button", { name: "Lưu mô phỏng" })).toBeDisabled();
  await expect(page.locator("#name")).toHaveValue(validCampaignFixture.name);
});

test("known save errors retain all entered values and distinguish network/session/permission/schema", async ({ page }) => {
  for (const [state, message] of [["save-error", "Chưa kết nối được dịch vụ dữ liệu"], ["save-session", "Phiên đăng nhập không còn hợp lệ"], ["save-permission", "Tài khoản chưa có quyền Merchant"], ["save-schema", "Dữ liệu hiện chưa tương thích"]]) {
    await page.goto(`${preview}?state=${state}`);
    await fillCampaign(page);
    await page.getByRole("button", { name: "Lưu mô phỏng" }).click();
    const alert = page.getByRole("form", { name: "Thông tin chiến dịch" }).getByRole("alert");
    await expect(alert).toContainText(message);
    await expect(alert).toBeFocused();
    for (const [field, value] of Object.entries(validCampaignFixture)) await expect(page.locator(`#${field}`)).toHaveValue(value);
    await expect(page.getByRole("button", { name: "Lưu mô phỏng" })).toBeEnabled();
    await noOverflow(page);
  }
});

test("uncertain outcome keeps input and blocks retries after a potentially committed save", async ({ page }) => {
  await page.goto(`${preview}?state=uncertain`);
  await fillCampaign(page);
  await page.getByRole("button", { name: "Lưu mô phỏng" }).click();
  await expect(page.getByRole("form", { name: "Thông tin chiến dịch" }).getByRole("alert")).toContainText("Không gửi lại để tránh tạo chiến dịch trùng");
  await expect(page.getByRole("button", { name: "Lưu mô phỏng" })).toBeDisabled();
  await expect(page.locator("#name")).toHaveValue(validCampaignFixture.name);
  await page.keyboard.press("Enter");
  await expect(page.getByText("Lượt lưu mô phỏng: 1")).toBeVisible();
});

test("loading, empty products, load errors, wrong role and unconfirmed contract have explicit states", async ({ page }) => {
  for (const [state, expected] of [["loading", "Đang tải sản phẩm của doanh nghiệp…"], ["empty", "Chưa có sản phẩm để tạo chiến dịch"], ["load-error", "Chưa tải được sản phẩm"], ["forbidden", "Cần quyền Merchant"], ["session", "Cần đăng nhập lại"], ["blocked", "Chưa mở lưu chiến dịch"]]) {
    await page.goto(`${preview}?state=${state}`);
    await expect(page.getByText(expected, { exact: state !== "blocked" })).toBeVisible();
    if (state === "empty" || state === "blocked") await expect(page.getByRole("button", { name: "Lưu mô phỏng" })).toBeDisabled();
    await noOverflow(page);
  }
});
