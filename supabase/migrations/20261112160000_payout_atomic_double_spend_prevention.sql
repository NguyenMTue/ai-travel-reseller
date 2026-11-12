-- ==============================================================================
-- MIGRATION: 20261112160000_payout_atomic_double_spend_prevention.sql
-- SPRINT 5 HARDENING: CHỐNG LỖ HỔNG DOUBLE-SPEND RÚT TIỀN HOA HỒNG RESELLER
-- ==============================================================================

-- 1. STORED PROCEDURE: request_reseller_payout
-- Đảm bảo giao dịch rút tiền được thực hiện ATOMIC với Row-level lock (FOR UPDATE),
-- tự động khấu trừ các khoản payout_requests đang 'pending' hoặc 'processing'
-- nhằm ngăn chặn tuyệt đối tình trạng rút tiền kép (Race Condition / Double Spend).
CREATE OR REPLACE FUNCTION public.request_reseller_payout(
  p_reseller_id uuid,
  p_amount numeric,
  p_bank_name text,
  p_account_number text,
  p_account_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_confirmed_commissions numeric := 0;
  v_locked_payouts numeric := 0;
  v_effective_available numeric := 0;
  v_new_payout_id uuid;
  v_payout_record jsonb;
BEGIN
  -- 1. Kiểm tra quyền hạn: User authenticated chỉ được rút tiền cho chính mình
  IF auth.role() = 'authenticated' AND auth.uid() <> p_reseller_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'FORBIDDEN',
      'error', 'Không có quyền thực hiện yêu cầu rút tiền cho tài khoản này.'
    );
  END IF;

  -- 2. Validate số tiền rút tối thiểu
  IF p_amount IS NULL OR p_amount < 100000 THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'INVALID_AMOUNT',
      'error', 'Số tiền rút tối thiểu là 100.000 VNĐ.'
    );
  END IF;

  -- 3. Khóa dòng reseller để bảo đảm tính tuần tự (chống tấn công đồng thời / race condition)
  PERFORM id FROM public.resellers WHERE id = p_reseller_id FOR UPDATE;

  -- 4. Tính tổng hoa hồng đã được xác nhận (confirmed)
  SELECT COALESCE(SUM(c.net_amount) FILTER (WHERE c.status = 'confirmed'), 0)
  INTO v_confirmed_commissions
  FROM public.commissions c
  WHERE c.reseller_id = p_reseller_id;

  -- 5. Tính tổng các khoản rút tiền đang chờ xử lý hoặc đang duyệt (pending, processing)
  SELECT COALESCE(SUM(pr.amount) FILTER (WHERE pr.status IN ('pending', 'processing')), 0)
  INTO v_locked_payouts
  FROM public.payout_requests pr
  WHERE pr.reseller_id = p_reseller_id;

  -- 6. Tính số dư khả dụng thực tế sau khi khấu trừ tiền đang giữ chỗ
  v_effective_available := GREATEST(0, v_confirmed_commissions - v_locked_payouts);

  -- 7. Kiểm tra số dư khả dụng thực tế
  IF p_amount > v_effective_available THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'INSUFFICIENT_AVAILABLE_BALANCE',
      'error', 'Số tiền yêu cầu rút vượt quá số dư khả dụng thực tế sau khi trừ các khoản đang chờ xử lý.',
      'effective_available', v_effective_available,
      'locked_amount', v_locked_payouts
    );
  END IF;

  -- 8. Ghi nhận yêu cầu rút tiền mới vào bảng payout_requests
  INSERT INTO public.payout_requests (
    reseller_id,
    amount,
    bank_name,
    account_number,
    account_name,
    status
  ) VALUES (
    p_reseller_id,
    p_amount,
    trim(p_bank_name),
    trim(p_account_number),
    upper(trim(p_account_name)),
    'pending'
  ) RETURNING id INTO v_new_payout_id;

  -- 9. Lấy bản ghi vừa tạo
  SELECT to_jsonb(p) INTO v_payout_record
  FROM public.payout_requests p
  WHERE p.id = v_new_payout_id;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'SUCCESS',
    'message', 'Yêu cầu rút tiền đã được tạo thành công và đang chờ xử lý.',
    'data', v_payout_record,
    'effective_available_after', (v_effective_available - p_amount)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_reseller_payout(uuid, numeric, text, text, text) TO authenticated, service_role;

-- 2. CẬP NHẬT FUNCTION get_reseller_wallet_summary
-- Khấu trừ các khoản payout_requests đang 'pending' hoặc 'processing'
-- để đảm bảo số dư hiển thị trên Dashboard luôn khớp số dư thực tế có thể rút.
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
      COALESCE(cmp.title, 'Chiến dịch đối tác') AS campaign_name,
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
