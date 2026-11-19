-- Merchant TikTok interaction points.
-- Apply after the TikTok metrics tables exist:
--   public.tiktok_video_posts
--   public.tiktok_video_metric_snapshots
--
-- The first snapshot for a post establishes a baseline and earns no points.
-- Later snapshots award points only for positive metric deltas, once per snapshot.
-- This is a points ledger; it does not change orders, commissions, or payouts.

ALTER TABLE public.tiktok_video_posts
  ADD COLUMN IF NOT EXISTS points_baseline_set BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS points_view_watermark BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS points_like_watermark BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS points_comment_watermark BIGINT NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tiktok_video_posts_points_watermarks_nonnegative'
  ) THEN
    ALTER TABLE public.tiktok_video_posts
      ADD CONSTRAINT tiktok_video_posts_points_watermarks_nonnegative
      CHECK (
        points_view_watermark >= 0 AND
        points_like_watermark >= 0 AND
        points_comment_watermark >= 0
      );
  END IF;
END;
$$;

-- Initial values are placeholders, deliberately inactive until the team approves
-- the earning rates and enables the rule in a controlled admin process.
CREATE TABLE IF NOT EXISTS public.merchant_tiktok_point_rules (
  id SMALLINT PRIMARY KEY CHECK (id = 1),
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  points_per_100_views INTEGER NOT NULL DEFAULT 1 CHECK (points_per_100_views >= 0),
  points_per_like INTEGER NOT NULL DEFAULT 1 CHECK (points_per_like >= 0),
  points_per_comment INTEGER NOT NULL DEFAULT 3 CHECK (points_per_comment >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.merchant_tiktok_point_rules (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.merchant_points_balances (
  merchant_id UUID PRIMARY KEY REFERENCES public.merchants(id) ON DELETE CASCADE,
  points_balance BIGINT NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.merchant_points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE RESTRICT,
  post_id UUID REFERENCES public.tiktok_video_posts(id) ON DELETE SET NULL,
  source_snapshot_id UUID REFERENCES public.tiktok_video_metric_snapshots(id) ON DELETE SET NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'tiktok_metrics',
  views_delta BIGINT NOT NULL DEFAULT 0 CHECK (views_delta >= 0),
  likes_delta BIGINT NOT NULL DEFAULT 0 CHECK (likes_delta >= 0),
  comments_delta BIGINT NOT NULL DEFAULT 0 CHECK (comments_delta >= 0),
  view_points BIGINT NOT NULL DEFAULT 0 CHECK (view_points >= 0),
  like_points BIGINT NOT NULL DEFAULT 0 CHECK (like_points >= 0),
  comment_points BIGINT NOT NULL DEFAULT 0 CHECK (comment_points >= 0),
  points_delta BIGINT NOT NULL CHECK (points_delta > 0),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT merchant_points_ledger_points_components_match
    CHECK (points_delta = view_points + like_points + comment_points)
);

CREATE INDEX IF NOT EXISTS idx_merchant_points_ledger_merchant_created
  ON public.merchant_points_ledger (merchant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_merchant_points_ledger_post_created
  ON public.merchant_points_ledger (post_id, created_at DESC);

ALTER TABLE public.merchant_tiktok_point_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_points_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_points_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Merchants can read their points balance" ON public.merchant_points_balances;
CREATE POLICY "Merchants can read their points balance"
  ON public.merchant_points_balances
  FOR SELECT TO authenticated
  USING (merchant_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Merchants can read their points ledger" ON public.merchant_points_ledger;
CREATE POLICY "Merchants can read their points ledger"
  ON public.merchant_points_ledger
  FOR SELECT TO authenticated
  USING (merchant_id = (SELECT auth.uid()));

REVOKE ALL ON TABLE public.merchant_tiktok_point_rules FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.merchant_points_balances FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.merchant_points_ledger FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.merchant_points_balances TO authenticated;
GRANT SELECT ON TABLE public.merchant_points_ledger TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.merchant_tiktok_point_rules TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.merchant_points_balances TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.merchant_points_ledger TO service_role;

CREATE OR REPLACE FUNCTION public.fn_award_merchant_tiktok_points_from_snapshot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_content_id UUID;
  v_view_watermark BIGINT;
  v_like_watermark BIGINT;
  v_comment_watermark BIGINT;
  v_baseline_set BOOLEAN;
  v_campaign_merchant_id UUID;
  v_product_merchant_id UUID;
  v_merchant_id UUID;
  v_rules public.merchant_tiktok_point_rules%ROWTYPE;
  v_views_delta BIGINT;
  v_likes_delta BIGINT;
  v_comments_delta BIGINT;
  v_view_points BIGINT;
  v_like_points BIGINT;
  v_comment_points BIGINT;
  v_points_delta BIGINT;
  v_inserted_ledger_id UUID;
BEGIN
  -- Serialize snapshots for a post so concurrent syncs cannot award the same delta.
  SELECT p.content_id,
         p.points_baseline_set,
         p.points_view_watermark,
         p.points_like_watermark,
         p.points_comment_watermark
    INTO v_content_id,
         v_baseline_set,
         v_view_watermark,
         v_like_watermark,
         v_comment_watermark
    FROM public.tiktok_video_posts AS p
   WHERE p.id = NEW.post_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- First observation is only a baseline; do not grant lifetime back-pay.
  IF NOT v_baseline_set THEN
    UPDATE public.tiktok_video_posts
       SET points_baseline_set = TRUE,
           points_view_watermark = GREATEST(v_view_watermark, NEW.views),
           points_like_watermark = GREATEST(v_like_watermark, NEW.likes),
           points_comment_watermark = GREATEST(v_comment_watermark, NEW.comments)
     WHERE id = NEW.post_id;
    RETURN NEW;
  END IF;

  v_views_delta := GREATEST(NEW.views - v_view_watermark, 0);
  v_likes_delta := GREATEST(NEW.likes - v_like_watermark, 0);
  v_comments_delta := GREATEST(NEW.comments - v_comment_watermark, 0);

  -- High-water marks never move backward when provider metrics are corrected.
  UPDATE public.tiktok_video_posts
     SET points_view_watermark = GREATEST(v_view_watermark, NEW.views),
         points_like_watermark = GREATEST(v_like_watermark, NEW.likes),
         points_comment_watermark = GREATEST(v_comment_watermark, NEW.comments)
   WHERE id = NEW.post_id;

  SELECT * INTO v_rules
    FROM public.merchant_tiktok_point_rules
   WHERE id = 1;

  -- Resolve merchant from trusted content attribution, not from incoming metrics.
  IF v_content_id IS NOT NULL THEN
    SELECT c.merchant_id, pr.merchant_id
      INTO v_campaign_merchant_id, v_product_merchant_id
      FROM public.contents AS content
      LEFT JOIN public.campaigns AS c ON c.id = content.campaign_id
      LEFT JOIN public.products AS pr ON pr.id = content.product_id
     WHERE content.id = v_content_id;

    IF v_campaign_merchant_id IS NOT NULL
       AND v_product_merchant_id IS NOT NULL
       AND v_campaign_merchant_id <> v_product_merchant_id THEN
      -- Conflicting attribution fails closed: advance watermarks but award nothing.
      RETURN NEW;
    END IF;

    v_merchant_id := COALESCE(v_campaign_merchant_id, v_product_merchant_id);
  END IF;

  -- Inactive/missing rules or unresolved ownership do not accumulate retroactive points.
  IF NOT COALESCE(v_rules.is_active, FALSE) OR v_merchant_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_view_points := GREATEST(
    (NEW.views / 100) - (v_view_watermark / 100),
    0
  ) * v_rules.points_per_100_views;
  v_like_points := v_likes_delta * v_rules.points_per_like;
  v_comment_points := v_comments_delta * v_rules.points_per_comment;
  v_points_delta := v_view_points + v_like_points + v_comment_points;

  IF v_points_delta <= 0 THEN
    RETURN NEW;
  END IF;

  -- A unique key per source snapshot makes ledger insertion idempotent.
  INSERT INTO public.merchant_points_ledger (
    merchant_id,
    post_id,
    source_snapshot_id,
    idempotency_key,
    views_delta,
    likes_delta,
    comments_delta,
    view_points,
    like_points,
    comment_points,
    points_delta,
    metadata
  ) VALUES (
    v_merchant_id,
    NEW.post_id,
    NEW.id,
    'tiktok-snapshot:' || NEW.id::TEXT,
    v_views_delta,
    v_likes_delta,
    v_comments_delta,
    v_view_points,
    v_like_points,
    v_comment_points,
    v_points_delta,
    jsonb_build_object(
      'views_total', NEW.views,
      'likes_total', NEW.likes,
      'comments_total', NEW.comments,
      'formula_version', 1
    )
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_inserted_ledger_id;

  -- Balance changes only when a new ledger row was actually inserted.
  IF v_inserted_ledger_id IS NOT NULL THEN
    INSERT INTO public.merchant_points_balances (merchant_id, points_balance, updated_at)
    VALUES (v_merchant_id, v_points_delta, now())
    ON CONFLICT (merchant_id) DO UPDATE
       SET points_balance = public.merchant_points_balances.points_balance + EXCLUDED.points_balance,
           updated_at = now();
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_award_merchant_tiktok_points_from_snapshot() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_award_merchant_tiktok_points_from_snapshot() TO service_role;

DROP TRIGGER IF EXISTS trg_award_merchant_tiktok_points ON public.tiktok_video_metric_snapshots;
CREATE TRIGGER trg_award_merchant_tiktok_points
  AFTER INSERT ON public.tiktok_video_metric_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_award_merchant_tiktok_points_from_snapshot();

COMMENT ON TABLE public.merchant_tiktok_point_rules IS
  'Single-row configurable TikTok interaction point rules; starts inactive until rates are approved.';
COMMENT ON TABLE public.merchant_points_balances IS
  'Current Merchant points balance, maintained atomically from the points ledger.';
COMMENT ON TABLE public.merchant_points_ledger IS
  'Append-oriented history of earned Merchant points; separate from cash commissions and payouts.';
COMMENT ON FUNCTION public.fn_award_merchant_tiktok_points_from_snapshot() IS
  'Awards points for positive TikTok metric deltas after each post baseline; serializes per post and deduplicates by snapshot id.';
