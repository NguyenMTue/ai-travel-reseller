import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";
import { hasSupabaseConfig } from "@/src/lib/supabase/config";
import { loadPortalAccess, type PortalAccess } from "@/src/lib/portal-access";
import { createPortalAccessSource } from "@/src/lib/portal-access-source";

export const getMerchantPortalAccess = cache(async (): Promise<PortalAccess> => {
  if (!hasSupabaseConfig) return { status: "unavailable", reason: "configuration" };
  return loadPortalAccess(createPortalAccessSource(createClient(await cookies())), "merchant");
});
