import { describe, expect, it } from "vitest";
import { briefing, brought, channelOf, countAt, subscribersByDay, threats, type Facts } from "./derive";

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
