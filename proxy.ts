import type { NextRequest } from "next/server";
import { updateSession } from "@/src/lib/supabase/middleware";

// Next.js 16: `middleware.ts` đã đổi tên thành `proxy.ts`
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/merchant",
    "/merchant/:path*",
    "/reseller",
    "/reseller/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
