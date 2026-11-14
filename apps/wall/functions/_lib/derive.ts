/**
 * Pure derivations for the wall's state: subscribers by day, channel attribution, threats,
 * the briefing. No I/O, so derive.test.ts can check them. store.ts gathers the raw facts and
 * calls these.
 */
import type { Channel, ChannelRow, DayCount, Job, PostStat, QueueItem, Results, Station, Threat, WallEvent } from "../../src/model";
import { day } from "../../src/model";

export interface Subscriber {
  created: number; // unix seconds
  status: string;
  utm_source?: string;
  utm_channel?: string;
  referring_site?: string;
}

/** Cumulative active subscribers at the end of each day, from the first signup to `until`. */
export function subscribersByDay(subs: Subscriber[], until = new Date()): DayCount[] {
  const active = subs.filter((s) => s.status === "active").map((s) => day(new Date(s.created * 1000))).sort();
  if (active.length === 0) return [];
  const out: DayCount[] = [];
  const end = day(until);
  const d = new Date(active[0] + "T00:00:00Z");
  let i = 0;
  let total = 0;
  for (; day(d) <= end && out.length < 400; d.setUTCDate(d.getUTCDate() + 1)) {
    const key = day(d);
    while (i < active.length && active[i] <= key) {
      total++;
      i++;
    }
    out.push({ day: key, count: total });
  }
  return out;
}

export function countAt(byDay: DayCount[], daysAgo: number, until = new Date()): number | null {
  if (byDay.length === 0) return null;
  const target = day(new Date(until.getTime() - daysAgo * 86400000));
  let last: number | null = byDay[0].day > target ? 0 : null;
  for (const p of byDay) if (p.day <= target) last = p.count;
  return last;
}

/** Which channel a subscriber came from, first touch, in the wall's channel ids. */
export function channelOf(s: Subscriber): string {
  const src = (s.utm_source ?? "").toLowerCase();
  if (!src || src === "direct" || src === "llamapoker.com") {
    const ref = (s.referring_site ?? "").toLowerCase();
    if (ref.includes("google") || ref.includes("bing") || ref.includes("duckduckgo")) return "search";
    if (ref.includes("instagram")) return "ig";
    if (ref.includes("tiktok")) return "tt";
    if (ref.includes("youtube")) return "yt";
    return "site";
  }
  if (src === "letter") return "letter";
  if (["ig", "instagram"].includes(src)) return "ig";
  if (["tt", "tiktok"].includes(src)) return "tt";
  if (["yt", "youtube"].includes(src)) return "yt";
  if (["x", "twitter"].includes(src)) return "x";
  if (["google", "bing", "search"].includes(src)) return "search";
  return src;
}

export function brought(subs: Subscriber[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of subs) {
    if (s.status !== "active") continue;
    const c = channelOf(s);
    out[c] = (out[c] ?? 0) + 1;
  }
  return out;
}

export const CHANNEL_NAMES: Record<string, string> = {
  site: "SITE",
  letter: "LETTER",
  ig: "INSTAGRAM",
  tt: "TIKTOK",
  yt: "YOUTUBE",
  x: "X",
  search: "SEARCH",
};

/** Channels that exist today. Views need the event store; until a channel reports them it says so. */
export function channels(byChannel: Record<string, number>, views: Record<string, number>, sends: number): Channel[] {
  const ids = ["site", "letter", "ig", "search"];
  for (const k of Object.keys(byChannel)) if (!ids.includes(k) && CHANNEL_NAMES[k]) ids.push(k);
  return ids.map((id) => {
    const v = views[id];
    const value = id === "letter" ? sends : v ?? null;
    return {
      id,
      name: CHANNEL_NAMES[id] ?? id.toUpperCase(),
      value,
      unit: id === "letter" ? "sent" : "views 7d",
      trend: null,
      brought: byChannel[id] ?? 0,
      note:
        id === "letter"
          ? sends
            ? "Beehiiv posts"
            : "no letter sent yet"
          : v === undefined
            ? "no view events yet"
            : "event store, 7 days",
    };
  });
}

export interface Facts {
  now: Date;
  paused: boolean;
  hasStore: boolean;
  stations: Station[];
  queue: QueueItem[];
  subscribers: number | null;
  delta7: number | null;
  lastSignup: string | null; // ISO
  sends: number;
  spentMonth: number;
  ceiling: number | null;
  errors: string[];
}

const hours = (from: string | null | undefined, now: Date) =>
  from ? (now.getTime() - new Date(from).getTime()) / 3600000 : Infinity;

/** Everything going wrong or about to, ranked. Only from facts the reading actually has. */
export function threats(f: Facts): Threat[] {
  const out: Threat[] = [];
  if (f.paused)
    out.push({
      id: "paused",
      level: "amber",
      weight: 90,
      title: "OUTBOUND PAUSED",
      detail: "The kill switch is on: nothing is being sent or published.",
      fix: "Resume from the command bar (type: resume) when the reason is gone.",
    });
  for (const e of f.errors)
    out.push({ id: "err:" + e.slice(0, 20), level: "red", weight: 85, title: "SOURCE UNREACHABLE", detail: e, fix: "Check the service and the keys on the Pages project." });
  for (const s of f.stations) {
    const badJobs = (s.jobs ?? []).filter((j) => BAD.has(j.state));
    for (const j of badJobs)
      out.push({
        id: "job:" + j.id,
        level: "red",
        weight: 100,
        title: `${s.name.toUpperCase()} ${j.state.toUpperCase()}: ${j.label.toUpperCase()}`,
        detail: jobLine(j),
        fix: jobFix(j),
        evidence: j,
      });
    if (s.state === "failed" && !badJobs.length)
      out.push({
        id: "fail:" + s.id,
        level: "red",
        weight: 100,
        title: `${s.name.toUpperCase()} FAILED`,
        detail: s.message ?? "No message recorded.",
        fix: "Open the station for the log, fix the cause, run it again.",
        evidence: s.evidence,
      });
    if (s.state === "waiting")
      out.push({
        id: "wait:" + s.id,
        level: "amber",
        weight: 60,
        title: `${s.name.toUpperCase()} WAITING ON YOU`,
        detail: s.message ?? "",
        fix: "Deal with it in the approvals panel.",
        evidence: s.evidence,
      });
  }
  const stale = f.queue.filter((q) => q.status === "waiting" && hours(q.ts, f.now) > 24);
  if (stale.length)
    out.push({
      id: "queue",
      level: "amber",
      weight: 65,
      title: `${stale.length} PIECE${stale.length > 1 ? "S" : ""} WAITING OVER A DAY`,
      detail: stale.map((q) => q.title).join("; "),
      fix: "Call, fold or raise them (approvals panel, or the phone).",
    });
  if (!f.hasStore)
    out.push({
      id: "nostore",
      level: "amber",
      weight: 70,
      title: "NO EVENT STORE",
      detail: "The D1 database is not bound, so events, the queue, the pause switch and time control are off.",
      fix: "Create the D1 database, bind it as DB on the Pages project, run the migration (apps/wall/README.md).",
    });
  if (f.ceiling !== null && f.spentMonth > f.ceiling)
    out.push({
      id: "budget",
      level: "red",
      weight: 95,
      title: "OVER BUDGET",
      detail: `EUR ${f.spentMonth.toFixed(2)} spent this month against a ceiling of ${f.ceiling}.`,
      fix: "Pause the paid jobs or raise the ceiling (command bar: ceiling <amount>).",
    });
  else if (f.ceiling !== null && f.spentMonth > 0.8 * f.ceiling)
    out.push({
      id: "budget80",
      level: "amber",
      weight: 55,
      title: "BUDGET AT 80%",
      detail: `EUR ${f.spentMonth.toFixed(2)} of ${f.ceiling} this month.`,
      fix: "Decide now what gets the rest of the month.",
    });
  if (f.subscribers !== null && f.hasStore) {
    const h = hours(f.lastSignup, f.now);
    if (h === Infinity)
      out.push({
        id: "nosignup",
        level: "cyan",
        weight: 30,
        title: "NO SIGNUP EVENT RECORDED",
        detail: "The store has never received a signup event from the site.",
        fix: "Point apps/web's subscribe function at the wall's /api/event (README).",
      });
    else if (h > 7 * 24)
      out.push({
        id: "silent",
        level: "amber",
        weight: 50,
        title: `SIGNUP PATH SILENT ${Math.floor(h / 24)} DAYS`,
        detail: "No signup has reached the store in a week.",
        fix: "Check the form on the site, then the channels that should send people.",
      });
  }
  if (f.subscribers !== null && f.sends === 0)
    out.push({
      id: "nosend",
      level: "cyan",
      weight: 25,
      title: "NO LETTER SENT YET",
      detail: `${f.subscribers} subscriber${f.subscribers === 1 ? "" : "s"} waiting for a first letter.`,
      fix: "Send letter 001 once the footer address and reply-to are set.",
    });
  if (f.subscribers !== null && f.delta7 === 0 && f.sends > 0)
    out.push({ id: "flat", level: "cyan", weight: 20, title: "SUBSCRIBERS FLAT 7 DAYS", detail: "No growth this week.", fix: "Look at which channel went quiet in the channels panel." });
  return out.sort((a, b) => b.weight - a.weight);
}

/** The Gentleman's briefing: what happened since the last look, what needs you, what he'd do. */
export function briefing(f: Facts, t: Threat[], feed: WallEvent[], sinceHours: number): string {
  const since = feed.filter((e) => hours(e.ts, f.now) <= sinceHours);
  const signups = since.filter((e) => e.kind === "signup").length;
  const fails = since.filter((e) => e.kind === "fail").length;
  const parts: string[] = [];
  const h = Math.max(1, Math.round(sinceHours));
  const window = sinceHours >= 48 ? `${Math.round(sinceHours / 24)} days` : h === 1 ? "hour" : `${h} hours`;
  if (f.subscribers === null) parts.push("I cannot see the letter's numbers; the Beehiiv keys are missing or the service is down.");
  else {
    const d7 = f.delta7 === null ? "" : f.delta7 === 0 ? ", unchanged this week" : `, ${f.delta7 > 0 ? "+" : ""}${f.delta7} this week`;
    parts.push(`${f.subscribers} on the list${d7}.`);
  }
  if (since.length === 0) parts.push(f.hasStore ? `Nothing reached the store in the last ${window}.` : "No store yet, so I have no events to report.");
  else
    parts.push(
      `In the last ${window}: ${since.length} event${since.length === 1 ? "" : "s"}, ${signups} signup${signups === 1 ? "" : "s"}, ${fails} failure${fails === 1 ? "" : "s"}.`,
    );
  const needs = t.filter((x) => x.level !== "cyan");
  if (needs.length) parts.push(`Needs you: ${needs.map((x) => x.title.toLowerCase()).join("; ")}.`);
  else parts.push("Nothing needs you.");
  const top = t[0];
  if (top) parts.push(`I would ${top.fix.charAt(0).toLowerCase()}${top.fix.slice(1)}`);
  return parts.join(" ");
}

/** The line under the number. */
export function todayLine(f: Facts, feed: WallEvent[]): { today: string; action: string } {
  const start = new Date(f.now);
  start.setUTCHours(0, 0, 0, 0);
  const todays = feed.filter((e) => new Date(e.ts) >= start);
  const signups = todays.filter((e) => e.kind === "signup").length;
  const others = todays.length - signups;
  const today =
    todays.length === 0
      ? f.hasStore
        ? "Nothing recorded today."
        : "No event store bound; nothing to count today."
      : `Today: ${signups} signup${signups === 1 ? "" : "s"}, ${others} other event${others === 1 ? "" : "s"}.`;
  const t = threats(f)[0];
  return { today, action: t ? t.fix : "Keep the cadence." };
}

/** A running job whose wrapper has not reported for this long is lost (terminal closed, PC slept). */
export const LOST_AFTER_MS = 2 * 60 * 1000;

/** Today's jobs attached to their stations, with lost jobs read from their heartbeat. */
export function withJobs(stations: Station[], jobs: Job[], now: Date, since: Date): Station[] {
  // A job belongs to today if it ended today, or is unfinished and its wrapper beat today.
  const today = jobs.filter((j) => new Date(j.endedAt ?? j.lastBeat) >= since);
  const read = today.map((j): Job =>
    (j.state === "running" || j.state === "stuck") && now.getTime() - new Date(j.lastBeat).getTime() > LOST_AFTER_MS ? { ...j, state: "lost" } : j,
  );
  const by = new Map(stations.map((s) => [s.id, { ...s }]));
  for (const j of read) {
    const s = by.get(j.station) ?? { id: j.station, name: j.station, state: "idle" as const };
    by.set(j.station, { ...s, jobs: [...(s.jobs ?? []), j] });
  }
  return [...by.values()].map((s) => {
    const js = s.jobs ?? [];
    const bad = js.find((j) => BAD.has(j.state));
    if (bad) return { ...s, state: "failed", message: jobLine(bad) };
    const running = js.filter((j) => j.state === "running").length;
    if (running) return { ...s, state: "ok", message: `${running} running` };
    return s;
  });
}

const BAD = new Set<Job["state"]>(["stuck", "failed", "lost"]);

/** What to do about a bad job, for whoever reads it: the founder or the workflow's agent. */
function jobFix(j: Job): string {
  const log = j.log ? `the log (${j.log})` : "its output";
  if (j.state === "stuck") return `Read ${log}. If it hung, it is killed at twice its quiet limit; if it is just quiet, run it with --quiet-ok.`;
  if (j.state === "lost") return `Its runner stopped (process killed, PC slept). Read ${log}, then run it again.`;
  return `Read ${log}, fix the cause, run it again.`;
}

/** One plain line for a job that went wrong. */
export function jobLine(j: Job): string {
  if (j.state === "stuck") return `${j.label}: stuck, no output`;
  if (j.state === "lost") return `${j.label}: lost, the job stopped reporting`;
  const last = j.tail?.trim().split("\n").at(-1);
  return `${j.label}: failed${last ? ` (${last})` : ""}`;
}

// ---------- results: "how are we doing?" ----------

export interface ResultsFacts {
  now: Date;
  revenueEver: boolean; // any `kind: revenue` event at all, ever
  events: WallEvent[]; // revenue, followers and post events of the last 30 days
  newsletter: {
    subscribers: number | null; // Beehiiv's live count, null when unreachable
    byDay: DayCount[];
    signupsToday: number;
    lastSend: string | null; // ISO
    sends: number;
    cameFrom: Record<string, number>; // first-touch channel → subscribers
  };
}

const MONTH_MS = 30 * 86400000;

/** Revenue (EUR) today and over 30 days; a dash with its reason until any revenue event exists. */
function money(f: ResultsFacts): Results["money"] {
  if (!f.revenueEver) return { today: null, month: null, unit: "EUR", note: "no revenue source yet" };
  const from = f.now.getTime() - MONTH_MS;
  const today = day(f.now);
  let t = 0;
  let m = 0;
  for (const e of f.events) {
    if (e.kind !== "revenue" || new Date(e.ts).getTime() < from) continue;
    m += e.amount ?? 0;
    if (day(e.ts) === today) t += e.amount ?? 0;
  }
  return { today: t, month: m, unit: "EUR", note: "revenue events" };
}

const ALIASES: Record<string, string> = { instagram: "ig", tiktok: "tt", youtube: "yt", twitter: "x" };
const channelId = (raw: string) => ALIASES[raw.toLowerCase()] ?? raw.toLowerCase();

/** The value at the end of each day from the first reading (at most 30 days back) to today, carried forward. */
function daily(readings: { ts: string; amount: number }[], now: Date): { day: string; value: number }[] {
  const last = new Map<string, number>();
  for (const r of [...readings].sort((a, b) => a.ts.localeCompare(b.ts))) last.set(day(r.ts), r.amount);
  if (last.size === 0) return [];
  const first = [...last.keys()][0];
  const start = day(new Date(Math.max(new Date(first + "T00:00:00Z").getTime(), now.getTime() - 29 * 86400000)));
  const out: { day: string; value: number }[] = [];
  let carry: number | null = null;
  for (const [d, v] of last) if (d < start) carry = v;
  for (const d = new Date(start + "T00:00:00Z"); day(d) <= day(now); d.setUTCDate(d.getUTCDate() + 1)) {
    carry = last.get(day(d)) ?? carry;
    if (carry !== null) out.push({ day: day(d), value: carry });
  }
  return out;
}

/** A row for a channel that reports `kind: followers` readings (and `kind: post` events). */
function eventRow(channel: string, events: WallEvent[], now: Date): ChannelRow {
  const readings = events.filter((e) => e.kind === "followers" && e.amount != null).map((e) => ({ ts: e.ts, amount: e.amount as number }));
  const series = daily(readings, now);
  const headline = series.at(-1)?.value ?? null;
  const at = (daysAgo: number) => {
    const target = day(new Date(now.getTime() - daysAgo * 86400000));
    let v: number | null = null;
    for (const p of series) if (p.day <= target) v = p.value;
    return v;
  };
  const delta = (daysAgo: number) => {
    const then = at(daysAgo);
    return headline === null || then === null ? null : headline - then;
  };
  return {
    channel,
    name: CHANNEL_NAMES[channel] ?? channel.toUpperCase(),
    headline,
    unit: "followers",
    delta1: delta(1),
    delta7: delta(7),
    spark: series.map((p) => p.value),
    latestPost: latestPost(events),
    extra: {},
    note: readings.length ? "followers events" : "no followers events yet",
  };
}

function latestPost(events: WallEvent[]): PostStat | null {
  const p = events.filter((e) => e.kind === "post").sort((a, b) => b.ts.localeCompare(a.ts))[0];
  if (!p) return null;
  const m = p.meta ?? {};
  const n = (k: string) => (typeof m[k] === "number" ? (m[k] as number) : null);
  return {
    subject: p.subject ?? "post",
    ts: p.ts,
    url: typeof m.url === "string" ? m.url : null,
    views: n("views"),
    likes: n("likes"),
    saves: n("saves"),
    comments: n("comments"),
  };
}

/** One row per channel with followers or post events, biggest first. */
function eventRows(f: ResultsFacts): ChannelRow[] {
  const by = new Map<string, WallEvent[]>();
  for (const e of f.events) {
    if ((e.kind !== "followers" && e.kind !== "post") || !e.channel) continue;
    const id = channelId(e.channel);
    by.set(id, [...(by.get(id) ?? []), e]);
  }
  return [...by].map(([id, evs]) => eventRow(id, evs, f.now)).sort((a, b) => (b.headline ?? -1) - (a.headline ?? -1));
}

/** The money hero, subscribers as the leading number, and one row per channel, Newsletter first. */
export function results(f: ResultsFacts): Results {
  const n = f.newsletter;
  const delta = (daysAgo: number) => (n.subscribers === null ? null : n.subscribers - (countAt(n.byDay, daysAgo, f.now) ?? 0));
  const newsletter: ChannelRow = {
    channel: "newsletter",
    name: "NEWSLETTER",
    headline: n.subscribers,
    unit: "subscribers",
    delta1: delta(1),
    delta7: delta(7),
    spark: n.byDay.slice(-30).map((p) => p.count),
    latestPost: null,
    extra: {
      signupsToday: n.signupsToday,
      lastLetter: n.lastSend ? day(n.lastSend) : null,
      sends: n.sends,
      cameFrom:
        Object.entries(n.cameFrom)
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .map(([c, k]) => `${CHANNEL_NAMES[c] ?? c.toUpperCase()} ${k}`)
          .join(" · ") || null,
    },
    note: n.subscribers === null ? "Beehiiv unreachable" : "Beehiiv",
  };
  return {
    money: money(f),
    subscribers: n.subscribers,
    delta1: newsletter.delta1,
    delta7: newsletter.delta7,
    rows: [newsletter, ...eventRows(f)],
  };
}
