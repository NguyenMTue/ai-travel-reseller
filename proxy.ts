import type { NextRequest } from "next/server";
import { updateSession } from "@/src/lib/supabase/middleware";

// Next.js 16: `middleware.ts` đã đổi tên thành `proxy.ts`
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Bỏ qua static files, ảnh và các file tĩnh phổ biến
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
