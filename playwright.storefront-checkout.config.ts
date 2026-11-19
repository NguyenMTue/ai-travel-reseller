import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests", testMatch: "storefront-checkout.spec.ts", outputDir: "test-results/checkout-after",
  fullyParallel: false, workers: 1, timeout: 90000,
  use: { baseURL: "http://127.0.0.1:3216", serviceWorkers: "block", trace: "retain-on-failure", launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {} },
  projects: [320,390,768,1440].map(width => ({ name: String(width), use: { viewport: { width, height: width < 768 ? 844 : 1000 } } })),
});
