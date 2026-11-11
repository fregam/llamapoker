# Decisions

One entry per significant decision: what, why, what was rejected. Newest first. Decisions marked
*proposed* wait for the founder.

## 2026-11-11 (night) - The repo is public

- **What:** `fregam/llamapoker` went public so that `main` can have a branch-protection rule
  (private repos need GitHub Pro for that). Rule set, secret scanning and push protection on.
- **Why:** the founder preferred this to paying; the history was scanned first (gitleaks over
  the full history, plus a grep for key-like strings) and is clean; secrets were never committed.
- **Rejected:** GitHub Pro (about $4/month); deploying from CI with wrangler instead of a rule.

## 2026-11-11 (night) - Interface build direction: Batcomputer schematic + Phosphor map and digits

- **What:** the founder took the recommendation: build on round-2 direction 2 (Batcomputer: the
  wireframe machine schematic, cyan data / amber waiting-on-you / red failure) and take direction
  1's dot-raster world map and ghost-segment digits; drop the radar scope; scanlines and vignette
  as a toggle, off at the desk, on in wall mode. Build starts after the safety net and
  measurement are live, machine diagram, threats and approvals first.
- **Rejected:** the instrument cluster (three typefaces doing one job, map fell back to bars).

## 2026-11-11 (evening) - The interface looks like a VFD screen, not like the website

- **What:** the command center is independent of the brand: black glass, phosphor light,
  segmented digits, glow allowed ("what Batman would use"). Three new directions in
  `docs/interface/mockups.md`, round 2. The brand-derived round 1 is kept for the record.
- **Why:** the founder's call after seeing round 1; the wall is a private instrument, not a public
  surface, so the brand rules for public work do not bind it.
- **Rejected:** the editorial wall (round 1 A), even though it matched the spec's original line.

## 2026-11-11 (evening) - Voice B is the reels' voice; welcome email on

- **What:** the livelier read B (seed-3 reference, sampling 0.9, seed 4) won the hook test by the
  founder's ear. Reels 002 and 003 re-voiced (v9) on branch `reels/voice-b`; the pipeline now
  cleans before tightening (the tightening gate was blind on the sampled read's noise floor).
  The Beehiiv welcome email is published and on, from `content/letters/000-welcome.md`, links
  tagged `utm_source=letter`. Beehiiv stays free; v8/v9 still not approved for posting.
- **Rejected:** regenerating B with ComfyUI (the existing whole-reel B recordings passed the
  transcript checks); muxing B's audio under A's picture for the test (captions would drift).

## 2026-11-11 · The plan is approved; Beehiiv stays free; v8 is the reels baseline

- **What:** the founder approved `docs/plan-2026-11-11.md` as written, chose to let the Beehiiv
  trial lapse to the free plan, named v8 (not v7) the reels baseline while keeping 002 and 003
  unapproved for posting, and asked for the interface (spec in `docs/interface.md`, three mockup
  directions first).
- **Why (Beehiiv):** the free plan keeps the API the signup uses; nothing paid is needed before
  there is an audience.
- **Rejected:** reverting v8 to v7 (the founder accepted v8 by eye).

## 2026-11-11 · CI gates deploys through a branch rule, not by replacing Pages' git builds

- **What:** GitHub Actions checks on PRs and `main`, plus a `main` branch-protection rule that
  requires them. Cloudflare Pages keeps building `main` itself; rollback is its one-click
  "rollback to deployment".
- **Why:** no new secrets, no new moving parts, and the rule alone makes every production deploy a
  green merge. The stronger variant (deploy from CI with wrangler) is documented for later.
- **Rejected:** wrangler deploys from CI now (needs a Cloudflare token and turns off previews'
  simplicity for no gain at this scale).

## 2026-11-11 · Attribution without identity: UTM or referrer, session storage, mapped to Beehiiv

- **What:** the landing link's utm fields (or the referrer host) are kept in `sessionStorage`
  for the visit and sent with a signup; the function maps them to Beehiiv's utm fields and
  logs one JSON line per outcome. The form sits on every guide, the trainer's readout and the
  colophon, each with its own `source`.
- **Why:** answers "which page and channel produced each signup" with no cookie, no identifier
  and no consent banner; the Privacy page states it.
- **Rejected:** a cookie or a stored visitor id (GDPR consent, and the brief forbids tracking
  people); putting the form only on the home page (where search traffic never lands).

## 2026-11-11 · Phase order: fix the path and the safety net before posting anything (approved)

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
