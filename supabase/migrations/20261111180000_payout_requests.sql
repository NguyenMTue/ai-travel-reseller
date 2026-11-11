-- ==============================================================================
-- MIGRATION: 20261111180000_payout_requests.sql
-- SPRINT FINAL: QUY TRÌNH YÊU CẦU RÚT TIỀN HOA HỒNG VÍ RESELLER (TASK BE1-03)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID NOT NULL REFERENCES public.resellers(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 100000),
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_payout_requests_status CHECK (status IN ('pending', 'processing', 'completed', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_payout_requests_reseller_id ON public.payout_requests(reseller_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON public.payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_payout_requests_created_at ON public.payout_requests(created_at DESC);

-- Bật Row Level Security (RLS) bảo vệ tài sản Reseller
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reseller view own payout requests" ON public.payout_requests;
CREATE POLICY "Reseller view own payout requests"
  ON public.payout_requests
  FOR SELECT
  USING (reseller_id = auth.uid());

DROP POLICY IF EXISTS "Reseller insert own payout request" ON public.payout_requests;
CREATE POLICY "Reseller insert own payout request"
  ON public.payout_requests
  FOR INSERT
  WITH CHECK (reseller_id = auth.uid());
