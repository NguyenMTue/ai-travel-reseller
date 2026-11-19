import "./start-storefront-mobile.mjs";
import { mkdirSync, existsSync, writeFileSync, unlinkSync, rmdirSync } from "node:fs";
const file = "app/storefront/fixture-checkout/page.tsx";
if (existsSync(file)) throw new Error("Refusing to overwrite fixture page");
mkdirSync("app/storefront/fixture-checkout", { recursive: true });
writeFileSync(file, "import { notFound } from \"next/navigation\";\nimport { resolveStorefrontData } from \"@/src/lib/storefront/data\";\nimport { CheckoutFixtureView } from \"@/tests/fixtures/checkout-view\";\nexport default async function Fixture() {\n  if (process.env.NODE_ENV !== \"development\" || process.env.TASK234_UI_FIXTURES !== \"1\") notFound();\n  const data = await resolveStorefrontData({ tenant: \"sunworld\", slug: \"ba-na-hills\" });\n  data.tracking = { refCode: \"22222222-2222-2222-2222-111111111111\", resellerName: \"Reseller Fixture\", discountEligible: true, discountPercent: 5 };\n  return <><p role=\"note\">Fixture TASK-235 — hợp đồng đề xuất, không phải thanh toán thật</p><CheckoutFixtureView data={data} /></>;\n}\n");
process.on("exit", () => { if (existsSync(file)) { unlinkSync(file); rmdirSync("app/storefront/fixture-checkout"); } });
