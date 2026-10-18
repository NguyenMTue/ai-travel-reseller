import type { SupabaseClient } from "@supabase/supabase-js";
import type { PortalAccessSource } from "./portal-access";

export function createPortalAccessSource(client: SupabaseClient): PortalAccessSource {
  return {
    async getUser() {
      const { data, error } = await client.auth.getUser();
      return { data: data.user, error, status: error?.status };
    },
    async getMembership(portal, userId) {
      return client.from(portal === "merchant" ? "merchants" : "resellers").select("id").eq("id", userId).maybeSingle();
    },
  };
}
