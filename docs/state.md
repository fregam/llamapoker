# State

What is in flight, blocked and waiting on the founder. Read at the start of every session, update at
the end. Last update: 2026-11-11, evening (first session, after the go-ahead).

## Approved on 2026-11-11

- The plan in `docs/plan-2026-11-11.md` (phases, targets, architecture, cadence).
- Beehiiv stays on the free plan when the trial ends (about 2026-11-18); nothing is paid.
- Reels: **v8 is the baseline**; reels 002 and 003 are **still not approved for posting**. The two
  quality rounds (voice, then review sheet) still apply before anything is posted.
- The interface is wanted: spec saved as `docs/interface.md`; three directions as static mockups
  (`docs/interface/mockups/`, renders in `media/tests/2026-11-11_interface-mockups/outputs/`),
  the founder picks one; build only after the safety net and measurement are live.

## Waiting on the founder

- **Merge:** one pull request, `plan/2026-11-11-first-session` → `main`. That branch contains
  everything from this session (it merged `site/signup-path`, which contains `ci/safety-net`):
  CI, page and function tests, Vite 7, the signup path, the docs, the mockups. Type-check, 70
  tests and the build pass on it. Cloudflare builds a preview per pushed branch; check the Pages
  dashboard for its URL. Until the branch rule exists, merging to `main` is a production deploy:
  the founder merges.
- **Housekeeping:** a `vite preview` server started during this session (port 4173) and an
  esbuild service may still be running on the PC; closing them frees `node_modules` for `npm ci`.
- **Branch protection** on `main` (GitHub UI, settings listed in `docs/hosting.md`, "Safety net").
- **Beehiiv:** turn the welcome email on with `content/letters/000-welcome.md`, set a postal
  address and a reply-to that is read; then letter 001 can go (after approving its text).
- **Turnstile:** create a widget for llamapoker.com in the Cloudflare dashboard, set
  `TURNSTILE_SECRET_KEY` (secret) and `VITE_TURNSTILE_SITE_KEY` (build variable) on the Pages
  project. The code is dormant until both exist. Optional: a WAF rate-limit rule on `/api/subscribe`.
- **Accounts:** Instagram (Creator), TikTok, YouTube (`@llamapoker` is free), X; bio link =
  `https://llamapoker.com/go/ig` (and `/go/tt`, `/go/yt`, `/go/x`), live once the signup branch is merged.
- **Voice round:** listen to hook A vs hook B (`apps/reels/out/voice-round/`, see
  `docs/research/2026-11-11-voice-round-1.md`); record 60 s of your own voice if you want C.
- **Interface:** pick a direction (A wall, B broadsheet, C table) or say what to combine.
- Keys for Phase 1 (plan, section 5): scoped Cloudflare API token, Google service account on
  Search Console; the `gh` CLI or a GitHub token.

## In flight

- Nothing running unattended. Subagents in this session produced the mockups, the voice-round
  files and the web docs; their results are recorded in the files named above.

## Blocked

- Letter 001 send: on the welcome email and footer address (above).
- Reels 002/003 posting: on the two quality rounds and the founder's approval.
- Phase 1 measurement (event store): on the Cloudflare API token and the merges above.

## Known facts worth keeping (verified 2026-11-11)

- Beehiiv: 2 subscribers (both the founder's), 0 sends, welcome email off, double opt-in off, no
  postal address, reply-to personal Gmail, sender `mail.beehiiv.com`. Pro trial day 7/14. The free
  plan keeps API access (minus the Send API), so `/api/subscribe` keeps working.
- Cloudflare Web Analytics: 55 visits / 62 page views in the last 7 days (mostly the founder).
- Search Console: 17 impressions, 1 click in 28 days; 3 pages indexed, 10 discovered not indexed.
- Lighthouse mobile: performance 82–84, everything else 100. Render-blocking fonts, one bundle.
- `gh` CLI not installed on the PC; `git push` over HTTPS works.
- YouTube handle `@llamapoker` is free. Other handles unverified.
- `npm audit`: 0 findings in runtime dependencies; the remaining dev-tooling findings are inside the
  Vite 7 / Vitest 3 chain with no fixed release yet (CI audits runtime only).
