import { spawn } from "node:child_process";
import { startFixture } from "./storefront-referral.mjs";

const fixture = await startFixture(3217);
const env = { ...process.env, NEXT_TELEMETRY_DISABLED: "1" };
for (const key of Object.keys(env)) {
  if (/SUPABASE|POSTHOG|TELEGRAM|GEMINI|GROQ|AI_STUDIO|MUSE2API/.test(key)) delete env[key];
}
env.NEXT_PUBLIC_SUPABASE_URL = fixture.url;
env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_task233_fixture";
console.log("TASK-233: local read-only fixture at " + fixture.url);
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3216"], { env, stdio: "inherit" });
child.on("exit", code => { fixture.server.close(); process.exitCode = code || 0; });
