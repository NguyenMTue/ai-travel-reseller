-- ==============================================================================
-- Migration: Sửa lỗi tham chiếu cmp.title thành cmp.name trong get_reseller_wallet_summary
-- Bảng campaigns sử dụng cột 'name' thay vì 'title'
-- ==============================================================================

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
  v_locked_payouts numeric := 0;
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

  -- 3. Khấu trừ các khoản rút tiền đang chờ duyệt / đang xử lý khỏi số dư khả dụng
  SELECT COALESCE(SUM(pr.amount) FILTER (WHERE pr.status IN ('pending', 'processing')), 0)
  INTO v_locked_payouts
  FROM public.payout_requests pr
  WHERE pr.reseller_id = p_reseller_id;

  v_available_balance := GREATEST(0, v_available_balance - v_locked_payouts);

  -- 4. Thống kê đơn hàng và doanh số GMV từ bảng orders
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

  -- 5. Lấy top 10 giao dịch hoa hồng gần nhất kèm che dữ liệu nhạy cảm (Data Masking)
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
          substring(o.booking_reference from 1 for 3) || '***' || substring(o.booking_reference from length(o.booking_reference) - 2)
        WHEN o.booking_reference IS NOT NULL THEN 'MO-***'
        ELSE 'N/A'
      END AS masked_booking_ref,
      c.campaign_id,
      COALESCE(cmp.name, 'Chiến dịch đối tác') AS campaign_name,
      c.gross_amount,
      c.platform_fee,
      c.net_amount,
      c.status,
      COALESCE(o.amount, 0) AS order_amount,
      CASE
        WHEN o.customer_name IS NOT NULL AND length(o.customer_name) > 2 THEN
          substring(o.customer_name from 1 for 1) || '***' || substring(o.customer_name from length(o.customer_name))
        WHEN o.customer_name IS NOT NULL THEN 'Khách hàng'
        ELSE 'Khách ẩn danh'
      END AS masked_customer_name,
      COALESCE(o.flag_self_purchase, false) AS flag_self_purchase,
      c.created_at
    FROM public.commissions c
    LEFT JOIN public.orders o ON c.order_id = o.id
    LEFT JOIN public.campaigns cmp ON c.campaign_id = cmp.id
    WHERE c.reseller_id = p_reseller_id
    ORDER BY c.created_at DESC
    LIMIT 10
  ) t;

  -- 6. Đóng gói JSONB theo schema chuẩn ResellerWalletSummary
  v_result := jsonb_build_object(
    'reseller_id', p_reseller_id,
    'balances', jsonb_build_object(
      'available_balance', v_available_balance,
      'pending_balance', v_pending_balance,
      'paid_balance', v_paid_balance,
      'refunded_balance', v_refunded_balance,
      'lifetime_earnings', (v_available_balance + v_paid_balance + v_locked_payouts),
      'pending_payout_balance', v_locked_payouts,
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

GRANT EXECUTE ON FUNCTION public.get_reseller_wallet_summary(uuid) TO authenticated, service_role;
