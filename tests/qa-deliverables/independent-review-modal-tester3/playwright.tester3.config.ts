import { defineConfig } from "@playwright/test";
import path from "node:path";

const port = Number(process.env.TESTER3_MODAL_TEST_PORT || 3192);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: path.resolve(__dirname, "../../"),
  testMatch: "**/independent-modal-ui-tester3.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: {
    baseURL,
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH,
          args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
        }
      : {},
  },
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 180000,
    env: {
      NEXT_TELEMETRY_DISABLED: "1",
      NODE_ENV: "development",
    },
  },
  projects: [
    {
      name: "desktop",
      use: {
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: "mobile",
      use: {
        viewport: { width: 390, height: 844 },
      },
    },
  ],
});
