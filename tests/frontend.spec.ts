import { expect, test } from "@playwright/test";
test("pages render without overflow or runtime errors", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const route of [
    "/",
    "/login",
    "/register",
    "/chat",
    "/preview/merchant",
  ]) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`${route.replaceAll("/", "-") || "home"}.png`),
      fullPage: true,
    });
  }
  expect(errors).toEqual([]);
});

test("unknown routes show the branded not-found page", async ({ page }) => {
  const response = await page.goto("/route-khong-ton-tai");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Không tìm thấy trang" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("mobile navigation opens and closes accessibly", async ({ page }) => {
  const viewport = page.viewportSize();
  test.skip(!viewport || viewport.width > 760, "Mobile navigation only appears on small screens");

  await page.goto("/");
  const siteToggle = page.getByRole("button", { name: "Mở menu" });
  await expect(siteToggle).toBeVisible();
  await siteToggle.click();
  await expect(
    page.getByRole("navigation", { name: "Điều hướng chính trên thiết bị di động" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Mở menu" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );

  await page.goto("/preview/merchant");
  await page.getByRole("button", { name: "Mở điều hướng" }).click();
  const merchantNav = page.getByRole("navigation", { name: "Điều hướng Merchant" });
  await expect(merchantNav).toBeVisible();
  await page.mouse.click(viewport!.width - 16, viewport!.height / 2);
  await expect(merchantNav).toBeHidden();

  await page.goto("/preview/reseller");
  await page.getByRole("button", { name: "Mở menu" }).click();
  const resellerNav = page.getByRole("navigation", { name: "Điều hướng cộng tác viên" });
  await expect(resellerNav).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Mở menu" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
});
test("protected portal redirects; auth validation and password visibility", async ({
  page,
}) => {
  await page.goto("/merchant");
  await expect(page).toHaveURL(/\/login\?next=/);
  await page.goto("/login");
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "Đăng nhập", exact: true }),
  ).toBeVisible();
  const loginButton = page.getByRole("button", {
    name: "Đăng nhập",
    exact: true,
  });
  if (await page.getByText(/Giao diện đang ở bản xem trước/).isVisible()) {
    await expect(loginButton).toBeDisabled();
  } else {
    await expect(loginButton).toBeEnabled();
  }
  await page.goto("/register?role=reseller");
  await expect(
    page.getByRole("radio", { name: "Cộng tác viên" }),
  ).toBeChecked();
  await page.getByLabel("Email", { exact: true }).fill("bad-email");
  expect(
    await page
      .getByLabel("Email", { exact: true })
      .evaluate((e: HTMLInputElement) => e.validity.typeMismatch),
  ).toBe(true);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("secret123");
  await page.getByRole("button", { name: "Hiện mật khẩu" }).click();
  await expect(page.getByLabel("Mật khẩu", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
});
test("dashboard filters and loading/error/empty states", async ({ page }) => {
  await page.goto("/preview/merchant");
  await page.getByRole("textbox", { name: "Tìm sản phẩm" }).fill("Hội An");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("textbox", { name: "Tìm sản phẩm" }).fill("no match");
  await expect(page.getByText("Chưa có sản phẩm phù hợp")).toBeVisible();
  await page.getByRole("button", { name: "Xóa bộ lọc" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(3);
  await page.getByLabel("Trạng thái giao diện").selectOption("loading");
  await expect(page.getByText("Đang tải dữ liệu…")).toBeVisible();
  await page.getByLabel("Trạng thái giao diện").selectOption("error");
  await page.getByRole("button", { name: "Thử lại" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(3);
  await page.getByLabel("Trạng thái giao diện").selectOption("empty");
  await expect(page.getByText("Chưa có sản phẩm phù hợp")).toBeVisible();
});
test("chat demo opens, sends and resets without requesting AI", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/chat", () => {
    calls++;
  });
  await page.goto("/chat");
  await page
    .getByRole("button", { name: "Tôi muốn tìm hiểu về sản phẩm" })
    .click();
  await expect(
    page.getByText(/Đây là bản xem trước giao diện, chưa gọi AI/),
  ).toBeVisible();
  expect(calls).toBe(0);
  await page.getByRole("button", { name: "Cuộc trò chuyện mới" }).click();
  await expect(
    page.getByRole("heading", { name: "Bạn muốn khám phá điều gì?" }),
  ).toBeVisible();
});
test("chat preserves attribution, retries errors and rejects unsafe checkout links", async ({
  page,
}) => {
  const context = {
    reseller_id: "11111111-1111-1111-1111-111111111111",
    campaign_id: "22222222-2222-2222-2222-222222222222",
    product_id: "33333333-3333-3333-3333-333333333333",
  };
  let calls = 0;
  await page.route("**/api/chat", async (route) => {
    calls++;
    const body = route.request().postDataJSON();
    expect(body.attribution_context).toEqual(context);
    expect(body.conversation_history).toEqual([]);
    await route.fulfill(
      calls === 1
        ? { status: 503, json: { error: "unavailable" } }
        : {
            json: {
              reply: "Thông tin kiểm thử từ API giả lập.",
              suggested_checkout_url: "javascript:alert(1)",
            },
          },
    );
  });
  await page.goto("/chat?" + new URLSearchParams(context));
  await page.getByLabel("Tin nhắn cho trợ lý AI").fill("Chính sách thế nào?");
  await page.getByRole("button", { name: "Gửi tin nhắn" }).click();
  await expect(page.locator(".error-message[role=alert]")).toBeVisible();
  await expect(page.getByLabel("Tin nhắn cho trợ lý AI")).toHaveValue(
    "Chính sách thế nào?",
  );
  await page.getByRole("button", { name: "Gửi tin nhắn" }).click();
  await expect(
    page.getByText("Thông tin kiểm thử từ API giả lập."),
  ).toBeVisible();
  await expect(page.locator(".checkout-link")).toHaveCount(0);
});
