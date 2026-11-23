-- ==============================================================================
-- Migration: 20261117140000_tiktok_analytics_and_merchant_points.sql
-- Tasks:
--   - BE1-W6-03: Bảng reseller_tiktok_posts & Hàm tính Engagement Score
--   - BE1-W6-04: Hệ thống Gamification tích Điểm thưởng Merchant (merchant_points)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PHẦN 1: BẢNG reseller_tiktok_posts & TÍNH ĐIỂM TƯƠNG TÁC TIKTOK (BE1-W6-03)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.reseller_tiktok_posts (
  id                uuid                      NOT NULL DEFAULT extensions.uuid_generate_v4(),
  reseller_id       uuid                      NOT NULL REFERENCES public.resellers(id) ON DELETE CASCADE,
  campaign_id       uuid                      REFERENCES public.campaigns(id) ON DELETE SET NULL,
  content_id        uuid                      REFERENCES public.contents(id) ON DELETE SET NULL,
  tiktok_url        text                      NOT NULL,
  video_id          character varying(64),
  author_username   character varying(128),
  title             text,
  thumbnail_url     text,
  views_count       bigint                    NOT NULL DEFAULT 0,
  likes_count       bigint                    NOT NULL DEFAULT 0,
  comments_count    bigint                    NOT NULL DEFAULT 0,
  shares_count      bigint                    NOT NULL DEFAULT 0,
  engagement_score  numeric                   NOT NULL DEFAULT 0,
  status            character varying(32)     NOT NULL DEFAULT 'verified',
  metadata          jsonb                     NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at    timestamp with time zone  NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at        timestamp with time zone  NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at        timestamp with time zone  NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT reseller_tiktok_posts_pkey PRIMARY KEY (id),
  -- Ràng buộc chống nộp trùng một link TikTok cho cùng một Reseller
  CONSTRAINT uq_reseller_tiktok_url UNIQUE (reseller_id, tiktok_url)
);

-- Indexes tối ưu truy vấn bài đăng TikTok
CREATE INDEX IF NOT EXISTS idx_reseller_tiktok_posts_reseller ON public.reseller_tiktok_posts(reseller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reseller_tiktok_posts_campaign ON public.reseller_tiktok_posts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_reseller_tiktok_posts_engagement ON public.reseller_tiktok_posts(engagement_score DESC);

-- Hàm chuẩn hóa tính Engagement Score: Views*0.1 + Likes*1.0 + Comments*2.0 + Shares*3.0
CREATE OR REPLACE FUNCTION public.calculate_tiktok_engagement_score(
  p_views bigint,
  p_likes bigint,
  p_comments bigint,
  p_shares bigint
)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN ROUND(
    (COALESCE(p_views, 0) * 0.1) +
    (COALESCE(p_likes, 0) * 1.0) +
    (COALESCE(p_comments, 0) * 2.0) +
    (COALESCE(p_shares, 0) * 3.0),
    2
  );
END;
$$;

-- Trigger tự động cập nhật engagement_score mỗi khi insert/update
CREATE OR REPLACE FUNCTION public.trg_fn_calc_tiktok_engagement()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.engagement_score := public.calculate_tiktok_engagement_score(
    NEW.views_count,
    NEW.likes_count,
    NEW.comments_count,
    NEW.shares_count
  );
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_calc_tiktok_engagement ON public.reseller_tiktok_posts;
CREATE TRIGGER trg_calc_tiktok_engagement
BEFORE INSERT OR UPDATE ON public.reseller_tiktok_posts
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_calc_tiktok_engagement();

-- ------------------------------------------------------------------------------
-- PHẦN 2: HỆ THỐNG ĐIỂM THƯỞNG MERCHANT (GAMIFICATION POINTS - BE1-W6-04)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.merchant_points (
  id                            uuid                      NOT NULL DEFAULT extensions.uuid_generate_v4(),
  merchant_id                   uuid                      NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  points_balance                bigint                    NOT NULL DEFAULT 0,
  lifetime_points               bigint                    NOT NULL DEFAULT 0,
  tier                          character varying(32)     NOT NULL DEFAULT 'silver',
  platform_fee_discount_percent numeric                   NOT NULL DEFAULT 0.0,
  history                       jsonb                     NOT NULL DEFAULT '[]'::jsonb,
  created_at                    timestamp with time zone  NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at                    timestamp with time zone  NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT merchant_points_pkey PRIMARY KEY (id),
  CONSTRAINT uq_merchant_points_merchant UNIQUE (merchant_id)
);

CREATE INDEX IF NOT EXISTS idx_merchant_points_merchant ON public.merchant_points(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_points_balance ON public.merchant_points(points_balance DESC);

-- Stored Procedure: Tích điểm thưởng cho Merchant khi video tự tạo viral
CREATE OR REPLACE FUNCTION public.award_merchant_video_points(
  p_merchant_id uuid,
  p_content_id uuid,
  p_views bigint,
  p_likes bigint,
  p_comments bigint,
  p_shares bigint,
  p_reason text DEFAULT 'Quy đổi tương tác video viral'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_points_from_views bigint;
  v_points_from_likes bigint;
  v_points_from_comments bigint;
  v_points_from_shares bigint;
  v_total_earned bigint;
  v_current_balance bigint := 0;
  v_current_lifetime bigint := 0;
  v_new_balance bigint := 0;
  v_new_lifetime bigint := 0;
  v_new_tier varchar(32) := 'silver';
  v_new_discount numeric := 0.0;
  v_history_item jsonb;
  v_result jsonb;
BEGIN
  -- Quy tắc đổi điểm:
  -- Mỗi 1.000 views = 10 điểm
  -- Mỗi 100 likes = 15 điểm
  -- Mỗi 50 comments = 20 điểm
  -- Mỗi 20 shares = 25 điểm
  v_points_from_views := (COALESCE(p_views, 0) / 1000) * 10;
  v_points_from_likes := (COALESCE(p_likes, 0) / 100) * 15;
  v_points_from_comments := (COALESCE(p_comments, 0) / 50) * 20;
  v_points_from_shares := (COALESCE(p_shares, 0) / 20) * 25;

  v_total_earned := v_points_from_views + v_points_from_likes + v_points_from_comments + v_points_from_shares;
  
  -- Đảm bảo ít nhất 10 điểm động viên nếu có tương tác thực tế
  IF v_total_earned <= 0 AND (COALESCE(p_views, 0) > 100 OR COALESCE(p_likes, 0) > 10) THEN
    v_total_earned := 10;
  END IF;

  -- Lấy số dư hiện tại của Merchant
  SELECT points_balance, lifetime_points
  INTO v_current_balance, v_current_lifetime
  FROM public.merchant_points
  WHERE merchant_id = p_merchant_id;

  v_new_balance := COALESCE(v_current_balance, 0) + v_total_earned;
  v_new_lifetime := COALESCE(v_current_lifetime, 0) + v_total_earned;

  -- Nâng hạng thành viên (Tier Calculation):
  -- < 500 điểm: Silver (Chiết khấu phí sàn 0%)
  -- 500 - 2000 điểm: Gold (Chiết khấu phí sàn 1.0% + Boost hiển thị)
  -- > 2000 điểm: Diamond (Chiết khấu phí sàn 3.0% + Ưu tiên hiển thị đầu bảng tin Reseller)
  IF v_new_lifetime >= 2000 THEN
    v_new_tier := 'diamond';
    v_new_discount := 3.0;
  ELSIF v_new_lifetime >= 500 THEN
    v_new_tier := 'gold';
    v_new_discount := 1.0;
  ELSE
    v_new_tier := 'silver';
    v_new_discount := 0.0;
  END IF;

  v_history_item := jsonb_build_object(
    'id', extensions.uuid_generate_v4(),
    'timestamp', timezone('utc'::text, now()),
    'earned_points', v_total_earned,
    'reason', p_reason,
    'content_id', p_content_id,
    'stats_snapshot', jsonb_build_object(
      'views', p_views,
      'likes', p_likes,
      'comments', p_comments,
      'shares', p_shares
    )
  );

  -- Cập nhật hoặc chèn mới vào merchant_points
  INSERT INTO public.merchant_points (
    merchant_id,
    points_balance,
    lifetime_points,
    tier,
    platform_fee_discount_percent,
    history,
    updated_at
  ) VALUES (
    p_merchant_id,
    v_new_balance,
    v_new_lifetime,
    v_new_tier,
    v_new_discount,
    jsonb_build_array(v_history_item),
    timezone('utc'::text, now())
  )
  ON CONFLICT (merchant_id) DO UPDATE SET
    points_balance = v_new_balance,
    lifetime_points = v_new_lifetime,
    tier = v_new_tier,
    platform_fee_discount_percent = v_new_discount,
    history = public.merchant_points.history || jsonb_build_array(v_history_item),
    updated_at = timezone('utc'::text, now());

  v_result := jsonb_build_object(
    'success', true,
    'merchant_id', p_merchant_id,
    'earned_points', v_total_earned,
    'points_balance', v_new_balance,
    'lifetime_points', v_new_lifetime,
    'tier', v_new_tier,
    'platform_fee_discount_percent', v_new_discount,
    'message', format('Đã cộng thành công %s điểm thưởng cho đối tác.', v_total_earned)
  );

  RETURN v_result;
END;
$$;

-- Stored Procedure: Lấy báo cáo ví điểm thưởng Merchant
CREATE OR REPLACE FUNCTION public.get_merchant_points_summary(p_merchant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row record;
  v_result jsonb;
BEGIN
  SELECT *
  INTO v_row
  FROM public.merchant_points
  WHERE merchant_id = p_merchant_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'merchant_id', p_merchant_id,
      'points_balance', 0,
      'lifetime_points', 0,
      'tier', 'silver',
      'platform_fee_discount_percent', 0.0,
      'tier_benefits', jsonb_build_object(
        'fee_discount', '0%',
        'visibility_priority', 'Standard',
        'badge', 'Thành viên Bạc'
      ),
      'history', '[]'::jsonb
    );
  END IF;

  RETURN jsonb_build_object(
    'merchant_id', v_row.merchant_id,
    'points_balance', v_row.points_balance,
    'lifetime_points', v_row.lifetime_points,
    'tier', v_row.tier,
    'platform_fee_discount_percent', v_row.platform_fee_discount_percent,
    'tier_benefits', jsonb_build_object(
      'fee_discount', format('%s%%', v_row.platform_fee_discount_percent),
      'visibility_priority', CASE 
        WHEN v_row.tier = 'diamond' THEN 'Top 1 Bảng Tin Reseller (Ưu Tiên Tối Đa)'
        WHEN v_row.tier = 'gold' THEN 'Ưu Tiên Đề Xuất Nổi Bật'
        ELSE 'Tiêu chuẩn'
      END,
      'badge', CASE 
        WHEN v_row.tier = 'diamond' THEN 'Đối Tác Kim Cương'
        WHEN v_row.tier = 'gold' THEN 'Đối Tác Vàng'
        ELSE 'Đối Tác Bạc'
      END
    ),
    'history', v_row.history
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- PHẦN 3: PHÂN QUYỀN VÀ RLS POLICIES
-- ------------------------------------------------------------------------------

ALTER TABLE public.reseller_tiktok_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select reseller_tiktok_posts" ON public.reseller_tiktok_posts;
CREATE POLICY "Allow select reseller_tiktok_posts"
ON public.reseller_tiktok_posts FOR SELECT
TO authenticated, anon
USING (true);

DROP POLICY IF EXISTS "Allow insert reseller_tiktok_posts" ON public.reseller_tiktok_posts;
CREATE POLICY "Allow insert reseller_tiktok_posts"
ON public.reseller_tiktok_posts FOR ALL
TO authenticated, anon
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select merchant_points" ON public.merchant_points;
CREATE POLICY "Allow select merchant_points"
ON public.merchant_points FOR SELECT
TO authenticated, anon
USING (true);

DROP POLICY IF EXISTS "Allow manage merchant_points" ON public.merchant_points;
CREATE POLICY "Allow manage merchant_points"
ON public.merchant_points FOR ALL
TO authenticated, anon
USING (true)
WITH CHECK (true);

GRANT ALL ON public.reseller_tiktok_posts TO authenticated, anon, service_role;
GRANT ALL ON public.merchant_points TO authenticated, anon, service_role;
