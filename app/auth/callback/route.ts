import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { cookies } from "next/headers";
import { resolveUserRole, safeNextPath } from "@/src/lib/role-auth";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const rawNext = searchParams.get("next");

  if (code) {
    const supabase = createClient(await cookies());
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const role = await resolveUserRole(supabase, data.user.id);
      if (!role) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=no_role`);
      }
      const destination = safeNextPath(rawNext, role);
      if (!destination) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=no_role`);
      }
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
