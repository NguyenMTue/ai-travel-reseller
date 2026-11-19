-- Engagement Score is a percentage rate calculated from the same metric snapshot.
ALTER TABLE public.tiktok_video_posts
  ADD COLUMN IF NOT EXISTS engagement_score NUMERIC(10, 4) NOT NULL DEFAULT 0
  CHECK (engagement_score >= 0);

ALTER TABLE public.tiktok_video_metric_snapshots
  ADD COLUMN IF NOT EXISTS engagement_score NUMERIC(10, 4) NOT NULL DEFAULT 0
  CHECK (engagement_score >= 0);
