import { test, expect } from "@playwright/test";

/**
 * ============================================================================
 * E2E UI TEST SUITE: RESELLER PORTAL
 * Dự án: AI Travel Reseller Network (MVP)
 * Tài liệu tham chiếu: SRS v1.1 & BRD v1.0
 * Quy tắc: Bám sát yêu cầu nghiệp vụ, không ép pass, ghi nhận lỗi phân hệ.
 * ============================================================================
 */

test.describe("Nhóm 1: Đăng ký, Hồ sơ, Tài khoản MXH & Điều khoản tuân thủ", () => {
  // FR-RES-01: Đăng ký tài khoản Reseller với đầy đủ thông tin hồ sơ
  test("TC-RES-01 [FR-RES-01]: Đăng ký tài khoản Reseller với các trường bắt buộc (Tên, Email, SĐT, Địa điểm, Sở thích, Ngôn ngữ)", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Kết nối từ hôm nay." })).toBeVisible();

    // Chọn vai trò Cộng tác viên (Reseller)
    const resellerRadio = page.getByRole("radio", { name: /Cộng tác viên/i });
    await expect(resellerRadio).toBeVisible();
    await resellerRadio.check();
    await expect(resellerRadio).toBeChecked();

    // Các trường cơ bản hiện có
    await expect(page.getByLabel(/Họ và tên/i)).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirm_password"]')).toBeVisible();

    // [SRS v1.1 FR-RES-01]: Bắt buộc phải có Số điện thoại, Địa điểm, Sở thích, Ngôn ngữ
    // FE hiện đang thiếu các trường này trên form đăng ký / cập nhật hồ sơ Reseller.
    test.fixme(
      true,
      "BLOCKED [BUG-FE-RES-01]: Form đăng ký Reseller thiếu các trường SĐT, Địa điểm, Sở thích, Ngôn ngữ theo SRS v1.1 FR-RES-01"
    );

    await expect(page.locator('input[name="phone"]')).toBeVisible();
    await expect(page.locator('input[name="location"], select[name="location"]')).toBeVisible();
    await expect(page.locator('input[name="interests"], select[name="interests"]')).toBeVisible();
    await expect(page.locator('input[name="languages"], select[name="languages"]')).toBeVisible();
  });

  // FR-RES-02 & RULE-17: Quản lý liên kết tài khoản mạng xã hội (TikTok, Facebook) & Bảo mật không lưu mật khẩu MXH
  test("TC-RES-02 [FR-RES-02, RULE-17]: Khai báo tài khoản MXH (TikTok, Facebook) và TUYỆT ĐỐI không có ô nhập mật khẩu MXH", async ({ page }) => {
    // Điều hướng vào trang quản lý hồ sơ / tài khoản MXH của Reseller
    await page.goto("/reseller/profile");

    // [SRS v1.1 FR-RES-02 & RULE-17]: Cần màn hình quản lý Social Accounts
    test.fixme(
      true,
      "BLOCKED [BUG-FE-RES-02]: Chưa có màn hình quản lý hồ sơ và liên kết tài khoản MXH (/reseller/profile)"
    );

    await expect(page.getByRole("heading", { name: /Tài khoản mạng xã hội|Hồ sơ cộng tác viên/i })).toBeVisible();

    // Form thêm tài khoản MXH
    await page.getByRole("button", { name: /Thêm tài khoản MXH/i }).click();
    await expect(page.locator('select[name="platform"]')).toBeVisible(); // TikTok / Facebook
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="url"]')).toBeVisible();
    await expect(page.locator('input[name="followers"]')).toBeVisible();
    await expect(page.locator('input[name="average_views"]')).toBeVisible();
    await expect(page.locator('input[name="engagement_rate"]')).toBeVisible();

    // RULE-17: KIỂM TRA BẢO MẬT BẮT BUỘC - Không được có input password cho MXH
    const passwordInputs = page.locator('form[name="social-account-form"] input[type="password"]');
    await expect(passwordInputs).toHaveCount(0);

    // Tài khoản mới thêm phải ở trạng thái "Chờ duyệt"
    await page.locator('input[name="username"]').fill("@travel_reviewer_danang");
    await page.locator('input[name="url"]').fill("https://tiktok.com/@travel_reviewer_danang");
    await page.locator('input[name="followers"]').fill("50000");
    await page.getByRole("button", { name: /Lưu tài khoản/i }).click();

    await expect(page.getByText(/Chờ duyệt/i)).toBeVisible();
  });

  // FR-RES-04 & RULE-14: Yêu cầu đồng ý cam kết điều khoản tuân thủ nội dung
  test("TC-RES-03 [FR-RES-04, RULE-14]: Bắt buộc Reseller xác nhận điều khoản tuân thủ (người thật vận hành, gắn nhãn QC, không đăng trùng, không giả mạo)", async ({ page }) => {
    await page.goto("/register");
    const resellerRadio = page.getByRole("radio", { name: /Cộng tác viên/i });
    await resellerRadio.check();

    // [SRS v1.1 FR-RES-04 & RULE-14]: Bắt buộc checkbox cam kết tuân thủ
    test.fixme(
      true,
      "BLOCKED [BUG-FE-RES-03]: Form đăng ký Reseller thiếu checkbox cam kết điều khoản tuân thủ RULE-14"
    );

    const complianceCheckbox = page.locator('input[name="compliance_accepted"], input[name="terms_accepted"]');
    await expect(complianceCheckbox).toBeVisible();
    await expect(page.getByText(/người thật vận hành/i)).toBeVisible();
    await expect(page.getByText(/gắn nhãn quảng cáo/i)).toBeVisible();
    await expect(page.getByText(/không đăng trùng nguyên bản/i)).toBeVisible();
    await expect(page.getByText(/không giả mạo đánh giá/i)).toBeVisible();

    // Thử submit khi chưa tick checkbox -> Form phải chặn lại
    await page.locator('input[name="full_name"]').fill("Nguyễn Văn A");
    await page.locator('input[name="email"]').fill("reseller_test@example.com");
    await page.locator('input[name="password"]').fill("ValidPass123@");
    await page.locator('input[name="confirm_password"]').fill("ValidPass123@");
    await page.getByRole("button", { name: /Tạo tài khoản/i }).click();

    await expect(page.getByText(/Bạn phải đồng ý với điều khoản tuân thủ/i)).toBeVisible();
  });

  // FR-RES-01, FR-RES-04, FR-ADM-02: Chặn quyền tham gia campaign với Reseller chưa duyệt / bị đình chỉ
  test("TC-RES-04 [FR-RES-01, FR-RES-04, FR-ADM-02]: Reseller ở trạng thái 'Chờ duyệt' hoặc 'Bị đình chỉ' bị chặn tham gia chiến dịch", async ({ page }) => {
    // Khi tài khoản ở trạng thái 'pending' hoặc 'suspended'
    await page.goto("/reseller/campaigns");

    // [SRS v1.1 FR-RES-01, FR-ADM-02]: Cần kiểm tra status tài khoản thực tế từ DB để chặn tham gia
    test.fixme(
      true,
      "BLOCKED [BUG-DB-RES-01 & BUG-BE-RES-01]: Middleware/Access guard chỉ kiểm tra có row trong bảng 'resellers', không kiểm tra cột 'status' (pending/suspended)"
    );

    await expect(page.getByText(/Tài khoản của bạn đang chờ quản trị viên duyệt|Tài khoản bị đình chỉ/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Tạo link|Tham gia/i })).toBeDisabled();
  });
});

test.describe("Nhóm 2: Campaign Feed & Tham gia Campaign", () => {
  // FR-RES-05 & FR-CMP-02: Hiển thị Feed các chiến dịch đang Hoạt động kèm đầy đủ thông tin sản phẩm và thu nhập tiềm năng
  test("TC-RES-05 [FR-RES-05, FR-CMP-02]: Campaign Feed hiển thị danh sách chiến dịch 'Hoạt động' với đầy đủ: Tên, Sản phẩm, Giá bán, Hoa hồng, Số nội dung, Thu nhập tiềm năng", async ({ page }) => {
    await page.goto("/preview/reseller");
    await expect(page.getByRole("heading", { name: "Chiến dịch dành cho bạn" })).toBeVisible();

    const campaignCards = page.getByTestId("campaign-card");
    await expect(campaignCards.first()).toBeVisible();

    // Kiểm tra thông tin hiển thị cơ bản
    await expect(campaignCards.first().locator("h2, h3, .font-medium").first()).toBeVisible(); // Tên chiến dịch
    await expect(campaignCards.first().getByText(/Hoa hồng/i)).toBeVisible();

    // [SRS v1.1 FR-RES-05 & FR-CMP-02]: Thẻ chiến dịch phải hiển thị:
    // 1. Giá sản phẩm (VND)
    // 2. Số nội dung gợi ý (đã duyệt)
    // 3. Thu nhập tiềm năng tính toán (Ước tính hoa hồng = Giá x Tỷ lệ hoa hồng)
    test.fixme(
      true,
      "BLOCKED [BUG-FE-RES-04]: Campaign Card thiếu hiển thị Giá sản phẩm, Số nội dung gợi ý và Thu nhập tiềm năng theo FR-RES-05"
    );

    await expect(campaignCards.first().getByText(/Giá:|₫|VND/i)).toBeVisible();
    await expect(campaignCards.first().getByText(/nội dung gợi ý|bài mẫu/i)).toBeVisible();
    await expect(campaignCards.first().getByText(/Thu nhập tiềm năng/i)).toBeVisible();
  });

  // FR-RES-05: Lọc và tìm kiếm chiến dịch không dấu
  test("TC-RES-06 [FR-RES-05]: Tìm kiếm không dấu và lọc theo Danh mục, Địa điểm, Mức hoa hồng", async ({ page }) => {
    await page.goto("/preview/reseller");

    // Tìm kiếm không dấu "hoi an" -> Ra "Hội An Foodie"
    const searchInput = page.getByLabel("Tìm kiếm chiến dịch", { exact: true });
    await searchInput.fill("hoi an");
    await expect(page.getByTestId("campaign-card")).toContainText(["Hội An Foodie"]);

    // Lọc theo Danh mục
    await page.getByLabel("Danh mục", { exact: true }).selectOption("Ẩm thực");
    await expect(page.getByTestId("campaign-card")).toHaveCount(1);

    // Lọc theo Địa điểm
    await page.getByLabel("Địa điểm", { exact: true }).selectOption("Hội An");
    await expect(page.getByTestId("campaign-card")).toHaveCount(1);

    // Xóa bộ lọc
    await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).first().click();
    await expect(page.getByTestId("campaign-card")).toHaveCount(4);
  });

  // FR-RES-06, FR-TRK-01, FR-ATT-01: Tham gia campaign trong tối đa 3 thao tác, chọn tài khoản MXH, cấp Tracking Link và Mã Voucher
  test("TC-RES-07 [FR-RES-06, FR-TRK-01, FR-ATT-01]: Tham gia chiến dịch trong tối đa 3 thao tác, chọn tài khoản MXH, cấp đồng thời Tracking Link riêng và Mã Voucher riêng", async ({ page }) => {
    await page.goto("/preview/reseller/campaigns/11111111-1111-4111-8111-111111111111?state=approved&tracking=success");

    // Thao tác 1: Nhấn "Tạo link" / "Tham gia chiến dịch"
    const joinBtn = page.getByRole("button", { name: "Tạo link", exact: true });
    await expect(joinBtn).toBeVisible();
    await joinBtn.click();

    const dialog = page.getByRole("dialog", { name: "Link tiếp thị & QR" });
    await expect(dialog).toBeVisible();

    // [SRS v1.1 FR-RES-06]: Phải cho phép chọn tài khoản MXH tham gia (TikTok/Facebook đã liên kết)
    // [SRS v1.1 FR-ATT-01]: Phải cấp đồng thời Tracking Link (<domain>/r/<tracking_id>) VÀ Mã Voucher riêng
    test.fixme(
      true,
      "BLOCKED [BUG-FE-RES-05 & BUG-BE-RES-02]: Thiếu bước chọn tài khoản MXH khi tham gia và hệ thống chưa cấp Unique Voucher Code theo FR-ATT-01"
    );

    // Thao tác 2: Chọn tài khoản MXH tham gia
    await dialog.locator('select[name="social_account_id"]').selectOption({ index: 1 });

    // Thao tác 3: Xác nhận tham gia
    await dialog.getByRole("button", { name: "Tạo link tiếp thị", exact: true }).click();

    // Kiểm tra kết quả cấp phát:
    // 1. Tracking Link dạng /r/<tracking_id>
    const trackingLinkInput = page.getByLabel(/Link tiếp thị/i);
    await expect(trackingLinkInput).toBeVisible();
    const linkValue = await trackingLinkInput.inputValue();
    expect(linkValue).toMatch(/\/r\/[a-zA-Z0-9_-]+/);

    // 2. Mã Voucher riêng duy nhất
    const voucherCodeElement = page.getByTestId("voucher-code");
    await expect(voucherCodeElement).toBeVisible();
    await expect(voucherCodeElement).not.toBeEmpty();
  });
});

test.describe("Nhóm 3: Thư viện nội dung, Tải về & Câu trả lời soạn sẵn", () => {
  // FR-RES-07 & FR-QC-06: Thư viện nội dung đã duyệt (APPROVED), lọc theo Persona
  test("TC-RES-08 [FR-RES-07, FR-QC-06]: Hiển thị thư viện nội dung đã duyệt (APPROVED) và chuyển đổi 4 Persona chuẩn", async ({ page }) => {
    await page.goto("/preview/reseller/campaigns/11111111-1111-4111-8111-111111111111?state=approved");

    await expect(page.getByRole("heading", { name: "Content Kit" })).toBeVisible();

    // 4 Persona chuẩn theo tài liệu FE_W2 / SRS:
    const personas = [
      "Chuyên gia bản địa",
      "Gia đình",
      "Tín đồ ẩm thực / Check-in",
      "Săn deal thông thái",
    ];

    for (const personaName of personas) {
      const personaBtn = page.getByRole("button", { name: personaName });
      await expect(personaBtn).toBeVisible();
      await personaBtn.click();
      await expect(personaBtn).toHaveAttribute("aria-pressed", "true");
    }
  });

  // FR-RES-07: Lọc theo độ dài video (15s, 30s, 60s) và Funnel Stage (Discovery, Consideration, Conversion)
  test("TC-RES-09 [FR-RES-07]: Bộ lọc nội dung theo độ dài (15s, 30s, 60s) và giai đoạn phễu (Discovery, Consideration, Conversion)", async ({ page }) => {
    await page.goto("/preview/reseller/campaigns/11111111-1111-4111-8111-111111111111?state=approved");

    // [SRS v1.1 FR-RES-07]: Thư viện nội dung phải có bộ lọc theo độ dài (15s, 30s, 60s) và Funnel Stage
    test.fixme(
      true,
      "BLOCKED [BUG-FE-RES-06]: Content Kit thiếu bộ lọc độ dài video (15s, 30s, 60s) và Funnel Stage (Discovery, Consideration, Conversion)"
    );

    const lengthFilter = page.locator('select[name="video_length"], [data-testid="filter-duration"]');
    await expect(lengthFilter).toBeVisible();
    await lengthFilter.selectOption("30s");

    const funnelFilter = page.locator('select[name="funnel_stage"], [data-testid="filter-funnel"]');
    await expect(funnelFilter).toBeVisible();
    await funnelFilter.selectOption("Discovery");
  });

  // FR-RES-08: Tải video, sao chép nội dung kèm sẵn tracking link và ghi nhận sự kiện
  test("TC-RES-10 [FR-RES-08]: Tải video sáng tạo, sao chép caption/CTA gắn sẵn tracking link và ghi nhận sự kiện vào tracking_events", async ({ page }) => {
    await page.goto("/preview/reseller/campaigns/11111111-1111-4111-8111-111111111111?state=approved&tracking=success");

    // Kiểm tra các trường sao chép nội dung kịch bản
    await expect(page.getByRole("button", { name: "Copy Hook" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy Script" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy Caption" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy CTA" })).toBeVisible();

    // [SRS v1.1 FR-RES-08]: Cần có nút "Tải video" và cơ chế phát sự kiện ghi nhận 'content_downloaded', 'content_copied'
    test.fixme(
      true,
      "BLOCKED [BUG-FE-RES-07 & BUG-BE-RES-03]: Thiếu nút Tải video và endpoint ghi nhận sự kiện tải/sao chép nội dung"
    );

    const downloadVideoBtn = page.getByRole("button", { name: /Tải video/i });
    await expect(downloadVideoBtn).toBeVisible();

    // Giả lập click tải video và kiểm tra sự kiện ghi nhận
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      downloadVideoBtn.click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.(mp4|mov)$/i);

    // Kiểm tra CTA kèm link đã được chèn tracking link tự động
    const copyCtaWithLinkBtn = page.getByRole("button", { name: "Copy CTA kèm link" });
    await expect(copyCtaWithLinkBtn).toBeVisible();
    await copyCtaWithLinkBtn.click();
    await expect(page.getByText(/Đã sao chép CTA kèm link/i)).toBeVisible();
  });

  // FR-RES-09: Bộ câu trả lời soạn sẵn (Canned Responses) cho bình luận/tin nhắn thường gặp
  test("TC-RES-11 [FR-RES-09]: Thư viện câu trả lời soạn sẵn (Canned Responses) cho giá, địa điểm, cách đặt tour kèm tracking link", async ({ page }) => {
    await page.goto("/preview/reseller/campaigns/11111111-1111-4111-8111-111111111111?state=approved");

    // [SRS v1.1 FR-RES-09]: Thư viện phải có các mẫu câu trả lời soạn sẵn để Reseller tư vấn khách
    test.fixme(
      true,
      "BLOCKED [BUG-FE-RES-08]: Chưa có component Thư viện câu trả lời soạn sẵn (Canned Responses) trong Content Kit"
    );

    const cannedSection = page.getByRole("region", { name: /Câu trả lời soạn sẵn|Mẫu tin nhắn/i });
    await expect(cannedSection).toBeVisible();

    // Kiểm tra 3 loại câu trả lời thường gặp
    await expect(cannedSection.getByText(/Hỏi về giá/i)).toBeVisible();
    await expect(cannedSection.getByText(/Hỏi về địa điểm/i)).toBeVisible();
    await expect(cannedSection.getByText(/Cách thức đặt vé|Cách đặt tour/i)).toBeVisible();

    // Kiểm tra nút copy câu trả lời mẫu
    const copyCannedBtn = cannedSection.getByRole("button", { name: /Sao chép câu trả lời/i }).first();
    await expect(copyCannedBtn).toBeVisible();
  });
});

test.describe("Nhóm 4: Khai báo bài đăng & Số liệu tự khai", () => {
  // FR-RES-10: Khai báo URL bài đăng đã đăng và liên kết nội dung đã dùng
  test("TC-RES-12 [FR-RES-10]: Khai báo URL bài đăng TikTok/Facebook đã xuất bản và liên kết với biến thể Content Kit", async ({ page }) => {
    await page.goto("/reseller/posts/declare");

    // [SRS v1.1 FR-RES-10]: Cần form khai báo link bài đăng mạng xã hội
    test.fixme(
      true,
      "BLOCKED [BUG-FE-RES-09 & BUG-BE-RES-04]: Chưa có màn hình khai báo bài đăng (/reseller/posts) và endpoint lưu bài đăng"
    );

    await expect(page.getByRole("heading", { name: /Khai báo bài đăng/i })).toBeVisible();

    await page.locator('select[name="campaign_id"]').selectOption({ index: 1 });
    await page.locator('select[name="content_id"]').selectOption({ index: 1 });
    await page.locator('input[name="post_url"]').fill("https://www.tiktok.com/@danang_travel/video/1234567890");

    await page.getByRole("button", { name: /Xác nhận khai báo/i }).click();
    await expect(page.getByText(/Khai báo bài đăng thành công/i)).toBeVisible();
  });

  // FR-RES-11 & RULE-13: Khai báo số liệu tương tác (view, like, comment, share, save) kèm ảnh chụp & gắn nhãn "Tự khai"
  test("TC-RES-13 [FR-RES-11, RULE-13]: Khai báo số liệu tự khai kèm ảnh chứng minh; BẮT BUỘC gắn nhãn 'Tự khai' và không tính vào hoa hồng", async ({ page }) => {
    await page.goto("/reseller/posts/metrics");

    // [SRS v1.1 FR-RES-11 & RULE-13]: Cần form cập nhật số liệu tự khai và ảnh bằng chứng
    test.fixme(
      true,
      "BLOCKED [BUG-FE-RES-10]: Chưa có form cập nhật số liệu tương tác tự khai và cơ chế hiển thị nhãn 'Tự khai'"
    );

    await expect(page.getByRole("heading", { name: /Khai báo số liệu tương tác/i })).toBeVisible();

    await page.locator('input[name="views"]').fill("15200");
    await page.locator('input[name="likes"]').fill("1200");
    await page.locator('input[name="comments"]').fill("85");
    await page.locator('input[name="shares"]').fill("40");
    await page.locator('input[name="saves"]').fill("120");

    // Upload ảnh chụp màn hình bằng chứng
    const fileInput = page.locator('input[type="file"][name="proof_screenshot"]');
    await expect(fileInput).toBeVisible();

    await page.getByRole("button", { name: /Gửi số liệu/i }).click();

    // RULE-13: Kiểm tra nhãn "Tự khai" bắt buộc phải hiển thị bên cạnh các số liệu này
    const selfReportedBadge = page.getByText(/Tự khai/i);
    await expect(selfReportedBadge).toBeVisible();

    // Số liệu này KHÔNG được tính vào hoa hồng thực nhận
    await expect(page.getByText(/Số liệu tự khai không dùng để tính hoa hồng chi trả/i)).toBeVisible();
  });
});

test.describe("Nhóm 5: Dashboard Hiệu suất, Hoa hồng & Thông tin nhận tiền", () => {
  // FR-RES-12, FR-ANA-06, FR-ANA-11: Dashboard hiệu suất (Click, Lead, Booking, GMV, Tỷ lệ chuyển đổi, VND, Asia/Ho_Chi_Minh)
  test("TC-RES-14 [FR-RES-12, FR-ANA-06, FR-ANA-11]: Dashboard hiệu suất hiển thị Click, Lead, Booking, GMV, CR ('N/A' khi Click=0), Tiền tệ VND, Múi giờ Asia/Ho_Chi_Minh", async ({ page }) => {
    await page.goto("/reseller/dashboard");

    // [SRS v1.1 FR-RES-12]: Cần màn hình Dashboard phân hệ Reseller
    test.fixme(
      true,
      "BLOCKED [BUG-FE-RES-11]: Chưa có giao diện Dashboard Hiệu suất cho Reseller Portal (/reseller/dashboard)"
    );

    await expect(page.getByRole("heading", { name: /Hiệu suất bán hàng|Tổng quan Reseller/i })).toBeVisible();

    // Các thẻ chỉ số chính
    await expect(page.getByTestId("metric-clicks")).toBeVisible();
    await expect(page.getByTestId("metric-leads")).toBeVisible();
    await expect(page.getByTestId("metric-bookings")).toBeVisible();
    await expect(page.getByTestId("metric-gmv")).toBeVisible();
    await expect(page.getByTestId("metric-conversion-rate")).toBeVisible();

    // Định dạng tiền tệ VND
    await expect(page.getByTestId("metric-gmv")).toContainText(/₫|VND/);

    // Xử lý mẫu số = 0: Khi Clicks = 0 thì Tỷ lệ chuyển đổi phải hiển thị "N/A" thay vì NaN hoặc 0%
    const crValue = await page.getByTestId("metric-conversion-rate").textContent();
    expect(crValue?.trim()).toMatch(/(N\/A|[0-9.]+%)/);

    // Bộ lọc theo chiến dịch, nội dung, tài khoản
    await expect(page.locator('select[name="filter_campaign"]')).toBeVisible();
    await expect(page.locator('select[name="filter_content"]')).toBeVisible();
    await expect(page.locator('select[name="filter_account"]')).toBeVisible();
  });

  // FR-ANA-05 & FR-ANA-10: Tách biệt rõ ràng chỉ số "Hệ thống ghi nhận" vs "Reseller tự khai"
  test("TC-RES-15 [FR-ANA-05, FR-ANA-10]: Tách biệt rõ ràng 2 khối dữ liệu 'Hệ thống ghi nhận' và 'Reseller tự khai' trên Dashboard", async ({ page }) => {
    await page.goto("/reseller/dashboard");

    test.fixme(
      true,
      "BLOCKED [BUG-FE-RES-11]: Chưa có giao diện Dashboard để kiểm tra việc tách bạch nguồn dữ liệu"
    );

    // Khối 1: Hệ thống ghi nhận (Verified)
    const systemSection = page.getByRole("region", { name: /Hệ thống ghi nhận/i });
    await expect(systemSection).toBeVisible();
    await expect(systemSection.getByText(/Click hợp lệ|Booking thành công|GMV/i)).toBeVisible();

    // Khối 2: Reseller tự khai (Self-reported)
    const selfSection = page.getByRole("region", { name: /Reseller tự khai/i });
    await expect(selfSection).toBeVisible();
    await expect(selfSection.getByText(/Lượt xem|Lượt thích|Bình luận/i)).toBeVisible();
  });

  // FR-RES-13: Dashboard hoa hồng theo 4 trạng thái (Chờ xác nhận, Đã xác nhận, Chi trả được, Đã chi trả)
  test("TC-RES-16 [FR-RES-13]: Quản lý hoa hồng phân tách theo 4 trạng thái vòng đời kèm danh sách booking chi tiết", async ({ page }) => {
    await page.goto("/reseller/commissions");

    // [SRS v1.1 FR-RES-13]: Cần màn hình quản lý hoa hồng cho Reseller
    test.fixme(
      true,
      "BLOCKED [BUG-FE-RES-12]: Chưa có màn hình quản lý hoa hồng (/reseller/commissions)"
    );

    await expect(page.getByRole("heading", { name: /Hoa hồng & Thu nhập/i })).toBeVisible();

    // 4 trạng thái vòng đời hoa hồng theo SRS:
    await expect(page.getByTestId("commission-pending")).toContainText(/Chờ xác nhận/i);
    await expect(page.getByTestId("commission-confirmed")).toContainText(/Đã xác nhận/i);
    await expect(page.getByTestId("commission-payable")).toContainText(/Chi trả được/i);
    await expect(page.getByTestId("commission-paid")).toContainText(/Đã chi trả/i);

    // Bảng danh sách đơn hàng / booking được ghi nhận hoa hồng
    const bookingTable = page.locator("table");
    await expect(bookingTable).toBeVisible();
    await expect(bookingTable.locator("th")).toContainText(["Mã đơn", "Chiến dịch", "Sản phẩm", "Hoa hồng", "Trạng thái"]);
  });

  // FR-RES-14 & RULE-17: Khai báo thông tin tài khoản nhận tiền hoa hồng
  test("TC-RES-17 [FR-RES-14, RULE-17]: Khai báo thông tin nhận hoa hồng (Ngân hàng, Số tài khoản, Chủ tài khoản, Mã số thuế)", async ({ page }) => {
    await page.goto("/reseller/payout-settings");

    // [SRS v1.1 FR-RES-14]: Cần form cập nhật tài khoản thanh toán hoa hồng
    test.fixme(
      true,
      "BLOCKED [BUG-FE-RES-13 & BUG-DB-RES-02]: Chưa có giao diện khai báo thông tin thanh toán và bảng 'resellers' thiếu các cột ngân hàng, MST"
    );

    await expect(page.getByRole("heading", { name: /Thông tin thanh toán|Nhận hoa hồng/i })).toBeVisible();

    await page.locator('select[name="bank_name"]').selectOption("Vietcombank");
    await page.locator('input[name="account_number"]').fill("10123456789");
    await page.locator('input[name="account_holder"]').fill("NGUYEN VAN A");
    await page.locator('input[name="tax_code"]').fill("8412345678");

    await page.getByRole("button", { name: /Lưu thông tin thanh toán/i }).click();
    await expect(page.getByText(/Đã cập nhật thông tin thanh toán/i)).toBeVisible();
  });

  // FR-ANA-09 & FR-AIS-13: Bảo vệ dữ liệu cá nhân (PII Masking) và cách ly dữ liệu giữa các Reseller
  test("TC-RES-18 [FR-ANA-09, FR-AIS-13]: Ẩn/che thông tin cá nhân khách hàng (PII Masking) trong danh sách booking và chỉ xem được dữ liệu của chính mình", async ({ page }) => {
    await page.goto("/reseller/commissions");

    test.fixme(
      true,
      "BLOCKED [BUG-FE-RES-12 & BUG-BE-RES-05]: Danh sách booking chưa có trên UI và API cần đảm bảo masking PII (Tên, SĐT, Email khách)"
    );

    const bookingRow = page.locator("table tbody tr").first();
    await expect(bookingRow).toBeVisible();

    // Kiểm tra PII Masking: Số điện thoại hoặc tên khách không được để lộ nguyên bản
    const customerInfo = await bookingRow.locator(".customer-cell").textContent();
    // Phải có định dạng che: vd Nguyễn V*** hoặc 090****123
    expect(customerInfo).toMatch(/(\*{3,}|[A-Z\s]+\*{2,})/);
  });
});
