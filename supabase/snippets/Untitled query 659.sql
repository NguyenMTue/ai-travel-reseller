-- 1. Bật extension pg_net (dùng để gọi API HTTP từ Database)
    CREATE EXTENSION IF NOT EXISTS pg_net;

    -- 2. Tạo hàm trigger bắn thông tin sang Next.js API
    CREATE OR REPLACE FUNCTION public.sync_product_webhook()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Gọi HTTP POST tự động (Không chờ phản hồi để tránh làm chậm DB)
      PERFORM net.http_post(
        url := 'http://host.docker.internal:3000/api/embeddings/sync',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer my-super-secret-key-123' -- CHÚ Ý SỬA CHỖ NÀY
        ),
        body := jsonb_build_object('product_id', NEW.id) -- Gửi đúng ID của sản phẩm vừa được thêm/sửa
      );

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- 3. Gắn bộ kích hoạt (Trigger) vào bảng products
    DROP TRIGGER IF EXISTS on_product_changed_sync_embeddings ON public.products;
    CREATE TRIGGER on_product_changed_sync_embeddings
    AFTER INSERT OR UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_product_webhook();
