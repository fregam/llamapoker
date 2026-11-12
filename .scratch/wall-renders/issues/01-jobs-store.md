# 01 Jobs in the store

Status: done
Spec: ../spec.md (Decisions 4, 5, 6)

- Migration `apps/wall/migrations/0002_jobs.sql`: table `jobs` (id TEXT PK, station, label, state
  `running|done|failed|stuck`, percent REAL NULL, started_at, last_beat, ended_at NULL, output NULL,
  tail NULL).
- `POST /api/job`: upsert one job row (same ingest rules as `/api/event`). Creates the station row
  if it doesn't exist (name = id).
- `src/model.ts`: `Job` type, `WallState.jobs`.
- `functions/_lib/store.ts`: read today's jobs (drop rows ended before local midnight, delete them).
- `functions/_lib/derive.ts` (pure, tested):
  - `lost`: a `running` job whose `last_beat` is older than 2 min reads as `lost`. Emit a
    `job.lost` event once per job (mark the row so it isn't emitted twice).
  - Station state from its jobs: any stuck/failed/lost → `failed` with the job's message; any
    running → busy (use the existing state that reads as active); else leave as stored/`idle`.
  - Threats for stuck and lost jobs, alongside the existing failed-station threat (no duplicates).

**Done when:** derive tests cover lost-by-heartbeat, worst-of station state, and one threat per bad
job; `npm test` and `npx tsc --noEmit` pass.

## Comments

2026-11-12: done, test-first at the three agreed seams: `withJobs` (lost by heartbeat, grouping,
new station, midnight pruning incl. a job lost yesterday, worst-of state), `threats` (one per bad
job, no duplicate station threat), `normaliseJob` (validation; `lost` is never accepted from a
wrapper). 16 tests, tsc clean. Hand-checked on a local wall (port 8789, since the main checkout's
wall held 8788): running/stuck/lost/done jobs and a rejected percent of 250. The hand check found
one bug the unit tests couldn't: the job.lost event insert failed on undefined fields after the
row was already marked lost, so the event was lost for good. Mark and event now go in one batch.
Deviation: "midnight" is UTC (the Workers runtime has no local time zone), i.e. 01:00 in Spain in
winter. Running jobs still finish showing; only finished or lost ones clear.
`WALL_PORT` picks the dev port (`scripts/dev.mjs`).
