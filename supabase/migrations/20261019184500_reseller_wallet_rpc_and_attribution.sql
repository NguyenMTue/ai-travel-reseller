-- ==============================================================================
-- Migration: 20261019184500_reseller_wallet_rpc_and_attribution.sql
-- Task: BE1-W3-04 - Attribution Engine & Postgres RPC get_reseller_wallet_summary
-- 
-- 1. Bảo mật & Chống gian lận:
--    - Unique index chống trùng lặp mã đặt chỗ (booking_reference) theo từng Merchant.
--    - Unique index đảm bảo tính idempotent của sổ cái hoa hồng (1 đơn hàng = 1 bản ghi commissions).
--    - Indexes hiệu năng cao cho truy vấn ví Reseller và đối soát Merchant.
-- 2. Stored Procedure RPC get_reseller_wallet_summary(p_reseller_id uuid):
--    - Thống kê hoa hồng khả dụng (confirmed), chờ duyệt (pending), đã chi trả (paid), hoàn trả (refunded).
--    - Thống kê tổng số đơn hàng, đơn thành công, tổng GMV và đơn bị cắm cờ tự mua (flag_self_purchase).
--    - Danh sách 10 giao dịch hoa hồng gần nhất kèm mã đơn và tên khách che thông tin nhạy cảm.
--    - Bảo mật: SECURITY DEFINER, SET search_path = public, kiểm tra quyền auth.uid() = p_reseller_id.
-- 3. Stored Procedure & Trigger tự động hóa Attribution & Đồng bộ hoa hồng:
--    - Function public.process_order_attribution(...)
--    - Trigger public.trg_sync_order_status_to_commission đồng bộ orders -> commissions.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PHẦN 1: BẢO MẬT DỮ LIỆU & RÀNG BUỘC CHỐNG GIAN LẬN
-- ------------------------------------------------------------------------------

-- Chống tạo trùng đơn hàng cùng mã đặt chỗ của một Merchant
CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_merchant_booking_ref 
ON public.orders (merchant_id, booking_reference) 
WHERE booking_reference IS NOT NULL;

-- Đảm bảo tính Idempotent: 1 đơn hàng chỉ có duy nhất 1 bản ghi trong sổ cái hoa hồng
CREATE UNIQUE INDEX IF NOT EXISTS uq_commissions_order_id
ON public.commissions (order_id);

-- Indexes tối ưu truy vấn tổng hợp ví và danh sách giao dịch
CREATE INDEX IF NOT EXISTS idx_commissions_reseller_status_created
ON public.commissions (reseller_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_reseller_status_amount
ON public.orders (reseller_id, status, amount);

-- ------------------------------------------------------------------------------
-- PHẦN 2: STORED PROCEDURE RPC get_reseller_wallet_summary
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_reseller_wallet_summary(p_reseller_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_pending_balance numeric := 0;
  v_available_balance numeric := 0;
  v_paid_balance numeric := 0;
  v_refunded_balance numeric := 0;
  v_total_orders bigint := 0;
  v_confirmed_orders bigint := 0;
  v_pending_orders bigint := 0;
  v_total_gmv numeric := 0;
  v_flagged_orders_count bigint := 0;
  v_recent_transactions jsonb := '[]'::jsonb;
BEGIN
  -- 1. Kiểm tra phân quyền: Authenticated user chỉ được xem dữ liệu ví của chính mình
  IF auth.role() = 'authenticated' AND auth.uid() <> p_reseller_id THEN
    RAISE EXCEPTION 'Access denied: You cannot view wallet summary of another reseller.';
  END IF;

  -- 2. Thống kê số dư hoa hồng theo trạng thái từ bảng commissions
  SELECT
    COALESCE(SUM(c.net_amount) FILTER (WHERE c.status = 'pending'), 0),
    COALESCE(SUM(c.net_amount) FILTER (WHERE c.status = 'confirmed'), 0),
    COALESCE(SUM(c.net_amount) FILTER (WHERE c.status = 'paid'), 0),
    COALESCE(SUM(c.net_amount) FILTER (WHERE c.status = 'refunded'), 0)
  INTO
    v_pending_balance,
    v_available_balance,
    v_paid_balance,
    v_refunded_balance
  FROM public.commissions c
  WHERE c.reseller_id = p_reseller_id;

  -- 3. Thống kê đơn hàng và doanh số GMV từ bảng orders
  SELECT
    COALESCE(COUNT(o.id), 0),
    COALESCE(COUNT(o.id) FILTER (WHERE o.status IN ('confirmed', 'paid')), 0),
    COALESCE(COUNT(o.id) FILTER (WHERE o.status = 'pending'), 0),
    COALESCE(SUM(o.amount) FILTER (WHERE o.status IN ('confirmed', 'paid')), 0),
    COALESCE(COUNT(o.id) FILTER (WHERE o.flag_self_purchase = true), 0)
  INTO
    v_total_orders,
    v_confirmed_orders,
    v_pending_orders,
    v_total_gmv,
    v_flagged_orders_count
  FROM public.orders o
  WHERE o.reseller_id = p_reseller_id;

  -- 4. Lấy top 10 giao dịch hoa hồng gần nhất kèm che dữ liệu nhạy cảm (Data Masking)
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', t.id,
        'order_id', t.order_id,
        'booking_reference', t.masked_booking_ref,
        'campaign_id', t.campaign_id,
        'campaign_name', t.campaign_name,
        'gross_amount', t.gross_amount,
        'platform_fee', t.platform_fee,
        'net_amount', t.net_amount,
        'status', t.status,
        'order_amount', t.order_amount,
        'customer_name', t.masked_customer_name,
        'flag_self_purchase', t.flag_self_purchase,
        'created_at', t.created_at
      ) ORDER BY t.created_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_recent_transactions
  FROM (
    SELECT
      c.id,
      c.order_id,
      CASE 
        WHEN o.booking_reference IS NOT NULL AND length(o.booking_reference) > 6 THEN
          substring(o.booking_reference from 1 for 3) || '***' || substring(o.booking_reference from length(o.booking_reference) - 2 for 3)
        ELSE COALESCE(o.booking_reference, 'N/A')
      END AS masked_booking_ref,
      c.campaign_id,
      COALESCE(cmp.name, 'Chiến dịch du lịch') AS campaign_name,
      c.gross_amount,
      c.platform_fee,
      c.net_amount,
      c.status,
      COALESCE(o.amount, 0) AS order_amount,
      CASE 
        WHEN o.customer_name IS NOT NULL AND length(o.customer_name) > 1 THEN
          substring(o.customer_name from 1 for 1) || '***' || substring(o.customer_name from length(o.customer_name) for 1)
        ELSE 'Khách hàng'
      END AS masked_customer_name,
      COALESCE(o.flag_self_purchase, false) AS flag_self_purchase,
      c.created_at
    FROM public.commissions c
    JOIN public.orders o ON o.id = c.order_id
    LEFT JOIN public.campaigns cmp ON cmp.id = c.campaign_id
    WHERE c.reseller_id = p_reseller_id
    ORDER BY c.created_at DESC
    LIMIT 10
  ) t;

  -- 5. Đóng gói kết quả JSON hoàn chỉnh
  v_result := jsonb_build_object(
    'reseller_id', p_reseller_id,
    'balances', jsonb_build_object(
      'available_balance', v_available_balance,
      'pending_balance', v_pending_balance,
      'paid_balance', v_paid_balance,
      'refunded_balance', v_refunded_balance,
      'lifetime_earnings', v_available_balance + v_paid_balance,
      'currency', 'VND'
    ),
    'order_metrics', jsonb_build_object(
      'total_orders', v_total_orders,
      'confirmed_orders', v_confirmed_orders,
      'pending_orders', v_pending_orders,
      'total_gmv', v_total_gmv,
      'flagged_self_purchase_orders', v_flagged_orders_count
    ),
    'recent_commissions', v_recent_transactions,
    'last_updated', timezone('utc'::text, now())
  );

  RETURN v_result;
END;
$$;

-- ------------------------------------------------------------------------------
-- PHẦN 3: ATTRIBUTION ENGINE FUNCTION (GHI NHẬN ĐƠN HÀNG & PHÂN BỔ HOA HỒNG)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_order_attribution(
  p_booking_reference VARCHAR,
  p_order_amount NUMERIC,
  p_merchant_id UUID,
  p_product_id UUID,
  p_reseller_id UUID DEFAULT NULL,
  p_campaign_id UUID DEFAULT NULL,
  p_click_id UUID DEFAULT NULL,
  p_customer_name VARCHAR DEFAULT NULL,
  p_customer_phone VARCHAR DEFAULT NULL,
  p_status VARCHAR DEFAULT 'confirmed',
  p_notes TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_commission_id UUID;
  v_resolved_reseller_id UUID := p_reseller_id;
  v_resolved_campaign_id UUID := p_campaign_id;
  v_click_created_at TIMESTAMPTZ;
  v_click_is_bot BOOLEAN := false;
  v_click_is_valid BOOLEAN := true;
  v_commission_rate NUMERIC := 0;
  v_gross_commission NUMERIC := 0;
  v_platform_fee NUMERIC := 0;
  v_reseller_commission NUMERIC := 0;
  v_is_self_purchase BOOLEAN := false;
  v_reseller_phone VARCHAR;
  v_existing_order_id UUID;
BEGIN
  -- 1. Kiểm tra trùng lặp đơn hàng theo booking_reference (Chống replay attack)
  IF p_booking_reference IS NOT NULL AND length(trim(p_booking_reference)) > 0 THEN
    SELECT id INTO v_existing_order_id
    FROM public.orders
    WHERE merchant_id = p_merchant_id AND booking_reference = p_booking_reference;

    IF v_existing_order_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'DUPLICATE_ORDER',
        'message', 'Đơn hàng với mã đặt chỗ này đã tồn tại trên hệ thống.',
        'order_id', v_existing_order_id
      );
    END IF;
  END IF;

  -- 2. Giải mã và xác thực Attribution từ click_id (nếu có)
  IF p_click_id IS NOT NULL THEN
    SELECT
      al.reseller_id,
      al.campaign_id,
      c.clicked_at,
      c.is_bot,
      c.is_valid
    INTO
      v_resolved_reseller_id,
      v_resolved_campaign_id,
      v_click_created_at,
      v_click_is_bot,
      v_click_is_valid
    FROM public.clicks c
    JOIN public.affiliate_links al ON al.id = c.link_id
    WHERE c.id = p_click_id;

    -- Kiểm tra Attribution Window: thời hạn hiệu lực tối đa 30 ngày
    IF v_click_created_at IS NOT NULL AND v_click_created_at < (now() - INTERVAL '30 days') THEN
      v_resolved_reseller_id := NULL;
      v_resolved_campaign_id := NULL;
    END IF;

    -- Kiểm tra chống gian lận click: Bot hoặc Click tặc không được ghi nhận hoa hồng
    IF v_click_is_bot = true OR v_click_is_valid = false THEN
      v_resolved_reseller_id := NULL;
      v_resolved_campaign_id := NULL;
    END IF;
  END IF;

  -- 3. Xác định tỷ lệ hoa hồng (ưu tiên Chiến dịch -> Tour/Sản phẩm -> Mặc định 10%)
  IF v_resolved_campaign_id IS NOT NULL THEN
    SELECT commission_rate INTO v_commission_rate
    FROM public.campaigns WHERE id = v_resolved_campaign_id;
  END IF;

  IF v_commission_rate IS NULL OR v_commission_rate = 0 THEN
    SELECT commission_rate INTO v_commission_rate
    FROM public.products WHERE id = p_product_id;
  END IF;

  IF v_commission_rate IS NULL OR v_commission_rate = 0 THEN
    v_commission_rate := 10;
  END IF;

  -- 4. Tính toán phân bổ hoa hồng (Làm tròn hàng đơn vị VNĐ)
  v_gross_commission := ROUND(COALESCE(p_order_amount, 0) * (v_commission_rate / 100.0));
  v_platform_fee := ROUND(v_gross_commission * 0.20);
  v_reseller_commission := v_gross_commission - v_platform_fee;

  -- 5. Chống tự mua hàng (Anti-Fraud: Self-Purchase Check)
  IF v_resolved_reseller_id IS NOT NULL AND p_customer_phone IS NOT NULL THEN
    SELECT phone INTO v_reseller_phone
    FROM public.resellers WHERE id = v_resolved_reseller_id;

    IF v_reseller_phone IS NOT NULL AND length(trim(v_reseller_phone)) > 6 THEN
      IF regexp_replace(v_reseller_phone, '[^0-9]', '', 'g') = regexp_replace(p_customer_phone, '[^0-9]', '', 'g') THEN
        v_is_self_purchase := true;
      END IF;
    END IF;
  END IF;

  -- 6. Ghi nhận đơn hàng vào bảng orders
  INSERT INTO public.orders (
    merchant_id,
    product_id,
    reseller_id,
    campaign_id,
    click_id,
    amount,
    commission_rate,
    gross_commission,
    platform_fee,
    reseller_commission,
    commission_amount,
    booking_reference,
    customer_name,
    customer_phone,
    currency,
    status,
    flag_self_purchase,
    notes,
    paid_at
  ) VALUES (
    p_merchant_id,
    p_product_id,
    v_resolved_reseller_id,
    v_resolved_campaign_id,
    p_click_id,
    p_order_amount,
    v_commission_rate,
    v_gross_commission,
    v_platform_fee,
    v_reseller_commission,
    v_reseller_commission,
    p_booking_reference,
    p_customer_name,
    p_customer_phone,
    'VND',
    p_status,
    v_is_self_purchase,
    p_notes,
    CASE WHEN p_status = 'paid' THEN now() ELSE NULL END
  )
  RETURNING id INTO v_order_id;

  -- 7. Nếu có reseller_id, ghi nhận ngay vào Sổ cái hoa hồng (commissions)
  IF v_resolved_reseller_id IS NOT NULL THEN
    INSERT INTO public.commissions (
      order_id,
      reseller_id,
      merchant_id,
      campaign_id,
      gross_amount,
      platform_fee,
      net_amount,
      status
    ) VALUES (
      v_order_id,
      v_resolved_reseller_id,
      p_merchant_id,
      v_resolved_campaign_id,
      v_gross_commission,
      v_platform_fee,
      v_reseller_commission,
      COALESCE(p_status, 'pending')
    )
    RETURNING id INTO v_commission_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'commission_id', v_commission_id,
    'reseller_id', v_resolved_reseller_id,
    'gross_commission', v_gross_commission,
    'platform_fee', v_platform_fee,
    'reseller_commission', v_reseller_commission,
    'flag_self_purchase', v_is_self_purchase,
    'status', p_status
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- PHẦN 4: TRIGGER ĐỒNG BỘ TRẠNG THÁI TỪ ORDERS SANG COMMISSIONS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_sync_order_status_to_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Khi đơn hàng thay đổi status, tự động cập nhật status trong sổ cái commissions
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    UPDATE public.commissions
    SET status = NEW.status,
        updated_at = timezone('utc'::text, now())
    WHERE order_id = NEW.id;
  END IF;

  -- Nếu cập nhật số tiền đơn hàng (amount) hoặc tỷ lệ hoa hồng, tính lại tiền hoa hồng
  IF (NEW.amount IS DISTINCT FROM OLD.amount) OR (NEW.commission_rate IS DISTINCT FROM OLD.commission_rate) THEN
    NEW.gross_commission := ROUND(COALESCE(NEW.amount, 0) * (COALESCE(NEW.commission_rate, 0) / 100.0));
    NEW.platform_fee := ROUND(NEW.gross_commission * 0.20);
    NEW.reseller_commission := NEW.gross_commission - NEW.platform_fee;
    NEW.commission_amount := NEW.reseller_commission;

    UPDATE public.commissions
    SET gross_amount = NEW.gross_commission,
        platform_fee = NEW.platform_fee,
        net_amount = NEW.reseller_commission,
        updated_at = timezone('utc'::text, now())
    WHERE order_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_order_status_to_commission ON public.orders;
CREATE TRIGGER trg_sync_order_status_to_commission
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.fn_sync_order_status_to_commission();

-- ------------------------------------------------------------------------------
-- PHẦN 5: CẤP QUYỀN THỰC THI (GRANTS)
-- ------------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.get_reseller_wallet_summary(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.process_order_attribution(VARCHAR, NUMERIC, UUID, UUID, UUID, UUID, UUID, VARCHAR, VARCHAR, VARCHAR, TEXT) TO authenticated, service_role;
