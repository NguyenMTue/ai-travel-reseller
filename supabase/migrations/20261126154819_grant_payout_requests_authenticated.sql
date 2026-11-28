-- Grant SELECT and INSERT on public.payout_requests to authenticated role
-- so Resellers can read and create their own payout requests under RLS.
GRANT SELECT, INSERT ON public.payout_requests TO authenticated;
