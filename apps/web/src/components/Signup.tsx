/**
 * <Signup> — the email capture ("The LlamaPoker letter"), the lead magnet's whole point.
 * Posts JSON { email, source, company } to /api/subscribe, a Cloudflare Pages Function
 * (functions/api/subscribe.ts) that adds the address to the Beehiiv newsletter. The hidden
 * honeypot field ("company") catches bots. In local dev there is no function running, so
 * it pretends to succeed and logs to the console.
 * To change newsletter provider, change the function — this component stays the same.
 * Used by: views/Home.tsx.
 */

import { FormEvent, useState } from "react";
import { Link } from "./Link";

async function send(email: string, source: string, company: string): Promise<void> {
  if (import.meta.env.DEV) {
    console.info("[signup] dev mode — would submit", { email, source });
    return;
  }
  const res = await fetch("/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, source, company }),
  });
  if (!res.ok) throw new Error(`Signup failed (${res.status})`);
}

export function Signup({ source = "home" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setState("error");
    setState("sending");
    try {
      const company = new FormData(e.currentTarget).get("company");
      await send(email.trim(), source, typeof company === "string" ? company : "");
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done")
    return (
      <p className="signup-done" role="status">
        You're on the list. The first letter is on its way when it's ready.
      </p>
    );

  return (
    <form
      className="signup"
      onSubmit={onSubmit}
      noValidate
    >
      <p className="signup-trap" aria-hidden="true">
        <label>
          Company <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </p>
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
      <p className={state === "error" ? "signup-note signup-error" : "signup-note"}>
        {state === "error"
          ? "That didn't work — check the address and try again."
          : (
            <>
              New drills, strategy and the LlamaPoker journal. No spam, unsubscribe anytime. <Link to="/privacy">Privacy</Link>.
            </>
          )}
      </p>
    </form>
  );
}
