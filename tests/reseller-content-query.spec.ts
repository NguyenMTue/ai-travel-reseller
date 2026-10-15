import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { queryContentKit, ContentReadFailure } from "@/src/lib/reseller/content-query";
import { getConfirmedContentPolicy } from "@/src/lib/reseller/content-kit";

const context = { campaignId: "44444444-4444-4444-4444-222222222222", resellerId: "22222222-2222-2222-2222-111111111111" };
const policy = getConfirmedContentPolicy();
function mockClient(respond: (url: URL) => Response) {
  return createClient("https://fixture.invalid", "fixture-public-key", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input) => respond(new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url)) },
  });
}
const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

test("real SDK serializes campaign AND publication AND shared/own filters on every paginated read", async () => {
  const requests: URL[] = [];
  const pages = [[{ id: "one" }, { id: "two" }], [{ id: "three" }], []];
  const client = mockClient((url) => { requests.push(url); return response(pages[requests.length - 1]); });
  expect(await queryContentKit(client, context, policy)).toEqual(pages.flat());
  expect(requests.map((url) => url.searchParams.get("offset"))).toEqual(["0", "2", "3"]);
  for (const url of requests) {
    expect(url.pathname).toBe("/rest/v1/contents");
    expect(url.searchParams.get("campaign_id")).toBe(`eq.${context.campaignId}`);
    expect(url.searchParams.get("status")).toBe("in.(approved)");
    expect(url.searchParams.get("or")).toBe(`(reseller_id.is.null,reseller_id.eq.${context.resellerId})`);
    expect(url.searchParams.get("select")).toBe("id,campaign_id,reseller_id,persona,status,hook,script,caption,cta");
    expect(url.searchParams.has("product_id")).toBe(false);
    expect(url.searchParams.get("limit")).toBe("500");
  }
});

test("unsafe identity and disabled publication scopes do not make a source request", async () => {
  let reads = 0;
  const client = mockClient(() => { reads++; return response([]); });
  await expect(queryContentKit(client, { ...context, resellerId: `${context.resellerId},reseller_id.not.is.null` }, policy)).rejects.toThrow();
  expect(await queryContentKit(client, context, { ...policy, statuses: [] })).toEqual([]);
  expect(await queryContentKit(client, context, { ...policy, allowShared: false, allowOwned: false })).toEqual([]);
  expect(reads).toBe(0);
});

test("source errors and malformed responses remain errors rather than empty fixture data", async () => {
  const client = mockClient(() => response({ code: "42501", message: "fixture private SQL detail", details: "do not expose" }, 403));
  await expect(queryContentKit(client, context, policy)).rejects.toMatchObject({ reason: "permission", code: "42501", message: "Content read unavailable" });
  const malformed = mockClient(() => response({ data: [] }));
  await expect(queryContentKit(malformed, context, policy)).rejects.toBeInstanceOf(ContentReadFailure);
  await expect(queryContentKit(malformed, context, policy)).rejects.toMatchObject({ reason: "schema", code: "INVALID_RESPONSE" });
});
