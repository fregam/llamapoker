# apps/wall — the command center

The LlamaPoker wall: one screen for the whole operation, read from one event store. Spec in
`docs/interface.md`, look from `docs/interface/mockups.md` round 2 (Batcomputer schematic and
three-colour rule, phosphor ghost digits), decision in `docs/decisions.md` (2026-11-11, night).
Independent of `brand/` by that decision: it is a private instrument, not a public surface.

## What is on it

| Panel (key) | Question it answers | Reads |
|---|---|---|
| The machine (1) | Is anything in the pipeline stuck or broken, and where? | stations, events, site probe, Beehiiv |
| Threats (2) | What is going wrong or about to, and what do I do first? | stations, queue, flags, costs, signup events |
| North star (3) | Are subscribers growing, and what changed today? | Beehiiv subscriptions, view events |
| Approvals (4) | What is waiting on me, and can I decide it now? | queue |
| Channels (5) | Which channel is bringing subscribers, and which went quiet? | Beehiiv first touch, view events |
| Live feed (6) | What just happened? | events |
| Experiments and budget (7) | Is a test ready to call, and is spend inside the ceiling? | event costs, flags |

Each panel is a module in `src/panels/` declaring its question, what it reads and its grid area
(`src/panels/registry.ts`). Real data only: a missing source shows dashes and says why. Not built
yet, by the spec's own rule (no panels for what produces no data): the map (needs location data
from Cloudflare's analytics, which needs the API token) and reach per channel (needs view events).

Behaviour: everything opens in place (click a station, a threat, a feed line, a card); `/` or `k`
opens the command bar; `[` `]` scrub to past days (every day the wall was opened is stored);
`pause now` is the guarded kill switch (every outbound job must check the `paused` flag before
sending); the briefing shows on the first open of each day (`b` reopens it); `w` or `?mode=wall`
is wall mode for a second screen (no controls, larger type, overlays on); under 800 px the wall
becomes three screens: briefing, threats, approvals as cards (call, fold, raise).

## The store

One D1 database, `migrations/0001_store.sql`: `events` (what happened, when, to what, how much, at
what cost), `stations`, `queue`, `flags`, `snapshots`. The wall reads only from the store plus two
live sources the store cannot hold yet (Beehiiv for subscribers and sends, a probe of
llamapoker.com). Everything writes through the API with the ingest key:

```
POST /api/event     { kind, station?, subject?, amount?, unit?, cost?, channel?, text?, meta? }  (or an array)
POST /api/station   { id, name, state: ok|idle|waiting|failed|paused|nodata, message?, lastRun?, nextRun? }
POST /api/queue     { kind, title, preview }          POST /api/queue/<id>  { action: call|fold|raise, note? }
POST /api/flags     { key: paused|budget_ceiling|experiments, value }
GET  /api/state[?day=YYYY-MM-DD]                      the whole reading (src/model.ts WallState)
```

From the PC: `node apps/wall/scripts/wall-event.mjs event --kind run --station reels --subject only-aces --text "Rendered only-aces v9"`
(reads `wall.url` and `wall.ingest_key` from the root `credentials.json`, or `WALL_URL` and
`WALL_INGEST_KEY`). The site's signup function posts every signup here when `WALL_URL` and
`WALL_INGEST_KEY` are set on the llamapoker.com Pages project.

**Nothing ships without its panel:** a new agent, channel or product comes with its events in this
format, a station row, and its failure visible in threats, as part of the same work.

## Run it

```bash
cd apps/wall
npm install
npm run migrate            # local D1 (once, and after every new migration)
npm run dev                # http://localhost:8788 — no password on localhost
npm test                   # the pure derivations (threats, briefing, subscribers by day)
npx tsc --noEmit           # type-check (strict, as apps/web)
npm run build              # dist/ for Cloudflare Pages
```

`npm run dev` runs `vite build --watch` and `wrangler pages dev` together (`scripts/dev.mjs`),
passing the Beehiiv keys from `credentials.json` as bindings for that process only. A `.dev.vars`
file (see `.dev.vars.example`) works too and takes precedence.

## Deploy (once, by the founder)

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
- `functions/_lib/derive.ts` — pure derivations (threats, briefing, subscribers by day,
  attribution). Tested.
- `functions/api/*.ts` — the routes above.
- `src/App.tsx` — the grid, keys, command handling, briefing, wall mode, phone view.
- `src/panels/*` — one file per panel; `registry.ts` is the only list.
- `src/components/` — pane frame, segment digits, meters, evidence drawer, command bar.
- `src/styles.css` — the one stylesheet (VFD look; cyan data, amber waiting, red failure).
- `scripts/wall-event.mjs` — write to the store from the PC. `scripts/dev.mjs` — local run.
