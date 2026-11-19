import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./",
  testMatch: "mobile-compatibility-w6.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:3100",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH,
          args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
        }
      : {},
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [
    {
      name: "mobile-compat",
      use: {
        viewport: { width: 390, height: 844 },
      },
    },
  ],
});
