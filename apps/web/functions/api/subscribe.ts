/**
 * POST /api/subscribe — Cloudflare Pages Function behind the email signup
 * (src/components/Signup.tsx). Takes JSON { email, source, channel, medium, campaign, ref,
 * token, company } and adds the email to the Beehiiv newsletter through Beehiiv's API, tagged
 * with where the signup came from (the page = `source`, the channel = utm_source or referrer).
 * The API key never reaches the browser.
 *
 * Environment variables, set in the Cloudflare dashboard (Pages project → Settings →
 * Variables and secrets), never in the repo:
 *   BEEHIIV_API_KEY          secret, from Beehiiv → Settings → API
 *   BEEHIIV_PUBLICATION_ID   "pub_…", from the same page
 *   TURNSTILE_SECRET_KEY     optional; when set, every signup must carry a valid Turnstile
 *                            token (the form sends one when VITE_TURNSTILE_SITE_KEY is set at
 *                            build time). Without it, only the honeypot stands between us and
 *                            scripts, so set both once the widget exists.
 * Until the Beehiiv variables are set it answers 503 and the form shows its error message.
 *
 * `company` is the honeypot field: real people never fill it, so a filled one is a bot
 * and gets a fake success. Every outcome is logged as one JSON line (no email address) in
 * the common event shape {event, ts, …}, the first feed of the event store.
 * Cloudflare builds this file itself; it is not part of the Vite build or `tsc` (tsconfig only
 * includes src/). Tested by subscribe.test.ts with a mocked fetch.
 */

export interface Env {
  BEEHIIV_API_KEY?: string;
  BEEHIIV_PUBLICATION_ID?: string;
  TURNSTILE_SECRET_KEY?: string;
}

const json = (status: number, body: object) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

const slug = (v: unknown, fallback = "") => String(v ?? "").toLowerCase().replace(/[^\w.-]/g, "").slice(0, 60) || fallback;

function log(event: string, props: Record<string, unknown>) {
  console.log(JSON.stringify({ event, ts: new Date().toISOString(), ...props }));
}

export async function verifyTurnstile(secret: string, token: string, ip: string | null, fetcher: typeof fetch = fetch): Promise<boolean> {
  if (!token) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);
  const res = await fetcher("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
  if (!res.ok) return false;
  const out = (await res.json()) as { success?: boolean };
  return out.success === true;
}

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  let data: Record<string, unknown>;
  try {
    data = (await request.json()) as Record<string, unknown>;
  } catch {
    return json(400, { error: "bad request" });
  }

  const source = slug(data.source, "site");
  const channel = slug(data.channel);
  const medium = slug(data.medium);
  const campaign = slug(data.campaign);

  if (data.company) {
    log("signup", { ok: false, reason: "honeypot", source, channel });
    return json(200, { ok: true }); // bot
  }

  const email = String(data.email ?? "").trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: "invalid email" });

  if (env.TURNSTILE_SECRET_KEY) {
    const ok = await verifyTurnstile(env.TURNSTILE_SECRET_KEY, String(data.token ?? ""), request.headers.get("CF-Connecting-IP"));
    if (!ok) {
      log("signup", { ok: false, reason: "turnstile", source, channel });
      return json(403, { error: "verification failed" });
    }
  }

  if (!env.BEEHIIV_API_KEY || !env.BEEHIIV_PUBLICATION_ID) {
    log("signup", { ok: false, reason: "not configured", source, channel });
    return json(503, { error: "newsletter not configured" });
  }

  const res = await fetch(`https://api.beehiiv.com/v2/publications/${env.BEEHIIV_PUBLICATION_ID}/subscriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.BEEHIIV_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      reactivate_existing: true, // someone who left and fills the form again has asked to come back
      send_welcome_email: true,
      utm_source: channel || "llamapoker.com",
      utm_medium: medium || "website",
      utm_campaign: campaign ? `${source}.${campaign}` : source,
      referring_site: "https://llamapoker.com",
    }),
  });
  if (!res.ok) {
    log("signup", { ok: false, reason: "beehiiv", status: res.status, source, channel });
    console.error("beehiiv subscribe failed", res.status, await res.text());
    return json(502, { error: "newsletter error" });
  }
  log("signup", { ok: true, source, channel, medium, campaign });
  return json(200, { ok: true });
};
