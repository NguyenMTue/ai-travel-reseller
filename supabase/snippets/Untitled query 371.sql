-- Bước 1: Lấy tạm vector của sản phẩm đầu tiên trong bảng
    WITH sample AS (
      SELECT embedding
      FROM public.product_embeddings
      LIMIT 1
    )
    -- Bước 2: Gọi thử hàm RPC của BE1 với vector vừa lấy được
    SELECT
      id,
      product_id,
      content,
      similarity
    FROM public.match_product_embeddings(
      query_embedding := (SELECT embedding FROM sample),
      match_count := 3,         -- Trả về tối đa 3 kết quả giống nhất
      match_threshold := 0.0    -- Ngưỡng tối thiểu
    );