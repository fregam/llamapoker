# Decisions

One entry per significant decision: what, why, what was rejected. Newest first. Decisions marked
*proposed* wait for the founder.

## 2026-11-11 · Phase order: fix the path and the safety net before posting anything (proposed)

- **What:** Phase 0 of `docs/plan-2026-11-11.md`: signup on every page, welcome email, Turnstile,
  CI and branch protection, then letter 001 and the reels.
- **Why:** the audit found the path leaks at both ends (no welcome email, signup only on the home
  page, no attribution) and every push is an untested production deploy. Reach is wasted until
  both are fixed, and both are days of work.
- **Rejected:** posting the reels first to "get data" (the data would be views with no path to a
  subscriber); building measurement first (nothing to measure yet).

## 2026-11-11 · Event store on Cloudflare Analytics Engine + D1, schedulers on Workers cron (proposed)

- **Why:** free at our scale for years, no server to run, same account as the site, SQL-queryable,
  and one store for events, queue and pipeline logs as the brief's "built to grow" section asks.
- **Rejected:** Hetzner VPS now (nothing needs a long-running process yet); a hosted analytics
  product (cost, cookies or consent questions); Supabase (a second vendor for the same job).

## 2026-11-11 · Research on official APIs first; Agent-Reach and Osintgram deferred (proposed)

- **Why:** Search Console, Reddit's public JSON and YouTube Data cover most of the brief with no
  login at risk. The scrapers are approved in the brief but cost a research profile and break often.
- **Rejected:** running Agent-Reach in Phase 1.

## 2026-11-11 · Approval queue as a Telegram bot before any interface (proposed)

- **Why:** phone-native, free, a day's work, and it writes to the same D1 queue the interface
  will read later.
- **Rejected:** building the command center first (priority 5 in the brief).

## 2026-11-11 · Renderer frozen on Remotion until five reels are posted

- **What:** no HyperFrames port, no side experiment. From the founder's brief, agreeing with
  `docs/research/2026-11-11-remotion-vs-hyperframes.md`.
- **Why:** the renderer is not the bottleneck; publishing is.

## 2026-11-11 · Reel changes: one variable per round, the founder's eye and ear decide

- **What:** v7 is the baseline (v6 changed four things at once and was judged worse on all four).
  Voice round first, then the review-sheet round, then post 002 and 003. Measurements narrow
  options; they never decide.
- **Open:** v8 (motion eases, frame depth) landed on `main` after this was decided; the founder
  decides whether it is the baseline or the first candidate.

## 2026-11-10 · Reels rendered from code (Remotion), AI video shelved

- **Why:** exact numbers from our own engine, always on brand, repeatable and free. AI video
  drifted off the engraving style and could not render text. See `docs/roadmap.md`.

## 2026-11-11 · Voice: local VibeVoice, never a cloned real person without consent

- **Why:** free on the founder's GPU; a request to clone a creator's voice was declined
  (no consent). A recording of the founder's own voice is the allowed route to "natural".

## 2026-11-06 · Hosting on Cloudflare Pages, newsletter on Beehiiv

- **Why:** free static hosting with functions, previews and rollback; Beehiiv for the letter with
  an API the signup function can call. See `docs/hosting.md`.
