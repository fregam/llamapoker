import { describe, expect, it } from "vitest";
import { briefing, brought, channelOf, countAt, subscribersByDay, threats, withJobs, type Facts } from "./derive";
import type { Job, Station } from "../../src/model";

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
    ...over,
  });
  const since = new Date("2026-11-11T00:00:00Z");

  it("reads a running job silent for over 2 minutes as lost", () => {
    const [s] = withJobs([], [job({ lastBeat: "2026-11-11T19:57:59Z" })], now, since);
    expect(s.jobs?.[0].state).toBe("lost");
    const [fresh] = withJobs([], [job({ lastBeat: "2026-11-11T19:58:30Z" })], now, since);
    expect(fresh.jobs?.[0].state).toBe("running");
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
  });
  it("raises one threat per bad job and no duplicate for its station", () => {
    const stations = withJobs([], [j("a", "stuck"), j("b", "failed", "Error: ffmpeg exit 1"), j("c", "running")], now, new Date("2026-11-11T00:00:00Z"));
    const t = threats({ ...base, stations });
    expect(t.filter((x) => x.id.startsWith("job:") || x.id.startsWith("fail:")).map((x) => x.id)).toEqual(["job:a", "job:b"]);
    expect(t.find((x) => x.id === "job:a")?.title).toBe("REELS-RENDER STUCK: A");
    expect(t.find((x) => x.id === "job:b")?.detail).toBe("b: failed (Error: ffmpeg exit 1)");
    expect(t.find((x) => x.id === "job:b")?.level).toBe("red");
  });
});
