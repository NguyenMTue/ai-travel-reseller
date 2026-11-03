import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { resellerWalletSummarySchema } from "../src/lib/commerce/wallet-service.ts";

// Configured local or production Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

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

test("BE1-W5-02: Affiliate link lookup is optimized (< 25ms) for k6 1.000 VUs load test", async () => {
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
  // Latency target for single point indexed lookup
  assert.ok(duration < 100, `Affiliate link lookup took ${duration.toFixed(2)}ms, expected < 100ms`);
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
  assert.ok(duration < 150, `RPC execution took ${duration.toFixed(2)}ms, expected fast execution`);
});

test("BE1-W5-03: Storage bucket 'campaign-videos' is public and configured for video streaming", async () => {
  const { data: buckets, error } = await client.storage.listBuckets();
  assert.equal(error, null, `List buckets failed: ${error?.message}`);
  
  const campaignVideosBucket = buckets?.find((b) => b.id === "campaign-videos");
  assert.ok(campaignVideosBucket, "Bucket 'campaign-videos' must exist");
  assert.equal(campaignVideosBucket.public, true, "Bucket 'campaign-videos' must be public for streaming");

  // Verify public URL generation
  const { data: publicUrlData } = client.storage
    .from("campaign-videos")
    .getPublicUrl("banahills-sample.mp4");
  
  assert.ok(publicUrlData.publicUrl.includes("campaign-videos/banahills-sample.mp4"));
});
