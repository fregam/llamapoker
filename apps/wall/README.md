# apps/wall — the command center

The LlamaPoker wall: one screen for the whole operation, read from one event store. Spec in
`docs/interface.md`, look from `docs/interface/mockups.md` round 2 (Batcomputer schematic and
three-colour rule, phosphor ghost digits), decision in `docs/decisions.md` (2026-11-11, night).
Independent of `brand/` by that decision: it is a private instrument, not a public surface.
**Local-first** (decision 2026-11-12): it runs on this PC; a VPS is a maybe for later; it is never
part of llamapoker.com.

## What is on it

Laid out by the question the founder comes with, **results first** (decision 2026-11-12 late,
spec `.scratch/wall-layout/spec.md`):

| Panel (key) | Question it answers | Reads |
|---|---|---|
| Results (1) | How are we doing? Money first, subscribers as the leading number, then each channel. | `revenue`, `followers`, `post` events; Beehiiv |
| Needs you (2) | What is going wrong or waiting on me, and what do I do first? (threats above approvals) | stations, jobs, queue, flags, costs |
| Work (3) | What is being made to improve it, and is any of it stuck? One line per department, CONTENT and DEVELOPMENT, opening down to the job traces. | stations, jobs, site probe |
| Live feed (4) | What just happened? | events |
| Experiments and budget (5) | Is a test ready to call, and is spend inside the ceiling? | event costs, flags |

Each panel is a module in `src/panels/` declaring its question, what it reads and its grid area
(`src/panels/registry.ts`). Real data only: a missing source shows dashes and says why. **The hero
is money** (the north star), shown as a dash with "no revenue source yet" until the first `revenue`
event; subscribers sit beside it. Not built yet, by the spec's own rule (no panels for what
produces no data): the map (needs location data from Cloudflare's analytics, which needs the API
token), and social channel rows until their fetchers exist (see "Adding a channel").

Behaviour: everything opens in place (click a station, a threat, a feed line, a card); `/` or `k`
opens the command bar; `[` `]` scrub to past days (every day the wall was opened is stored);
`pause now` is the guarded kill switch (every outbound job must check the `paused` flag before
sending); the briefing shows on the first open of each day (`b` reopens it, `?nobrief` skips it
for screenshots); `w` or `?mode=wall`
is wall mode for a second screen (no controls, larger type, overlays on); under 800 px the wall
becomes three screens: Results, Needs you (threats, then approvals as cards: call, fold, raise),
briefing. The briefing reads results first: anything paused or red, then money and subscribers
(with where the newest came from), then what needs you and the first thing to do, then one line
per Work department.

## The store

One D1 database, `migrations/0001_store.sql`: `events` (what happened, when, to what, how much, at
what cost), `stations`, `queue`, `flags`, `snapshots`. The wall reads only from the store plus two
live sources the store cannot hold yet (Beehiiv for subscribers and sends, a probe of
llamapoker.com). Everything writes through the API with the ingest key:

```
POST /api/event     { kind, station?, subject?, amount?, unit?, cost?, channel?, text?, meta? }  (or an array)
POST /api/station   { id, name, state: ok|idle|waiting|failed|paused|nodata, message?, lastRun?, nextRun?, department?: content|development }
POST /api/job       { id, station, label, state: running|done|failed|stuck, percent?, phase?, output?, tail?, department? }
POST /api/queue     { kind, title, preview }          POST /api/queue/<id>  { action: call|fold|raise, note? }
POST /api/flags     { key: paused|budget_ceiling|experiments, value }
GET  /api/state[?day=YYYY-MM-DD]                      the whole reading (src/model.ts WallState)
```

From the PC: `node apps/wall/scripts/wall-event.mjs event --kind run --station reels --subject only-aces --text "Rendered only-aces v9"`
(reads `WALL_URL` and `WALL_INGEST_KEY`, else `wall.url` and `wall.ingest_key` from the root
`credentials.json`, else the local wall at `http://127.0.0.1:8788`, which needs no key; `--meta`
takes JSON). The site's signup function posts every signup here when `WALL_URL` and
`WALL_INGEST_KEY` are set on the llamapoker.com Pages project.

**What Results reads.** Three event shapes, fixed so that any source can feed Results without
wall code:

| Kind | Fields | Shown as |
|---|---|---|
| `revenue` | `amount` (EUR), `unit: "EUR"`, `channel` (sponsor, affiliate, product…), `subject?` | the money hero: today and 30 days |
| `followers` | `channel`, `amount` = the count now; one reading a day is enough | a channel row: headline, change over 1 and 7 days, 30-day sparkline |
| `post` | `channel`, `subject` = post id, `meta: { views?, likes?, saves?, comments?, url? }` | the row's latest post |

```
node apps/wall/scripts/wall-event.mjs event --kind revenue --amount 49 --unit EUR --channel sponsor --subject "Sponsor X, letter 004"
node apps/wall/scripts/wall-event.mjs event --kind followers --channel instagram --amount 1240
node apps/wall/scripts/wall-event.mjs event --kind post --channel instagram --subject reel-003 --meta '{"views":900,"likes":40,"url":"https://instagram.com/p/x"}'
```

Channel names `instagram`, `tiktok`, `youtube`, `twitter` are stored as the wall's ids `ig`, `tt`,
`yt`, `x`. The Newsletter row is the same row shape fed from Beehiiv (live count, signups today,
last letter, and where the last 7 days' new subscribers came from, by first touch).

**Adding a channel** (Instagram, TikTok, YouTube…) is a fetcher plus its station, no wall code: a
script that reads the platform's numbers and posts a `followers` reading and a `post` event per
new or updated post, run daily as `job --dept content node scripts/fetch-<channel>.mjs`. Its row
appears in Results on the first reading; its failures show under CONTENT and in Needs you, like
any job. The wall never calls a social API itself: everything comes through the event store.

**Local jobs** (renders, foley, teardowns, anything long): put `job` in front of the command.

```
job npx remotion render src/index.ts only-aces out/only-aces.mp4
job --quiet-ok 30m py -3.11 scripts/foley-mmaudio.py in.mp4 out.mp4
```

It runs the command unchanged (output passes through, same exit code) and shows it as a trace under
its station in Work: the station and label are recognised from the command (`remotion
render` → reels-render, `foley-mmaudio.py` → foley, `reel-teardown.py` → teardown, else the
script's name; label = composition or output file), progress from any `64%` or `120/900` in its
output, with the word before it as the phase ("Rendered", "Encoded"). Made for the automated
workflow as much as for a person: failed (non-zero exit), stuck (no output for 10 min,
`--quiet-ok` to change) and lost (no heartbeat for 2 min: runner killed, PC slept) turn the
station red with a threat; a job still silent at twice its quiet limit is killed with its child
processes and exits 124, so a workflow never hangs behind it. Every run's full output is in
`logs/jobs/<day>/<id>.log` (git-ignored, cleared after 14 days), and the threat points to it.
If the wall doesn't answer, `job` says so once and the command runs anyway.
Each station belongs to a Work department: `--dept content|development` sets it (a station's own
`department` wins); without it, `reels*`, `foley`, `voice` and `teardown` are CONTENT and
everything else, the site probe included, is DEVELOPMENT. `job` is `scripts/bin/job.cmd` (PowerShell, cmd) or
`scripts/bin/job` (Git Bash); put `scripts/bin` on PATH, or call
`node apps/wall/scripts/job.mjs …`. It reports to `WALL_URL` / `wall.url`, else the local wall
at `http://127.0.0.1:8788` (`WALL_PORT` picks another port for `npm run dev`).

**Nothing ships without its panel:** a new agent, channel or product comes with its events in this
format, a station row, and its failure visible in threats, as part of the same work.

## Run it

```bash
cd apps/wall
npm install
npm run migrate            # local D1 (once, and after every new migration)
npm run dev                # http://localhost:8788 — no password on localhost
npm test                   # the pure derivations (results, work, threats, briefing, subscribers by day)
npx tsc --noEmit           # type-check (strict, as apps/web)
npm run build              # dist/ for Cloudflare Pages
```

`npm run dev` runs `vite build --watch` and `wrangler pages dev` together (`scripts/dev.mjs`),
passing the Beehiiv keys from `credentials.json` as bindings for that process only. A `.dev.vars`
file (see `.dev.vars.example`) works too and takes precedence.

## Deploying elsewhere (optional, not planned)

Kept for a future VPS or hosted copy; the wall is local-first. The Cloudflare Pages steps:

1. Cloudflare → Workers & Pages → Create → Pages → connect the repo, **root directory `apps/wall`**,
   build command `npm run build`, output `dist`. Production branch `main`.
2. D1: `npx wrangler d1 create wall` (or the dashboard), put the id in `wrangler.toml`, run
   `npm run migrate:remote`. Bind it on the Pages project as `DB`.
3. Variables and secrets on the Pages project: `WALL_PASSWORD`, `WALL_SECRET` (32 random bytes,
   hex), `WALL_INGEST_KEY` (another random token), `BEEHIIV_API_KEY`, `BEEHIIV_PUBLICATION_ID`.
4. Custom domain `wall.llamapoker.com`. Optional, better: Cloudflare Access in front of it; the
   middleware then only guards the ingest key.
5. On the llamapoker.com Pages project add `WALL_URL=https://wall.llamapoker.com` and the same
   `WALL_INGEST_KEY` so signups flow into the store.
6. Locally, add to `credentials.json`: `"wall": { "url": "https://wall.llamapoker.com", "ingest_key": "…" }`.

Snapshots are written on read, so the wall must be opened (or `/api/state` fetched) once a day for
time control to have that day. A Workers cron that fetches it is the next step.

## Files

- `src/model.ts` — the common shapes (event, station, queue item, the whole state). Shared by
  the functions and the page.
- `functions/_middleware.ts` — the door: password session cookie, ingest bearer key.
- `functions/_lib/store.ts` — reads D1 and the live sources, assembles the state, stores the day's
  snapshot; all writes.
- `functions/_lib/derive.ts` — pure derivations (results and channel rows, Work departments,
  threats, subscribers by day, attribution). Tested.
- `functions/_lib/briefing.ts` — the daily briefing's words, results first. Tested.
- `functions/api/*.ts` — the routes above.
- `src/App.tsx` — the grid, keys, command handling, briefing, wall mode, phone view.
- `src/panels/*` — one file per panel; `registry.ts` is the only list.
- `src/components/` — pane frame, segment digits, meters, evidence drawer, command bar, and the
  threat list and approval cards that Needs you shows.
- `src/styles.css` — the one stylesheet (VFD on true black; cyan data, orange chrome accents and
  waiting, red failure).
- `vscode-theme/` — the same look as a VS Code theme ("Wall VFD"); change it with `styles.css`.
  Bump its `version` when you change it, so VS Code picks it up after reinstalling.
- `scripts/wall-event.mjs` — write to the store from the PC. `scripts/dev.mjs` — local run.
- `scripts/job.mjs` — the `job` wrapper; `scripts/job-lib.mjs` its pure half (what a command is,
  how far along a line says it is), tested in `scripts/job.test.mjs` (incl. end to end against a
  pretend wall).
