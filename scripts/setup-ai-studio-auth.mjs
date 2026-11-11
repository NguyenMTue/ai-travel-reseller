import { chromium } from "playwright";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

const profileDir = path.join(os.homedir(), ".gemini", "ai-studio-profile");

async function setupAuth() {
  const isSwitch = process.argv.includes("--switch") || process.argv.includes("--reset");

  if (isSwitch && fs.existsSync(profileDir)) {
    const timestamp = Date.now();
    const backupDir = path.join(os.homedir(), ".gemini", `ai-studio-profile-backup-${timestamp}`);
    console.log("==================================================================");
    console.log("[CHUYEN DOI TAI KHOAN] Sao luu ho so Google AI Studio cu sang:");
    console.log(backupDir);
    console.log("==================================================================");
    try {
      fs.renameSync(profileDir, backupDir);
      console.log("[OK] Da lam moi thu muc ho so de dang nhap tai khoan moi.");
    } catch (err) {
      console.warn("[CANH BAO] Khong the doi ten (co the trinh duyet Chrome dang chay):", err.message);
    }
  }

  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }

  console.log("==================================================================");
  console.log(isSwitch ? "KHOI DONG DANG NHAP TAI KHOAN GOOGLE AI STUDIO MOI" : "KHOI DONG TRINH DUYET XAC THUC GOOGLE AI STUDIO (1 LAN DUY NHAT)");
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
  const initialUrl = isSwitch
    ? "https://accounts.google.com/ServiceLogin?continue=https://aistudio.google.com/prompts/new_chat"
    : "https://aistudio.google.com/prompts/new_chat";

  console.log(`\nDang mo ${initialUrl} ...`);
  await page.goto(initialUrl, { waitUntil: "domcontentloaded" });

  console.log("\n>>> Vui long dang nhap vao tai khoan Google moi cua ban tren cua so trinh duyet vua mo.");
  console.log(">>> He thong se tu dong phat hien khi ban dang nhap thanh cong va luu phien...");

  // Cho den khi URL khong con o trang welcome / signin (toi da 4 phut)
  const checkInterval = 2000;
  let loggedIn = false;

  for (let i = 0; i < 120; i++) {
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
    console.log("\n==================================================================");
    console.log("[THANH CONG] Da dang nhap vao Google AI Studio!");
    console.log("==================================================================");
    console.log(">>> [BUOC TIEP THEO: KET NOI GOOGLE DRIVE DE XUAT VIDEO]");
    console.log(">>> 1. Tren man hinh Google AI Studio vua mo, hay tim nut:");
    console.log("       'Connect to Google Drive' hoac bieu tuong Google Drive.");
    console.log(">>> 2. Bam vao de uy quyen Google Drive (Cho phep Google AI Studio luu file & xuat video).");
    console.log(">>> 3. Trinh duyet se DUOC GIU MO lien tuc de ban thoai mai thao tac.");
    console.log(">>> 4. Khi ban da ket noi Drive xong, chi can DONG CUA SO CHROME");
    console.log("       (hoac dong tab nay), he thong se tu dong ghi nho toan bo phien!");
    console.log("==================================================================\n");

    // Giữ trình duyệt mở cho đến khi người dùng tự tay đóng cửa sổ Chrome
    let isBrowserOpen = true;
    context.on("close", () => {
      isBrowserOpen = false;
    });

    while (isBrowserOpen && context.pages().length > 0) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  } else {
    console.log("\n[CANH BAO] Het thoi gian cho hoac ban chua hoan tat dang nhap.");
  }

  try {
    await context.close();
  } catch {}
  console.log("Da dong trinh duyet va luu toan bo phien Google Drive.");
}

setupAuth().catch(console.error);
