import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.config";

const port = Number(process.env.LEGAL_TEST_PORT || 3107);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  ...baseConfig,
  testMatch: "legal-pages.spec.ts",
  outputDir: "./test-results/legal-pages",
  timeout: 60_000,
  reporter: [
    ["list"],
    ["json", { outputFile: "test-results/legal-pages-report.json" }],
  ],
  use: {
    ...baseConfig.use,
    baseURL,
    reducedMotion: "reduce",
  },
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    // Cold compilation on the shared Windows filesystem can exceed 3 minutes.
    timeout: 300_000,
    env: {
      NEXT_TELEMETRY_DISABLED: "1",
      NEXT_BUILD_DIR:
        process.env.LEGAL_TEST_BUILD_DIR || "build/fe-w2-content-tests",
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
    },
  },
});
