import { defineConfig } from "@playwright/test";

const port = 3117;
const baseURL = `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: "./tests", workers: 1, timeout: 60_000,
  expect: { timeout: 20_000 },
  outputDir: "test-results/portal-auth",
  reporter: [["list"], ["json", { outputFile: "test-results/portal-auth-report.json" }]],
  use: { baseURL, launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {} },
  projects: [{ name: "data", testMatch: "portal-auth-data.spec.ts" }, { name: "desktop", testMatch: "portal-auth.spec.ts", use: { viewport: { width: 1440, height: 1000 } } }],
  webServer: [
    { command: "node tests/fixtures/portal-auth-server.mjs", url: "http://127.0.0.1:3116/health", reuseExistingServer: false },
    { command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`, url: baseURL, reuseExistingServer: false, timeout: 300_000,
      env: { NEXT_BUILD_DIR: "build/fe-w2-content-tests", NEXT_TELEMETRY_DISABLED: "1",
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:3116", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "fixture-public-key", NEXT_PUBLIC_SUPABASE_ANON_KEY: "fixture-public-key" } },
  ],
});
