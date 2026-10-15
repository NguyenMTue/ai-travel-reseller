import { defineConfig } from "@playwright/test";
import base from "./playwright.reseller.config";

const port = Number(process.env.TRACKING_TEST_PORT || 3112);
const baseURL = `http://127.0.0.1:${port}`;
export default defineConfig({
  ...base,
  outputDir: process.env.TRACKING_TEST_OUTPUT || "./test-results/tracking",
  reporter: [["list"], ["json", { outputFile: process.env.TRACKING_TEST_REPORT || "test-results/tracking-report.json" }]],
  expect: { timeout: 20_000 },
  use: { ...base.use, baseURL },
  projects: [
    { name: "data", testMatch: "reseller-tracking-data.spec.ts" },
    ...base.projects!.filter(project => project.name !== "data").map(project => ({ ...project, testMatch: ["reseller-tracking.spec.ts", "reseller-content-kit.spec.ts"] })),
  ],
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
    url: baseURL, reuseExistingServer: false, timeout: 300_000,
    env: { NEXT_TELEMETRY_DISABLED: "1", NEXT_BUILD_DIR: "build/fe-w2-content-tests",
      NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "", NEXT_PUBLIC_SUPABASE_ANON_KEY: "" },
  },
});
