-- ==============================================================================
-- MIGRATION: 20261112180000_super_admin_back_office.sql
-- SPRINT 5: PHÂN HỆ QUẢN TRỊ VẬN HÀNH & MÀN HÌNH BACK-OFFICE SUPER ADMIN (/admin)
-- ==============================================================================

-- 1. BẢNG QUẢN TRỊ VIÊN HỆ THỐNG (SYSTEM ADMINS)
CREATE TABLE IF NOT EXISTS public.admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL DEFAULT 'Super Admin',
  role text NOT NULL DEFAULT 'super_admin', -- 'super_admin', 'finance_officer', 'risk_auditor'
  status text NOT NULL DEFAULT 'active',     -- 'active', 'suspended'
  created_at timestamptz DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_status ON public.admins(status);

-- Kích hoạt Row-Level Security
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admins' 
    AND policyname = 'service_role_all_admins'
  ) THEN
    CREATE POLICY service_role_all_admins 
      ON public.admins
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admins' 
    AND policyname = 'admins_view_self'
  ) THEN
    CREATE POLICY admins_view_self 
      ON public.admins
      FOR SELECT
      TO authenticated
      USING (id = auth.uid());
  END IF;
END $$;

-- 2. BỔ SUNG CÁC CỘT QUẢN TRỊ VÀO BẢNG payout_requests
ALTER TABLE public.payout_requests 
  ADD COLUMN IF NOT EXISTS processed_at timestamptz,
  ADD COLUMN IF NOT EXISTS processed_by uuid,
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS transfer_reference text;

CREATE INDEX IF NOT EXISTS idx_payout_requests_processed_at ON public.payout_requests(processed_at DESC);

-- Cho phép Admin (service_role) cập nhật yêu cầu rút tiền
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payout_requests' 
    AND policyname = 'service_role_manage_payout_requests'
  ) THEN
    CREATE POLICY service_role_manage_payout_requests 
      ON public.payout_requests
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 3. STORED PROCEDURE: admin_process_payout_request
-- Cho phép Super Admin duyệt ('approve') hoặc từ chối ('reject') yêu cầu rút tiền của Reseller
CREATE OR REPLACE FUNCTION public.admin_process_payout_request(
  p_payout_id uuid,
  p_action text,
  p_admin_id uuid DEFAULT NULL,
  p_admin_notes text DEFAULT NULL,
  p_transfer_reference text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_payout record;
  v_reseller record;
  v_target_status text;
  v_amount_to_settle numeric;
  v_commission record;
BEGIN
  -- 1. Kiểm tra action hợp lệ
  IF p_action NOT IN ('approve', 'reject') THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'INVALID_ACTION',
      'error', 'Hành động không hợp lệ. Chỉ chấp nhận approve hoặc reject.'
    );
  END IF;

  -- 2. Khóa và lấy thông tin payout_request
  SELECT * INTO v_payout
  FROM public.payout_requests
  WHERE id = p_payout_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'NOT_FOUND',
      'error', 'Không tìm thấy yêu cầu rút tiền.'
    );
  END IF;

  -- 3. Chỉ được xử lý các yêu cầu đang ở trạng thái pending hoặc processing
  IF v_payout.status NOT IN ('pending', 'processing') THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ALREADY_PROCESSED',
      'error', 'Yêu cầu rút tiền này đã được xử lý trước đó với trạng thái: ' || v_payout.status
    );
  END IF;

  -- 4. Xử lý hành động DUYỆT (APPROVE) -> COMPLETED
  IF p_action = 'approve' THEN
    v_target_status := 'completed';

    -- Cập nhật payout_request
    UPDATE public.payout_requests
    SET
      status = v_target_status,
      processed_at = now(),
      processed_by = p_admin_id,
      admin_notes = COALESCE(p_admin_notes, 'Đã giải ngân thành công.'),
      transfer_reference = p_transfer_reference
    WHERE id = p_payout_id;

    -- Đồng bộ hoa hồng: Chuyển các khoản confirmed sang paid tương ứng số tiền rút
    v_amount_to_settle := v_payout.amount;
    FOR v_commission IN
      SELECT id, net_amount
      FROM public.commissions
      WHERE reseller_id = v_payout.reseller_id
        AND status = 'confirmed'
      ORDER BY created_at ASC
      FOR UPDATE
    LOOP
      IF v_amount_to_settle <= 0 THEN
        EXIT;
      END IF;

      UPDATE public.commissions
      SET status = 'paid', updated_at = now()
      WHERE id = v_commission.id;

      v_amount_to_settle := v_amount_to_settle - v_commission.net_amount;
    END LOOP;

    RETURN jsonb_build_object(
      'success', true,
      'code', 'APPROVED',
      'message', 'Đã duyệt và xác nhận chuyển khoản thành công.',
      'payout_id', p_payout_id,
      'status', v_target_status,
      'amount', v_payout.amount,
      'transfer_reference', p_transfer_reference
    );
  END IF;

  -- 5. Xử lý hành động TỪ CHỐI (REJECT) -> REJECTED
  IF p_action = 'reject' THEN
    v_target_status := 'rejected';

    -- Khi chuyển status thành rejected, số tiền v_locked_payouts trong get_reseller_wallet_summary
    -- tự động không còn tính khoản này, số dư tự động hoàn lại cho Reseller!
    UPDATE public.payout_requests
    SET
      status = v_target_status,
      processed_at = now(),
      processed_by = p_admin_id,
      admin_notes = COALESCE(p_admin_notes, 'Yêu cầu rút tiền bị từ chối bởi Quản trị viên.')
    WHERE id = p_payout_id;

    RETURN jsonb_build_object(
      'success', true,
      'code', 'REJECTED',
      'message', 'Đã từ chối yêu cầu rút tiền và hoàn lại số dư khả dụng cho Reseller.',
      'payout_id', p_payout_id,
      'status', v_target_status,
      'amount', v_payout.amount
    );
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'Trường hợp không xác định.');
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_process_payout_request(uuid, text, uuid, text, text) TO authenticated, service_role;

-- 4. STORED PROCEDURE: admin_get_system_overview
-- Tổng hợp toàn bộ các chỉ số vận hành kinh doanh, rủi ro và hoạt động đối tác
CREATE OR REPLACE FUNCTION public.admin_get_system_overview()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_total_gmv numeric := 0;
  v_total_orders bigint := 0;
  v_confirmed_orders bigint := 0;
  v_commissions_paid numeric := 0;
  v_commissions_confirmed numeric := 0;
  v_pending_payouts_count bigint := 0;
  v_pending_payouts_amount numeric := 0;
  v_flagged_orders_count bigint := 0;
  v_bot_clicks_count bigint := 0;
  v_total_clicks bigint := 0;
  v_merchants_count bigint := 0;
  v_resellers_count bigint := 0;
  v_products_count bigint := 0;
  v_campaigns_count bigint := 0;
BEGIN
  -- GMV & Orders
  SELECT
    COALESCE(SUM(amount) FILTER (WHERE status IN ('confirmed', 'paid')), 0),
    COALESCE(COUNT(id), 0),
    COALESCE(COUNT(id) FILTER (WHERE status IN ('confirmed', 'paid')), 0),
    COALESCE(COUNT(id) FILTER (WHERE flag_self_purchase = true), 0)
  INTO
    v_total_gmv,
    v_total_orders,
    v_confirmed_orders,
    v_flagged_orders_count
  FROM public.orders;

  -- Commissions
  SELECT
    COALESCE(SUM(net_amount) FILTER (WHERE status = 'paid'), 0),
    COALESCE(SUM(net_amount) FILTER (WHERE status = 'confirmed'), 0)
  INTO
    v_commissions_paid,
    v_commissions_confirmed
  FROM public.commissions;

  -- Pending Payouts
  SELECT
    COALESCE(COUNT(id), 0),
    COALESCE(SUM(amount), 0)
  INTO
    v_pending_payouts_count,
    v_pending_payouts_amount
  FROM public.payout_requests
  WHERE status IN ('pending', 'processing');

  -- Clicks & Traffic Anti-bot
  SELECT
    COALESCE(COUNT(id), 0),
    COALESCE(COUNT(id) FILTER (WHERE is_bot = true), 0)
  INTO
    v_total_clicks,
    v_bot_clicks_count
  FROM public.clicks;

  -- Counts entities
  SELECT COUNT(id) INTO v_merchants_count FROM public.merchants;
  SELECT COUNT(id) INTO v_resellers_count FROM public.resellers;
  SELECT COUNT(id) INTO v_products_count FROM public.products;
  SELECT COUNT(id) INTO v_campaigns_count FROM public.campaigns;

  RETURN jsonb_build_object(
    'financials', jsonb_build_object(
      'total_gmv', v_total_gmv,
      'commissions_paid', v_commissions_paid,
      'commissions_confirmed', v_commissions_confirmed,
      'pending_payouts_amount', v_pending_payouts_amount,
      'currency', 'VND'
    ),
    'operational_counts', jsonb_build_object(
      'total_orders', v_total_orders,
      'confirmed_orders', v_confirmed_orders,
      'pending_payouts_count', v_pending_payouts_count,
      'merchants_count', v_merchants_count,
      'resellers_count', v_resellers_count,
      'products_count', v_products_count,
      'campaigns_count', v_campaigns_count,
      'total_clicks', v_total_clicks
    ),
    'security_alerts', jsonb_build_object(
      'flagged_self_purchase_orders', v_flagged_orders_count,
      'bot_clicks_detected', v_bot_clicks_count,
      'action_required_payouts', v_pending_payouts_count
    ),
    'generated_at', timezone('utc'::text, now())
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_system_overview() TO authenticated, service_role;
