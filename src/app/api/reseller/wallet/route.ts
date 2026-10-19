import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";
import { fetchResellerWalletSummary } from "@/src/lib/commerce/wallet-service";

/**
 * GET /api/reseller/wallet
 * Lấy số dư ví hoa hồng và thống kê đơn hàng của Reseller hiện tại.
 * 
 * Bảo mật:
 * 1. Bắt buộc có phiên đăng nhập hợp lệ (401 Unauthorized nếu chưa đăng nhập).
 * 2. Xác thực tài khoản thuộc role Reseller (403 Forbidden nếu không phải Reseller).
 * 3. Ngăn chặn caching trung gian hoặc rò rỉ dữ liệu tài chính (Cache-Control: private, no-store).
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Kiểm tra xác thực người dùng
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Yêu cầu đăng nhập để truy cập thông tin ví hoa hồng",
          code: "UNAUTHORIZED",
        },
        {
          status: 401,
          headers: {
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
          },
        },
      );
    }

    // 2. Xác thực vai trò: Người dùng phải là một Reseller hợp lệ
    const { data: reseller, error: resellerError } = await supabase
      .from("resellers")
      .select("id, status")
      .eq("id", user.id)
      .maybeSingle();

    if (resellerError || !reseller) {
      return NextResponse.json(
        {
          success: false,
          error: "Tài khoản không có quyền truy cập cổng Reseller",
          code: "FORBIDDEN",
        },
        {
          status: 403,
          headers: {
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
          },
        },
      );
    }

    // 3. Gọi hàm RPC tổng hợp dữ liệu ví an toàn từ Database
    const walletResult = await fetchResellerWalletSummary(supabase, user.id);

    if (!walletResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: walletResult.error,
          code: walletResult.code,
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
          },
        },
      );
    }

    // 4. Trả về kết quả thành công kèm header bảo mật dữ liệu nhạy cảm
    return NextResponse.json(
      {
        success: true,
        data: walletResult.data,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      },
    );
  } catch (error: unknown) {
    console.error("[WALLET_API_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Lỗi hệ thống khi xử lý dữ liệu ví hoa hồng",
        code: "INTERNAL_SERVER_ERROR",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      },
    );
  }
}
