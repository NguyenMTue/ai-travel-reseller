import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/src/lib/supabase/middleware";

/**
 * Trích xuất subdomain của Doanh nghiệp (Tenant) từ Host Header.
 * Hỗ trợ cả môi trường dev (*.localhost:3000) và production (*.travellink.vn).
 */
function extractTenantSubdomain(hostHeader: string | null): string | null {
  if (!hostHeader) return null;
  const hostname = hostHeader.split(":")[0].toLowerCase().trim();

  // Danh sách các subdomain hệ thống không phải là trang đích của Doanh nghiệp
  const reservedSubdomains = new Set([
    "www",
    "api",
    "admin",
    "app",
    "reseller",
    "merchant",
    "localhost",
    "travellink",
    "travelelink",
    "test",
  ]);

  // Môi trường Local Development: e.g. sunworld.localhost:3000
  if (hostname.endsWith(".localhost")) {
    const sub = hostname.replace(/\.localhost$/, "");
    if (sub && !reservedSubdomains.has(sub)) return sub;
  }

  // Môi trường Production / Staging: e.g. sunworld.travellink.vn
  const parts = hostname.split(".");
  if (parts.length >= 3) {
    const sub = parts[0];
    if (sub && !reservedSubdomains.has(sub)) return sub;
  }

  return null;
}

// Next.js 16: `middleware.ts` đã đổi tên thành `proxy.ts`
export async function proxy(request: NextRequest) {
  // 1. Nhận diện Subdomain Doanh nghiệp (Multi-tenant Storefront Routing)
  const host = request.headers.get("host");
  const tenantSubdomain = extractTenantSubdomain(host);

  if (tenantSubdomain) {
    const { pathname } = request.nextUrl;

    // Không rewrite các route API, file tĩnh hoặc trang đăng nhập hệ thống
    if (
      !pathname.startsWith("/api") &&
      !pathname.startsWith("/_next") &&
      !pathname.startsWith("/storefront") &&
      !pathname.startsWith("/login") &&
      !pathname.startsWith("/auth")
    ) {
      let targetSlug = "default";
      if (pathname !== "/" && pathname !== "") {
        // Hỗ trợ các mẫu URL: /tour/[slug], /pay/[slug], /p/[slug], hoặc /[slug]
        targetSlug = pathname.replace(/^\/(?:tour|pay|p|product)?\/?/, "");
        if (!targetSlug) targetSlug = "default";
      }

      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = `/storefront/${tenantSubdomain}/${targetSlug}`;

      return NextResponse.rewrite(rewriteUrl, {
        request: {
          headers: request.headers,
        },
      });
    }
  }

  // 2. Refresh Auth session và bảo vệ route quản trị (Merchant / Reseller / Admin)
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Bỏ qua static files, ảnh và các file tĩnh phổ biến
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
