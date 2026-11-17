# 05 The test run

Status: ready-for-agent
Type: task
Blocked by: 01, 02, 03, 04

Three topics × (research, control). Each run in `content/hooks/2026-11-<dd>-test/<topic>/<arm>/`:
drafts, checks, critic verdicts, failures, best 5. Writer and critic are separate, **fresh**
agents at higher effort (never forks of a session that has read the research); research and
control get identical briefs and the same neutral topic line, except the evidence path. Fewer
than 5 passing → one retry with the failure reasons, both arms alike.

Then `content/hooks/2026-11-<dd>-test/read.json`: per topic the 10 lines shuffled with a fixed seed,
labels kept in a separate `key.json` the review page reads only after the picks are saved.

Report: drafts written, pass rate per check, the most common failure.
