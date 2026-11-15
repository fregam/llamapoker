# 02 apps/research skeleton and store

Status: ready-for-agent
Type: task
Blocked by: 01

`apps/research` with README (wall-style: modules per source, one store), SQLite schema (sources,
items, quotes, tags, runs), git-ignored `data/`, every step a `job` on the wall. TDD the store.

## Progress (2026-11-15)

Store built in Python (`apps/research/pipeline/store.py`, 9 tests; node:sqlite is still flagged on
Node 23.0 and the analysis stack is Python anyway). Tables: items, runs. Steps in `pipeline/run.py`:
import, noise, lang, embed, status. Still open: README, wall `job` logging, `npm test` running the
Python tests, quotes/tags tables (arrive with ticket 06).
