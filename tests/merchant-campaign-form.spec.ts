import { expect, test, type Page } from "@playwright/test";
import { validCampaignFixture, merchantProductFixtures } from "./fixtures/merchant-campaigns";
import { campaignCreatedMessage } from "@/src/lib/merchant/campaign-form";

const preview = "/preview/merchant/campaigns/new";

async function fillValidCampaign(page: Page, customName?: string) {
  const nameToFill = customName || `Chiến dịch Test QA ${Date.now()}`;
  await page.getByLabel("Sản phẩm của doanh nghiệp").selectOption(validCampaignFixture.product_id);
  await page.getByLabel("Tên chiến dịch", { exact: false }).fill(nameToFill);
  await page.getByLabel("Đối tượng mục tiêu", { exact: false }).fill(validCampaignFixture.target_audience);
  await page.getByLabel("Địa điểm mục tiêu", { exact: false }).fill(validCampaignFixture.target_location);
  await page.getByLabel("Hoa hồng (%)", { exact: false }).fill(validCampaignFixture.commission_rate);
  await page.getByLabel("Ngày bắt đầu", { exact: false }).fill(validCampaignFixture.start_date);
  await page.getByLabel("Ngày kết thúc", { exact: false }).fill(validCampaignFixture.end_date);
  return nameToFill;
}

test.describe("Kiểm thử Form tạo Campaign của Merchant trên trang /merchant", () => {
  // Tracing: FR-CMP-01, FR-MER-05
  test("TC-MCMP-01: [FR-CMP-01] [FR-MER-05] Điều hướng từ Dashboard /merchant và hiển thị đầy đủ các trường của Form tạo Campaign", async ({ page }) => {
    // 1. Mở trang Dashboard Merchant
    await page.goto("/preview/merchant");
    const createLink = page.getByRole("link", { name: "Tạo chiến dịch" });
    await expect(createLink).toBeVisible();
    await expect(createLink).toHaveAttribute("href", preview);

    // 2. Click nút Tạo chiến dịch
    await createLink.click();
    await page.waitForURL(`**${preview}`);

    // 3. Kiểm tra tiêu đề trang và thông báo xem trước
    await expect(page.getByRole("heading", { level: 1, name: "Tạo chiến dịch" })).toBeVisible();
    await expect(page.getByText(/Dữ liệu mô phỏng, không lưu vào hệ thống thật/)).toBeVisible();

    // 4. Kiểm tra sự hiển thị của tất cả các trường đã triển khai
    const productSelect = page.getByLabel("Sản phẩm của doanh nghiệp");
    await expect(productSelect).toBeVisible();
    await expect(page.getByLabel("Tên chiến dịch", { exact: false })).toBeVisible();
    await expect(page.getByLabel("Đối tượng mục tiêu", { exact: false })).toBeVisible();
    await expect(page.getByLabel("Địa điểm mục tiêu", { exact: false })).toBeVisible();
    
    // Kiểm tra trường hoa hồng và placeholder/help text
    const commissionInput = page.getByLabel("Hoa hồng (%)", { exact: false });
    await expect(commissionInput).toBeVisible();
    await expect(commissionInput).toHaveAttribute("placeholder", "Ví dụ: 10.5");
    await expect(page.getByText(/Từ 5% đến 30%/)).toBeVisible();

    // Kiểm tra trường ngày bắt đầu và kết thúc
    await expect(page.getByLabel("Ngày bắt đầu", { exact: false })).toBeVisible();
    await expect(page.getByLabel("Ngày kết thúc", { exact: false })).toBeVisible();

    // 5. Kiểm tra trường Ghi chú cho AI (đang disable theo tiến độ triển khai)
    const aiNotes = page.getByRole("textbox", { name: "Ghi chú cho AI — chưa hỗ trợ" });
    await expect(aiNotes).toBeVisible();
    await expect(aiNotes).toBeDisabled();

    // 6. Kiểm tra các nút hành động
    await expect(page.getByRole("link", { name: "Quay lại Dashboard" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Lưu mô phỏng" })).toBeVisible();
  });

  // Tracing: FR-CMP-01, FR-CMP-03
  test("TC-MCMP-02: [FR-CMP-01] [FR-CMP-03] Validation trường bắt buộc khi submit form rỗng", async ({ page }) => {
    await page.goto(preview);

    // Bấm nút Lưu mà không điền bất kỳ trường nào
    await page.getByRole("button", { name: "Lưu mô phỏng" }).click();

    // Kiểm tra focus tự động nhảy về trường lỗi đầu tiên (Sản phẩm)
    await expect(page.getByLabel("Sản phẩm của doanh nghiệp")).toBeFocused();
    await expect(page.locator("#product_id")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#product_id-error")).toBeVisible();
    await expect(page.locator("#product_id-error")).toContainText("Vui lòng chọn sản phẩm");

    // Kiểm tra không có lượt lưu nào được gửi đi
    await expect(page.getByText("Lượt lưu mô phỏng: 0")).toBeVisible();
  });

  // Tracing: FR-CMP-03
  test("TC-MCMP-03: [FR-CMP-03] Validation dải hoa hồng: từ chối hoa hồng < 5% hoặc > 30%", async ({ page }) => {
    await page.goto(preview);
    await fillValidCampaign(page);

    // Case 1: Hoa hồng vượt mức tối đa cho phép (> 30%)
    await page.locator("#commission_rate").fill("31");
    await page.getByRole("button", { name: "Lưu mô phỏng" }).click();
    await expect(page.locator("#commission_rate")).toBeFocused();
    await expect(page.locator("#commission_rate-error")).toBeVisible();
    await expect(page.locator("#commission_rate-error")).toContainText("Nhập hoa hồng từ 5% đến 30%");
    await expect(page.getByText("Lượt lưu mô phỏng: 0")).toBeVisible();

    // Case 2: Hoa hồng dưới mức tối thiểu (< 5%)
    await page.locator("#commission_rate").fill("4.5");
    await page.getByRole("button", { name: "Lưu mô phỏng" }).click();
    await expect(page.locator("#commission_rate")).toBeFocused();
    await expect(page.locator("#commission_rate-error")).toBeVisible();
    await expect(page.locator("#commission_rate-error")).toContainText("Nhập hoa hồng từ 5% đến 30%");
    await expect(page.getByText("Lượt lưu mô phỏng: 0")).toBeVisible();
  });

  // Tracing: FR-CMP-03
  test("TC-MCMP-04: [FR-CMP-03] Validation ngày: từ chối ngày kết thúc trước ngày bắt đầu", async ({ page }) => {
    await page.goto(preview);
    await fillValidCampaign(page);

    // Thiết lập ngày kết thúc sớm hơn ngày bắt đầu
    await page.locator("#start_date").fill("2028-03-01");
    await page.locator("#end_date").fill("2028-02-28");
    await page.getByRole("button", { name: "Lưu mô phỏng" }).click();

    // Kiểm tra thông báo lỗi ràng buộc thời gian
    await expect(page.locator("#end_date")).toBeFocused();
    await expect(page.locator("#end_date-error")).toBeVisible();
    await expect(page.locator("#end_date-error")).toContainText("Ngày kết thúc không được trước ngày bắt đầu.");
    await expect(page.getByText("Lượt lưu mô phỏng: 0")).toBeVisible();
  });

  // Tracing: FR-CMP-01, FR-CMP-04
  test("TC-MCMP-05: [FR-CMP-01] [FR-CMP-04] Ràng buộc độ dài tối đa (Max length) trên các trường nhập liệu", async ({ page }) => {
    await page.goto(preview);

    // Kiểm tra thuộc tính maxLength được thiết lập trên DOM
    await expect(page.locator("#name")).toHaveAttribute("maxlength", "150");
    await expect(page.locator("#target_audience")).toHaveAttribute("maxlength", "1000");
    await expect(page.locator("#target_location")).toHaveAttribute("maxlength", "160");

    // Thử nhập chuỗi vượt quá 150 ký tự vào trường tên
    const longName = "A".repeat(160);
    await page.locator("#name").fill(longName);
    const value = await page.locator("#name").inputValue();
    expect(value.length).toBe(150);
  });

  // Tracing: FR-CMP-01, FR-CMP-02, FR-CMP-04, FR-CMP-05
  test("TC-MCMP-06: [FR-CMP-01] [FR-CMP-02] [FR-CMP-04] [FR-CMP-05] Luồng tạo mới Campaign thành công (Happy Case)", async ({ page }) => {
    await page.goto(preview);
    const campaignName = `Chiến dịch Mùa Thu ${Date.now()}`;
    await fillValidCampaign(page, campaignName);

    // Bấm nút Lưu mô phỏng
    await page.getByRole("button", { name: "Lưu mô phỏng" }).click();

    // Kiểm tra hệ thống chuyển hướng về Dashboard
    await page.waitForURL(/\/preview\/merchant$/);
    await expect(page).toHaveURL(/\/preview\/merchant$/);

    // Kiểm tra hiển thị thông báo thành công trên Dashboard
    const successNotice = page.getByRole("status").filter({ hasText: campaignCreatedMessage });
    await expect(successNotice).toBeVisible();
    await expect(page.getByText("Mô phỏng — không tạo chiến dịch thật.", { exact: true })).toBeVisible();

    // Kiểm tra reload trang thì thông báo tiêu thụ một lần biến mất
    await page.reload();
    await expect(page.getByText(campaignCreatedMessage, { exact: true })).toHaveCount(0);
  });

  // Tracing: FR-CMP-01
  test("TC-MCMP-07: [FR-CMP-01] Cơ chế chống Submit trùng lặp (Idempotent / Double Click Protection)", async ({ page }) => {
    await page.goto(`${preview}?state=pending`);
    await fillValidCampaign(page);

    // Bấm nút Lưu và kích hoạt nhiều lần liên tiếp
    await page.getByRole("button", { name: "Lưu mô phỏng" }).focus();
    await page.keyboard.press("Enter");

    // Nút chuyển sang trạng thái đang lưu và bị vô hiệu hóa
    await expect(page.getByRole("button", { name: "Đang lưu…" })).toBeDisabled();
    await expect(page.getByRole("form", { name: "Thông tin chiến dịch" })).toHaveAttribute("aria-busy", "true");

    // Thử bấm thêm phím Enter khi form đang xử lý
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");

    // Đảm bảo chỉ đúng 1 request được dispatch
    await expect(page.getByText("Lượt lưu mô phỏng: 1")).toBeVisible();
  });

  // Tracing: FR-CMP-01
  test("TC-MCMP-08: [FR-CMP-01] Hủy / Đóng form và điều hướng an toàn về Dashboard", async ({ page }) => {
    await page.goto(preview);

    // Nhập một số thông tin dở dang
    await page.getByLabel("Tên chiến dịch", { exact: false }).fill("Chiến dịch chưa hoàn tất");

    // Bấm nút Quay lại Dashboard
    const backBtn = page.getByRole("link", { name: "Quay lại Dashboard" });
    await expect(backBtn).toBeVisible();
    await backBtn.click();

    // Kiểm tra về lại Dashboard an toàn, không có thông báo tạo thành công
    await page.waitForURL(/\/preview\/merchant$/);
    await expect(page).toHaveURL(/\/preview\/merchant$/);
    await expect(page.getByText(campaignCreatedMessage, { exact: true })).toHaveCount(0);
  });

  // Tracing: FR-CMP-01, FR-CMP-02
  test("TC-MCMP-09: [FR-CMP-01] [FR-CMP-02] Xử lý lỗi API/Hệ thống khi lưu và giữ lại toàn bộ dữ liệu người dùng đã nhập", async ({ page }) => {
    const errorScenarios = [
      { state: "save-error", message: "Chưa kết nối được dịch vụ dữ liệu" },
      { state: "save-session", message: "Phiên đăng nhập không còn hợp lệ" },
      { state: "save-permission", message: "Tài khoản chưa có quyền Merchant" },
      { state: "save-schema", message: "Dữ liệu hiện chưa tương thích" },
    ];

    for (const { state, message } of errorScenarios) {
      await page.goto(`${preview}?state=${state}`);
      const filledName = await fillValidCampaign(page, `Test Error ${state} ${Date.now()}`);

      // Bấm lưu
      await page.getByRole("button", { name: "Lưu mô phỏng" }).click();

      // Kiểm tra hiển thị thông báo lỗi
      const alert = page.getByRole("form", { name: "Thông tin chiến dịch" }).getByRole("alert");
      await expect(alert).toContainText(message);
      await expect(alert).toBeFocused();

      // Kiểm tra dữ liệu đã điền được giữ nguyên 100%
      await expect(page.locator("#name")).toHaveValue(filledName);
      await expect(page.locator("#commission_rate")).toHaveValue(validCampaignFixture.commission_rate);
      await expect(page.locator("#target_audience")).toHaveValue(validCampaignFixture.target_audience);
      await expect(page.locator("#target_location")).toHaveValue(validCampaignFixture.target_location);

      // Nút lưu vẫn được bật lại để người dùng thử lại
      await expect(page.getByRole("button", { name: "Lưu mô phỏng" })).toBeEnabled();
    }
  });

  // Tracing: FR-CMP-01
  test("TC-MCMP-10: [FR-CMP-01] Trạng thái giao diện khi không có sản phẩm khả dụng (Empty State)", async ({ page }) => {
    await page.goto(`${preview}?state=empty`);

    // Kiểm tra hiển thị thông báo Empty state
    await expect(page.getByText("Chưa có sản phẩm để tạo chiến dịch")).toBeVisible();
    await expect(page.getByText("Sản phẩm thuộc doanh nghiệp của bạn sẽ xuất hiện tại đây khi có dữ liệu phù hợp.")).toBeVisible();

    // Kiểm tra nút Lưu bị vô hiệu hóa
    await expect(page.getByRole("button", { name: "Lưu mô phỏng" })).toBeDisabled();

    // Kiểm tra có nút Tải lại sản phẩm
    await expect(page.getByRole("button", { name: "Tải lại sản phẩm" })).toBeVisible();
  });
});
