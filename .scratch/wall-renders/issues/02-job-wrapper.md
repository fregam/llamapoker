# 02 The `job` wrapper

Status: done
Spec: ../spec.md (Decisions 2, 5, 7, 8)
Blocked by: 01

`apps/wall/scripts/job.mjs` (Node, no dependencies), plus the shortest way to type `job …` from
the repo root (a `job.cmd` shim or a root npm script; pick one and document it).

- Spawn the command with output passed through to the terminal (stdout and stderr), and exit with
  the command's exit code. Ctrl+C reaches the child.
- Pure, tested helpers: `recognise(argv) → { station, label, output }` (Remotion, foley-mmaudio,
  reel-teardown, fallback to the script file name; `--station`, `--label` and `--quiet-ok` are
  stripped before the command runs), and `progress(line) → percent | null` (`64%`, `120/900`).
- Report: `job.started` event and job row at start. Row upsert at most every 5 s while progress
  changes, and a heartbeat every 30 s. On exit, `job.done` (duration, output) or `job.failed` (tail
  of ~10 lines). After 10 min (or `--quiet-ok`) with no output: row → `stuck` and a `job.stuck`
  event, back to `running` if output resumes.
- Target from `WALL_URL` / `credentials.json` `wall.url`, else `http://localhost:8788`. Key if one
  is configured. Any network failure: one "wall offline, not reporting" line, never thrown, never
  queued; short timeouts so a dead wall never slows the job.

**Done when:** helper tests pass; a real Remotion render and a failing command both show correctly
on the local wall; with the wall stopped the command runs unchanged and prints one offline line.

## Comments

2026-11-12: done, test-first at three agreed seams: `recognise` (stations, labels, outputs, own
options), `progress`/`phase` (percent, counted fraction, the word before it), and the whole
wrapper end to end against a pretend wall (success with progress, failure tail and exit code,
stuck and back to running, wall offline said once). 26 tests in apps/wall. Hand-checked with a real Remotion
render (only-aces, 300 frames) on a local wall: Bundling 91 → Rendered 33 → Rendered 95 → done.
Found on the way: (1) Remotion runs three phases that each count 0-100, so the bar restarted;
founder chose to show the phase word next to it (`phase`, migration 0003). (2) `process.exit()`
on Windows sometimes crashed Node on exit (libuv async.c assertion), turning exit 3 into a crash
code; the wrapper now sets `process.exitCode`. (3) Any non-2xx answer counts as offline, so an
older wall without /api/job (405) is reported instead of silently ignored.
Shim: `scripts/bin/job.cmd` + `scripts/bin/job`; on PATH it's one word.
Known limit: a Remotion flag with a separate value placed *before* the composition id (e.g.
`--codec h264 only-aces`) mislabels the job; use `--label` or put flags after.
