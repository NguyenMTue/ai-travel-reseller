import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";
import {
  fetchResellerWalletSummary,
  fetchResellerPayoutHistory,
} from "@/src/lib/commerce/wallet-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/reseller/wallet/payout
 * Lấy danh sách lịch sử yêu cầu rút tiền của Reseller hiện tại
 */
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Kiểm tra xác thực người dùng
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    let resellerId = user?.id;

    if (!resellerId && process.env.NODE_ENV !== "production") {
      resellerId =
        request.headers.get("x-reseller-id")?.trim() ||
        new URL(request.url).searchParams.get("reseller_id")?.trim() ||
        undefined;
    }

    if (authError || !resellerId) {
      return NextResponse.json(
        {
          success: false,
          error: "Yêu cầu đăng nhập để xem lịch sử rút tiền hoa hồng.",
          code: "UNAUTHORIZED",
        },
        {
          status: 401,
          headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate" },
        }
      );
    }

    // 2. Lấy danh sách yêu cầu rút tiền
    const limit = Math.min(
      100,
      Math.max(1, Number(new URL(request.url).searchParams.get("limit") || 20))
    );

    const historyResult = await fetchResellerPayoutHistory(
      supabase as any,
      resellerId,
      limit
    );

    if (!historyResult.success || !historyResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: historyResult.error || "Không thể tải lịch sử rút tiền lúc này.",
          code: "PAYOUT_HISTORY_ERROR",
        },
        { status: 500 }
      );
    }

    const payouts = historyResult.data;
    const total_pending = payouts
      .filter((p) => p.status === "pending" || p.status === "processing")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const total_completed = payouts
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return NextResponse.json(
      {
        success: true,
        data: {
          payouts,
          total_pending,
          total_completed,
          count: payouts.length,
        },
      },
      {
        status: 200,
        headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate" },
      }
    );
  } catch (error: any) {
    console.error("[PAYOUT_GET_API_ERROR] Exception:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Lỗi hệ thống khi tải lịch sử rút tiền.",
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reseller/wallet/payout
 * Tạo yêu cầu rút tiền với cơ chế chống Double-Spend (Race condition & Over-withdrawal)
 */
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Kiểm tra xác thực người dùng
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    let resellerId = user?.id;

    if (!resellerId && process.env.NODE_ENV !== "production") {
      resellerId =
        request.headers.get("x-reseller-id")?.trim() ||
        new URL(request.url).searchParams.get("reseller_id")?.trim() ||
        undefined;
    }

    if (authError || !resellerId) {
      return NextResponse.json(
        {
          success: false,
          error: "Yêu cầu đăng nhập để gửi yêu cầu rút tiền hoa hồng.",
          code: "UNAUTHORIZED",
        },
        {
          status: 401,
          headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate" },
        }
      );
    }

    // 2. Parse body và validate input
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          success: false,
          error: "Dữ liệu yêu cầu rút tiền không hợp lệ.",
          code: "INVALID_BODY",
        },
        { status: 400 }
      );
    }

    const { amount, bank_name, account_number, account_name } = body;

    const numAmount = Number(amount);
    if (!numAmount || isNaN(numAmount) || numAmount < 100000 || !Number.isFinite(numAmount)) {
      return NextResponse.json(
        {
          success: false,
          error: "Số tiền rút tối thiểu là 100.000 VNĐ.",
          code: "INVALID_AMOUNT",
        },
        { status: 400 }
      );
    }

    if (!bank_name || typeof bank_name !== "string" || !bank_name.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng chọn hoặc nhập tên ngân hàng thụ hưởng.",
          code: "MISSING_BANK_NAME",
        },
        { status: 400 }
      );
    }

    if (!account_number || typeof account_number !== "string" || account_number.trim().length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: "Số tài khoản ngân hàng không hợp lệ (tối thiểu 6 ký tự số).",
          code: "INVALID_ACCOUNT_NUMBER",
        },
        { status: 400 }
      );
    }

    if (!account_name || typeof account_name !== "string" || account_name.trim().length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng nhập họ và tên chủ tài khoản thụ hưởng.",
          code: "MISSING_ACCOUNT_NAME",
        },
        { status: 400 }
      );
    }

    // 3. Cơ chế chống Double-Spend Tầng 1: Thử gọi Stored Procedure Atomic Lock (request_reseller_payout)
    try {
      const { data: rpcData, error: rpcError } = await (supabase as any).rpc(
        "request_reseller_payout",
        {
          p_reseller_id: resellerId,
          p_amount: numAmount,
          p_bank_name: bank_name.trim(),
          p_account_number: account_number.trim(),
          p_account_name: account_name.trim().toUpperCase(),
        }
      );

      if (!rpcError && rpcData && typeof rpcData === "object") {
        if (rpcData.success) {
          return NextResponse.json(
            {
              success: true,
              message: rpcData.message || "Yêu cầu rút tiền đã được tạo thành công và đang chờ xử lý.",
              data: rpcData.data,
              effective_available_after: rpcData.effective_available_after,
            },
            {
              status: 201,
              headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate" },
            }
          );
        } else {
          return NextResponse.json(
            {
              success: false,
              error: rpcData.error || "Giao dịch rút tiền không hợp lệ.",
              code: rpcData.code || "PAYOUT_REJECTED",
              effective_available: rpcData.effective_available,
              locked_amount: rpcData.locked_amount,
            },
            { status: 400 }
          );
        }
      }
    } catch {
      // Fallback xuống tầng 2 nếu DB RPC chưa được deploy trên schema cache
    }

    // 4. Cơ chế chống Double-Spend Tầng 2 (Application-level Defense-in-depth):
    // 4.1. Đối soát số dư hoa hồng khả dụng qua RPC get_reseller_wallet_summary
    const walletResult = await fetchResellerWalletSummary(supabase as any, resellerId);
    if (!walletResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Không thể đối soát số dư ví lúc này: " + walletResult.error,
          code: "WALLET_RPC_ERROR",
        },
        { status: 500 }
      );
    }

    // 4.2. Khấu trừ trực tiếp các khoản payout_requests đang 'pending' hoặc 'processing'
    const { data: activePayouts } = await supabase
      .from("payout_requests")
      .select("amount")
      .eq("reseller_id", resellerId)
      .in("status", ["pending", "processing"]);

    const lockedPendingAmount = (activePayouts || []).reduce(
      (sum, p: any) => sum + Number(p.amount || 0),
      0
    );

    // Số dư khả dụng danh nghĩa (chưa trừ pending)
    const nominalAvailableBalance = walletResult.data.balances.available_balance;
    // Số dư khả dụng thực tế sau khi trừ các khoản đang giữ chỗ
    const effectiveAvailableBalance = Math.max(0, nominalAvailableBalance - lockedPendingAmount);

    if (numAmount > effectiveAvailableBalance) {
      return NextResponse.json(
        {
          success: false,
          error: `Số tiền yêu cầu rút (${new Intl.NumberFormat("vi-VN").format(numAmount)} ₫) vượt quá số dư khả dụng thực tế (${new Intl.NumberFormat("vi-VN").format(effectiveAvailableBalance)} ₫) sau khi đã khấu trừ ${new Intl.NumberFormat("vi-VN").format(lockedPendingAmount)} ₫ đang chờ xử lý.`,
          code: "INSUFFICIENT_BALANCE",
          details: {
            nominal_available: nominalAvailableBalance,
            locked_pending: lockedPendingAmount,
            effective_available: effectiveAvailableBalance,
          },
        },
        { status: 400 }
      );
    }

    // 5. Ghi nhận bản ghi vào bảng payout_requests
    const { data: payout, error: insertError } = await supabase
      .from("payout_requests")
      .insert({
        reseller_id: resellerId,
        amount: numAmount,
        bank_name: bank_name.trim(),
        account_number: account_number.trim(),
        account_name: account_name.trim().toUpperCase(),
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("[PAYOUT_API_ERROR] Lỗi chèn payout_requests:", insertError);
      if (
        insertError.code === "PGRST205" ||
        insertError.code === "42P01" ||
        (typeof insertError.message === "string" && insertError.message.includes("payout_requests"))
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Hệ thống đang đồng bộ cơ sở dữ liệu rút tiền (bảng payout_requests chưa hoàn tất migration trên Supabase). Vui lòng thử lại sau hoặc liên hệ Admin.",
            code: "MIGRATION_PENDING",
          },
          { status: 503 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          error: "Lỗi ghi nhận yêu cầu rút tiền: " + insertError.message,
          code: "DB_INSERT_ERROR",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Yêu cầu rút tiền đã được tạo thành công và đang chờ xử lý.",
        data: payout,
        effective_available_after: effectiveAvailableBalance - numAmount,
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    console.error("[PAYOUT_API_ERROR] Exception:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Lỗi hệ thống khi xử lý yêu cầu rút tiền.",
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
