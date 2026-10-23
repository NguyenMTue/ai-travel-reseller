-- Allow merchants to insert and manage contents for their own campaigns
DROP POLICY IF EXISTS "Allow merchants to manage contents for their campaigns" ON public.contents;

CREATE POLICY "Allow merchants to manage contents for their campaigns"
ON public.contents FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE campaigns.id = contents.campaign_id
      AND campaigns.merchant_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE campaigns.id = contents.campaign_id
      AND campaigns.merchant_id = auth.uid()
  )
);
