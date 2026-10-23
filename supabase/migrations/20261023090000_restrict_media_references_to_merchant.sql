-- Migration: Restrict media_references SELECT to owner merchant only (private per merchant)
DROP POLICY IF EXISTS "Allow public read access to media_references" ON public.media_references;
DROP POLICY IF EXISTS "Allow merchants to view their own media_references" ON public.media_references;
CREATE POLICY "Allow merchants to view their own media_references"
ON public.media_references FOR SELECT
USING (merchant_id = auth.uid());
