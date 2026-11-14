# 05 Unattended runs: kill when stuck, a log per run

Status: done
Spec: ../spec.md (Decision 5, amended)
Blocked by: 02

Grilled 2026-11-12: the jobs will mostly be run by the automated workflow, not by the founder at a
terminal. So:

- **Warn, then kill.** No output for `--quiet-ok` (10 min) → stuck (red, threat), as before. Still
  silent after twice that (20 min) → `job` kills the whole process tree, marks the job failed
  ("killed: no output for 20 min"), exits 124 so the workflow can retry or move on.
- **A log per run.** The full output also goes to `logs/jobs/<YYYY-MM-DD>/<job id>.log`
  (git-ignored); the job row, its threat and the evidence drawer carry the path. Logs older than
  14 days are deleted when `job` starts.
- Threat advice speaks to whoever reads it, not to "its terminal": read the log, fix, run again.

**Done when:** end-to-end tests cover the kill (tree killed, exit 124, within seconds of the
deadline) and the log (full output on disk, path in the row); docs updated.
