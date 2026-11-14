# 02 Stations belong to a department; Work lines in the reading

Status: ready-for-agent
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
