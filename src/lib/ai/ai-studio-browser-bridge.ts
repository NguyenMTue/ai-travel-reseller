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
      headless: false, // Để chế độ có giao diện (headed) giúp người dùng quan sát và tránh Google phát hiện bot
      viewport: { width: 1366, height: 900 },
      args: [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox",
        "--disable-infobars",
      ],
    });

    const page = context.pages()[0] || (await context.newPage());
    page.setDefaultTimeout(90000); // 90 giây tối đa

    console.log("[AI Studio Browser] Điều hướng đến Google AI Studio Chat...");
    await page.goto("https://aistudio.google.com/prompts/new_chat", {
      waitUntil: "domcontentloaded",
      timeout: 35000,
    });

    // 1. Kiểm tra xem có bị chuyển về trang đăng nhập không
    const currentUrl = page.url();
    if (currentUrl.includes("welcome") || currentUrl.includes("accounts.google.com")) {
      throw new Error(
        "Chưa đăng nhập Google AI Studio! Vui lòng chạy lệnh: npm run auth:ai-studio để đăng nhập 1 lần duy nhất."
      );
    }

    // Chờ giao diện chat sẵn sàng
    await page.waitForTimeout(3000);

    // 2. Tìm và chọn model gemini-omni-1.1-flash nếu có menu model
    try {
      const modelButton = page.locator('button:has-text("Gemini"), [aria-label*="model"], mat-select').first();
      if (await modelButton.isVisible({ timeout: 4000 })) {
        await modelButton.click();
        await page.waitForTimeout(800);
        const omniOption = page.locator('text="gemini-omni-1.1-flash", text="Gemini Omni 1.1 Flash", text="Omni"').first();
        if (await omniOption.isVisible({ timeout: 2000 })) {
          await omniOption.click();
          console.log("[AI Studio Browser] Đã chọn model gemini-omni-1.1-flash");
        }
      }
    } catch {
      console.log("[AI Studio Browser] Bỏ qua chọn model (sử dụng model mặc định hiện tại)");
    }

    // 3. Tải 2 bức ảnh lên ô nhập liệu
    console.log("[AI Studio Browser] Đang đính kèm 2 bức ảnh Hero theo đúng thứ tự (1: Start -> 2: End)...");
    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles([startImgPath, endImgPath]);
    } else {
      // Nếu nút upload là icon
      const uploadButton = page.locator('button[aria-label*="Upload"], button[aria-label*="file"], button[aria-label*="insert"]').first();
      if (await uploadButton.isVisible({ timeout: 3000 })) {
        const [fileChooser] = await Promise.all([
          page.waitForEvent("filechooser", { timeout: 5000 }),
          uploadButton.click(),
        ]);
        await fileChooser.setFiles([startImgPath, endImgPath]);
      }
    }

    await page.waitForTimeout(2500);

    // 4. Nhập prompt tạo video chuyển cảnh
    const promptText =
      input.prompt ||
      "Create a smooth, cinematic drone video transition seamlessly gliding from the first image to the second image in 6 seconds.";

    console.log("[AI Studio Browser] Đang nhập câu lệnh chuyển cảnh...");
    const textarea = page.locator('textarea, [contenteditable="true"], rich-textarea').first();
    await textarea.click();
    await textarea.fill(promptText);

    // 5. Bấm nút Run (hoặc bấm Control+Enter)
    console.log("[AI Studio Browser] Kích hoạt tạo video trên Google AI Studio...");
    await page.keyboard.press("Control+Enter");

    // 6. Theo dõi tiến trình render video hoặc phát hiện yêu cầu Paid Tier
    console.log("[AI Studio Browser] Đang theo dõi tiến trình Google AI Studio...");
    let videoBuffer: Buffer | null = null;
    const maxPollSeconds = 45;

    for (let sec = 0; sec < maxPollSeconds; sec += 3) {
      await page.waitForTimeout(3000);

      // Kiểm tra xem Google AI Studio có hiển thị cảnh báo bắt buộc trả phí không
      const pageText = await page.evaluate(() => document.body.innerText);
      if (
        pageText.includes("requires a paid API key") ||
        pageText.includes("This model requires a paid API key") ||
        pageText.includes("Please select an API key")
      ) {
        throw new Error(
          "Google AI Studio thông báo: Model gemini-omni-1.1-flash yêu cầu liên kết Paid Billing để sinh video."
        );
      }

      // Kiểm tra thẻ video kết quả
      const videoTag = page.locator("ms-chat-turn video, .response-container video, video").first();
      if ((await videoTag.count()) > 0) {
        const videoSrc = await videoTag.getAttribute("src");
        if (videoSrc && !videoSrc.includes("tutorial") && !videoSrc.includes("sample")) {
          console.log("[AI Studio Browser] Đã phát hiện video thành phẩm!");
          if (videoSrc.startsWith("blob:")) {
            const base64Data = await page.evaluate(async (src) => {
              const resp = await fetch(src);
              const blob = await resp.blob();
              return new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });
            }, videoSrc);

            const base64Content = base64Data.split(",")[1];
            videoBuffer = Buffer.from(base64Content, "base64");
            break;
          } else if (videoSrc.startsWith("data:")) {
            const base64Content = videoSrc.split(",")[1];
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
      durationSeconds: input.durationSeconds || 6,
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
