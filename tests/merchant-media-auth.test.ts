import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as mediaSchema from "../src/lib/merchant/media-schema.ts";
import * as mediaService from "../src/lib/merchant/media-service.ts";

const merchantFixtureOwner = "11111111-1111-1111-1111-111111111111";
const merchantFixtureOther = "11111111-1111-1111-1111-222222222222";

function mediaApiHarness(options: {
  signedIn?: boolean;
  isMerchant?: boolean;
  dbError?: boolean;
} = {}) {
  const { signedIn = true, isMerchant = true, dbError = false } = options;
  const calls: { name: string; args: unknown }[] = [];

  const mockDbQuery = {
    select: () => mockDbQuery,
    eq: (col: string, val: unknown) => {
      calls.push({ name: `eq:${col}`, args: val });
      return mockDbQuery;
    },
    contains: (col: string, val: unknown) => {
      calls.push({ name: `contains:${col}`, args: val });
      return mockDbQuery;
    },
    ilike: (col: string, val: unknown) => {
      calls.push({ name: `ilike:${col}`, args: val });
      return mockDbQuery;
    },
    order: () => mockDbQuery,
    range: () => mockDbQuery,
    maybeSingle: async () => ({
      data: isMerchant ? { id: merchantFixtureOwner } : null,
      error: null,
    }),
    then: (resolve: (val: unknown) => void) => {
      if (dbError) {
        resolve({ data: null, count: null, error: { message: "DB query failure" } });
      } else {
        resolve({
          data: [
            {
              id: "a1111111-1111-4111-8111-111111111111",
              merchant_id: merchantFixtureOwner,
              title: "Test Sample Video",
              video_url: "https://example.com/video.mp4",
              thumbnail_url: null,
              platform: "upload",
              duration: 30,
              style_tags: ["nature"],
              analysis_metadata: {},
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          count: 1,
          error: null,
        });
      }
    },
  };

  const client = {
    auth: {
      getUser: async () => ({
        data: { user: signedIn ? { id: merchantFixtureOwner } : null },
        error: signedIn ? null : { message: "No session" },
      }),
    },
    from: (table: string) => {
      calls.push({ name: `from:${table}`, args: table });
      return mockDbQuery;
    },
  };

  const code = ts.transpileModule(readFileSync("app/api/merchant/media/route.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  const record = {
    exports: {} as {
      GET: (req: Request) => Promise<Response>;
      POST: (req: Request) => Promise<Response>;
      DELETE: (req: Request) => Promise<Response>;
    },
  };

  const injectedRequire = (name: string) => {
    if (name === "next/server") return { NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) } };
    if (name === "next/headers") return { cookies: async () => ({}) };
    if (name === "@/src/lib/supabase/server") return { createClient: () => client };
    if (name === "@/src/lib/merchant/media-schema") return mediaSchema;
    if (name === "@/src/lib/merchant/media-service") return mediaService;
    throw new Error(`Unexpected dependency: ${name}`);
  };

  new vm.Script(`(function(exports,require,module){${code}\n})`).runInThisContext()(
    record.exports,
    injectedRequire,
    record,
  );

  return {
    GET: record.exports.GET,
    POST: record.exports.POST,
    DELETE: record.exports.DELETE,
    calls,
  };
}

test("API GET returns 401 UNAUTHORIZED when unauthenticated and no dev header", async () => {
  const h = mediaApiHarness({ signedIn: false });
  const req = new Request("http://localhost:3000/api/merchant/media");
  const res = await h.GET(req);
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.code, "UNAUTHORIZED");
  assert.match(res.headers.get("Cache-Control") ?? "", /private.*no-store/);
});

test("API GET returns 403 FORBIDDEN when user is not a Merchant (e.g. Reseller role)", async () => {
  const h = mediaApiHarness({ signedIn: true, isMerchant: false });
  const req = new Request("http://localhost:3000/api/merchant/media");
  const res = await h.GET(req);
  assert.equal(res.status, 403);
  const data = await res.json();
  assert.equal(data.code, "FORBIDDEN");
  assert.match(res.headers.get("Cache-Control") ?? "", /private.*no-store/);
});

test("API GET returns 403 FORBIDDEN when client attempts cross-merchant query override", async () => {
  const h = mediaApiHarness({ signedIn: true, isMerchant: true });
  const req = new Request(`http://localhost:3000/api/merchant/media?merchant_id=${merchantFixtureOther}`);
  const res = await h.GET(req);
  assert.equal(res.status, 403);
  const data = await res.json();
  assert.equal(data.code, "FORBIDDEN");
});

test("API GET succeeds for authenticated Merchant and filters strictly by their merchant_id", async () => {
  const h = mediaApiHarness({ signedIn: true, isMerchant: true });
  const req = new Request("http://localhost:3000/api/merchant/media?page=1&limit=6");
  const res = await h.GET(req);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.data.length, 1);
  assert.equal(data.data[0].merchantId, merchantFixtureOwner);
  // Assert query forced merchant_id filter
  const eqMerchantCall = h.calls.find((c) => c.name === "eq:merchant_id");
  assert(eqMerchantCall);
  assert.equal(eqMerchantCall.args, merchantFixtureOwner);
});

test("API POST & DELETE return 401 when unauthenticated and 403 when not merchant", async () => {
  const hUnauth = mediaApiHarness({ signedIn: false });
  const postUnauth = await hUnauth.POST(new Request("http://localhost:3000/api/merchant/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "V", videoUrl: "https://example.com/v.mp4" }),
  }));
  assert.equal(postUnauth.status, 401);

  const deleteUnauth = await hUnauth.DELETE(new Request("http://localhost:3000/api/merchant/media?id=a1111111-1111-4111-8111-111111111111", {
    method: "DELETE",
  }));
  assert.equal(deleteUnauth.status, 401);

  const hForbidden = mediaApiHarness({ signedIn: true, isMerchant: false });
  const postForbidden = await hForbidden.POST(new Request("http://localhost:3000/api/merchant/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "V", videoUrl: "https://example.com/v.mp4" }),
  }));
  assert.equal(postForbidden.status, 403);

  const deleteForbidden = await hForbidden.DELETE(new Request("http://localhost:3000/api/merchant/media?id=a1111111-1111-4111-8111-111111111111", {
    method: "DELETE",
  }));
  assert.equal(deleteForbidden.status, 403);
});
