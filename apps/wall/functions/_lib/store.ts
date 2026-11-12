/**
 * The one data layer under the wall. Reads the D1 store (events, stations, queue, flags,
 * snapshots), pulls the two live sources the store cannot hold yet (Beehiiv for the letter and
 * subscribers, a probe of llamapoker.com), and assembles one WallState (src/model.ts) through
 * the pure derivations in derive.ts. Every read of today's state is also stored as today's
 * snapshot, so time control can scrub back to any day the wall was opened.
 *
 * Bindings and variables on the Pages project (wrangler.toml for local dev):
 *   DB                       D1 database "wall" (migrations/). Without it the wall still shows
 *                            what Beehiiv and the probe know, and says the store is missing.
 *   BEEHIIV_API_KEY          secret, the same key apps/web's subscribe function uses
 *   BEEHIIV_PUBLICATION_ID   "pub_…"
 */
import type { Channel, Job, Link, QueueItem, Station, WallEvent, WallState } from "../../src/model";
import { day } from "../../src/model";
import { briefing, brought, channels, countAt, jobLine, subscribersByDay, threats, todayLine, withJobs, type Facts, type Subscriber } from "./derive";

export interface Env {
  DB?: D1Database;
  BEEHIIV_API_KEY?: string;
  BEEHIIV_PUBLICATION_ID?: string;
  WALL_PASSWORD?: string;
  WALL_SECRET?: string;
  WALL_INGEST_KEY?: string;
}

const SITE = "https://llamapoker.com/";
const PIPELINE = ["research", "drafts", "approval", "scheduled", "published"];
const OUTBOUND = new Set(["letter", "scheduled", "published"]);

// ---------- live sources ----------

interface Beehiiv {
  subscribers: number;
  subs: Subscriber[];
  sends: number;
  lastSend: string | null;
  openRate: number;
}

async function beehiiv(env: Env): Promise<Beehiiv> {
  if (!env.BEEHIIV_API_KEY || !env.BEEHIIV_PUBLICATION_ID) throw new Error("Beehiiv keys are not set on the wall");
  const base = `https://api.beehiiv.com/v2/publications/${env.BEEHIIV_PUBLICATION_ID}`;
  const headers = { Authorization: `Bearer ${env.BEEHIIV_API_KEY}` };
  const get = async (path: string) => {
    const res = await fetch(base + path, { headers, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`Beehiiv answered ${res.status} on ${path.split("?")[0]}`);
    return res.json() as Promise<Record<string, unknown>>;
  };
  const pub = (await get("?expand[]=stats")) as { data: { stats: { active_subscriptions: number; total_sent: number; average_open_rate: number } } };
  const subs: Subscriber[] = [];
  for (let page = 1; page <= 50; page++) {
    const r = (await get(`/subscriptions?limit=100&page=${page}`)) as { data: Subscriber[]; total_pages: number };
    subs.push(...r.data);
    if (page >= (r.total_pages ?? 1)) break;
  }
  const posts = (await get("/posts?status=confirmed&limit=1")) as { total_results: number; data: { publish_date?: number }[] };
  const last = posts.data[0]?.publish_date;
  return {
    subscribers: pub.data.stats.active_subscriptions,
    subs,
    sends: posts.total_results ?? 0,
    lastSend: last ? new Date(last * 1000).toISOString() : null,
    openRate: pub.data.stats.average_open_rate ?? 0,
  };
}

async function probeSite(): Promise<{ ok: boolean; status: number; ms: number }> {
  const t = Date.now();
  try {
    const res = await fetch(SITE, { method: "HEAD", signal: AbortSignal.timeout(6000), cf: { cacheTtl: 0 } } as RequestInit);
    return { ok: res.ok, status: res.status, ms: Date.now() - t };
  } catch {
    return { ok: false, status: 0, ms: Date.now() - t };
  }
}

// ---------- the store ----------

interface StationRow {
  id: string;
  name: string;
  state: Station["state"];
  message: string | null;
  last_run: string | null;
  next_run: string | null;
  updated: string;
}

interface Reads {
  feed: WallEvent[];
  rows: StationRow[];
  queue: QueueItem[];
  flags: Record<string, string>;
  spentMonth: number;
  lastSignup: string | null;
  views: Record<string, number>;
  perStation: Record<string, number>;
  fails: Record<string, WallEvent>;
}

const parseEvent = (r: Record<string, unknown>): WallEvent => ({
  ...(r as unknown as WallEvent),
  meta: typeof r.meta === "string" && r.meta ? (JSON.parse(r.meta) as Record<string, unknown>) : null,
});

async function readStore(db: D1Database, now: Date): Promise<Reads> {
  const week = new Date(now.getTime() - 7 * 86400000).toISOString();
  const dayAgo = new Date(now.getTime() - 86400000).toISOString();
  const month = now.toISOString().slice(0, 7) + "-01T00:00:00Z";
  const [feed, rows, queue, flags, spent, last, views, per, fails] = await db.batch([
    db.prepare("SELECT * FROM events ORDER BY ts DESC LIMIT 80"),
    db.prepare("SELECT * FROM stations"),
    db.prepare("SELECT * FROM queue WHERE status = 'waiting' ORDER BY ts"),
    db.prepare("SELECT key, value FROM flags"),
    db.prepare("SELECT COALESCE(SUM(cost), 0) AS c FROM events WHERE ts >= ?").bind(month),
    db.prepare("SELECT MAX(ts) AS t FROM events WHERE kind = 'signup'"),
    db.prepare("SELECT channel, SUM(amount) AS n FROM events WHERE kind = 'view' AND ts >= ? GROUP BY channel").bind(week),
    db.prepare("SELECT station, COUNT(*) AS n FROM events WHERE ts >= ? AND station IS NOT NULL GROUP BY station").bind(week),
    db.prepare("SELECT * FROM events WHERE kind = 'fail' AND ts >= ? ORDER BY ts DESC").bind(dayAgo),
  ]);
  const fl: Record<string, string> = {};
  for (const r of flags.results as { key: string; value: string }[]) fl[r.key] = r.value;
  const vw: Record<string, number> = {};
  for (const r of views.results as { channel: string | null; n: number }[]) if (r.channel) vw[r.channel] = r.n;
  const ps: Record<string, number> = {};
  for (const r of per.results as { station: string; n: number }[]) ps[r.station] = r.n;
  const fs: Record<string, WallEvent> = {};
  for (const r of fails.results as Record<string, unknown>[]) {
    const e = parseEvent(r);
    if (e.station && !fs[e.station]) fs[e.station] = e;
  }
  return {
    feed: (feed.results as Record<string, unknown>[]).map(parseEvent),
    rows: rows.results as unknown as StationRow[],
    queue: queue.results as unknown as QueueItem[],
    flags: fl,
    spentMonth: (spent.results[0] as { c: number }).c,
    lastSignup: (last.results[0] as { t: string | null }).t,
    views: vw,
    perStation: ps,
    fails: fs,
  };
}

const empty: Reads = { feed: [], rows: [], queue: [], flags: {}, spentMonth: 0, lastSignup: null, views: {}, perStation: {}, fails: {} };

// ---------- assembly ----------

function stations(r: Reads, bh: Beehiiv | null, probe: { ok: boolean; status: number; ms: number }, paused: boolean): { stations: Station[]; links: Link[] } {
  const by = new Map<string, Station>();
  const siteViews = r.views.site;
  by.set("site", {
    id: "site",
    name: "Site",
    state: probe.ok ? "ok" : "failed",
    message: probe.ok ? `${probe.status} in ${probe.ms} ms` : probe.status ? `answered ${probe.status}` : "unreachable",
    lastRun: new Date().toISOString(),
    count: siteViews ?? null,
    countLabel: siteViews === undefined ? "no view events" : "views 7d",
    evidence: probe,
  });
  const fail = r.fails.signup;
  by.set("signup", {
    id: "signup",
    name: "Signup",
    state: fail ? "failed" : r.lastSignup ? "ok" : "nodata",
    message: fail ? fail.text ?? "a signup failed" : r.lastSignup ? "last signup " + r.lastSignup.slice(0, 16).replace("T", " ") : "no signup event in the store",
    lastRun: r.lastSignup,
    count: r.perStation.signup ?? null,
    countLabel: "signups 7d",
    evidence: fail ?? null,
  });
  by.set("letter", {
    id: "letter",
    name: "Letter",
    state: bh ? (paused ? "paused" : "ok") : "failed",
    message: bh ? `${bh.sends} sent, ${bh.subscribers} on the list` : "Beehiiv unreachable",
    lastRun: bh?.lastSend ?? null,
    count: bh?.subscribers ?? null,
    countLabel: "subscribers",
  });
  for (const row of r.rows) {
    const prev = by.get(row.id);
    const f = r.fails[row.id];
    const state: Station["state"] = f && new Date(f.ts) > new Date(row.updated) ? "failed" : row.state;
    by.set(row.id, {
      id: row.id,
      name: row.name,
      state: paused && OUTBOUND.has(row.id) && state === "ok" ? "paused" : state,
      message: f && state === "failed" ? f.text ?? row.message : row.message,
      lastRun: row.last_run ?? prev?.lastRun ?? null,
      nextRun: row.next_run,
      count: r.perStation[row.id] ?? prev?.count ?? null,
      countLabel: prev?.countLabel ?? "events 7d",
      evidence: { row, lastFailure: f ?? null },
    });
  }
  const order = ["site", "signup", "letter", ...PIPELINE];
  const list = [...by.values()].sort((a, b) => {
    const ia = order.indexOf(a.id);
    const ib = order.indexOf(b.id);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.id.localeCompare(b.id);
  });
  const links: Link[] = [
    { from: "site", to: "signup", label: r.perStation.signup ? `${r.perStation.signup} / 7d` : undefined, stalled: !r.lastSignup },
    { from: "signup", to: "letter", label: bh ? `${bh.subscribers}` : undefined },
  ];
  const present = PIPELINE.filter((id) => by.has(id));
  for (let i = 1; i < present.length; i++) links.push({ from: present[i - 1], to: present[i] });
  if (by.has("approval")) for (const s of list) if (!order.includes(s.id)) links.push({ from: s.id, to: "approval" });
  if (by.has("published") && by.has("letter")) links.push({ from: "published", to: "letter" });
  return { stations: list, links };
}

export async function readState(env: Env, requested?: string | null): Promise<WallState | null> {
  const now = new Date();
  const today = day(now);
  if (requested && requested !== today) {
    if (!env.DB) return null;
    const row = await env.DB.prepare("SELECT json FROM snapshots WHERE day = ?").bind(requested).first<{ json: string }>();
    return row ? { ...(JSON.parse(row.json) as WallState), live: false } : null;
  }
  const errors: string[] = [];
  const [bhr, probe, reads] = await Promise.all([
    beehiiv(env).catch((e: Error) => {
      errors.push(e.message);
      return null;
    }),
    probeSite(),
    env.DB
      ? readStore(env.DB, now).catch((e: Error) => {
          errors.push("Store read failed: " + e.message);
          return empty;
        })
      : Promise.resolve(empty),
  ]);
  const paused = reads.flags.paused === "1";
  const { stations: built, links } = stations(reads, bhr, probe, paused);
  // Jobs clear at midnight UTC (the Workers runtime has no local time zone).
  const since = new Date(today + "T00:00:00Z");
  const jobs = env.DB
    ? await readJobs(env.DB, now, since).catch((e: Error) => {
        errors.push("Jobs read failed: " + e.message);
        return [];
      })
    : [];
  const st = withJobs(built, jobs, now, since);
  const byDay = bhr ? subscribersByDay(bhr.subs, now) : [];
  const subscribers = bhr?.subscribers ?? null;
  const delta7 = subscribers === null ? null : subscribers - (countAt(byDay, 7, now) ?? 0);
  const delta1 = subscribers === null ? null : subscribers - (countAt(byDay, 1, now) ?? 0);
  const ceiling = reads.flags.budget_ceiling ? Number(reads.flags.budget_ceiling) : null;
  const facts: Facts = {
    now,
    paused,
    hasStore: !!env.DB,
    stations: st,
    queue: reads.queue,
    subscribers,
    delta7,
    lastSignup: reads.lastSignup,
    sends: bhr?.sends ?? 0,
    spentMonth: reads.spentMonth,
    ceiling,
    errors,
  };
  const t = threats(facts);
  const lastOpen = reads.flags.last_open ? new Date(reads.flags.last_open) : null;
  const sinceHours = lastOpen ? Math.max(1, (now.getTime() - lastOpen.getTime()) / 3600000) : 24;
  const line = todayLine(facts, reads.feed);
  const ch: Channel[] = channels(bhr ? brought(bhr.subs) : {}, reads.views, bhr?.sends ?? 0);
  const reachValues = Object.values(reads.views);
  const state: WallState = {
    asof: now.toISOString(),
    day: today,
    live: true,
    paused,
    north: {
      subscribers,
      delta1,
      delta7,
      byDay,
      weeklyActiveShare: bhr && bhr.sends > 0 ? bhr.openRate : null,
      reach: reachValues.length ? reachValues.reduce((a, b) => a + b, 0) : null,
      today: line.today,
      action: line.action,
    },
    stations: st,
    links,
    threats: t,
    feed: reads.feed,
    queue: reads.queue,
    channels: ch,
    budget: { spentMonth: reads.spentMonth, ceiling, month: today.slice(0, 7) },
    experiments: reads.flags.experiments ? (JSON.parse(reads.flags.experiments) as WallState["experiments"]) : [],
    briefing: briefing(facts, t, reads.feed, sinceHours),
    errors,
  };
  if (env.DB) {
    await env.DB.batch([
      env.DB.prepare("INSERT INTO snapshots (day, ts, json) VALUES (?1, ?2, ?3) ON CONFLICT(day) DO UPDATE SET ts = ?2, json = ?3").bind(today, state.asof, JSON.stringify(state)),
      env.DB.prepare("INSERT INTO flags (key, value, ts) VALUES ('last_open', ?1, ?1) ON CONFLICT(key) DO UPDATE SET value = ?1, ts = ?1").bind(state.asof),
    ]).catch(() => undefined);
  }
  return state;
}

export async function snapshotDays(env: Env): Promise<string[]> {
  if (!env.DB) return [];
  const r = await env.DB.prepare("SELECT day FROM snapshots ORDER BY day").all<{ day: string }>();
  return r.results.map((x) => x.day);
}

// ---------- writes ----------

const str = (v: unknown, max = 500) => (v === undefined || v === null ? null : String(v).slice(0, max));
const num = (v: unknown) => (v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v));

export function normaliseEvent(input: Record<string, unknown>): WallEvent | string {
  const kind = str(input.kind, 40)?.toLowerCase();
  if (!kind) return "kind is required";
  const ts = input.ts ? new Date(String(input.ts)) : new Date();
  if (Number.isNaN(ts.getTime())) return "ts is not a date";
  return {
    id: str(input.id, 80) ?? crypto.randomUUID(),
    ts: ts.toISOString(),
    kind,
    station: str(input.station, 40),
    subject: str(input.subject, 200),
    amount: num(input.amount),
    unit: str(input.unit, 20),
    cost: num(input.cost) ?? 0,
    channel: str(input.channel, 40),
    text: str(input.text, 300),
    meta: input.meta && typeof input.meta === "object" ? (input.meta as Record<string, unknown>) : null,
  };
}

/** A wrapper's job report (scripts/job.mjs). `lost` is never reported: the wall reads it from the heartbeat. */
export function normaliseJob(input: Record<string, unknown>, now = new Date()): Job | string {
  const id = str(input.id, 80);
  if (!id) return "id is required";
  const station = str(input.station, 40)?.toLowerCase();
  if (!station) return "station is required";
  const state = str(input.state, 20) ?? "running";
  if (!["running", "done", "failed", "stuck"].includes(state)) return "state must be running | done | failed | stuck";
  const percent = num(input.percent);
  if (percent !== null && (percent < 0 || percent > 100)) return "percent must be 0-100";
  const date = (v: unknown) => {
    const d = v ? new Date(String(v)) : null;
    return d && !Number.isNaN(d.getTime()) ? d.toISOString() : null;
  };
  const ended = state === "done" || state === "failed";
  return {
    id,
    station,
    label: str(input.label, 120) ?? id,
    state: state as Job["state"],
    percent,
    startedAt: date(input.startedAt) ?? now.toISOString(),
    lastBeat: now.toISOString(),
    endedAt: ended ? (date(input.endedAt) ?? now.toISOString()) : null,
    output: str(input.output, 300),
    tail: str(input.tail, 2000),
    phase: str(input.phase, 40),
    log: str(input.log, 400),
  };
}

export async function upsertJob(db: D1Database, j: Job): Promise<void> {
  await db.batch([
    db
      .prepare("INSERT OR IGNORE INTO stations (id, name, state, updated) VALUES (?1, ?1, 'idle', ?2)")
      .bind(j.station, j.lastBeat),
    db
      .prepare(
        "INSERT INTO jobs (id, station, label, state, percent, started_at, last_beat, ended_at, output, tail, phase, log) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12) " +
          "ON CONFLICT(id) DO UPDATE SET station = ?2, label = ?3, state = ?4, percent = COALESCE(?5, percent), last_beat = ?7, ended_at = ?8, output = COALESCE(?9, output), tail = COALESCE(?10, tail), phase = COALESCE(?11, phase), log = COALESCE(?12, log)",
      )
      .bind(j.id, j.station, j.label, j.state, j.percent, j.startedAt, j.lastBeat, j.endedAt, j.output, j.tail, j.phase, j.log),
  ]);
}

/** Today's jobs: prunes older rows, marks newly lost ones and logs job.lost once for each. */
async function readJobs(db: D1Database, now: Date, since: Date): Promise<Job[]> {
  await db.prepare("DELETE FROM jobs WHERE COALESCE(ended_at, last_beat) < ?").bind(since.toISOString()).run();
  const r = await db.prepare("SELECT * FROM jobs ORDER BY started_at").all<Record<string, unknown>>();
  const jobs: Job[] = r.results.map((x) => ({
    id: String(x.id),
    station: String(x.station),
    label: String(x.label),
    state: x.state as Job["state"],
    percent: (x.percent as number | null) ?? null,
    startedAt: String(x.started_at),
    lastBeat: String(x.last_beat),
    endedAt: (x.ended_at as string | null) ?? null,
    output: (x.output as string | null) ?? null,
    tail: (x.tail as string | null) ?? null,
    phase: (x.phase as string | null) ?? null,
    log: (x.log as string | null) ?? null,
  }));
  const newlyLost = withJobs([], jobs, now, since)
    .flatMap((s) => s.jobs ?? [])
    .filter((j) => j.state === "lost" && jobs.find((x) => x.id === j.id)?.state === "running");
  if (newlyLost.length) {
    // The mark and its event land together, so job.lost is logged exactly once.
    const ev = db.prepare("INSERT OR IGNORE INTO events (id, ts, kind, station, subject, cost, text) VALUES (?, ?, 'job.lost', ?, ?, 0, ?)");
    await db.batch(
      newlyLost.flatMap((j) => [
        db.prepare("UPDATE jobs SET state = 'lost' WHERE id = ? AND state = 'running'").bind(j.id),
        ev.bind("lost:" + j.id, now.toISOString(), j.station, j.label, jobLine(j)),
      ]),
    );
  }
  return jobs;
}

export async function insertEvents(db: D1Database, events: WallEvent[]): Promise<void> {
  if (!events.length) return;
  const stmt = db.prepare(
    "INSERT OR IGNORE INTO events (id, ts, kind, station, subject, amount, unit, cost, channel, text, meta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  );
  await db.batch(events.map((e) => stmt.bind(e.id, e.ts, e.kind, e.station, e.subject, e.amount, e.unit, e.cost, e.channel, e.text, e.meta ? JSON.stringify(e.meta) : null)));
}

export async function upsertStation(db: D1Database, input: Record<string, unknown>): Promise<string | null> {
  const id = str(input.id, 40)?.toLowerCase();
  const name = str(input.name, 40) ?? id;
  const state = str(input.state, 20) ?? "idle";
  if (!id) return "id is required";
  if (!["ok", "idle", "waiting", "failed", "paused", "nodata"].includes(state)) return "state must be ok | idle | waiting | failed | paused | nodata";
  await db
    .prepare(
      "INSERT INTO stations (id, name, state, message, last_run, next_run, updated) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7) ON CONFLICT(id) DO UPDATE SET name = ?2, state = ?3, message = ?4, last_run = COALESCE(?5, last_run), next_run = ?6, updated = ?7",
    )
    .bind(id, name, state, str(input.message, 300), str(input.lastRun, 40), str(input.nextRun, 40), new Date().toISOString())
    .run();
  return null;
}

export async function addQueueItem(db: D1Database, input: Record<string, unknown>): Promise<string | null> {
  const title = str(input.title, 200);
  if (!title) return "title is required";
  await db
    .prepare("INSERT INTO queue (id, ts, kind, title, preview, status) VALUES (?, ?, ?, ?, ?, 'waiting')")
    .bind(str(input.id, 80) ?? crypto.randomUUID(), new Date().toISOString(), str(input.kind, 40) ?? "piece", title, str(input.preview, 20000))
    .run();
  return null;
}

export async function decideQueueItem(db: D1Database, id: string, action: string, note: string | null): Promise<string | null> {
  const status = { call: "called", fold: "folded", raise: "raised" }[action];
  if (!status) return "action must be call | fold | raise";
  const now = new Date().toISOString();
  const r = await db.prepare("UPDATE queue SET status = ?, note = ?, decided = ? WHERE id = ? AND status = 'waiting'").bind(status, note, now, id).run();
  if (!r.meta.changes) return "no waiting item with that id";
  const item = await db.prepare("SELECT title FROM queue WHERE id = ?").bind(id).first<{ title: string }>();
  await insertEvents(db, [
    normaliseEvent({ kind: "decision", station: "approval", subject: id, text: `${item?.title ?? id}: ${status}${note ? " (" + note + ")" : ""}` }) as WallEvent,
  ]);
  return null;
}

export async function setFlag(db: D1Database, key: string, value: string): Promise<void> {
  const now = new Date().toISOString();
  await db.prepare("INSERT INTO flags (key, value, ts) VALUES (?1, ?2, ?3) ON CONFLICT(key) DO UPDATE SET value = ?2, ts = ?3").bind(key, value, now).run();
  if (key === "paused")
    await insertEvents(db, [normaliseEvent({ kind: "note", station: "wall", text: value === "1" ? "Kill switch on: outbound paused" : "Kill switch off: outbound resumed" }) as WallEvent]);
}
