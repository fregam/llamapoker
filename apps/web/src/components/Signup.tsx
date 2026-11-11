/**
 * <Signup> — the email capture ("The LlamaPoker letter"), the lead magnet's whole point.
 * Posts JSON { email, source, channel, medium, campaign, ref, token, company } to /api/subscribe,
 * a Cloudflare Pages Function (functions/api/subscribe.ts) that adds the address to the
 * Beehiiv newsletter. `source` names the page or block the form sits in (home, guide-outs,
 * trainer, foot-table…); channel/medium/campaign/ref come from attribution.ts (the link that
 * brought the visitor here). The hidden honeypot field ("company") catches dumb bots; when a
 * Turnstile site key is configured at build time (VITE_TURNSTILE_SITE_KEY) the form also
 * loads Cloudflare Turnstile on first focus and sends its token. In local dev there is no
 * function running, so it pretends to succeed and logs to the console.
 * `compact` is the one-line variant for guide footers, the trainer and the colophon; once the
 * visitor has joined (remembered in localStorage) compact forms render nothing.
 * To change newsletter provider, change the function — this component stays the same.
 * Used by: views/Home.tsx, components/Guide.tsx, views/Trainer.tsx, App.tsx (colophon).
 */

import { FormEvent, useEffect, useRef, useState } from "react";
import { Link } from "./Link";
import { attribution } from "../attribution";

const JOINED = "lp-joined";
const SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) ?? "";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: { sitekey: string; size?: string; theme?: string; callback: (t: string) => void; "error-callback"?: () => void }) => string;
      reset: (id: string) => void;
    };
  }
}

let turnstileLoading: Promise<void> | null = null;
function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!turnstileLoading)
    turnstileLoading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("turnstile failed to load"));
      document.head.appendChild(s);
    });
  return turnstileLoading;
}

async function send(email: string, source: string, company: string, token: string): Promise<void> {
  const a = attribution();
  if (import.meta.env.DEV) {
    console.info("[signup] dev mode — would submit", { email, source, ...a, token: token ? "yes" : "no" });
    return;
  }
  const res = await fetch("/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, source, company, token, ...a }),
  });
  if (!res.ok) throw new Error(`Signup failed (${res.status})`);
}

const joined = () => {
  try {
    return typeof window !== "undefined" && localStorage.getItem(JOINED) === "1";
  } catch {
    return false;
  }
};

export function Signup({ source = "home", compact = false }: { source?: string; compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [hidden, setHidden] = useState(false);
  const widget = useRef<HTMLDivElement>(null);
  const token = useRef("");
  const widgetId = useRef<string | null>(null);

  // After mount only (the prerender must not read storage): compact forms step aside for members.
  useEffect(() => {
    if (compact && joined()) setHidden(true);
  }, [compact]);

  function armTurnstile() {
    if (!SITE_KEY || widgetId.current !== null || !widget.current) return;
    widgetId.current = "loading";
    loadTurnstile()
      .then(() => {
        if (!widget.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(widget.current, {
          sitekey: SITE_KEY,
          size: "flexible",
          theme: "dark",
          callback: (t) => (token.current = t),
          "error-callback": () => (token.current = ""),
        });
      })
      .catch(() => (widgetId.current = null));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setState("error");
    setState("sending");
    try {
      const company = new FormData(e.currentTarget).get("company");
      await send(email.trim(), source, typeof company === "string" ? company : "", token.current);
      setState("done");
      try {
        localStorage.setItem(JOINED, "1");
      } catch {
        /* fine */
      }
    } catch {
      setState("error");
      if (window.turnstile && widgetId.current && widgetId.current !== "loading") window.turnstile.reset(widgetId.current);
    }
  }

  if (hidden) return null;

  if (state === "done")
    return (
      <p className={compact ? "signup-done signup-done-compact" : "signup-done"} role="status">
        You're on the list. The first letter is on its way when it's ready.
      </p>
    );

  return (
    <form className={compact ? "signup signup-compact" : "signup"} onSubmit={onSubmit} noValidate onFocus={armTurnstile}>
      <p className="signup-trap" aria-hidden="true">
        <label>
          Company <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </p>
      {compact && (
        <p className="signup-pitch">
          <span className="signup-pitch-title">The LlamaPoker letter.</span> One spot, one drill, one thing worth knowing. Weekly, five minutes.
        </p>
      )}
      <label className="signup-field">
        <span className="money-label">Email</span>
        <input
          className="signup-input"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === "error") setState("idle");
          }}
        />
      </label>
      <button className="btn btn-primary" type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Joining…" : "Join the letter"}
      </button>
      {SITE_KEY && <div className="signup-turnstile" ref={widget} />}
      <p className={state === "error" ? "signup-note signup-error" : "signup-note"}>
        {state === "error" ? (
          "That didn't work — check the address and try again."
        ) : (
          <>
            No spam, unsubscribe anytime. <Link to="/privacy">Privacy</Link>.
          </>
        )}
      </p>
    </form>
  );
}
