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

    return {
      success: true,
      data: parsed.data,
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
