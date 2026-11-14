/**
 * The common shapes shared by the store (functions/), the wall (src/) and the event CLI
 * (scripts/wall-event.mjs). One event format for everything: what happened, when, to what,
 * how much, at what cost (docs/interface.md, "Built to grow"). Nothing in here touches the DOM
 * or the database, so both sides can import it.
 */

export type StationState = "ok" | "idle" | "waiting" | "failed" | "paused" | "nodata";

export interface WallEvent {
  id: string;
  ts: string; // ISO 8601 UTC
  kind: string; // signup | view | run | publish | fail | cost | note | ...
  station?: string | null; // site | signup | letter | reels | research | drafts | approval | scheduled | published
  subject?: string | null; // the page, reel, letter or job it happened to
  amount?: number | null;
  unit?: string | null;
  cost?: number | null; // EUR
  channel?: string | null; // site | letter | ig | tt | yt | x | search | direct
  text?: string | null; // one plain-words line for the feed
  meta?: Record<string, unknown> | null;
}

export interface Station {
  id: string;
  name: string;
  state: StationState;
  message?: string | null;
  lastRun?: string | null;
  nextRun?: string | null;
  count?: number | null; // what moved through it in the window
  countLabel?: string | null;
  evidence?: unknown; // the raw records behind the station, shown when it is opened
  jobs?: Job[]; // today's local jobs under this station (scripts/job.mjs)
  department?: Department | null; // set by the station's writer or `job --dept`; else derive.ts departmentOf decides
}

/** The two sides of "what is being made?": the Work strip has one line per department. */
export type Department = "content" | "development";

/** One Work line: a department rolled up from its stations and today's jobs. */
export interface WorkLine {
  id: Department;
  name: string; // CONTENT | DEVELOPMENT
  state: StationState; // the worst of its stations
  word: string; // OK | RUNNING n | FAILED | STUCK | LOST
  latest: string | null; // the newest thing that happened in it, one line
  open: boolean; // opens by itself when anything in it is failed, stuck or lost
  stations: Station[];
}

/** stuck: alive but silent too long (the wrapper says so); lost: the wrapper stopped beating. */
export type JobState = "running" | "done" | "failed" | "stuck" | "lost";

/** One local job run through `job <command>`: live state, overwritten while it runs. */
export interface Job {
  id: string;
  station: string;
  label: string;
  state: JobState;
  percent: number | null; // null = the tool prints no progress: show "running" + elapsed
  startedAt: string; // ISO
  lastBeat: string; // ISO, the wrapper's last report or heartbeat
  endedAt: string | null;
  output: string | null; // the output file, when known
  tail: string | null; // the last output lines, for a failure
  phase: string | null; // the word before the progress number ("Rendered", "Encoded"), when printed
  log: string | null; // the full output of this run on the PC (logs/jobs/<day>/<id>.log)
  department?: Department | null; // `job --dept`, given to its station when the station has none
}

export interface Link {
  from: string;
  to: string;
  label?: string;
  stalled?: boolean;
}

export type ThreatLevel = "red" | "amber" | "cyan";

export interface Threat {
  id: string;
  level: ThreatLevel;
  weight: number; // higher matters more; the list is sorted by it
  title: string;
  detail: string;
  fix: string;
  evidence?: unknown;
}

export interface QueueItem {
  id: string;
  ts: string;
  kind: string; // reel | letter | guide | post | caption
  title: string;
  preview?: string | null;
  status: "waiting" | "called" | "folded" | "raised";
  note?: string | null;
  decided?: string | null;
}

export interface DayCount {
  day: string; // YYYY-MM-DD
  count: number; // cumulative subscribers at the end of that day
}

/** A channel's latest post and how it did (a `kind: post` event; numbers from its meta). */
export interface PostStat {
  subject: string; // the post id
  ts: string;
  url: string | null;
  views: number | null;
  likes: number | null;
  saves: number | null;
  comments: number | null;
}

/**
 * One channel in Results. Every channel has this shape: the Newsletter (Beehiiv) and any channel
 * that posts `kind: followers` / `kind: post` events. A null number is shown as a dash.
 */
export interface ChannelRow {
  channel: string; // newsletter | ig | tt | yt | ...
  name: string;
  headline: number | null; // subscribers / followers
  unit: string;
  delta1: number | null;
  delta7: number | null;
  spark: number[]; // the headline at the end of each of the last 30 days, oldest first
  latestPost: PostStat | null;
  extra: Record<string, string | number | null>; // channel-specific facts (Newsletter: signups, last letter, came from)
  note: string; // where the numbers come from, or why there are none
}

/** "How are we doing?": the money hero, subscribers as the leading number, one row per channel. */
export interface Results {
  money: { today: number | null; month: number | null; unit: "EUR"; note: string };
  subscribers: number | null;
  delta1: number | null;
  delta7: number | null;
  rows: ChannelRow[];
}

export interface Experiment {
  id: string;
  name: string;
  started: string;
  status: string; // "too early to call" | "a wins" | ...
  detail: string;
}

export interface WallState {
  asof: string; // ISO timestamp of this reading
  day: string; // YYYY-MM-DD the reading describes
  live: boolean; // false when read back from a snapshot
  paused: boolean;
  results?: Results; // absent in snapshots stored before the results-first layout
  work?: WorkLine[]; // CONTENT then DEVELOPMENT; absent in older snapshots
  stations: Station[];
  links: Link[];
  threats: Threat[];
  feed: WallEvent[];
  queue: QueueItem[];
  budget: { spentMonth: number; ceiling: number | null; month: string };
  experiments: Experiment[];
  briefing: string;
  errors: string[]; // sources the reading could not reach, in plain words
}

export const day = (ts: string | Date = new Date()) => new Date(ts).toISOString().slice(0, 10);
