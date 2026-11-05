import type { Attribution } from "./transport";

// Exact hosts from BE1 checkout guide v1.0.0 section 3.3.
// Subdomains and alternate ports require a separate reviewed contract.
const checkoutHosts = new Set([
  "sunworld.vn", "checkout.culaochamtravel.vn", "culaochamtravel.vn", "vinwonders.com",
]);

// Only consume the structured URL returned by /api/chat, never URLs in reply text.
// The backend derives this URL from products.payment_url; query IDs are context,
// not authorization, a signed attribution proof, or proof of payment.
export function checkoutDestination(raw: unknown, attribution: Attribution | null) {
  if (typeof raw !== "string" || !raw.trim() || !attribution) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password || url.hash || url.port) return null;
    if (!checkoutHosts.has(url.hostname)) return null;
    for (const [key, value] of [
      ["ref", attribution.reseller_id],
      ["campaign", attribution.campaign_id],
      ["product", attribution.product_id],
    ]) {
      const values = url.searchParams.getAll(key);
      if (!value || values.length !== 1 || values[0] !== value) return null;
    }
    // No secret-bearing URL should be surfaced by the checkout card.
    for (const key of url.searchParams.keys()) {
      if (/^(api[_-]?key|access[_-]?token|refresh[_-]?token|secret|authorization|password)$/i.test(key)) return null;
    }
    return { href: url.href, hostname: url.hostname };
  } catch {
    return null;
  }
}