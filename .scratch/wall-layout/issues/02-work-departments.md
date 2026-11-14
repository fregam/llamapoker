# 02 Stations belong to a department; Work lines in the reading

Status: done
Spec: ../spec.md (Decision 4)
Blocked by: none

- Migration `0005_station_department.sql`: `stations.department TEXT NULL`.
- `POST /api/station` accepts `department: content | development` (anything else → 400).
- `scripts/job.mjs` takes `--dept content|development` and sends it with the station.
- Default mapping when unset (one function in `derive.ts`): `reels*`, `foley`, `voice`,
  `teardown` → content; everything else (including the derived `site` station) → development.
  The derived `signup` and `letter` stations leave the Work model (they feed the Newsletter row,
  ticket 01).
- Add `work` to `WallState`: one entry per department `{ id, name, state, word, latest, open,
  stations }`. `state` is the worst of its stations (three-colour rule); `word` is
  OK / RUNNING n / FAILED / STUCK / LOST; `latest` is the newest job or station line; `open` is
  true when anything in it is failed, stuck or lost. Threats are unchanged.

Tests: mapping defaults and override; roll-up (one running → RUNNING 1, a failed job → FAILED +
open, all idle → OK); a site probe failure lands under development.

**Done when:** a `job --dept content …` run and a plain `job npx remotion render …` both show under
content in `GET /api/state`; `npm run migrate`, `npm test` and `npx tsc --noEmit` pass.

## Comments

2026-11-14: done, test-first. `departmentOf` and `work` in `functions/_lib/derive.ts` (eight tests:
default mapping, own department wins, signup/letter left out, both lines always present and OK
when quiet, RUNNING n with the newest job named, FAILED / STUCK / LOST open the line and say which,
a site probe failure under DEVELOPMENT, a job's --dept reaching a station that has none);
`normaliseStation` / `normaliseJob` validate `department` (two tests); `recognise` takes `--dept`
(one test). Migration 0005 adds `department` to **stations and jobs**: the wrapper reports
through `/api/job`, not `/api/station`, so the job row carries `--dept` and the station takes it
when it has none (`COALESCE`, a station's own department wins). Checked live on localhost:
`job --dept content --station wltest-dept …` and a plain `job --station reels-wltest …` both
under CONTENT as RUNNING 2; a failing `--dept development` job turned DEVELOPMENT to FAILED,
open, "wltest-c: failed (boom)"; a junk department on `/api/station` → 400. Test stations, jobs,
events and log files deleted after. `latest` prefers the newest bad job, then a failed station,
then the newest job, then the station with the newest run.
