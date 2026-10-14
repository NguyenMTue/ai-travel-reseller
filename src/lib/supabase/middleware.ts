import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import {
  homePathForRole,
  resolveUserRoleFromClaims,
} from "@/src/lib/role-auth";
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

/**
 * Refresh Supabase Auth session cho mỗi request (dùng trong proxy.ts – Next.js 16)
 * và chuyển hướng về /login nếu truy cập route được bảo vệ khi chưa đăng nhập.
 */
export const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({ request });
  const { pathname } = request.nextUrl;
  const isMerchantRoute = pathname === "/merchant" || pathname.startsWith("/merchant/");
  const isResellerRoute = pathname === "/reseller" || pathname.startsWith("/reseller/");
  const isProtected = isMerchantRoute || isResellerRoute || pathname === "/admin" || pathname.startsWith("/admin/");

  // Keep public pages and static requests out of Supabase Auth and role checks.
  if (!isProtected) return supabaseResponse;

  // Public UI remains reviewable without credentials; protected portals stay closed.
  if (!hasSupabaseConfig) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
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

  // getClaims verifies the JWT locally when asymmetric signing keys are used.
  const { data, error: claimsError } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const userId = typeof claims?.sub === "string" ? claims.sub : null;

  const createRedirect = (url: URL) => {
    const res = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((c) => {
      res.cookies.set(c.name, c.value);
    });
    return res;
  };

  if (claimsError || !userId) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return createRedirect(url);
  }

  if (userId) {
    const role = await resolveUserRoleFromClaims(
      supabase,
      claims as Record<string, unknown>,
    );

    if (!role) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "no_role");
      return createRedirect(url);
    }

    if (isMerchantRoute && role !== "merchant") {
      const url = request.nextUrl.clone();
      url.pathname = homePathForRole(role);
      return createRedirect(url);
    }

    if (isResellerRoute && role !== "reseller") {
      const url = request.nextUrl.clone();
      url.pathname = homePathForRole(role);
      return createRedirect(url);
    }
  }

  // Phải trả về supabaseResponse để cookie session mới được gửi về trình duyệt.
  return supabaseResponse;
};
