# Decisions

One entry per significant decision: what, why, what was rejected. Newest first. Decisions marked
*proposed* wait for the founder.

## 2026-11-19 - Copy research: the best writing is the writing that was measured to win

The site's guides get rewritten from evidence, as the hooks were. "Best" is a measured winner from
any subject on one of five scoreboards (pages searchers clicked, answers readers voted up,
newsletters people came back to, ads that kept running, Wikipedia's featured articles), and only
from writers who won repeatedly. Controlled experiments and our own winner-versus-ordinary pairs
are the judges; famous copywriters and teachers supply techniques to test. The brand voice and
the responsible-gambling rules stay hard limits. Rejected: reputation as proof, a topic filter,
single hits, and paying for search results before trying the free click data (ORCAS). A 1% pilot
runs before the full size. Spec: `.scratch/copy-research/spec.md`.

## 2026-11-17 - The wall's look: brightness does the hierarchy

- **What:** inside the look already decided (true black, cyan data, orange chrome and waiting, red
  failure), the wall gets one more rule: only numbers and states are full cyan and only they glow;
  sentences are a softer cyan, labels dimmer, nothing under 11 px. Text moves from Share Tech Mono
  to IBM Plex Mono; the tick rule along each pane's top becomes one hairline under the title; a
  missing reading's dashes are lit low. Results draws the subscribers trend in the height its rows
  leave. Experiments and budget is two columns, so the Claude limits no longer fall below the pane.
- **Why:** the founder said it looked cheap. The cause was not the palette: every word was the same
  bright cyan at 11 to 13 px with wide letter-spacing, so nothing led the eye, and more than half
  of Results was empty while the budget pane was cut off. Before and after:
  `media/tests/2026-11-17_wall-look/outputs/`.
- **Rejected:** a new palette or layout (both are decided, and the wall read well once it was
  calmer); filling the empty Results space with a panel that has no data (the spec forbids it; the
  trend is the Newsletter row's own series). Cyan, orange and red are unchanged; the two dimmer
  cyans moved (`#49a9c4` to `#5c9fb4`, `#2a6f85` to `#3d7a8e`, the second because it was too dark
  to read at 11 px) and the VS Code theme follows them (0.1.2, reinstall to pick it up).

## 2026-11-17 - Hook first, and the script stage before the repeatable video stage

- **What:** a reel starts from the chosen hook; the script is written to pay off that hook and
  says, beat by beat, what is seen as well as what is said; the picture is built from the script.
  The script stage is built next. The repeatable video stage is extracted only after two or three
  more reels have been made from real scripts.
- **Why:** the hook writer's top two hooks were put on `aces-crowd`, whose body was written for
  another opening, and the founder saw at once that the rest no longer matched the beginning. And
  one hand-made video is too little to know what repeats: a stage built from it would remake that
  one reel.
- **Rejected:** making the video stage repeatable first; scripts that carry words only.

## 2026-11-17 - The wall mirrors pull requests; it does not merge them (*proposed*)

- **What:** an agent's pull request shows in Needs you as a card that links to GitHub and has no
  call, fold or raise. The card clears itself when GitHub says the pull request is merged or
  closed (`apps/wall/scripts/pr-cards.mjs`, run by the wall every ten minutes).
- **Why:** a merge to `main` is a deploy, and the branch rule wants the checks green and a human
  at the button. A CALL that only hid the card would leave the pull request open and unseen; a
  CALL that merged would be a second, weaker door to production.
- **Rejected:** CALL = merge through `gh` from the wall. Possible later for the easy-to-revert
  kind of change, once the SEO agent has four clean runs (its spec, decision 2). The founder's to
  overturn.
- **Also decided here:** what only the watcher can know is computed by the wall, not reported by
  the job ("no run for 9 days", "a page left the index", "a target left page one"), and a report
  made while the wall is closed waits in an outbox instead of being dropped.

## 2026-11-17 - The hook writer works from a playbook of real hits, with truth as its only rule

- **What:** the hook writer (`.claude/skills/hook-writing/`) has one goal, a line that stops a
  poker player who doesn't follow us. Its hard limits: every claim true (in numbers and in words,
  against the engine's `facts.json`), the brand voice, and where helping ends. Everything else is
  craft guidance it may break. Its reference is `content/research/hooks/playbook.md`, built from
  911 Instagram reels: 462 outliers (≥ 100k views, ≥ 5× the account median) blind-tagged next to
  same-creator twins. A writer drafts, code checks the numbers, and a critic fails any unbacked
  claim and ranks the rest against the playbook's hit/twin pairs, without knowing which round or
  writer a line came from.
- **Why:** the first version (a five-rung ladder, "promise within 7 words", engine numbers) passed
  every check and the founder struck 19 of 30 lines: the rules made writers open on stats. The
  research then showed no single move separates hits from flops (numbers, questions, bold claims
  all lift ≈ 1). What did: openings aimed at a stranger, a scene or stake in the first sentence,
  something happening early. Blind judges picked the hit only 57.5% of the time, so a hook raises
  the odds and posted retention stays the real judge.
- **Rejected:** a template library; studying only the hits; length and position rules; a
  mechanism quota.
- **Calibration:** before a session's first run the critic judges 25 known lines
  (`.claude/skills/hook-writing/calibration/`) and `apps/reels/scripts/hooks/calibrate.py` scores
  it: 10 lines must fail their limit, 13 must pass, and 7 rank pairs must hold. The pairs anchor
  "good" to the best hooks we have (round 2, which the founder judged better than the first
  test), never to an older batch; a better batch replaces them. Two critics on the final brief
  both passed; the two earlier briefs failed (one too strict, one too loose).

## 2026-11-17 - The video stage starts from references, and `aces-crowd` is the new baseline

- **What:** every earlier video rule is scrapped (editing grammar, pacing rules, the host +
  draw-on direction; plumbing and fonts are open again). The method: the founder sends reference
  videos, Claude builds and compares until its result beats them for our viewer, and the founder
  judges side by side. Posted retention numbers take over as judge once we post. First result the
  founder liked: `aces-crowd` v12 (`apps/reels/src/reels/AcesCrowd.tsx`), 18 s, one ace built from
  8,000 tiles that breaks as callers join, numbers from the engine, voice-timed, sound from the
  library. References: `media/tests/2026-11-17_video-references/`.
- **Why:** building a look from the ground up, rule by rule, was too slow and produced reels the
  founder did not like. Rules written before results were the bottleneck (same lesson as hooks).
- **Kept as hard limits:** true numbers, 18+ study-tool positioning, no cloned real voice or face
  without consent. The Instagram safe area is a measured fact, checked like spelling.
- **Rejected:** comparing against reel 002; a rulebook up front.

## 2026-11-17 - The SEO agent gets a goal and a score, and Google's docs outrank the reels (score, runtime and tiers proposed)

- **What:** the SEO agent's brief is one outcome: page one of Google for the 18 searches in
  `apps/seo/targets.json`, as fast as honest work allows, and kept there. It is scored weekly from
  Search Console on two numbers (target searches at position 10 or better; sitemap pages indexed).
  It runs weekly on the founder's PC as a headless Claude Code run. Every site change is a pull
  request the founder merges; self-merge for small technical changes is proposed only after four
  clean runs. The agent step has no network tools and never sees the key; it never creates
  accounts, submits links or posts anywhere. Spec: `.scratch/seo-agent/spec.md`.
- **Why:** "highly ranked" cannot be checked; a fixed list and a position can. Indexing is in the
  score because 10 of 13 pages were not indexed on 2026-11-11, and an unindexed page cannot rank.
  The founder's four reference reels were checked against Google's own pages
  (`docs/research/2026-11-17-seo-reference-reels.md`): two held, one claim (a "preferred source"
  button as a ranking signal for everyone) is not in Google's documentation, and the backlink list
  is close to what the spam policy names.
- **Rejected:** scoring on clicks and impressions (rewards any traffic); a paid rank tracker
  (Search Console is free and is Google's own number); working through the backlink list; a
  cloud scheduler now (the key and the wall are local; revisit with the Hetzner move).

## 2026-11-17 - Reel 002 is not rewritten; the first reel comes out of the factory

- **What:** the planned rewrite of reel 002 is dropped, and the finished renders of 002 and 003
  (v9) are shelved: neither is posted. The next reel is a new one, made from
  start to finish by the factory (hook agent → founder-approved brief → script → motion → sound).
- **Why:** the hook agent and the script stage are being built now. Rewriting 002 by hand would
  mean making a reel outside the system we are building, and that work would be thrown away. A
  new reel also tests the factory more fairly: 002's flaws were in its premise (answer given in
  the hook, two payoffs, no loop), so a fixed 002 would only test a repair.
- **Rejected:** rewriting 002 through the script stage as its first job (the 2026-11-14 plan).
  The 002 topic can still come back as a hook-agent candidate if it scores.

## 2026-11-14 - The wall's hero is money from day one; channels come through the event store

- **What:** the biggest number on the wall is money (revenue, EUR), shown as a dash with "no
  revenue source yet" until the first `revenue` event; subscribers sit beside it as the leading
  number. Social channels (Instagram, TikTok, YouTube) reach Results only as `followers` and
  `post` events posted by fetcher jobs; the wall never calls a social API. A Results row is
  generic, so adding a channel is a fetcher plus its station, with no wall code. Spec:
  `.scratch/wall-layout/spec.md`.
- **Why:** money is the north star; subscribers are the road there, and putting the road in the
  biggest digits would quietly make it the goal. One event store under everything keeps the wall
  simple and every source replaceable.
- **Rejected:** subscribers as the hero until money exists, with an automatic swap (Claude's
  recommendation, accepted and then reversed by the founder); live API calls from the wall per
  platform; one block per metric across channels (each new source would touch every block).

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
