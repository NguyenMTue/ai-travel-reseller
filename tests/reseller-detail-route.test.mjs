import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve, dirname } from "node:path";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const id = "44444444-4444-4444-4444-111111111111";
const resellerId = "22222222-2222-2222-2222-111111111111";
const productId = "33333333-3333-3333-3333-111111111111";
const campaign = { id, product_id: productId, name: "Fixture campaign", target_location: null, target_audience: null,
  commission_rate: 10, start_date: null, end_date: null,
  products: { id: productId, name: "Fixture product", category: null, description: null } };

// Run the actual page + guarded loader with injected session-bound reads.
// No Next server, admin client, browser cookie or network is used by this harness.
function harness({ row = campaign, error = null, authenticated = true, member = true } = {}) {
  const reads = [];
  const client = {
    auth: { getUser: async () => ({ data: { user: authenticated ? { id: resellerId } : null }, error: null }) },
    from(table) {
      const filters = [];
      const reply = () => {
        reads.push({ table, filters });
        if (table === "resellers") return { data: member ? { id: resellerId } : null, error: null };
        if (table === "campaigns") return { data: row, error, status: error ? error.code === "42501" ? 403 : 400 : 200 };
        if (table === "contents") return { data: [], error: null };
        throw new Error("Unexpected table");
      };
      const query = {
        select() { return query; }, eq(key, value) { filters.push([key, value]); return query; },
        in() { return query; }, order() { return query; }, range() { return query; }, or() { return query; }, is() { return query; },
        maybeSingle: async () => reply(), then(onFulfilled, onRejected) { return Promise.resolve(reply()).then(onFulfilled, onRejected); },
      };
      return query;
    },
  };
  const modules = new Map();
  const components = Object.fromEntries(["CampaignDetailView", "ResellerAccessNotice", "FeedNotice", "FeedRetry"].map(name => [name, function Component() {}]));
  function load(file) {
    file = resolve(file);
    if (modules.has(file)) return modules.get(file).exports;
    const recordModule = { exports: {} }; modules.set(file, recordModule);
    const localRequire = name => {
      if (name === "server-only") return {};
      if (name === "react") return { ...require("react"), cache: fn => { let pending; return () => pending ??= fn(); } };
      if (name === "next/headers") return { cookies: async () => ({}) };
      if (name === "next/navigation") return { notFound() { throw new Error("TEST_NOT_FOUND"); }, redirect() { throw new Error("TEST_REDIRECT"); } };
      if (name === "@/src/lib/supabase/server") return { createClient: () => client };
      if (name === "@/src/lib/supabase/config") return { hasSupabaseConfig: true };
      if (name.startsWith("@/src/components/")) return components;
      if (name.startsWith("@/")) return load(resolve(name.slice(2)) + ".ts");
      if (name.startsWith(".")) return load(resolve(dirname(file), name) + ".ts");
      return require(name);
    };
    const compiled = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: {
      target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
    }, fileName: file }).outputText;
    new vm.Script(`(function(exports,require,module){${compiled}\n})`, { filename: file }).runInThisContext()(recordModule.exports, localRequire, recordModule);
    return recordModule.exports;
  }
  return { reads, components, page: load("app/reseller/campaigns/[id]/page.tsx").default, loader: load("src/lib/reseller/server.ts").getCampaignDetail };
}

test("reported PostgreSQL UUID reaches guarded detail query via promised route params", async () => {
  const h = harness();
  const view = await h.page({ params: Promise.resolve({ id }) });
  assert.equal(view.type, h.components.CampaignDetailView);
  assert.deepEqual(h.reads.find(read => read.table === "campaigns").filters, [["id", id], ["status", "active"]]);
  assert.ok(h.reads.some(read => read.table === "resellers" && read.filters.some(([key, value]) => key === "id" && value === resellerId)));
});
test("malformed route ID returns notFound before any session/database read", async () => {
  const h = harness();
  await assert.rejects(h.page({ params: Promise.resolve({ id: "not-a-uuid" }) }), /TEST_NOT_FOUND/);
  assert.equal(h.reads.length, 0);
});
test("valid ID with no visible active record returns notFound after authorized query", async () => {
  const h = harness({ row: null });
  await assert.rejects(h.page({ params: Promise.resolve({ id }) }), /TEST_NOT_FOUND/);
  assert.ok(h.reads.some(read => read.table === "campaigns"));
});
test("permission/schema query errors are not treated as a missing campaign", async () => {
  for (const [code, reason] of [["42501", "permission"], ["42703", "schema"]]) {
    const h = harness({ row: null, error: { code } });
    const result = await h.loader(id);
    assert.equal(result.status, "error");
    assert.equal(result.reason, reason);
  }
});
test("missing session or membership never reads campaign details", async () => {
  for (const options of [{ authenticated: false }, { member: false }]) {
    const h = harness(options); const result = await h.loader(id);
    assert.ok(["unauthenticated", "forbidden"].includes(result.status));
    assert.ok(h.reads.every(read => read.table !== "campaigns"));
  }
});
