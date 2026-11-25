-- Migration: 20261124150000_fraud_audit_logs.sql
-- Description: Audit log table for anti-fraud dismissal actions by Super Admin

CREATE TABLE IF NOT EXISTS public.fraud_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL DEFAULT 'dismiss_flag',
  reason TEXT NOT NULL,
  previous_status TEXT NOT NULL DEFAULT 'flagged_self_purchase',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.fraud_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Super Admin & Service Role can access fraud logs
DROP POLICY IF EXISTS "Admin only access fraud logs" ON public.fraud_audit_logs;
CREATE POLICY "Admin only access fraud logs" ON public.fraud_audit_logs
  FOR ALL USING (
    (auth.jwt() ->> 'role') = 'service_role' OR 
    (auth.jwt() ->> 'email') LIKE '%@travellink.ai' OR
    EXISTS (
      SELECT 1 FROM public.admins WHERE id = auth.uid()
    )
  );

-- Indexes for audit query performance
CREATE INDEX IF NOT EXISTS idx_fraud_audit_logs_order_id ON public.fraud_audit_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_fraud_audit_logs_created_at ON public.fraud_audit_logs(created_at DESC);
