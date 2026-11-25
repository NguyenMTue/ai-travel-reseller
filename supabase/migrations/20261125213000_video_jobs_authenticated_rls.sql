-- Allow authenticated merchants to insert & update their own video_jobs
DROP POLICY IF EXISTS "Merchants can insert own video jobs" ON public.video_jobs;
CREATE POLICY "Merchants can insert own video jobs"
  ON public.video_jobs
  FOR INSERT TO authenticated
  WITH CHECK (merchant_id = auth.uid());

DROP POLICY IF EXISTS "Merchants can update own video jobs" ON public.video_jobs;
CREATE POLICY "Merchants can update own video jobs"
  ON public.video_jobs
  FOR UPDATE TO authenticated
  USING (merchant_id = auth.uid())
  WITH CHECK (merchant_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON TABLE public.video_jobs TO authenticated;
