# 02 The `job` wrapper

Status: ready-for-agent
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
