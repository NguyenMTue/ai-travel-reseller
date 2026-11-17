-- ==============================================================================
-- Migration: 20261117100000_get_top_resellers_for_merchant.sql
-- Task: BE1-W6-02 - Stored Procedure RPC get_top_resellers_for_merchant
-- 
-- Cung cấp danh sách đối tác Reseller hiệu quả nhất kèm mức hoa hồng và tương tác
-- để Merchant lựa chọn theo ngân sách (Budget matching).
-- ==============================================================================

-- 1. Index tối ưu hiệu năng lọc ngân sách và truy vấn liên kết
CREATE INDEX IF NOT EXISTS idx_resellers_commission_rate ON public.resellers(commission_rate);
CREATE INDEX IF NOT EXISTS idx_orders_merchant_reseller ON public.orders(merchant_id, reseller_id, status);
CREATE INDEX IF NOT EXISTS idx_commissions_merchant_reseller ON public.commissions(merchant_id, reseller_id, status);

-- 2. Stored Procedure RPC get_top_resellers_for_merchant
CREATE OR REPLACE FUNCTION public.get_top_resellers_for_merchant(
  p_merchant_id uuid,
  p_max_commission_rate numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_resellers jsonb := '[]'::jsonb;
  v_total_count integer := 0;
BEGIN
  -- Lấy danh sách Reseller tổng hợp
  WITH reseller_stats AS (
    SELECT
      r.id AS reseller_id,
      r.name AS reseller_name,
      r.email,
      r.phone,
      COALESCE(r.commission_rate, 10.0) AS commission_rate,
      -- Thống kê clicks từ affiliate links của Merchant này
      COALESCE(SUM(al.clicks_count), 0)::bigint AS total_clicks,
      -- Thống kê đơn hàng thành công
      COALESCE(
        (SELECT COUNT(o.id)
         FROM public.orders o
         WHERE o.reseller_id = r.id
           AND (p_merchant_id IS NULL OR o.merchant_id = p_merchant_id)
           AND o.status IN ('confirmed', 'paid')),
        0
      )::bigint AS total_orders,
      -- Thống kê tổng GMV
      COALESCE(
        (SELECT SUM(o.amount)
         FROM public.orders o
         WHERE o.reseller_id = r.id
           AND (p_merchant_id IS NULL OR o.merchant_id = p_merchant_id)
           AND o.status IN ('confirmed', 'paid')),
        0
      )::numeric AS total_gmv,
      -- Thống kê hoa hồng đã trả
      COALESCE(
        (SELECT SUM(c.net_amount)
         FROM public.commissions c
         WHERE c.reseller_id = r.id
           AND (p_merchant_id IS NULL OR c.merchant_id = p_merchant_id)
           AND c.status IN ('confirmed', 'paid')),
        0
      )::numeric AS total_commission_paid,
      -- Mạng xã hội & người theo dõi
      COALESCE(
        (SELECT SUM(sa.followers)
         FROM public.social_accounts sa
         WHERE sa.reseller_id = r.id),
        0
      )::bigint AS total_followers,
      COALESCE(
        (SELECT jsonb_agg(
           jsonb_build_object(
             'platform', sa.platform,
             'username', sa.username,
             'followers', sa.followers,
             'average_views', sa.average_views
           )
         )
         FROM public.social_accounts sa
         WHERE sa.reseller_id = r.id),
        '[]'::jsonb
      ) AS social_channels
    FROM public.resellers r
    LEFT JOIN public.affiliate_links al 
      ON al.reseller_id = r.id
      AND (
        p_merchant_id IS NULL 
        OR al.campaign_id IN (SELECT id FROM public.campaigns WHERE merchant_id = p_merchant_id)
      )
    WHERE r.status = 'active'
      AND (p_max_commission_rate IS NULL OR r.commission_rate <= p_max_commission_rate)
    GROUP BY r.id, r.name, r.email, r.phone, r.commission_rate
  )
  SELECT
    COUNT(*),
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'reseller_id', rs.reseller_id,
          'reseller_name', rs.reseller_name,
          'email', rs.email,
          'phone', rs.phone,
          'commission_rate', rs.commission_rate,
          'total_clicks', rs.total_clicks,
          'total_orders', rs.total_orders,
          'total_gmv', rs.total_gmv,
          'total_commission_paid', rs.total_commission_paid,
          'conversion_rate', CASE 
            WHEN rs.total_clicks > 0 THEN ROUND((rs.total_orders::numeric / rs.total_clicks::numeric) * 100, 2)
            ELSE 0 
          END,
          'total_followers', rs.total_followers,
          'social_channels', rs.social_channels
        )
        ORDER BY rs.total_orders DESC, rs.total_gmv DESC, rs.reseller_name ASC
      ),
      '[]'::jsonb
    )
  INTO
    v_total_count,
    v_resellers
  FROM reseller_stats rs;

  v_result := jsonb_build_object(
    'success', true,
    'merchant_id', p_merchant_id,
    'max_commission_rate', p_max_commission_rate,
    'total_count', v_total_count,
    'resellers', v_resellers
  );

  RETURN v_result;
END;
$$;
