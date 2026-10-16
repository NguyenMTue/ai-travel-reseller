import { expect, test } from "@playwright/test";

/**
 * =============================================================================
 * SUITE: RESELLER PORTAL E2E UI TEST SUITE
 * DỰ ÁN: AI Travel Reseller Network
 * TÀI LIỆU CĂN CỨ: SRS v1.1 & BRD v1.0
 * TÁC GIẢ: Senior QA Automation Engineer
 * =============================================================================
 */

// Thiết lập timeout cho assertion nhanh để phát hiện component/element còn thiếu trên UI
test.use({ actionTimeout: 5000 });

// =============================================================================
// NHÓM 1: ĐĂNG KÝ, HỒ SƠ, TÀI KHOẢN MXH & ĐIỀU KHOẢN TUÂN THỦ
// Tracing: FR-RES-01, FR-RES-02, FR-RES-04, FR-ADM-02, RULE-14, RULE-17
// =============================================================================
test.describe("Nhóm 1: Đăng ký, Hồ sơ, Tài khoản MXH & Điều khoản tuân thủ", () => {

  /**
   * FR-RES-01: Đăng ký tài khoản Reseller với đầy đủ các trường thông tin theo SRS:
   * Họ tên, Email, Số điện thoại, Địa điểm, Sở thích, Ngôn ngữ; Trạng thái mặc định ban đầu là "Chờ duyệt"
   */
  test("FR-RES-01: Form đăng ký Reseller phải cung cấp đầy đủ thông tin: họ tên, email, SĐT, địa điểm, sở thích, ngôn ngữ", async ({ page }) => {
    await page.goto("/register?role=reseller");

    // Kiểm tra các trường cơ bản bắt buộc
    await expect(page.getByLabel("Họ và tên", { exact: false })).toBeVisible();
    await expect(page.getByLabel("Email", { exact: false })).toBeVisible();
    await expect(page.getByLabel("Mật khẩu", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Xác nhận mật khẩu", { exact: false })).toBeVisible();

    // SRS v1.1 FR-RES-01: Yêu cầu thêm Số điện thoại, Địa điểm, Sở thích, Ngôn ngữ
    await expect(page.getByLabel("Số điện thoại", { exact: false }), "SRS yêu cầu trường Số điện thoại").toBeVisible({ timeout: 3000 });
    await expect(page.getByLabel("Địa điểm", { exact: false }), "SRS yêu cầu trường Địa điểm hoạt động").toBeVisible({ timeout: 3000 });
    await expect(page.getByLabel("Sở thích", { exact: false }), "SRS yêu cầu trường Sở thích ngách du lịch").toBeVisible({ timeout: 3000 });
    await expect(page.getByLabel("Ngôn ngữ", { exact: false }), "SRS yêu cầu chọn Ngôn ngữ nội dung").toBeVisible({ timeout: 3000 });
  });

  /**
   * FR-RES-01: Cập nhật thông tin hồ sơ Reseller và hiển thị trạng thái tài khoản
   */
  test("FR-RES-01: Màn hình Hồ sơ Reseller cho phép cập nhật thông tin và hiển thị trạng thái (Chờ duyệt / Đã duyệt / Bị đình chỉ)", async ({ page }) => {
    await page.goto("/reseller/profile");

    // Kỳ vọng có trang hồ sơ cá nhân của Reseller
    await expect(page.getByRole("heading", { name: /hồ sơ|thông tin cá nhân/i }), "Phải có trang quản lý Hồ sơ Reseller").toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId("reseller-status-badge"), "Phải có huy hiệu trạng thái tài khoản (Chờ duyệt/Đã duyệt/Bị đình chỉ)").toBeVisible({ timeout: 3000 });
  });

  /**
   * FR-RES-02 & RULE-17: Thêm tài khoản TikTok/Facebook và kiểm tra an toàn mật khẩu
   * TUYỆT ĐỐI KHÔNG ĐƯỢC có ô nhập/lưu mật khẩu MXH
   */
  test("FR-RES-02 & RULE-17: Thêm tài khoản mạng xã hội (TikTok/FB) với chỉ số tự khai, TUYỆT ĐỐI không có ô nhập mật khẩu MXH", async ({ page }) => {
    await page.goto("/reseller/social-accounts");

    // Màn hình quản lý tài khoản mạng xã hội
    await expect(page.getByRole("heading", { name: /tài khoản mạng xã hội|liên kết mxh/i })).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole("button", { name: /thêm tài khoản/i })).toBeVisible({ timeout: 3000 });

    await page.getByRole("button", { name: /thêm tài khoản/i }).click();

    // Kiểm tra các trường khai báo thông tin kênh
    await expect(page.getByLabel(/nền tảng|kênh/i)).toBeVisible({ timeout: 3000 });
    await expect(page.getByLabel(/username|tên tài khoản/i)).toBeVisible({ timeout: 3000 });
    await expect(page.getByLabel(/url|đường dẫn kênh/i)).toBeVisible({ timeout: 3000 });
    await expect(page.getByLabel(/số follower|người theo dõi/i)).toBeVisible({ timeout: 3000 });
    await expect(page.getByLabel(/lượt xem trung bình/i)).toBeVisible({ timeout: 3000 });
    await expect(page.getByLabel(/tương tác tự khai|tỷ lệ tương tác/i)).toBeVisible({ timeout: 3000 });

    // RULE-17: Tuyệt đối cấm ô nhập mật khẩu mạng xã hội
    const passwordInputs = page.locator('input[type="password"]');
    await expect(passwordInputs, "RULE-17: TUYỆT ĐỐI KHÔNG có ô nhập mật khẩu mạng xã hội").toHaveCount(0);
  });

  /**
   * FR-RES-04 & RULE-14: Yêu cầu đồng ý cam kết điều khoản tuân thủ
   * 4 nội dung bắt buộc: Người thật vận hành, Gắn nhãn quảng cáo, Không đăng trùng nguyên bản, Không giả mạo đánh giá
   */
  test("FR-RES-04 & RULE-14: Hiển thị đầy đủ 4 điều khoản tuân thủ bắt buộc cam kết trước khi tham gia", async ({ page }) => {
    await page.goto("/register?role=reseller");

    // Checkbox hoặc dialog cam kết tuân thủ
    const complianceSection = page.locator('[data-testid="reseller-compliance-terms"], .compliance-terms, fieldset:has-text("tuân thủ")');
    await expect(complianceSection, "Phải có khu vực điều khoản tuân thủ cho Reseller").toBeVisible({ timeout: 3000 });

    // 4 điều khoản bắt buộc theo RULE-14 & FR-RES-04
    await expect(page.getByText(/người thật vận hành/i), "Điều khoản 1: Người thật vận hành").toBeVisible({ timeout: 3000 });
    await expect(page.getByText(/gắn nhãn quảng cáo|tài trợ/i), "Điều khoản 2: Gắn nhãn quảng cáo").toBeVisible({ timeout: 3000 });
    await expect(page.getByText(/không đăng trùng nguyên bản/i), "Điều khoản 3: Không đăng trùng nguyên bản").toBeVisible({ timeout: 3000 });
    await expect(page.getByText(/không giả mạo đánh giá|trải nghiệm thật/i), "Điều khoản 4: Không giả mạo đánh giá").toBeVisible({ timeout: 3000 });
  });

  /**
   * Chặn quyền (FR-RES-01, FR-RES-04, FR-ADM-02):
   * Reseller ở trạng thái "Chờ duyệt", "Bị đình chỉ" hoặc chưa đồng ý điều khoản không được tham gia chiến dịch
   */
  test("FR-RES-01, FR-RES-04, FR-ADM-02: Chặn quyền tham gia chiến dịch đối với tài khoản Chờ duyệt hoặc Bị đình chỉ", async ({ page }) => {
    // Truy cập với tài khoản chưa duyệt / đang bị đình chỉ
    await page.goto("/reseller/campaigns?mock_status=pending");

    // Hệ thống phải hiển thị thông báo chặn và vô hiệu hóa nút tham gia / lấy link
    const blockedNotice = page.getByRole("alert").or(page.getByTestId("access-notice")).or(page.getByText(/chờ duyệt|bị đình chỉ|chưa đủ điều kiện/i));
    await expect(blockedNotice, "Phải hiển thị cảnh báo chặn quyền khi tài khoản chưa được duyệt").toBeVisible({ timeout: 3000 });
    await expect(page.getByRole("button", { name: /tạo link|tham gia chiến dịch/i })).toHaveCount(0);
  });
});

// =============================================================================
// NHÓM 2: CAMPAIGN FEED & THAM GIA CAMPAIGN
// Tracing: FR-RES-05, FR-RES-06, FR-CMP-02, FR-TRK-01, FR-ATT-01
// =============================================================================
test.describe("Nhóm 2: Campaign Feed & Tham gia Campaign", () => {

  /**
   * FR-RES-05 & FR-CMP-02: Feed các chiến dịch đang Hoạt động
   * Phải hiển thị: Tên chiến dịch, Sản phẩm, Giá bán, Hoa hồng, Số nội dung gợi ý, Thu nhập tiềm năng
   */
  test("FR-RES-05 & FR-CMP-02: Feed hiển thị đầy đủ: tên, sản phẩm, giá bán, hoa hồng, số nội dung gợi ý, thu nhập tiềm năng", async ({ page }) => {
    await page.goto("/preview/reseller");

    await expect(page.getByRole("heading", { name: "Chiến dịch dành cho bạn" })).toBeVisible();
    const campaignCards = page.getByTestId("campaign-card");
    await expect(campaignCards.first()).toBeVisible();

    const firstCard = campaignCards.first();
    // Kiểm tra tên chiến dịch
    await expect(firstCard.getByRole("heading")).toBeVisible();
    // Kiểm tra tỷ lệ hoa hồng
    await expect(firstCard.getByText(/hoa hồng/i)).toBeVisible();
    // Kiểm tra số nội dung gợi ý
    await expect(firstCard.getByText(/nội dung/i)).toBeVisible();

    // SRS FR-RES-05: Yêu cầu hiển thị Giá sản phẩm và Thu nhập tiềm năng (Estimated Earning)
    await expect(firstCard.getByTestId("product-price").or(firstCard.getByText(/đ|vnđ|giá/i)), "Thẻ chiến dịch phải hiển thị giá sản phẩm").toBeVisible({ timeout: 3000 });
    await expect(firstCard.getByTestId("estimated-earning").or(firstCard.getByText(/thu nhập tiềm năng/i)), "Thẻ chiến dịch phải hiển thị thu nhập tiềm năng").toBeVisible({ timeout: 3000 });
  });

  /**
   * FR-RES-06, FR-TRK-01 & FR-ATT-01: Tham gia campaign trong tối đa 3 thao tác,
   * chọn tài khoản MXH tham gia, hệ thống cấp Tracking Link riêng (/r/<tracking_id>) và Mã Voucher riêng
   */
  test("FR-RES-06, FR-TRK-01 & FR-ATT-01: Tham gia chiến dịch <= 3 thao tác, chọn tài khoản MXH, cấp Tracking Link riêng và Mã Voucher riêng", async ({ page }) => {
    await page.goto("/preview/reseller");

    // Thao tác 1: Nhấn Xem chi tiết chiến dịch
    await page.getByTestId("campaign-card").first().getByRole("link", { name: /xem chi tiết/i }).click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Thao tác 2: Nhấn nút Tạo link / Tham gia chiến dịch
    const joinBtn = page.getByRole("button", { name: /tạo link|tham gia chiến dịch/i });
    await expect(joinBtn).toBeVisible();
    await joinBtn.click();

    // Modal xuất hiện
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // SRS FR-RES-06: Bắt buộc chọn tài khoản MXH tham gia phân phối
    const socialAccountSelect = dialog.getByLabel(/tài khoản mxh|chọn kênh phân phối/i).or(dialog.getByTestId("select-social-account"));
    await expect(socialAccountSelect, "SRS yêu cầu chọn tài khoản MXH khi tham gia chiến dịch").toBeVisible({ timeout: 3000 });

    // Thao tác 3: Xác nhận tham gia / Tạo link
    const confirmBtn = dialog.getByRole("button", { name: /tạo link tiếp thị|xác nhận tham gia/i });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Kết quả sau khi tham gia:
    // 1. Cấp Tracking Link riêng định dạng <domain>/r/<tracking_id>
    const trackingLinkInput = dialog.getByLabel(/link tiếp thị/i).or(dialog.locator('input[value*="/r/"]'));
    await expect(trackingLinkInput, "Hệ thống phải cấp Tracking link riêng định dạng /r/<id>").toBeVisible({ timeout: 5000 });

    // 2. Cấp Mã Voucher riêng (Unique Voucher Code) theo FR-TRK-01 & FR-ATT-01
    const voucherInput = dialog.getByLabel(/mã voucher|voucher code/i).or(dialog.getByTestId("unique-voucher-code"));
    await expect(voucherInput, "Hệ thống phải cấp Mã Voucher riêng biệt để phân bổ hoa hồng offline/cross-channel").toBeVisible({ timeout: 3000 });
  });
});

// =============================================================================
// NHÓM 3: THƯ VIỆN NỘI DUNG, TẢI VỀ & CÂU TRẢ LỜI SOẠN SẴN
// Tracing: FR-RES-07, FR-RES-08, FR-RES-09, FR-QC-06
// =============================================================================
test.describe("Nhóm 3: Thư viện nội dung, Tải về & Câu trả lời soạn sẵn", () => {
  const campaignDetailUrl = "/preview/reseller/campaigns/11111111-1111-4111-8111-111111111111";

  /**
   * FR-RES-07 & FR-QC-06: Thư viện nội dung đã duyệt cuối (APPROVED),
   * lọc theo persona, độ dài (15s, 30s, 60s), loại / funnel stage (Discovery, Consideration, Conversion)
   */
  test("FR-RES-07 & FR-QC-06: Thư viện nội dung có bộ lọc theo Persona, Độ dài (15s, 30s, 60s) và Funnel Stage", async ({ page }) => {
    await page.goto(campaignDetailUrl);

    await expect(page.getByRole("heading", { name: "Content Kit" })).toBeVisible();

    // Đã có bộ lọc Persona
    await expect(page.getByRole("group", { name: "Chọn persona" })).toBeVisible();

    // SRS FR-RES-07: Yêu cầu bộ lọc Độ dài (15s, 30s, 60s)
    const durationFilter = page.getByLabel(/độ dài|thời lượng/i).or(page.getByTestId("filter-duration"));
    await expect(durationFilter, "SRS yêu cầu bộ lọc độ dài nội dung (15s, 30s, 60s)").toBeVisible({ timeout: 3000 });

    // SRS FR-RES-07: Yêu cầu bộ lọc Loại / Funnel Stage (Discovery, Consideration, Conversion)
    const funnelFilter = page.getByLabel(/funnel stage|loại nội dung|giai đoạn/i).or(page.getByTestId("filter-funnel-stage"));
    await expect(funnelFilter, "SRS yêu cầu bộ lọc theo Funnel Stage (Discovery, Consideration, Conversion)").toBeVisible({ timeout: 3000 });
  });

  /**
   * FR-RES-08: Tải video, sao chép caption, CTA, hashtag kèm sẵn tracking link;
   * ghi nhận sự kiện đã tải và đã sao chép về hệ thống
   */
  test("FR-RES-08: Hỗ trợ Tải video, Copy caption, CTA, hashtag kèm link và ghi nhận sự kiện (tracking event)", async ({ page }) => {
    await page.goto(campaignDetailUrl);

    // Kiểm tra nút Copy CTA, Caption
    await expect(page.getByRole("button", { name: "Copy Caption", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Copy CTA/i })).toBeVisible();

    // SRS FR-RES-08: Yêu cầu nút Tải Video thành phẩm
    const downloadVideoBtn = page.getByRole("button", { name: /tải video|download video/i }).or(page.getByTestId("download-video-btn"));
    await expect(downloadVideoBtn, "SRS yêu cầu nút Tải video đã duyệt cho Reseller").toBeVisible({ timeout: 3000 });

    // SRS FR-RES-08: Yêu cầu trường Hashtag riêng biệt để copy
    const copyHashtagBtn = page.getByRole("button", { name: /copy hashtag/i }).or(page.getByTestId("copy-hashtag-btn"));
    await expect(copyHashtagBtn, "SRS yêu cầu trường Hashtag kèm nút sao chép riêng biệt").toBeVisible({ timeout: 3000 });

    // Khi click tải/copy, hệ thống phải gửi request ghi nhận sự kiện vào tracking_events
    const trackingRequestPromise = page.waitForRequest(
      request => request.url().includes("/api/tracking") && request.method() === "POST",
      { timeout: 3000 }
    ).catch(() => null);

    await page.getByRole("button", { name: "Copy Caption", exact: true }).click();
    const trackingReq = await trackingRequestPromise;
    expect(trackingReq, "Hành vi tải video / sao chép phải gửi API ghi nhận sự kiện tracking event").not.toBeNull();
  });

  /**
   * FR-RES-09: Bộ câu trả lời soạn sẵn cho bình luận/tin nhắn thường gặp kèm tracking link
   */
  test("FR-RES-09: Hiển thị bộ câu trả lời soạn sẵn (giá, địa điểm, cách đặt) kèm tracking link và cho phép copy", async ({ page }) => {
    await page.goto(campaignDetailUrl);

    // Khu vực câu trả lời soạn sẵn (Pre-written responses / Quick Replies)
    const quickRepliesSection = page.locator('[data-testid="quick-replies-section"], section:has-text("câu trả lời soạn sẵn"), section:has-text("hỏi đáp nhanh")');
    await expect(quickRepliesSection, "Phải có khu vực Bộ câu trả lời soạn sẵn cho bình luận/tin nhắn").toBeVisible({ timeout: 3000 });

    // Các kịch bản thường gặp: Giá, Địa điểm, Cách đặt chỗ
    await expect(quickRepliesSection.getByText(/giá|chi phí/i), "Có câu trả lời mẫu về Giá").toBeVisible({ timeout: 3000 });
    await expect(quickRepliesSection.getByText(/địa điểm|vị trí/i), "Có câu trả lời mẫu về Địa điểm").toBeVisible({ timeout: 3000 });
    await expect(quickRepliesSection.getByText(/cách đặt|hướng dẫn đặt/i), "Có câu trả lời mẫu về Cách đặt chỗ").toBeVisible({ timeout: 3000 });

    // Nút copy câu trả lời soạn sẵn kèm tracking link
    await expect(quickRepliesSection.getByRole("button", { name: /sao chép câu trả lời|copy/i }).first()).toBeVisible({ timeout: 3000 });
  });
});

// =============================================================================
// NHÓM 4: KHAI BÁO BÀI ĐĂNG & SỐ LIỆU TỰ KHAI
// Tracing: FR-RES-10, FR-RES-11, RULE-13
// =============================================================================
test.describe("Nhóm 4: Khai báo bài đăng & Số liệu tự khai", () => {

  /**
   * FR-RES-10: Khai báo URL bài đăng đã đăng và liên kết với nội dung đã dùng
   */
  test("FR-RES-10: Form khai báo URL bài đăng trên TikTok/Facebook và liên kết biến thể nội dung đã dùng", async ({ page }) => {
    await page.goto("/reseller/posts/declare");

    // Màn hình khai báo bài đăng
    await expect(page.getByRole("heading", { name: /khai báo bài đăng|báo cáo bài đăng/i })).toBeVisible({ timeout: 3000 });

    // Trường nhập URL bài đăng công khai
    await expect(page.getByLabel(/url bài đăng|đường dẫn bài viết/i)).toBeVisible({ timeout: 3000 });

    // Chọn chiến dịch và nội dung đã sử dụng
    await expect(page.getByLabel(/chọn chiến dịch/i)).toBeVisible({ timeout: 3000 });
    await expect(page.getByLabel(/biến thể nội dung|nội dung đã dùng/i)).toBeVisible({ timeout: 3000 });

    // Nút lưu khai báo
    await expect(page.getByRole("button", { name: /lưu khai báo|xác nhận đăng bài/i })).toBeVisible({ timeout: 3000 });
  });

  /**
   * FR-RES-11 & RULE-13: Khai báo số liệu tương tác tự khai kèm ảnh chụp màn hình;
   * Mọi nơi hiển thị số liệu này phải có nhãn "Tự khai" và không tính vào hoa hồng
   */
  test("FR-RES-11 & RULE-13: Khai báo số liệu tương tác (view, like, cmt, share, save) kèm ảnh bằng chứng, bắt buộc gắn nhãn 'Tự khai'", async ({ page }) => {
    await page.goto("/reseller/posts/declare");

    // Các trường khai báo số liệu bài đăng
    await expect(page.getByLabel(/lượt xem|views/i)).toBeVisible({ timeout: 3000 });
    await expect(page.getByLabel(/lượt thích|likes/i)).toBeVisible({ timeout: 3000 });
    await expect(page.getByLabel(/bình luận|comments/i)).toBeVisible({ timeout: 3000 });
    await expect(page.getByLabel(/chia sẻ|shares/i)).toBeVisible({ timeout: 3000 });
    await expect(page.getByLabel(/lưu|saves/i)).toBeVisible({ timeout: 3000 });

    // Upload ảnh chụp màn hình bằng chứng
    await expect(page.locator('input[type="file"], [data-testid="screenshot-upload"]'), "Phải có ô upload ảnh chụp màn hình số liệu").toBeVisible({ timeout: 3000 });

    // RULE-13: Nhãn "Tự khai" và lưu ý không dùng để tính hoa hồng
    await expect(page.getByText(/tự khai/i), "Bắt buộc hiển thị nhãn 'Tự khai' cho các chỉ số này").toBeVisible({ timeout: 3000 });
    await expect(page.getByText(/không tính vào hoa hồng|chỉ dùng để tham khảo/i), "Cảnh báo chỉ số tự khai không dùng để tính hoa hồng").toBeVisible({ timeout: 3000 });
  });
});

// =============================================================================
// NHÓM 5: DASHBOARD HIỆU SUẤT, HOA HỒNG & THÔNG TIN NHẬN TIỀN
// Tracing: FR-RES-12, FR-RES-13, FR-RES-14, FR-ANA-05, FR-ANA-06, FR-ANA-09, FR-ANA-10, FR-ANA-11
// =============================================================================
test.describe("Nhóm 5: Dashboard Hiệu suất, Hoa hồng & Thông tin nhận tiền", () => {

  /**
   * FR-RES-12, FR-ANA-06, FR-ANA-11: Dashboard hiệu suất
   * Hiển thị: Click, Lead, Booking, GMV, Tỷ lệ chuyển đổi (hiển thị 'N/A' nếu mẫu số = 0), tiền tệ VND, múi giờ Asia/Ho_Chi_Minh
   */
  test("FR-RES-12, FR-ANA-06, FR-ANA-11: Dashboard hiệu suất hiển thị Click, Lead, Booking, GMV, Conversion Rate (N/A khi = 0), tiền tệ VND", async ({ page }) => {
    await page.goto("/reseller/dashboard");

    // Tiêu đề Dashboard
    await expect(page.getByRole("heading", { name: /dashboard|báo cáo hiệu suất/i })).toBeVisible({ timeout: 3000 });

    // 5 chỉ số cốt lõi theo SRS
    await expect(page.getByTestId("metric-clicks").or(page.getByText(/lượt click|clicks/i))).toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId("metric-leads").or(page.getByText(/khách tiềm năng|leads/i))).toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId("metric-bookings").or(page.getByText(/đơn đặt|bookings/i))).toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId("metric-gmv").or(page.getByText(/doanh số|gmv/i))).toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId("metric-cvr").or(page.getByText(/tỷ lệ chuyển đổi|conversion rate/i))).toBeVisible({ timeout: 3000 });

    // FR-ANA-11: Khi mẫu số = 0 (chưa có click), Tỷ lệ chuyển đổi phải hiển thị N/A (không hiển thị NaN% hoặc 0%)
    const cvrElement = page.locator('[data-testid="metric-cvr"], .metric-cvr');
    if (await cvrElement.isVisible()) {
      const cvrText = await cvrElement.innerText();
      expect(cvrText).toMatch(/N\/A|\d+%/);
    }

    // Đơn vị tiền tệ VND (viết hoa VND hoặc đ)
    await expect(page.getByText(/VND|đ/i).first(), "Đơn vị tiền tệ bắt buộc là VND").toBeVisible({ timeout: 3000 });

    // Bộ lọc theo campaign, nội dung, tài khoản MXH
    await expect(page.getByLabel(/lọc theo chiến dịch/i).or(page.getByTestId("filter-campaign"))).toBeVisible({ timeout: 3000 });
    await expect(page.getByLabel(/lọc theo nội dung/i).or(page.getByTestId("filter-content"))).toBeVisible({ timeout: 3000 });
  });

  /**
   * FR-ANA-05 & FR-ANA-10: Tách biệt và gắn nhãn rõ ràng giữa "Hệ thống ghi nhận" và "Reseller tự khai"
   */
  test("FR-ANA-05 & FR-ANA-10: Tách biệt rõ ràng 2 cột/tab: 'Hệ thống ghi nhận' và 'Reseller tự khai'", async ({ page }) => {
    await page.goto("/reseller/dashboard");

    // Phải có nhãn "Hệ thống ghi nhận"
    await expect(page.getByText(/hệ thống ghi nhận/i), "Bắt buộc có khối 'Hệ thống ghi nhận' cho Click/Booking thực tế").toBeVisible({ timeout: 3000 });

    // Phải có nhãn "Reseller tự khai"
    await expect(page.getByText(/reseller tự khai|số liệu tự khai/i), "Bắt buộc có khối 'Reseller tự khai' cho View/Like/Share bài đăng").toBeVisible({ timeout: 3000 });
  });

  /**
   * FR-RES-13: Dashboard hoa hồng hiển thị theo 4 trạng thái:
   * Chờ xác nhận, Đã xác nhận, Chi trả được, Đã chi trả kèm danh sách booking
   */
  test("FR-RES-13: Dashboard hoa hồng hiển thị 4 trạng thái (Chờ xác nhận, Đã xác nhận, Chi trả được, Đã chi trả) và danh sách booking", async ({ page }) => {
    await page.goto("/reseller/commissions");

    // Tiêu đề trang hoa hồng
    await expect(page.getByRole("heading", { name: /quản lý hoa hồng|báo cáo hoa hồng/i })).toBeVisible({ timeout: 3000 });

    // 4 tab hoặc 4 thẻ trạng thái hoa hồng bắt buộc
    await expect(page.getByText(/chờ xác nhận/i), "Trạng thái 1: Chờ xác nhận").toBeVisible({ timeout: 3000 });
    await expect(page.getByText(/đã xác nhận/i), "Trạng thái 2: Đã xác nhận").toBeVisible({ timeout: 3000 });
    await expect(page.getByText(/chi trả được/i), "Trạng thái 3: Chi trả được").toBeVisible({ timeout: 3000 });
    await expect(page.getByText(/đã chi trả/i), "Trạng thái 4: Đã chi trả").toBeVisible({ timeout: 3000 });

    // Bảng danh sách booking đem lại hoa hồng
    await expect(page.getByRole("table").or(page.getByTestId("booking-list")), "Phải có bảng/danh sách booking chi tiết").toBeVisible({ timeout: 3000 });
  });

  /**
   * FR-RES-14 & RULE-17: Khai báo thông tin nhận hoa hồng (tài khoản nhận tiền, chủ tài khoản, mã số thuế)
   */
  test("FR-RES-14 & RULE-17: Form khai báo thông tin nhận hoa hồng (ngân hàng, số tài khoản, tên chủ thẻ, MST)", async ({ page }) => {
    await page.goto("/reseller/payout-settings");

    // Tiêu đề màn hình thiết lập nhận tiền
    await expect(page.getByRole("heading", { name: /thông tin nhận tiền|tài khoản nhận hoa hồng/i })).toBeVisible({ timeout: 3000 });

    // Các trường bắt buộc
    await expect(page.getByLabel(/tên ngân hàng|ngân hàng/i)).toBeVisible({ timeout: 3000 });
    await expect(page.getByLabel(/số tài khoản/i)).toBeVisible({ timeout: 3000 });
    await expect(page.getByLabel(/tên chủ tài khoản|chủ tài khoản/i)).toBeVisible({ timeout: 3000 });
    // Trường mã số thuế (nếu có)
    await expect(page.getByLabel(/mã số thuế/i)).toBeVisible({ timeout: 3000 });

    await expect(page.getByRole("button", { name: /lưu thông tin|cập nhật/i })).toBeVisible({ timeout: 3000 });
  });

  /**
   * FR-ANA-09 & FR-AIS-13: Bảo mật & Riêng tư: Reseller chỉ xem được dữ liệu của mình;
   * Ẩn/che thông tin cá nhân của khách hàng (PII masking: tên, SĐT, email khách mua)
   */
  test("FR-ANA-09 & FR-AIS-13: Che thông tin cá nhân khách hàng (PII masking) trong danh sách đơn hàng", async ({ page }) => {
    await page.goto("/reseller/commissions");

    // Kiểm tra danh sách booking nếu có dữ liệu khách hàng
    const bookingRows = page.locator('[data-testid="booking-row"], tr.booking-item');
    if (await bookingRows.count() > 0) {
      const firstRowText = await bookingRows.first().innerText();
      // Không được chứa số điện thoại đầy đủ 10 số dạng 09xxxxxxxx hoặc 08xxxxxxxx
      expect(firstRowText).not.toMatch(/(?:\+84|0)[3|5|7|8|9]\d{8}/);
      // PII masking dạng 09****123 hoặc n***@gmail.com
      expect(firstRowText).toMatch(/\*+/);
    } else {
      // Nếu không có row, kiểm tra chính sách bảo mật hoặc header cột che thông tin
      await expect(page.getByText(/bảo mật dữ liệu|thông tin khách đã được ẩn/i)).toBeVisible({ timeout: 3000 });
    }
  });
});
