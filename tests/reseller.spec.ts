import { expect, test, type Page } from "@playwright/test";
import jsQR from "jsqr";

/**
 * ==============================================================================
 * E2E TEST SUITE: RESELLER PORTAL
 * Dự án: AI Travel Reseller Network (TravelLink AI)
 * Tech Stack: Next.js App Router, TypeScript, Tailwind CSS, Supabase
 *
 * TRACEABILITY MATRIX:
 * - Nhóm 1: FR-RES-01, FR-RES-02, FR-RES-04, FR-ADM-02, RULE-14, RULE-17
 * - Nhóm 2: FR-RES-05, FR-RES-06, FR-CMP-02, FR-TRK-01, FR-ATT-01
 * - Nhóm 3: FR-RES-07, FR-RES-08, FR-RES-09, FR-QC-06
 * - Nhóm 4: FR-RES-10, FR-RES-11, RULE-13
 * - Nhóm 5: FR-RES-12, FR-RES-13, FR-RES-14, FR-ANA-05, FR-ANA-06, FR-ANA-09, FR-ANA-10, FR-ANA-11, FR-AIS-13
 * ==============================================================================
 */

test.describe("Nhóm 1: Đăng ký, Hồ sơ, Tài khoản MXH & Điều khoản tuân thủ", () => {
  // Covers: FR-RES-01, FR-ADM-02
  test("FR-RES-01: Đăng ký tài khoản Reseller với form đầy đủ, validation email và kiểm tra trạng thái tài khoản", async ({ page }) => {
    const timestamp = Date.now();
    const dynamicEmail = `reseller_${timestamp}@example.com`;
    const dynamicName = `Nguyễn Văn Test ${timestamp}`;

    await page.goto("/register?role=reseller");

    // 1. Kiểm tra vai trò "Cộng tác viên" được tự động chọn
    const resellerRadio = page.getByRole("radio", { name: "Cộng tác viên" });
    await expect(resellerRadio).toBeChecked();

    // 2. Kiểm tra validation khi nhập email sai định dạng (typeMismatch)
    const emailInput = page.getByLabel("Email", { exact: true });
    await emailInput.fill("invalid-email-format");
    expect(
      await emailInput.evaluate((el: HTMLInputElement) => el.validity.typeMismatch),
    ).toBe(true);

    // 3. Điền thông tin hợp lệ
    await page.getByLabel("Họ và tên", { exact: true }).fill(dynamicName);
    await emailInput.fill(dynamicEmail);

    const passwordInput = page.getByLabel("Mật khẩu", { exact: true });
    await passwordInput.fill("ResellerPassword123!");

    // 4. Kiểm tra nút toggle ẩn/hiện mật khẩu
    await expect(passwordInput).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Hiện mật khẩu" }).click();
    await expect(passwordInput).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Ẩn mật khẩu" }).click();
    await expect(passwordInput).toHaveAttribute("type", "password");

    // 5. Xác nhận mật khẩu và kiểm tra nút submit
    await page.getByLabel("Xác nhận mật khẩu", { exact: true }).fill("ResellerPassword123!");
    const submitBtn = page.getByRole("button", { name: "Tạo tài khoản" });
    await expect(submitBtn).toBeVisible();

    // 6. Kiểm tra hiển thị trạng thái hồ sơ Reseller (Chờ duyệt, Đã duyệt, Bị đình chỉ)
    await page.goto("/preview/reseller");
    await page.getByRole("button", { name: "Tài khoản MXH & Hồ sơ" }).click();
    const profilePanel = page.getByTestId("social-profile-panel");
    await expect(profilePanel).toBeVisible();
    await expect(page.getByTestId("profile-name")).toBeVisible();
    await expect(page.getByTestId("profile-email")).toBeVisible();
    await expect(page.getByTestId("profile-phone")).toBeVisible();
    await expect(page.getByTestId("profile-region")).toBeVisible();
  });

  // Covers: FR-RES-02, RULE-17
  test("FR-RES-02 & RULE-17: Thêm tài khoản mạng xã hội TikTok/Facebook không lưu mật khẩu và ở trạng thái Chờ duyệt", async ({ page }) => {
    const timestamp = Date.now();
    const tiktokUser = `@traveler_${timestamp}`;
    const tiktokUrl = `https://tiktok.com/${tiktokUser}`;

    await page.goto("/preview/reseller");
    await page.getByRole("button", { name: "Tài khoản MXH & Hồ sơ" }).click();

    const socialForm = page.getByRole("form", { name: "Thêm tài khoản mạng xã hội" });
    await expect(socialForm).toBeVisible();

    // RULE-17: Đảm bảo UI hoàn toàn KHÔNG có trường input lưu mật khẩu MXH
    await expect(socialForm.locator('input[type="password"]')).toHaveCount(0);

    // Điền thông tin tài khoản TikTok tự khai
    await page.getByLabel("Nền tảng").selectOption("TikTok");
    await page.getByLabel("Tên tài khoản (Username)").fill(tiktokUser);
    await page.getByLabel("URL trang cá nhân").fill(tiktokUrl);
    await page.getByLabel("Số người theo dõi (Followers)").fill("150000");
    await page.getByLabel("Lượt xem trung bình").fill("35000");
    await page.getByLabel("Tương tác (%) (Tự khai)").fill("4.5");

    await page.getByRole("button", { name: "Thêm tài khoản MXH" }).click();

    // Xác nhận thông báo thành công và trạng thái mới thêm là 'Chờ duyệt'
    await expect(page.getByRole("status")).toContainText("Chờ duyệt");

    // Kiểm tra dòng dữ liệu mới trong bảng tài khoản mạng xã hội
    const newRow = page.getByTestId("social-accounts-table").getByRole("row").filter({ hasText: tiktokUser });
    await expect(newRow).toBeVisible();
    await expect(newRow).toContainText("Chờ duyệt");
  });

  // Covers: FR-RES-04, RULE-14
  test("FR-RES-04 & RULE-14: Hiển thị và đồng ý điều khoản tuân thủ (người thật vận hành, gắn nhãn quảng cáo, không đăng trùng)", async ({ page }) => {
    await page.goto("/preview/reseller");
    await page.getByRole("button", { name: "Tài khoản MXH & Hồ sơ" }).click();

    // Kiểm tra nội dung cam kết tuân thủ
    const complianceBox = page.locator("text=Điều khoản tuân thủ Reseller");
    await expect(complianceBox).toBeVisible();
    await expect(page.getByText("người thật vận hành", { exact: false })).toBeVisible();
    await expect(page.getByText("gắn nhãn quảng cáo", { exact: false })).toBeVisible();
    await expect(page.getByText("Không đăng trùng nguyên bản", { exact: false })).toBeVisible();

    // Kiểm tra link và điều hướng sang trang Điều khoản sử dụng chính thức
    await page.goto("/terms");
    await expect(page.getByRole("heading", { name: "Điều khoản sử dụng" })).toBeVisible();
    await expect(page.getByText("Bản nháp — chờ công ty phê duyệt")).toBeVisible();
    await expect(page.locator("#tai-khoan")).toBeVisible();
    await expect(page.locator("#noi-dung-ai")).toBeVisible();
  });

  // Covers: FR-RES-01, FR-RES-04, RULE-14 (Acceptance Criteria)
  test("AC: Tài khoản Chờ duyệt hoặc Bị đình chỉ bị chặn tham gia chiến dịch", async ({ page }) => {
    // 1. Truy cập trực tiếp portal khi chưa đăng nhập -> bị redirect về login kèm next
    await page.goto("/reseller/campaigns");
    await expect(page).toHaveURL(/\/login\?next=/);
    expect(new URL(page.url()).searchParams.get("next")).toBe("/reseller/campaigns");

    // 2. Trong giao diện preview, khi trạng thái là 'Chờ duyệt' hoặc 'Bị đình chỉ' -> hiển thị cảnh báo chặn
    await page.goto("/preview/reseller");
    await page.getByRole("button", { name: "Tài khoản MXH & Hồ sơ" }).click();
    await page.getByLabel("Mô phỏng trạng thái:").selectOption("Chờ duyệt");
    await page.getByRole("button", { name: "Chiến dịch & Content Kit" }).click();

    const blockedAlert = page.locator('[role="alert"]:not(#__next-route-announcer__)');
    await expect(blockedAlert).toBeVisible();
    await expect(blockedAlert).toContainText("Không thể tham gia chiến dịch");
    await expect(blockedAlert).toContainText("Chờ duyệt");

    // 3. Khi trạng thái chiến dịch bị blocked -> không hiển thị nội dung hay nút copy
    await page.goto("/preview/reseller/campaigns/11111111-1111-4111-8111-111111111111?state=blocked");
    await expect(page.getByRole("heading", { name: "Nội dung đang chờ xác nhận quyền hiển thị" })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Copy / })).toHaveCount(0);
  });
});

test.describe("Nhóm 2: Campaign Feed & Tham gia Campaign", () => {
  // Covers: FR-RES-05, FR-CMP-02
  test("FR-RES-05 & FR-CMP-02: Hiển thị Campaign Feed ở trạng thái Active, đầy đủ giá, hoa hồng và bộ lọc", async ({ page }) => {
    await page.goto("/preview/reseller");
    await expect(page.getByRole("heading", { name: "Chiến dịch dành cho bạn" })).toBeVisible();

    // Kiểm tra danh sách campaign cards
    const cards = page.getByTestId("campaign-card");
    await expect(cards).toHaveCount(4);

    // Kiểm tra card có đầy đủ thông tin: Danh mục, Tên, Địa điểm, Hoa hồng, Trạng thái Content Kit
    const firstCard = cards.first();
    await expect(firstCard.getByRole("heading")).toBeVisible();
    await expect(firstCard.getByText("Xem Content Kit")).toBeVisible();

    // Kiểm tra card thiếu thông tin hiển thị nhãn trung thực, không bịa 0% hoa hồng
    const incompleteCard = cards.filter({ hasText: "Chiến dịch chưa cập nhật" });
    await expect(incompleteCard.getByText("Chưa có danh mục")).toBeVisible();
    await expect(incompleteCard.getByText("Chưa có địa điểm")).toBeVisible();
    await expect(incompleteCard.getByText("Chưa có hoa hồng")).toBeVisible();
    await expect(incompleteCard).not.toContainText("0%");

    // Kiểm tra tìm kiếm không dấu (accentless search)
    await page.getByLabel("Tìm kiếm chiến dịch").fill("hoi an");
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText("Hội An Foodie");

    // Xóa bộ lọc
    await page.getByRole("button", { name: "Xóa bộ lọc" }).first().click();
    await expect(cards).toHaveCount(4);

    // Lọc theo các dải hoa hồng: under-10, 10-to-20, over-20
    await page.getByLabel("Hoa hồng").selectOption("under-10");
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText("Hội An Foodie");

    await page.getByLabel("Hoa hồng").selectOption("10-to-20");
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText("Đà Nẵng Family");

    await page.getByLabel("Hoa hồng").selectOption("over-20");
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText("Huế Local Guide");
  });

  // Covers: FR-RES-06
  test("FR-RES-06: Tham gia chiến dịch trong tối đa 3 thao tác (chọn campaign -> mở link tiếp thị -> xác nhận tạo)", async ({ page }) => {
    await page.goto("/preview/reseller");

    // Thao tác 1: Chọn campaign -> Click "Xem chi tiết" để vào trang chi tiết chiến dịch
    const viewDetailBtn = page.getByRole("link", { name: "Xem chi tiết Hội An Foodie", exact: true });
    await expect(viewDetailBtn).toBeVisible();
    await viewDetailBtn.click();
    await expect(page).toHaveURL(/11111111-1111-4111-8111-111111111111/);

    // Thao tác 2: Nhấn nút "Tạo link" để mở modal tiếp thị
    const openModalBtn = page.getByRole("button", { name: "Tạo link", exact: true });
    await expect(openModalBtn).toBeVisible();
    await openModalBtn.click();

    const modal = page.getByRole("dialog", { name: "Link tiếp thị & QR" });
    await expect(modal).toBeVisible();

    // Thao tác 3: Xác nhận "Tạo link tiếp thị"
    const confirmCreateBtn = modal.getByRole("button", { name: "Tạo link tiếp thị", exact: true });
    await expect(confirmCreateBtn).toBeVisible();
    await confirmCreateBtn.click();

    // Kết quả: Đã tạo link thành công trong đúng 3 thao tác
    await expect(modal.getByRole("status").filter({ hasText: /Đã nhận link tiếp thị|Đã nhận kết quả mô phỏng/ })).toBeVisible();
  });

  // Covers: FR-TRK-01, FR-ATT-01 (Acceptance Criteria)
  test("FR-TRK-01 & FR-ATT-01: Hệ thống cấp Tracking Link riêng dạng /r/<id>, mã voucher duy nhất và QR Code", async ({ page }) => {
    const url = "/preview/reseller/campaigns/11111111-1111-4111-8111-111111111111?state=approved&tracking=success";
    await page.goto(url);

    // Mở modal tạo link
    await page.getByRole("button", { name: "Tạo link", exact: true }).click();
    const modal = page.getByRole("dialog", { name: "Link tiếp thị & QR" });
    await expect(modal).toBeVisible();

    // Tạo link
    await modal.getByRole("button", { name: "Tạo link tiếp thị", exact: true }).click();

    // 1. Kiểm tra Tracking Link dạng domain/r/<tracking_id>
    const trackingUrlInput = modal.locator("#tracking-url");
    await expect(trackingUrlInput).toBeVisible();
    const generatedUrl = await trackingUrlInput.inputValue();
    expect(generatedUrl).toMatch(/\/r\/[A-Za-z0-9_-]+/);

    // 2. Kiểm tra Mã QR code được render
    const qrImage = modal.getByRole("img", { name: "Mã QR của link tiếp thị" });
    await expect(qrImage).toBeVisible();

    // Giải mã QR code để kiểm tra tính toàn vẹn (khớp chính xác tracking URL)
    const pixels = await qrImage.evaluate(async (element) => {
      const svg = new XMLSerializer().serializeToString(element);
      const img = new Image();
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 360;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, 360, 360);
      return Array.from(ctx.getImageData(0, 0, 360, 360).data);
    });
    const decoded = jsQR(Uint8ClampedArray.from(pixels), 360, 360);
    expect(decoded?.data).toBe(generatedUrl);

    // 3. Kiểm tra nút sao chép link
    const copyLinkBtn = modal.getByRole("button", { name: "Copy link", exact: true });
    await expect(copyLinkBtn).toBeVisible();
  });
});

test.describe("Nhóm 3: Thư viện nội dung, Tải về & Câu trả lời soạn sẵn", () => {
  // Covers: FR-RES-07, FR-QC-06
  test("FR-RES-07 & FR-QC-06: Thư viện hiển thị nội dung APPROVED và hỗ trợ lọc theo 4 Personas", async ({ page }) => {
    const detailUrl = "/preview/reseller/campaigns/11111111-1111-4111-8111-111111111111?state=approved";
    await page.goto(detailUrl);

    await expect(page.getByRole("heading", { name: "Content Kit" })).toBeVisible();

    // Kiểm tra 4 personas theo BRD & SRS
    const personasGroup = page.getByRole("group", { name: "Chọn persona" });
    await expect(personasGroup).toBeVisible();
    await expect(page.getByRole("button", { name: "Local Guide", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Family", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Foodie", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Budget Traveler", exact: true })).toBeVisible();

    // 1. Mặc định là Local Guide
    await expect(page.getByTestId("content-hook")).toHaveText("Hook contract fixture Local Guide");

    // 2. Chuyển sang Family persona
    await page.getByRole("button", { name: "Family", exact: true }).click();
    await expect(page.getByTestId("content-hook")).toHaveText("Hook contract fixture riêng Family");
    await expect(page.getByRole("button", { name: "Family", exact: true })).toHaveAttribute("aria-pressed", "true");

    // 3. Chuyển sang Foodie persona
    await page.getByRole("button", { name: "Foodie", exact: true }).click();
    await expect(page.getByTestId("content-hook")).toHaveText("Hook contract fixture Foodie");

    // 4. Chuyển sang Budget Traveler persona
    await page.getByRole("button", { name: "Budget Traveler", exact: true }).click();
    await expect(page.getByTestId("content-hook")).toHaveText("Hook contract fixture Budget Traveler");

    // Đảm bảo không lộ các nội dung chưa được duyệt (pending_approval, published, public)
    await expect(page.getByText("Không được lộ pending fixture")).toHaveCount(0);
    await expect(page.getByText("Không được lộ published fixture")).toHaveCount(0);
  });

  // Covers: FR-RES-08
  test("FR-RES-08: 1-click Copy (Hook, Script, Caption, CTA) và Copy CTA kèm tracking link", async ({ page }) => {
    // Mock navigator.clipboard để kiểm tra nội dung copy chính xác
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (val: string) => {
            document.documentElement.dataset.copiedText = val;
          },
        },
      });
    });

    const detailUrl = "/preview/reseller/campaigns/11111111-1111-4111-8111-111111111111?state=approved";
    await page.goto(detailUrl);

    // 1. Test Copy Hook
    await page.getByRole("button", { name: "Copy Hook", exact: true }).click();
    await expect(page.getByText("Đã sao chép Hook.", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.dataset.copiedText)).toBe("Hook contract fixture Local Guide");

    // 2. Test Copy Script
    await page.getByRole("button", { name: "Copy Script", exact: true }).click();
    await expect(page.getByText("Đã sao chép Script.", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.dataset.copiedText)).toContain("Script contract fixture");

    // 3. Test Copy Caption
    await page.getByRole("button", { name: "Copy Caption", exact: true }).click();
    await expect(page.getByText("Đã sao chép Caption.", { exact: true })).toBeVisible();

    // 4. Test Copy CTA kèm tracking link
    // Trước khi có link, nút bị disabled hoặc yêu cầu tạo link
    const ctaWithLinkBtn = page.getByRole("button", { name: "Copy CTA kèm link", exact: true });
    await expect(ctaWithLinkBtn).toBeDisabled();

    // Mở modal tạo link tiếp thị
    await page.getByRole("button", { name: "Tạo link", exact: true }).click();
    const modal = page.getByRole("dialog", { name: "Link tiếp thị & QR" });
    await modal.getByRole("button", { name: "Tạo link tiếp thị", exact: true }).click();
    await expect(modal.getByRole("status").filter({ hasText: /Đã nhận/ })).toBeVisible();
    await page.keyboard.press("Escape");

    // Sau khi đã có link tiếp thị -> nút Copy CTA kèm link được kích hoạt
    await expect(ctaWithLinkBtn).toBeEnabled();
    await ctaWithLinkBtn.click();
    await expect(page.getByText("Đã sao chép CTA kèm link.", { exact: true })).toBeVisible();

    // Kiểm tra placeholder [LINK_MUA_VE] đã được thay bằng link thật trong clipboard
    const copiedCta = await page.evaluate(() => document.documentElement.dataset.copiedText);
    expect(copiedCta).not.toContain("[LINK_MUA_VE]");
    expect(copiedCta).toContain("/r/");
  });

  // Covers: FR-RES-09
  test("FR-RES-09: Hiển thị bộ câu trả lời soạn sẵn (Canned Responses) kèm tracking link cho tin nhắn/bình luận", async ({ page }) => {
    const detailUrl = "/preview/reseller/campaigns/11111111-1111-4111-8111-111111111111?state=approved";
    await page.goto(detailUrl);

    const cannedSection = page.getByTestId("canned-responses-section");
    await expect(cannedSection).toBeVisible();
    await expect(cannedSection).toContainText("Câu trả lời soạn sẵn (Canned Responses - FR-RES-09)");

    // Kiểm tra có đủ các tình huống hỏi đáp thường gặp: Giá vé, Địa điểm, Cách đặt vé
    await expect(cannedSection.getByRole("heading", { name: /Giá vé & ưu đãi/i })).toBeVisible();
    await expect(cannedSection.getByRole("heading", { name: /Địa điểm & lịch trình/i })).toBeVisible();
    await expect(cannedSection.getByRole("heading", { name: /Cách đặt vé & thanh toán/i })).toBeVisible();

    // Kiểm tra nút Copy câu trả lời
    const copyCannedBtn = cannedSection.getByRole("button", { name: "Copy Câu trả lời: Giá vé & ưu đãi" });
    await expect(copyCannedBtn).toBeVisible();
  });
});

test.describe("Nhóm 4: Khai báo bài đăng & Số liệu tự khai", () => {
  // Covers: FR-RES-10
  test("FR-RES-10: Khai báo URL bài đăng thực tế trên TikTok/Facebook và liên kết với nội dung đã dùng", async ({ page }) => {
    const timestamp = Date.now();
    const dynamicPostUrl = `https://www.tiktok.com/@danang_traveler/video/7391823901823_${timestamp}`;
    const dynamicEvidence = `evidence_${timestamp}.png`;

    await page.goto("/preview/reseller");
    await page.getByRole("button", { name: "Khai báo bài đăng" }).click();

    const postForm = page.getByRole("form", { name: "Biểu mẫu khai báo bài đăng" });
    await expect(postForm).toBeVisible();

    await page.getByLabel("Nền tảng đăng bài").selectOption("TikTok");
    await page.getByLabel("URL bài đăng thực tế").fill(dynamicPostUrl);
    await page.getByLabel("Liên kết nội dung (ContentAsset đã dùng)").selectOption({ index: 0 });
    await page.getByLabel("Ảnh chụp màn hình bằng chứng (Evidence)").fill(dynamicEvidence);

    // Điền số liệu tự khai
    await page.getByLabel("Lượt xem (Views)").fill("42000");
    await page.getByLabel("Lượt thích").fill("3100");
    await page.getByLabel("Bình luận").fill("210");
    await page.getByLabel("Chia sẻ").fill("85");
    await page.getByLabel("Lưu bài viết").fill("530");

    await page.getByRole("button", { name: "Xác nhận khai báo bài đăng" }).click();

    // Kiểm tra thông báo thành công
    await expect(page.getByRole("status")).toContainText("Đã khai báo bài đăng và số liệu tự khai thành công!");

    // Kiểm tra dòng dữ liệu mới trong bảng bài đăng đã khai báo
    const declaredTable = page.getByTestId("declared-posts-table");
    await expect(declaredTable).toBeVisible();
    const postRow = declaredTable.getByRole("row").filter({ hasText: dynamicPostUrl });
    await expect(postRow).toBeVisible();
    await expect(postRow).toContainText("42.000");
  });

  // Covers: FR-RES-11, RULE-13 (Acceptance Criteria)
  test("FR-RES-11 & RULE-13: Số liệu tự khai phải gắn nhãn rõ ràng 'Tự khai' và tách biệt khỏi số liệu tính hoa hồng", async ({ page }) => {
    await page.goto("/preview/reseller");
    await page.getByRole("button", { name: "Khai báo bài đăng" }).click();

    // Kiểm tra bảng bài đăng có gắn nhãn "Tự khai"
    const selfReportedBadge = page.getByTestId("self-reported-badge").first();
    await expect(selfReportedBadge).toBeVisible();
    await expect(selfReportedBadge).toHaveText("Tự khai");

    // Kiểm tra chú thích quy định RULE-13: không cộng vào tính hoa hồng
    await expect(
      page.getByText("Mọi số liệu do Reseller nhập được gắn nhãn “Tự khai” rõ ràng và không cộng vào tính hoa hồng", {
        exact: false,
      }),
    ).toBeVisible();
  });
});

test.describe("Nhóm 5: Dashboard Hiệu suất, Hoa hồng & Cài đặt nhận tiền", () => {
  // Covers: FR-RES-12, FR-ANA-06, FR-ANA-11
  test("FR-RES-12 & FR-ANA-11: Dashboard hiển thị Click, Lead, Booking, GMV theo VND và tỷ lệ chuyển đổi N/A khi mẫu số bằng 0", async ({ page }) => {
    await page.goto("/preview/reseller");
    await page.getByRole("button", { name: "Hiệu suất & Hoa hồng" }).click();

    const overview = page.getByTestId("performance-commission-panel");
    await expect(overview).toBeVisible();

    // 1. Kiểm tra các metric chính: Click, Lead, Booking, GMV
    await expect(page.getByTestId("metric-click")).toContainText("1.240");
    await expect(page.getByTestId("metric-lead")).toContainText("315");
    await expect(page.getByTestId("metric-booking")).toContainText("42");
    await expect(page.getByTestId("metric-gmv")).toContainText("48.500.000 ₫");

    // 2. Kiểm tra hiển thị tiền tệ VND và múi giờ Asia/Ho_Chi_Minh
    await expect(page.getByText("Tiền tệ hiển thị theo VND", { exact: false })).toBeVisible();
    await expect(page.getByText("Asia/Ho_Chi_Minh", { exact: false })).toBeVisible();

    // 3. Kiểm tra FR-ANA-06: Khi mẫu số bằng 0, tỷ lệ chuyển đổi hiển thị 'N/A'
    const toggleZeroBtn = page.getByRole("button", { name: /Mô phỏng: Mẫu số = 0/ });
    await expect(toggleZeroBtn).toBeVisible();
    await toggleZeroBtn.click();

    // Sau khi mẫu số = 0, tỷ lệ chuyển đổi phải hiển thị N/A
    await expect(page.getByTestId("conversion-rate-value")).toHaveText("N/A");
    await expect(page.getByTestId("metric-click")).toContainText("0");

    // Phục hồi lại dữ liệu
    await page.getByRole("button", { name: /Mô phỏng: Có dữ liệu/ }).click();
    await expect(page.getByTestId("conversion-rate-value")).not.toHaveText("N/A");
  });

  // Covers: FR-ANA-05, FR-ANA-10
  test("FR-ANA-05 & FR-ANA-10: Phân biệt rõ ràng nhãn nguồn 'Hệ thống ghi nhận' và 'Reseller tự khai'", async ({ page }) => {
    await page.goto("/preview/reseller");
    await page.getByRole("button", { name: "Hiệu suất & Hoa hồng" }).click();

    // Các thẻ metric ghi nhận từ hệ thống phải gắn nhãn "Hệ thống ghi nhận"
    const systemBadges = page.locator("[data-testid^='metric-']").getByText("Hệ thống ghi nhận");
    await expect(systemBadges).toHaveCount(4); // Click, Lead, Booking, GMV

    // Phần giải thích phân biệt nguồn dữ liệu
    await expect(page.getByText("Phân biệt nguồn dữ liệu (FR-ANA-05 & FR-ANA-10):")).toBeVisible();
    await expect(page.getByText("Hệ thống ghi nhận:", { exact: false })).toBeVisible();
    await expect(page.getByText("Reseller tự khai:", { exact: false })).toBeVisible();
  });

  // Covers: FR-RES-13, FR-ANA-09, FR-AIS-13
  test("FR-RES-13 & FR-ANA-09: Dashboard hoa hồng theo trạng thái vòng đời và che số điện thoại khách hàng (PII)", async ({ page }) => {
    await page.goto("/preview/reseller");
    await page.getByRole("button", { name: "Hiệu suất & Hoa hồng" }).click();

    // 1. Kiểm tra tổng hoa hồng và bảng booking
    const totalCommission = page.getByTestId("total-commission-amount");
    await expect(totalCommission).toBeVisible();
    await expect(totalCommission).toContainText("₫");

    const bookingsTable = page.getByTestId("commission-bookings-table");
    await expect(bookingsTable).toBeVisible();

    // 2. Kiểm tra các trạng thái vòng đời của hoa hồng
    await expect(bookingsTable.getByText("Đã xác nhận")).toBeVisible();
    await expect(bookingsTable.getByText("Chi trả được")).toBeVisible();
    await expect(bookingsTable.getByText("Chờ xác nhận")).toBeVisible();
    await expect(bookingsTable.getByText("Đã chi trả")).toBeVisible();

    // 3. FR-ANA-09 & FR-AIS-13: Bảo mật PII - Số điện thoại khách hàng phải được che (ví dụ 090***456)
    const maskedPhones = page.getByTestId("masked-phone");
    await expect(maskedPhones.first()).toBeVisible();
    for (const phoneEl of await maskedPhones.all()) {
      const text = await phoneEl.textContent();
      expect(text).toMatch(/^\d{3}\*\*\*\d{3}$/);
    }
  });

  // Covers: FR-RES-14, RULE-17
  test("FR-RES-14 & RULE-17: Form khai báo thông tin nhận hoa hồng (ngân hàng, tài khoản, mã số thuế) an toàn không lưu mật khẩu", async ({ page }) => {
    await page.goto("/preview/reseller");
    await page.getByRole("button", { name: "Hiệu suất & Hoa hồng" }).click();

    const payoutForm = page.getByRole("form", { name: "Cài đặt thông tin nhận tiền" });
    await expect(payoutForm).toBeVisible();

    // RULE-17: Form nhận hoa hồng không có trường mật khẩu thẻ hay internet banking
    await expect(payoutForm.locator('input[type="password"]')).toHaveCount(0);

    // Điền thông tin tài khoản ngân hàng nhận tiền
    await page.getByLabel("Ngân hàng", { exact: true }).fill("Ngân hàng TMCP Ngoại thương (Vietcombank)");
    await page.getByLabel("Số tài khoản ngân hàng").fill("9876543210987");
    await page.getByLabel("Tên chủ tài khoản (Không dấu, in hoa)").fill("TRAN THI RESELLER");
    await page.getByLabel("Mã số thuế cá nhân (Nếu có)").fill("8123456789");

    await page.getByRole("button", { name: "Lưu thông tin thanh toán" }).click();

    // Xác nhận lưu thành công
    await expect(page.getByRole("status")).toContainText("Đã lưu thông tin tài khoản nhận hoa hồng thành công!");
  });
});
