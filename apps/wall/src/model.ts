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

export interface Channel {
  id: string; // site | letter | ig | search
  name: string;
  value: number | null; // the channel's key number, null = not enough data
  unit: string;
  trend: number | null; // change over the window, same unit
  brought: number | null; // subscribers attributed to it (first touch)
  note: string; // where the number comes from, or why there is none
}

export interface DayCount {
  day: string; // YYYY-MM-DD
  count: number; // cumulative subscribers at the end of that day
}

export interface North {
  subscribers: number | null;
  delta1: number | null; // change in the last 24 h
  delta7: number | null; // change in the last 7 days
  byDay: DayCount[];
  weeklyActiveShare: number | null; // opened or clicked in 7 days / subscribers; null until sends exist
  reach: number | null; // views across channels in 7 days; null until a channel reports views
  today: string; // what changed today, one line
  action: string; // what to do about it, one line
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
  north: North;
  stations: Station[];
  links: Link[];
  threats: Threat[];
  feed: WallEvent[];
  queue: QueueItem[];
  channels: Channel[];
  budget: { spentMonth: number; ceiling: number | null; month: string };
  experiments: Experiment[];
  briefing: string;
  errors: string[]; // sources the reading could not reach, in plain words
}

export const day = (ts: string | Date = new Date()) => new Date(ts).toISOString().slice(0, 10);
