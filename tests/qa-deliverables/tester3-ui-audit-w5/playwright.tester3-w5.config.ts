import { defineConfig } from "@playwright/test";
import path from "node:path";

const port = Number(process.env.TESTER3_AUDIT_PORT || 3195);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: path.resolve(__dirname, "../../"),
  testMatch: "**/independent-faq-offline-banner-w5.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: {
    baseURL,
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH,
          args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
        }
      : {},
  },
  projects: [
    {
      name: "desktop",
      use: {
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: "mobile",
      use: {
        viewport: { width: 390, height: 844 },
      },
    },
  ],
});
