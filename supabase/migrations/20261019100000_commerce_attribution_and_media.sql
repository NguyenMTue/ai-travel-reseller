-- ==============================================================================
-- Migration: 20261019100000_commerce_attribution_and_media.sql
-- Mục tiêu Sprint 3 (Tuần 3: 19/10/2026 – 24/10/2026):
-- 1. BE1-W3-05: Gỡ bỏ nợ kỹ thuật trigger hòa giải tạm thời của Tuần 2 (fn_temp_contents_reconcile).
-- 2. BE1-W3-01: Nâng cấp bảng orders và tạo bảng commissions (Order Attribution & Commission Ledger).
-- 3. BE1-W3-02: Tạo bảng media_references phục vụ Merchant Video Library.
-- 4. Thiết lập Index tối ưu hóa truy vấn và RLS Policies bảo mật đa người dùng.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PHẦN 1: GỠ BỎ NỢ KỸ THUẬT TUẦN 2 (BE1-W3-05)
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_temp_contents_reconcile ON public.contents;
DROP FUNCTION IF EXISTS public.fn_temp_contents_reconcile();

-- ------------------------------------------------------------------------------
-- PHẦN 2: NÂNG CẤP BẢNG ORDERS (BE1-W3-01)
-- ------------------------------------------------------------------------------
-- Bổ sung các trường Attribution, phân bổ hoa hồng, thông tin khách hàng và cờ chống gian lận
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS click_id UUID REFERENCES public.clicks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS gross_commission NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS platform_fee NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reseller_commission NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'VND',
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS flag_self_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

-- Đảm bảo trạng thái đơn hàng tuân thủ state machine
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_orders_status_valid'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT chk_orders_status_valid
      CHECK (status IS NULL OR status IN ('pending', 'confirmed', 'paid', 'cancelled', 'refunded'));
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- PHẦN 3: TẠO BẢNG COMMISSIONS (SỔ CÁI HOA HỒNG - BE1-W3-01)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.commissions (
  id                  UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  order_id            UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  reseller_id         UUID NOT NULL REFERENCES public.resellers(id) ON DELETE CASCADE,
  merchant_id         UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  campaign_id         UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  gross_amount        NUMERIC NOT NULL DEFAULT 0,
  platform_fee        NUMERIC NOT NULL DEFAULT 0,
  net_amount          NUMERIC NOT NULL DEFAULT 0,
  status              VARCHAR(32) NOT NULL DEFAULT 'pending',
  payout_id           UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_commissions_status CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled', 'refunded'))
);

-- ------------------------------------------------------------------------------
-- PHẦN 4: TẠO BẢNG MEDIA_REFERENCES (MERCHANT VIDEO LIBRARY - BE1-W3-02)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.media_references (
  id                  UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  merchant_id         UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  title               VARCHAR(255) NOT NULL,
  video_url           TEXT NOT NULL,
  thumbnail_url       TEXT,
  platform            VARCHAR(32) NOT NULL DEFAULT 'upload',
  duration            INTEGER,
  style_tags          TEXT[] NOT NULL DEFAULT '{}',
  analysis_metadata   JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_media_references_platform CHECK (platform IN ('upload', 'tiktok', 'reels', 'youtube_shorts', 'youtube', 'other'))
);

-- ------------------------------------------------------------------------------
-- PHẦN 5: TẠO INDEXES TỐI ƯU HÓA HIỆU NĂNG
-- ------------------------------------------------------------------------------
-- Indexes cho orders
CREATE INDEX IF NOT EXISTS idx_orders_reseller_status ON public.orders(reseller_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_merchant_status ON public.orders(merchant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_click_id ON public.orders(click_id);
CREATE INDEX IF NOT EXISTS idx_orders_campaign_id ON public.orders(campaign_id);
CREATE INDEX IF NOT EXISTS idx_orders_booking_ref ON public.orders(booking_reference);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Indexes cho commissions
CREATE INDEX IF NOT EXISTS idx_commissions_reseller_status ON public.commissions(reseller_id, status);
CREATE INDEX IF NOT EXISTS idx_commissions_merchant_status ON public.commissions(merchant_id, status);
CREATE INDEX IF NOT EXISTS idx_commissions_order_id ON public.commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_commissions_created_at ON public.commissions(created_at DESC);

-- Indexes cho media_references
CREATE INDEX IF NOT EXISTS idx_media_references_merchant_id ON public.media_references(merchant_id);
CREATE INDEX IF NOT EXISTS idx_media_references_created_at ON public.media_references(created_at DESC);

-- ------------------------------------------------------------------------------
-- PHẦN 6: TRIGGER TỰ ĐỘNG CẬP NHẬT UPDATED_AT
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_commissions_updated_at ON public.commissions;
CREATE TRIGGER trg_commissions_updated_at
BEFORE UPDATE ON public.commissions
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_media_references_updated_at ON public.media_references;
CREATE TRIGGER trg_media_references_updated_at
BEFORE UPDATE ON public.media_references
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_updated_at();

-- ------------------------------------------------------------------------------
-- PHẦN 7: ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_references ENABLE ROW LEVEL SECURITY;

-- Cấp quyền schema cho các role chuẩn của Supabase
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Policies cho orders
DROP POLICY IF EXISTS "Allow merchants to view their orders" ON public.orders;
CREATE POLICY "Allow merchants to view their orders" 
ON public.orders FOR SELECT 
USING (merchant_id = auth.uid());

DROP POLICY IF EXISTS "Allow resellers to view their orders" ON public.orders;
CREATE POLICY "Allow resellers to view their orders" 
ON public.orders FOR SELECT 
USING (reseller_id = auth.uid());

-- Policies cho commissions
DROP POLICY IF EXISTS "Allow resellers to view their commissions" ON public.commissions;
CREATE POLICY "Allow resellers to view their commissions"
ON public.commissions FOR SELECT
USING (reseller_id = auth.uid());

DROP POLICY IF EXISTS "Allow merchants to view their commissions" ON public.commissions;
CREATE POLICY "Allow merchants to view their commissions"
ON public.commissions FOR SELECT
USING (merchant_id = auth.uid());

-- Policies cho media_references
DROP POLICY IF EXISTS "Allow public read access to media_references" ON public.media_references;
CREATE POLICY "Allow public read access to media_references"
ON public.media_references FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow merchants to manage their own media_references" ON public.media_references;
CREATE POLICY "Allow merchants to manage their own media_references"
ON public.media_references FOR ALL
USING (merchant_id = auth.uid())
WITH CHECK (merchant_id = auth.uid());
