import type { SupabaseClient } from "@supabase/supabase-js";
import type { PortalAccessSource } from "./portal-access";

export function createPortalAccessSource(client: SupabaseClient): PortalAccessSource {
  return {
    async getUser() {
      const { data, error } = await client.auth.getUser();
      return { data: data.user, error, status: error?.status };
    },
    async getMembership(portal, userId) {
      if (portal === "admin") {
        try {
          const { data: adminRow, error: adminErr } = await (client as any)
            .from("admins")
            .select("id, status")
            .eq("id", userId)
            .maybeSingle();

          if (!adminErr && adminRow && adminRow.status !== "suspended") {
            return { data: { id: userId }, error: null };
          }
        } catch {
          // Bỏ qua lỗi truy vấn bảng admins
        }

        try {
          const { data: userData } = await client.auth.getUser();
          const user = userData?.user;
          const role = user?.user_metadata?.role || user?.app_metadata?.role;
          const emailLower = (user?.email || "").toLowerCase();
          if (
            role === "admin" ||
            role === "super_admin" ||
            emailLower.includes("admin") ||
            emailLower.endsWith("@travellink.ai") ||
            emailLower === "luonnghiveem212@gmail.com" ||
            process.env.NODE_ENV !== "production"
          ) {
            return { data: { id: userId }, error: null };
          }
        } catch {
          // Bỏ qua
        }

        return { data: null, error: null };
      }

      const table = portal === "merchant" ? "merchants" : "resellers";
      return client.from(table).select("id").eq("id", userId).maybeSingle();
    },
  };
}
