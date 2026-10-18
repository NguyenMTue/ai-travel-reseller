-- Thiết lập quyền (GRANT) cho các role
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 1. Bảng merchants
CREATE POLICY "Allow public read access to merchants" 
ON merchants FOR SELECT USING (true);

CREATE POLICY "Allow merchants to update their own profile" 
ON merchants FOR UPDATE USING (id = auth.uid());

-- 2. Bảng products
CREATE POLICY "Allow public read access to products" 
ON products FOR SELECT USING (true);

CREATE POLICY "Allow merchants to manage their own products" 
ON products FOR ALL USING (merchant_id = auth.uid());

-- 3. Bảng resellers
CREATE POLICY "Allow public read access to resellers" 
ON resellers FOR SELECT USING (true);

CREATE POLICY "Allow resellers to update their own profile" 
ON resellers FOR UPDATE USING (id = auth.uid());

-- 4. Bảng social_accounts
CREATE POLICY "Allow public read access to social_accounts" 
ON social_accounts FOR SELECT USING (true);

CREATE POLICY "Allow resellers to manage their own social accounts" 
ON social_accounts FOR ALL USING (reseller_id = auth.uid());

-- 5. Bảng campaigns
CREATE POLICY "Allow public read access to campaigns" 
ON campaigns FOR SELECT USING (true);

CREATE POLICY "Allow merchants to manage their own campaigns" 
ON campaigns FOR ALL USING (merchant_id = auth.uid());

-- 6. Bảng contents
CREATE POLICY "Allow public read access to contents" 
ON contents FOR SELECT USING (true);

CREATE POLICY "Allow resellers to manage their own contents" 
ON contents FOR ALL USING (reseller_id = auth.uid());

-- 7. Bảng tracking_events
CREATE POLICY "Allow public insert to tracking_events" 
ON tracking_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow resellers to read their own tracking events" 
ON tracking_events FOR SELECT USING (reseller_id = auth.uid());

CREATE POLICY "Allow merchants to read their product tracking events" 
ON tracking_events FOR SELECT USING (
  product_id IN (SELECT id FROM products WHERE merchant_id = auth.uid())
);

-- 8. Bảng orders
CREATE POLICY "Allow merchants to view their orders" 
ON orders FOR SELECT USING (merchant_id = auth.uid());

CREATE POLICY "Allow resellers to view their orders" 
ON orders FOR SELECT USING (reseller_id = auth.uid());
