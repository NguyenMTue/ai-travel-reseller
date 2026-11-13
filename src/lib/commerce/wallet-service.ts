import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/src/lib/database.types";

/**
 * Schema kiểm tra dữ liệu giao dịch hoa hồng gần nhất
 */
export const recentCommissionItemSchema = z.object({
  id: z.string(),
  order_id: z.string(),
  booking_reference: z.string(),
  campaign_id: z.string().nullable(),
  campaign_name: z.string(),
  gross_amount: z.number(),
  platform_fee: z.number(),
  net_amount: z.number(),
  status: z.string(),
  order_amount: z.number(),
  customer_name: z.string(),
  flag_self_purchase: z.boolean(),
  created_at: z.string(),
});

export type RecentCommissionItem = z.infer<typeof recentCommissionItemSchema>;

/**
 * Schema kiểm tra dữ liệu tóm tắt Ví hoa hồng của Reseller
 */
export const resellerWalletSummarySchema = z.object({
  reseller_id: z.string(),
  balances: z.object({
    available_balance: z.number(),
    pending_balance: z.number(),
    paid_balance: z.number(),
    refunded_balance: z.number(),
    lifetime_earnings: z.number(),
    pending_payout_balance: z.number().optional(),
    currency: z.string().default("VND"),
  }),
  order_metrics: z.object({
    total_orders: z.number(),
    confirmed_orders: z.number(),
    pending_orders: z.number(),
    total_gmv: z.number(),
    flagged_self_purchase_orders: z.number(),
  }),
  recent_commissions: z.array(recentCommissionItemSchema).default([]),
  last_updated: z.string(),
});

export type ResellerWalletSummary = z.infer<typeof resellerWalletSummarySchema>;

export type WalletServiceResult =
  | { success: true; data: ResellerWalletSummary }
  | { success: false; error: string; code: string };

/**
 * Schema kiểm tra dữ liệu yêu cầu rút tiền của Reseller
 */
export const payoutRequestItemSchema = z.object({
  id: z.string(),
  reseller_id: z.string().optional(),
  amount: z.number(),
  bank_name: z.string(),
  account_number: z.string(),
  account_name: z.string(),
  status: z.enum(["pending", "processing", "completed", "rejected"]),
  created_at: z.string(),
});

export type PayoutRequestItem = z.infer<typeof payoutRequestItemSchema>;

/**
 * Gọi Stored Procedure RPC get_reseller_wallet_summary trong Database
 * và xác thực tính toàn vẹn cấu trúc trả về qua Zod.
 */
export async function fetchResellerWalletSummary(
  client: SupabaseClient<Database>,
  resellerId: string,
): Promise<WalletServiceResult> {
  try {
    const { data, error } = await client.rpc(
      "get_reseller_wallet_summary",
      { p_reseller_id: resellerId },
    );

    if (error) {
      return {
        success: false,
        error: error.message,
        code: error.code || "RPC_ERROR",
      };
    }

    if (!data) {
      return {
        success: false,
        error: "Không nhận được dữ liệu ví từ hệ thống",
        code: "EMPTY_DATA",
      };
    }

    const parsed = resellerWalletSummarySchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: "Dữ liệu ví không đúng định dạng chuẩn",
        code: "VALIDATION_ERROR",
      };
    }

    // Tự động kiểm tra và khấu trừ payout_requests đang pending/processing nếu RPC chưa khấu trừ
    let adjustedAvailable = parsed.data.balances.available_balance;
    let pendingPayoutsTotal = parsed.data.balances.pending_payout_balance || 0;

    if (pendingPayoutsTotal === 0 && typeof (client as any)?.from === "function") {
      try {
        const { data: payouts } = await (client as any)
          .from("payout_requests")
          .select("amount")
          .eq("reseller_id", resellerId)
          .in("status", ["pending", "processing"]);
        if (payouts && Array.isArray(payouts) && payouts.length > 0) {
          pendingPayoutsTotal = payouts.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
          adjustedAvailable = Math.max(0, adjustedAvailable - pendingPayoutsTotal);
        }
      } catch {
        // Fallback im lặng nếu client mock không hỗ trợ from
      }
    }

    return {
      success: true,
      data: {
        ...parsed.data,
        balances: {
          ...parsed.data.balances,
          available_balance: adjustedAvailable,
          pending_payout_balance: pendingPayoutsTotal,
        },
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi không xác định khi truy vấn ví";
    return {
      success: false,
      error: message,
      code: "EXCEPTION",
    };
  }
}

/**
 * Lấy lịch sử yêu cầu rút tiền của Reseller
 */
export async function fetchResellerPayoutHistory(
  client: SupabaseClient<Database>,
  resellerId: string,
  limit = 20,
): Promise<{ success: boolean; data?: PayoutRequestItem[]; error?: string }> {
  try {
    const { data, error } = await (client as any)
      .from("payout_requests")
      .select("id, reseller_id, amount, bank_name, account_number, account_name, status, created_at")
      .eq("reseller_id", resellerId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      // Khi bảng payout_requests chưa được deploy qua migration lên Supabase (PGRST205 / 42P01),
      // trả về mảng rỗng một cách an toàn để không làm gãy giao diện Ví hoa hồng của Reseller.
      if (
        error.code === "PGRST205" ||
        error.code === "42P01" ||
        (typeof error.message === "string" && error.message.includes("payout_requests"))
      ) {
        console.warn("[WALLET_SERVICE] Bảng payout_requests chưa tồn tại trong schema cache Supabase. Trả về mảng rỗng an toàn.");
        return { success: true, data: [] };
      }
      return { success: false, error: error.message };
    }

    return { success: true, data: (data || []) as PayoutRequestItem[] };
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi truy vấn lịch sử rút tiền" };
  }
}
