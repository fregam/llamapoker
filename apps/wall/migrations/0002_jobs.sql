-- jobs: live state of local jobs run through `job <command>` (scripts/job.mjs). One row per run,
-- overwritten while it runs (at most every 5 s, heartbeat every 30 s), pruned after midnight.
-- The permanent history is in events (job.started, job.done, job.failed, job.stuck, job.lost).
-- state: running | done | failed | stuck | lost (lost is written by the wall, read from last_beat).

CREATE TABLE IF NOT EXISTS jobs (
  id         TEXT PRIMARY KEY,
  station    TEXT NOT NULL,
  label      TEXT NOT NULL,
  state      TEXT NOT NULL,
  percent    REAL,
  started_at TEXT NOT NULL,
  last_beat  TEXT NOT NULL,
  ended_at   TEXT,
  output     TEXT,
  tail       TEXT
);

CREATE INDEX IF NOT EXISTS jobs_station ON jobs (station);
