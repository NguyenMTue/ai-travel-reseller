import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";
import { fetchResellerWalletSummary } from "@/src/lib/commerce/wallet-service";

export const dynamic = "force-dynamic";

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

    // 3. Đối soát số dư khả dụng qua RPC get_reseller_wallet_summary
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

    const availableBalance = walletResult.data.balances.available_balance;
    if (numAmount > availableBalance) {
      return NextResponse.json(
        {
          success: false,
          error: `Số tiền yêu cầu rút (${new Intl.NumberFormat("vi-VN").format(numAmount)} ₫) vượt quá số dư khả dụng (${new Intl.NumberFormat("vi-VN").format(availableBalance)} ₫).`,
          code: "INSUFFICIENT_BALANCE",
        },
        { status: 400 }
      );
    }

    // 4. Ghi nhận bản ghi vào bảng payout_requests
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
