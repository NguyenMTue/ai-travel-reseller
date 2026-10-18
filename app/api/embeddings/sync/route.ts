import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import {
  EMBEDDING_MODEL,
  formatEmbeddingDocument,
  generateEmbedding,
} from "@/src/lib/ai/embeddings";
import {
  buildProductEmbeddingContent,
  chunkEmbeddingContent,
} from "@/src/lib/ai/product-embeddings";
import { createAdminClient } from "@/src/lib/supabase/admin";

const UUID_PATTERN =
  /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

type SyncRequest = {
  product_id?: unknown;
};

function hashContent(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

export async function POST(request: Request) {
  try {
    const syncSecret = process.env.EMBEDDINGS_GENERATION_SECRET?.trim();

    if (!syncSecret) {
      return NextResponse.json(
        { error: "EMBEDDINGS_GENERATION_SECRET is not configured" },
        { status: 503 },
      );
    }

    if (request.headers.get("authorization") !== `Bearer ${syncSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: SyncRequest;

    try {
      body = (await request.json()) as SyncRequest;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const productId =
      typeof body.product_id === "string" ? body.product_id.trim() : "";

    if (!UUID_PATTERN.test(productId)) {
      return NextResponse.json(
        { error: "product_id must be a valid UUID" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, description, category, original_price, sale_price")
      .eq("id", productId)
      .maybeSingle();

    if (productError) {
      throw new Error(`Cannot load product: ${productError.message}`);
    }

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const chunks = chunkEmbeddingContent(buildProductEmbeddingContent(product));
    const { data: existingRows, error: existingRowsError } = await supabase
      .from("product_embeddings")
      .select("chunk_index, content_hash, model")
      .eq("product_id", product.id);

    if (existingRowsError) {
      throw new Error(
        `Cannot load existing embeddings: ${existingRowsError.message}`,
      );
    }

    const existingByIndex = new Map(
      (existingRows ?? []).map((row) => [row.chunk_index, row]),
    );
    let generated = 0;
    let skipped = 0;

    for (const [chunkIndex, content] of chunks.entries()) {
      const contentHash = hashContent(content);
      const existing = existingByIndex.get(chunkIndex);

      if (
        existing?.content_hash === contentHash &&
        existing.model === EMBEDDING_MODEL
      ) {
        skipped += 1;
        continue;
      }

      const embedding = await generateEmbedding(
        formatEmbeddingDocument(product.name, content),
      );
      const { error: upsertError } = await supabase
        .from("product_embeddings")
        .upsert(
          {
            product_id: product.id,
            chunk_index: chunkIndex,
            content,
            content_hash: contentHash,
            metadata: {
              name: product.name,
              category: product.category,
              original_price: product.original_price,
              sale_price: product.sale_price,
            },
            embedding,
            model: EMBEDDING_MODEL,
          },
          { onConflict: "product_id,chunk_index" },
        );

      if (upsertError) {
        throw new Error(
          `Cannot save embedding chunk ${chunkIndex}: ${upsertError.message}`,
        );
      }

      generated += 1;
    }

    const { data: deletedRows, error: deleteError } = await supabase
      .from("product_embeddings")
      .delete()
      .eq("product_id", product.id)
      .gte("chunk_index", chunks.length)
      .select("id");

    if (deleteError) {
      throw new Error(`Cannot remove stale chunks: ${deleteError.message}`);
    }

    return NextResponse.json({
      product_id: product.id,
      model: EMBEDDING_MODEL,
      chunks: chunks.length,
      generated,
      skipped,
      removed: deletedRows?.length ?? 0,
    });
  } catch (error) {
    console.error("Embedding sync error:", error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
