// Isolated fake Supabase HTTP protocol for SSR login/portal tests. Never connects
// to Supabase or reads .env files. Synthetic identities/passwords only.
import { createServer } from "node:http";
const port = 3116;
const tokens = new Map();
let writes = 0;
const names = ["reseller", "merchant", "both", "none", "profile-error", "expired"];
const profiles = Object.fromEntries(names.map((name, index) => [name, {
  id: `${String(index + 1).repeat(8)}-1111-1111-1111-111111111111`,
  aud: "authenticated", role: "authenticated", email: `${name}@fixture.invalid`,
  app_metadata: {}, user_metadata: { role: name === "reseller" ? "merchant" : "reseller" }, created_at: "2026-01-01T00:00:00Z",
}]));
const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  const send = (data, status = 200) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(data)); };
  if (url.pathname === "/health") return send({ fixture: true, writes });
  if (url.pathname === "/auth/v1/token" && req.method === "POST") {
    let text = "";
    for await (const chunk of req) text += chunk;
    const { email, password } = JSON.parse(text);
    const name = names.find(value => profiles[value].email === email);
    if (!name || password !== "fixture-only") return send({ message: "Invalid fixture credentials" }, 400);
    const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
    const token = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: profiles[name].id, aud: "authenticated", role: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 })}.fixture-signature`;
    tokens.set(token, name);
    return send({ access_token: token, refresh_token: `fixture-refresh-${name}`, token_type: "bearer", expires_in: 3600, user: profiles[name] });
  }
  const name = tokens.get((req.headers.authorization || "").replace(/^Bearer /i, ""));
  if (url.pathname === "/auth/v1/user") return name && name !== "expired" ? send(profiles[name]) : send({ message: "Fixture expired session", code: "bad_jwt" }, 401);
  if (url.pathname === "/auth/v1/logout") return send({});
  if (url.pathname.startsWith("/rest/v1/")) {
    if (req.method !== "GET") { writes++; return send({ code: "42501", message: "Fixture forbids all data writes" }, 403); }
    if (!name || name === "expired") return send({ code: "PGRST301" }, 401);
    const table = url.pathname.split("/").pop();
    if (["merchants", "resellers"].includes(table)) {
      if (name === "profile-error") return send({ code: "08006", message: "private fixture query details" }, 503);
      const allowed = name === "both" || (table === "merchants" && name === "merchant") || (table === "resellers" && name === "reseller");
      return send(allowed && url.searchParams.get("id") === `eq.${profiles[name].id}` ? [{ id: profiles[name].id }] : []);
    }
    if (["campaigns", "products"].includes(table)) return send([]);
    return send({ code: "42P01" }, 400);
  }
  return send({ error: "Unsupported fixture path" }, 404);
});
server.listen(port, "127.0.0.1");
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close(() => process.exit(0)));
