import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.config";

const port = Number(process.env.MERCHANT_TEST_PORT || 3108);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  ...baseConfig,
  testMatch: "merchant-campaign-*.spec.ts",
  outputDir: "./test-results/merchant-campaigns",
  timeout: 60_000,
  reporter: [["list"], ["json", { outputFile: "test-results/merchant-campaigns-report.json" }]],
  use: { ...baseConfig.use, baseURL, reducedMotion: "reduce" },
  projects: [
    { name: "data", testMatch: "merchant-campaign-data.spec.ts" },
    ...baseConfig.projects!.map(project => ({ ...project, testMatch: "merchant-campaign-form.spec.ts" })),
  ],
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 300_000,
    env: {
      NEXT_TELEMETRY_DISABLED: "1",
      NEXT_BUILD_DIR: "build/fe-w2-content-tests",
      NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "", NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
    },
  },
});
