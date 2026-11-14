# 04 Briefing reads results first

Status: done
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

2026-11-14: done, test-first. The briefing moved to its own module, `functions/_lib/briefing.ts`
(six tests in `briefing.test.ts`), taking the reading's own `results` and `work`. Order: `First:`
(paused, red threats) → money and subscribers (with the first-touch sources of those who joined in
the last 24 h, not the all-time ones) → `Needs you:` (amber threats, approvals waiting) and "I
would …" from the top red or amber threat → `Work:` one clause per department. Cyan threats no
longer give the advice line. The old "N events since your last look" count is gone (the feed has
it). `sourcesLine` is shared with the Newsletter row. Live: "No revenue source yet. 2 on the list,
unchanged since yesterday. Nothing needs you. Work: CONTENT OK; DEVELOPMENT OK, Site: 200 in 320 ms."
