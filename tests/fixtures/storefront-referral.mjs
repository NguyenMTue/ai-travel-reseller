import { createServer } from "node:http";

export const RESELLER = "22222222-2222-2222-2222-111111111111";
export const MERCHANT = "11111111-1111-1111-1111-111111111111";
export const PRODUCT = "33333333-3333-3333-3333-333333333333";
export const CAMPAIGN = "44444444-4444-4444-4444-444444444444";
export const NAME = "Nguyễn An — Khám phá Đà Nẵng cùng TravelLink";

// Local, read-only PostgREST fixture. No production credentials or services.
export async function startFixture(port = 0) {
  const requests = [];
  const server = createServer((req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    requests.push({ method: req.method, path: url.pathname, query: url.search });
    res.setHeader("Content-Type", "application/json");
    if (req.method !== "GET") { res.writeHead(405); res.end("{}"); return; }
    const table = url.pathname.split("/").at(-1);
    const ref = url.searchParams.get("reseller_id") || url.searchParams.get("id");
    const rows = {
      merchants: [{ id: MERCHANT, name: "Sun World Đà Nẵng" }],
      products: [{ id: PRODUCT, merchant_id: MERCHANT, name: "Vé Cáp Treo Sun World Ba Na Hills", sale_price: 950000, original_price: 1250000 }],
      campaigns: [{ id: CAMPAIGN, product_id: PRODUCT, merchant_id: MERCHANT, name: "Khám phá Bà Nà", commission_rate: 12 }],
      contents: [],
      affiliate_links: ref === "eq." + RESELLER ? [{ id: "fixture-link" }] : [],
      resellers: ref === "eq." + RESELLER ? [{ name: NAME }] : [],
    };
    if (!Object.hasOwn(rows, table)) { res.writeHead(404); res.end("{}"); return; }
    res.end(JSON.stringify(rows[table]));
  });
  await new Promise(resolve => server.listen(port, "127.0.0.1", resolve));
  return { server, requests, url: "http://127.0.0.1:" + server.address().port };
}
