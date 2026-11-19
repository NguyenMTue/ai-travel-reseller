"use client";
import type { StorefrontData } from "@/src/lib/storefront/types";
import type { CheckoutGateway } from "@/src/lib/storefront/checkout";
import { StorefrontView } from "@/src/components/storefront/storefront-view";

async function call(path: string, payload: unknown, signal: AbortSignal) {
  const response = await fetch("/__fixtures__/checkout/" + path, { method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error("Fixture HTTP failure");
  return response.json();
}
const gateway: CheckoutGateway = {
  prepare: (draft, { signal, supersedesOrderId }) => call("prepare", { draft, supersedesOrderId }, signal),
  check: (quote, { signal }) => call("check", { quote }, signal),
};
// Only imported by the temporary fixture page, never by a production route.
export function CheckoutFixtureView({ data }: { data: StorefrontData }) {
  return <StorefrontView data={data} checkoutGateway={gateway} />;
}
