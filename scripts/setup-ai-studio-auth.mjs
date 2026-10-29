import { chromium } from "playwright";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

const profileDir = path.join(os.homedir(), ".gemini", "ai-studio-profile");

async function setupAuth() {
  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }

  console.log("==================================================================");
  console.log("KHOI DONG TRINH DUYET XAC THUC GOOGLE AI STUDIO (1 LAN DUY NHAT)");
  console.log("Thu muc ho so luu tai:", profileDir);
  console.log("==================================================================");

  const context = await chromium.launchPersistentContext(profileDir, {
    channel: "chrome",
    headless: false,
    viewport: { width: 1280, height: 850 },
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
    ],
  });

  const page = context.pages()[0] || (await context.newPage());
  console.log("\nDang mo https://aistudio.google.com/ ...");
  await page.goto("https://aistudio.google.com/", { waitUntil: "domcontentloaded" });

  console.log("\n>>> Vui long dang nhap vao tai khoan Google cua ban tren cua so trinh duyet vua mo.");
  console.log(">>> He thong se tu dong phat hien khi ban dang nhap thanh cong va luu phien...");

  // Cho den khi URL khong con o trang welcome / signin
  const checkInterval = 2000;
  let loggedIn = false;

  for (let i = 0; i < 90; i++) {
    await new Promise((r) => setTimeout(r, checkInterval));
    const url = page.url();
    // Khi dang nhap xong, URL se vao https://aistudio.google.com/prompts/new_chat hoac /app
    if (
      !url.includes("welcome") &&
      !url.includes("accounts.google.com") &&
      !url.includes("signin") &&
      (url.includes("aistudio.google.com") || url.includes("prompts"))
    ) {
      loggedIn = true;
      break;
    }
  }

  if (loggedIn) {
    console.log("\n[THANH CONG] Ban da dang nhap thanh cong vao Google AI Studio!");
    console.log("Phien lam viec da duoc luu vinh vien tai:", profileDir);
    await new Promise((r) => setTimeout(r, 3000));
  } else {
    console.log("\n[CANH BAO] Het thoi gian cho hoac ban chua hoan tat dang nhap.");
  }

  await context.close();
  console.log("Da dong trinh duyet.");
}

setupAuth().catch(console.error);
