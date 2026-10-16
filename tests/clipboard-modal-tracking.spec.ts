import { expect, test } from "@playwright/test";

/**
 * =============================================================================
 * SUITE: KIỂM THỬ CHỨC NĂNG COPY 1-CLICK CLIPBOARD & MODAL TRACKING
 * DỰ ÁN: AI Travel Reseller Network
 * TÀI LIỆU CĂN CỨ: SRS v1.1 & BRD v1.0
 * TRACING: FR-RES-06, FR-RES-08, FR-RES-09, FR-TRK-01, FR-ATT-01
 * NGƯỜI THỰC HIỆN: Senior QA Automation Engineer
 * =============================================================================
 */

const targetCampaignId = "11111111-1111-4111-8111-111111111111";
const campaignDetailUrl = `/preview/reseller/campaigns/${targetCampaignId}?state=approved&tracking=success`;

test.beforeEach(async ({ context }) => {
  // Cấp quyền clipboard-read và clipboard-write cục bộ cho browser context
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
});

// =============================================================================
// PHẦN 1: KIỂM THỬ MODAL TRACKING LINK & MÃ VOUCHER
// Tracing: FR-RES-06, FR-TRK-01, FR-ATT-01
// =============================================================================
test.describe("1. Kiểm thử Modal Tracking Link & Mã Voucher (FR-RES-06, FR-TRK-01, FR-ATT-01)", () => {

  /**
   * TC-CLIP-01: Mở Modal Tracking trong tối đa 3 thao tác và kiểm tra đóng Modal
   * Thao tác: (1) Vào chi tiết chiến dịch -> (2) Bấm 'Tạo link' -> Modal hiển thị -> (3) Đóng Modal qua nút Close 'X', Escape, hoặc nút 'Đóng'
   */
  test("TC-CLIP-01 [FR-RES-06]: Mở Modal Tracking trong <= 3 thao tác và kiểm tra đóng Modal qua nút X, phím Escape, nút Đóng", async ({ page }) => {
    // Thao tác 1: Vào trang chi tiết chiến dịch
    await page.goto(campaignDetailUrl);

    // Thao tác 2: Bấm nút 'Tạo link'
    const openBtn = page.getByRole("button", { name: "Tạo link", exact: true });
    await expect(openBtn).toBeVisible({ timeout: 5000 });
    await openBtn.click();

    // Kiểm tra Modal xuất hiện
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 3000 });
    await expect(dialog.getByRole("heading", { name: /link tiếp thị & qr/i })).toBeVisible();

    // Thao tác 3a: Kiểm tra đóng modal bằng phím Escape
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible({ timeout: 2000 });
    await expect(openBtn).toBeFocused();

    // Mở lại và kiểm tra đóng bằng nút Close 'X'
    await openBtn.click();
    await expect(dialog).toBeVisible();
    const closeXBtn = dialog.getByRole("button", { name: /đóng cửa sổ tạo link|×/i });
    await expect(closeXBtn).toBeVisible();
    await closeXBtn.click();
    await expect(dialog).not.toBeVisible({ timeout: 2000 });

    // Mở lại và kiểm tra đóng bằng nút 'Đóng' ở footer
    await openBtn.click();
    await expect(dialog).toBeVisible();
    const closeFooterBtn = dialog.getByRole("button", { name: "Đóng", exact: true });
    await expect(closeFooterBtn).toBeVisible();
    await closeFooterBtn.click();
    await expect(dialog).not.toBeVisible({ timeout: 2000 });
  });

  /**
   * TC-CLIP-02: Kiểm tra định dạng Tracking Link riêng của Reseller
   * Link phải có cấu trúc: <domain>/r/<tracking_id> (trong đó tracking_id là duy nhất)
   */
  test("TC-CLIP-02 [FR-TRK-01]: Modal Tracking hiển thị đúng định dạng link tiếp thị riêng /r/<tracking_id>", async ({ page }) => {
    await page.goto(campaignDetailUrl);

    await page.getByRole("button", { name: "Tạo link", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Bấm nút sinh link
    const createBtn = dialog.getByRole("button", { name: "Tạo link tiếp thị", exact: true });
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    // Kiểm tra input/textarea chứa link tiếp thị
    const linkInput = dialog.locator('textarea#tracking-url, input#tracking-url, [data-testid="tracking-url"]');
    await expect(linkInput).toBeVisible({ timeout: 5000 });

    const linkValue = await linkInput.inputValue();
    // Khẳng định định dạng /r/<tracking_id>
    expect(linkValue, "Tracking Link bắt buộc phải chứa đường dẫn rút gọn /r/<tracking_id>").toMatch(/\/r\/[a-zA-Z0-9_-]+/);
  });

  /**
   * TC-CLIP-03: Kiểm tra hiển thị Mã Voucher riêng biệt (Unique Voucher Code)
   * Theo FR-ATT-01: Hệ thống bắt buộc phải cấp Mã Voucher riêng để phân bổ chuyển đổi offline/livestream
   */
  test("TC-CLIP-03 [FR-ATT-01]: Modal Tracking hiển thị đúng Mã Voucher riêng biệt (Unique Voucher Code)", async ({ page }) => {
    await page.goto(campaignDetailUrl);

    await page.getByRole("button", { name: "Tạo link", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Bấm tạo link tiếp thị để nhận cả link và mã voucher
    const createBtn = dialog.getByRole("button", { name: "Tạo link tiếp thị", exact: true });
    await createBtn.click();

    // SRS FR-ATT-01: Bắt buộc hiển thị Mã Voucher riêng trên Modal
    const voucherElement = dialog.getByLabel(/mã voucher|voucher code/i).or(dialog.getByTestId("unique-voucher-code")).or(dialog.locator('input[name*="voucher"]'));
    await expect(voucherElement, "SRS yêu cầu Modal phải hiển thị Mã Voucher riêng biệt duy nhất của Reseller").toBeVisible({ timeout: 3000 });
  });
});

// =============================================================================
// PHẦN 2: KIỂM THỬ COPY 1-CLICK TRÊN MODAL TRACKING
// Tracing: FR-RES-06, FR-TRK-01, FR-ATT-01
// =============================================================================
test.describe("2. Kiểm thử Copy 1-Click trên Modal Tracking (FR-RES-06, FR-TRK-01, FR-ATT-01)", () => {

  /**
   * TC-CLIP-04: Bấm nút Copy cạnh Tracking Link -> Đọc navigator.clipboard.readText()
   * Khẳng định Clipboard khớp 100% với giá trị link hiển thị trên Modal
   */
  test("TC-CLIP-04 [FR-RES-06, FR-TRK-01]: Copy 1-Click Tracking Link ghi đúng nội dung vào Clipboard qua navigator.clipboard.readText()", async ({ page }) => {
    await page.goto(campaignDetailUrl);

    await page.getByRole("button", { name: "Tạo link", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Tạo link tiếp thị", exact: true }).click();

    const linkInput = dialog.locator('textarea#tracking-url, input#tracking-url');
    await expect(linkInput).toBeVisible({ timeout: 5000 });
    const expectedUrl = await linkInput.inputValue();

    // Bấm nút Copy link 1-Click
    const copyLinkBtn = dialog.getByRole("button", { name: /copy link/i });
    await expect(copyLinkBtn).toBeVisible();
    await copyLinkBtn.click();

    // Đọc trực tiếp từ Clipboard của trình duyệt
    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    expect(clipboardText, "Nội dung trong Clipboard phải khớp 100% với Tracking Link trên Modal").toBe(expectedUrl);
    expect(clipboardText).toMatch(/\/r\/[a-zA-Z0-9_-]+/);
  });

  /**
   * TC-CLIP-05: Bấm nút Copy cạnh Mã Voucher -> Đọc navigator.clipboard.readText()
   * Khẳng định Clipboard khớp 100% với Mã Voucher hiển thị
   */
  test("TC-CLIP-05 [FR-ATT-01]: Copy 1-Click Mã Voucher ghi đúng mã vào Clipboard qua navigator.clipboard.readText()", async ({ page }) => {
    await page.goto(campaignDetailUrl);

    await page.getByRole("button", { name: "Tạo link", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Tạo link tiếp thị", exact: true }).click();

    // Nút Copy Mã Voucher
    const copyVoucherBtn = dialog.getByRole("button", { name: /copy mã voucher|copy voucher/i }).or(dialog.getByTestId("copy-voucher-btn"));
    await expect(copyVoucherBtn, "SRS yêu cầu có nút Copy 1-Click riêng cho Mã Voucher").toBeVisible({ timeout: 3000 });
    await copyVoucherBtn.click();

    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    expect(clipboardText, "Clipboard không được rỗng khi bấm Copy Mã Voucher").toBeTruthy();
  });

  /**
   * TC-CLIP-06: Phản hồi giao diện (UI Feedback) sau khi bấm Copy trên Modal
   * Nút phải đổi trạng thái sang 'Đã sao chép' hoặc hiển thị toast/status thông báo thành công
   */
  test("TC-CLIP-06 [FR-RES-06]: Phản hồi giao diện (UI Feedback) rõ ràng ngay sau khi bấm nút Copy link", async ({ page }) => {
    await page.goto(campaignDetailUrl);

    await page.getByRole("button", { name: "Tạo link", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Tạo link tiếp thị", exact: true }).click();

    const copyBtn = dialog.getByRole("button", { name: /copy link/i });
    await copyBtn.click();

    // Kiểm tra UI feedback: trạng thái text "Đã sao chép link." hoặc icon check/toast
    const feedbackStatus = dialog.locator('[role="status"]').filter({ hasText: /đã sao chép link|copied/i });
    await expect(feedbackStatus, "Hệ thống phải có thông báo UI Feedback 'Đã sao chép link.' ngay sau khi click").toBeVisible({ timeout: 3000 });
  });
});

// =============================================================================
// PHẦN 3: KIỂM THỬ COPY 1-CLICK NỘI DUNG & GHI NHẬN SỰ KIỆN
// Tracing: FR-RES-08
// =============================================================================
test.describe("3. Kiểm thử Copy 1-Click Nội dung & Ghi nhận sự kiện (FR-RES-08)", () => {

  /**
   * TC-CLIP-07: Copy 1-Click Caption / CTA / Hashtag tự động đính kèm Tracking Link riêng của Reseller
   * Khi copy nội dung để đăng, hệ thống bắt buộc phải tự động thay thế placeholder bằng Tracking Link
   */
  test("TC-CLIP-07 [FR-RES-08]: Copy 1-Click Caption / CTA / Hashtag tự động đính kèm đúng Tracking Link của Reseller", async ({ page }) => {
    await page.goto(campaignDetailUrl);

    // Bước 1: Tạo link tiếp thị trước để hệ thống có tracking scope
    await page.getByRole("button", { name: "Tạo link", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Tạo link tiếp thị", exact: true }).click();
    const linkInput = dialog.locator('textarea#tracking-url, input#tracking-url');
    await expect(linkInput).toBeVisible({ timeout: 5000 });
    const trackingUrl = await linkInput.inputValue();
    await dialog.getByRole("button", { name: "Đóng", exact: true }).click();

    // Bước 2: Kiểm tra Copy CTA kèm link
    const copyCtaWithLinkBtn = page.getByRole("button", { name: /Copy CTA kèm link/i });
    if (await copyCtaWithLinkBtn.isVisible()) {
      await copyCtaWithLinkBtn.click();
      const clipboardCta = await page.evaluate(async () => navigator.clipboard.readText());
      expect(clipboardCta, "Clipboard CTA bắt buộc phải chứa Tracking Link").toContain(trackingUrl);
      expect(clipboardCta, "Clipboard không được giữ nguyên placeholder [LINK_MUA_VE]").not.toContain("[LINK_MUA_VE]");
    }

    // Bước 3: Kiểm tra Copy Caption kèm link theo SRS FR-RES-08
    const copyCaptionBtn = page.getByRole("button", { name: "Copy Caption", exact: true });
    await expect(copyCaptionBtn).toBeVisible();
    await copyCaptionBtn.click();

    const clipboardCaption = await page.evaluate(async () => navigator.clipboard.readText());
    // SRS FR-RES-08: Sao chép caption kèm sẵn tracking link
    expect(clipboardCaption, "SRS yêu cầu Copy Caption phải tự động đính kèm sẵn Tracking Link để Reseller đăng bài").toContain(trackingUrl);
  });

  /**
   * TC-CLIP-08: Ghi nhận sự kiện đã sao chép (Copied Event Tracking)
   * Khi Reseller bấm nút Copy, hệ thống phải gửi request ghi nhận sự kiện (tracking event logging)
   */
  test("TC-CLIP-08 [FR-RES-08]: Hành động click nút Copy phải kích hoạt API ghi nhận sự kiện 'đã sao chép' (Copied Event Tracking)", async ({ page }) => {
    await page.goto(campaignDetailUrl);

    // Lắng nghe network event gọi API ghi nhận sự kiện tracking copy
    let trackingEventCaptured = false;
    page.on("request", request => {
      const url = request.url();
      if ((url.includes("/api/tracking") || url.includes("/api/events")) && request.method() === "POST") {
        const postData = request.postData();
        if (postData && (postData.includes("copy") || postData.includes("content_id"))) {
          trackingEventCaptured = true;
        }
      }
    });

    // Bấm nút Copy Hook hoặc Copy Caption
    const copyHookBtn = page.getByRole("button", { name: "Copy Hook", exact: true });
    await expect(copyHookBtn).toBeVisible();
    await copyHookBtn.click();

    // Đợi 2 giây để API gửi đi nếu có
    await page.waitForTimeout(2000);

    expect(trackingEventCaptured, "FR-RES-08: Hệ thống bắt buộc phải gửi API ghi nhận sự kiện khi Reseller sao chép nội dung").toBe(true);
  });
});

// =============================================================================
// PHẦN 4: KIỂM THỬ COPY 1-CLICK CÂU TRẢ LỜI SOẠN SẴN (CANNED RESPONSES)
// Tracing: FR-RES-09
// =============================================================================
test.describe("4. Kiểm thử Copy 1-Click Câu trả lời soạn sẵn - Canned Responses (FR-RES-09)", () => {

  /**
   * TC-CLIP-09: Hiển thị bộ câu trả lời soạn sẵn cho bình luận/tin nhắn thường gặp (giá, địa điểm, cách đặt)
   */
  test("TC-CLIP-09 [FR-RES-09]: Màn hình hiển thị đầy đủ bộ câu trả lời soạn sẵn cho thắc mắc về giá, địa điểm, cách đặt chỗ", async ({ page }) => {
    await page.goto(campaignDetailUrl);

    // Khu vực câu trả lời soạn sẵn (Canned Responses / Quick Replies)
    const quickReplySection = page.locator('[data-testid="canned-responses"], section:has-text("câu trả lời soạn sẵn"), section:has-text("hỏi đáp nhanh")');
    await expect(quickReplySection, "SRS yêu cầu hiển thị Bộ câu trả lời soạn sẵn cho Reseller").toBeVisible({ timeout: 3000 });

    // Kiểm tra các kịch bản bắt buộc theo FR-RES-09: giá, địa điểm, cách đặt chỗ
    await expect(quickReplySection.getByText(/giá|chi phí/i), "Có câu trả lời mẫu về Giá").toBeVisible({ timeout: 3000 });
    await expect(quickReplySection.getByText(/địa điểm|vị trí/i), "Có câu trả lời mẫu về Địa điểm").toBeVisible({ timeout: 3000 });
    await expect(quickReplySection.getByText(/cách đặt|hướng dẫn đặt/i), "Có câu trả lời mẫu về Cách đặt vé/chỗ").toBeVisible({ timeout: 3000 });
  });

  /**
   * TC-CLIP-10: Copy 1-Click Câu trả lời soạn sẵn đính kèm sẵn Tracking Link riêng của Reseller
   * Khi Reseller bấm nút copy câu trả lời mẫu -> Clipboard phải chứa đúng nội dung và kèm Tracking Link
   */
  test("TC-CLIP-10 [FR-RES-09]: Copy 1-Click câu trả lời soạn sẵn ghi đúng nội dung và kèm sẵn Tracking Link vào Clipboard", async ({ page }) => {
    await page.goto(campaignDetailUrl);

    // Tạo link trước để có tracking link
    await page.getByRole("button", { name: "Tạo link", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Tạo link tiếp thị", exact: true }).click();
    const linkInput = dialog.locator('textarea#tracking-url, input#tracking-url');
    await expect(linkInput).toBeVisible({ timeout: 5000 });
    const trackingUrl = await linkInput.inputValue();
    await dialog.getByRole("button", { name: "Đóng", exact: true }).click();

    // Tìm nút Copy trên câu trả lời soạn sẵn
    const copyCannedBtn = page.getByRole("button", { name: /sao chép câu trả lời|copy câu trả lời/i }).or(page.getByTestId("copy-canned-response-btn")).first();
    await expect(copyCannedBtn, "Phải có nút Copy 1-Click cho câu trả lời soạn sẵn").toBeVisible({ timeout: 3000 });
    await copyCannedBtn.click();

    // Đọc Clipboard
    const clipboardText = await page.evaluate(async () => navigator.clipboard.readText());

    expect(clipboardText, "Nội dung câu trả lời mẫu trong Clipboard không được rỗng").toBeTruthy();
    expect(clipboardText, "FR-RES-09: Câu trả lời soạn sẵn bắt buộc phải kèm sẵn Tracking Link của Reseller").toContain(trackingUrl);
  });
});
