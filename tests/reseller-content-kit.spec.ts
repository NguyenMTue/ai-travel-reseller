import { expect, test } from "@playwright/test";
import { fixtureCampaignDetail as campaign, fixtureContentVariants as variants, approvedFixtureVariants } from "./fixtures/reseller-content-kit";

const url = `/preview/reseller/campaigns/${campaign.id}`;
test.beforeEach(async ({ page }) => {
  await page.route("**/*", async (route) => {
    const request = new URL(route.request().url());
    if (!["127.0.0.1", "localhost"].includes(request.hostname) || request.pathname.startsWith("/api/")) {
      throw new Error("Content Kit fixture attempted a backend or external request");
    }
    await route.continue();
  });
});

test("posting tips belong to permitted Reseller Content Kit and stay hidden for unavailable content", async ({ page }) => {
  const opener = page.getByRole("button", { name: "Mẹo đăng video hiệu quả", exact: true });
  for (const state of ["blocked", "empty", "error", "permission-error", "schema-error", "network-error", "configuration-error"]) {
    await page.goto(`${url}?state=${state}`);
    await expect(opener).toHaveCount(0);
    await expect(page.getByRole("dialog", { name: "Mẹo Đăng Video AI Triệu View Dành Cho Reseller" })).toHaveCount(0);
  }
  await page.goto(url);
  await page.getByRole("button", { name: "Budget Traveler", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Persona này chưa có nội dung" })).toBeVisible();
  await expect(opener).toHaveCount(0);
  await page.goto(`${url}?state=approved`);
  await expect(page.getByRole("region", { name: "Content Kit", exact: true }).getByRole("button", { name: "Mẹo đăng video hiệu quả", exact: true })).toHaveCount(1);
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "Mẹo Đăng Video AI Triệu View Dành Cho Reseller" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("listitem")).toHaveCount(4);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
});

test("feed opens correct fixture ID; personas and variants show only selected content", async ({ page }) => {
  await page.goto("/preview/reseller");
  await page.getByRole("link", { name: "Xem chi tiết Hội An Foodie", exact: true }).click();
  // Dev-only route may compile on the first click; still assert exact navigation.
  await expect(page).toHaveURL(new RegExp(`${campaign.id}$`), { timeout: 30_000 });
  await expect(page.getByTestId("content-hook")).toHaveText(variants[0].hook ?? "");
  await page.getByLabel("Biến thể", { exact: true }).selectOption(variants[1].id);
  await expect(page.getByTestId("content-hook")).toHaveText(variants[1].hook ?? "");
  await expect(page.getByRole("button", { name: "Copy CTA", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Family", exact: true }).click();
  await expect(page.getByTestId("content-hook")).toHaveText("Hook fixture Family");
  await expect(page.getByRole("button", { name: "Family", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Foodie", exact: true }).click();
  await expect(page.getByRole("button", { name: "Copy Hook", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Copy Caption", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Budget Traveler", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Persona này chưa có nội dung" })).toBeVisible();
});

test("Copy reports success only after writing the exact selected field", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
      writeText: (value: string) => new Promise<void>((resolve) => {
        document.addEventListener("fixture-copy-release", () => {
          document.documentElement.dataset.copiedText = value;
          resolve();
        }, { once: true });
      }),
    } });
  });
  await page.goto(url);
  for (const [label, value] of [["Hook", variants[0].hook], ["Script", variants[0].script], ["Caption", variants[0].caption], ["CTA", variants[0].cta]]) {
    await page.getByRole("button", { name: `Copy ${label}`, exact: true }).click();
    await expect(page.getByText(`Đã sao chép ${label}.`, { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: `Copy ${label}`, exact: true })).toBeDisabled();
    await page.evaluate(() => document.dispatchEvent(new Event("fixture-copy-release")));
    await expect(page.getByText(`Đã sao chép ${label}.`, { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.dataset.copiedText)).toBe(value);
  }
  await page.getByLabel("Biến thể", { exact: true }).selectOption(variants[1].id);
  await page.getByRole("button", { name: "Copy Caption", exact: true }).click();
  await page.evaluate(() => document.dispatchEvent(new Event("fixture-copy-release")));
  await expect(page.getByText("Đã sao chép Caption.", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.dataset.copiedText)).toBe(variants[1].caption);
});

test("clipboard denial offers exact read-only manual copy and keyboard selection", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: () => Promise.reject(new Error("denied")) } });
  });
  await page.goto(url);
  await page.getByRole("button", { name: "Copy Script", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("alert").filter({ hasText: "Không thể sao chép Script" })).toBeVisible();
  await expect(page.getByText("Đã sao chép Script.", { exact: true })).toHaveCount(0);
  const manual = page.getByLabel("Sao chép thủ công Script", { exact: true });
  await expect(manual).toHaveValue(variants[0].script ?? "");
  await page.getByRole("button", { name: "Chọn nội dung Script", exact: true }).click();
  await expect(manual).toBeFocused();
  expect(await manual.evaluate((element: HTMLTextAreaElement) => element.selectionEnd - element.selectionStart)).toBe(variants[0].script?.length);
});

test("clipboard unavailable exposes manual copy without false success", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined }));
  await page.goto(url);
  await page.getByRole("button", { name: "Copy CTA", exact: true }).click();
  await expect(page.getByLabel("Sao chép thủ công CTA", { exact: true })).toHaveValue(variants[0].cta ?? "");
  await expect(page.getByText("Đã sao chép CTA.", { exact: true })).toHaveCount(0);
});

test("unconfirmed policy and unknown campaign never expose content or Copy", async ({ page }) => {
  await page.goto(`${url}?state=blocked`);
  await expect(page.getByRole("heading", { name: "Nội dung đang chờ xác nhận quyền hiển thị" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Copy / })).toHaveCount(0);
  await expect(page.getByTestId("content-hook")).toHaveCount(0);
  await page.goto("/preview/reseller/campaigns/77777777-7777-4777-8777-777777777777");
  await expect(page.getByRole("heading", { name: "Không tìm thấy chiến dịch fixture" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Copy / })).toHaveCount(0);
  await page.goto(`/reseller/campaigns/${campaign.id}`);
  const redirected = new URL(page.url());
  expect(redirected.pathname).toBe("/login");
  expect(redirected.searchParams.get("next")).toBe(`/reseller/campaigns/${campaign.id}`);
});

test("long variant remains responsive with keyboard persona focus", async ({ page }, testInfo) => {
  await page.goto(url);
  await page.getByLabel("Biến thể", { exact: true }).selectOption(variants[1].id);
  await expect(page.getByTestId("content-script")).toContainText("chuỗidài");
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Local Guide", exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Family", exact: true })).toBeFocused();
  // Full-page capture after focus scrolling must reset the viewport so fixed
  // elements retain their viewport positions in the exported image.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({ path: testInfo.outputPath("content-kit-long.png"), fullPage: true });
});

test("confirmed contract fixture maps personas and variants, copies untouched placeholder and formats dates", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
      writeText: async (value: string) => { document.documentElement.dataset.copiedText = value; },
    } });
  });
  await page.goto(`${url}?state=approved`);
  await expect(page.getByText("14/10/2026", { exact: true })).toBeVisible();
  await expect(page.getByText("21/10/2026", { exact: true })).toBeVisible();
  const placeholderNotice = page.getByRole("note").filter({ hasText: "Nội dung còn [LINK_MUA_VE]." });
  await expect(placeholderNotice).toHaveCount(1);
  await expect(placeholderNotice).toContainText("Bạn cần bổ sung link tiếp thị trước khi đăng.");
  await expect(page.getByRole("region", { name: "Đăng lên Telegram" }).getByRole("note")).toHaveText([
    "Tạo link tiếp thị trước khi đăng để ghi nhận hoa hồng.", "Bản xem trước không gửi bài thật.",
  ]);
  await expect(page.getByTestId("content-script")).toHaveText(approvedFixtureVariants[0].script ?? "");
  await page.getByRole("button", { name: "Copy CTA", exact: true }).click();
  await expect(page.getByText("Đã sao chép CTA.", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.dataset.copiedText)).toBe(approvedFixtureVariants[0].cta);
  await page.getByRole("button", { name: "Copy Caption", exact: true }).click();
  await expect(page.getByText("Đã sao chép Caption.", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.dataset.copiedText)).toBe(approvedFixtureVariants[0].caption);
  for (const field of ["Hook", "Script"] as const) {
    await page.getByRole("button", { name: `Copy ${field}`, exact: true }).click();
    await expect(page.getByText(`Đã sao chép ${field}.`, { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.dataset.copiedText)).toBe(approvedFixtureVariants[0][field === "Hook" ? "hook" : "script"]);
  }
  await page.getByLabel("Biến thể", { exact: true }).selectOption(approvedFixtureVariants[1].id);
  await expect(page.getByRole("button", { name: "Copy Hook", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Copy CTA", exact: true })).toBeDisabled();
  await expect(placeholderNotice).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Đăng lên Telegram" }).getByRole("note")).toHaveCount(2);
  for (const [label, hook] of [["Family", "Hook contract fixture riêng Family"], ["Foodie", "Hook contract fixture Foodie"], ["Budget Traveler", "Hook contract fixture Budget Traveler"]]) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect(page.getByTestId("content-hook")).toHaveText(hook);
    const selected = approvedFixtureVariants.find((variant) => variant.hook === hook)!;
    for (const [field, key] of [["Hook", "hook"], ["Script", "script"], ["Caption", "caption"], ["CTA", "cta"]] as const) {
      await page.getByRole("button", { name: `Copy ${field}`, exact: true }).click();
      await expect(page.getByText(`Đã sao chép ${field}.`, { exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.dataset.copiedText)).toBe(selected[key]);
    }
  }
  for (const hidden of ["Không được lộ pending fixture", "Không được lộ owner khác fixture", "Không được map persona lạ fixture", "Không được lộ published fixture", "Không được lộ public fixture", "Không được lộ campaign khác fixture"]) {
    await expect(page.getByText(hidden, { exact: true })).toHaveCount(0);
  }
});

test("successful empty kit differs from empty persona and each read failure without exposing Copy", async ({ page }) => {
  await page.goto(`${url}?state=empty`);
  await expect(page.getByRole("heading", { name: "Chưa có nội dung đủ điều kiện" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Persona này chưa có nội dung" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Copy / })).toHaveCount(0);
  for (const [state, text] of [
    ["error", "Truy vấn dữ liệu chưa thực hiện được"], ["permission-error", "Dịch vụ từ chối quyền đọc dữ liệu"],
    ["schema-error", "Chưa thể xử lý cấu trúc dữ liệu trả về"], ["network-error", "Không kết nối được dịch vụ dữ liệu"],
    ["configuration-error", "Chưa cấu hình dịch vụ Supabase"],
  ]) {
    await page.goto(`${url}?state=${state}`);
    await expect(page.getByRole("heading", { name: "Chưa thể tải Content Kit" })).toBeVisible();
    await expect(page.getByText(text, { exact: false })).toBeVisible();
    await expect(page.getByRole("button", { name: "Thử lại", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Copy / })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Nội dung đang chờ xác nhận quyền hiển thị" })).toHaveCount(0);
  }
});
