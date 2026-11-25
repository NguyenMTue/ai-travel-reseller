-- ==============================================================================
-- Migration: 20261125210000_video_jobs_and_product_highlights.sql
-- Purpose:
--   1. Add `highlights` (jsonb) to `public.products` to store authentic_tips
--   2. Add `logo_url` (text) to `public.merchants`
--   3. Create `public.video_jobs` queue table for decoupled FFmpeg rendering
-- ==============================================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS highlights jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.merchants
  ADD COLUMN IF NOT EXISTS logo_url text;

CREATE TABLE IF NOT EXISTS public.video_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
  merchant_id uuid REFERENCES public.merchants(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'done', 'failed')),
  progress integer NOT NULL DEFAULT 10,
  step text NOT NULL DEFAULT 'Đang chờ xử lý trong hàng đợi',
  script_json jsonb,
  input_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  video_url text,
  content_id uuid REFERENCES public.contents(id) ON DELETE SET NULL,
  duration_sec integer,
  warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_video_jobs_status_created
  ON public.video_jobs (status, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_video_jobs_campaign
  ON public.video_jobs (campaign_id, created_at DESC);

ALTER TABLE public.video_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Merchants can read own video jobs" ON public.video_jobs;
CREATE POLICY "Merchants can read own video jobs"
  ON public.video_jobs
  FOR SELECT TO authenticated
  USING (merchant_id = auth.uid());

GRANT SELECT ON TABLE public.video_jobs TO authenticated;
GRANT ALL ON TABLE public.video_jobs TO service_role;
