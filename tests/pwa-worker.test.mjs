import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
function worker(network = async () => new Response("online")) {
  const handlers = {};
  const deleted = [];
  const stored = [];
  const cache = {
    addAll: async (requests) => stored.push(...requests),
    match: async (key) => new Response(key === "/pwa/offline.html" ? "offline" : "icon"),
  };
  vm.runInNewContext(source, {
    self: { location: { origin: "https://local.test" }, addEventListener: (name, handler) => { handlers[name] = handler; } },
    caches: { open: async () => cache, keys: async () => ["travellink-pwa-v0", "travellink-pwa-v1", "other-app"], delete: async (key) => deleted.push(key) },
    URL, Request, Response, fetch: network,
  });
  return { handlers, deleted, stored };
}
function dispatch(handler, path, options = {}) {
  let response;
  const request = new Request(`https://local.test${path}`, options);
  handler({ request, respondWith: (value) => { response = value; } });
  return response;
}

test("install caches only explicit public assets without credentials; activation removes only old owned caches", async () => {
  const { handlers, stored, deleted } = worker();
  let work;
  handlers.install({ waitUntil: (promise) => { work = promise; } });
  await work;
  assert.equal(stored.length, 4);
  assert.ok(stored.every((r) => new URL(r.url).pathname.startsWith("/pwa/") && r.credentials === "omit"));
  handlers.activate({ waitUntil: (promise) => { work = promise; } });
  await work;
  assert.deepEqual(deleted, ["travellink-pwa-v0"]);
});

test("API, auth, tracking, RSC, Server Actions, and other assets bypass worker", () => {
  const { handlers } = worker();
  for (const path of ["/api/tracking", "/api/reseller/wallet", "/auth/callback", "/r/code", "/r/", "/_next/static/app.js", "/reseller?_rsc=abc", "/pwa/icon-192.png?v=2"]) {
    assert.equal(dispatch(handlers.fetch, path), undefined, path);
  }
  assert.equal(dispatch(handlers.fetch, "/reseller", { headers: { RSC: "1" } }), undefined);
  assert.equal(dispatch(handlers.fetch, "/reseller", { method: "POST", headers: { "Next-Action": "x" }, body: "x" }), undefined);
  let intercepted = false;
  handlers.fetch({ request: new Request("https://example.supabase.co/auth/v1/user"), respondWith: () => { intercepted = true; } });
  assert.equal(intercepted, false);
});

test("portal navigations use no-store and fall back to generic offline document, never account cache", async () => {
  let networkRequest;
  const { handlers, stored } = worker(async (request) => { networkRequest = request; throw new TypeError("offline"); });
  let response;
  // Request constructor cannot create navigate mode outside the browser.
  const request = new Request("https://local.test/reseller");
  Object.defineProperty(request, "mode", { value: "navigate" });
  handlers.fetch({ request, respondWith: (promise) => { response = promise; } });
  assert.equal(await (await response).text(), "offline");
  assert.equal(networkRequest.cache, "no-store");
  assert.deepEqual(stored, []);
});
