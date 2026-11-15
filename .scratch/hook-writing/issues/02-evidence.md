# 02 Evidence file from the research store

Status: ready-for-agent
Type: task

`apps/reels/scripts/hooks/evidence` (Python, standard library `sqlite3`). `evidence <topic>
--db <path>` reads the research store (`items` table: `text`, `title`, `lang`, `likes`, `replies`,
`thread_url`, `skip`, `is_rec`, `source`, `platform`; default path `apps/research/data/research.sqlite`,
which lives in the research worktree until that merges) and writes
`content/hooks/<run>/<topic>/evidence.md`: ~30–60 quotes, each `{ q-id, verbatim, English if not
English, platform, thread url, likes }`.

- Topic → keyword sets in a small config (e.g. `aces-lose`: aces/AA/pocket rockets × lost, cracked,
  rigged, always lose). Only `skip is null`; prefer `is_rec = 1`; rank by engagement, spread across
  sources and platforms (no source above a third of the file).
- **Drops** quotes that read as problem gambling (chasing, escape, "can't stop", debt, rent money):
  a word list in code, the dropped count printed.
- **Strips** `u/…`, `@handle`, emails and comment permalinks; links the thread, never the comment.
- Runs the same privacy pattern as the research check script, and fails if anything slips through.

Tests first: handle stripping, the problem-gambling drop, the per-source cap, on a fixture DB.
