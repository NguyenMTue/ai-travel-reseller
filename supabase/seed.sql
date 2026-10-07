-- Xóa dữ liệu cũ trong bảng (nếu cần thiết khi chạy lại file nhiều lần)
-- Tuy nhiên db reset sẽ drop schema và migrate lại nên bảng sẽ trống trơn.

-- 1. Chèn 1 Merchant vào auth.users
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_user_meta_data, created_at, updated_at, confirmation_token
)
VALUES (
  '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
  'merchant@example.com', crypt('password123', gen_salt('bf')), now(), 
  '{"role":"merchant", "full_name":"Sunworld Đà Nẵng"}', now(), now(), ''
);

-- CHÚ Ý: Supabase CLI vô hiệu hóa Trigger (session_replication_role = replica) khi chạy seed.sql, 
-- nên ta phải INSERT thủ công vào bảng merchants thay vì chờ Trigger chạy.
INSERT INTO public.merchants (id, name, description, website, address, status)
VALUES (
  '11111111-1111-1111-1111-111111111111', 
  'Sunworld Đà Nẵng', 
  'Tổ hợp vui chơi giải trí hàng đầu Việt Nam',
  'https://sunworld.vn',
  'Đà Nẵng, Việt Nam',
  'active'
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  website = EXCLUDED.website,
  address = EXCLUDED.address,
  status = EXCLUDED.status;

-- 2. Chèn 1 Reseller vào auth.users
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_user_meta_data, created_at, updated_at, confirmation_token
)
VALUES (
  '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
  'reseller@example.com', crypt('password123', gen_salt('bf')), now(), 
  '{"role":"reseller", "full_name":"Travel Vlogger Danang"}', now(), now(), ''
);

-- INSERT thủ công vào bảng resellers
INSERT INTO public.resellers (id, name, email, phone, status, commission_rate)
VALUES (
  '22222222-2222-2222-2222-222222222222', 
  'Travel Vlogger Danang',
  'reseller@example.com',
  '0987654321',
  'active',
  10.0
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  status = EXCLUDED.status,
  commission_rate = EXCLUDED.commission_rate;


-- 3. Tạo Product thuộc về Merchant
INSERT INTO public.products (id, merchant_id, name, description, category, original_price, sale_price, commission_rate, status)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'Vé Bà Nà Hills - Cáp treo khứ hồi',
  'Vé vào cổng và đi cáp treo Bà Nà Hills. Miễn phí tham quan Cầu Vàng.',
  'Vé tham quan',
  900000,
  850000,
  5.0,
  'active'
);


-- 4. Tạo Campaign cho Product đó
INSERT INTO public.campaigns (id, merchant_id, product_id, name, target_audience, commission_rate, status)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333333',
  'Chiến dịch Hè 2026 - Kích cầu du lịch Bà Nà',
  'Gia đình, giới trẻ, sinh viên',
  7.0,
  'active'
);


-- 5. Tạo Social Account cho Reseller
INSERT INTO public.social_accounts (id, reseller_id, platform, username, followers, status)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  '22222222-2222-2222-2222-222222222222',
  'Tiktok',
  '@danang_traveler',
  150000,
  'active'
);


-- 6. Tạo Content (kịch bản AI sinh ra, Reseller sử dụng)
INSERT INTO public.contents (id, campaign_id, reseller_id, persona, hook, script, status)
VALUES (
  '66666666-6666-6666-6666-666666666666',
  '44444444-4444-4444-4444-444444444444',
  '22222222-2222-2222-2222-222222222222',
  'Reviewer năng động, GenZ',
  'Đừng đi Đà Nẵng nếu bạn chưa biết điều này...',
  'Bà Nà Hills vừa có thêm góc check-in mới cực chất. Nếu bạn mua vé qua link của mình sẽ được giảm ngay 50k đó nha!',
  'public'
);
