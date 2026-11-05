/**
 * POST /api/subscribe — Cloudflare Pages Function behind the email signup
 * (src/components/Signup.tsx). Takes JSON { email, source, company } and adds the email
 * to the Beehiiv newsletter through Beehiiv's API. The API key never reaches the browser.
 *
 * Needs two environment variables, set in the Cloudflare dashboard (Pages project →
 * Settings → Variables and secrets), not in the repo:
 *   BEEHIIV_API_KEY          secret, from Beehiiv → Settings → API
 *   BEEHIIV_PUBLICATION_ID   "pub_…", from the same page
 * Until they're set it answers 503 and the form shows its error message.
 *
 * `company` is the honeypot field: real people never fill it, so a filled one is a bot
 * and gets a fake success. Cloudflare builds this file itself; it is not part of the Vite
 * build or `tsc` (tsconfig only includes src/).
 */

interface Env {
  BEEHIIV_API_KEY?: string;
  BEEHIIV_PUBLICATION_ID?: string;
}

const json = (status: number, body: object) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  let data: { email?: unknown; source?: unknown; company?: unknown };
  try {
    data = await request.json();
  } catch {
    return json(400, { error: "bad request" });
  }

  if (data.company) return json(200, { ok: true }); // bot

  const email = String(data.email ?? "").trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: "invalid email" });
  const source = String(data.source ?? "site").replace(/[^\w-]/g, "").slice(0, 40) || "site";

  if (!env.BEEHIIV_API_KEY || !env.BEEHIIV_PUBLICATION_ID) return json(503, { error: "newsletter not configured" });

  const res = await fetch(`https://api.beehiiv.com/v2/publications/${env.BEEHIIV_PUBLICATION_ID}/subscriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.BEEHIIV_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      reactivate_existing: false,
      send_welcome_email: true,
      utm_source: "llamapoker.com",
      utm_medium: "website",
      utm_campaign: source,
      referring_site: "https://llamapoker.com",
    }),
  });
  if (!res.ok) {
    console.error("beehiiv subscribe failed", res.status, await res.text());
    return json(502, { error: "newsletter error" });
  }
  return json(200, { ok: true });
};
