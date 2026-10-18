import { defineConfig } from "@playwright/test";

const port = Number(process.env.RESELLER_TEST_PORT || 3101);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests",
  testMatch: "reseller-*.spec.ts",
  outputDir: "./test-results/reseller",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL,
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : {},
  },
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      NEXT_TELEMETRY_DISABLED: "1",
      NEXT_BUILD_DIR: process.env.RESELLER_TEST_BUILD_DIR || "build/fe-w2-test",
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
    },
  },
  projects: [
    { name: "data", testMatch: ["reseller-data.spec.ts", "reseller-content-data.spec.ts", "reseller-content-query.spec.ts"] },
    {
      name: "desktop",
      testMatch: ["reseller-feed.spec.ts", "reseller-content-kit.spec.ts"],
      use: { viewport: { width: 1440, height: 1000 } },
    },
    {
      name: "mobile",
      testMatch: ["reseller-feed.spec.ts", "reseller-content-kit.spec.ts"],
      use: { viewport: { width: 390, height: 844 } },
    },
    {
      name: "small-mobile",
      testMatch: ["reseller-feed.spec.ts", "reseller-content-kit.spec.ts"],
      use: { viewport: { width: 320, height: 740 } },
    },
  ],
});
