# 03 Job traces in The machine

Status: done
Spec: ../spec.md (Decisions 3, 4)
Blocked by: 01

In `apps/wall/src/panels/Machine.tsx`: under each station that has jobs today, one trace per job
(label, bar or "running", percent, elapsed time ticking client-side, state). Pulsing while running,
solid when done, red when stuck/failed/lost, using the existing three-colour rule and
`src/styles.css` only, with no new colours. A done trace shows its output path. Opening the station
lists today's jobs in the evidence drawer (with the failure tail). Wall mode and the phone view
must not break (the phone view can show only the count of running jobs).

**Done when:** two concurrent jobs under one station and one failed job look right on
`localhost:8788` in normal and wall mode; `npx tsc --noEmit` passes.

## Comments

2026-11-12: done. Trace text tested at the agreed seam (`src/lib/jobs.ts` `trace`: phase, percent
or "running", elapsed frozen at the end, output for done, log for bad). Look checked by eye on a
local wall with real `job` runs plus seeded stuck/failed/done jobs, normal and wall mode, drawer
open; screenshots shown to the founder. Found by looking: the wall re-read every 60 s, so a bar
moved once a minute; added a cheap `GET /api/jobs` (no site probe, no Beehiiv) that the traces
poll every 5 s while something runs. Wall-mode columns widened (state words were cut off).
Limits: the machine pane is short, so the strip shows ~3 rows before it scrolls, and an open
drawer squeezes the schematic (it did before too). Phone width not screenshotted (Chrome's
minimum window width); the machine is not part of the phone view.
