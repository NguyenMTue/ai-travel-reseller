import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".", testMatch: ["reseller-content-data.spec.ts", "reseller-content-query.spec.ts", "reseller-content-kit.spec.ts"],
  workers: 1, timeout: 120000, expect: { timeout: 20000 }, use: { baseURL: "http://127.0.0.1:3114", channel: "chrome" },
});
