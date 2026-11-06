import { defineConfig } from "@playwright/test";
import path from "node:path";

const port = Number(process.env.TEST_PORT || 3100);
const rawTargetUrl = process.env.PROD_URL || process.env.BASE_URL;
const isExternalProd = Boolean(rawTargetUrl && !rawTargetUrl.includes("127.0.0.1") && !rawTargetUrl.includes("localhost"));
const baseURL = rawTargetUrl || `http://127.0.0.1:${port}`;
const projectRoot = path.resolve(__dirname, "..");

export default defineConfig({
  testDir: path.resolve(__dirname),
  testMatch: "production-smoke.spec.ts",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: "off",
    screenshot: "off",
    video: "off",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH,
          args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
        }
      : {},
  },
  webServer: isExternalProd
    ? undefined
    : {
        command: `npx next dev --hostname 127.0.0.1 --port ${port}`,
        url: `http://127.0.0.1:${port}`,
        cwd: projectRoot,
        reuseExistingServer: false,
        timeout: 120_000,
        env: {
          NEXT_PUBLIC_SUPABASE_URL: "https://ykfosnwbgphlwpufnxrd.supabase.co",
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_7qR6TIKjUXsqdMxcdMCtsQ_fqPgywPV",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_7qR6TIKjUXsqdMxcdMCtsQ_fqPgywPV",
          SUPABASE_SERVICE_ROLE_KEY: "",
        },
      },
  reporter: [
    ["list"],
  ],
});
