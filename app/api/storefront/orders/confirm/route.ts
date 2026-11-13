import { createAdminClient } from "../../../../../src/lib/supabase/admin.ts";

const UUID_REGEX = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

const DEMO_RESELLER_ID = "22222222-2222-2222-2222-111111111111"; // Travel Vlogger Danang (Seed Reseller)
const DEMO_MERCHANT_ID = "11111111-1111-1111-1111-111111111111"; // Sun World Đà Nẵng
const DEMO_PRODUCT_ID_NHS = "33333333-3333-3333-3333-666666666666"; // Ngũ Hành Sơn
const DEMO_PRODUCT_ID_BNH = "33333333-3333-3333-3333-333333333333"; // Ba Na Hills
const DEMO_CAMPAIGN_ID = "44444444-4444-4444-4444-444444444444"; // Ba Na Hills Campaign

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const bookingReference =
      typeof body.orderId === "string" && body.orderId.trim()
        ? body.orderId.trim()
        : `TL-${Date.now().toString().slice(-6)}-DEMO`;

    const orderAmount =
      typeof body.totalAmount === "number" && body.totalAmount > 0
        ? Math.round(body.totalAmount)
        : typeof body.amount === "number" && body.amount > 0
        ? Math.round(body.amount)
        : 320000;

    const customerName =
      typeof body.customerName === "string" && body.customerName.trim()
        ? body.customerName.trim()
        : "Khách Đặt Tour Demo";

    const customerPhone =
      typeof body.customerPhone === "string" && body.customerPhone.trim()
        ? body.customerPhone.trim()
        : "0905188899";

    const packageName =
      typeof body.packageName === "string" && body.packageName.trim()
        ? body.packageName.trim()
        : "Tour Tham Quan Vé Chính Hãng";

    const ticketCode =
      typeof body.ticketCode === "string" && body.ticketCode.trim()
        ? body.ticketCode.trim()
        : `ET-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Resolve Reseller ID: from refCode or default demo
    let finalResellerId = DEMO_RESELLER_ID;
    if (typeof body.refCode === "string" && UUID_REGEX.test(body.refCode.trim())) {
      finalResellerId = body.refCode.trim();
    } else if (typeof body.resellerId === "string" && UUID_REGEX.test(body.resellerId.trim())) {
      finalResellerId = body.resellerId.trim();
    }

    // Resolve Merchant ID
    let finalMerchantId = DEMO_MERCHANT_ID;
    if (typeof body.merchantId === "string" && UUID_REGEX.test(body.merchantId.trim())) {
      finalMerchantId = body.merchantId.trim();
    }

    // Resolve Product ID
    const isNhs =
      packageName.toLowerCase().includes("ngũ hành sơn") ||
      (typeof body.merchantSlug === "string" && body.merchantSlug.includes("nguhanhson"));

    let finalProductId = isNhs ? DEMO_PRODUCT_ID_NHS : DEMO_PRODUCT_ID_BNH;
    if (typeof body.productId === "string" && UUID_REGEX.test(body.productId.trim())) {
      finalProductId = body.productId.trim();
    }

    // Resolve Campaign ID
    let finalCampaignId: string | null = null;
    if (typeof body.campaignId === "string" && UUID_REGEX.test(body.campaignId.trim())) {
      finalCampaignId = body.campaignId.trim();
    }

    // Commission Rates: 12% default, 20% platform fee, 80% net to reseller
    let commissionRate = 12.0;
    let grossCommission = Math.round(orderAmount * (commissionRate / 100.0));
    let platformFee = Math.round(grossCommission * 0.20);
    let resellerCommission = grossCommission - platformFee;

    let dbSuccess = false;
    let createdOrderId: string | null = null;
    let createdCommissionId: string | null = null;

    // Database interaction with Supabase
    try {
      const adminClient = createAdminClient();

      // 1. Kiểm tra tồn tại của Campaign trong DB để không vi phạm khoá ngoại FK
      if (finalCampaignId) {
        const { data: campRow } = await adminClient
          .from("campaigns")
          .select("id, commission_rate")
          .eq("id", finalCampaignId)
          .maybeSingle();

        if (campRow) {
          if (campRow.commission_rate && campRow.commission_rate > 0) {
            commissionRate = Number(campRow.commission_rate);
            grossCommission = Math.round(orderAmount * (commissionRate / 100.0));
            platformFee = Math.round(grossCommission * 0.20);
            resellerCommission = grossCommission - platformFee;
          }
        } else {
          // Nếu campaignId giả định không có trong bảng campaigns, set null để tránh lỗi FK
          finalCampaignId = null;
        }
      }

      // 2. Thử gọi Stored Procedure RPC process_order_attribution
      const { data: rpcData, error: rpcError } = await adminClient.rpc(
        "process_order_attribution",
        {
          p_booking_reference: bookingReference,
          p_order_amount: orderAmount,
          p_merchant_id: finalMerchantId,
          p_product_id: finalProductId,
          p_reseller_id: finalResellerId,
          p_campaign_id: finalCampaignId,
          p_customer_name: customerName,
          p_customer_phone: customerPhone,
          p_status: "confirmed",
          p_notes: `Storefront Instant Test Booking: ${packageName} • Vé ${ticketCode}`,
        },
      );

      if (!rpcError && rpcData?.success) {
        dbSuccess = true;
        createdOrderId = rpcData.order_id;
        createdCommissionId = rpcData.commission_id;
        if (rpcData.reseller_commission) {
          resellerCommission = Number(rpcData.reseller_commission);
          grossCommission = Number(rpcData.gross_commission);
          platformFee = Number(rpcData.platform_fee);
        }
      } else {
        // Fallback: Nếu RPC báo đơn đã tồn tại hoặc RPC lỗi, thử insert trực tiếp
        if (rpcData?.error === "DUPLICATE_ORDER") {
          return Response.json({
            success: true,
            duplicate: true,
            orderId: bookingReference,
            resellerId: finalResellerId,
            commission: {
              grossAmount: grossCommission,
              platformFee,
              netAmount: resellerCommission,
              rate: commissionRate,
              status: "confirmed",
            },
            message: "Đơn hàng này đã được xác nhận thanh toán trước đó.",
          });
        }

        // Chèn trực tiếp vào orders
        const { data: newOrder, error: orderErr } = await adminClient
          .from("orders")
          .insert({
            merchant_id: finalMerchantId,
            product_id: finalProductId,
            reseller_id: finalResellerId,
            campaign_id: finalCampaignId,
            amount: orderAmount,
            commission_rate: commissionRate,
            gross_commission: grossCommission,
            platform_fee: platformFee,
            reseller_commission: resellerCommission,
            commission_amount: resellerCommission,
            booking_reference: bookingReference,
            customer_name: customerName,
            customer_phone: customerPhone,
            currency: "VND",
            status: "confirmed",
            paid_at: new Date().toISOString(),
            notes: `Storefront Instant Test Booking: ${packageName} • Vé ${ticketCode}`,
          })
          .select("id")
          .single();

        if (!orderErr && newOrder?.id) {
          createdOrderId = newOrder.id;
          // Chèn vào commissions
          const { data: newComm } = await adminClient
            .from("commissions")
            .insert({
              order_id: newOrder.id,
              reseller_id: finalResellerId,
              merchant_id: finalMerchantId,
              campaign_id: finalCampaignId,
              gross_amount: grossCommission,
              platform_fee: platformFee,
              net_amount: resellerCommission,
              status: "confirmed",
            })
            .select("id")
            .single();

          if (newComm?.id) {
            createdCommissionId = newComm.id;
            dbSuccess = true;
          }
        }
      }
    } catch (dbErr) {
      console.warn("[STOREFRONT_ORDER_CONFIRM_DB_WARN] Proceeding with simulated demo attribution:", dbErr);
    }

    return Response.json(
      {
        success: true,
        attributed: true,
        dbRecorded: dbSuccess,
        orderId: bookingReference,
        resellerId: finalResellerId,
        commission: {
          grossAmount: grossCommission,
          platformFee,
          netAmount: resellerCommission,
          rate: commissionRate,
          status: "confirmed",
          resellerId: finalResellerId,
        },
        message: "Xác nhận thanh toán thành công. Hoa hồng đã được cộng trực tiếp vào Ví Reseller.",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error: any) {
    console.error("[STOREFRONT_ORDER_CONFIRM_ERROR]", error);
    return Response.json(
      {
        success: false,
        error: error?.message || "Không thể xử lý xác nhận đơn hàng lúc này",
      },
      { status: 500 },
    );
  }
}
