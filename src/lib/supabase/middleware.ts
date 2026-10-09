import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { supabaseUrl, supabasePublicKey as supabaseKey, hasSupabaseConfig } from "./config";

export const createClient = (request: NextRequest) => {
  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    },
  );

  return supabaseResponse
};

// Các route yêu cầu đăng nhập (Merchant / Reseller / Admin Portal)
const PROTECTED_PREFIXES = ["/merchant", "/reseller", "/admin"];

/**
 * Refresh Supabase Auth session cho mỗi request (dùng trong proxy.ts – Next.js 16)
 * và chuyển hướng về /login nếu truy cập route được bảo vệ khi chưa đăng nhập.
 */
export const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({ request });
  // Public UI remains reviewable without credentials; protected portals stay closed.
  if (!hasSupabaseConfig) {
    const pathname = request.nextUrl.pathname;
    if (PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // KHÔNG chèn logic nào giữa createServerClient và getUser() – dễ gây mất session ngẫu nhiên.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Phải trả về supabaseResponse để cookie session mới được gửi về trình duyệt.
  return supabaseResponse;
};