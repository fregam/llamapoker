# 05 The test run

Status: ready-for-agent
Type: task
Blocked by: 01, 02, 03, 04

Three topics × (research, control). Each run in `content/hooks/2026-11-<dd>-test/<topic>/<arm>/`:
drafts, checks, critic verdicts, failures, best 5. Writer and critic are separate agents at higher
effort; research and control get identical briefs except the evidence path.

Then `content/hooks/2026-11-<dd>-test/read.json`: per topic the 10 lines shuffled with a fixed seed,
labels kept in a separate `key.json` the review page reads only after the picks are saved.

Report: drafts written, pass rate per check, the most common failure.
