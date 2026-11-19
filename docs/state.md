# State

What is in flight, blocked and waiting on the founder. Read at the start of every session, update at
the end. Last update: 2026-11-19 (bankroll management shipped, PRs #51 and #52).

## Done 2026-11-19

- **Bankroll management, all three parts, merged** (PRs #51 and #52; parts A and B: branch `feat/bankroll`, worktree
  `.claude/worktrees/bankroll`, spec and tickets `.scratch/bankroll/`): the rules engine and the
  tracker log (`apps/web/src/poker/bankroll.ts`, `bankrollLog.ts`, 46 tests), the calculator and
  the tracker on `/bankroll`, the guide `/learn/bankroll-management`, a "Bankroll" nav item, new
  glossary entries, and the privacy, FAQ and About pages kept true. Checked in a real browser:
  cash, tournament, deposit and withdrawal logged, totals right, reload keeps them, delete
  everything then import the CSV restores them, no sideways scroll at 390 px. Not checked: the
  browser actually saving the downloaded file to disk (the button was pressed with the save
  captured, and the bytes compared), and a real phone. The founder made six calls in the grill and handed the rest over; those are
  listed at the top of the spec to overrule.

## Done 2026-11-17

- **The wall's look pass** (PR #50, merged on the founder's word, "looks great"): brightness does
  the hierarchy, IBM Plex Mono, the subscribers trend in Results, the budget pane fits. Decision in
  `docs/decisions.md`; before and after in `media/tests/2026-11-17_wall-look/outputs/`. Left
  unlooked-at: the raise form, the station drawer, an opened feed line, the help overlay. The VS
  Code theme is 0.1.2 and needs reinstalling to show the two new dim cyans.

- **The SEO agent on the wall** (ticket 05, branch `feat/wall-seo`, worktree
  `.claude/worktrees/wall-seo`, PR #48, merged on the founder's word): station, `job` trace, `run` events, the pull
  request's card, three wall-side threats; plus an outbox so a run at 07:00 with the wall closed
  loses nothing, and pull request cards that clear when GitHub says merged. Checked on a
  throwaway wall (port 8799, its own store): the 2026-11-17 reading replayed from the outbox, a
  lost page raised its threat, the real launcher ran through `job` and reported a refused run in
  red, and the card of the merged pull request #43 cleared through `gh`. Not checked: a full real
  run (it pushes, opens a pull request and spends the Claude plan); its steps are covered by
  `apps/seo/src/run.test.mjs` with pretend commands.
- **The hook writer on the wall** (same branch): its writer and critic agents show as traces under
  a `hooks` station in CONTENT, through the Claude Code hooks already installed for research.
  Checked by tests only; the first real hook run should be watched. Looked at and left out, by
  the wall's rule of no panel without data: the sound library (a catalogue, nothing runs), video
  v2 (its renders already go through `job`), the hook corpus scripts (`corpus.py`, `layers.py`:
  one-off and finished; put `job` in front if they run again), and the Instagram token's expiry
  on 2027-01-15 (worth a threat once a fetcher uses the token; today nothing on the wall reads it).

- **Hook writer shipped** (merged to `main`): playbook from 911 Instagram reels in
  `content/research/hooks/` (taxonomy, lift table, blind pair test), skill rebuilt goal-first in
  `.claude/skills/hook-writing/`, 10 verified hooks in `content/hooks/2026-11-17-playbook/`.
  Corpus and media stay local (`apps/reels/scripts/hooks/data/`, `media/research/hooks/`, ~1.1k
  reels). The Instagram token in `credentials.json` expires 2027-01-15. The critic is
  calibrated (25 known lines, scored by `calibrate.py`). Open: the research branch `research/reel-craft` is not merged (audience research
  still running there).

- **SEO agent started** on `feat/seo-agent` (worktree `.claude/worktrees/seo-agent`): the founder's
  four reference reels checked against Google's docs (`docs/research/2026-11-17-seo-reference-reels.md`);
  spec and six tickets in `.scratch/seo-agent/`; `apps/seo/` built (Search Console client with a
  service-account key, the score, the weekly reading; 5 tests, CI job `seo`), the agent's skill
  (`.claude/skills/seo-agent/`) and the weekly runner (`apps/seo/scripts/run.mjs`). **Nothing runs
  on its own yet:** the client has only met mocked responses and the runner has only been
  dry-run, because there is no key until the wizard is run and the branch is not merged.
- Live site checked by curl: 13 sitemap pages, all 200 with matching canonicals. Search Console
  was not re-read (the Chrome extension did not load it); the indexing numbers below are from
  2026-11-11.

## Done 2026-11-14

- **Wall layout, results first**, merged to `main` (PR #33): grilled, specced and ticketed in
  `.scratch/wall-layout/`. Done: Results in the reading (money hero from `revenue` events, generic
  channel rows from `followers` / `post` events, Newsletter row from Beehiiv), Work departments
  (`--dept`, migration 0005), the new grid (Results, Needs you, Work strip; The machine, North
  star and Channels panels removed), briefing results first, docs. All six tickets done.
  Reviewed (standards + spec) and fixed. The local wall runs from the worktree
  `E:/Projects/poker-trainer-wall` for now (`dev.mjs` reads `credentials.json` from the main
  checkout when run there); `main` is merged into `research/reel-craft` in the main checkout.
- Wall and VS Code theme recoloured: true black, orange accents (`apps/wall/vscode-theme/`, now in
  the repo).

## Done 2026-11-12

- Matt Pocock's engineering skills installed (plugin `mattpocock-skills`); repo configured in
  `docs/agents/` (issues as Markdown in `.scratch/`). Branch `chore/agent-skills-setup`.
- Housekeeping on `chore/repo-cleanup` (stacked on the setup branch): `apps/blender/`, `agents/`,
  `scripts/split-sheet.mjs`, tracked `.pyc` files and 15 unused reel cut-outs removed; about
  1.2 GB of git-ignored media deleted from the main checkout (AI-video bake-offs 01-03, FLUX and
  image-model tests, on-brand drafts, ElevenLabs voice board, `media/library/3d/`). Manifests
  pruned and verified (library 20, tests 56). `media-manifest.mjs` fixed: it ignored a manifest
  path given without `--init`. Retired library images kept on purpose (11 remain; the two retired
  3D v01 files went with `media/library/3d/`). `blip.wav` kept: `sfx-moss.py` regenerates it.
- Until this merges, the main checkout's manifests still list the deleted files, so `--check`
  fails there.
- GitHub reports 5 Dependabot alerts on `main` (2 critical, 3 moderate); not looked at yet.

## Approved on 2026-11-11

- The plan in `docs/plan-2026-11-11.md` (phases, targets, architecture, cadence).
- Beehiiv stays on the free plan when the trial ends (about 2026-11-18); nothing is paid.
- Reels: **v8 is the baseline**; reels 002 and 003 are **still not approved for posting**. The two
  quality rounds (voice, then review sheet) still apply before anything is posted.
- The interface is wanted: spec saved as `docs/interface.md`; three directions as static mockups
  (`docs/interface/mockups/`, renders in `media/tests/2026-11-11_interface-mockups/outputs/`),
  the founder picks one; build only after the safety net and measurement are live.

## Done since the morning (2026-11-11, evening)

- **The wall is built** (`apps/wall/`, branch `interface/wall`, night): seven panels as modules on
  one screen, one D1 event store, Beehiiv and a site probe as live sources, password door, command
  bar, guarded kill switch, time control by daily snapshot, briefing, wall mode, phone view
  (briefing, threats, approvals as cards). Runs locally with `npm run dev` (real Beehiiv numbers,
  local D1). The site's signup function posts to it once `WALL_URL` and `WALL_INGEST_KEY` are set.
  Not built, by the spec's own rule: the map and reach (no location or view data yet).
- Housekeeping (night): the five merged remote branches deleted; auto-merge armed on the green
  Dependabot PRs (3 merged; 15, 16, 20, 21 patch bumps; 19 Vitest 4, which clears the two
  critical dev-only alerts; 4 and 7 asked to rebase). PR #23 (manifests, docs tidy) merged.

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

- **Bankroll, 2026-11-19 (PRs #51 and #52 merged on the founder's word, "finish this feature up
  push and merge"):** request indexing in Search Console for `/bankroll` and
  `/learn/bankroll-management`. Anything under "Decided by Claude" in `.scratch/bankroll/spec.md`
  can still be overruled ("we'll improve later"). The SEO targets are 20 now (two bankroll
  searches added on the same word); the score's "of 18" in older reports is the old list.

- **SEO on the wall, 2026-11-17 (PR #48 merged):** (1) register
  or replace the scheduled task with the command in `apps/seo/README.md` (it starts `weekly.mjs`
  now). No task named "LlamaPoker SEO agent" was visible from a normal PowerShell on 2026-11-17,
  and no run has left a log in the `seo-agent` worktree: check with
  `Get-ScheduledTask "LlamaPoker SEO agent"`. The command that was in the README until today was
  broken (`scripts\run.mjs` had lost its `\r`), so a task registered by pasting it never
  started the run. Before registering, bring the `seo-agent` worktree to `origin/main` (two git
  commands in the README; it has no `weekly.mjs` yet). (2) Get `main` into the checkout the wall
  runs from (the main checkout is on `reels/video-v2`), restart the wall, run
  `node apps/seo/scripts/wall-report.mjs` once. Pull request cards on the wall have no call or
  fold: they link to GitHub (`docs/decisions.md`; say so if you want CALL to merge). (3) Still open from before: request indexing for
  `/about` and `/learn/online-poker-helper`.

- **SEO, 2026-11-17 night:** PRs #40 (agent), #41 (byline, dates, `/about`) and #42 (Trainer text)
  merged by the founder's word and checked live. After the founder requested indexing by hand:
  12 of 14 pages indexed (out: `/learn/online-poker-helper`, `/about`). First real run of
  `apps/seo/scripts/run.mjs`: reading, branch and pull request worked; the agent step hit the
  Claude 5-hour limit, and the runner wrongly reported success (fixed: a failed agent step now
  fails the run). First complete run later that night: PR #43 (reading, report, links to the helper guide),
  merged on the founder's word; the target list approved. Still waiting on the founder: request
  indexing for `/about` and `/learn/online-poker-helper`; register the weekly task after one
  clean run.
- **SEO, 2026-11-17 later (superseded by the line above):** the wizard ran and the key works. Baseline reading: 3 of 13 pages
  indexed, 0 of 18 target searches on page one, 32 impressions. The ten missing pages are "unknown
  to Google" (never crawled); the sitemap is read without errors. Waiting on the founder: merge
  PR #40 (the agent) and PR #41 (byline, dates, About page: read the visible text first); request
  indexing for the ten pages in Search Console (URL inspection, "Request indexing"); register the
  weekly scheduled task (`apps/seo/README.md`); say yes or no to `apps/seo/targets.json`.
- ~~SEO agent access~~ (done): run
  `bash /e/Projects/poker-trainer/.claude/worktrees/seo-agent/scripts/wizards/search-console-access.sh`
  in Git Bash (the script is on `feat/seo-agent`, not in the main checkout until it merges; about ten
  minutes: a Google Cloud project, a service account key, the account added to Search Console).
  Then read `apps/seo/targets.json` (the 18 searches it is scored on) and answer the spec's open
  question: whose name goes on the guides.

- Add the "Wall" CI check to the branch rule. (The wall itself is local-first, not deployed:
  decision 2026-11-12.)
- Site speed (PR #26) merged 2026-11-11: re-measure production Lighthouse (preview showed
  mobile 82–86 → 89–96) and record it here.

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
- ~~Reels 002/003 posting~~: shelved 2026-11-17; the first reel comes out of the factory.
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
