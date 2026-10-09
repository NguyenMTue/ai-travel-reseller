-- =====================================================================
-- BE1-05: Product Embeddings (pgvector) cho AI Sales Agent (RAG - BE2)
-- Model: Google Gemini gemini-embedding-2  ->  1536 dimensions
-- Pipeline: products INSERT/UPDATE -> Webhook -> /api/embeddings/sync
--           -> chunk + embed -> UPSERT vào product_embeddings
-- =====================================================================

-- 1. Kích hoạt extension pgvector (đặt trong schema extensions theo chuẩn Supabase)
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- 2. Bảng lưu vector theo từng chunk của sản phẩm
CREATE TABLE IF NOT EXISTS public.product_embeddings (
  id            uuid                      NOT NULL DEFAULT extensions.uuid_generate_v4(),
  product_id    uuid                      NOT NULL,
  chunk_index   integer                   NOT NULL DEFAULT 0,
  content       text                      NOT NULL,              -- đoạn văn bản gốc đã được embed
  content_hash  text,                                            -- hash nội dung để bỏ qua re-embed khi không đổi
  metadata      jsonb                     NOT NULL DEFAULT '{}'::jsonb,
  embedding     extensions.vector(1536)   NOT NULL,
  model         text                      NOT NULL DEFAULT 'gemini-embedding-2',
  created_at    timestamptz               NOT NULL DEFAULT now(),
  updated_at    timestamptz               NOT NULL DEFAULT now(),
  CONSTRAINT product_embeddings_pkey PRIMARY KEY (id),
  CONSTRAINT product_embeddings_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
  -- Cho phép UPSERT theo (product_id, chunk_index)
  CONSTRAINT product_embeddings_product_chunk_key UNIQUE (product_id, chunk_index),
  CONSTRAINT product_embeddings_chunk_index_check CHECK (chunk_index >= 0)
);

COMMENT ON TABLE public.product_embeddings IS
  'Vector embeddings (gemini-embedding-2, 1536d) của các chunk mô tả sản phẩm, phục vụ RAG cho AI Sales Agent.';

-- 3. Indexes
-- Unique constraint (product_id, chunk_index) đã bao phủ truy vấn theo product_id.
-- HNSW + cosine cho tìm kiếm tương đồng (không cần rebuild khi thêm dữ liệu như IVFFlat).
CREATE INDEX IF NOT EXISTS product_embeddings_embedding_hnsw_idx
  ON public.product_embeddings
  USING hnsw (embedding extensions.vector_cosine_ops);

-- 4. Tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS product_embeddings_set_updated_at ON public.product_embeddings;
CREATE TRIGGER product_embeddings_set_updated_at
  BEFORE UPDATE ON public.product_embeddings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Quyền & RLS
--    - Đọc: public (dữ liệu suy ra từ products vốn đã public read).
--    - Ghi: CHỈ service_role (Route Handler /api/embeddings/sync, n8n) - service_role bypass RLS.
ALTER TABLE public.product_embeddings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.product_embeddings FROM anon, authenticated;
GRANT SELECT ON TABLE public.product_embeddings TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.product_embeddings TO service_role;

DROP POLICY IF EXISTS "Allow public read access to product_embeddings" ON public.product_embeddings;
CREATE POLICY "Allow public read access to product_embeddings"
  ON public.product_embeddings
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 6. RPC tìm kiếm tương đồng (cosine) cho BE2
--    Gọi: supabase.rpc('match_product_embeddings', { query_embedding, match_count, match_threshold, filter_product_id })
--    similarity = 1 - cosine_distance (càng gần 1 càng giống)
CREATE OR REPLACE FUNCTION public.match_product_embeddings(
  query_embedding   extensions.vector(1536),
  match_count       integer DEFAULT 3,
  match_threshold   double precision DEFAULT 0.0,
  filter_product_id uuid DEFAULT NULL
)
  RETURNS TABLE (
    id          uuid,
    product_id  uuid,
    chunk_index integer,
    content     text,
    metadata    jsonb,
    similarity  double precision
  )
  LANGUAGE sql
  STABLE
  SECURITY INVOKER
  SET search_path = ''
AS $$
  SELECT
    pe.id,
    pe.product_id,
    pe.chunk_index,
    pe.content,
    pe.metadata,
    1 - (pe.embedding OPERATOR(extensions.<=>) query_embedding) AS similarity
  FROM public.product_embeddings AS pe
  WHERE (filter_product_id IS NULL OR pe.product_id = filter_product_id)
    AND 1 - (pe.embedding OPERATOR(extensions.<=>) query_embedding) >= match_threshold
  ORDER BY pe.embedding OPERATOR(extensions.<=>) query_embedding
  LIMIT LEAST(GREATEST(match_count, 1), 50);
$$;

REVOKE ALL ON FUNCTION public.match_product_embeddings(extensions.vector, integer, double precision, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_product_embeddings(extensions.vector, integer, double precision, uuid)
  TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
