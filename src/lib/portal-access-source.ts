import type { SupabaseClient } from "@supabase/supabase-js";
import type { PortalAccessSource } from "./portal-access";

export function createPortalAccessSource(client: SupabaseClient): PortalAccessSource {
  return {
    async getUser() {
      const { data, error } = await client.auth.getUser();
      return { data: data.user, error, status: error?.status };
    },
    async getMembership(portal, userId) {
      const table = portal === "merchant" ? "merchants" : portal === "reseller" ? "resellers" : "admins";
      return client.from(table).select("id").eq("id", userId).maybeSingle();
    },
  };
}
