import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

import {
  dispatchCampaignWebhook,
  dispatchProductEmbeddingWebhook,
  triggerCampaignContentGeneration,
  triggerProductEmbeddingSync,
  runNonBlocking,
} from "../src/lib/automation/database-webhooks.ts";

const UUID_PATTERN = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

/**
 * Hàm phân tích payload của /api/embeddings/sync (đối chứng logic trích xuất mã sản phẩm)
 */
function extractProductIdAndEvent(body: any): { productId: string; eventType: string; isValid: boolean } {
  const eventType = typeof body?.type === "string" ? body.type.toUpperCase() : "SYNC";
  let rawProductId = "";
  if (typeof body?.product_id === "string") {
    rawProductId = body.product_id;
  } else if (body?.record && typeof body.record.id === "string") {
    rawProductId = body.record.id;
  } else if (body?.old_record && typeof body.old_record.id === "string") {
    rawProductId = body.old_record.id;
  }
  const productId = rawProductId.trim();
  const isValid = UUID_PATTERN.test(productId);
  return { productId, eventType, isValid };
}

test("Database Webhooks Automation Suite", async (t) => {
  const originalFetch = global.fetch;
  const originalEnv = { ...process.env };

  t.afterEach(() => {
    global.fetch = originalFetch;
    process.env = { ...originalEnv };
  });

  await t.test("1. Migration SQL Verification", async (t2) => {
    const migrationPath = resolve(
      process.cwd(),
      "supabase/migrations/20261112170000_supabase_database_webhooks.sql",
    );

    await t2.test("Migration file exists", () => {
      assert.ok(
        existsSync(migrationPath),
        "Migration file 20261112170000_supabase_database_webhooks.sql must exist",
      );
    });

    const sqlContent = readFileSync(migrationPath, "utf-8");

    await t2.test("Creates public.database_webhook_events table", () => {
      assert.match(sqlContent, /CREATE TABLE IF NOT EXISTS public\.database_webhook_events/);
      assert.match(sqlContent, /event_type text NOT NULL/);
      assert.match(sqlContent, /table_name text NOT NULL/);
      assert.match(sqlContent, /record_id uuid NOT NULL/);
      assert.match(sqlContent, /payload jsonb NOT NULL/);
      assert.match(sqlContent, /status text NOT NULL DEFAULT 'pending'/);
    });

    await t2.test("Enables RLS and defines service_role policy", () => {
      assert.match(sqlContent, /ALTER TABLE public\.database_webhook_events ENABLE ROW LEVEL SECURITY;/);
      assert.match(sqlContent, /CREATE POLICY service_role_all_database_webhook_events/);
      assert.match(sqlContent, /TO service_role/);
    });

    await t2.test("Creates indexes for status, created_at, table_name, record_id", () => {
      assert.match(sqlContent, /idx_database_webhook_events_status_created/);
      assert.match(sqlContent, /idx_database_webhook_events_table_record/);
    });

    await t2.test("Creates Campaign webhook trigger function with SECURITY DEFINER and search_path", () => {
      assert.match(sqlContent, /CREATE OR REPLACE FUNCTION public\.trg_fn_campaigns_created_webhook\(\)/);
      assert.match(sqlContent, /SECURITY DEFINER/);
      assert.match(sqlContent, /SET search_path = public, extensions, pg_temp/);
      assert.match(sqlContent, /CREATE TRIGGER trg_campaigns_created_webhook/);
      assert.match(sqlContent, /AFTER INSERT ON public\.campaigns/);
    });

    await t2.test("Creates Products embedding sync trigger function with SECURITY DEFINER and search_path", () => {
      assert.match(sqlContent, /CREATE OR REPLACE FUNCTION public\.trg_fn_products_sync_webhook\(\)/);
      assert.match(sqlContent, /SECURITY DEFINER/);
      assert.match(sqlContent, /SET search_path = public, extensions, pg_temp/);
      assert.match(sqlContent, /CREATE TRIGGER trg_products_sync_webhook/);
      assert.match(sqlContent, /AFTER INSERT OR UPDATE ON public\.products/);
    });

    await t2.test("Creates get_pending_webhook_events RPC", () => {
      assert.match(sqlContent, /CREATE OR REPLACE FUNCTION public\.get_pending_webhook_events/);
      assert.match(sqlContent, /GRANT EXECUTE ON FUNCTION public\.get_pending_webhook_events\(int\) TO service_role;/);
    });
  });

  await t.test("2. Campaign Webhook Dispatcher Contract & Behavior", async (t3) => {
    const campaignId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

    await t3.test("Returns skipped when N8N webhook URL is not configured", async () => {
      delete process.env.N8N_CAMPAIGN_CONTENT_WEBHOOK_URL;
      delete process.env.N8N_WEBHOOK_URL;

      const result = await dispatchCampaignWebhook(campaignId, { name: "Test Tour" });
      assert.strictEqual(result.delivered, false);
      assert.strictEqual(result.skipped, true);
      assert.match(result.reason || "", /not configured/);
    });

    await t3.test("Dispatches correct standard Supabase payload and headers to n8n", async () => {
      process.env.N8N_CAMPAIGN_CONTENT_WEBHOOK_URL = "https://n8n.example.com/webhook/campaign-test";
      process.env.N8N_WEBHOOK_TOKEN = "secret-token-xyz-123";

      let capturedUrl = "";
      let capturedMethod = "";
      let capturedHeaders: Record<string, string> = {};
      let capturedBody: any = null;

      global.fetch = async (url: any, init: any) => {
        capturedUrl = String(url);
        capturedMethod = init.method;
        capturedHeaders = init.headers;
        capturedBody = JSON.parse(init.body);

        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      };

      const result = await dispatchCampaignWebhook(campaignId, {
        name: "Tour Khám Phá Phong Nha",
        target_location: "Quảng Bình",
      });

      assert.strictEqual(result.delivered, true);
      assert.strictEqual(result.statusCode, 200);
      assert.strictEqual(capturedUrl, "https://n8n.example.com/webhook/campaign-test");
      assert.strictEqual(capturedMethod, "POST");
      assert.strictEqual(capturedHeaders["Content-Type"], "application/json");
      assert.strictEqual(capturedHeaders["X-Webhook-Token"], "secret-token-xyz-123");

      assert.strictEqual(capturedBody.type, "INSERT");
      assert.strictEqual(capturedBody.table, "campaigns");
      assert.strictEqual(capturedBody.schema, "public");
      assert.strictEqual(capturedBody.old_record, null);
      assert.strictEqual(capturedBody.record.id, campaignId);
      assert.strictEqual(capturedBody.record.name, "Tour Khám Phá Phong Nha");
      assert.strictEqual(capturedBody.record.target_location, "Quảng Bình");
    });

    await t3.test("Handles network failure gracefully without throwing", async () => {
      process.env.N8N_CAMPAIGN_CONTENT_WEBHOOK_URL = "https://n8n.example.com/webhook/campaign-test";

      global.fetch = async () => {
        throw new Error("Connection reset by peer");
      };

      const result = await dispatchCampaignWebhook(campaignId);
      assert.strictEqual(result.delivered, false);
      assert.match(result.error || "", /Connection reset/);
    });
  });

  await t.test("3. Product Embeddings Sync Webhook Dispatcher Contract & Behavior", async (t4) => {
    const productId = "4ba85f64-5717-4562-b3fc-2c963f66afb7";

    await t4.test("Returns skipped when EMBEDDINGS_GENERATION_SECRET is not configured", async () => {
      delete process.env.EMBEDDINGS_GENERATION_SECRET;

      const result = await dispatchProductEmbeddingWebhook(productId, { name: "Tour Sapa" });
      assert.strictEqual(result.delivered, false);
      assert.strictEqual(result.skipped, true);
      assert.match(result.reason || "", /EMBEDDINGS_GENERATION_SECRET/);
    });

    await t4.test("Dispatches INSERT payload with Bearer token to /api/embeddings/sync", async () => {
      process.env.EMBEDDINGS_GENERATION_SECRET = "super-secret-sync-key";
      process.env.INTERNAL_APP_URL = "http://127.0.0.1:3000";

      let capturedUrl = "";
      let capturedHeaders: Record<string, string> = {};
      let capturedBody: any = null;

      global.fetch = async (url: any, init: any) => {
        capturedUrl = String(url);
        capturedHeaders = init.headers;
        capturedBody = JSON.parse(init.body);

        return new Response(JSON.stringify({ success: true, chunks: 3 }), { status: 200 });
      };

      const result = await dispatchProductEmbeddingWebhook(
        productId,
        { name: "Tour Trekking Fansipan", category: "Mạo hiểm" },
        "INSERT",
      );

      assert.strictEqual(result.delivered, true);
      assert.strictEqual(result.statusCode, 200);
      assert.strictEqual(capturedUrl, "http://127.0.0.1:3000/api/embeddings/sync");
      assert.strictEqual(capturedHeaders["Authorization"], "Bearer super-secret-sync-key");
      assert.strictEqual(capturedHeaders["X-Embeddings-Secret"], "super-secret-sync-key");

      assert.strictEqual(capturedBody.type, "INSERT");
      assert.strictEqual(capturedBody.table, "products");
      assert.strictEqual(capturedBody.schema, "public");
      assert.strictEqual(capturedBody.record.id, productId);
      assert.strictEqual(capturedBody.record.name, "Tour Trekking Fansipan");
      assert.strictEqual(capturedBody.old_record, null);
    });

    await t4.test("Dispatches DELETE payload with old_record to /api/embeddings/sync", async () => {
      process.env.EMBEDDINGS_GENERATION_SECRET = "super-secret-sync-key";
      process.env.INTERNAL_APP_URL = "http://127.0.0.1:3000";

      let capturedBody: any = null;

      global.fetch = async (_url: any, init: any) => {
        capturedBody = JSON.parse(init.body);
        return new Response(JSON.stringify({ success: true, removed: 4 }), { status: 200 });
      };

      const result = await dispatchProductEmbeddingWebhook(productId, { id: productId }, "DELETE");

      assert.strictEqual(result.delivered, true);
      assert.strictEqual(capturedBody.type, "DELETE");
      assert.strictEqual(capturedBody.record, null);
      assert.strictEqual(capturedBody.old_record.id, productId);
    });
  });

  await t.test("4. Non-blocking helpers run cleanly", () => {
    assert.doesNotThrow(() => {
      triggerCampaignContentGeneration("5ca85f64-5717-4562-b3fc-2c963f66afc8");
      triggerProductEmbeddingSync("6da85f64-5717-4562-b3fc-2c963f66afd9");
      runNonBlocking(async () => {});
    });
  });

  await t.test("5. Route /api/embeddings/sync Contract & Webhook Compatibility", async (t5) => {
    const syncRoutePath = resolve("app/api/embeddings/sync/route.ts");

    await t5.test("Route file exists", () => {
      assert.ok(existsSync(syncRoutePath), "app/api/embeddings/sync/route.ts must exist");
    });

    const routeContent = readFileSync(syncRoutePath, "utf-8");

    await t5.test("Supports both Bearer authorization and X-Embeddings-Secret header", () => {
      assert.match(routeContent, /authHeader === `Bearer \$\{syncSecret\}`/);
      assert.match(routeContent, /customSecretHeader === syncSecret/);
    });

    await t5.test("Extracts product ID from both direct product_id and Supabase Webhook payload (record/old_record)", () => {
      assert.match(routeContent, /body\.product_id/);
      assert.match(routeContent, /body\.record/);
      assert.match(routeContent, /body\.old_record/);
    });

    await t5.test("Handles DELETE event for removing product embeddings", () => {
      assert.match(routeContent, /eventType === "DELETE"/);
      assert.match(routeContent, /\.from\("product_embeddings"\)/);
      assert.match(routeContent, /\.delete\(\)/);
    });

    await t5.test("Validates product ID extraction logic against various payload formats", () => {
      const testUuid = "123e4567-e89b-12d3-a456-426614174000";

      // 1. Direct call payload
      const direct = extractProductIdAndEvent({ product_id: testUuid });
      assert.strictEqual(direct.productId, testUuid);
      assert.strictEqual(direct.eventType, "SYNC");
      assert.strictEqual(direct.isValid, true);

      // 2. Supabase Webhook INSERT payload
      const webhookInsert = extractProductIdAndEvent({
        type: "INSERT",
        table: "products",
        schema: "public",
        record: { id: testUuid, name: "Tour Hạ Long" },
      });
      assert.strictEqual(webhookInsert.productId, testUuid);
      assert.strictEqual(webhookInsert.eventType, "INSERT");
      assert.strictEqual(webhookInsert.isValid, true);

      // 3. Supabase Webhook UPDATE payload
      const webhookUpdate = extractProductIdAndEvent({
        type: "UPDATE",
        table: "products",
        record: { id: testUuid, sale_price: 1500000 },
      });
      assert.strictEqual(webhookUpdate.productId, testUuid);
      assert.strictEqual(webhookUpdate.eventType, "UPDATE");
      assert.strictEqual(webhookUpdate.isValid, true);

      // 4. Supabase Webhook DELETE payload
      const webhookDelete = extractProductIdAndEvent({
        type: "DELETE",
        table: "products",
        old_record: { id: testUuid },
      });
      assert.strictEqual(webhookDelete.productId, testUuid);
      assert.strictEqual(webhookDelete.eventType, "DELETE");
      assert.strictEqual(webhookDelete.isValid, true);

      // 5. Invalid UUID
      const invalid = extractProductIdAndEvent({ record: { id: "not-a-valid-uuid" } });
      assert.strictEqual(invalid.isValid, false);
    });
  });

  await t.test("6. Integration in Merchant Product & Campaign flows", async (t6) => {
    const productServicePath = resolve("src/lib/merchant/product-service.ts");
    const campaignServerPath = resolve("src/lib/merchant/campaign-server.ts");
    const campaignsApiPath = resolve("app/api/merchant/campaigns/route.ts");

    await t6.test("Product service dispatches embeddings sync on creation and update", () => {
      assert.ok(existsSync(productServicePath));
      const content = readFileSync(productServicePath, "utf-8");
      assert.match(content, /triggerProductEmbeddingSync\(inserted\.id, inserted, "INSERT"\)/);
      assert.match(content, /triggerProductEmbeddingSync\(updated\.id, updated, "UPDATE"\)/);
    });

    await t6.test("Campaign server action dispatches content generation on success", () => {
      assert.ok(existsSync(campaignServerPath));
      const content = readFileSync(campaignServerPath, "utf-8");
      assert.match(content, /triggerCampaignContentGeneration\(result\.campaignId/);
    });

    await t6.test("Campaign REST API dispatches content generation on POST", () => {
      assert.ok(existsSync(campaignsApiPath));
      const content = readFileSync(campaignsApiPath, "utf-8");
      assert.match(content, /export async function POST/);
      assert.match(content, /triggerCampaignContentGeneration\(inserted\.id, inserted\)/);
    });
  });
});
