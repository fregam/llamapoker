# 05 The agent on the wall

Status: ready-for-human
Blocked by: 04

Nothing ships without its panel (`apps/wall/README.md`).

- [x] Station `seo` (DEVELOPMENT): state, last run, next run, message "page one 2/18, indexed 9/13".
- [x] Each run posts a `run` event with the two numbers in `meta`; the run itself goes through
      `job` so it shows as a trace.
- [x] Threats: run failed; no run for 9 days; the key check fails; indexed count fell; a target
      left page one.
- [x] Open pull requests waiting on the founder appear in Needs you (queue), one card each.

## Built 2026-11-17 (branch `feat/wall-seo`)

- `apps/seo/src/wall.mjs` (the shapes), `scripts/run.mjs` (reports them, checks the key first),
  `scripts/weekly.mjs` (the scheduled entry: update the checkout, run through `job`),
  `scripts/wall-report.mjs` (an existing reading onto the wall).
- Wall side: `seoThreats` in `derive.ts` reads "no run for 9 days", "a page left the index" and
  "a target left page one" from the run events, because a run that did not happen cannot report
  itself. "Run failed" and "the key check fails" are the station's red threat, with the reason.
- Found on the way, and fixed because the ticket is untrue without them:
  - The wall is closed at 07:00 on a Monday, and a report to a closed wall was dropped. Reports
    now wait in an outbox and arrive when the wall opens (`apps/wall/scripts/wall-outbox.mjs`).
  - A card must clear when the pull request is merged on GitHub: `apps/wall/scripts/pr-cards.mjs`.
    The wall only mirrors; CALL on the card merges nothing.
  - The queue took the same id twice as an error: a same-day rerun now updates its card.
  - Through `job`, the silent agent step would have been killed after 20 minutes: the run may be
    quiet for an hour.
  - A site change dropped for failing the checks ended the run green: it now ends failed.
  - The scheduled-task command in the README was broken (`scripts\run.mjs` had lost its `\r`).

## Left for the founder

- [ ] Register (or replace) the scheduled task with the command in `apps/seo/README.md`: it now
      starts `weekly.mjs`. On 2026-11-17 no task named "LlamaPoker SEO agent" was visible from a
      normal PowerShell; check with `Get-ScheduledTask "LlamaPoker SEO agent"`.
- [ ] After the merge: pull `main` in the checkout the wall runs from, restart the wall, then
      `node apps/seo/scripts/wall-report.mjs` once, so the 2026-11-17 reading is the one the
      first run is compared with.
- [ ] Watch the first scheduled run on the wall (trace, score, card).
