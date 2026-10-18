-- Fix mock checkout.sunworld.vn domain to real live sunworld.vn domain
UPDATE public.products 
SET payment_url = 'https://sunworld.vn' 
WHERE id = '33333333-3333-3333-3333-333333333333';

UPDATE public.affiliate_links 
SET destination_url = 'https://sunworld.vn' 
WHERE product_id = '33333333-3333-3333-3333-333333333333';
