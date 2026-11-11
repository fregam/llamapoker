/**
 * The door. Everything on the wall is private: a request must carry a signed session cookie
 * (set by POST /api/login with WALL_PASSWORD) or, for agents writing to the store, a bearer
 * token equal to WALL_INGEST_KEY. Without a cookie the page is replaced by the login screen and
 * /api answers 401. On localhost with no WALL_PASSWORD set (wrangler pages dev) the door is open.
 *
 * Variables on the Pages project: WALL_PASSWORD (secret), WALL_SECRET (secret, signs the cookie),
 * WALL_INGEST_KEY (secret, for scripts/wall-event.mjs and the site's subscribe function).
 * Upgrade path: put Cloudflare Access in front of the project and this file only has to check
 * the ingest key.
 */
import type { Env } from "./_lib/store";

const COOKIE = "wall";
const DAYS = 30;
const enc = new TextEncoder();

async function sign(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const same = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

async function hasSession(request: Request, secret: string): Promise<boolean> {
  const m = (request.headers.get("Cookie") ?? "").match(new RegExp(`(?:^|;\\s*)${COOKIE}=([0-9]+)\\.([0-9a-f]+)`));
  if (!m) return false;
  const [, exp, sig] = m;
  if (Number(exp) < Date.now()) return false;
  return same(await sign(secret, exp), sig);
}

const json = (status: number, body: object, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers } });

const loginPage = (message = "") => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Wall</title><meta name="robots" content="noindex">
<link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600&family=Share+Tech+Mono&display=swap" rel="stylesheet">
<style>html,body{height:100%;margin:0;background:#040a0d;color:#6fe3ff;font:14px 'Share Tech Mono',monospace}
body{display:grid;place-items:center;background:radial-gradient(ellipse at 50% 42%,#08171e 0%,#050d12 55%,#020507 100%)}
form{border:1px solid rgba(111,227,255,.3);padding:28px 32px;min-width:280px;background:rgba(6,20,27,.6)}
h1{font:600 13px 'Chakra Petch',sans-serif;letter-spacing:.3em;margin:0 0 18px;color:#49a9c4}
input{display:block;width:100%;box-sizing:border-box;background:#02070a;border:1px solid rgba(111,227,255,.35);color:#6fe3ff;font:16px 'Share Tech Mono',monospace;padding:9px 10px;outline:none}
input:focus{border-color:#6fe3ff;box-shadow:0 0 10px rgba(111,227,255,.3)}
button{margin-top:14px;width:100%;background:none;border:1px solid #6fe3ff;color:#6fe3ff;font:600 12px 'Chakra Petch',sans-serif;letter-spacing:.25em;padding:9px;cursor:pointer}
p{color:#ffb347;margin:12px 0 0;font-size:12px;min-height:1em}</style></head>
<body><form method="post" action="/api/login"><h1>LLAMAPOKER / WALL</h1><input type="password" name="password" autofocus autocomplete="current-password" placeholder="passphrase"><button>OPEN</button><p>${message}</p></form></body></html>`;

const html = (status: number, body: string, headers: Record<string, string> = {}) =>
  new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", ...headers } });

export const onRequest: PagesFunction<Env> = async ({ request, env, next }) => {
  const url = new URL(request.url);
  const path = url.pathname;
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";

  if (path === "/api/logout") return html(200, loginPage("Closed."), { "Set-Cookie": `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax` });

  if (!env.WALL_PASSWORD || !env.WALL_SECRET) {
    if (local) return next(); // wrangler pages dev without .dev.vars: open door on the PC only
    return path.startsWith("/api/") ? json(503, { error: "wall not configured" }) : html(503, loginPage("WALL_PASSWORD and WALL_SECRET are not set on the Pages project."));
  }

  if (path === "/api/login" && request.method === "POST") {
    let password = "";
    const type = request.headers.get("Content-Type") ?? "";
    if (type.includes("json")) password = String(((await request.json()) as { password?: string }).password ?? "");
    else password = String((await request.formData()).get("password") ?? "");
    if (!same(password, env.WALL_PASSWORD)) return html(401, loginPage("No."));
    const exp = String(Date.now() + DAYS * 86400000);
    const cookie = `${COOKIE}=${exp}.${await sign(env.WALL_SECRET, exp)}; Path=/; Max-Age=${DAYS * 86400}; HttpOnly; SameSite=Lax${local ? "" : "; Secure"}`;
    return new Response(null, { status: 303, headers: { Location: "/", "Set-Cookie": cookie, "Cache-Control": "no-store" } });
  }

  const auth = request.headers.get("Authorization") ?? "";
  if (path.startsWith("/api/") && env.WALL_INGEST_KEY && auth.startsWith("Bearer ") && same(auth.slice(7), env.WALL_INGEST_KEY)) return next();

  if (await hasSession(request, env.WALL_SECRET)) {
    const res = await next();
    const out = new Response(res.body, res);
    out.headers.set("X-Robots-Tag", "noindex");
    return out;
  }
  return path.startsWith("/api/") ? json(401, { error: "sign in" }) : html(401, loginPage());
};
