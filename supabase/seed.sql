-- ==============================================================================
-- AI TRAVEL RESELLER - MASTER SEED DATA
-- Phục vụ Demo toàn diện các chức năng:
--   1. Merchant Dashboard & Product Management
--   2. Reseller Affiliate & Social Tracking
--   3. AI Sales Agent RAG (BE2 - match_product_embeddings)
--   4. AI Content Factory (BE3 - n8n & LLM Review/Scripts)
--   5. Orders, Commissions & Tracking Funnel
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. CHÈN TÀI KHOẢN VÀO auth.users (Mật khẩu mặc định: password123)
-- ------------------------------------------------------------------------------

-- 1.1 Merchants (4 tài khoản đại diện các điểm du lịch lớn miền Trung)
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_user_meta_data, raw_app_meta_data, created_at, updated_at, confirmation_token,
  recovery_token, email_change_token_new, email_change
)
VALUES 
  -- Merchant 1: Sun World Đà Nẵng (Bà Nà Hills, Cầu Vàng)
  (
    '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 
    'authenticated', 'authenticated', 'merchant@example.com', 
    crypt('password123', gen_salt('bf')), now(), 
    '{"role":"merchant", "full_name":"Sun World Đà Nẵng"}',
    '{"provider":"email","providers":["email"]}'::jsonb,
    now(), now(), '', '', '', ''
  ),
  -- Merchant 2: VinWonders Nam Hội An
  (
    '11111111-1111-1111-1111-222222222222', '00000000-0000-0000-0000-000000000000', 
    'authenticated', 'authenticated', 'vinwonders@example.com', 
    crypt('password123', gen_salt('bf')), now(), 
    '{"role":"merchant", "full_name":"VinWonders Nam Hội An"}',
    '{"provider":"email","providers":["email"]}'::jsonb,
    now(), now(), '', '', '', ''
  ),
  -- Merchant 3: Cù Lao Chàm Island Tours
  (
    '11111111-1111-1111-1111-333333333333', '00000000-0000-0000-0000-000000000000', 
    'authenticated', 'authenticated', 'culaocham@example.com', 
    crypt('password123', gen_salt('bf')), now(), 
    '{"role":"merchant", "full_name":"Cù Lao Chàm Travel"}',
    '{"provider":"email","providers":["email"]}'::jsonb,
    now(), now(), '', '', '', ''
  ),
  -- Merchant 4: Da Nang River Cruise (Du thuyền Sông Hàn)
  (
    '11111111-1111-1111-1111-444444444444', '00000000-0000-0000-0000-000000000000', 
    'authenticated', 'authenticated', 'songhan@example.com', 
    crypt('password123', gen_salt('bf')), now(), 
    '{"role":"merchant", "full_name":"Du Thuyền Sông Hàn Marina"}',
    '{"provider":"email","providers":["email"]}'::jsonb,
    now(), now(), '', '', '', ''
  )
ON CONFLICT (id) DO NOTHING;

-- 1.2 Resellers (4 tài khoản KOC / Travel Influencer / Marketer)
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_user_meta_data, raw_app_meta_data, created_at, updated_at, confirmation_token,
  recovery_token, email_change_token_new, email_change
)
VALUES 
  -- Reseller 1: Travel Vlogger Danang (KOC gạo cội)
  (
    '22222222-2222-2222-2222-111111111111', '00000000-0000-0000-0000-000000000000', 
    'authenticated', 'authenticated', 'reseller@example.com', 
    crypt('password123', gen_salt('bf')), now(), 
    '{"role":"reseller", "full_name":"Travel Vlogger Danang"}',
    '{"provider":"email","providers":["email"]}'::jsonb,
    now(), now(), '', '', '', ''
  ),
  -- Reseller 2: Linh Đan Reviewer (TikToker GenZ chuyên review đồ ăn & góc check-in)
  (
    '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 
    'authenticated', 'authenticated', 'linhdan.travel@example.com', 
    crypt('password123', gen_salt('bf')), now(), 
    '{"role":"reseller", "full_name":"Linh Đan Travel & Food"}',
    '{"provider":"email","providers":["email"]}'::jsonb,
    now(), now(), '', '', '', ''
  ),
  -- Reseller 3: Hải Phượt (YouTuber phiêu lưu, tour lặn biển & trekking)
  (
    '22222222-2222-2222-2222-333333333333', '00000000-0000-0000-0000-000000000000', 
    'authenticated', 'authenticated', 'haiphuot@example.com', 
    crypt('password123', gen_salt('bf')), now(), 
    '{"role":"reseller", "full_name":"Hải Phượt Khám Phá"}',
    '{"provider":"email","providers":["email"]}'::jsonb,
    now(), now(), '', '', '', ''
  ),
  -- Reseller 4: Hương Hội An Chill (Instagramer chuyên tour trải nghiệm văn hóa)
  (
    '22222222-2222-2222-2222-444444444444', '00000000-0000-0000-0000-000000000000', 
    'authenticated', 'authenticated', 'huonghoian@example.com', 
    crypt('password123', gen_salt('bf')), now(), 
    '{"role":"reseller", "full_name":"Hương Hội An Chill"}',
    '{"provider":"email","providers":["email"]}'::jsonb,
    now(), now(), '', '', '', ''
  )
ON CONFLICT (id) DO NOTHING;


-- ------------------------------------------------------------------------------
-- 2. CHÈN BẢNG public.merchants
-- ------------------------------------------------------------------------------
INSERT INTO public.merchants (id, name, description, phone, website, address, status)
VALUES 
  (
    '11111111-1111-1111-1111-111111111111', 
    'Sun World Đà Nẵng', 
    'Tổ hợp vui chơi giải trí hàng đầu Việt Nam sở hữu Cầu Vàng, Bà Nà Hills, Công viên Châu Á.',
    '0905123456',
    'https://sunworld.vn',
    'Xã Hòa Ninh, Huyện Hòa Vang, TP. Đà Nẵng',
    'active'
  ),
  (
    '11111111-1111-1111-1111-222222222222', 
    'VinWonders Nam Hội An', 
    'Thiên đường giải trí giao thoa văn hóa Đông - Tây với River Safari độc đáo bên sông.',
    '19006677',
    'https://vinwonders.com',
    'Đường Võ Chí Công, Xã Bình Minh, Thăng Bình, Quảng Nam',
    'active'
  ),
  (
    '11111111-1111-1111-1111-333333333333', 
    'Cù Lao Chàm Travel', 
    'Đơn vị lữ hành chuyên cano cao tốc, tour lặn ngắm san hô và ẩm thực hải sản đảo Cù Lao Chàm.',
    '0935888999',
    'https://culaochamtravel.vn',
    'Cảng Cửa Đại, TP. Hội An, Quảng Nam',
    'active'
  ),
  (
    '11111111-1111-1111-1111-444444444444', 
    'Du Thuyền Sông Hàn Marina', 
    'Dịch vụ ngắm cảnh sông Hàn về đêm, xem Cầu Rồng phun lửa, phun nước và thưởng thức nhạc acoustic.',
    '0905999111',
    'https://marinasonghan.com',
    'Bến du thuyền Đà Nẵng, Đường Bạch Đằng, Hải Châu, Đà Nẵng',
    'active'
  )
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  website = EXCLUDED.website,
  address = EXCLUDED.address,
  status = EXCLUDED.status;


-- ------------------------------------------------------------------------------
-- 3. CHÈN BẢNG public.resellers
-- ------------------------------------------------------------------------------
INSERT INTO public.resellers (id, name, email, phone, status, commission_rate)
VALUES 
  (
    '22222222-2222-2222-2222-111111111111', 
    'Travel Vlogger Danang', 
    'reseller@example.com', 
    '0987654321', 
    'active', 
    10.0
  ),
  (
    '22222222-2222-2222-2222-222222222222', 
    'Linh Đan Travel & Food', 
    'linhdan.travel@example.com', 
    '0912345678', 
    'active', 
    12.0
  ),
  (
    '22222222-2222-2222-2222-333333333333', 
    'Hải Phượt Khám Phá', 
    'haiphuot@example.com', 
    '0934567890', 
    'active', 
    8.5
  ),
  (
    '22222222-2222-2222-2222-444444444444', 
    'Hương Hội An Chill', 
    'huonghoian@example.com', 
    '0976543210', 
    'active', 
    11.0
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  status = EXCLUDED.status,
  commission_rate = EXCLUDED.commission_rate;


-- ------------------------------------------------------------------------------
-- 4. CHÈN BẢNG public.products (Sản phẩm du lịch phong phú miền Trung)
-- ------------------------------------------------------------------------------
INSERT INTO public.products (
  id, merchant_id, name, description, category, 
  original_price, sale_price, commission_rate, 
  valid_from, valid_to, booking_url, payment_url, status
)
VALUES 
  -- Product 1: Vé Bà Nà Hills (Khớp với ID cũ để giữ tương thích)
  (
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'Vé Cáp Treo Bà Nà Hills + Buffet Trưa Quốc Tế',
    'Vé trọn gói vào cổng, cáp treo khứ hồi Bà Nà Hills, tham quan Cầu Vàng, Làng Pháp và buffet trưa hơn 100 món tại nhà hàng Arapang hoặc Beer Plaza.',
    'Vé tham quan & Ẩm thực',
    1250000,
    1150000,
    7.5,
    now(), now() + interval '180 days',
    'https://sunworld.vn/booking/ba-na-hills-buffet',
    'https://checkout.sunworld.vn/pay/bana-01',
    'active'
  ),
  -- Product 2: Tour Cù Lao Chàm lặn ngắm san hô
  (
    '33333333-3333-3333-3333-222222222222',
    '11111111-1111-1111-1111-333333333333',
    'Tour Cano Cao Tốc Cù Lao Chàm - Lặn Ngắm San Hô & Hải Sản',
    'Trọn gói cano khứ hồi cảng Cửa Đại - Bãi Làng, áo phao, kính lặn ngắm san hô Bãi Chồng, tham quan giếng cổ Chăm Pa, bữa trưa hải sản tươi sống trên đảo.',
    'Tour trong ngày',
    650000,
    550000,
    10.0,
    now(), now() + interval '120 days',
    'https://culaochamtravel.vn/tour/lan-ngam-san-ho-1-ngay',
    'https://checkout.culaochamtravel.vn/pay/clc-01',
    'active'
  ),
  -- Product 3: Vé VinWonders Nam Hội An
  (
    '33333333-3333-3333-3333-111111111111',
    '11111111-1111-1111-1111-222222222222',
    'Vé Vào Cổng VinWonders Nam Hội An - River Safari & Trò Chơi',
    'Khám phá công viên giải trí đa trải nghiệm với River Safari duy nhất tại VN bằng thuyền, công viên nước, đảo dân gian và show diễn 3D Mapping Về Bến rực rỡ.',
    'Vé công viên chủ đề',
    600000,
    510000,
    8.0,
    now(), now() + interval '180 days',
    'https://vinwonders.com/nam-hoi-an/all-in-one',
    'https://checkout.vinwonders.com/pay/vwnha-01',
    'active'
  ),
  -- Product 4: Du thuyền Sông Hàn ngắm Cầu Rồng
  (
    '33333333-3333-3333-3333-444444444444',
    '11111111-1111-1111-1111-444444444444',
    'Vé Du Thuyền Sông Hàn Về Đêm - Ngắm Cầu Rồng Phun Lửa',
    'Trải nghiệm 90 phút ngắm toàn cảnh sông Hàn lung linh, ngắm Cầu Quay, Cầu Rồng phun lửa vào cuối tuần, tặng kèm nước suối, đĩa trái cây tươi và nhạc Champa.',
    'Trải nghiệm đêm',
    200000,
    150000,
    12.0,
    now(), now() + interval '90 days',
    'https://marinasonghan.com/ve-du-thuyen-dem',
    'https://checkout.marinasonghan.com/pay/cruise-01',
    'active'
  ),
  -- Product 5: Show Ký Ức Hội An
  (
    '33333333-3333-3333-3333-555555555555',
    '11111111-1111-1111-1111-222222222222',
    'Vé Xem Show Ký Ức Hội An - Hạng Ghế Eco',
    'Thưởng thức chương trình nghệ thuật thực cảnh lớn nhất thế giới trên sân khấu 25.000m2 giữa dòng sông Hoài với hơn 500 diễn viên tái hiện 400 năm lịch sử Hội An.',
    'Show diễn thực cảnh',
    600000,
    540000,
    9.0,
    now(), now() + interval '150 days',
    'https://hoianmemoriesland.com/ve-ky-uc-hoi-an',
    'https://checkout.hoianmemoriesland.com/pay/kyuc-01',
    'active'
  ),
  -- Product 6: Tour Trekking Ngũ Hành Sơn & Làng Đá Non Nước
  (
    '33333333-3333-3333-3333-666666666666',
    '11111111-1111-1111-1111-111111111111',
    'Tour Khám Phá Danh Thắng Ngũ Hành Sơn & Động Huyền Không',
    'Khám phá 5 ngọn núi ngũ hành Kim Mộc Thủy Hỏa Thổ, chiêm bái Chùa Linh Ứng cổ tự, động Huyền Không kỳ bí và làng đá mỹ nghệ Non Nước hơn 300 năm tuổi.',
    'Tour văn hóa & Tâm linh',
    400000,
    320000,
    10.0,
    now(), now() + interval '120 days',
    'https://sunworld.vn/tour/ngu-hanh-son-halfday',
    'https://checkout.sunworld.vn/pay/nguhanhson-01',
    'active'
  )
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  original_price = EXCLUDED.original_price,
  sale_price = EXCLUDED.sale_price,
  commission_rate = EXCLUDED.commission_rate,
  booking_url = EXCLUDED.booking_url,
  payment_url = EXCLUDED.payment_url,
  status = EXCLUDED.status;


-- ------------------------------------------------------------------------------
-- 5. CHÈN BẢNG public.campaigns (Các chiến dịch kích cầu du lịch)
-- ------------------------------------------------------------------------------
INSERT INTO public.campaigns (
  id, merchant_id, product_id, name, 
  start_date, end_date, target_audience, target_location, 
  commission_rate, status
)
VALUES 
  -- Campaign 1: Hè 2026 - Kích cầu du lịch Bà Nà (Khớp ID cũ)
  (
    '44444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333333',
    'Chiến dịch Hè 2026 - Kích cầu du lịch Bà Nà Hills',
    now() - interval '10 days', now() + interval '80 days',
    'Gia đình có trẻ nhỏ, nhóm bạn trẻ, sinh viên thích check-in sống ảo',
    'Đà Nẵng, Hà Nội, TP.HCM',
    8.0,
    'active'
  ),
  -- Campaign 2: Sôi động Biển Đảo Cù Lao Chàm
  (
    '44444444-4444-4444-4444-222222222222',
    '11111111-1111-1111-1111-333333333333',
    '33333333-3333-3333-3333-222222222222',
    'Chiến dịch Khám Phá Đại Dương - Lặn Ngắm San Hô Cù Lao Chàm',
    now() - interval '5 days', now() + interval '60 days',
    'Dân phượt, giới trẻ mê xê dịch, du khách yêu thích biển đảo và thể thao nước',
    'Đà Nẵng, Quảng Nam, Khách quốc tế',
    11.5,
    'active'
  ),
  -- Campaign 3: Trải nghiệm kỳ quan VinWonders Nam Hội An
  (
    '44444444-4444-4444-4444-333333333333',
    '11111111-1111-1111-1111-222222222222',
    '33333333-3333-3333-3333-111111111111',
    'Chiến dịch Mùa Lễ Hội Văn Hóa VinWonders Nam Hội An',
    now() - interval '2 days', now() + interval '90 days',
    'Gia đình đa thế hệ, cặp đôi du lịch lãng mạn, học sinh sinh viên',
    'Toàn quốc',
    9.0,
    'active'
  ),
  -- Campaign 4: Lung linh Đà Nẵng về đêm trên Sông Hàn
  (
    '44444444-4444-4444-4444-111111111111',
    '11111111-1111-1111-1111-444444444444',
    '33333333-3333-3333-3333-444444444444',
    'Chiến dịch Chill Cùng Sông Hàn - Xem Cầu Rồng Phun Lửa',
    now(), now() + interval '45 days',
    'Khách du lịch tự túc, cặp đôi hẹn hò, đoàn khách hội nghị MICE',
    'Đà Nẵng',
    14.0,
    'active'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  target_audience = EXCLUDED.target_audience,
  target_location = EXCLUDED.target_location,
  commission_rate = EXCLUDED.commission_rate,
  status = EXCLUDED.status;


-- ------------------------------------------------------------------------------
-- 6. CHÈN BẢNG public.social_accounts (Tài khoản mạng xã hội của Resellers)
-- ------------------------------------------------------------------------------
INSERT INTO public.social_accounts (
  id, reseller_id, platform, username, url, followers, average_views, status
)
VALUES 
  -- Reseller 1 Accounts
  (
    '55555555-5555-5555-5555-555555555555',
    '22222222-2222-2222-2222-111111111111',
    'Tiktok',
    '@danang_traveler',
    'https://tiktok.com/@danang_traveler',
    185000,
    45000,
    'active'
  ),
  (
    '55555555-5555-5555-5555-111111111112',
    '22222222-2222-2222-2222-111111111111',
    'Facebook',
    'Travel Vlogger Đà Nẵng Official',
    'https://facebook.com/danangvlogger',
    95000,
    18000,
    'active'
  ),
  -- Reseller 2 Accounts (Linh Đan)
  (
    '55555555-5555-5555-5555-222222222221',
    '22222222-2222-2222-2222-222222222222',
    'Tiktok',
    '@linhdan.checkin',
    'https://tiktok.com/@linhdan.checkin',
    320000,
    120000,
    'active'
  ),
  (
    '55555555-5555-5555-5555-222222222222',
    '22222222-2222-2222-2222-222222222222',
    'Instagram',
    '@linhdan_travel_story',
    'https://instagram.com/linhdan_travel_story',
    88000,
    15000,
    'active'
  ),
  -- Reseller 3 Accounts (Hải Phượt)
  (
    '55555555-5555-5555-5555-333333333331',
    '22222222-2222-2222-2222-333333333333',
    'Youtube',
    'Hải Phượt TV - Khám Phá Việt Nam',
    'https://youtube.com/@haiphuottv',
    145000,
    55000,
    'active'
  )
ON CONFLICT (id) DO UPDATE SET
  platform = EXCLUDED.platform,
  username = EXCLUDED.username,
  followers = EXCLUDED.followers,
  average_views = EXCLUDED.average_views,
  status = EXCLUDED.status;


-- ------------------------------------------------------------------------------
-- 7. CHÈN BẢNG public.contents (Kịch bản AI & Nội dung quảng bá mẫu)
-- ------------------------------------------------------------------------------
INSERT INTO public.contents (
  id, campaign_id, reseller_id, product_id, 
  persona, hook, script, caption, cta, status
)
VALUES 
  -- Content 1: Persona Foodie (Bà Nà Hills)
  (
    '66666666-6666-6666-6666-666666666666',
    '44444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-111111111111',
    '33333333-3333-3333-3333-333333333333',
    'foodie',
    'Đừng đi Đà Nẵng nếu bạn chưa biết bí quyết này để săn mây Bà Nà...',
    'Bà Nà Hills vừa có thêm góc check-in mới cực chất tại Cầu Vàng và Làng Pháp. Nếu đi sáng sớm trước 8h hoặc chiều sau 16h bạn sẽ có những khung hình không dính người!',
    'Mẹo săn vé cáp treo Bà Nà Hills kèm buffet trưa tiết kiệm ngay 100k cho mùa hè này! Đặt ngay tại link chính thức của nhà cung cấp nha mọi người ơi! #danang #banahills #checkindanang',
    'Click link ở bio để nhận ngay ưu đãi giảm 100k vé cáp treo Bà Nà Hills hôm nay! [LINK_MUA_VE]',
    'approved'
  ),
  -- Content 2: Persona Local Guide (Bà Nà Hills)
  (
    '66666666-6666-6666-6666-444444444441',
    '44444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-111111111111',
    '33333333-3333-3333-3333-333333333333',
    'local_guide',
    'Kinh nghiệm người Đà Nẵng: 3 khung giờ vàng đi cáp treo Bà Nà không phải xếp hàng!',
    'Là người Đà Nẵng, mình khuyên các bạn nên lên cáp treo lúc 7h30 sáng hoặc sau 15h chiều. Trưa ghé buffet Arapang ăn hơn 100 món, chiều chụp ảnh Cầu Vàng lúc hoàng hôn cực kỳ vắng người và thơ mộng.',
    'Kinh nghiệm đi Bà Nà Hills chuẩn người bản địa. Đặt vé kèm buffet sớm để nhận ưu đãi tốt nhất! #kinhnghiemdulich #dananglocal',
    'Bấm ngay link bio để đặt vé cáp treo Bà Nà Hills chính thức! [LINK_MUA_VE]',
    'approved'
  ),
  -- Content 3: Persona Family (Bà Nà Hills)
  (
    '66666666-6666-6666-6666-444444444442',
    '44444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-111111111111',
    '33333333-3333-3333-3333-333333333333',
    'family',
    'Bí quyết đưa cả gia đình đi Bà Nà Hills trọn vẹn, không lo mệt mỏi hay chen chúc!',
    'Chuyến đi gia đình có trẻ nhỏ và người lớn tuổi cần ưu tiên sự tiện lợi: cáp treo khứ hồi nhẹ nhàng, buffet quốc tế tại nhà hàng rộng rãi, có sẵn xe đẩy và khu vui chơi Fantasy Park mát mẻ trong nhà.',
    'Gợi ý lịch trình du lịch Bà Nà Hills lý tưởng cho cả gia đình mùa hè này. Đặt trước vé để nhận hướng dẫn chi tiết! #dulichgiadinh #banahills',
    'Click ngay link để nhận combo vé gia đình ưu đãi đặc biệt hôm nay! [LINK_MUA_VE]',
    'approved'
  ),
  -- Content 4: Persona Budget Traveler (Bà Nà Hills)
  (
    '66666666-6666-6666-6666-444444444443',
    '44444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-111111111111',
    '33333333-3333-3333-3333-333333333333',
    'budget_traveler',
    'Tiết kiệm ngay 100.000đ khi đặt combo Cáp treo Bà Nà + Buffet trưa quốc tế!',
    'Giá gốc 1.250.000đ nay chỉ còn 1.150.000đ trọn gói cả vé vào cổng, cáp treo khứ hồi và đại tiệc buffet hơn 100 món. Đặt trực tiếp qua hệ thống đại lý chính hãng để không lo phát sinh.',
    'Deal vé Bà Nà Hills tiết kiệm nhất tháng này. Vé điện tử quét mã QR vào cổng không cần chờ đợi! #sandeal #vebana',
    'Nhận ưu đãi giảm 100k ngay bằng cách ấn vào link bên dưới! [LINK_MUA_VE]',
    'approved'
  ),
  -- Content 5: Cù Lao Chàm (Persona local_guide)
  (
    '66666666-6666-6666-6666-222222222222',
    '44444444-4444-4444-4444-222222222222',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-222222222222',
    'local_guide',
    'Chỉ 550k mà được đi cano lướt sóng cực đã và ngắm rạn san hô đẹp mê hồn tại Cù Lao Chàm?',
    'Một ngày làm ngư dân đảo Cù Lao Chàm: lặn biển ngắm san hô Bãi Chồng, uống nước giếng cổ thoát ế và ăn cua đá no nê. Trọn gói từ cảng Cửa Đại đã có hướng dẫn viên lo tất tần tật.',
    'Review chân thật chuyến đi Cù Lao Chàm 1 ngày chỉ 550k bao gồm cano và ăn trưa hải sản. Xem hết video để lưu lại số cano uy tín nhé! #culaocham #dulichhoian',
    'Nhắn tin hoặc bấm link bên dưới để đặt cano giá ưu đãi kèm bảo hiểm đầy đủ! [LINK_MUA_VE]',
    'approved'
  )
ON CONFLICT (id) DO UPDATE SET
  persona = EXCLUDED.persona,
  hook = EXCLUDED.hook,
  script = EXCLUDED.script,
  caption = EXCLUDED.caption,
  cta = EXCLUDED.cta,
  status = EXCLUDED.status;


-- ------------------------------------------------------------------------------
-- 8. CHÈN BẢNG public.orders (Đơn hàng & Hoa hồng để demo Dashboard)
-- ------------------------------------------------------------------------------
INSERT INTO public.orders (
  id, merchant_id, reseller_id, product_id, 
  amount, commission_amount, status, booking_reference, created_at
)
VALUES 
  -- Đơn 1: Vé Bà Nà Hills - Đã hoàn thành (Reseller 1)
  (
    '77777777-7777-7777-7777-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-111111111111',
    '33333333-3333-3333-3333-333333333333',
    2300000, -- 2 vé x 1.150.000
    172500,  -- 7.5% hoa hồng
    'completed',
    'BK-BANA-20261001-01',
    now() - interval '8 days'
  ),
  -- Đơn 2: Tour Cù Lao Chàm - Đã hoàn thành (Reseller 2)
  (
    '77777777-7777-7777-7777-222222222222',
    '11111111-1111-1111-1111-333333333333',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-222222222222',
    2200000, -- 4 vé x 550.000
    253000,  -- 11.5% hoa hồng
    'completed',
    'BK-CLC-20261003-02',
    now() - interval '6 days'
  ),
  -- Đơn 3: Vé VinWonders Nam Hội An - Đã hoàn thành (Reseller 2)
  (
    '77777777-7777-7777-7777-333333333333',
    '11111111-1111-1111-1111-222222222222',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-111111111111',
    1530000, -- 3 vé x 510.000
    137700,  -- 9.0% hoa hồng
    'completed',
    'BK-VIN-20261005-03',
    now() - interval '4 days'
  ),
  -- Đơn 4: Du thuyền Sông Hàn - Chờ xác nhận (Reseller 1)
  (
    '77777777-7777-7777-7777-444444444444',
    '11111111-1111-1111-1111-444444444444',
    '22222222-2222-2222-2222-111111111111',
    '33333333-3333-3333-3333-444444444444',
    600000,  -- 4 vé x 150.000
    84000,   -- 14.0% hoa hồng
    'pending',
    'BK-SH-20261008-04',
    now() - interval '1 day'
  ),
  -- Đơn 5: Show Ký Ức Hội An - Đã hoàn thành (Reseller 4)
  (
    '77777777-7777-7777-7777-555555555555',
    '11111111-1111-1111-1111-222222222222',
    '22222222-2222-2222-2222-444444444444',
    '33333333-3333-3333-3333-555555555555',
    1080000, -- 2 vé x 540.000
    97200,   -- 9.0% hoa hồng
    'completed',
    'BK-KYUC-20261007-05',
    now() - interval '2 days'
  )
ON CONFLICT (id) DO UPDATE SET
  amount = EXCLUDED.amount,
  commission_amount = EXCLUDED.commission_amount,
  status = EXCLUDED.status,
  booking_reference = EXCLUDED.booking_reference;


-- ------------------------------------------------------------------------------
-- 9. CHÈN BẢNG public.tracking_events (Sự kiện click & conversion affiliate)
-- ------------------------------------------------------------------------------
INSERT INTO public.tracking_events (
  id, reseller_id, campaign_id, product_id, event_type, timestamp, metadata
)
VALUES 
  (
    '88888888-8888-8888-8888-111111111111',
    '22222222-2222-2222-2222-111111111111',
    '44444444-4444-4444-4444-444444444444',
    '33333333-3333-3333-3333-333333333333',
    'click',
    now() - interval '3 hours',
    '{"platform": "tiktok", "utm_source": "danang_traveler", "device": "mobile_ios"}'::jsonb
  ),
  (
    '88888888-8888-8888-8888-222222222222',
    '22222222-2222-2222-2222-222222222222',
    '44444444-4444-4444-4444-222222222222',
    '33333333-3333-3333-3333-222222222222',
    'click',
    now() - interval '2 hours',
    '{"platform": "tiktok", "utm_source": "linhdan.checkin", "device": "mobile_android"}'::jsonb
  ),
  (
    '88888888-8888-8888-8888-333333333333',
    '22222222-2222-2222-2222-222222222222',
    '44444444-4444-4444-4444-222222222222',
    '33333333-3333-3333-3333-222222222222',
    'lead',
    now() - interval '1 hour',
    '{"action": "view_checkout", "product_name": "Tour Cano Cao Tốc Cù Lao Chàm"}'::jsonb
  ),
  (
    '88888888-8888-8888-8888-444444444444',
    '22222222-2222-2222-2222-111111111111',
    '44444444-4444-4444-4444-111111111111',
    '33333333-3333-3333-3333-444444444444',
    'purchase',
    now() - interval '30 minutes',
    '{"order_id": "77777777-7777-7777-7777-444444444444", "value": 600000}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;
