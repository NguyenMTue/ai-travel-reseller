import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const evidenceDirectory = resolve(
  process.cwd(),
  "tests/qa-deliverables/reseller-regression/screenshots",
);
const campaignId = "11111111-1111-4111-8111-111111111111";
const campaignDetailUrl = `/preview/reseller/campaigns/${campaignId}?state=approved&tracking=success`;

mkdirSync(evidenceDirectory, { recursive: true });

test.use({ viewport: { width: 1440, height: 1000 } });

async function capture(page: import("@playwright/test").Page, filename: string) {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: resolve(evidenceDirectory, filename),
    fullPage: true,
    animations: "disabled",
  });
}

test("01 - reseller registration UI and current account entry point", async ({ page }) => {
  await page.goto("/register?role=reseller");

  await expect(page.getByRole("heading", { name: "Kết nối từ hôm nay." })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Cộng tác viên" })).toBeChecked();
  await expect(page.getByLabel("Họ và tên", { exact: false })).toBeVisible();
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Mật khẩu", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Xác nhận mật khẩu", { exact: false })).toBeVisible();

  await capture(page, "01-reseller-overview-or-profile.png");
});

test("02 - campaign feed renders and search/filter interactions work", async ({ page }) => {
  await page.goto("/preview/reseller");

  await expect(page.getByRole("heading", { name: "Chiến dịch dành cho bạn" })).toBeVisible();
  await expect(page.getByTestId("campaign-card")).toHaveCount(4);
  await expect(page.getByLabel("Tìm kiếm chiến dịch", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Danh mục", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Địa điểm", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Hoa hồng", { exact: true })).toBeVisible();
  await expect(page.getByTestId("campaign-card").first()).toContainText("Hoa hồng");
  await expect(page.getByTestId("campaign-card").first()).toContainText("nội dung khả dụng");

  await page.getByLabel("Tìm kiếm chiến dịch", { exact: true }).fill("hoi an");
  await expect(page.getByTestId("campaign-card")).toHaveCount(1);
  await expect(page.getByTestId("campaign-card")).toContainText("Hội An Foodie");
  await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  await expect(page.getByTestId("campaign-card")).toHaveCount(4);

  await capture(page, "02-reseller-campaign-feed.png");
});

test("03 - campaign detail and available Content Kit render", async ({ page }) => {
  await page.goto(campaignDetailUrl);

  await expect(page.getByRole("heading", { name: "Hội An Foodie" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Thông tin sản phẩm" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Content Kit" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Chọn persona" })).toBeVisible();
  await expect(page.getByTestId("content-hook")).toBeVisible();
  await expect(page.getByTestId("content-script")).toBeVisible();
  await expect(page.getByTestId("content-caption")).toBeVisible();
  await expect(page.getByTestId("content-cta")).toBeVisible();

  await capture(page, "05-reseller-content-library.png");
});

test("04 - tracking link modal shows the isolated fixture result", async ({ page }) => {
  await page.goto(campaignDetailUrl);

  await expect(page.getByRole("heading", { name: "Hội An Foodie" })).toBeVisible();
  await page.getByRole("button", { name: "Tạo link", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Link tiếp thị & QR" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Tạo link tiếp thị", exact: true }).click();
  const link = dialog.getByLabel("Link tiếp thị mô phỏng", { exact: true });
  await expect(link).toBeVisible();
  await expect(link).toHaveValue(/\/r\/[A-Za-z0-9_-]+/);
  await expect(dialog.getByRole("img", { name: "Mã QR của link tiếp thị" })).toBeVisible();

  await capture(page, "03-reseller-tracking-modal-voucher.png");
});

test("05 - tracking link copy gives success feedback and exact clipboard content", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(campaignDetailUrl);

  await expect(page.getByRole("heading", { name: "Hội An Foodie" })).toBeVisible();
  await page.getByRole("button", { name: "Tạo link", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Link tiếp thị & QR" });
  await dialog.getByRole("button", { name: "Tạo link tiếp thị", exact: true }).click();
  const link = dialog.getByLabel("Link tiếp thị mô phỏng", { exact: true });
  await expect(link).toBeVisible();
  const expectedLink = await link.inputValue();
  await dialog.getByRole("button", { name: "Copy link", exact: true }).click();
  await expect(dialog.getByText("Đã sao chép link.", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(expectedLink);

  await capture(page, "04-reseller-copy-tracking-link-feedback.png");
});

test("06 - caption copy writes the selected content and reports success", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(campaignDetailUrl);

  await expect(page.getByRole("heading", { name: "Content Kit" })).toBeVisible();
  const caption = await page.getByTestId("content-caption").innerText();
  await page.getByRole("button", { name: "Copy Caption", exact: true }).click();
  await expect(page.getByText("Đã sao chép Caption.", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(caption);

  await capture(page, "06-reseller-copy-content-caption.png");
});
