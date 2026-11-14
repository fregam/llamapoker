# Decisions

One entry per significant decision: what, why, what was rejected. Newest first. Decisions marked
*proposed* wait for the founder.

## 2026-11-14 - The wall and VS Code go true black with orange accents

- **What:** the wall (`apps/wall/src/styles.css`) and its VS Code theme (`apps/wall/vscode-theme/`,
  now in the repo) drop the blue-black glass for true black (the faint grid stays). Amber becomes
  orange `#ff8a1f` and also accents the chrome: panel titles, corner marks, VS Code's active tab
  and activity bar. Cyan still carries data, red is still failure; a waiting pane keeps a full
  orange border and glow, so it still stands out from plain orange corners.
- **Why:** the founder's reference stills of command-centre screens: VFD cyan on black with orange
  accents.
- **Rejected:** keeping amber only for "waits on you" (strict three-colour meaning, but the screen
  read cold and flat next to the references).

## 2026-11-12 (late) - The wall is laid out by the question the founder comes with: results first

- **What:** two sides. **Results** ("how are we doing?": socials per channel, post performance,
  traffic, the list, money when it exists) is first and largest; **Needs you** (threats, approvals)
  beside it; **Work** ("what is being made to improve it?") is one slim strip with a line per
  department, CONTENT (research → drafts → approval → published; reels → render, foley, voice) and
  DEVELOPMENT (site health, deploys, tools, CI), that opens down to the job progress bars; feed and
  budget smallest. Site, Signup and Letter leave the machine's top row (site health → Development,
  signups and the letter → Results). Next feature, to be grilled and specced on its own.
- **Why:** the founder looks first at how socials and posts are doing, then at what is being made;
  the workflow nodes are the least of it, yet The machine held the whole top row.
- **Rejected:** stations as peers on one row (a render is not a part of the business like the
  site); five departments (Reach, Audience, Money, Content, Product) and a per-piece vs per-channel
  split (both mixed "how are we doing" with "what is being made"); holding the renders branch for
  the redesign (the job wrapper, timeouts and logs are layout-independent and useful now).

## 2026-11-12 - The wall is local-first; local jobs report to it through one `job` wrapper

- **What:** the wall runs on the founder's PC (`localhost:8788`); a VPS is a maybe for later; it is
  never deployed as part of llamapoker.com. Long local jobs (Remotion renders, MMAudio foley,
  teardowns) are started as `job <command>` and show as progress traces under their station in
  The machine; failed, stuck (10 min silent) and lost (2 min without heartbeat) jobs turn the
  station red with a threat. Progress only in v1. Spec: `.scratch/wall-renders/spec.md`.
- **Why:** the wall is a private instrument and the jobs it watches run on this PC; the founder
  wants a progress indicator that survives the tools changing, not per-tool integrations.
- **Rejected:** deploying to Cloudflare Pages + D1 (no need for a public wall; consequence: the
  site's signup posts don't reach it and North star reads Beehiiv directly); a new eighth panel
  (a render is a pipeline step, The machine already answers "what's stuck"); live frames and
  in-place playback (break whenever a tool changes); per-script reporting (every new tool needs
  code, a hard crash can't report itself); a prefix-free process watcher (can't read another
  process's output, so no bar); a stop button on the wall (Ctrl+C in the terminal is enough).

## 2026-11-11 (late night) - Every reel passes a measured gate against the approved reel before review

- **What:** `scripts/reel-check.py` (pace from the word times, peak and floor from the render, a
  one-frame-a-second contact sheet) must PASS before a reel reaches the founder; limits are reel
  002 v9, which the founder approved. `scripts/vo-breathe.py` joins the voice chain (a floor of
  0.5 s after every sentence, the counterpart of the 0.55 s cap). Reel 003 got the scene-by-scene
  polish pass 002 had (v10).
- **Why:** 003 v9 reached review rushed, louder and with six overlaps while 002 was good: the
  system upgrades were shared, the per-reel polish was not, and nothing measured either. The
  content factory will make reels without the founder watching each step, so quality has to be a
  check, not a habit.
- **Rejected:** an effect-onset limit (it counted syllables: 003 scored busier with fewer effects
  than 002); automated overlap detection from the DOM (fragile; the sheet takes ten seconds to read).

## 2026-11-11 (late night) - Site speed: hydrate the prerender and self-host the fonts; no code splitting

- **What:** `main.tsx` hydrates prerendered pages instead of replacing them with `createRoot`;
  the brand fonts are served from llamapoker.com (`apps/web/public/fonts/`) instead of Google.
- **Why:** LCP was 87% "render delay": the browser threw the prerendered HTML away and painted
  it again only after the bundle and the Google Fonts chain. Lighthouse mobile, production vs
  the PR's Cloudflare preview, median of 3: home 82→92, /table 86→96, /learn/outs 83→89;
  simulated FCP about 3.3 s → 1.4–2.1 s. In observed (unthrottled) timings the late repaint is
  gone (home LCP 1.17 s → 0.53 s, now right after first paint). The two changes were measured
  together on Cloudflare; locally, hydration alone barely moved the simulated LCP, so most of the
  gain is the fonts and hydration is the groundwork. Self-hosting also stops sending every
  visitor's IP to Google, a GDPR point the Privacy page never covered.
- **Not done:** splitting the bundle per route. Not measured: TBT is low (0–120 ms) and lazy
  routes prerender as fallbacks under `renderToString` unless the server entry is reworked.
  Simulated LCP is still 2.5–3.5 s, partly the model charging the bundle; splitting is the next
  lever if production numbers after the merge stay there.

## 2026-11-11 (night) - The repo is public

- **What:** `fregam/llamapoker` went public so that `main` can have a branch-protection rule
  (private repos need GitHub Pro for that). Rule set, secret scanning and push protection on.
- **Why:** the founder preferred this to paying; the history was scanned first (gitleaks over
  the full history, plus a grep for key-like strings) and is clean; secrets were never committed.
- **Rejected:** GitHub Pro (about $4/month); deploying from CI with wrangler instead of a rule.

## 2026-11-11 (night, later) - The wall built now, as its own Pages project on one D1 store

- **What:** the founder said "it's time to make it"; built in `apps/wall/` ahead of the plan's
  Phase 3 ordering, on the spec's architecture (one event store, panels as modules, real data
  only). Its own Cloudflare Pages project with Functions and a D1 database, not a route inside
  the site, so the private surface, its secrets and its deploys stay separate from llamapoker.com.
  Password door now (signed cookie), Cloudflare Access as the upgrade. Snapshots written on read.
- **Rejected:** a panel for the map and reach with placeholder data (the spec forbids it; they
  come when location and view events exist); Analytics Engine for the first store (D1 alone covers
  events, queue, flags and snapshots at this scale, and is SQL-queryable from the Functions);
  a dashboard template or chart library (none fits the VFD look; everything is SVG and CSS).

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
