# 02 Evidence file from the research store

Status: ready-for-agent
Type: task

`apps/reels/scripts/hooks/evidence` (Python, standard library `sqlite3`). `evidence <topic>
--db <path>` reads the research store (`items` table: `text`, `title`, `lang`, `likes`, `replies`,
`thread_url`, `skip`, `is_rec`, `source`, `platform`; default path `apps/research/data/research.sqlite`,
which lives in the research worktree until that merges) and writes
`content/hooks/<run>/<topic>/evidence.md`: ~30–60 quotes, each `{ q-id, verbatim, English if not
English, platform, thread url, likes }`.

- Open the store **read-only by absolute path** (`file:…?mode=ro`, with a busy timeout):
  collectors write to it while they run, and a plain open hit "database is locked".
- Topic → keyword sets in a small config (e.g. `aces-win`: aces/AA/pocket rockets × lost, cracked,
  rigged, always lose). `skip` marks noise (6,401 of 331,262 on 2026-11-15): exclude marked rows.
  `is_rec` is still empty for every row, so don't filter on it until the research fills it.
  English only (`lang = 'en'`) for the test: a standard-library script can't translate.
  Rank by engagement, spread across sources and platforms (no source above a third of the file).
- **Drops** quotes that read as problem gambling (chasing, escape, "can't stop", debt, rent money):
  a word list in code, the dropped count printed.
- **Strips** `u/…`, `@handle`, emails and comment permalinks; links the thread, never the comment.
- Runs the same privacy pattern as the research check script, and fails if anything slips through.

Tests first: handle stripping, the problem-gambling drop, the per-source cap, on a fixture DB.
