# Spec: renders in The machine (local job progress on the wall)

Status: ready-for-agent
Grilled with the founder 2026-11-12 (ten questions, one at a time). Replaces roadmap item 0's
"renders panel" wording: it is not a new panel, and v1 is progress only.

## Problem

Renders, foley and teardowns run for minutes in a terminal. The founder can't see from the wall
what is running, how far along it is, or whether it hung, and a dead job leaves no trace.

## Goal

Put `job` in front of any long command and the wall shows it as a progress trace under its
station in The machine. Failed, stuck and lost jobs turn the station red and raise a threat.

## Decisions

1. **This PC only.** The wall is local-first: it runs on this PC, a VPS is a maybe for later, and it
   is never part of llamapoker.com (decision recorded in `docs/decisions.md`, 2026-11-12). Nothing
   here assumes Cloudflare. No frames or clips leave the PC.
2. **One generic wrapper**, `node apps/wall/scripts/job.mjs <command…>` (with a `job` shim on PATH
   or a root npm script, whichever is simpler). It runs the command unchanged, passes its output
   through to the terminal, and reads progress generically: a percent (`64%`) or a fraction
   (`120/900`) on the latest output line. No tool-specific integration, so tools can change freely.
   A tool that prints neither shows "running" plus elapsed time.
3. **Progress only in v1.** No live frame, no in-place playback. A finished job shows its output
   path (the last existing file path found on the command line).
4. **Inside The machine (1)**, not a new panel. Under each station: one trace per job (label, bar or
   "running", elapsed time, state), pulsing while running, solid when done, red when stuck, failed
   or lost. The colours follow the wall's existing three-colour rule. The station's own state is
   its worst job's: stuck, failed or lost → `failed` (red); any running → busy; else `idle`. Finished
   traces stay until local midnight, then live only in the feed and the evidence drawer.
5. **Failed / stuck / lost.**
   - Failed: the command exits non-zero. Threat text = the last ~10 output lines.
   - Stuck: the process is alive but has printed nothing and moved no progress for 10 minutes
     (override per job: `--quiet-ok 30m`). Detected by the wrapper. Threat: "<label>: no output for
     10 min, check the console or kill it".
   - Lost: the wrapper sends a heartbeat every 30 s; if the wall hears nothing for 2 min it marks
     the job lost (derived on read, not written by anyone).
   No stop button: the founder stops a job with Ctrl+C in its terminal.
6. **Storage split.** Events (permanent, in the feed): `job.started`, `job.done` (duration + output
   path), `job.failed`, `job.stuck`, `job.lost`. Live state (overwritten, not kept): one row per job
   in a new `jobs` table (id, station, label, state, percent, startedAt, lastBeat, output, tail),
   upserted at most every 5 s, pruned at midnight. A table instead of the station row because
   several jobs can run under one station at once.
7. **Wall unreachable = carry on.** Reporting never blocks or fails the job. If the wall doesn't
   answer, the wrapper prints one "wall offline, not reporting" line and keeps trying quietly.
   Nothing is queued or replayed. Target: `WALL_URL` / `wall.url` from `credentials.json` if set,
   else `http://localhost:8788` (open door on localhost, no key needed).
8. **Recognised, not typed.** Station from the command: `remotion render` → `reels-render`,
   `foley-mmaudio.py` → `foley`, `reel-teardown.py` → `teardown`, any other script → its file name
   without extension. Label: the Remotion composition id or the output file name. `--station` and
   `--label` only override. A new station name creates its station the first time it's used.

## Out of v1

Live latest frame, in-place clip playback, a stop button, a prefix-free process watcher (it can't
read another process's output, so no bar), and syncing clips to a remote wall.

## Done when

`job npx remotion render …` in one terminal and `job py -3.11 scripts/foley-mmaudio.py …` in
another show as two traces in The machine on `localhost:8788`. Killing one with an error turns
its station red with a threat. A `sleep`-style silent job with a short `--quiet-ok` goes stuck.
Closing a wrapper's terminal shows the job as lost within ~2 min. With the wall stopped, the same
commands run normally and print one offline line. `npm test` and `npx tsc --noEmit` pass in
`apps/wall`.

## Tickets

- `issues/01-jobs-store.md`
- `issues/02-job-wrapper.md`
- `issues/03-machine-traces.md`
- `issues/04-docs-local-first.md`
