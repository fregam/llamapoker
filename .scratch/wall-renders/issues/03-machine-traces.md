# 03 Job traces in The machine

Status: ready-for-agent
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
