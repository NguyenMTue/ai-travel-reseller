import type { SupabaseClient } from "@supabase/supabase-js";

export interface AdminSystemOverview {
  financials: {
    total_gmv: number;
    commissions_paid: number;
    commissions_confirmed: number;
    pending_payouts_amount: number;
    currency: string;
  };
  operational_counts: {
    total_orders: number;
    confirmed_orders: number;
    pending_payouts_count: number;
    merchants_count: number;
    resellers_count: number;
    products_count: number;
    campaigns_count: number;
    total_clicks: number;
  };
  security_alerts: {
    flagged_self_purchase_orders: number;
    bot_clicks_detected: number;
    action_required_payouts: number;
  };
  generated_at?: string;
}

export interface AdminPayoutItem {
  id: string;
  resellerId: string;
  resellerName: string;
  resellerEmail: string;
  resellerPhone?: string | null;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: "pending" | "processing" | "completed" | "rejected";
  createdAt: string;
  processedAt?: string | null;
  adminNotes?: string | null;
  transferReference?: string | null;
}

export interface AdminFlaggedOrder {
  id: string;
  bookingReference: string;
  amount: number;
  customerName?: string | null;
  resellerId: string;
  resellerName?: string;
  merchantId: string;
  merchantName?: string;
  status: string;
  createdAt: string;
  flagSelfPurchase: boolean;
}

export interface AdminBotClick {
  id: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  isBot: boolean;
  botScore?: number | null;
  country?: string | null;
  createdAt: string;
}

export interface AdminPartnerItem {
  id: string;
  type: "merchant" | "reseller";
  name: string;
  email?: string | null;
  phone?: string | null;
  status: string;
  createdAt?: string | null;
  totalOrders?: number;
  totalVolume?: number;
}

/**
 * Lấy tổng quan các chỉ số vận hành & tài chính toàn sàn
 */
export async function getAdminSystemOverview(
  client: SupabaseClient,
): Promise<AdminSystemOverview> {
  try {
    const { data: rpcData, error: rpcError } = await (client as any).rpc(
      "admin_get_system_overview",
    );

    if (!rpcError && rpcData && typeof rpcData === "object") {
      return {
        financials: {
          total_gmv: Number(rpcData.financials?.total_gmv || 0),
          commissions_paid: Number(rpcData.financials?.commissions_paid || 0),
          commissions_confirmed: Number(
            rpcData.financials?.commissions_confirmed || 0,
          ),
          pending_payouts_amount: Number(
            rpcData.financials?.pending_payouts_amount || 0,
          ),
          currency: "VND",
        },
        operational_counts: {
          total_orders: Number(rpcData.operational_counts?.total_orders || 0),
          confirmed_orders: Number(
            rpcData.operational_counts?.confirmed_orders || 0,
          ),
          pending_payouts_count: Number(
            rpcData.operational_counts?.pending_payouts_count || 0,
          ),
          merchants_count: Number(
            rpcData.operational_counts?.merchants_count || 0,
          ),
          resellers_count: Number(
            rpcData.operational_counts?.resellers_count || 0,
          ),
          products_count: Number(
            rpcData.operational_counts?.products_count || 0,
          ),
          campaigns_count: Number(
            rpcData.operational_counts?.campaigns_count || 0,
          ),
          total_clicks: Number(rpcData.operational_counts?.total_clicks || 0),
        },
        security_alerts: {
          flagged_self_purchase_orders: Number(
            rpcData.security_alerts?.flagged_self_purchase_orders || 0,
          ),
          bot_clicks_detected: Number(
            rpcData.security_alerts?.bot_clicks_detected || 0,
          ),
          action_required_payouts: Number(
            rpcData.security_alerts?.action_required_payouts || 0,
          ),
        },
        generated_at: rpcData.generated_at,
      };
    }

    // Fallback: Nếu RPC chưa chạy trên môi trường local, query trực tiếp các bảng
    const [
      ordersRes,
      commissionsRes,
      payoutsRes,
      merchantsRes,
      resellersRes,
      clicksRes,
      productsRes,
      campaignsRes,
    ] = await Promise.all([
      (client as any)
        .from("orders")
        .select("id, amount, status, flag_self_purchase"),
      (client as any).from("commissions").select("id, net_amount, status"),
      (client as any).from("payout_requests").select("id, amount, status"),
      (client as any).from("merchants").select("id", { count: "exact", head: true }),
      (client as any).from("resellers").select("id", { count: "exact", head: true }),
      (client as any).from("clicks").select("id, is_bot"),
      (client as any).from("products").select("id", { count: "exact", head: true }),
      (client as any).from("campaigns").select("id", { count: "exact", head: true }),
    ]);

    const orders = ordersRes.data || [];
    const commissions = commissionsRes.data || [];
    const payouts = payoutsRes.data || [];
    const clicks = clicksRes.data || [];

    const totalGmv = orders
      .filter((o: any) => o.status === "confirmed" || o.status === "paid")
      .reduce((sum: number, o: any) => sum + Number(o.amount || 0), 0);

    const commissionsPaid = commissions
      .filter((c: any) => c.status === "paid")
      .reduce((sum: number, c: any) => sum + Number(c.net_amount || 0), 0);

    const commissionsConfirmed = commissions
      .filter((c: any) => c.status === "confirmed")
      .reduce((sum: number, c: any) => sum + Number(c.net_amount || 0), 0);

    const pendingPayouts = payouts.filter(
      (p: any) => p.status === "pending" || p.status === "processing",
    );
    const pendingPayoutsAmount = pendingPayouts.reduce(
      (sum: number, p: any) => sum + Number(p.amount || 0),
      0,
    );

    const flaggedOrders = orders.filter((o: any) => Boolean(o.flag_self_purchase));
    const botClicks = clicks.filter((c: any) => Boolean(c.is_bot));

    return {
      financials: {
        total_gmv: totalGmv,
        commissions_paid: commissionsPaid,
        commissions_confirmed: commissionsConfirmed,
        pending_payouts_amount: pendingPayoutsAmount,
        currency: "VND",
      },
      operational_counts: {
        total_orders: orders.length,
        confirmed_orders: orders.filter((o: any) => o.status === "confirmed" || o.status === "paid").length,
        pending_payouts_count: pendingPayouts.length,
        merchants_count: merchantsRes.count || 0,
        resellers_count: resellersRes.count || 0,
        products_count: productsRes.count || 0,
        campaigns_count: campaignsRes.count || 0,
        total_clicks: clicks.length,
      },
      security_alerts: {
        flagged_self_purchase_orders: flaggedOrders.length,
        bot_clicks_detected: botClicks.length,
        action_required_payouts: pendingPayouts.length,
      },
      generated_at: new Date().toISOString(),
    };
  } catch (err) {
    console.error("[AdminService] getAdminSystemOverview error:", err);
    return {
      financials: {
        total_gmv: 0,
        commissions_paid: 0,
        commissions_confirmed: 0,
        pending_payouts_amount: 0,
        currency: "VND",
      },
      operational_counts: {
        total_orders: 0,
        confirmed_orders: 0,
        pending_payouts_count: 0,
        merchants_count: 0,
        resellers_count: 0,
        products_count: 0,
        campaigns_count: 0,
        total_clicks: 0,
      },
      security_alerts: {
        flagged_self_purchase_orders: 0,
        bot_clicks_detected: 0,
        action_required_payouts: 0,
      },
    };
  }
}

/**
 * Lấy danh sách yêu cầu rút tiền của Reseller kèm thông tin đối tác
 */
export async function getAdminPayoutRequests(
  client: SupabaseClient,
  filter?: { status?: string; limit?: number },
): Promise<AdminPayoutItem[]> {
  try {
    let query = (client as any)
      .from("payout_requests")
      .select(
        "id, reseller_id, amount, bank_name, account_number, account_name, status, created_at, processed_at, admin_notes, transfer_reference, resellers:reseller_id (id, name, email, phone)",
      )
      .order("created_at", { ascending: false });

    if (filter?.status && filter.status !== "all") {
      query = query.eq("status", filter.status);
    }

    if (filter?.limit) {
      query = query.limit(filter.limit);
    }

    const { data: items, error } = await query;

    if (error) {
      console.error("[AdminService] getAdminPayoutRequests error:", error);
      return [];
    }

    return (items || []).map((item: any) => ({
      id: item.id,
      resellerId: item.reseller_id,
      resellerName: item.resellers?.name || "Reseller",
      resellerEmail: item.resellers?.email || "chưa có email",
      resellerPhone: item.resellers?.phone,
      amount: Number(item.amount || 0),
      bankName: item.bank_name || "N/A",
      accountNumber: item.account_number || "N/A",
      accountName: item.account_name || "N/A",
      status: item.status,
      createdAt: item.created_at,
      processedAt: item.processed_at,
      adminNotes: item.admin_notes,
      transferReference: item.transfer_reference,
    }));
  } catch (err) {
    console.error("[AdminService] getAdminPayoutRequests catch:", err);
    return [];
  }
}

/**
 * Xử lý duyệt hoặc từ chối yêu cầu rút tiền
 */
export async function processAdminPayoutAction(
  client: SupabaseClient,
  payload: {
    payoutId: string;
    action: "approve" | "reject";
    adminId?: string;
    adminNotes?: string;
    transferReference?: string;
  },
): Promise<{ success: boolean; message: string; code?: string }> {
  const { payoutId, action, adminId, adminNotes, transferReference } = payload;

  try {
    // 1. Thử gọi RPC admin_process_payout_request nếu có
    const { data: rpcRes, error: rpcErr } = await (client as any).rpc(
      "admin_process_payout_request",
      {
        p_payout_id: payoutId,
        p_action: action,
        p_admin_id: adminId || null,
        p_admin_notes: adminNotes || null,
        p_transfer_reference: transferReference || null,
      },
    );

    if (!rpcErr && rpcRes) {
      return {
        success: Boolean(rpcRes.success),
        message: rpcRes.message || (rpcRes.success ? "Thành công" : rpcRes.error),
        code: rpcRes.code,
      };
    }

    // 2. Fallback trực tiếp nếu RPC chưa được chạy
    const { data: current, error: getErr } = await (client as any)
      .from("payout_requests")
      .select("id, status, amount, reseller_id")
      .eq("id", payoutId)
      .single();

    if (getErr || !current) {
      return { success: false, message: "Không tìm thấy yêu cầu rút tiền." };
    }

    if (current.status !== "pending" && current.status !== "processing") {
      return {
        success: false,
        message: `Yêu cầu này đã được xử lý trước đó với trạng thái: ${current.status}.`,
      };
    }

    const targetStatus = action === "approve" ? "completed" : "rejected";

    const { error: updateErr } = await (client as any)
      .from("payout_requests")
      .update({
        status: targetStatus,
        processed_at: new Date().toISOString(),
        processed_by: adminId || null,
        admin_notes: adminNotes || (action === "approve" ? "Đã chuyển khoản." : "Bị từ chối."),
        transfer_reference: transferReference || null,
      })
      .eq("id", payoutId);

    if (updateErr) {
      return { success: false, message: "Lỗi cập nhật yêu cầu: " + updateErr.message };
    }

    // Nếu approve, cập nhật commissions tương ứng sang paid
    if (action === "approve") {
      await (client as any)
        .from("commissions")
        .update({ status: "paid" })
        .eq("reseller_id", current.reseller_id)
        .eq("status", "confirmed");
    }

    return {
      success: true,
      message:
        action === "approve"
          ? "Đã xác nhận giải ngân thành công."
          : "Đã từ chối yêu cầu rút tiền và hoàn số dư cho Reseller.",
    };
  } catch (err: any) {
    return { success: false, message: "Lỗi ngoại lệ: " + (err?.message || err) };
  }
}

/**
 * Lấy danh sách các hoạt động nghi vấn gian lận (đơn tự mua & click bot)
 */
export async function getAdminFraudActivities(client: SupabaseClient): Promise<{
  flaggedOrders: AdminFlaggedOrder[];
  botClicks: AdminBotClick[];
}> {
  try {
    const [ordersRes, clicksRes] = await Promise.all([
      (client as any)
        .from("orders")
        .select(
          "id, booking_reference, amount, customer_name, reseller_id, merchant_id, status, created_at, flag_self_purchase, resellers:reseller_id (name), merchants:merchant_id (name)",
        )
        .eq("flag_self_purchase", true)
        .order("created_at", { ascending: false })
        .limit(50),
      (client as any)
        .from("clicks")
        .select("id, is_bot, bot_score, ip_address, user_agent, country, created_at")
        .eq("is_bot", true)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    const flaggedOrders: AdminFlaggedOrder[] = (ordersRes.data || []).map((o: any) => ({
      id: o.id,
      bookingReference: o.booking_reference || "N/A",
      amount: Number(o.amount || 0),
      customerName: o.customer_name,
      resellerId: o.reseller_id,
      resellerName: o.resellers?.name || "Reseller",
      merchantId: o.merchant_id,
      merchantName: o.merchants?.name || "Merchant",
      status: o.status,
      createdAt: o.created_at,
      flagSelfPurchase: Boolean(o.flag_self_purchase),
    }));

    const botClicks: AdminBotClick[] = (clicksRes.data || []).map((c: any) => ({
      id: c.id,
      ipAddress: c.ip_address,
      userAgent: c.user_agent,
      isBot: Boolean(c.is_bot),
      botScore: c.bot_score != null ? Number(c.bot_score) : null,
      country: c.country,
      createdAt: c.created_at,
    }));

    return { flaggedOrders, botClicks };
  } catch (err) {
    console.error("[AdminService] getAdminFraudActivities error:", err);
    return { flaggedOrders: [], botClicks: [] };
  }
}

/**
 * Lấy danh sách đối tác Merchant và Reseller
 */
export async function getAdminPartners(client: SupabaseClient): Promise<AdminPartnerItem[]> {
  try {
    const [merchantsRes, resellersRes] = await Promise.all([
      (client as any)
        .from("merchants")
        .select("id, name, status, created_at")
        .order("created_at", { ascending: false }),
      (client as any)
        .from("resellers")
        .select("id, name, email, phone, status, created_at")
        .order("created_at", { ascending: false }),
    ]);

    const merchants: AdminPartnerItem[] = (merchantsRes.data || []).map((m: any) => ({
      id: m.id,
      type: "merchant",
      name: m.name || "Doanh nghiệp",
      status: m.status || "active",
      createdAt: m.created_at,
    }));

    const resellers: AdminPartnerItem[] = (resellersRes.data || []).map((r: any) => ({
      id: r.id,
      type: "reseller",
      name: r.name || "Cộng tác viên",
      email: r.email,
      phone: r.phone,
      status: r.status || "active",
      createdAt: r.created_at,
    }));

    return [...merchants, ...resellers];
  } catch (err) {
    console.error("[AdminService] getAdminPartners error:", err);
    return [];
  }
}

/**
 * Khóa hoặc kích hoạt tài khoản đối tác
 */
export async function toggleAdminPartnerStatus(
  client: SupabaseClient,
  partnerId: string,
  partnerType: "merchant" | "reseller",
  status: "active" | "suspended",
): Promise<{ success: boolean; message: string }> {
  try {
    const table = partnerType === "merchant" ? "merchants" : "resellers";
    const { error } = await (client as any)
      .from(table)
      .update({ status })
      .eq("id", partnerId);

    if (error) {
      return { success: false, message: "Lỗi cập nhật: " + error.message };
    }

    return {
      success: true,
      message: `Đã chuyển trạng thái đối tác thành ${status === "active" ? "Đang hoạt động" : "Tạm khóa"}.`,
    };
  } catch (err: any) {
    return { success: false, message: "Lỗi ngoại lệ: " + (err?.message || err) };
  }
}
