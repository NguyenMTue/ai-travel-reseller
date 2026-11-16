-- ==============================================================================
-- Migration: Đồng bộ dữ liệu Ví hoa hồng cho tài khoản reseller@example.com
-- Thiết lập số dư khả dụng hiệu dụng đạt chính xác 200.000 VNĐ
-- Reseller ID: '22222222-2222-2222-2222-111111111111'
-- ==============================================================================

-- 1. Đảm bảo bản ghi hoa hồng đã đối soát (confirmed) đạt mức 200.000 VNĐ
-- Xóa hoặc điều chỉnh các đơn hoa hồng demo trước đó để đạt mức số dư chuẩn
DO $$
DECLARE
  v_reseller_id UUID := '22222222-2222-2222-2222-111111111111';
  v_merchant_id UUID := '11111111-1111-1111-1111-111111111111';
  v_product_id  UUID := '33333333-3333-3333-3333-333333333333';
  v_campaign_id UUID := '44444444-4444-4444-4444-444444444444';
  v_order_id    UUID := '77777777-7777-7777-7777-111111111111';
  v_comm_id     UUID := '99999999-9999-9999-9999-111111111111';
BEGIN
  -- Cập nhật đơn hàng Order 1 thành đơn hoàn tất
  UPDATE public.orders
  SET 
    amount = 2500000,
    commission_rate = 10,
    gross_commission = 250000,
    platform_fee = 50000,
    reseller_commission = 200000,
    commission_amount = 200000,
    status = 'confirmed'
  WHERE id = v_order_id;

  -- Chèn hoặc cập nhật bảng public.commissions với net_amount = 200.000 VNĐ
  INSERT INTO public.commissions (
    id,
    order_id,
    reseller_id,
    merchant_id,
    campaign_id,
    gross_amount,
    platform_fee,
    net_amount,
    status,
    created_at,
    updated_at
  )
  VALUES (
    v_comm_id,
    v_order_id,
    v_reseller_id,
    v_merchant_id,
    v_campaign_id,
    250000,
    50000,
    200000,
    'confirmed',
    now() - interval '2 days',
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    gross_amount = 250000,
    platform_fee = 50000,
    net_amount = 200000,
    status = 'confirmed',
    updated_at = now();

  -- Đảm bảo không có lệnh rút tiền pending nào làm kẹt số dư
  DELETE FROM public.payout_requests
  WHERE reseller_id = v_reseller_id AND status IN ('pending', 'processing');

END $$;
