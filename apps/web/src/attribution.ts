/**
 * First-touch attribution, kept only for the visit and only in this browser: which channel
 * brought the visitor here (utm_source / utm_medium / utm_campaign on the landing URL, or the
 * referrer's host), so that a signup can say where it came from. No cookies, no identifier,
 * nothing sent anywhere until the visitor joins the letter (components/Signup.tsx), and the
 * Privacy page describes exactly this.
 * `remember()` runs once after mount (App.tsx); `attribution()` reads it. Both are no-ops
 * during the build-time prerender (no window).
 * Used by: App.tsx, components/Signup.tsx.
 */

export interface Attribution {
  channel: string; // utm_source, else referrer host, else "" (direct)
  medium: string; // utm_medium or ""
  campaign: string; // utm_campaign or ""
  ref: string; // referrer host or ""
}

const KEY = "lp-attr";
const clean = (v: string | null) => (v ?? "").toLowerCase().replace(/[^\w.-]/g, "").slice(0, 60);

export function remember(): void {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem(KEY)) return; // first touch wins for this visit
    const q = new URLSearchParams(window.location.search);
    let ref = "";
    try {
      const host = document.referrer ? new URL(document.referrer).hostname : "";
      ref = host && host !== window.location.hostname ? clean(host.replace(/^www\./, "")) : "";
    } catch {
      ref = "";
    }
    const a: Attribution = {
      channel: clean(q.get("utm_source")) || ref,
      medium: clean(q.get("utm_medium")),
      campaign: clean(q.get("utm_campaign")),
      ref,
    };
    if (a.channel || a.medium || a.campaign) sessionStorage.setItem(KEY, JSON.stringify(a));
  } catch {
    /* storage blocked: attribution is simply unknown */
  }
}

export function attribution(): Attribution {
  const none: Attribution = { channel: "", medium: "", campaign: "", ref: "" };
  if (typeof window === "undefined") return none;
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? { ...none, ...(JSON.parse(raw) as Partial<Attribution>) } : none;
  } catch {
    return none;
  }
}
