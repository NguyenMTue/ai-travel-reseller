import { chromium, type BrowserContext, type Page } from "playwright";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";

export interface AIStudioVideoInput {
  startImageBuffer: Buffer;
  endImageBuffer: Buffer;
  prompt?: string;
  durationSeconds?: number;
}

export interface AIStudioVideoOutput {
  videoBuffer: Buffer;
  durationSeconds: number;
}

/**
 * Thư mục lưu Profile Chrome riêng biệt cho tự động hóa Google AI Studio
 * Tránh xung đột với trình duyệt Chrome cá nhân đang mở của người dùng.
 */
export const AI_STUDIO_PROFILE_DIR = path.join(
  os.homedir(),
  ".gemini",
  "ai-studio-profile"
);

/**
 * Kiểm tra xem người dùng đã từng đăng nhập Google trên Profile này chưa
 */
export async function isAIStudioProfileAuthenticated(): Promise<boolean> {
  const cookiesPath = path.join(AI_STUDIO_PROFILE_DIR, "Default", "Network", "Cookies");
  const alternateCookiesPath = path.join(AI_STUDIO_PROFILE_DIR, "Default", "Cookies");
  return existsSync(cookiesPath) || existsSync(alternateCookiesPath);
}

/**
 * Tự động hóa đẩy 2 ảnh lên Google AI Studio Web và lấy video thành phẩm về
 */
export async function generateVideoViaAIStudioBrowser(
  input: AIStudioVideoInput
): Promise<AIStudioVideoOutput> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ai-studio-upload-"));

  let context: BrowserContext | null = null;
  try {
    const startImgPath = path.join(tempDir, "1_start_hero_frame.jpg");
    const endImgPath = path.join(tempDir, "2_end_hero_frame.jpg");
    await fs.writeFile(startImgPath, input.startImageBuffer);
    await fs.writeFile(endImgPath, input.endImageBuffer);

    console.log("[AI Studio Browser] Khởi chạy Chrome kết nối Profile:", AI_STUDIO_PROFILE_DIR);

    context = await chromium.launchPersistentContext(AI_STUDIO_PROFILE_DIR, {
      channel: "chrome",
      headless: false, // Giữ giao diện để kiểm soát và tránh chặn tự động hóa
      viewport: { width: 1366, height: 900 },
      args: [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox",
        "--disable-infobars",
      ],
    });

    const page = context.pages()[0] || (await context.newPage());
    page.setDefaultTimeout(40000); // 40s tối đa cho mỗi thao tác

    console.log("[AI Studio Browser] Điều hướng đến Google AI Studio Chat...");
    await page.goto("https://aistudio.google.com/prompts/new_chat", {
      waitUntil: "domcontentloaded",
      timeout: 35000,
    });

    // 1. Kiểm tra trạng thái xác thực
    const currentUrl = page.url();
    if (currentUrl.includes("welcome") || currentUrl.includes("accounts.google.com")) {
      throw new Error(
        "Chưa đăng nhập Google AI Studio! Vui lòng chạy lệnh: npm run auth:ai-studio để đăng nhập 1 lần duy nhất."
      );
    }

    // Chờ giao diện chat sẵn sàng
    await page.waitForTimeout(3000);

    // 2. Tắt các thông báo, modal chào mừng hoặc overlay (nếu có)
    await page.keyboard.press("Escape").catch(() => {});
    try {
      const dismissButtons = page.locator('button:has-text("Got it"), button:has-text("Dismiss"), button:has-text("Close"), button[aria-label="Close"], button:has-text("Get started")');
      if (await dismissButtons.first().isVisible({ timeout: 1500 })) {
        await dismissButtons.first().click({ force: true });
        await page.waitForTimeout(400);
      }
    } catch {}

    // Lưu ý: Profile AI Studio đã được cấu hình mặc định là model gemini-omni-1.1-flash.
    // Tuyệt đối không click vào menu chọn model vì sẽ mở Angular CDK Backdrop che khuất toàn bộ giao diện!
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(300);

    // 3. Tải trực tiếp 2 bức ảnh vào thẻ input[type="file"]
    console.log("[AI Studio Browser] Đang đính kèm 2 bức ảnh vào ô chat (1: Start -> 2: End)...");
    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles([startImgPath, endImgPath]);
    } else {
      const uploadButton = page.locator('button[aria-label*="Upload"], button[aria-label*="file"], button[aria-label*="insert"], button:has-text("add_circle")').first();
      if (await uploadButton.isVisible({ timeout: 3000 })) {
        const [fileChooser] = await Promise.all([
          page.waitForEvent("filechooser", { timeout: 5000 }),
          uploadButton.click({ force: true }),
        ]);
        await fileChooser.setFiles([startImgPath, endImgPath]);
      }
    }

    // Chờ 3s để Google AI Studio tải và xử lý thumbnail của 2 ảnh
    await page.waitForTimeout(3000);

    // 4. Nhập prompt tạo video chuyển cảnh ngắn gọn, trực diện
    const promptText =
      input.prompt ||
      "Create a smooth cinematic drone camera movement flying seamlessly from Frame 1 into Frame 2 in 5 seconds. Smooth forward momentum, consistent 5600K daylight, preserve realistic landmark geometry.";

    console.log("[AI Studio Browser] Đang nhập câu lệnh chuyển cảnh...");
    const textarea = page.locator('textarea, [contenteditable="true"], rich-textarea').first();
    await textarea.waitFor({ state: "attached", timeout: 8000 });

    // Đảm bảo không còn backdrop nào trước khi focus
    await page.keyboard.press("Escape").catch(() => {});
    await textarea.click({ force: true, timeout: 4000 }).catch(() => {});
    await textarea.fill(promptText);

    await page.waitForTimeout(600);

    // 5. Bấm nút Run (hoặc phím Control+Enter)
    console.log("[AI Studio Browser] Kích hoạt tạo video trên Google AI Studio...");
    const runButton = page.locator('button[aria-label*="Run"], button:has-text("Run"), button[aria-label*="Send"]').first();
    if (await runButton.isVisible({ timeout: 2000 })) {
      await runButton.click({ force: true });
    } else {
      await page.keyboard.press("Control+Enter");
    }

    // 6. Theo dõi phân cảnh chat cuối cùng để phát hiện Video thành phẩm hoặc Lỗi Rate Limit
    console.log("[AI Studio Browser] Đang theo dõi tiến trình tạo video...");
    let videoBuffer: Buffer | null = null;
    const maxPollSeconds = 55;

    for (let sec = 0; sec < maxPollSeconds; sec += 3) {
      await page.waitForTimeout(3000);

      const turnStatus = await page.evaluate(() => {
        const turns = Array.from(document.querySelectorAll("ms-chat-turn"));
        const lastTurn = turns[turns.length - 1];
        if (!lastTurn) return { isDone: false, hasError: false, text: "" };

        const text = (lastTurn as HTMLElement).innerText || "";
        const hasRateLimit =
          text.includes("rate limit") ||
          text.includes("reached your rate limit") ||
          text.includes("Please try again later");
        const hasPaidRequired =
          text.includes("requires a paid API key") ||
          text.includes("select an API key");

        const hasDownload = text.includes("download") || text.includes("fullscreen") || text.includes("play_circle");
        const videoEl = lastTurn.querySelector("video");
        const videoSrc = videoEl && videoEl.src ? videoEl.src : null;

        return {
          isDone: Boolean(hasDownload || (videoSrc && !videoSrc.includes("tutorial"))),
          hasError: hasRateLimit || hasPaidRequired,
          errorReason: hasRateLimit ? "RATE_LIMIT" : hasPaidRequired ? "PAID_REQUIRED" : null,
          videoSrc,
          text: text.slice(0, 150),
        };
      });

      if (turnStatus.hasError) {
        if (turnStatus.errorReason === "RATE_LIMIT") {
          throw new Error("Google AI Studio đạt hạn mức tần suất (Rate limit). Vui lòng đợi 1 phút trước khi thử lại.");
        }
        if (turnStatus.errorReason === "PAID_REQUIRED") {
          throw new Error("Google AI Studio yêu cầu liên kết Paid Billing cho model này.");
        }
      }

      if (turnStatus.isDone) {
        console.log("[AI Studio Browser] Phát hiện video đã hoàn tất!");

        // Phương thức 1: Thử bắt sự kiện Download từ nút Download của AI Studio
        try {
          const downloadBtn = page.locator('ms-chat-turn:last-child button:has-text("download"), ms-chat-turn:last-child [aria-label*="download"], ms-chat-turn:last-child [aria-label*="Download"]').first();
          if (await downloadBtn.isVisible({ timeout: 2000 })) {
            const [download] = await Promise.all([
              page.waitForEvent("download", { timeout: 10000 }).catch(() => null),
              downloadBtn.click({ force: true }),
            ]);

            if (download) {
              const dlPath = path.join(tempDir, "ai_downloaded.mp4");
              await download.saveAs(dlPath);
              const downloadedData = await fs.readFile(dlPath);
              if (downloadedData.length > 5000) {
                videoBuffer = downloadedData;
                break;
              }
            }
          }
        } catch (dlErr: any) {
          console.warn("[AI Studio Browser] Nút download trực tiếp:", dlErr?.message);
        }

        // Phương thức 2: Trích xuất blob / src từ thẻ video
        if (!videoBuffer && turnStatus.videoSrc) {
          const src = turnStatus.videoSrc;
          if (src.startsWith("blob:") || src.startsWith("http://") || src.startsWith("https://")) {
            const base64Data = await page.evaluate(async (url) => {
              const resp = await fetch(url);
              const blob = await resp.blob();
              return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
            }, src);

            const base64Content = base64Data.split(",")[1];
            videoBuffer = Buffer.from(base64Content, "base64");
            break;
          }
        }
      }
    }

    if (!videoBuffer || videoBuffer.length < 5000) {
      throw new Error("Chưa nhận được video từ AI Studio hoặc đã hết thời gian chờ.");
    }

    console.log(`[AI Studio Browser] Tải về thành công! Kích thước: ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    return {
      videoBuffer,
      durationSeconds: input.durationSeconds || 5,
    };
  } finally {
    if (context) {
      try {
        await context.close();
      } catch {}
    }
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {}
  }
}
