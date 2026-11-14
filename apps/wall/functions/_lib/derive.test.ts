import { describe, expect, it } from "vitest";
import { briefing, brought, channelOf, countAt, departmentOf, results, subscribersByDay, threats, withJobs, work, type Facts, type ResultsFacts } from "./derive";
import type { Job, Station, WallEvent } from "../../src/model";

const sec = (iso: string) => Math.floor(new Date(iso).getTime() / 1000);
const now = new Date("2026-11-11T20:00:00Z");

describe("subscribersByDay", () => {
  it("accumulates active subscribers per day up to today", () => {
    const subs = [
      { created: sec("2026-11-05T10:00:00Z"), status: "active" },
      { created: sec("2026-11-05T11:00:00Z"), status: "active" },
      { created: sec("2026-11-08T11:00:00Z"), status: "inactive" },
      { created: sec("2026-11-10T11:00:00Z"), status: "active" },
    ];
    const by = subscribersByDay(subs, now);
    expect(by[0]).toEqual({ day: "2026-11-05", count: 2 });
    expect(by.at(-1)).toEqual({ day: "2026-11-11", count: 3 });
    expect(by).toHaveLength(7);
    expect(countAt(by, 7, now)).toBe(0); // 2026-11-04, before the first signup
    expect(countAt(by, 1, now)).toBe(3);
  });
  it("is empty with no subscribers", () => {
    expect(subscribersByDay([], now)).toEqual([]);
    expect(countAt([], 7, now)).toBeNull();
  });
});

describe("attribution", () => {
  it("maps utm sources and referrers to channel ids", () => {
    expect(channelOf({ created: 0, status: "active", utm_source: "direct" })).toBe("site");
    expect(channelOf({ created: 0, status: "active", utm_source: "ig" })).toBe("ig");
    expect(channelOf({ created: 0, status: "active", utm_source: "", referring_site: "https://www.google.com/" })).toBe("search");
    expect(brought([{ created: 0, status: "active", utm_source: "letter" }, { created: 0, status: "active" }])).toEqual({ letter: 1, site: 1 });
  });
});

const base: Facts = {
  now,
  paused: false,
  hasStore: true,
  stations: [],
  queue: [],
  subscribers: 2,
  delta7: 0,
  lastSignup: "2026-11-11T10:00:00Z",
  sends: 0,
  spentMonth: 0,
  ceiling: null,
  errors: [],
};

describe("threats", () => {
  it("ranks a failed station above everything and keeps cyan notes last", () => {
    const t = threats({ ...base, paused: true, stations: [{ id: "reels", name: "Reels", state: "failed", message: "ffmpeg exit 1" }] });
    expect(t.map((x) => x.id)).toEqual(["fail:reels", "paused", "nosend"]);
    expect(t[0].level).toBe("red");
  });
  it("flags a silent signup path and a missing store", () => {
    const t = threats({ ...base, hasStore: false, lastSignup: null });
    expect(t.find((x) => x.id === "nostore")?.level).toBe("amber");
    expect(t.find((x) => x.id === "nosignup")).toBeUndefined(); // no store, nothing to judge
    const t2 = threats({ ...base, lastSignup: "2026-11-01T00:00:00Z" });
    expect(t2.find((x) => x.id === "silent")?.title).toBe("SIGNUP PATH SILENT 10 DAYS");
  });
  it("watches the budget ceiling", () => {
    expect(threats({ ...base, spentMonth: 41, ceiling: 50 })[0].id).toBe("budget80");
    expect(threats({ ...base, spentMonth: 51, ceiling: 50 })[0].id).toBe("budget");
  });
});

describe("briefing", () => {
  it("reports the list, the window and what needs you", () => {
    const t = threats(base);
    const b = briefing(base, t, [{ id: "1", ts: "2026-11-11T12:00:00Z", kind: "signup" }], 24);
    expect(b).toContain("2 on the list, unchanged this week.");
    expect(b).toContain("1 event, 1 signup, 0 failures.");
    expect(b).toContain("Nothing needs you.");
    expect(b).toContain("I would send letter 001");
  });
});

describe("stations with their jobs", () => {
  const job = (over: Partial<Job>): Job => ({
    id: "j1",
    station: "reels-render",
    label: "OnlyAces",
    state: "running",
    percent: 40,
    startedAt: "2026-11-11T19:50:00Z",
    lastBeat: "2026-11-11T19:59:30Z",
    endedAt: null,
    output: null,
    tail: null,
    phase: null,
    log: null,
    ...over,
  });
  const since = new Date("2026-11-11T00:00:00Z");

  it("reads a running job silent for over 2 minutes as lost", () => {
    const [s] = withJobs([], [job({ lastBeat: "2026-11-11T19:57:59Z" })], now, since);
    expect(s.jobs?.[0].state).toBe("lost");
    const [fresh] = withJobs([], [job({ lastBeat: "2026-11-11T19:58:30Z" })], now, since);
    expect(fresh.jobs?.[0].state).toBe("running");
  });

  it("reads a stuck job whose runner stopped beating as lost too", () => {
    const [s] = withJobs([], [job({ state: "stuck", lastBeat: "2026-11-11T19:57:00Z" })], now, since);
    expect(s.jobs?.[0].state).toBe("lost");
  });

  it("groups jobs under their station and creates a station for a new name", () => {
    const stored: Station = { id: "reels-render", name: "Reels render", state: "idle", message: "last run yesterday" };
    const out = withJobs([stored], [job({ id: "a" }), job({ id: "b", label: "OnlyAces-blur" }), job({ id: "c", station: "foley" })], now, since);
    const reels = out.find((s) => s.id === "reels-render");
    expect(reels?.name).toBe("Reels render");
    expect(reels?.jobs?.map((j) => j.id)).toEqual(["a", "b"]);
    expect(out.find((s) => s.id === "foley")?.jobs?.map((j) => j.id)).toEqual(["c"]);
    expect(out).toHaveLength(2);
  });

  it("drops jobs that ended before midnight but keeps one still running from yesterday", () => {
    const out = withJobs(
      [],
      [
        job({ id: "old", state: "done", startedAt: "2026-11-10T22:00:00Z", endedAt: "2026-11-10T23:10:00Z" }),
        job({ id: "today", state: "done", endedAt: "2026-11-11T09:00:00Z" }),
        job({ id: "overnight", startedAt: "2026-11-10T23:30:00Z" }),
      ],
      now,
      since,
    );
    expect(out[0].jobs?.map((j) => j.id)).toEqual(["today", "overnight"]);
  });

  it("drops a job lost before midnight", () => {
    const out = withJobs([], [job({ id: "ghost", startedAt: "2026-11-10T20:00:00Z", lastBeat: "2026-11-10T20:05:00Z" })], now, since);
    expect(out).toEqual([]);
  });

  it("gives the station its worst job's state", () => {
    const [bad] = withJobs([], [job({ id: "a" }), job({ id: "b", label: "OnlyAces-blur", state: "stuck" })], now, since);
    expect(bad.state).toBe("failed");
    expect(bad.message).toBe("OnlyAces-blur: stuck, no output");
    const [busy] = withJobs([], [job({ id: "a" }), job({ id: "b", state: "done" })], now, since);
    expect(busy.state).toBe("ok");
    expect(busy.message).toBe("1 running");
    const stored: Station = { id: "reels-render", name: "Reels render", state: "idle", message: "last run yesterday" };
    const [quiet] = withJobs([stored], [job({ state: "done", endedAt: "2026-11-11T09:00:00Z" })], now, since);
    expect(quiet.state).toBe("idle");
    expect(quiet.message).toBe("last run yesterday");
  });
});

describe("job threats", () => {
  const j = (id: string, state: Job["state"], tail: string | null = null): Job => ({
    id,
    station: "reels-render",
    label: id,
    state,
    percent: null,
    startedAt: "2026-11-11T19:00:00Z",
    lastBeat: "2026-11-11T19:59:00Z",
    endedAt: state === "failed" ? "2026-11-11T19:59:00Z" : null,
    output: null,
    tail,
    phase: null,
    log: `E:/p/logs/jobs/2026-11-11/${id}.log`,
  });
  it("raises one threat per bad job and no duplicate for its station", () => {
    const stations = withJobs([], [j("a", "stuck"), j("b", "failed", "Error: ffmpeg exit 1"), j("c", "running")], now, new Date("2026-11-11T00:00:00Z"));
    const t = threats({ ...base, stations });
    expect(t.filter((x) => x.id.startsWith("job:") || x.id.startsWith("fail:")).map((x) => x.id)).toEqual(["job:a", "job:b"]);
    expect(t.find((x) => x.id === "job:a")?.title).toBe("REELS-RENDER STUCK: A");
    expect(t.find((x) => x.id === "job:b")?.detail).toBe("b: failed (Error: ffmpeg exit 1)");
    expect(t.find((x) => x.id === "job:b")?.level).toBe("red");
  });
  it("points the fix at the run's log, not at a terminal", () => {
    const stations = withJobs([], [j("b", "failed", "Error: ffmpeg exit 1")], now, new Date("2026-11-11T00:00:00Z"));
    const fix = threats({ ...base, stations }).find((x) => x.id === "job:b")?.fix;
    expect(fix).toContain("E:/p/logs/jobs/2026-11-11/b.log");
    expect(fix).not.toMatch(/terminal/i);
  });
});

const quiet: ResultsFacts = {
  now,
  revenueEver: false,
  events: [],
  newsletter: { subscribers: 2, byDay: [{ day: "2026-11-05", count: 1 }, { day: "2026-11-06", count: 2 }], signupsToday: 0, lastSend: null, sends: 0, cameFrom: { site: 2 } },
};

describe("results", () => {
  it("shows money as a dash with its reason until a revenue source exists, and the Newsletter first", () => {
    const r = results(quiet);
    expect(r.money).toEqual({ today: null, month: null, unit: "EUR", note: "no revenue source yet" });
    expect(r.subscribers).toBe(2);
    expect(r.rows.map((x) => x.channel)).toEqual(["newsletter"]);
    expect(r.rows[0]).toMatchObject({ name: "NEWSLETTER", headline: 2, unit: "subscribers", delta1: 0, delta7: 2 });
  });
});

const ev = (kind: string, ts: string, more: Partial<WallEvent> = {}): WallEvent => ({ id: kind + ts, ts, kind, ...more });

describe("results: money", () => {
  it("sums revenue events for today and the last 30 days", () => {
    const events = [
      ev("revenue", "2026-11-11T09:00:00Z", { amount: 10, unit: "EUR", channel: "sponsor" }),
      ev("revenue", "2026-11-10T09:00:00Z", { amount: 5, unit: "EUR", channel: "affiliate" }),
      ev("revenue", "2026-10-01T09:00:00Z", { amount: 100, unit: "EUR" }), // older than 30 days
    ];
    expect(results({ ...quiet, revenueEver: true, events }).money).toEqual({ today: 10, month: 15, unit: "EUR", note: "revenue events" });
  });
  it("shows a real zero, not a dash, once revenue has existed", () => {
    expect(results({ ...quiet, revenueEver: true }).money).toMatchObject({ today: 0, month: 0 });
  });
});

describe("results: channel rows from events", () => {
  const follow = (channel: string, ts: string, amount: number) => ev("followers", ts, { channel, amount });
  it("turns a followers series into a row with deltas and a sparkline, after the Newsletter, biggest first", () => {
    const events = [
      follow("instagram", "2026-11-03T08:00:00Z", 100),
      follow("instagram", "2026-11-04T08:00:00Z", 120),
      follow("instagram", "2026-11-10T08:00:00Z", 150),
      follow("instagram", "2026-11-11T08:00:00Z", 160),
      follow("tiktok", "2026-11-11T08:00:00Z", 50),
    ];
    const r = results({ ...quiet, events });
    expect(r.rows.map((x) => x.channel)).toEqual(["newsletter", "ig", "tt"]);
    expect(r.rows[1]).toMatchObject({
      name: "INSTAGRAM",
      headline: 160,
      unit: "followers",
      delta1: 10,
      delta7: 40,
      spark: [100, 120, 120, 120, 120, 120, 120, 150, 160],
      latestPost: null,
    });
    expect(r.rows[2]).toMatchObject({ name: "TIKTOK", headline: 50, delta1: null, delta7: null, spark: [50] });
  });
});

describe("results: latest post", () => {
  it("picks the newest post event and reads its numbers from meta", () => {
    const events = [
      ev("followers", "2026-11-11T08:00:00Z", { channel: "ig", amount: 160 }),
      ev("post", "2026-11-09T18:00:00Z", { channel: "ig", subject: "reel-002", meta: { views: 400 } }),
      ev("post", "2026-11-10T18:00:00Z", { channel: "ig", subject: "reel-003", meta: { views: 900, likes: 40, url: "https://instagram.com/p/x" } }),
      ev("post", "2026-11-10T19:00:00Z", { channel: "yt", subject: "short-1", meta: { views: 12 } }),
    ];
    const r = results({ ...quiet, events });
    expect(r.rows.find((x) => x.channel === "ig")?.latestPost).toEqual({
      subject: "reel-003",
      ts: "2026-11-10T18:00:00Z",
      url: "https://instagram.com/p/x",
      views: 900,
      likes: 40,
      saves: null,
      comments: null,
    });
    expect(r.rows.find((x) => x.channel === "yt")).toMatchObject({ headline: null, note: "no followers events yet", latestPost: { subject: "short-1", views: 12 } });
  });
});

describe("results: the Newsletter row", () => {
  it("carries the subscriber sparkline, signups today, the last letter and where subscribers came from", () => {
    const r = results({
      ...quiet,
      newsletter: { subscribers: 3, byDay: [{ day: "2026-11-09", count: 1 }, { day: "2026-11-10", count: 1 }, { day: "2026-11-11", count: 3 }], signupsToday: 2, lastSend: "2026-11-08T07:00:00Z", sends: 1, cameFrom: { site: 1, ig: 2 } },
    });
    expect(r.rows[0]).toMatchObject({
      spark: [1, 1, 3],
      extra: { signupsToday: 2, lastLetter: "2026-11-08", sends: 1, cameFrom: "INSTAGRAM 2 · SITE 1" },
    });
  });
  it("says why when Beehiiv is unreachable", () => {
    const r = results({ ...quiet, newsletter: { ...quiet.newsletter, subscribers: null, byDay: [] } });
    expect(r.rows[0]).toMatchObject({ headline: null, delta1: null, spark: [], note: "Beehiiv unreachable" });
    expect(r.subscribers).toBeNull();
  });
});

describe("departments", () => {
  const st = (id: string, over: Partial<Station> = {}): Station => ({ id, name: id, state: "idle", ...over });
  it("puts reels, foley, voice and teardown under content and everything else under development", () => {
    expect(["reels-render", "reels", "foley", "voice", "teardown"].map((id) => departmentOf(st(id)))).toEqual(["content", "content", "content", "content", "content"]);
    expect(["site", "ffmpeg", "deploy", "vo-comfy"].map((id) => departmentOf(st(id)))).toEqual(["development", "development", "development", "development"]);
  });
  it("lets a station's own department win", () => {
    expect(departmentOf(st("ffmpeg", { department: "content" }))).toBe("content");
    expect(departmentOf(st("foley", { department: "development" }))).toBe("development");
  });
  it("leaves signup and letter out of Work (they feed the Newsletter row)", () => {
    expect(departmentOf(st("signup"))).toBeNull();
    expect(departmentOf(st("letter"))).toBeNull();
  });
});

describe("work lines", () => {
  const job = (over: Partial<Job>): Job => ({
    id: "j1",
    station: "reels-render",
    label: "OnlyAces",
    state: "running",
    percent: 40,
    startedAt: "2026-11-11T19:50:00Z",
    lastBeat: "2026-11-11T19:59:30Z",
    endedAt: null,
    output: null,
    tail: null,
    phase: null,
    log: null,
    ...over,
  });
  const site: Station = { id: "site", name: "Site", state: "ok", message: "200 in 400 ms", lastRun: "2026-11-11T19:59:00Z" };
  const signup: Station = { id: "signup", name: "Signup", state: "nodata" };

  it("always has CONTENT then DEVELOPMENT, quiet ones reading OK and closed", () => {
    const w = work([site, signup]);
    expect(w.map((l) => [l.id, l.name, l.word, l.open])).toEqual([
      ["content", "CONTENT", "OK", false],
      ["development", "DEVELOPMENT", "OK", false],
    ]);
    expect(w[1].stations.map((s) => s.id)).toEqual(["site"]);
    expect(w[1].latest).toBe("Site: 200 in 400 ms");
    expect(w[0].latest).toBeNull();
  });

  it("counts running jobs and names the newest", () => {
    const reels: Station = { id: "reels-render", name: "reels-render", state: "ok", message: "2 running", jobs: [job({ id: "a" }), job({ id: "b", label: "OnlyAces-blur", percent: null, lastBeat: "2026-11-11T19:59:50Z" })] };
    const [content] = work([reels, site]);
    expect(content).toMatchObject({ word: "RUNNING 2", state: "ok", open: false, latest: "OnlyAces-blur: running" });
  });

  it("opens a line by itself on a failed, stuck or lost job, and says which", () => {
    const failed: Station = { id: "foley", name: "foley", state: "failed", jobs: [job({ station: "foley", label: "r2", state: "failed", tail: "CUDA out of memory", endedAt: "2026-11-11T19:58:00Z" })] };
    expect(work([failed])[0]).toMatchObject({ word: "FAILED", state: "failed", open: true, latest: "r2: failed (CUDA out of memory)" });
    const stuck: Station = { id: "teardown", name: "teardown", state: "failed", jobs: [job({ station: "teardown", label: "zack.mp4", state: "stuck" })] };
    expect(work([stuck])[0]).toMatchObject({ word: "STUCK", open: true, latest: "zack.mp4: stuck, no output" });
    const lost: Station = { id: "voice", name: "voice", state: "failed", jobs: [job({ station: "voice", label: "take 3", state: "lost" })] };
    expect(work([lost])[0]).toMatchObject({ word: "LOST", open: true });
  });

  it("shows a site probe failure under development", () => {
    const down: Station = { ...site, state: "failed", message: "unreachable" };
    expect(work([down])[1]).toMatchObject({ word: "FAILED", state: "failed", open: true, latest: "Site: unreachable" });
  });

  it("takes a station's department from its job's --dept when the station has none", () => {
    const out = withJobs([], [job({ station: "ffmpeg", label: "b.mp3", department: "content" })], now, new Date("2026-11-11T00:00:00Z"));
    expect(work(out)[0].stations.map((s) => s.id)).toEqual(["ffmpeg"]);
  });
});
