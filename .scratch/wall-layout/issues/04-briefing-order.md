# 04 Briefing reads results first

Status: ready-for-agent
Spec: ../spec.md (Decision 7)
Blocked by: 01, 02

Reorder `briefing()` in `functions/_lib/derive.ts`:

1. Money (or "no revenue source yet") and subscribers, with yesterday's change and where the new
   ones came from.
2. Threats and approvals waiting, with the first thing to do.
3. One line on Work: what finished, failed or is stuck (from `work`).

Anything failed or paused goes first, above results. Plain words, as now.

Tests in `derive.test.ts`: a quiet day starts with money/subscribers; a paused wall or a failed
job puts that line first; the Work line names a finished render.

**Done when:** `npm test` passes and the briefing on first open (or `b`) reads in that order.

## Comments
