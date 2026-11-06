/* Bump both versions whenever the public offline document or cache policy changes. */
const CACHE_NAME = "travellink-pwa-v2";
const STATIC_CACHE = "travellink-pwa-static-v2";
const STATIC_LIMIT = 32;
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
  // No skipWaiting(): updates activate after all old controlled tabs close.
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith("travellink-pwa-") && ![CACHE_NAME, STATIC_CACHE].includes(key)) {
        await caches.delete(key);
      }
    }
  })());
  // No clients.claim(): existing documents retain their worker version.
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (/^\/(?:r|api|auth)(?:\/|$)/.test(url.pathname)) return;
  if (request.headers.has("RSC") || request.headers.has("Next-Action") || url.searchParams.has("_rsc")) return;

  if (!url.search && ASSETS.includes(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match(url.pathname)) ?? fetch(request);
    })());
    return;
  }

  // Only content-hashed build CSS and our two existing font families.
  // Never cache JS, HTML/RSC, images from a portal, API or checkout responses.
  const font = /^\/_next\/static\/media\/(?:be-vietnam-pro|lora)-[a-z0-9-]+\.[a-f0-9]{8,}\.woff2$/.test(url.pathname);
  const css = /^\/_next\/static\/css\/[a-f0-9]{16,}\.css$/.test(url.pathname);
  if (!url.search && !request.headers.has("Authorization") && (font || css)) {
    event.respondWith((async () => {
      const cache = await caches.open(STATIC_CACHE);
      const cached = await cache.match(url.href);
      if (cached) return cached;
      // Build a public request without forwarding cookies, tokens or custom headers.
      const response = await fetch(new Request(url.href, { credentials: "omit", cache: "no-cache" }));
      const type = response.headers.get("content-type") ?? "";
      const policy = response.headers.get("cache-control") ?? "";
      if (response.ok && !response.redirected &&
          (font ? /^(?:font\/woff2|application\/font-woff2)/i.test(type) : /^text\/css/i.test(type)) &&
          /\bimmutable\b/i.test(policy) && !/\b(?:private|no-store)\b/i.test(policy)) {
        try {
          await cache.put(url.href, response.clone());
          const entries = await cache.keys();
          for (const entry of entries.slice(0, Math.max(0, entries.length - STATIC_LIMIT))) {
            await cache.delete(entry);
          }
        } catch { /* Storage quota/denial must not break the online page. */ }
      }
      return response;
    })());
    return;
  }

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