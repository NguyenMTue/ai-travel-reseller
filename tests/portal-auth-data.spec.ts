import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { canHandlePortalAuthFailure, loadPortalAccess, resolveLoginDestination, type Portal, type PortalAccessSource } from "@/src/lib/portal-access";
import { createPortalAccessSource } from "@/src/lib/portal-access-source";

const id = "22222222-2222-2222-2222-111111111111";
const ok = (data: unknown) => ({ data, error: null });
function source(roles: Portal[], overrides: Partial<PortalAccessSource> = {}) {
  const calls: [Portal, string][] = [];
  const value: PortalAccessSource = {
    getUser: async () => ok({ id, email: "arbitrary@fixture.invalid", user_metadata: { role: "merchant" } }),
    getMembership: async (portal, userId) => { calls.push([portal, userId]); return ok(roles.includes(portal) ? { id } : null); },
    ...overrides,
  };
  return { value, calls };
}

test("default login destinations use authoritative membership, never email/metadata", async () => {
  for (const [roles, path] of [[['reseller'], '/reseller/campaigns'], [['merchant'], '/merchant'], [['merchant', 'reseller'], '/merchant']] as [Portal[], string][]) {
    const fixture = source(roles);
    expect(await resolveLoginDestination(fixture.value, undefined)).toEqual({ status: "redirect", path });
    expect(fixture.calls).toEqual([["merchant", id], ["reseller", id]]);
  }
  expect(await resolveLoginDestination(source([]).value, "/merchant")).toMatchObject({ status: "error", error: expect.stringContaining("chưa tìm thấy hồ sơ") });
});

test("next is honored only for a verified portal; invalid/external/encoded destinations use authorized default", async () => {
  expect(await resolveLoginDestination(source(["reseller"]).value, "/reseller/campaigns/44444444-4444-4444-4444-444444444444")).toMatchObject({ path: "/reseller/campaigns/44444444-4444-4444-4444-444444444444" });
  expect(await resolveLoginDestination(source(["merchant", "reseller"]).value, "/reseller/campaigns")).toMatchObject({ path: "/reseller/campaigns" });
  for (const next of [null, "", "/merchant", "/merchant/campaigns/new", "//evil.invalid", "https://evil.invalid", "/reseller/%2f%2fevil", "/reseller/../merchant", "/reseller\\evil", "/reseller\n", "/reseller?next=https://evil.invalid", "/admin", "/reseller-evil"]) {
    expect(await resolveLoginDestination(source(["reseller"]).value, next)).toEqual({ status: "redirect", path: "/reseller/campaigns" });
  }
  expect(await resolveLoginDestination(source(["merchant"]).value, "/reseller/campaigns")).toMatchObject({ path: "/merchant" });
});

test("invalid or expired session makes no membership query and differs from Auth outage", async () => {
  for (const reply of [ok(null), { data: null, error: { status: 401 }, status: 401 }, { data: null, error: { status: 403 }, status: 403 }]) {
    const fixture = source([], { getUser: async () => reply });
    expect(await loadPortalAccess(fixture.value, "merchant")).toEqual({ status: "unauthenticated" });
    expect(fixture.calls).toEqual([]);
  }
  expect(await loadPortalAccess(source([], { getUser: async () => ({ data: null, error: {}, status: 503 }) }).value, "merchant")).toEqual({ status: "unavailable", reason: "network" });
});

test("direct portal guard refuses wrong role, wrong/malformed row, and cannot turn errors into missing profiles", async () => {
  expect(await loadPortalAccess(source(["reseller"]).value, "merchant")).toEqual({ status: "forbidden" });
  expect(await loadPortalAccess(source(["merchant"]).value, "reseller")).toEqual({ status: "forbidden" });
  for (const data of [{ id: "bad" }, { id: "33333333-3333-3333-3333-333333333333" }, []]) {
    expect(await loadPortalAccess(source([], { getMembership: async () => ok(data) }).value, "merchant")).toEqual({ status: "unavailable", reason: "schema" });
  }
  for (const [code, status, reason] of [["42501", 403, "permission"], ["42703", 400, "schema"], ["08006", 503, "network"], ["PGRST100", 400, "query"]] as const) {
    const fixture = source([], { getMembership: async () => ({ data: { id }, error: { code, message: "private SQL" }, status }) });
    expect(await loadPortalAccess(fixture.value, "merchant")).toEqual({ status: "unavailable", reason });
    const result = await resolveLoginDestination(fixture.value, undefined);
    expect(result).toMatchObject({ status: "error", error: expect.stringContaining("chưa đọc được hồ sơ") });
    expect(JSON.stringify(result)).not.toContain("private SQL");
  }
});

test("a verified portal remains usable when another profile query fails; no failed query grants access", async () => {
  const fixture = source([], { getMembership: async portal => portal === "reseller" ? ok({ id }) : { data: null, error: { code: "42501" }, status: 403 } });
  expect(await resolveLoginDestination(fixture.value, "/merchant")).toMatchObject({ path: "/reseller/campaigns" });
  const expired = source([], { getMembership: async () => ({ data: null, error: { code: "PGRST301" }, status: 401 }) });
  expect(await resolveLoginDestination(expired.value, undefined)).toMatchObject({ status: "error", error: expect.stringContaining("hết hạn") });
});

test("proxy delegates only service failures to guarded Merchant/Reseller leaves, never Admin", () => {
  for (const path of ["/merchant", "/merchant/campaigns/new", "/reseller/campaigns"]) {
    expect(canHandlePortalAuthFailure(path, 503)).toBe(true);
    expect(canHandlePortalAuthFailure(path, 0)).toBe(true);
    for (const status of [400, 401, 403]) expect(canHandlePortalAuthFailure(path, status)).toBe(false);
  }
  for (const path of ["/admin", "/merchant-evil", "/reseller-evil", "/login"]) expect(canHandlePortalAuthFailure(path, 503)).toBe(false);
});

test("session SDK membership source selects only id and filters verified identity", async () => {
  const urls: URL[] = [];
  const client = createClient("https://fixture.invalid", "fixture-public-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async input => { urls.push(new URL(String(input))); return new Response(JSON.stringify([{ id }]), { headers: { "Content-Type": "application/json" } }); } },
  });
  const sdk = createPortalAccessSource(client);
  for (const portal of ["merchant", "reseller"] as const) expect((await sdk.getMembership(portal, id)).data).toEqual({ id });
  expect(urls.map(url => url.pathname)).toEqual(["/rest/v1/merchants", "/rest/v1/resellers"]);
  for (const url of urls) {
    expect(url.searchParams.get("select")).toBe("id");
    expect(url.searchParams.get("id")).toBe(`eq.${id}`);
  }
});
