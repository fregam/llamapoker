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

## Done since the morning (2026-11-11, evening)

- PR #1 (`ci/safety-net`) and PR #11 (`plan/2026-11-11-first-session`) merged by the founder;
  the signup path, `/go/<channel>` links and docs are live on llamapoker.com (checked by curl).
- Beehiiv welcome email: published and switched on (subject "You're in. Here's the first spot.",
  UTM source `letter`). Still missing: a real postal address (the footer shows Beehiiv's placeholder).
- Two empty draft automations ("New Automation", "New Automation (1)") were created by stray
  keystrokes while editing the welcome email; deleting them was blocked. Harmless; delete by hand.
- Voice round 1: the founder picked B by ear. Reels 002/003 re-voiced as v9 on `reels/voice-b`
  (pushed, needs a PR). Two words to confirm by ear: 002 "So save this", 003 "But say the turn".
- Interface: round 2 (VFD) mockups merged; build direction decided (`docs/decisions.md`, night entry).
- `reels/voice-b` merged (PR #12) and `interface/vfd-mockups` merged by git; all session branches deleted locally.
- Housekeeping (night): web and reels type-check clean, 70 web tests green. Seven merged remote
  branches still exist on origin (`ci/safety-net`, `ci/fixes`, `docs/public-repo`,
  `interface/vfd-mockups`, `plan/2026-11-11-first-session`, `reels/voice-b`, `site/signup-path`);
  deleting them needs the founder (`git push origin --delete <name>`).

- `gh` is logged in (as the founder) and lives at `C:\Program Files\GitHub CLI\gh.exe`; add it to PATH
  in Git Bash with `export PATH="/c/Program Files/GitHub CLI:$PATH"`.
- CI fixes merged (PR #14): Monte Carlo tests get 60 s on the slower runners (one timed out at 5 s);
  gitleaks gets `pull-requests: read` (it failed on every PR with "Resource not accessible").
- Dependabot alerts and automated security fixes enabled on the repo. Dependabot opened eight PRs:
  the action bumps (#2, #3, #4) and the dev-tooling group (#7) are safe and were rebased for a green
  run; the major bumps (#5 TypeScript 7 and #6 React 19 for reels, #8/#9 React 19 for the web app,
  which fail CI) are left open for a deliberate upgrade later.

## Waiting on the founder

- **Repo is public since 2026-11-11 (the founder's call, to get branch protection without paying).**
  Branch rule on `main` is set: PR required, both CI checks required, enforced for admins. GitHub
  secret scanning and push protection are on. Consequences: every commit, the personal-brand
  notes and the research files are readable by anyone; `credentials.json` and `media/` were never
  in git. There is no LICENSE file, so the default is all rights reserved; add one if that is not
  the intent.
- **Beehiiv:** set a postal address and a reply-to that is read; then letter 001 can go (after
  approving its text). Delete the two stray draft automations.
- **Turnstile:** create a widget for llamapoker.com in the Cloudflare dashboard, set
  `TURNSTILE_SECRET_KEY` (secret) and `VITE_TURNSTILE_SITE_KEY` (build variable) on the Pages
  project. The code is dormant until both exist. Optional: a WAF rate-limit rule on `/api/subscribe`.
- **Accounts:** Instagram (Creator), TikTok, YouTube (`@llamapoker` is free), X; bio link =
  `https://llamapoker.com/go/ig` (and `/go/tt`, `/go/yt`, `/go/x`), live once the signup branch is merged.
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
- Lighthouse mobile: performance 82–84 on production, everything else 100. Render-blocking fonts,
  one bundle. Branch `site/perf-hydrate-fonts` (PR pending merge) hydrates the prerender and
  self-hosts the fonts. Production vs its Cloudflare preview, median of 3: home 82→92, /table
  86→96, /learn/outs 83→89; FCP about 3.3 s → 1.4–2.1 s. Re-measure on production after the merge.
- Media manifests (2026-11-11 night): all 843 files under `media/` are now listed
  (`content/library/assets.json`, `content/reels/assets.json`, `content/tests/assets.json`);
  `node scripts/media-manifest.mjs --init <folder> <manifest>` appends new files. `media/tests/` is
  1.2 GB of bake-off outputs with no backup; R2 mirror still pending.
- YouTube handle `@llamapoker` is free. Other handles unverified.
- `npm audit`: 0 findings in runtime dependencies; the remaining dev-tooling findings are inside the
  Vite 7 / Vitest 3 chain with no fixed release yet (CI audits runtime only).
