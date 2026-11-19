-- Official TikTok video metrics tracking for videos owned by the connected creator.
CREATE TABLE IF NOT EXISTS public.tiktok_video_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID NOT NULL REFERENCES public.resellers(id) ON DELETE CASCADE,
  content_id UUID REFERENCES public.contents(id) ON DELETE SET NULL,
  tiktok_video_id TEXT NOT NULL,
  video_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  latest_views BIGINT,
  latest_likes BIGINT,
  latest_comments BIGINT,
  latest_shares BIGINT,
  last_synced_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tiktok_video_posts_status_check
    CHECK (status IN ('pending', 'active', 'needs_attention', 'paused')),
  CONSTRAINT tiktok_video_posts_metrics_nonnegative_check
    CHECK (
      (latest_views IS NULL OR latest_views >= 0) AND
      (latest_likes IS NULL OR latest_likes >= 0) AND
      (latest_comments IS NULL OR latest_comments >= 0) AND
      (latest_shares IS NULL OR latest_shares >= 0)
    ),
  CONSTRAINT tiktok_video_posts_failure_count_check CHECK (failure_count >= 0),
  CONSTRAINT tiktok_video_posts_reseller_video_key UNIQUE (reseller_id, tiktok_video_id)
);

CREATE TABLE IF NOT EXISTS public.tiktok_video_metric_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.tiktok_video_posts(id) ON DELETE CASCADE,
  views BIGINT NOT NULL CHECK (views >= 0),
  likes BIGINT NOT NULL CHECK (likes >= 0),
  comments BIGINT NOT NULL CHECK (comments >= 0),
  shares BIGINT NOT NULL CHECK (shares >= 0),
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tiktok_video_posts_due
  ON public.tiktok_video_posts (next_sync_at, created_at)
  WHERE status IN ('pending', 'active');
CREATE INDEX IF NOT EXISTS idx_tiktok_video_posts_reseller
  ON public.tiktok_video_posts (reseller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tiktok_video_snapshots_post_observed
  ON public.tiktok_video_metric_snapshots (post_id, observed_at DESC);

ALTER TABLE public.tiktok_video_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiktok_video_metric_snapshots ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.tiktok_video_posts FROM anon, authenticated;
REVOKE ALL ON TABLE public.tiktok_video_metric_snapshots FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tiktok_video_posts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tiktok_video_metric_snapshots TO service_role;

DROP TRIGGER IF EXISTS trg_tiktok_video_posts_updated_at ON public.tiktok_video_posts;
CREATE TRIGGER trg_tiktok_video_posts_updated_at
BEFORE UPDATE ON public.tiktok_video_posts
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
