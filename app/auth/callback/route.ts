import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  
  // Code dùng để xác thực email hoặc OAuth
  const code = searchParams.get("code");
  // Route redirect tới sau khi xác thực thành công
  const next = searchParams.get("next") ?? "/merchant";

  if (code) {
    const supabase = createClient(await cookies());
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Nếu có lỗi xác thực hoặc không có code, chuyển về trang lỗi (hoặc trang đăng nhập)
  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
