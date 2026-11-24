import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "commission-idempotency-audit.spec.ts",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://localhost:3100",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH,
          args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
        }
      : {},
  },
  webServer: {
    command: "npx next dev --hostname localhost --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: true,
  },
});
