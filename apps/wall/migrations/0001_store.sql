-- The one store under everything (docs/interface.md, "Built to grow").
-- events:    what happened, when, to what, how much, at what cost. Every agent, pipeline and
--            channel writes here in this shape; the wall reads only from here.
-- stations:  the machine's nodes, one row each, updated by the thing that runs (or by the wall's
--            own probes for the site, signup and letter).
-- queue:     pieces waiting on the founder (call / fold / raise).
-- flags:     operator switches (pause) and settings (budget ceiling).
-- snapshots: the wall's state at the end of each day, for time control.

CREATE TABLE IF NOT EXISTS events (
  id      TEXT PRIMARY KEY,
  ts      TEXT NOT NULL,            -- ISO 8601, UTC
  kind    TEXT NOT NULL,            -- signup | view | run | publish | fail | cost | note ...
  station TEXT,                     -- which part of the machine (site, signup, letter, reels, research ...)
  subject TEXT,                     -- what it happened to (a page, a reel, a letter, a job)
  amount  REAL,                     -- how much (count, views, seconds ...)
  unit    TEXT,                     -- what the amount counts
  cost    REAL DEFAULT 0,           -- EUR
  channel TEXT,                     -- site | letter | ig | tt | yt | x | search | direct ...
  text    TEXT,                     -- one plain-words line for the feed
  meta    TEXT                      -- JSON, anything else
);
CREATE INDEX IF NOT EXISTS events_ts ON events (ts);
CREATE INDEX IF NOT EXISTS events_kind_ts ON events (kind, ts);
CREATE INDEX IF NOT EXISTS events_station_ts ON events (station, ts);

CREATE TABLE IF NOT EXISTS stations (
  id       TEXT PRIMARY KEY,
  name     TEXT NOT NULL,
  state    TEXT NOT NULL DEFAULT 'idle',   -- ok | idle | waiting | failed | paused
  message  TEXT,
  last_run TEXT,
  next_run TEXT,
  updated  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS queue (
  id      TEXT PRIMARY KEY,
  ts      TEXT NOT NULL,
  kind    TEXT NOT NULL,            -- reel | letter | guide | post | caption
  title   TEXT NOT NULL,
  preview TEXT,                     -- the piece exactly as it would be published (markdown or a URL)
  status  TEXT NOT NULL DEFAULT 'waiting',  -- waiting | called | folded | raised
  note    TEXT,
  decided TEXT
);

CREATE TABLE IF NOT EXISTS flags (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  ts    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS snapshots (
  day  TEXT PRIMARY KEY,            -- YYYY-MM-DD, UTC
  ts   TEXT NOT NULL,
  json TEXT NOT NULL
);
