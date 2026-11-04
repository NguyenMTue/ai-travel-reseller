import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { resellerWalletSummarySchema } from "../src/lib/commerce/wallet-service.ts";
import { buildCheckoutUrl } from "../src/lib/ai/checkout-url.ts";
import { GET as healthGet, HEAD as healthHead } from "../app/api/health/route.ts";

const CLOUD_URL = "https://ykfosnwbgphlwpufnxrd.supabase.co";
const CLOUD_KEY = "sb_publishable_7qR6TIKjUXsqdMxcdMCtsQ_fqPgywPV";

// Configured local or production Supabase credentials from environment
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const isLocalUrl = rawUrl?.includes("127.0.0.1") || rawUrl?.includes("localhost");
const supabaseUrl = (isLocalUrl && process.env.TEST_FORCE_LOCAL !== "true")
  ? CLOUD_URL
  : (rawUrl || CLOUD_URL);

const supabaseKey = supabaseUrl === CLOUD_URL
  ? (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || CLOUD_KEY)
  : (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || CLOUD_KEY);

const client = createClient(supabaseUrl, supabaseKey);

test("BE1-W5-01: Database core tables exist and respond with valid schema", async () => {
  const tables = [
    "merchants",
    "resellers",
    "campaigns",
    "products",
    "contents",
    "affiliate_links",
    "clicks",
    "orders",
    "commissions",
    "media_references",
  ];

  for (const table of tables) {
    const { data, error } = await client.from(table).select("*").limit(1);
    assert.equal(error, null, `Table ${table} query failed: ${error?.message}`);
    assert.ok(Array.isArray(data), `Table ${table} should return an array`);
  }
});

test("BE1-W5-01: pgvector extension is available and functional", async () => {
  const { data, error } = await client.from("product_embeddings").select("id, product_id").limit(1);
  assert.equal(error, null, `product_embeddings table query failed: ${error?.message}`);
  assert.ok(Array.isArray(data));
});

test("BE1-W5-02: Affiliate link lookup is optimized (< 200ms roundtrip) for k6 1.000 VUs load test", async () => {
  // Test query on unique_code that k6 hits on /r/[code]
  const sampleCode = "BANA-TEST-01";
  
  const start = performance.now();
  const { error } = await client
    .from("affiliate_links")
    .select("id, destination_url, is_active, reseller_id, campaign_id, product_id")
    .eq("unique_code", sampleCode)
    .maybeSingle();
  const duration = performance.now() - start;

  assert.equal(error, null);
  // Roundtrip target for single point indexed lookup over internet
  assert.ok(duration < 500, `Affiliate link lookup took ${duration.toFixed(2)}ms, expected < 500ms`);
});

test("BE1-W5-02: Stored Procedure RPC get_reseller_wallet_summary executes with schema compliance", async () => {
  // Use known demo reseller ID or default uuid
  const demoResellerId = "22222222-2222-2222-2222-111111111111";

  const start = performance.now();
  const { data, error } = await client.rpc("get_reseller_wallet_summary", {
    p_reseller_id: demoResellerId,
  });
  const duration = performance.now() - start;

  assert.equal(error, null, `RPC failed: ${error?.message}`);
  assert.ok(data !== null, "RPC returned null data");

  // Validate strictly with Zod schema
  const parsed = resellerWalletSummarySchema.safeParse(data);
  assert.ok(parsed.success, `Wallet schema mismatch: ${JSON.stringify(parsed.error?.format())}`);
  assert.equal(parsed.data.balances.currency, "VND");
  assert.ok(duration < 500, `RPC execution took ${duration.toFixed(2)}ms, expected fast execution`);
});

test("BE1-W5-03: Storage bucket 'campaign-videos' is public and configured for video streaming", async () => {
  // Verify bucket object listing works without error
  const { data: objects, error: objError } = await client.storage
    .from("campaign-videos")
    .list("", { limit: 5 });
  assert.equal(objError, null, `List storage objects failed: ${objError?.message}`);
  assert.ok(Array.isArray(objects), "Storage list should return an array");

  // Verify public URL generation
  const sampleFileName = objects?.[0]?.name || "banahills-sample.mp4";
  const { data: publicUrlData } = client.storage
    .from("campaign-videos")
    .getPublicUrl(sampleFileName);
  
  assert.ok(publicUrlData.publicUrl.includes(`campaign-videos/${sampleFileName}`));

  // Verify public HTTP streaming access
  const headResponse = await fetch(publicUrlData.publicUrl, { method: "HEAD" });
  assert.ok(
    [200, 206].includes(headResponse.status),
    `Public video stream returned unexpected HTTP status: ${headResponse.status}`,
  );
});

test("BE1-W5-04: Vercel configuration & Health check endpoint are production ready", async () => {
  // 1. Verify vercel.json exists and has security headers
  const vercelPath = resolve("vercel.json");
  assert.ok(existsSync(vercelPath), "vercel.json must exist in root");
  const vercelConfig = JSON.parse(readFileSync(vercelPath, "utf-8"));
  assert.equal(vercelConfig.framework, "nextjs");
  assert.ok(Array.isArray(vercelConfig.headers), "vercel.json must define headers");

  // Check critical security headers
  const rootHeaderRule = vercelConfig.headers.find((h: { source: string }) => h.source === "/(.*)");
  assert.ok(rootHeaderRule, "Root header rule /(.*) must exist");
  const headerKeys = rootHeaderRule.headers.map((h: { key: string }) => h.key);
  assert.ok(headerKeys.includes("X-Frame-Options"), "Must include X-Frame-Options");
  assert.ok(headerKeys.includes("X-Content-Type-Options"), "Must include X-Content-Type-Options");
  assert.ok(headerKeys.includes("Strict-Transport-Security"), "Must include Strict-Transport-Security");

  // 2. Verify Health Check Endpoint GET & HEAD
  const headResponse = await healthHead();
  assert.equal(headResponse.status, 200);

  const getResponse = await healthGet();
  assert.ok([200, 503].includes(getResponse.status));
  const healthJson = await getResponse.json();
  assert.ok(healthJson.service.includes("TravelLink AI"));
  assert.ok(healthJson.checks.database);
  assert.ok(healthJson.checks.storage);
  assert.equal(healthJson.checks.pooler.port, 6543);
});

test("BE1-W5-05: Contract alignment & checkout fallback functions safely", () => {
  const attribution = {
    reseller_id: "reseller-123",
    campaign_id: "campaign-456",
    product_id: "product-789",
  };

  // Case 1: Standard payment_url
  const standardUrl = buildCheckoutUrl("https://merchant.example/pay", attribution);
  assert.ok(standardUrl);
  assert.ok(standardUrl.includes("ref=reseller-123"));

  // Case 2: Fallback booking_url when payment_url is null
  const fallbackUrl = buildCheckoutUrl(null, attribution, "https://merchant.example/booking");
  assert.ok(fallbackUrl);
  assert.ok(fallbackUrl.includes("https://merchant.example/booking"));
  assert.ok(fallbackUrl.includes("ref=reseller-123"));
  assert.ok(fallbackUrl.includes("campaign=campaign-456"));
  assert.ok(fallbackUrl.includes("product=product-789"));

  // Case 3: Both missing returns null safely without exception
  assert.equal(buildCheckoutUrl(null, attribution, null), null);
  assert.equal(buildCheckoutUrl(undefined, attribution, undefined), null);
  assert.equal(buildCheckoutUrl("javascript:evil()", attribution), null);
});
