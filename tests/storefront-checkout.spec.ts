import { expect, test, type Page } from "@playwright/test";

type Payload = Record<string, unknown>;
async function install(page: Page, modes: string[] = ["pending"], prepareError = false) {
  const prepares: Payload[] = [], checks: Payload[] = [];
  await page.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.origin === "https://img.vietqr.io") return route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="224" height="224"><rect width="224" height="224" fill="white"/><text x="20" y="100">QR FIXTURE ONLY</text></svg>' });
    if (url.origin !== "http://127.0.0.1:3216") return route.abort();
    if (url.pathname === "/__fixtures__/checkout/prepare") {
      const { draft } = route.request().postDataJSON(); prepares.push(draft);
      if (prepareError && prepares.length === 1) return route.fulfill({ status: 500, json: { error: "fixture" } });
      const orderId = "ORDER-" + draft.requestId;
      const memo = "DH " + orderId;
      return route.fulfill({ json: { status: "ready", quote: { requestId: draft.requestId, orderId, totalAmount: draft.totalAmount, currency: "VND", bankName: "BANK FIXTURE", bankAccount: "0000000000", bankAccountName: "FIXTURE ONLY", transferContent: memo, vietQrUrl: "https://img.vietqr.io/image/fixture.png?amount=" + draft.totalAmount + "&addInfo=" + encodeURIComponent(memo) } } });
    }
    if (url.pathname === "/__fixtures__/checkout/check") {
      const { quote } = route.request().postDataJSON(); checks.push(quote);
      const mode = modes[Math.min(checks.length - 1, modes.length - 1)];
      if (mode === "network") return route.abort("internetdisconnected");
      if (mode === "http") return route.fulfill({ status: 503, json: {} });
      if (mode === "status-paid") return route.fulfill({ json: { success: true, orderId: quote.orderId, status: "paid", isPaid: true } });
      if (mode === "demo-ticket") return route.fulfill({ json: { success: true, dbRecorded: false, orderId: quote.orderId, eTicket: { ticketCode: "ET-DEMO", amount: quote.totalAmount, qrPayload: "TRAVEL_LINK_ETICKET:" + quote.orderId + ":ET-DEMO:" + quote.totalAmount, verifiedAt: new Date().toISOString() } } });
      if (mode === "demo" || mode === "recorded") return route.fulfill({ json: { success: true, dbRecorded: mode === "recorded", orderId: quote.orderId, commission: { status: "confirmed" } } });
      if (mode === "paid" || mode === "wrong") return route.fulfill({ json: { status: "paid", paymentVerified: true, requestId: quote.requestId, orderId: mode === "wrong" ? "OTHER-ORDER" : quote.orderId, amount: quote.totalAmount, currency: "VND", transactionId: "TX-SERVER-FIXTURE", paidAt: new Date().toISOString(), ticket: { orderId: quote.orderId, code: "ET-SERVER-FIXTURE", qrPayload: "signed-server-fixture-payload" } } });
      return route.fulfill({ json: { status: "pending", orderId: quote.orderId } });
    }
    if (url.pathname === "/api/storefront/orders/confirm") {
      return route.fulfill({ json: { success: true, dbRecorded: false, commission: { status: "confirmed", netAmount: 91200 } } });
    }
    if (url.pathname === "/api/storefront/orders/status") {
      return route.fulfill({ json: { success: true, isPaid: false } });
    }
    expect(route.request().method()).toBe("GET");
    return route.continue();
  });
  return { prepares, checks };
}
async function open(page: Page, fixture = true) {
  await page.goto(fixture ? "/storefront/fixture-checkout" : "/storefront/sunworld/ba-na-hills?campaign=44444444-4444-4444-4444-444444444444&ref=22222222-2222-2222-2222-111111111111");
  const mobile = page.viewportSize()!.width < 768;
  await (mobile ? page.getByRole("region", { name: "Đặt vé nhanh" }).getByRole("button") : page.getByRole("complementary", { name: "Giá vé đã chọn" }).getByRole("button")).click();
  return page.getByRole("dialog", { name: "Đặt vé tham quan" });
}
async function fill(page: Page) {
  await page.getByRole("textbox", { name: "Họ và tên", exact: true }).fill("Khách Fixture");
  await page.getByRole("textbox", { name: "Số điện thoại", exact: true }).fill("0901234567");
}
const next = (page: Page) => page.getByRole("button", { name: "TIẾP TỤC THANH TOÁN VIETQR", exact: true });
const check = (page: Page) => page.getByRole("button", { name: /TÔI ĐÃ CHUYỂN KHOẢN/i });

test("production demo checkout displays VietQR and completes mock payment with issued ticket", async ({ page }, info) => {
  await install(page);
  const dialog = await open(page, false);
  await expect(dialog.getByText("Tổng tiền thanh toán:").locator("..")).toContainText("950.000 ₫");
  await fill(page); await next(page).click();
  await expect(page.getByAltText("Mã VietQR thanh toán")).toBeVisible();
  await expect(dialog.getByText("MBBank (Ngân Hàng Quân Đội)")).toBeVisible();
  await check(page).click();
  await expect(page.getByRole("region", { name: "E-Ticket đã xác nhận" })).toBeVisible();
  await expect(page.getByText(/ET-[A-Z0-9]+/i)).toBeVisible();
  await expect(page.getByAltText("Mã QR vé điện tử")).toBeVisible();
  await page.screenshot({ path: info.outputPath("production-demo-payment.png") });
});

test("confirmed pricing, guests/package edits and back preserve data and bind QR amount", async ({ page }, info) => {
  const calls = await install(page); const dialog = await open(page);
  await expect(dialog.getByText("Tổng tiền thanh toán:").locator("..")).toContainText("902.500 ₫");
  await fill(page); await next(page).click();
  await expect(page.getByAltText("Mã VietQR thanh toán")).toHaveAttribute("src", /amount=902500&/);
  await page.getByRole("button", { name: "Quay lại sửa", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Họ và tên", exact: true })).toHaveValue("Khách Fixture");
  await next(page).click(); await expect(check(page)).toBeVisible(); expect(calls.prepares).toHaveLength(1);
  await page.getByRole("button", { name: "Quay lại sửa", exact: true }).click();
  await page.getByRole("spinbutton", { name: "Người lớn", exact: true }).fill("2");
  await page.getByRole("spinbutton", { name: "Trẻ em", exact: true }).fill("1");
  await expect(dialog.getByText("Tổng tiền thanh toán:").locator("..")).toContainText("2.481.875 ₫");
  await dialog.getByRole("button", { name: /Combo Cáp Treo.*70 Món/ }).click();
  await expect(dialog.getByText("Tổng tiền thanh toán:").locator("..")).toContainText("3.265.625 ₫");
  await next(page).click();
  await expect(page.getByAltText("Mã VietQR thanh toán")).toHaveAttribute("src", /amount=3265625&/);
  expect(calls.prepares).toHaveLength(2); expect(calls.prepares[0].requestId).not.toBe(calls.prepares[1].requestId);
  await page.screenshot({ path: info.outputPath("quote-edited.png") });
});

test("demo, recorded, pending and wrong-order evidence wait; only verified server ticket is shown", async ({ page }, info) => {
  const calls = await install(page, ["demo", "recorded", "pending", "wrong", "status-paid", "demo-ticket", "paid"]);
  await open(page); await fill(page); await next(page).click();
  for (let i = 0; i < 6; i++) {
    await check(page).click();
    await expect(page.getByRole("status").filter({ hasText: "Đang chờ đối tác" })).toBeVisible();
    await expect(page.getByRole("region", { name: "E-Ticket đã xác nhận" })).toHaveCount(0);
  }
  await check(page).click();
  await expect(page.getByRole("region", { name: "E-Ticket đã xác nhận" })).toBeVisible();
  await expect(page.getByText("ET-SERVER-FIXTURE", { exact: true })).toBeVisible();
  await expect(page.getByAltText("Mã QR vé điện tử")).toHaveAttribute("src", /^data:image\/png;base64,/);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Lưu mã vé", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("ET-SERVER-FIXTURE.png");
  expect(calls.prepares).toHaveLength(1); expect(calls.checks).toHaveLength(7);
  expect(new Set(calls.checks.map(q => q.orderId)).size).toBe(1);
  await page.screenshot({ path: info.outputPath("server-ticket-fixture.png") });
});

test("HTTP failure, network loss, retry and fast clicks keep request/order identity", async ({ page }, info) => {
  const calls = await install(page, ["network", "http", "paid"], true);
  await open(page); await fill(page); await next(page).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("Không tải được");
  await page.getByRole("button", { name: "Thử tải lại thông tin thanh toán" }).click();
  await expect(check(page)).toBeVisible();
  expect(calls.prepares).toHaveLength(2); expect(calls.prepares[0].requestId).toBe(calls.prepares[1].requestId);
  await check(page).evaluate((button: HTMLButtonElement) => { button.click(); button.click(); });
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("Không kiểm tra được"); expect(calls.checks).toHaveLength(1);
  await check(page).click(); await expect(page.getByRole("dialog").getByRole("alert")).toContainText("Không kiểm tra được");
  await check(page).click(); await expect(page.getByText("ET-SERVER-FIXTURE", { exact: true })).toBeVisible();
  expect(calls.checks).toHaveLength(3); expect(new Set(calls.checks.map(q => q.orderId)).size).toBe(1);
  expect(calls.prepares).toHaveLength(2);
  await page.screenshot({ path: info.outputPath("retry-result.png") });
});

test("required validation blocks invalid contact/date/counts without preparing orders", async ({ page }) => {
  const calls = await install(page); await open(page);
  const packages = page.getByRole("dialog").getByRole("group", { name: "Chọn gói vé tham quan" }).getByRole("button");
  await packages.nth(1).focus(); await packages.nth(1).press("Space");
  await expect(packages.nth(1)).toHaveAttribute("aria-pressed", "true");
  await packages.nth(0).focus(); await packages.nth(0).press("Enter");
  await expect(packages.nth(0)).toHaveAttribute("aria-pressed", "true");
  expect(await page.getByRole("dialog").locator("input").evaluateAll(nodes => nodes.every(node => parseFloat(getComputedStyle(node).fontSize) >= 16))).toBe(true);
  await next(page).click(); await expect(page.getByRole("dialog").getByRole("alert")).toContainText("họ tên");
  await expect(page.getByRole("dialog").getByRole("alert")).toBeInViewport();
  await page.getByRole("textbox", { name: "Họ và tên", exact: true }).fill("Khách Fixture");
  await page.getByRole("textbox", { name: "Số điện thoại", exact: true }).fill("abcdefghij");
  await next(page).click(); await expect(page.getByRole("dialog").getByRole("alert")).toContainText("điện thoại");
  await fill(page); await page.getByLabel("Ngày tham quan", { exact: true }).fill("2000-01-01");
  await next(page).click(); await expect(page.getByRole("dialog").getByRole("alert")).toContainText("ngày tham quan");
  expect(calls.prepares).toHaveLength(0);
});
