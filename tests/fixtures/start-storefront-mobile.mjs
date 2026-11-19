import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, unlinkSync, rmdirSync } from "node:fs";
import { startFixture } from "./storefront-referral.mjs";

// Install a temporary dev-only page to hydrate the real View with explicit
// voucher eligibility. No fixture/discount switch is added to production code.
export const fixturePage = "app/storefront/fixture-confirmed/page.tsx";
export const fixtureSource = 'import { notFound } from "next/navigation";\nimport { resolveStorefrontData } from "@/src/lib/storefront/data";\nimport { StorefrontView } from "@/src/components/storefront/storefront-view";\nexport default async function Fixture() {\n  if (process.env.NODE_ENV !== "development" || process.env.TASK234_UI_FIXTURES !== "1") notFound();\n  const data = await resolveStorefrontData({ tenant: "sunworld", slug: "ba-na-hills", searchParams: { ref: "22222222-2222-2222-2222-111111111111", campaign: "44444444-4444-4444-4444-444444444444" } });\n  data.tracking = { ...data.tracking, discountEligible: true, discountPercent: 5 };\n  return <><p role="note">Fixture TASK-234 — dữ liệu mẫu, không phải ưu đãi thật</p><StorefrontView data={data} /></>;\n}\n';

for (const envFile of [".env", ".env.local", ".env.development", ".env.development.local"]) {
  if (existsSync(envFile)) throw new Error("Run this fixture only in a checkout without runtime env files");
}
if (existsSync(fixturePage)) throw new Error("Refusing to overwrite an existing fixture page");
const fixture = await startFixture(3217);
mkdirSync("app/storefront/fixture-confirmed", { recursive: true });
writeFileSync(fixturePage, fixtureSource);
const env = { ...process.env, NEXT_TELEMETRY_DISABLED: "1", TASK234_UI_FIXTURES: "1" };
for (const key of Object.keys(env)) {
  if (/SUPABASE|POSTHOG|TELEGRAM|GEMINI|GROQ|AI_STUDIO|MUSE2API/.test(key)) delete env[key];
}
env.NEXT_PUBLIC_SUPABASE_URL = fixture.url;
env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_task234_fixture";
console.log("TASK-234: local read-only fixture at " + fixture.url);
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3216"], { env, stdio: "inherit" });
child.on("exit", code => {
  fixture.server.close();
  unlinkSync(fixturePage);
  rmdirSync("app/storefront/fixture-confirmed");
  process.exitCode = code || 0;
});
