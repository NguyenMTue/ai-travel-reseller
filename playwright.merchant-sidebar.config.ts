import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests", testMatch: "merchant-sidebar.spec.ts", outputDir: "test-results/merchant-sidebar",
  workers: 1, fullyParallel: false, timeout: 150000,
  use: { baseURL: "http://127.0.0.1:3226", trace: "retain-on-failure", serviceWorkers: "block", navigationTimeout: 120000, actionTimeout: 30000, launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {} },
  projects: [1440,390,320].map(width => ({ name: String(width), use: { viewport: { width, height: width === 1440 ? 1000 : 844 } } })),
});
