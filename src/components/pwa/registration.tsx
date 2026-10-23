"use client";

import { useEffect } from "react";

export function PwaRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      // Only remove this application's worker/cache, never unrelated registrations.
      void navigator.serviceWorker.getRegistrations().then(async (registrations) => {
        for (const registration of registrations) {
          const worker = registration.active ?? registration.waiting ?? registration.installing;
          if (worker && new URL(worker.scriptURL).pathname === "/sw.js") {
            await registration.unregister();
          }
        }
        for (const key of await caches.keys()) {
          if (key.startsWith("travellink-pwa-")) await caches.delete(key);
        }
      }).catch(() => { /* Development remains usable if storage is unavailable. */ });
      return;
    }

    // No forced activation/reload: updates wait until all old controlled tabs close.
    void navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    }).then((registration) => registration.update()).catch((error: unknown) => {
      console.warn("TravelLink AI: không thể cập nhật chế độ offline.", error);
    });
  }, []);

  return null;
}
