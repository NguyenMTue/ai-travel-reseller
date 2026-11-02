import { defineConfig } from "@playwright/test";
import { resolve } from "node:path";
import base from "../playwright.config";

// Connect to a separately started production server; never stop preview 3114.
// Avoid the npm/next process tree teardown that hung on Windows previously.
export default defineConfig({
  ...base,
  testDir: ".",
  webServer: undefined,
  outputDir: "../build/fe-w4-audit-20261029/frontend-results",
  use: { ...base.use, baseURL: "http://127.0.0.1:3115", channel: "chrome", launchOptions: undefined },
  reporter: [["list"], ["json", { outputFile: resolve("build/fe-w4-audit-20261029/frontend-report.json") }]],
});
