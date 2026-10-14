-- Keep route-role checks out of the request-time database path. Supabase Auth
-- adds this claim only after deriving it from the trusted role tables.
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
DECLARE
  user_id uuid := (event ->> 'user_id')::uuid;
  is_merchant boolean;
  is_reseller boolean;
  resolved_role text;
  claims jsonb;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.merchants WHERE id = user_id),
         EXISTS (SELECT 1 FROM public.resellers WHERE id = user_id)
    INTO is_merchant, is_reseller;

  resolved_role := CASE
    WHEN is_merchant AND NOT is_reseller THEN 'merchant'
    WHEN is_reseller AND NOT is_merchant THEN 'reseller'
    ELSE NULL
  END;

  claims := event -> 'claims';
  claims := jsonb_set(claims, '{user_role}', COALESCE(to_jsonb(resolved_role), 'null'::jsonb), true);
  RETURN jsonb_set(event, '{claims}', claims, true);
END;
$$;

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT SELECT (id) ON TABLE public.merchants, public.resellers TO supabase_auth_admin;
DROP POLICY IF EXISTS "Auth hook reads role IDs" ON public.merchants;
CREATE POLICY "Auth hook reads role IDs" ON public.merchants
  FOR SELECT TO supabase_auth_admin USING (true);
DROP POLICY IF EXISTS "Auth hook reads role IDs" ON public.resellers;
CREATE POLICY "Auth hook reads role IDs" ON public.resellers
  FOR SELECT TO supabase_auth_admin USING (true);
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM PUBLIC, anon, authenticated;

-- Reseller campaign cards need only merchant identity and display name.
CREATE OR REPLACE VIEW public.merchant_public_profiles
WITH (security_invoker = false) AS
SELECT id, name FROM public.merchants;
REVOKE ALL ON public.merchant_public_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.merchant_public_profiles TO authenticated;

-- Remove the historical blanket CRUD grants and explicitly grant each client
-- role only the operations used by the application.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.merchant_public_profiles TO authenticated;

GRANT SELECT ON public.merchants, public.resellers TO authenticated;
GRANT SELECT, INSERT ON public.products, public.campaigns TO authenticated;
GRANT SELECT ON public.contents, public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_accounts TO authenticated;
GRANT SELECT ON public.tracking_events TO authenticated;
GRANT SELECT, INSERT ON public.affiliate_links TO authenticated;
GRANT SELECT ON public.clicks TO authenticated;

-- Role/profile tables: no anonymous reads; signed-in users can inspect only
-- their own role row. Public merchant names go through the narrow view above.
DROP POLICY IF EXISTS "Allow public read access to merchants" ON public.merchants;
DROP POLICY IF EXISTS "Allow merchants to update their own profile" ON public.merchants;
CREATE POLICY "Users read own merchant role" ON public.merchants
  FOR SELECT TO authenticated USING (id = (SELECT auth.uid()));
DROP POLICY IF EXISTS "Allow public read access to resellers" ON public.resellers;
DROP POLICY IF EXISTS "Allow resellers to update their own profile" ON public.resellers;
CREATE POLICY "Users read own reseller role" ON public.resellers
  FOR SELECT TO authenticated USING (id = (SELECT auth.uid()));

-- Authenticated marketplace access only; merchant write policies are owner-bound.
DROP POLICY IF EXISTS "Allow public read access to products" ON public.products;
DROP POLICY IF EXISTS "Allow merchants to manage their own products" ON public.products;
CREATE POLICY "Authenticated read active products" ON public.products
  FOR SELECT TO authenticated USING (status = 'active' OR merchant_id = (SELECT auth.uid()));
CREATE POLICY "Merchants manage own products" ON public.products
  FOR ALL TO authenticated
  USING (merchant_id = (SELECT auth.uid()))
  WITH CHECK (merchant_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Allow public read access to campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Allow merchants to manage their own campaigns" ON public.campaigns;
CREATE POLICY "Authenticated read active campaigns" ON public.campaigns
  FOR SELECT TO authenticated USING (status = 'active' OR merchant_id = (SELECT auth.uid()));
CREATE POLICY "Merchants manage own campaigns" ON public.campaigns
  FOR ALL TO authenticated
  USING (merchant_id = (SELECT auth.uid()))
  WITH CHECK (merchant_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Allow public read access to contents" ON public.contents;
DROP POLICY IF EXISTS "Allow resellers to manage their own contents" ON public.contents;
CREATE POLICY "Authenticated read approved or owned campaign content" ON public.contents
  FOR SELECT TO authenticated
  USING (
    status = 'approved'
    OR reseller_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = contents.campaign_id
        AND campaigns.merchant_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Allow public read access to social_accounts" ON public.social_accounts;
DROP POLICY IF EXISTS "Allow resellers to manage their own social accounts" ON public.social_accounts;
CREATE POLICY "Resellers manage own social accounts" ON public.social_accounts
  FOR ALL TO authenticated
  USING (reseller_id = (SELECT auth.uid()))
  WITH CHECK (reseller_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Allow resellers to read their own tracking events" ON public.tracking_events;
DROP POLICY IF EXISTS "Allow merchants to read their product tracking events" ON public.tracking_events;
CREATE POLICY "Users read own tracking events" ON public.tracking_events
  FOR SELECT TO authenticated
  USING (
    reseller_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = tracking_events.product_id
        AND products.merchant_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Allow merchants to view their orders" ON public.orders;
DROP POLICY IF EXISTS "Allow resellers to view their orders" ON public.orders;
CREATE POLICY "Users read own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (merchant_id = (SELECT auth.uid()) OR reseller_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Allow public read active affiliate_links" ON public.affiliate_links;
DROP POLICY IF EXISTS "Allow resellers to view own affiliate_links" ON public.affiliate_links;
DROP POLICY IF EXISTS "Allow resellers to insert own affiliate_links" ON public.affiliate_links;
DROP POLICY IF EXISTS "Allow merchants to view their affiliate_links" ON public.affiliate_links;
CREATE POLICY "Resellers read own tracking links" ON public.affiliate_links
  FOR SELECT TO authenticated USING (reseller_id = (SELECT auth.uid()));
CREATE POLICY "Resellers insert own tracking links" ON public.affiliate_links
  FOR INSERT TO authenticated WITH CHECK (reseller_id = (SELECT auth.uid()));
CREATE POLICY "Merchants read links for own products" ON public.affiliate_links
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = affiliate_links.product_id
        AND products.merchant_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Allow public insert to clicks" ON public.clicks;
DROP POLICY IF EXISTS "Allow resellers to view clicks" ON public.clicks;
DROP POLICY IF EXISTS "Allow merchants to view clicks" ON public.clicks;
CREATE POLICY "Resellers read clicks for own links" ON public.clicks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.affiliate_links
      WHERE affiliate_links.id = clicks.link_id
        AND affiliate_links.reseller_id = (SELECT auth.uid())
    )
  );
CREATE POLICY "Merchants read clicks for own products" ON public.clicks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.affiliate_links
      JOIN public.products ON products.id = affiliate_links.product_id
      WHERE affiliate_links.id = clicks.link_id
        AND products.merchant_id = (SELECT auth.uid())
    )
  );

-- Trigger functions execute through their triggers, not as callable client APIs.
REVOKE EXECUTE ON FUNCTION public.increment_affiliate_link_clicks() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_campaign_to_n8n() FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.increment_affiliate_link_clicks() SET search_path = pg_catalog, public;
ALTER FUNCTION public.trigger_campaign_to_n8n() SET search_path = pg_catalog, public, extensions, net;

-- The AI API calls this RPC with its server-side service role client.
REVOKE EXECUTE ON FUNCTION public.match_product_embeddings(extensions.vector, integer, double precision, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_product_embeddings(extensions.vector, integer, double precision, uuid)
  TO service_role;

-- Fail the migration if the intended client boundary was not established.
DO $$
BEGIN
  IF has_table_privilege('anon', 'public.merchants', 'SELECT')
     OR has_table_privilege('anon', 'public.resellers', 'SELECT')
     OR has_table_privilege('anon', 'public.affiliate_links', 'SELECT')
     OR has_table_privilege('anon', 'public.clicks', 'INSERT') THEN
    RAISE EXCEPTION 'Anonymous table access remains on protected role/tracking tables';
  END IF;

  IF NOT has_table_privilege('authenticated', 'public.merchants', 'SELECT')
     OR NOT has_table_privilege('authenticated', 'public.resellers', 'SELECT')
     OR NOT has_column_privilege('supabase_auth_admin', 'public.merchants', 'id', 'SELECT')
     OR NOT has_column_privilege('supabase_auth_admin', 'public.resellers', 'id', 'SELECT') THEN
    RAISE EXCEPTION 'Required role lookup privileges are missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class
    WHERE oid = 'public.merchants'::regclass AND relrowsecurity
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_class
    WHERE oid = 'public.resellers'::regclass AND relrowsecurity
  ) THEN
    RAISE EXCEPTION 'RLS must remain enabled on role tables';
  END IF;
END;
$$;
