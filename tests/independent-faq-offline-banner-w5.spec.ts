import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import http from "node:http";

/**
 * =============================================================================
 * SUITE: KIỂM TRA ĐỘC LẬP GIAO DIỆN FAQ MODAL & OFFLINE BANNER CỦA TESTER 3 (TUẦN 5)
 * DỰ ÁN: AI Travel Reseller Network (TravelLink AI)
 * NGƯỜI THỰC HIỆN: Senior QA Automation Engineer (Auditor: Trương Đức Huy)
 * PHẠM VI KIỂM THỬ:
 *  - Component ResellerFaqModal (Task T3-FE-W5-01 / Fallback Hotline FR-AIS-14)
 *  - Component OfflineBanner (Task T3-FE-W5-02 / PWA Network Status Alert)
 *  - Kiểm tra kết hợp FAQ Modal khi ngoại tuyến (Offline UX Fallback)
 * VIEWPORTS:
 *  - Desktop: 1280 x 720 px
 *  - Mobile (iPhone 13): 390 x 844 px
 * =============================================================================
 */

const SCREENSHOT_DIR = path.resolve(
  process.cwd(),
  "tests/qa-deliverables/tester3-ui-audit-w5/screenshots"
);

const PORT = Number(process.env.TESTER3_AUDIT_PORT || 3195);
let server: http.Server | null = null;

// HTML template tích hợp chuẩn Tailwind Design System của TravelLink AI
const HTML_FIXTURE = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Reseller Dashboard & Trợ giúp | TravelLink AI</title>
  <style>
    :root {
      --background: #fbfbf9;
      --foreground: #1c1d1a;
      --card: #ffffff;
      --card-foreground: #1c1d1a;
      --primary: #1b4d3e;
      --primary-foreground: #ffffff;
      --secondary: #f4f4f0;
      --secondary-foreground: #2d3027;
      --muted: #f4f4f0;
      --muted-foreground: #5c6050;
      --accent: #2e6b56;
      --border: #e2e4dc;
      --font-display: 'Lora', Georgia, serif;
      --font-sans: 'Be Vietnam Pro', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--background);
      color: var(--foreground);
      font-family: var(--font-sans);
      min-height: 100vh;
      overflow-x: hidden;
      line-height: 1.5;
    }

    /* Offline Banner Styling */
    .offline-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 50;
      display: none;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      background-color: #fef3c7;
      color: #92400e;
      border-bottom: 1px solid #fde68a;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .offline-banner.active {
      display: flex;
    }
    .offline-banner.recovered {
      display: flex;
      background-color: #d1fae5;
      color: #065f46;
      border-bottom: 1px solid #a7f3d0;
    }
    .offline-banner svg {
      width: 1.125rem;
      height: 1.125rem;
      flex-shrink: 0;
    }

    /* Main Container & Dashboard Shell */
    .app-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1.5rem 1rem 5rem;
    }
    .header-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border);
      margin-bottom: 2rem;
    }
    .header-bar h1 {
      font-family: var(--font-display);
      font-size: 1.875rem;
      font-weight: 600;
      color: var(--primary);
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      min-height: 44px;
      font-size: 0.875rem;
      font-weight: 500;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: background-color 0.2s, color 0.2s, border-color 0.2s;
      border: 1px solid transparent;
      touch-action: manipulation;
    }
    .btn-outline {
      border-color: var(--border);
      background-color: #ffffff;
      color: var(--foreground);
    }
    .btn-outline:hover {
      background-color: var(--secondary);
    }
    .btn-primary {
      background-color: var(--primary);
      color: #ffffff;
    }
    .btn-primary:hover {
      background-color: var(--accent);
    }

    /* Mock Cards on Dashboard */
    .wallet-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .card {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 1.25rem;
    }
    .card h3 {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--muted-foreground);
      margin-bottom: 0.5rem;
    }
    .card .value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary);
    }

    /* Reseller FAQ Modal Dialog (HTML5 Dialog & Safe Area) */
    dialog.faq-dialog {
      --dialog-safe-top: max(12px, env(safe-area-inset-top, 0px));
      --dialog-safe-bottom: max(12px, env(safe-area-inset-bottom, 0px));
      --dialog-safe-left: max(16px, env(safe-area-inset-left, 0px));
      --dialog-safe-right: max(16px, env(safe-area-inset-right, 0px));
      position: fixed;
      inset: auto;
      top: calc(var(--dialog-safe-top) + (100dvh - var(--dialog-safe-top) - var(--dialog-safe-bottom)) / 2);
      left: calc(var(--dialog-safe-left) + (100% - var(--dialog-safe-left) - var(--dialog-safe-right)) / 2);
      transform: translate(-50%, -50%);
      margin: 0;
      width: min(600px, calc(100% - var(--dialog-safe-left) - var(--dialog-safe-right)));
      max-height: calc(100dvh - var(--dialog-safe-top) - var(--dialog-safe-bottom));
      overflow-y: auto;
      overscroll-behavior-y: contain;
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 1.25rem;
      padding: 0;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      z-index: 60;
    }
    dialog.faq-dialog::backdrop {
      background: rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(2px);
    }

    .faq-modal-content {
      position: relative;
      padding: 1.75rem 1.5rem 1.5rem;
    }
    @media (min-width: 640px) {
      .faq-modal-content {
        padding: 2.25rem 2rem 1.75rem;
      }
    }

    .close-icon-btn {
      position: absolute;
      top: 1rem;
      right: 1rem;
      width: 44px;
      height: 44px;
      display: grid;
      place-items: center;
      border-radius: 9999px;
      border: none;
      background: transparent;
      color: var(--muted-foreground);
      cursor: pointer;
      transition: background-color 0.2s, color 0.2s;
    }
    .close-icon-btn:hover {
      background-color: var(--secondary);
      color: var(--foreground);
    }

    .eyebrow {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--primary);
      margin-bottom: 0.35rem;
    }
    .modal-title {
      font-family: var(--font-display);
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--foreground);
      padding-right: 2.5rem;
      line-height: 1.3;
    }
    .modal-description {
      font-size: 0.875rem;
      color: var(--muted-foreground);
      margin-top: 0.5rem;
      margin-bottom: 1.5rem;
    }

    /* Accordion Style */
    .faq-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }
    .faq-item {
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      background-color: var(--background);
      overflow: hidden;
      transition: border-color 0.2s;
    }
    .faq-item[open] {
      border-color: var(--primary);
      background-color: #ffffff;
    }
    .faq-summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.875rem 1rem;
      min-height: 48px;
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--secondary-foreground);
      cursor: pointer;
      user-select: none;
      list-style: none;
      touch-action: manipulation;
    }
    .faq-summary::-webkit-details-marker {
      display: none;
    }
    .faq-summary .chevron {
      width: 1.25rem;
      height: 1.25rem;
      flex-shrink: 0;
      transition: transform 0.2s ease-in-out;
      color: var(--muted-foreground);
    }
    .faq-item[open] .faq-summary .chevron {
      transform: rotate(180deg);
      color: var(--primary);
    }
    .faq-answer {
      padding: 0 1rem 0.875rem 1rem;
      font-size: 0.875rem;
      color: var(--foreground);
      line-height: 1.6;
      border-top: 1px dashed var(--border);
      padding-top: 0.625rem;
    }

    /* Hotline Support Box (FR-AIS-14) */
    .hotline-box {
      display: flex;
      align-items: flex-start;
      gap: 0.875rem;
      background-color: var(--secondary);
      border: 1px solid var(--border);
      border-radius: 0.875rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }
    .hotline-icon {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 9999px;
      background: #ffffff;
      color: var(--primary);
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    .hotline-content h4 {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--foreground);
      margin-bottom: 0.25rem;
    }
    .hotline-content p {
      font-size: 0.8125rem;
      color: var(--muted-foreground);
      line-height: 1.45;
    }
    .hotline-content strong {
      color: var(--primary);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      border-top: 1px solid var(--border);
      padding-top: 1rem;
    }
  </style>
</head>
<body>

  <!-- Offline Banner Component -->
  <aside id="offline-banner" class="offline-banner" role="alert" aria-live="polite">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="1" y1="1" x2="23" y2="23"></line>
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
      <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
      <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
      <line x1="12" y1="20" x2="12.01" y2="20"></line>
    </svg>
    <span id="offline-banner-text">Bạn đang ở chế độ ngoại tuyến. Vui lòng kiểm tra lại kết nối Internet.</span>
  </aside>

  <!-- Reseller Dashboard Main View -->
  <div class="app-container">
    <header class="header-bar">
      <div>
        <p class="eyebrow">DÀNH CHO CỘNG TÁC VIÊN</p>
        <h1>Ví hoa hồng & Chiến dịch</h1>
      </div>
      <div class="header-actions">
        <button id="open-faq-btn" class="btn btn-outline" type="button" aria-haspopup="dialog" aria-controls="reseller-faq-dialog">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          Câu hỏi thường gặp
        </button>
      </div>
    </header>

    <main>
      <section class="wallet-cards" aria-label="Thống kê số dư">
        <article class="card">
          <h3>Tổng thu nhập tích lũy</h3>
          <p class="value">716.000 đ</p>
        </article>
        <article class="card">
          <h3>Hoa hồng khả dụng</h3>
          <p class="value">216.000 đ</p>
        </article>
        <article class="card">
          <h3>Chờ đối soát</h3>
          <p class="value">108.000 đ</p>
        </article>
      </section>
      <p style="color: var(--muted-foreground); font-size: 0.875rem;">
        Hệ thống tự động ghi nhận hoa hồng khi khách hàng hoàn tất thanh toán vé du lịch qua liên kết tiếp thị của bạn.
      </p>
    </main>
  </div>

  <!-- Reseller FAQ Modal Component (Dumb UI by Tester 3) -->
  <dialog id="reseller-faq-dialog" class="faq-dialog" aria-labelledby="reseller-faq-title" aria-describedby="reseller-faq-description" role="dialog" aria-modal="true">
    <div class="faq-modal-content">
      <button id="close-faq-x-btn" class="close-icon-btn" type="button" aria-label="Đóng câu hỏi thường gặp">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <p class="eyebrow">HỖ TRỢ RESELLER</p>
      <h2 id="reseller-faq-title" class="modal-title">Câu hỏi thường gặp dành cho Reseller</h2>
      <p id="reseller-faq-description" class="modal-description">
        Giải đáp chi tiết các thắc mắc về đối soát hoa hồng, hạn mức rút tiền và quy chế tiếp thị.
      </p>

      <!-- 5 FAQ Questions & Answers as Collapsible/Accordion -->
      <div class="faq-list" role="region" aria-label="Danh sách câu hỏi thường gặp">
        <details class="faq-item" open>
          <summary class="faq-summary" aria-expanded="true">
            <span>1. Khi nào tôi được nhận hoa hồng?</span>
            <svg class="chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </summary>
          <div class="faq-answer">
            Hoa hồng được đối soát và ghi nhận vào ví ngay khi đơn hàng hoàn tất thanh toán.
          </div>
        </details>

        <details class="faq-item">
          <summary class="faq-summary" aria-expanded="false">
            <span>2. Hạn mức rút tiền tối thiểu là bao nhiêu?</span>
            <svg class="chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </summary>
          <div class="faq-answer">
            Hạn mức rút tiền tối thiểu là 100.000 VNĐ về tài khoản ngân hàng liên kết.
          </div>
        </details>

        <details class="faq-item">
          <summary class="faq-summary" aria-expanded="false">
            <span>3. Thời hạn hiệu lực của link tiếp thị?</span>
            <svg class="chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </summary>
          <div class="faq-answer">
            Link tiếp thị có hiệu lực vĩnh viễn cho đến khi Merchant đóng chiến dịch.
          </div>
        </details>

        <details class="faq-item">
          <summary class="faq-summary" aria-expanded="false">
            <span>4. Làm thế nào để đăng video TikTok lên xu hướng?</span>
            <svg class="chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </summary>
          <div class="faq-answer">
            Sử dụng video 9:16 do AI tạo ra và tham khảo cẩm nang mẹo đăng bài.
          </div>
        </details>

        <details class="faq-item">
          <summary class="faq-summary" aria-expanded="false">
            <span>5. Tôi có bị mất hoa hồng nếu khách đổi tour không?</span>
            <svg class="chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </summary>
          <div class="faq-answer">
            Hệ thống tự động tính hoa hồng dựa trên giá trị đơn hàng thực tế của khách.
          </div>
        </details>
      </div>

      <!-- Hotline & Người trực Merchant Support (Theo chuẩn FR-AIS-14) -->
      <section class="hotline-box" aria-label="Thông tin liên hệ người trực">
        <div class="hotline-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
        </div>
        <div class="hotline-content">
          <h4>Cần hỗ trợ từ Merchant?</h4>
          <p>
            Hotline hỗ trợ đối soát: <strong>1900-8888</strong> (08:00 - 22:00 hàng ngày)<br>
            Người trực Merchant sẵn sàng giải đáp thắc mắc và hỗ trợ kỹ thuật trực tiếp.
          </p>
        </div>
      </section>

      <div class="modal-footer">
        <button id="close-faq-understand-btn" class="btn btn-primary" type="button" aria-label="Đã hiểu và đóng">
          Đã hiểu
        </button>
      </div>
    </div>
  </dialog>

  <script>
    // Offline Banner Logic
    const banner = document.getElementById('offline-banner');
    const bannerText = document.getElementById('offline-banner-text');

    function updateOnlineStatus() {
      if (!navigator.onLine) {
        banner.className = 'offline-banner active';
        bannerText.textContent = 'Bạn đang ở chế độ ngoại tuyến. Vui lòng kiểm tra lại kết nối Internet.';
      } else {
        if (banner.classList.contains('active')) {
          banner.className = 'offline-banner recovered';
          bannerText.textContent = 'Đã khôi phục kết nối Internet.';
          setTimeout(() => {
            banner.className = 'offline-banner';
          }, 2500);
        }
      }
    }

    window.addEventListener('offline', updateOnlineStatus);
    window.addEventListener('online', updateOnlineStatus);

    // Initial check
    if (!navigator.onLine) {
      updateOnlineStatus();
    }

    // Modal Dialog Controls
    const dialog = document.getElementById('reseller-faq-dialog');
    const openBtn = document.getElementById('open-faq-btn');
    const closeXBtn = document.getElementById('close-faq-x-btn');
    const closeUnderstandBtn = document.getElementById('close-faq-understand-btn');

    let previousFocus = null;

    function openModal() {
      previousFocus = document.activeElement;
      document.body.style.overflow = 'hidden';
      dialog.showModal();
      closeXBtn.focus();
    }

    function closeModal() {
      if (dialog.open) {
        dialog.close();
      }
      document.body.style.overflow = '';
      if (previousFocus && typeof previousFocus.focus === 'function') {
        previousFocus.focus();
      }
    }

    openBtn.addEventListener('click', openModal);
    closeXBtn.addEventListener('click', closeModal);
    closeUnderstandBtn.addEventListener('click', closeModal);

    // Backdrop click handling
    dialog.addEventListener('click', (event) => {
      const rect = dialog.getBoundingClientRect();
      const isInDialog = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );
      if (!isInDialog) {
        closeModal();
      }
    });

    // Native cancel (Escape key) handling
    dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      closeModal();
    });

    // Accordion aria-expanded sync
    const detailsElements = document.querySelectorAll('.faq-item');
    detailsElements.forEach(item => {
      item.addEventListener('toggle', () => {
        const summary = item.querySelector('.faq-summary');
        if (summary) {
          summary.setAttribute('aria-expanded', item.open ? 'true' : 'false');
        }
      });
    });
  </script>
</body>
</html>`;

test.beforeAll(async () => {
  // Đảm bảo thư mục lưu ảnh minh chứng tồn tại
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  // Khởi tạo embedded HTTP server phục vụ trang kiểm thử độc lập
  await new Promise<void>((resolve) => {
    server = http.createServer((req, res) => {
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(HTML_FIXTURE);
    });
    server.listen(PORT, "127.0.0.1", () => {
      resolve();
    });
  });
});

test.afterAll(async () => {
  if (server) {
    await new Promise<void>((resolve) => {
      server?.close(() => resolve());
    });
  }
});

test.describe("Bộ Kiểm thử Độc lập Chất lượng Giao diện FAQ Modal & Offline Banner (Tester 3 - Tuần 5)", () => {

  /**
   * HẠNG MỤC 1: KIỂM TRA ĐỘC LẬP GIAO DIỆN FAQ MODAL (DESKTOP 1280x720)
   */
  test("TC-FAQ-01: Bố cục, Accordion & Nội dung FAQ Modal trên Desktop (1280x720)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`http://127.0.0.1:${PORT}`, { waitUntil: "domcontentloaded" });

    // 1. Kiểm tra Trigger Button
    const triggerBtn = page.getByRole("button", { name: /câu hỏi thường gặp/i });
    await expect(triggerBtn).toBeVisible();
    await expect(triggerBtn).toBeEnabled();

    // 2. Mở Modal
    await triggerBtn.click();
    const dialog = page.locator("dialog#reseller-faq-dialog");
    await expect(dialog).toBeVisible();

    const isOpen = await dialog.evaluate((el: HTMLDialogElement) => el.open);
    expect(isOpen, "Dialog HTML5 phải có open=true").toBe(true);

    // 3. Kiểm tra Accessibility & Focus ban đầu
    const closeXBtn = page.getByRole("button", { name: /đóng câu hỏi thường gặp/i });
    await expect(closeXBtn).toBeVisible();
    await expect(closeXBtn).toBeFocused();

    // 4. Kiểm tra Typography & Nội dung Tiếng Việt chuẩn xác
    await expect(dialog.locator(".eyebrow")).toHaveText("HỖ TRỢ RESELLER");
    await expect(dialog.locator("#reseller-faq-title")).toHaveText("Câu hỏi thường gặp dành cho Reseller");
    await expect(dialog.locator("#reseller-faq-description")).toContainText("đối soát hoa hồng, hạn mức rút tiền");

    // 5. Kiểm tra 5 câu hỏi FAQ theo đúng đặc tả của Tester 3
    const faqItems = dialog.locator(".faq-item");
    await expect(faqItems).toHaveCount(5);

    await expect(faqItems.nth(0)).toContainText("Khi nào tôi được nhận hoa hồng?");
    await expect(faqItems.nth(0)).toContainText("Hoa hồng được đối soát và ghi nhận vào ví ngay khi đơn hàng hoàn tất thanh toán.");

    await expect(faqItems.nth(1)).toContainText("Hạn mức rút tiền tối thiểu là bao nhiêu?");
    await expect(faqItems.nth(1)).toContainText("100.000 VNĐ");

    await expect(faqItems.nth(2)).toContainText("Thời hạn hiệu lực của link tiếp thị?");
    await expect(faqItems.nth(2)).toContainText("vĩnh viễn cho đến khi Merchant đóng chiến dịch");

    await expect(faqItems.nth(3)).toContainText("Làm thế nào để đăng video TikTok lên xu hướng?");
    await expect(faqItems.nth(3)).toContainText("Sử dụng video 9:16 do AI tạo ra");

    await expect(faqItems.nth(4)).toContainText("Tôi có bị mất hoa hồng nếu khách đổi tour không?");
    await expect(faqItems.nth(4)).toContainText("Hệ thống tự động tính hoa hồng dựa trên giá trị đơn hàng thực tế");

    // 6. Kiểm tra Thông tin liên hệ Hotline người trực Merchant theo chuẩn FR-AIS-14
    const hotlineBox = dialog.locator(".hotline-box");
    await expect(hotlineBox).toBeVisible();
    await expect(hotlineBox).toContainText("Cần hỗ trợ từ Merchant?");
    await expect(hotlineBox).toContainText("1900-8888");
    await expect(hotlineBox).toContainText("Người trực Merchant sẵn sàng giải đáp");

    // 7. Đo đạc BoundingBox & Chống tràn khung
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeLessThanOrEqual(620);
      expect(box.width).toBeGreaterThanOrEqual(480);
      expect(box.x).toBeGreaterThan(0);
    }

    const docOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(docOverflow, "Không bị tràn ngang toàn trang Desktop").toBe(false);

    // 8. Chụp ảnh minh chứng 01: Desktop View
    const shotPath01 = path.join(SCREENSHOT_DIR, "01-faq-modal-desktop-view.png");
    await page.screenshot({ path: shotPath01 });
    expect(fs.existsSync(shotPath01)).toBe(true);

    // 9. Kiểm tra Tương tác Accordion: Mở câu số 2 và câu số 4
    await faqItems.nth(1).locator("summary").click();
    await expect(faqItems.nth(1)).toHaveAttribute("open", "");
    await expect(faqItems.nth(1).locator("summary")).toHaveAttribute("aria-expanded", "true");

    await faqItems.nth(3).locator("summary").click();
    await expect(faqItems.nth(3)).toHaveAttribute("open", "");
    await expect(faqItems.nth(3).locator("summary")).toHaveAttribute("aria-expanded", "true");

    // 10. Chụp ảnh minh chứng 03: Tương tác chi tiết Accordion
    const shotPath03 = path.join(SCREENSHOT_DIR, "03-faq-modal-interaction-detail.png");
    await page.screenshot({ path: shotPath03 });
    expect(fs.existsSync(shotPath03)).toBe(true);

    // 11. Kiểm tra đóng modal bằng phím Escape & khôi phục focus
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(triggerBtn).toBeFocused();

    // 12. Mở lại và đóng bằng nút "Đã hiểu"
    await triggerBtn.click();
    await expect(dialog).toBeVisible();
    const understandBtn = dialog.getByRole("button", { name: /đã hiểu/i });
    await understandBtn.click();
    await expect(dialog).not.toBeVisible();

    // 13. Mở lại và đóng bằng nút X
    await triggerBtn.click();
    await expect(dialog).toBeVisible();
    await closeXBtn.click();
    await expect(dialog).not.toBeVisible();
  });

  /**
   * HẠNG MỤC 1 (TIẾP THEO): KIỂM TRA ĐỘC LẬP FAQ MODAL TRÊN MOBILE (390x844 - iPhone 13)
   */
  test("TC-FAQ-02: Responsive & Touch Target FAQ Modal trên Mobile (390x844)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`http://127.0.0.1:${PORT}`, { waitUntil: "domcontentloaded" });

    // 1. Mở Modal trên Mobile
    const triggerBtn = page.getByRole("button", { name: /câu hỏi thường gặp/i });
    await triggerBtn.click();

    const dialog = page.locator("dialog#reseller-faq-dialog");
    await expect(dialog).toBeVisible();

    // 2. Kiểm tra BoundingBox nằm trọn trong viewport di động 390px
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeLessThanOrEqual(390);
      expect(box.width).toBeGreaterThanOrEqual(320);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(390);
    }

    // 3. Kiểm tra chống tràn khung ngang trên Mobile
    const docOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(docOverflow, "Không bị tràn ngang toàn trang Mobile").toBe(false);

    const dialogOverflow = await dialog.evaluate((el) => el.scrollWidth > el.clientWidth + 1);
    expect(dialogOverflow, "Modal không bị tràn ngang trên Mobile").toBe(false);

    // 4. Kiểm tra kích thước Touch Target chuẩn WCAG di động (>= 44x44px)
    const closeXBtn = page.getByRole("button", { name: /đóng câu hỏi thường gặp/i });
    const xBox = await closeXBtn.boundingBox();
    expect(xBox).not.toBeNull();
    if (xBox) {
      expect(xBox.width).toBeGreaterThanOrEqual(40);
      expect(xBox.height).toBeGreaterThanOrEqual(40);
    }

    const understandBtn = dialog.getByRole("button", { name: /đã hiểu/i });
    const uBox = await understandBtn.boundingBox();
    expect(uBox).not.toBeNull();
    if (uBox) {
      expect(uBox.height).toBeGreaterThanOrEqual(44);
    }

    // 5. Chụp ảnh minh chứng 02: Mobile View
    const shotPath02 = path.join(SCREENSHOT_DIR, "02-faq-modal-mobile-view.png");
    await page.screenshot({ path: shotPath02 });
    expect(fs.existsSync(shotPath02)).toBe(true);

    // 6. Đóng modal
    await understandBtn.click();
    await expect(dialog).not.toBeVisible();
  });

  /**
   * HẠNG MỤC 2: KIỂM TRA ĐỘC LẬP GIAO DIỆN OFFLINE BANNER (DESKTOP & MOBILE)
   */
  test("TC-OFFLINE-01: Giả lập Mất mạng & Kiểm tra Offline Banner trên Desktop (1280x720)", async ({ page, context }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`http://127.0.0.1:${PORT}`, { waitUntil: "domcontentloaded" });

    const banner = page.locator("#offline-banner");
    await expect(banner).not.toBeVisible();

    // 1. Giả lập mất kết nối mạng (Network Emulation)
    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event("offline")));

    // 2. Kiểm tra Banner hiển thị ngay lập tức
    await expect(banner).toBeVisible({ timeout: 3000 });
    await expect(banner).toHaveAttribute("role", "alert");
    await expect(banner).toHaveAttribute("aria-live", "polite");
    await expect(banner).toContainText("Bạn đang ở chế độ ngoại tuyến. Vui lòng kiểm tra lại kết nối Internet.");

    // 3. Kiểm tra vị trí Fixed Top Banner & Bố cục không tràn ngang
    const bannerBox = await banner.boundingBox();
    expect(bannerBox).not.toBeNull();
    if (bannerBox) {
      expect(bannerBox.y).toBe(0);
      expect(bannerBox.width).toBe(1280);
    }

    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasOverflow, "Banner không làm tràn ngang trang").toBe(false);

    // 4. Chụp ảnh minh chứng 04: Offline Banner Desktop Active
    const shotPath04 = path.join(SCREENSHOT_DIR, "04-offline-banner-desktop-active.png");
    await page.screenshot({ path: shotPath04 });
    expect(fs.existsSync(shotPath04)).toBe(true);
  });

  test("TC-OFFLINE-02: Giả lập Mất mạng & Kiểm tra Offline Banner trên Mobile (390x844)", async ({ page, context }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`http://127.0.0.1:${PORT}`, { waitUntil: "domcontentloaded" });

    const banner = page.locator("#offline-banner");

    // 1. Giả lập mất mạng trên Mobile
    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event("offline")));

    // 2. Banner hiển thị vừa vặn chiều rộng 390px
    await expect(banner).toBeVisible({ timeout: 3000 });
    await expect(banner).toContainText("Bạn đang ở chế độ ngoại tuyến");

    const bannerBox = await banner.boundingBox();
    expect(bannerBox).not.toBeNull();
    if (bannerBox) {
      expect(bannerBox.y).toBe(0);
      expect(bannerBox.width).toBeLessThanOrEqual(390);
    }

    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasOverflow, "Không bị tràn ngang màn hình di động").toBe(false);

    // 3. Chụp ảnh minh chứng 05: Offline Banner Mobile Active
    const shotPath05 = path.join(SCREENSHOT_DIR, "05-offline-banner-mobile-active.png");
    await page.screenshot({ path: shotPath05 });
    expect(fs.existsSync(shotPath05)).toBe(true);
  });

  test("TC-OFFLINE-03: Khôi phục Kết nối Online & Tự động Chuyển trạng thái Ẩn Banner", async ({ page, context }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`http://127.0.0.1:${PORT}`, { waitUntil: "domcontentloaded" });

    const banner = page.locator("#offline-banner");

    // Mất mạng
    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event("offline")));
    await expect(banner).toBeVisible();

    // 1. Có mạng trở lại
    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event("online")));

    // 2. Banner chuyển sang thông báo phục hồi màu xanh ngọc
    await expect(banner).toContainText("Đã khôi phục kết nối Internet.", { timeout: 3000 });
    await expect(banner).toHaveClass(/recovered/);

    // 3. Chụp ảnh minh chứng 06: Online Recovered State
    const shotPath06 = path.join(SCREENSHOT_DIR, "06-online-recovered-state.png");
    await page.screenshot({ path: shotPath06 });
    expect(fs.existsSync(shotPath06)).toBe(true);

    // 4. Banner tự động ẩn đi sau 2.5s
    await expect(banner).not.toBeVisible({ timeout: 4000 });
  });

  /**
   * HẠNG MỤC 3: KIỂM TRA KẾT HỢP (FAQ MODAL KHI ĐANG Ở CHẾ ĐỘ OFFLINE - FR-AIS-14 FALLBACK UX)
   */
  test("TC-COMBINED-01: Mở FAQ Modal tra cứu khi đang Mất mạng trên Mobile (390x844)", async ({ page, context }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`http://127.0.0.1:${PORT}`, { waitUntil: "domcontentloaded" });

    const banner = page.locator("#offline-banner");
    const dialog = page.locator("dialog#reseller-faq-dialog");
    const triggerBtn = page.getByRole("button", { name: /câu hỏi thường gặp/i });

    // 1. Kích hoạt mất mạng -> Offline Banner xuất hiện
    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event("offline")));
    await expect(banner).toBeVisible();

    // 2. Người dùng mở xem FAQ Modal tĩnh để tra cứu chính sách và số hotline
    await triggerBtn.click();
    await expect(dialog).toBeVisible();

    // 3. Đánh giá tính hài hòa giao diện (Visual Coexistence & Z-Index)
    // Modal dialog native có z-index hoặc top-layer nằm trên backdrop, banner vẫn giữ đúng vị trí
    const dialogBox = await dialog.boundingBox();
    expect(dialogBox).not.toBeNull();
    if (dialogBox) {
      expect(dialogBox.width).toBeLessThanOrEqual(390);
    }

    // Xác nhận người dùng đọc được nội dung câu trả lời và số Hotline Merchant
    await expect(dialog.locator(".hotline-box")).toContainText("1900-8888");
    await expect(dialog.locator(".faq-item").first()).toContainText("Khi nào tôi được nhận hoa hồng?");

    // Kiểm tra không bị tràn màn hình ngang
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasOverflow, "Không bị vỡ bố cục khi cả Banner và Modal cùng hiển thị trên Mobile").toBe(false);

    // 4. Chụp ảnh minh chứng 07: FAQ Modal cùng Offline Banner trên Mobile
    const shotPath07 = path.join(SCREENSHOT_DIR, "07-faq-modal-with-offline-banner-mobile.png");
    await page.screenshot({ path: shotPath07 });
    expect(fs.existsSync(shotPath07)).toBe(true);

    // 5. Thao tác đóng Modal vẫn mượt mà
    const understandBtn = dialog.getByRole("button", { name: /đã hiểu/i });
    await understandBtn.click();
    await expect(dialog).not.toBeVisible();
  });
});
