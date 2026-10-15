import { expect, test, type Page } from "@playwright/test";
import jsQR from "jsqr";
import { fixtureCampaignDetail as campaign } from "./fixtures/reseller-content-kit";
import { trackingFixtureUrl } from "./fixtures/reseller-tracking";

const url = `/preview/reseller/campaigns/${campaign.id}?state=approved&tracking=`;
const modal = (page: Page) => page.getByRole("dialog", { name: "Link tiếp thị & QR" });
async function open(page: Page, state = "success") {
  await page.goto(url + state);
  await page.getByRole("button", { name: "Tạo link", exact: true }).click();
  await expect(modal(page)).toBeVisible();
}
async function create(page: Page) {
  await modal(page).getByRole("button", { name: "Tạo link tiếp thị", exact: true }).click();
}
test.beforeEach(async ({ page }) => {
  await page.route("**/*", async route => {
    const request = new URL(route.request().url());
    if (!["127.0.0.1", "localhost"].includes(request.hostname) || request.pathname.startsWith("/api/") || request.pathname.startsWith("/r/")) {
      throw new Error("Tracking preview attempted an external/API/redirect request");
    }
    await route.continue();
  });
});

test("opening/closing never creates; dialog traps keyboard focus and Escape restores opener", async ({ page }) => {
  await open(page);
  await expect(page.getByTestId("tracking-attempts")).toHaveText("Số lần gửi mô phỏng: 0");
  await expect(modal(page).getByRole("heading")).toBeFocused();
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    expect(await modal(page).evaluate(element => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Shift+Tab");
  expect(await modal(page).evaluate(element => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(modal(page)).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Tạo link", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("tracking-attempts")).toHaveText("Số lần gửi mô phỏng: 0");
});

test("explicit create sends one matching payload; QR decodes to response URL and Content Kit stays untouched", async ({ page }) => {
  await page.goto(url + "pending");
  const cta = await page.getByTestId("content-cta").textContent();
  await page.getByRole("button", { name: "Tạo link", exact: true }).click();
  await create(page);
  await expect(modal(page).getByRole("button", { name: "Đang tạo…", exact: true })).toBeDisabled();
  await modal(page).getByRole("button", { name: "Đang tạo…", exact: true }).evaluate((button: HTMLButtonElement) => { button.click(); button.click(); });
  await expect(page.getByTestId("tracking-attempts")).toHaveText("Số lần gửi mô phỏng: 1");
  await expect(page.getByTestId("tracking-attempts")).toHaveAttribute("data-payload", JSON.stringify({ campaign_id: campaign.id, product_id: campaign.product_id }));
  await expect(page.getByLabel("Link tiếp thị mô phỏng", { exact: true })).toHaveValue(trackingFixtureUrl);
  const pixels = await modal(page).getByRole("img", { name: "Mã QR của link tiếp thị" }).evaluate(async element => {
    const svg = new XMLSerializer().serializeToString(element);
    const image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 360;
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0, 360, 360);
    return Array.from(context.getImageData(0, 0, 360, 360).data);
  });
  expect(jsQR(Uint8ClampedArray.from(pixels), 360, 360)?.data).toBe(trackingFixtureUrl);
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("content-cta")).toHaveText(cta ?? "");
  await page.getByRole("button", { name: "Tạo link", exact: true }).click();
  await expect(modal(page).getByRole("button", { name: "Tạo link tiếp thị", exact: true })).toBeDisabled();
  await expect(page.getByTestId("tracking-attempts")).toHaveText("Số lần gửi mô phỏng: 1");
});

test("Copy succeeds only after clipboard resolves with exact URL", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
    writeText: (value: string) => new Promise<void>(resolve => document.addEventListener("fixture-tracking-copy", () => {
      document.documentElement.dataset.copiedTracking = value; resolve();
    }, { once: true })),
  } }));
  await open(page);
  await create(page);
  await modal(page).getByRole("button", { name: "Copy link", exact: true }).click();
  await expect(modal(page).getByText("Đã sao chép link.", { exact: true })).toHaveCount(0);
  await expect(modal(page).getByRole("button", { name: "Đang sao chép link…" })).toBeDisabled();
  await page.evaluate(() => document.dispatchEvent(new Event("fixture-tracking-copy")));
  await expect(modal(page).getByText("Đã sao chép link.", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.dataset.copiedTracking)).toBe(trackingFixtureUrl);
});

test("clipboard denial/unavailability offers keyboard manual copy without false success", async ({ page }) => {
  for (const denied of [true, false]) {
    await page.addInitScript(value => Object.defineProperty(navigator, "clipboard", { configurable: true, value: value
      ? { writeText: () => Promise.reject(new Error("denied")) } : undefined }), denied);
    await open(page);
    await create(page);
    await modal(page).getByRole("button", { name: "Copy link", exact: true }).click();
    await expect(modal(page).getByRole("alert")).toContainText("Không thể sao chép link");
    await expect(modal(page).getByText("Đã sao chép link.", { exact: true })).toHaveCount(0);
    await modal(page).getByRole("button", { name: "Chọn link để sao chép thủ công" }).focus();
    await page.keyboard.press("Enter");
    const text = page.getByLabel("Link tiếp thị mô phỏng", { exact: true });
    await expect(text).toBeFocused();
    expect(await text.evaluate((element: HTMLTextAreaElement) => element.selectionEnd - element.selectionStart)).toBe(trackingFixtureUrl.length);
  }
});

test("errors/session/ambiguous responses expose no URL or QR and never retry automatically", async ({ page }) => {
  for (const state of ["error", "session", "permission", "malformed", "network"]) {
    await open(page, state);
    await create(page);
    await expect(modal(page).getByRole("alert")).toBeVisible();
    await expect(modal(page).getByRole("img")).toHaveCount(0);
    await expect(modal(page).getByRole("button", { name: "Copy link", exact: true })).toHaveCount(0);
    if (["malformed", "network", "session"].includes(state)) await expect(modal(page).getByRole("button", { name: "Tạo link tiếp thị", exact: true })).toBeDisabled();
    if (state === "session") await expect(modal(page).getByRole("link", { name: "Đăng nhập lại ↗" })).toHaveAttribute("href", `/login?next=${encodeURIComponent(`/reseller/campaigns/${campaign.id}`)}`);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Tạo link", exact: true }).click();
    await expect(page.getByTestId("tracking-attempts")).toHaveText("Số lần gửi mô phỏng: 1");
  }
});

test("blocked/missing product stays disabled; pending can close safely; result fits viewport", async ({ page }, testInfo) => {
  for (const state of ["blocked", "missing-product"]) {
    await open(page, state);
    await expect(modal(page).getByRole("button", { name: "Tạo link tiếp thị", exact: true })).toBeDisabled();
    await expect(page.getByTestId("tracking-attempts")).toHaveText("Số lần gửi mô phỏng: 0");
  }
  await open(page, "pending");
  await create(page);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Tạo link", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Link tiếp thị mô phỏng", { exact: true })).toHaveValue(trackingFixtureUrl);
  await expect(page.getByTestId("tracking-attempts")).toHaveText("Số lần gửi mô phỏng: 1");
  expect(await modal(page).evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("tracking-modal.png"), fullPage: false });
});

test("Copy CTA with link preserves original and whitespace, waits for clipboard, and handles empty/no placeholder honestly", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
    writeText: (value: string) => new Promise<void>(resolve => document.addEventListener("fixture-cta-copy", () => {
      document.documentElement.dataset.copiedCta = value; resolve();
    }, { once: true })),
  } }));
  await page.goto(url + "success");
  const original = await page.getByTestId("content-cta").textContent();
  expect(original).toContain("[LINK_MUA_VE]");
  await expect(page.getByRole("button", { name: "Copy CTA kèm link", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Copy CTA", exact: true }).click();
  await page.evaluate(() => document.dispatchEvent(new Event("fixture-cta-copy")));
  await expect(page.getByText("Đã sao chép CTA.", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.dataset.copiedCta)).toBe(original);
  await page.getByRole("button", { name: "Tạo link", exact: true }).click();
  await create(page);
  await expect(page.getByLabel("Link tiếp thị mô phỏng", { exact: true })).toHaveValue(trackingFixtureUrl);
  await page.keyboard.press("Escape");
  const action = page.getByRole("button", { name: "Copy CTA kèm link", exact: true });
  await action.focus(); await page.keyboard.press("Enter");
  await expect(action).toBeDisabled();
  await expect(page.getByText("Đã sao chép CTA kèm link.", { exact: true })).toHaveCount(0);
  await page.evaluate(() => document.dispatchEvent(new Event("fixture-cta-copy")));
  await expect(page.getByText("Đã sao chép CTA kèm link.", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.dataset.copiedCta)).toBe(original!.split("[LINK_MUA_VE]").join(trackingFixtureUrl));
  await expect(page.getByTestId("content-cta")).toHaveText(original!);
  await page.getByRole("button", { name: "Family", exact: true }).click();
  await expect(action).toBeDisabled();
  await expect(page.getByText(/CTA không có \[LINK_MUA_VE\]/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy CTA", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Local Guide", exact: true }).click();
  await page.getByLabel("Biến thể", { exact: true }).selectOption({ index: 1 });
  await expect(action).toBeDisabled();
  await expect(page.getByText("CTA đang trống. Chưa có nội dung để sao chép kèm link.")).toBeVisible();
});

test("CTA clipboard failure offers exact manual copy; localhost URL is labeled in modal and CTA", async ({ page }, testInfo) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: () => Promise.reject(new Error("fixture denied")) } }));
  await open(page, "localhost"); await create(page);
  const local = "http://localhost:3000/r/TESTlink";
  await expect(page.getByLabel("Link tiếp thị mô phỏng", { exact: true })).toHaveValue(local);
  await expect(modal(page).getByRole("note")).toContainText("chưa dùng để chia sẻ công khai");
  await page.keyboard.press("Escape");
  const original = await page.getByTestId("content-cta").textContent();
  await page.getByRole("button", { name: "Copy CTA kèm link", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Không thể sao chép CTA kèm link" })).toBeVisible();
  await expect(page.getByText("Đã sao chép CTA kèm link.", { exact: true })).toHaveCount(0);
  const manual = page.getByLabel("Sao chép thủ công CTA kèm link", { exact: true });
  const copied = original!.split("[LINK_MUA_VE]").join(local);
  await expect(manual).toHaveValue(copied);
  await page.getByRole("button", { name: "Chọn nội dung CTA kèm link", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(manual).toBeFocused();
  expect(await manual.evaluate((element: HTMLTextAreaElement) => element.selectionEnd - element.selectionStart)).toBe(copied.length);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("cta-with-local-link.png"), fullPage: true });
});

test("campaign/product/session changes clear link and pending old responses cannot populate new scope", async ({ page }) => {
  for (const field of ["campaign", "product", "session"]) {
    await open(page, "scope"); await create(page);
    await expect(page.getByLabel("Link tiếp thị mô phỏng", { exact: true })).toHaveValue(trackingFixtureUrl);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Copy CTA kèm link", exact: true })).toBeEnabled();
    await page.getByRole("button", { name: `Đổi ${field} fixture`, exact: true }).click();
    await expect(page.getByRole("button", { name: "Copy CTA kèm link", exact: true })).toBeDisabled();
    await page.getByRole("button", { name: "Tạo link", exact: true }).click();
    await expect(modal(page).getByRole("img")).toHaveCount(0);
    await create(page); // old request is now pending as the scope changes again
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: `Đổi ${field} fixture`, exact: true }).click();
    await expect(page.getByTestId("tracking-settled")).toHaveText("Số phản hồi fixture: 2");
    await expect(page.getByRole("button", { name: "Copy CTA kèm link", exact: true })).toBeDisabled();
    await page.getByRole("button", { name: "Tạo link", exact: true }).click();
    await expect(modal(page).getByRole("img")).toHaveCount(0);
    await expect(page.getByTestId("tracking-attempts")).toHaveText("Số lần gửi mô phỏng: 0");
  }
});
