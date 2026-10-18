import { SiteHeader } from "@/src/components/site-header";
import { ChatPanel, type Attribution } from "@/src/components/chat/chat-panel";
export const metadata = { title: "Trợ lý AI" };
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
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="container chat-page">
        <ChatPanel attribution={attribution} />
      </main>
    </>
  );
}
