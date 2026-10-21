/* Bump this version whenever the offline document or allowlisted assets change. */
const CACHE_NAME = "travellink-pwa-v1";
const ASSETS = [
  "/pwa/offline.html",
  "/pwa/icon-192.png",
  "/pwa/icon-512.png",
  "/pwa/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(ASSETS.map((path) => new Request(new URL(path, self.location.origin), {
      cache: "reload", credentials: "omit",
    })));
  })());
  // Deliberately no skipWaiting(): activation follows normal all-tabs-closed lifecycle.
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith("travellink-pwa-") && key !== CACHE_NAME) {
        await caches.delete(key);
      }
    }
  })());
  // No clients.claim(): existing documents keep their original worker version.
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  // These requests must follow the browser's normal network path, including redirects.
  if (/^\/(?:r|api|auth)(?:\/|$)/.test(url.pathname)) return;
  if (request.headers.has("RSC") || request.headers.has("Next-Action") || url.searchParams.has("_rsc")) return;

  if (!url.search && ASSETS.includes(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match(url.pathname)) ?? fetch(request);
    })());
    return;
  }

  // Navigation is network-only. Never store HTML, sessions, or account data.
  if (request.mode === "navigate") {
    event.respondWith(fetch(new Request(request, { cache: "no-store" })).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match("/pwa/offline.html")) ?? new Response(
        "Bạn đang ngoại tuyến. Vui lòng kết nối mạng và thử lại.",
        { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } },
      );
    }));
  }
});
