import {
  formatEmbeddingQuery,
  generateEmbedding,
} from "@/src/lib/ai/embeddings";
import { createAdminClient } from "@/src/lib/supabase/admin";

const DEFAULT_MATCH_COUNT = 3;
const DEFAULT_MATCH_THRESHOLD = 0.2;

export type RetrievedProductChunk = {
  id: string;
  product_id: string;
  chunk_index: number;
  content: string;
  metadata: unknown;
  similarity: number;
};

type RetrieveProductContextOptions = {
  productId?: string;
  matchCount?: number;
  matchThreshold?: number;
};

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

export async function retrieveProductContext(
  query: string,
  options: RetrieveProductContextOptions = {},
): Promise<RetrievedProductChunk[]> {
  const queryEmbedding = await generateEmbedding(formatEmbeddingQuery(query));
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("match_product_embeddings", {
    query_embedding: toVectorLiteral(queryEmbedding),
    match_count: options.matchCount ?? DEFAULT_MATCH_COUNT,
    match_threshold: options.matchThreshold ?? DEFAULT_MATCH_THRESHOLD,
    filter_product_id: options.productId ?? null,
  });

  if (error) {
    throw new Error(`Cannot retrieve product context: ${error.message}`);
  }

  return (data ?? []) as RetrievedProductChunk[];
}

export function formatRetrievedContext(
  chunks: RetrievedProductChunk[],
): string {
  return chunks
    .map(
      (chunk, index) =>
        `[Nguồn ${index + 1} | product_id=${chunk.product_id} | chunk=${chunk.chunk_index}]\n${chunk.content}`,
    )
    .join("\n\n");
}
