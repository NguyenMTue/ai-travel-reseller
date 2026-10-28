import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

/**
 * =============================================================================
 * SUITE: KIỂM TRA ĐỘC LẬP CHẤT LƯỢNG GIAO DIỆN MODAL TĨNH CỦA TESTER 3
 * DỰ ÁN: AI Travel Reseller Network (TravelLink AI)
 * NGƯỜI THỰC HIỆN: Senior QA Automation Engineer (Auditor: Trương Đức Huy)
 * CÔNG CỤ & MÔI TRƯỜNG: Playwright E2E UI Audit (Desktop 1280x720 & Mobile 390x844)
 * PHẠM VI KIỂM THỬ:
 *  - Modal Quy Chuẩn Video (VideoGuidelinesModal - Task T3-FE-W3-02 / PR #33)
 *  - Bổ trợ: Modal Tạo Link Tiếp Thị & QR (TrackingLinkModal - Tuần 2)
 * =============================================================================
 */

const SCREENSHOT_DIR = path.resolve(
  process.cwd(),
  "tests/qa-deliverables/independent-review-modal-tester3/screenshots"
);

test.beforeAll(async () => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
});

test.describe("Bộ Kiểm thử Độc lập Chất lượng Giao diện Modal Tĩnh - Tester 3", () => {
  test.beforeEach(async ({ page }) => {
    // Chặn các request API ngoài luồng hoặc tracking thật
    await page.route("**/*", (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/r/")) {
        return route.abort();
      }
      return route.continue();
    });
  });

  /**
   * TC-MODAL-01: Kiểm tra Bố cục, Căn lề, Nội dung tĩnh & Chống tràn khung trên Desktop (1280x720)
   */
  test("TC-MODAL-01: Bố cục, Căn lề & Nội dung VideoGuidelinesModal trên Desktop (1280x720)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/preview/merchant/library", { waitUntil: "domcontentloaded" });

    // Chờ React hydration hoàn tất (khi danh sách media hiển thị)
    await expect(page.getByRole("article")).toHaveCount(6, { timeout: 15000 });

    // 1. Kiểm tra Trigger Button
    const triggerBtn = page.getByRole("button", {
      name: "Quy chuẩn video",
      exact: true,
    });
    await expect(triggerBtn).toBeVisible();
    await expect(triggerBtn).toBeEnabled();

    // 2. Mở Modal tĩnh của Tester 3
    await triggerBtn.click();
    const dialog = page.locator("dialog[aria-labelledby='video-guidelines-title']");
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Xác nhận thuộc tính native dialog
    const isOpenAttr = await dialog.evaluate((el: HTMLDialogElement) => el.open);
    expect(isOpenAttr, "Dialog native phải có thuộc tính open = true").toBe(true);

    // 3. Kiểm tra Accessibility & Focus ban đầu
    const closeIconBtn = dialog.getByRole("button", {
      name: "Đóng hướng dẫn quy chuẩn video",
    });
    await expect(closeIconBtn).toBeVisible();
    await expect(closeIconBtn).toBeFocused();

    // 4. Kiểm tra Focus Management (Không lọt focus ra trigger button)
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Tab");
      const isOpenerFocused = await triggerBtn.evaluate(
        (el) => el === document.activeElement
      );
      expect(isOpenerFocused, "Focus không được lọt về nút mở bên ngoài").toBe(false);
    }
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Shift+Tab");
      const isOpenerFocused = await triggerBtn.evaluate(
        (el) => el === document.activeElement
      );
      expect(isOpenerFocused, "Shift+Tab không được lọt focus ra ngoài").toBe(false);
    }

    // 5. Kiểm tra Typography & Nội dung hiển thị tiếng Việt có dấu
    const eyebrow = dialog.locator("p", { hasText: "Thư viện video mẫu" });
    await expect(eyebrow).toBeVisible();

    const title = dialog.locator("#video-guidelines-title");
    await expect(title).toHaveText("Quy chuẩn video du lịch");

    const description = dialog.locator("#video-guidelines-description");
    await expect(description).toContainText(
      "Video rõ nét, ngắn gọn giúp khách dễ hình dung trải nghiệm"
    );

    // Kiểm tra 3 thẻ quy chuẩn kỹ thuật
    const guidelinesList = dialog.locator("ul li");
    await expect(guidelinesList).toHaveCount(3);

    // Thẻ 1: Khung hình
    await expect(guidelinesList.nth(0)).toContainText("Khung hình");
    await expect(guidelinesList.nth(0)).toContainText("9:16");

    // Thẻ 2: Thời lượng
    await expect(guidelinesList.nth(1)).toContainText("Thời lượng");
    await expect(guidelinesList.nth(1)).toContainText("15 đến 45 giây");

    // Thẻ 3: Chất lượng
    await expect(guidelinesList.nth(2)).toContainText("Chất lượng");
    await expect(guidelinesList.nth(2)).toContainText("Full HD 1080p");

    // Nút xác nhận cuối modal
    const understandBtn = dialog.getByRole("button", { name: "Đã hiểu" });
    await expect(understandBtn).toBeVisible();

    // Đảm bảo không chứa giá trị lỗi (undefined, null, [object Object], NaN)
    const modalText = await dialog.innerText();
    expect(modalText).not.toContain("undefined");
    expect(modalText).not.toContain("null");
    expect(modalText).not.toContain("[object Object]");
    expect(modalText).not.toContain("NaN");

    // 6. Kiểm tra Bố cục, Căn lề & Chống tràn khung (Overflow Audit)
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(1280);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(720);
    }

    const isHorizontallyOverflowing = await dialog.evaluate(
      (el) => el.scrollWidth > el.clientWidth + 1
    );
    expect(
      isHorizontallyOverflowing,
      "Modal không được tràn ngang (scrollWidth <= clientWidth)"
    ).toBe(false);

    // 7. Chụp ảnh minh chứng màn hình Desktop: 01-static-modal-desktop-view.png
    const desktopShotPath = path.join(
      SCREENSHOT_DIR,
      "01-static-modal-desktop-view.png"
    );
    await page.screenshot({ path: desktopShotPath });
    expect(fs.existsSync(desktopShotPath)).toBe(true);

    // 8. Kiểm tra cơ chế đóng bằng phím Escape & Phục hồi Focus
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible({ timeout: 3000 });
    await expect(triggerBtn).toBeFocused();

    // 9. Kiểm tra mở lại và đóng bằng nút 'X'
    await triggerBtn.click();
    await expect(dialog).toBeVisible();
    await closeIconBtn.click();
    await expect(dialog).not.toBeVisible({ timeout: 3000 });

    // 10. Kiểm tra mở lại và đóng bằng nút 'Đã hiểu'
    await triggerBtn.click();
    await expect(dialog).toBeVisible();
    await understandBtn.click();
    await expect(dialog).not.toBeVisible({ timeout: 3000 });
  });

  /**
   * TC-MODAL-02: Kiểm tra Responsive, Touch Targets & Chống tràn khung trên Mobile (390x844 - iPhone 13)
   */
  test("TC-MODAL-02: Responsive & Touch Target VideoGuidelinesModal trên Mobile (390x844)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/preview/merchant/library", { waitUntil: "domcontentloaded" });

    // Chờ React hydration hoàn tất
    await expect(page.getByRole("article")).toHaveCount(6, { timeout: 15000 });

    // 1. Kiểm tra Trigger Button trên mobile
    const triggerBtn = page.getByRole("button", {
      name: "Quy chuẩn video",
      exact: true,
    });
    await expect(triggerBtn).toBeVisible();

    // 2. Mở Modal
    await triggerBtn.click();
    const dialog = page.locator("dialog[aria-labelledby='video-guidelines-title']");
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 3. Kiểm tra kích thước Modal trên mobile (w-[calc(100%-2rem)])
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeLessThanOrEqual(390);
      expect(box.width).toBeGreaterThanOrEqual(300);
      expect(box.x).toBeGreaterThan(0);
      expect(box.x + box.width).toBeLessThanOrEqual(390);
    }

    // 4. Kiểm tra chống tràn ngang toàn trang và modal
    const docOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(docOverflow, "Không bị tràn ngang toàn trang mobile").toBe(false);

    const dialogOverflow = await dialog.evaluate(
      (el) => el.scrollWidth > el.clientWidth + 1
    );
    expect(dialogOverflow, "Modal không bị tràn ngang trên mobile").toBe(false);

    // 5. Kiểm tra Touch Target (kích thước chạm)
    const closeBtn = dialog.getByRole("button", {
      name: "Đóng hướng dẫn quy chuẩn video",
    });
    const closeBtnBox = await closeBtn.boundingBox();
    expect(closeBtnBox).not.toBeNull();
    if (closeBtnBox) {
      expect(closeBtnBox.width).toBeGreaterThanOrEqual(36);
      expect(closeBtnBox.height).toBeGreaterThanOrEqual(36);
      expect(closeBtnBox.x + closeBtnBox.width).toBeLessThanOrEqual(390);
    }

    const understandBtn = dialog.getByRole("button", { name: "Đã hiểu" });
    const understandBtnBox = await understandBtn.boundingBox();
    expect(understandBtnBox).not.toBeNull();
    if (understandBtnBox) {
      expect(understandBtnBox.height).toBeGreaterThanOrEqual(44);
    }

    // 6. Chụp ảnh minh chứng màn hình Mobile: 02-static-modal-mobile-view.png
    const mobileShotPath = path.join(
      SCREENSHOT_DIR,
      "02-static-modal-mobile-view.png"
    );
    await page.screenshot({ path: mobileShotPath });
    expect(fs.existsSync(mobileShotPath)).toBe(true);

    // 7. Kiểm tra thao tác đóng modal trên Mobile bằng nút 'Đã hiểu'
    await understandBtn.click();
    await expect(dialog).not.toBeVisible({ timeout: 3000 });
  });

  /**
   * TC-MODAL-03: Kiểm tra bổ trợ Modal TrackingLinkModal (Phân hệ Reseller)
   */
  test("TC-MODAL-03: Bổ trợ kiểm tra giao diện TrackingLinkModal trên Desktop (1280x720)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(
      "/preview/reseller/campaigns/11111111-1111-4111-8111-111111111111?state=approved&tracking=success",
      { waitUntil: "domcontentloaded" }
    );

    const openBtn = page.getByRole("button", { name: "Tạo link", exact: true });
    await expect(openBtn).toBeVisible({ timeout: 15000 });
    await openBtn.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(
      dialog.getByRole("heading", { name: /link tiếp thị & qr/i })
    ).toBeVisible();

    // Chụp ảnh minh chứng bổ sung Desktop
    const trackingDesktopShot = path.join(
      SCREENSHOT_DIR,
      "03-static-tracking-modal-desktop.png"
    );
    await page.screenshot({ path: trackingDesktopShot });
    expect(fs.existsSync(trackingDesktopShot)).toBe(true);

    // Kiểm tra đóng bằng Escape
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible({ timeout: 3000 });
  });
});
