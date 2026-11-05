/**
 * <Signup> — the email capture ("The LlamaPoker letter"), the lead magnet's whole point.
 * Submits to Netlify Forms: the form is in the prerendered HTML (name="letter",
 * data-netlify), so Netlify detects it at deploy time and stores submissions in the
 * site's Forms dashboard (exportable / connectable to an email platform later).
 * Submission is a urlencoded POST to "/" with form-name=letter. A hidden honeypot
 * field ("company") catches bots. In local dev there is no form backend, so it
 * pretends to succeed and logs to the console.
 * To move to a mailing-list service later, replace send() — nothing else changes.
 * Used by: views/Home.tsx.
 */

import { FormEvent, useState } from "react";
import { Link } from "./Link";

const FORM_NAME = "letter";

async function send(email: string, source: string): Promise<void> {
  if (import.meta.env.DEV) {
    console.info("[signup] dev mode — would submit", { email, source });
    return;
  }
  const body = new URLSearchParams({ "form-name": FORM_NAME, email, source, company: "" });
  const res = await fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`Signup failed (${res.status})`);
}

export function Signup({ source = "home" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setState("error");
    setState("sending");
    try {
      await send(email.trim(), source);
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
      name={FORM_NAME}
      method="POST"
      data-netlify="true"
      netlify-honeypot="company"
      onSubmit={onSubmit}
      noValidate
    >
      <input type="hidden" name="form-name" value={FORM_NAME} />
      <input type="hidden" name="source" value={source} />
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
