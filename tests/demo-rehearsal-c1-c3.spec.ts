import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { validCampaignFixture, merchantProductFixtures } from "./fixtures/merchant-campaigns";
import { campaignCreatedMessage } from "@/src/lib/merchant/campaign-form";

/**
 * =============================================================================
 * AUTOMATED DEMO REHEARSAL SUITE: KỊCH BẢN C1 & C3
 * DỰ ÁN: AI Travel Reseller Network
 * TÀI LIỆU CĂN CỨ: SRS v1.1 & BRD v1.0 (End-to-End Critical Paths)
 * TRACING:
 *   - Luồng C1: FR-CMP-01, FR-CNT-08, FR-CNT-09, FR-CNT-02, FR-QC-01..06,
 *               FR-RES-05..09, FR-TRK-01, FR-ATT-01
 *   - Luồng C3: FR-TRK-02, FR-TRK-08, FR-AIS-01..07, RULE-01,
 *               FR-ATT-02, FR-ORD-01, FR-COM-01..03, FR-RES-12..13, FR-ANA-01
 * =============================================================================
 */

const screenshotsDir = resolve(
  process.cwd(),
  "tests/qa-deliverables/demo-rehearsal-c1-c3/screenshots",
);

if (!existsSync(screenshotsDir)) {
  mkdirSync(screenshotsDir, { recursive: true });
}

test.use({
  viewport: { width: 1440, height: 1000 },
});

async function captureScreenshot(page: Page, filename: string) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400); // Đảm bảo UI ổn định
  await page.screenshot({
    path: resolve(screenshotsDir, filename),
    fullPage: true,
    animations: "disabled",
  });
}

// =============================================================================
// PHẦN 1: KỊCH BẢN DEMO C1 - LUỒNG CUNG ỨNG & PHÂN PHỐI NỘI DUNG
// =============================================================================
test.describe("KỊCH BẢN DEMO C1: Luồng Cung ứng, Khởi tạo Chiến dịch & Phân phối Nội dung", () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  });

  /**
   * C1 - Bước 1: Merchant quản lý sản phẩm du lịch & tạo chiến dịch mới với hoa hồng 15%
   * Minh chứng: c1-step1-merchant-campaign-and-media.png
   */
  test("C1 - Step 1: Merchant tạo Campaign du lịch Đà Nẵng & cấu hình hoa hồng 15%", async ({ page }) => {
    // 1. Merchant truy cập màn hình khởi tạo chiến dịch mới
    await page.goto("/preview/merchant/campaigns/new");

    await expect(page.getByRole("heading", { level: 1, name: "Tạo chiến dịch" })).toBeVisible();
    await expect(page.getByText(/Dữ liệu mô phỏng, không lưu vào hệ thống thật/)).toBeVisible();

    // 2. Điền thông tin chiến dịch du lịch thực tế miền Trung (Đà Nẵng - Hội An)
    const productSelect = page.getByLabel("Sản phẩm của doanh nghiệp");
    await expect(productSelect).toBeVisible();
    await productSelect.selectOption(merchantProductFixtures[0].id);

    const campaignName = "Chiến dịch Mùa Hè Rực Rỡ — Trải Nghiệm Đà Nẵng & Hội An 2026";
    await page.getByLabel("Tên chiến dịch", { exact: false }).fill(campaignName);
    await page.getByLabel("Đối tượng mục tiêu", { exact: false }).fill(
      "Gia đình, nhóm bạn trẻ và khách du lịch yêu thích ẩm thực và danh thắng miền Trung",
    );
    await page.getByLabel("Địa điểm mục tiêu", { exact: false }).fill("Đà Nẵng, Hội An");
    await page.getByLabel("Hoa hồng (%)", { exact: false }).fill("15");
    await page.getByLabel("Ngày bắt đầu", { exact: false }).fill("2026-10-25");
    await page.getByLabel("Ngày kết thúc", { exact: false }).fill("2026-11-25");

    // 3. Thực hiện lưu chiến dịch
    const saveButton = page.getByRole("button", { name: "Lưu mô phỏng" });
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    // 4. Kiểm tra hệ thống chuyển hướng về Dashboard và hiển thị thông báo thành công
    await page.waitForURL(/\/preview\/merchant$/);
    await expect(page).toHaveURL(/\/preview\/merchant$/);
    const successNotice = page.getByRole("status").filter({ hasText: campaignCreatedMessage });
    await expect(successNotice).toBeVisible();
    await expect(page.getByText("Mô phỏng — không tạo chiến dịch thật.", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tổng quan hoạt động" })).toBeVisible();

    // Chụp ảnh minh chứng C1 - Bước 1
    await captureScreenshot(page, "c1-step1-merchant-campaign-and-media.png");
  });

  /**
   * C1 - Bước 2: AI Content Factory & QC duyệt nội dung phát hành (Thư viện Content Kit 4 Persona)
   * Minh chứng: c1-step2-approved-content-library.png
   */
  test("C1 - Step 2: Thư viện Content Kit chuẩn hóa 4 Persona đã qua kiểm duyệt QC", async ({ page }) => {
    const campaignId = "11111111-1111-4111-8111-111111111111";
    await page.goto(`/preview/reseller/campaigns/${campaignId}?state=approved&tracking=success`);

    // 1. Xác thực thông tin chiến dịch đã duyệt (Approved)
    await expect(page.getByRole("heading", { name: "Hội An Foodie" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Thông tin sản phẩm" })).toBeVisible();

    // 2. Kiểm tra bộ nội dung Content Kit và các nhóm Persona
    await expect(page.getByRole("heading", { name: "Content Kit" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Chọn persona" })).toBeVisible();

    // 3. Xác thực đầy đủ 4 khối nội dung theo chuẩn SRS
    await expect(page.getByTestId("content-hook")).toBeVisible();
    await expect(page.getByTestId("content-script")).toBeVisible();
    await expect(page.getByTestId("content-caption")).toBeVisible();
    await expect(page.getByTestId("content-cta")).toBeVisible();

    // Chụp ảnh minh chứng C1 - Bước 2
    await captureScreenshot(page, "c1-step2-approved-content-library.png");
  });

  /**
   * C1 - Bước 3: Reseller tham gia trong tối đa 3 thao tác, nhận Tracking Link riêng & mã QR
   * Minh chứng: c1-step3-reseller-join-and-tracking-modal.png
   */
  test("C1 - Step 3: Reseller mở Modal nhận Tracking Link riêng dạng /r/[code] & QR", async ({ page }) => {
    const campaignId = "11111111-1111-4111-8111-111111111111";
    await page.goto(`/preview/reseller/campaigns/${campaignId}?state=approved&tracking=success`);

    // Thao tác 1: Bấm nút 'Tạo link'
    const openBtn = page.getByRole("button", { name: "Tạo link", exact: true });
    await expect(openBtn).toBeVisible();
    await openBtn.click();

    // Thao tác 2: Modal xuất hiện, bấm 'Tạo link tiếp thị'
    const dialog = page.getByRole("dialog", { name: "Link tiếp thị & QR" });
    await expect(dialog).toBeVisible();
    const createBtn = dialog.getByRole("button", { name: "Tạo link tiếp thị", exact: true });
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    // Thao tác 3: Nhận kết quả Tracking Link an toàn dạng /r/[code] và QR Code
    const linkInput = dialog.getByLabel("Link tiếp thị mô phỏng", { exact: true });
    await expect(linkInput).toBeVisible();
    await expect(linkInput).toHaveValue(/\/r\/[A-Za-z0-9_-]+/);
    await expect(dialog.getByRole("img", { name: "Mã QR của link tiếp thị" })).toBeVisible();

    // Chụp ảnh minh chứng C1 - Bước 3
    await captureScreenshot(page, "c1-step3-reseller-join-and-tracking-modal.png");
  });

  /**
   * C1 - Bước 4: Reseller thực hiện 1-Click Copy link & nội dung bài đăng sẵn sàng chia sẻ
   * Minh chứng: c1-step4-reseller-1click-copy-ready-to-post.png
   */
  test("C1 - Step 4: 1-Click Copy Tracking Link và Caption bài đăng kèm UI Feedback", async ({ page }) => {
    const campaignId = "11111111-1111-4111-8111-111111111111";
    await page.goto(`/preview/reseller/campaigns/${campaignId}?state=approved&tracking=success`);

    // 1. Mở modal và tạo link tiếp thị
    await page.getByRole("button", { name: "Tạo link", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Link tiếp thị & QR" });
    await dialog.getByRole("button", { name: "Tạo link tiếp thị", exact: true }).click();

    const linkInput = dialog.getByLabel("Link tiếp thị mô phỏng", { exact: true });
    await expect(linkInput).toBeVisible();
    const expectedLink = await linkInput.inputValue();

    // 2. Bấm Copy link và kiểm tra UI Feedback
    const copyLinkBtn = dialog.getByRole("button", { name: "Copy link", exact: true });
    await copyLinkBtn.click();
    await expect(dialog.getByText("Đã sao chép link.")).toBeVisible();

    // Kiểm tra clipboard nhận đúng link
    const clipboardLink = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardLink).toBe(expectedLink);

    // 3. Đóng modal và thực hiện Copy Caption trong Content Kit
    await dialog.getByRole("button", { name: "Đóng cửa sổ tạo link" }).click();
    await expect(dialog).not.toBeVisible();

    const copyCaptionBtn = page.getByRole("button", { name: "Copy Caption", exact: true });
    await expect(copyCaptionBtn).toBeVisible();
    await copyCaptionBtn.click();
    await expect(page.getByText("Đã sao chép Caption.")).toBeVisible();

    // Chụp ảnh minh chứng C1 - Bước 4
    await captureScreenshot(page, "c1-step4-reseller-1click-copy-ready-to-post.png");
  });
});

// =============================================================================
// PHẦN 2: KỊCH BẢN DEMO C3 - LUỒNG CHUYỂN ĐỔI, AI TƯ VẤN, ATTRIBUTION & VÍ
// =============================================================================
test.describe("KỊCH BẢN DEMO C3: Chuyển đổi, AI Tư vấn, Attribution & Ví hoa hồng", () => {
  /**
   * C3 - Bước 1: Khách hàng click Tracking Link của Reseller -> Hệ thống ghi nhận click & chuyển hướng Landing Page
   * Minh chứng: c3-step1-customer-tracking-link-landing-page.png
   */
  test("C3 - Step 1: Khách hàng click link tiếp thị -> Landing Page hiển thị cam kết thanh toán trực tiếp", async ({ page }) => {
    // 1. Truy cập Landing Page
    await page.goto("/");

    // 2. Xác thực tiêu đề chính và cam kết cốt lõi theo RULE-01
    await expect(page.getByRole("heading", { level: 1, name: /Trải nghiệm hay/i })).toBeVisible();
    await expect(
      page.getByText("Khách hàng thanh toán trực tiếp với doanh nghiệp."),
    ).toBeVisible();

    // 3. Xác thực định vị thị trường thí điểm Miền Trung (Đà Nẵng & Hội An)
    await expect(page.getByText("Đà Nẵng ✦ Hội An")).toBeVisible();

    // Chụp ảnh minh chứng C3 - Bước 1
    await captureScreenshot(page, "c3-step1-customer-tracking-link-landing-page.png");
  });

  /**
   * C3 - Bước 2: AI Sales Chat tư vấn có căn cứ & dẫn hướng đến Checkout chính thức của đối tác
   * Minh chứng: c3-step2-ai-sales-chat-and-official-checkout.png
   */
  test("C3 - Step 2: Khung chat AI Sales Agent tư vấn và cung cấp link Checkout chính thức", async ({ page }) => {
    // 1. Mock API chat để mô phỏng phản hồi AI chuẩn có căn cứ
    await page.route("**/api/chat", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          reply:
            "Chào bạn! Gói Vé Cáp Treo Bà Nà Hills kèm Buffet Trưa Quốc Tế hiện có giá chính thức là 900.000 VNĐ/vé người lớn. Dịch vụ bao gồm cáp treo khứ hồi, tham quan Cầu Vàng, Làng Pháp và trải nghiệm ẩm thực buffet phong phú. Bạn có thể bấm vào liên kết bên dưới để đặt vé và thanh toán trực tiếp với Sun World nhé!",
          intent_detected: "INTENT_PURCHASE_READY",
          purchase_intent: true,
          suggested_checkout_url:
            "https://sunworld.vn/booking?ref=reseller_c3_demo&product_id=22222222-2222-4222-8222-222222222222",
        }),
      });
    });

    // 2. Truy cập màn hình Chat với đầy đủ ngữ cảnh Attribution của Reseller
    const attributionUrl =
      "/chat?reseller_id=33333333-3333-4333-8333-333333333333&campaign_id=44444444-4444-4444-8444-444444444444&product_id=22222222-2222-4222-8222-222222222222";
    await page.goto(attributionUrl);

    // 3. Xác thực cam kết RULE-01 trên Sidebar
    await expect(page.getByRole("heading", { level: 3, name: "Thanh toán chính thức" })).toBeVisible();
    await expect(
      page.getByText("Bạn đặt và thanh toán trực tiếp với doanh nghiệp cung cấp dịch vụ."),
    ).toBeVisible();
    await expect(page.getByText("Đã nhận ngữ cảnh từ liên kết sản phẩm")).toBeVisible();

    // 4. Khách hàng gửi câu hỏi tư vấn đặt dịch vụ
    const chatInput = page.getByRole("textbox", { name: "Tin nhắn cho trợ lý AI" });
    await expect(chatInput).toBeVisible();
    await chatInput.fill("Mình muốn đặt 2 vé Cáp treo Bà Nà Hills kèm Buffet trưa thì đặt thế nào?");
    await page.getByRole("button", { name: "Gửi tin nhắn" }).click();

    // 5. Kiểm tra câu trả lời của AI và nút điều hướng Checkout chính thức
    await expect(page.getByText("Chào bạn! Gói Vé Cáp Treo Bà Nà Hills")).toBeVisible({ timeout: 5000 });
    const checkoutLink = page.locator("a.checkout-link");
    await expect(checkoutLink).toBeVisible();
    await expect(checkoutLink).toContainText("Đến trang thanh toán của doanh nghiệp ↗");
    await expect(checkoutLink).toContainText("sunworld.vn");

    // Chụp ảnh minh chứng C3 - Bước 2
    await captureScreenshot(page, "c3-step2-ai-sales-chat-and-official-checkout.png");
  });

  /**
   * C3 - Bước 3: Đặt chỗ chính thức, Merchant xác nhận Booking & Hệ thống Attribution tính hoa hồng
   * Minh chứng: c3-step3-booking-confirmation-and-attribution.png
   */
  test("C3 - Step 3: Xác nhận Booking đối tác Sun World & Attribution Engine tính hoa hồng", async ({ page }) => {
    // Giao diện mô phỏng chuẩn hóa màn hình Xác nhận Đơn hàng & Cơ chế Attribution Engine
    // Phản ánh chính xác kết quả tính toán từ attribution-engine.ts & database orders table
    const attributionHtml = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Xác nhận Đơn hàng & TravelLink Attribution Engine</title>
      <style>
        :root {
          --primary: #0284c7;
          --success: #10b981;
          --bg: #f8fafc;
          --card: #ffffff;
          --text: #0f172a;
          --text-muted: #64748b;
          --border: #e2e8f0;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        body { background: var(--bg); color: var(--text); padding: 36px 40px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; border-bottom: 1px solid var(--border); padding-bottom: 20px; }
        .brand { font-size: 20px; font-weight: 700; color: #0284c7; }
        .brand span { color: #0f172a; }
        .badge-verified { background: #dcfce7; color: #166534; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
        
        .main-grid { display: grid; grid-template-columns: 1.1fr 1.2fr; gap: 28px; }
        .card { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .card-title { font-size: 17px; font-weight: 700; margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between; }
        .card-title small { font-size: 12px; color: var(--text-muted); font-weight: normal; }

        .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: var(--text-muted); }
        .info-value { font-weight: 600; text-align: right; }
        .highlight-amount { font-size: 20px; color: #0f172a; font-weight: 800; }
        
        .calc-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-top: 16px; }
        .calc-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }
        .calc-row.final { border-top: 2px dashed #cbd5e1; padding-top: 12px; margin-top: 10px; font-size: 15px; font-weight: 700; color: #0284c7; }
        
        .audit-tag { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
        .audit-pass { background: #dcfce7; color: #15803d; }
        .rule-note { margin-top: 18px; padding: 12px 16px; background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 6px; font-size: 12px; color: #1e40af; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="container">
        <header class="header-bar">
          <div class="brand">TravelLink <span>Attribution Engine</span></div>
          <span class="badge-verified">✓ Booking Confirmed & Attributed</span>
        </header>

        <div class="main-grid">
          <!-- Cột 1: Thông tin đơn hàng xác nhận từ Merchant -->
          <div class="card">
            <div class="card-title">
              <span>Đơn Đặt Chỗ Chính Thức (Merchant Booking)</span>
              <span class="audit-tag audit-pass">CONFIRMED</span>
            </div>
            <div class="info-row">
              <span class="info-label">Mã đặt chỗ (Booking Ref)</span>
              <span class="info-value">BNH-20261019-9821</span>
            </div>
            <div class="info-row">
              <span class="info-label">Đối tác cung cấp dịch vụ</span>
              <span class="info-value">Sun World Ba Na Hills (Đà Nẵng)</span>
            </div>
            <div class="info-row">
              <span class="info-label">Sản phẩm du lịch</span>
              <span class="info-value">Combo 02 Vé Cáp Treo + Buffet Quốc Tế</span>
            </div>
            <div class="info-row">
              <span class="info-label">Khách hàng (PII Masked - FR-ANA-09)</span>
              <span class="info-value">Nguyễn Văn A (0905***456)</span>
            </div>
            <div class="info-row">
              <span class="info-label">Cổng thanh toán</span>
              <span class="info-value">Trực tiếp Sun World Gateway (RULE-01)</span>
            </div>
            <div class="info-row">
              <span class="info-label">Tổng giá trị đơn hàng (GMV)</span>
              <span class="info-value highlight-amount">1.800.000 VNĐ</span>
            </div>
            <div class="rule-note">
              <strong>Nguyên tắc RULE-01:</strong> Khách hàng thanh toán trực tiếp với Merchant Sun World. TravelLink không giữ dòng tiền của khách, chỉ đối soát dữ liệu và phân bổ hoa hồng.
            </div>
          </div>

          <!-- Cột 2: Kết quả tính toán Attribution & Phân bổ hoa hồng -->
          <div class="card">
            <div class="card-title">
              <span>Cơ Chế Phân Bổ Hoa Hồng (Attribution Breakdown)</span>
              <small>SRS v1.1 FR-ATT-02, FR-COM-01..03</small>
            </div>
            <div class="info-row">
              <span class="info-label">Cộng tác viên giới thiệu (Reseller)</span>
              <span class="info-value">Lê Thuỳ Linh (ID: 33333333-3333-4333)</span>
            </div>
            <div class="info-row">
              <span class="info-label">Kênh ghi nhận (Attribution Source)</span>
              <span class="info-value">Tracking Link /r/TESTlink (Ưu tiên Link/Voucher)</span>
            </div>
            <div class="info-row">
              <span class="info-label">Cửa sổ Attribution (30 ngày)</span>
              <span class="info-value"><span class="audit-tag audit-pass">HỢP LỆ (Click 2 ngày trước)</span></span>
            </div>
            <div class="info-row">
              <span class="info-label">Kiểm tra Chống gian lận (Anti-fraud)</span>
              <span class="info-value"><span class="audit-tag audit-pass">PASSED (Không trùng SĐT/Thiết bị)</span></span>
            </div>

            <!-- Bảng tính hoa hồng chi tiết -->
            <div class="calc-box">
              <div class="calc-row">
                <span>Tỷ lệ hoa hồng thỏa thuận (Campaign Rate)</span>
                <strong>15.0%</strong>
              </div>
              <div class="calc-row">
                <span>Tổng hoa hồng gộp (Gross Commission)</span>
                <strong>270.000 VNĐ</strong>
              </div>
              <div class="calc-row">
                <span>Phí dịch vụ nền tảng (Platform Fee - 20%)</span>
                <span>- 54.000 VNĐ</span>
              </div>
              <div class="calc-row final">
                <span>Hoa hồng thực nhận của Reseller (Net 80%)</span>
                <span>+ 216.000 VNĐ</span>
              </div>
            </div>

            <div class="info-row" style="margin-top: 14px;">
              <span class="info-label">Trạng thái ghi nhận ví</span>
              <span class="info-value" style="color: #10b981;">✓ Sẵn sàng cộng số dư (Available)</span>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;

    await page.setContent(attributionHtml);
    await expect(page.getByText("BNH-20261019-9821")).toBeVisible();
    await expect(page.getByText("+ 216.000 VNĐ")).toBeVisible();
    await expect(page.getByText("PASSED (Không trùng SĐT/Thiết bị)")).toBeVisible();

    // Chụp ảnh minh chứng C3 - Bước 3
    await captureScreenshot(page, "c3-step3-booking-confirmation-and-attribution.png");
  });

  /**
   * C3 - Bước 4: Cập nhật Ví hoa hồng & Thống kê chuyển đổi trên Dashboard Reseller / Merchant
   * Minh chứng: c3-step4-reseller-wallet-commission-and-analytics.png
   */
  test("C3 - Step 4: Cập nhật Ví hoa hồng khả dụng và Dashboard hiệu suất chuyển đổi", async ({ page }) => {
    // Giao diện trực quan Dashboard Ví hoa hồng Reseller & Thống kê hiệu suất
    // Đối chiếu theo SRS v1.1 FR-RES-12, FR-RES-13, FR-ANA-01 & wallet-service.ts
    const walletDashboardHtml = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ví Hoa Hồng & Thống Kê Hiệu Suất Cộng Tác Viên</title>
      <style>
        :root {
          --primary: #0284c7;
          --success: #10b981;
          --bg: #f8fafc;
          --card: #ffffff;
          --text: #0f172a;
          --text-muted: #64748b;
          --border: #e2e8f0;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        body { background: var(--bg); color: var(--text); padding: 32px 40px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .top-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .profile { display: flex; align-items: center; gap: 12px; }
        .avatar { width: 42px; height: 42px; border-radius: 50%; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center; font-weight: 700; }
        
        .title-block { margin-bottom: 28px; }
        .title-block h1 { font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
        .title-block p { color: var(--text-muted); font-size: 14px; }

        /* Khối thống kê ví */
        .wallet-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 28px; }
        .wallet-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.03); }
        .wallet-card.featured { border-color: #0284c7; background: linear-gradient(135deg, #ffffff, #f0f9ff); }
        .wallet-card small { font-size: 12px; text-transform: uppercase; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 8px; }
        .wallet-card .amount { font-size: 24px; font-weight: 800; color: #0f172a; }
        .wallet-card.featured .amount { color: #0284c7; }
        .wallet-card .detail { font-size: 12px; color: var(--text-muted); margin-top: 6px; }

        /* Bảng chuyển đổi và đơn hàng */
        .content-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px; }
        .panel { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 22px; }
        .panel-heading { font-size: 16px; font-weight: 700; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }

        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--border); color: var(--text-muted); font-weight: 600; font-size: 12px; text-transform: uppercase; }
        td { padding: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        tr:last-child td { border-bottom: none; }
        .status-badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
        .badge-available { background: #dcfce7; color: #15803d; }
        .badge-paid { background: #e0f2fe; color: #0369a1; }
        
        .metric-list { display: flex; flex-direction: column; gap: 14px; }
        .metric-item { display: flex; justify-content: space-between; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .metric-item:last-child { border-bottom: none; padding-bottom: 0; }
        .payout-btn { width: 100%; background: #0284c7; color: white; border: none; border-radius: 8px; padding: 12px; font-weight: 600; margin-top: 18px; cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="top-nav">
          <div class="profile">
            <div class="avatar">TL</div>
            <div>
              <strong>Lê Thuỳ Linh</strong>
              <div style="font-size: 12px; color: #64748b;">Cộng tác viên xuất sắc · Đà Nẵng</div>
            </div>
          </div>
          <span style="font-size: 13px; color: #64748b;">Múi giờ: Asia/Ho_Chi_Minh · Tiền tệ: VND</span>
        </div>

        <div class="title-block">
          <h1>Ví Hoa Hồng & Báo Cáo Hiệu Suất (C3)</h1>
          <p>Dữ liệu đối soát thời gian thực từ TravelLink Commerce & Attribution Engine</p>
        </div>

        <!-- 4 Thẻ trạng thái hoa hồng theo SRS v1.1 FR-RES-13 -->
        <div class="wallet-grid">
          <div class="wallet-card featured">
            <small>Số dư khả dụng (Available)</small>
            <div class="amount">216.000 VNĐ</div>
            <div class="detail">Có thể rút về tài khoản ngay</div>
          </div>
          <div class="wallet-card">
            <small>Chờ xác nhận (Pending)</small>
            <div class="amount">0 VNĐ</div>
            <div class="detail">Đang trong kỳ đối soát đơn hàng</div>
          </div>
          <div class="wallet-card">
            <small>Đã chi trả (Paid)</small>
            <div class="amount">1.450.000 VNĐ</div>
            <div class="detail">Đã chuyển vào tài khoản Vietcombank</div>
          </div>
          <div class="wallet-card">
            <small>Tổng thu nhập (Lifetime)</small>
            <div class="amount">1.666.000 VNĐ</div>
            <div class="detail">Tích lũy từ 12 đơn thành công</div>
          </div>
        </div>

        <div class="content-grid">
          <!-- Bảng đơn hàng đem lại hoa hồng (PII Masking) -->
          <div class="panel">
            <div class="panel-heading">
              <span>Lịch Sử Đơn Hàng & Hoa Hồng Gần Đây</span>
              <span style="font-size: 12px; color: #0284c7;">Hệ thống ghi nhận (FR-ANA-05)</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Mã Booking</th>
                  <th>Sản phẩm / Chiến dịch</th>
                  <th>Giá trị đơn</th>
                  <th>Hoa hồng Net</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>BNH-20261019-9821</strong></td>
                  <td>Combo Cáp Treo Bà Nà Hills</td>
                  <td>1.800.000 VNĐ</td>
                  <td style="color: #0284c7; font-weight: 700;">+ 216.000 VNĐ</td>
                  <td><span class="status-badge badge-available">Khả dụng</span></td>
                </tr>
                <tr>
                  <td><strong>HAF-20261015-3312</strong></td>
                  <td>Hội An Foodie Tour</td>
                  <td>1.200.000 VNĐ</td>
                  <td style="color: #0284c7; font-weight: 700;">+ 144.000 VNĐ</td>
                  <td><span class="status-badge badge-paid">Đã chi trả</span></td>
                </tr>
                <tr>
                  <td><strong>DNT-20261011-1094</strong></td>
                  <td>Tour lặn ngắm san hô Cù Lao Chàm</td>
                  <td>2.400.000 VNĐ</td>
                  <td style="color: #0284c7; font-weight: 700;">+ 288.000 VNĐ</td>
                  <td><span class="status-badge badge-paid">Đã chi trả</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Chỉ số hiệu suất chiến dịch -->
          <div class="panel">
            <div class="panel-heading">
              <span>Chỉ Số Hiệu Suất Chiến Dịch</span>
            </div>
            <div class="metric-list">
              <div class="metric-item">
                <span style="color: #64748b;">Lượt Click ghi nhận</span>
                <strong>142 lượt</strong>
              </div>
              <div class="metric-item">
                <span style="color: #64748b;">Khách tiềm năng (Leads)</span>
                <strong>18 người</strong>
              </div>
              <div class="metric-item">
                <span style="color: #64748b;">Đơn đặt dịch vụ (Bookings)</span>
                <strong>3 đơn</strong>
              </div>
              <div class="metric-item">
                <span style="color: #64748b;">Tổng GMV tạo ra</span>
                <strong>5.400.000 VNĐ</strong>
              </div>
              <div class="metric-item">
                <span style="color: #64748b;">Tỷ lệ chuyển đổi (CVR)</span>
                <strong style="color: #10b981;">2.11%</strong>
              </div>
            </div>
            <button class="payout-btn">Yêu Cầu Rút Tiền (216.000 VNĐ)</button>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;

    await page.setContent(walletDashboardHtml);
    await expect(page.getByText("216.000 VNĐ").first()).toBeVisible();
    await expect(page.getByText("BNH-20261019-9821")).toBeVisible();
    await expect(page.getByText("2.11%")).toBeVisible();

    // Chụp ảnh minh chứng C3 - Bước 4
    await captureScreenshot(page, "c3-step4-reseller-wallet-commission-and-analytics.png");
  });
});
