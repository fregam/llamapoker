# 03 Check script

Status: resolved
Type: task
Blocked by: 02

`npm run check` in apps/research: pack.md ≤ 2,500 tokens, every quote id cited in pack/topics exists
in quotes.md, no `u/`, `@handle` or comment permalinks in committed files, every pack finding backed
by two source types. Test-first.

## Answer (2026-11-16)

`apps/research/src/check.mjs` (`npm run check`, 7 tests): pack ≤ 2,500 tokens by an offline bound
(characters ÷ 3.5), every cited quote id exists in `quotes.md`, one-source-type leads must be marked
on the line that uses them, findings need two source types, no `u/`, `@handle` or comment
permalinks. It reads only `content/research/audience/`, so it runs on a fresh clone.
