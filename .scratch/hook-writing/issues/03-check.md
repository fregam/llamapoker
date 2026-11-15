# 03 Code checks

Status: ready-for-agent
Type: task

`apps/reels/scripts/hooks/check` reads a run's drafts (`drafts.json`: `{ id, line, promise,
promise_word, fact_ids, open_question, rung, quote_ids }` per hook) and the topic's `facts.json`,
and writes `checks.json` (pass/fail per hook) plus appends failures to `failures.md` (hook, check,
reason).

- **Numbers:** every number in `line` (digits, %, spelled-out numbers, "one in five") equals the
  value of a fact listed in that hook's `fact_ids`, after rounding as written. A number with no
  cited fact fails; a cited id missing from `facts.json` fails. (Whether the *claim* matches is
  the critic's check 1b.)
- **Words:** a banned list from `brand/README.md` (luck talk, glamour, cash, "crush", real-money
  use) plus handle patterns.
- **Length:** `promise_word` ≤ 7 and the word count ≤ 25.
- **Quote ids** in a research run exist in `evidence.md`.

Tests first, one per rule, including near misses ("85%" vs a fact of 85.2 → pass; "90%" → fail).
