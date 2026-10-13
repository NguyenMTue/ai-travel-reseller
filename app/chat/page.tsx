import { cookies } from "next/headers";
import { AssistantPageHeader } from "@/src/components/chat/assistant-page-header";
import { ChatPanel, type Attribution } from "@/src/components/chat/chat-panel";
import { createClient } from "@/src/lib/supabase/server";
import { hasSupabaseConfig } from "@/src/lib/supabase/config";
import { homePathForRole, resolveUserRole } from "@/src/lib/role-auth";

export const metadata = { title: "Trợ lý AI" };

async function resolveAssistantHome(): Promise<string> {
  if (!hasSupabaseConfig) {
    return "/";
  }
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return "/";
  }
  const role = await resolveUserRole(supabase, user.id);
  if (!role) {
    return "/";
  }
  return homePathForRole(role);
}

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
  const keys = ["reseller_id", "campaign_id", "product_id"] as const;
  const valid = keys.every(
    (k) => typeof params[k] === "string" && uuid.test(params[k] as string),
  );
  const attribution: Attribution | null = valid
    ? {
        reseller_id: params.reseller_id as string,
        campaign_id: params.campaign_id as string,
        product_id: params.product_id as string,
      }
    : null;

  const homeHref = await resolveAssistantHome();

  return (
    <>
      <AssistantPageHeader homeHref={homeHref} />
      <main id="main-content" className="container chat-page page-enter">
        <ChatPanel attribution={attribution} />
      </main>
    </>
  );
}
