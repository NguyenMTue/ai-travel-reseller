// Production PWA entrypoint. Tracking bypass is verified in pwa-worker.test.mjs;
// the browser suite never opens /r/ or invokes a shared API.
await import("./pwa-production-browser.mjs");