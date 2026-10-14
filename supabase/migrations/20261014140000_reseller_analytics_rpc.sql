-- =====================================================================
-- BE1-W2-09: Bộ Postgres Stored Procedures (RPC) High-Performance Analytics
-- Cung cấp 4 hàm phân tích dữ liệu tổng hợp trực tiếp trong Database:
-- 1. get_reseller_overview_stats(p_reseller_id uuid)
-- 2. get_reseller_click_timeseries(p_reseller_id uuid, p_days integer)
-- 3. get_reseller_top_campaigns(p_reseller_id uuid, p_limit integer)
-- 4. get_reseller_device_stats(p_reseller_id uuid)
-- =====================================================================

-- 1. Hàm thống kê tổng quan (Overview Metrics)
CREATE OR REPLACE FUNCTION public.get_reseller_overview_stats(p_reseller_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_total_links bigint := 0;
  v_active_links bigint := 0;
  v_total_campaigns bigint := 0;
  v_total_clicks bigint := 0;
  v_valid_clicks bigint := 0;
  v_bot_clicks bigint := 0;
  v_invalid_clicks bigint := 0;
BEGIN
  -- Kiểm tra phân quyền: Authenticated user chỉ được xem dữ liệu của chính mình
  IF auth.role() = 'authenticated' AND auth.uid() <> p_reseller_id THEN
    RAISE EXCEPTION 'Access denied: You cannot view analytics of another reseller.';
  END IF;

  -- Thống kê link tiếp thị
  SELECT
    count(*),
    count(*) FILTER (WHERE is_active = true),
    count(DISTINCT campaign_id)
  INTO
    v_total_links,
    v_active_links,
    v_total_campaigns
  FROM public.affiliate_links
  WHERE reseller_id = p_reseller_id;

  -- Thống kê lượt clicks và phân loại bot / hợp lệ
  SELECT
    coalesce(count(c.id), 0),
    coalesce(count(c.id) FILTER (WHERE c.is_bot = false AND c.is_valid = true), 0),
    coalesce(count(c.id) FILTER (WHERE c.is_bot = true), 0),
    coalesce(count(c.id) FILTER (WHERE c.is_bot = false AND c.is_valid = false), 0)
  INTO
    v_total_clicks,
    v_valid_clicks,
    v_bot_clicks,
    v_invalid_clicks
  FROM public.affiliate_links al
  LEFT JOIN public.clicks c ON c.link_id = al.id
  WHERE al.reseller_id = p_reseller_id;

  v_result := jsonb_build_object(
    'reseller_id', p_reseller_id,
    'total_links', v_total_links,
    'active_links', v_active_links,
    'total_campaigns', v_total_campaigns,
    'total_clicks', v_total_clicks,
    'valid_clicks', v_valid_clicks,
    'bot_clicks', v_bot_clicks,
    'invalid_clicks', v_invalid_clicks,
    'bot_ratio_percentage', CASE WHEN v_total_clicks > 0 
      THEN round((v_bot_clicks::numeric / v_total_clicks::numeric) * 100, 1) 
      ELSE 0 END
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Hàm thống kê lượt click theo chuỗi thời gian (Timeseries Graph)
CREATE OR REPLACE FUNCTION public.get_reseller_click_timeseries(
  p_reseller_id uuid,
  p_days integer DEFAULT 7
)
RETURNS TABLE (
  date text,
  total_clicks bigint,
  valid_clicks bigint,
  bot_clicks bigint
) AS $$
BEGIN
  IF auth.role() = 'authenticated' AND auth.uid() <> p_reseller_id THEN
    RAISE EXCEPTION 'Access denied: You cannot view analytics of another reseller.';
  END IF;

  RETURN QUERY
  WITH date_series AS (
    SELECT (CURRENT_DATE - (s.a || ' day')::interval)::date AS d
    FROM generate_series(p_days - 1, 0, -1) AS s(a)
  ),
  reseller_clicks AS (
    SELECT
      (c.clicked_at AT TIME ZONE 'UTC')::date AS click_date,
      c.is_bot,
      c.is_valid
    FROM public.affiliate_links al
    JOIN public.clicks c ON c.link_id = al.id
    WHERE al.reseller_id = p_reseller_id
      AND c.clicked_at >= (CURRENT_DATE - ((p_days - 1) || ' day')::interval)
  )
  SELECT
    to_char(ds.d, 'YYYY-MM-DD') AS date,
    coalesce(count(rc.click_date), 0)::bigint AS total_clicks,
    coalesce(count(rc.click_date) FILTER (WHERE rc.is_bot = false AND rc.is_valid = true), 0)::bigint AS valid_clicks,
    coalesce(count(rc.click_date) FILTER (WHERE rc.is_bot = true), 0)::bigint AS bot_clicks
  FROM date_series ds
  LEFT JOIN reseller_clicks rc ON rc.click_date = ds.d
  GROUP BY ds.d
  ORDER BY ds.d ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Hàm lấy Top chiến dịch có lượt click hợp lệ nhiều nhất
CREATE OR REPLACE FUNCTION public.get_reseller_top_campaigns(
  p_reseller_id uuid,
  p_limit integer DEFAULT 5
)
RETURNS TABLE (
  campaign_id uuid,
  campaign_name character varying,
  product_name character varying,
  commission_rate numeric,
  short_url text,
  unique_code character varying,
  valid_clicks bigint,
  total_clicks bigint
) AS $$
BEGIN
  IF auth.role() = 'authenticated' AND auth.uid() <> p_reseller_id THEN
    RAISE EXCEPTION 'Access denied: You cannot view analytics of another reseller.';
  END IF;

  RETURN QUERY
  SELECT
    al.campaign_id,
    coalesce(cmp.name, 'Chiến dịch') AS campaign_name,
    coalesce(p.name, 'Tour du lịch') AS product_name,
    coalesce(cmp.commission_rate, p.commission_rate, 0) AS commission_rate,
    al.short_url,
    al.unique_code,
    coalesce(count(c.id) FILTER (WHERE c.is_bot = false AND c.is_valid = true), 0)::bigint AS valid_clicks,
    coalesce(count(c.id), 0)::bigint AS total_clicks
  FROM public.affiliate_links al
  LEFT JOIN public.campaigns cmp ON cmp.id = al.campaign_id
  LEFT JOIN public.products p ON p.id = al.product_id
  LEFT JOIN public.clicks c ON c.link_id = al.id
  WHERE al.reseller_id = p_reseller_id
  GROUP BY al.campaign_id, cmp.name, p.name, cmp.commission_rate, p.commission_rate, al.short_url, al.unique_code
  ORDER BY valid_clicks DESC, total_clicks DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Hàm thống kê tỷ lệ phân bố Thiết bị, Hệ điều hành & Trình duyệt
CREATE OR REPLACE FUNCTION public.get_reseller_device_stats(p_reseller_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_total_valid bigint := 0;
  v_devices jsonb := '[]'::jsonb;
  v_os jsonb := '[]'::jsonb;
  v_browsers jsonb := '[]'::jsonb;
BEGIN
  IF auth.role() = 'authenticated' AND auth.uid() <> p_reseller_id THEN
    RAISE EXCEPTION 'Access denied: You cannot view analytics of another reseller.';
  END IF;

  -- Đếm tổng lượt click hợp lệ của người thật
  SELECT count(c.id)
  INTO v_total_valid
  FROM public.affiliate_links al
  JOIN public.clicks c ON c.link_id = al.id
  WHERE al.reseller_id = p_reseller_id
    AND c.is_bot = false 
    AND c.is_valid = true;

  IF v_total_valid > 0 THEN
    -- 1. Phân bố Thiết bị
    SELECT coalesce(jsonb_agg(d), '[]'::jsonb)
    INTO v_devices
    FROM (
      SELECT
        coalesce(c.device_type, 'unknown') AS name,
        count(c.id) AS count,
        round((count(c.id)::numeric / v_total_valid::numeric) * 100, 1) AS percentage
      FROM public.affiliate_links al
      JOIN public.clicks c ON c.link_id = al.id
      WHERE al.reseller_id = p_reseller_id
        AND c.is_bot = false AND c.is_valid = true
      GROUP BY c.device_type
      ORDER BY count DESC
    ) d;

    -- 2. Phân bố Hệ điều hành
    SELECT coalesce(jsonb_agg(o), '[]'::jsonb)
    INTO v_os
    FROM (
      SELECT
        coalesce(c.os, 'other') AS name,
        count(c.id) AS count,
        round((count(c.id)::numeric / v_total_valid::numeric) * 100, 1) AS percentage
      FROM public.affiliate_links al
      JOIN public.clicks c ON c.link_id = al.id
      WHERE al.reseller_id = p_reseller_id
        AND c.is_bot = false AND c.is_valid = true
      GROUP BY c.os
      ORDER BY count DESC
    ) o;

    -- 3. Phân bố Trình duyệt
    SELECT coalesce(jsonb_agg(b), '[]'::jsonb)
    INTO v_browsers
    FROM (
      SELECT
        coalesce(c.browser, 'other') AS name,
        count(c.id) AS count,
        round((count(c.id)::numeric / v_total_valid::numeric) * 100, 1) AS percentage
      FROM public.affiliate_links al
      JOIN public.clicks c ON c.link_id = al.id
      WHERE al.reseller_id = p_reseller_id
        AND c.is_bot = false AND c.is_valid = true
      GROUP BY c.browser
      ORDER BY count DESC
    ) b;
  END IF;

  RETURN jsonb_build_object(
    'total_valid_clicks', v_total_valid,
    'devices', v_devices,
    'operating_systems', v_os,
    'browsers', v_browsers
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Phân quyền thực thi các hàm RPC
GRANT EXECUTE ON FUNCTION public.get_reseller_overview_stats(uuid) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.get_reseller_click_timeseries(uuid, integer) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.get_reseller_top_campaigns(uuid, integer) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.get_reseller_device_stats(uuid) TO authenticated, service_role, anon;
