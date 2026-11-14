import { describe, expect, it } from "vitest";
import { briefing, type BriefingFacts } from "./briefing";
import type { Threat } from "../../src/model";

const quiet: BriefingFacts = {
  paused: false,
  money: { today: null, month: null, unit: "EUR", note: "no revenue source yet" },
  subscribers: 2,
  delta1: 0,
  cameFrom: null,
  threats: [],
  waiting: 0,
  work: [
    { name: "CONTENT", state: "ok", word: "OK", latest: "only-aces: done in 19 s", open: false },
    { name: "DEVELOPMENT", state: "ok", word: "OK", latest: "site 200 in 408 ms", open: false },
  ],
};

describe("briefing, results first", () => {
  it("on a quiet day reads money and subscribers, then what needs you, then work", () => {
    expect(briefing(quiet)).toBe(
      "No revenue source yet. 2 on the list, unchanged since yesterday. Nothing needs you. Work: CONTENT OK, only-aces: done in 19 s; DEVELOPMENT OK, site 200 in 408 ms.",
    );
  });
});

describe("briefing: results", () => {
  it("names revenue and new subscribers with where they came from", () => {
    const b = briefing({ ...quiet, money: { today: 10, month: 15, unit: "EUR", note: "revenue events" }, subscribers: 5, delta1: 3, cameFrom: "INSTAGRAM 3 · SITE 2" });
    expect(b.startsWith("EUR 10 today, EUR 15 in 30 days. 5 on the list, +3 since yesterday (INSTAGRAM 3 · SITE 2).")).toBe(true);
  });
  it("says when the list shrank", () => {
    expect(briefing({ ...quiet, delta1: -1 })).toContain("2 on the list, -1 since yesterday.");
  });
});

const threat = (level: Threat["level"], title: string, fix: string): Threat => ({ id: title, level, weight: 50, title, detail: "", fix });

describe("briefing: needs you", () => {
  it("lists what waits on you and the first thing to do, after the results", () => {
    const b = briefing({
      ...quiet,
      threats: [threat("amber", "NO LETTER SENT YET", "Send letter 001 once the footer address is set."), threat("cyan", "SUBSCRIBERS FLAT 7 DAYS", "Look at the channels.")],
      waiting: 2,
    });
    expect(b).toContain("2 on the list, unchanged since yesterday. Needs you: no letter sent yet; 2 approvals waiting. I would send letter 001 once the footer address is set. Work:");
  });
  it("counts a single approval in the singular, with no advice when no threat waits", () => {
    expect(briefing({ ...quiet, waiting: 1 })).toContain("Needs you: 1 approval waiting. Work:");
  });
});

describe("briefing: what is broken comes first", () => {
  it("puts a paused wall and red threats above the results, and keeps them out of needs you", () => {
    const b = briefing({
      ...quiet,
      paused: true,
      threats: [threat("red", "ONLY-ACES: FAILED", "Read the log at E:/p/logs/jobs/x.log."), threat("amber", "NO LETTER SENT YET", "Send letter 001.")],
    });
    expect(b.startsWith("First: outbound is paused; only-aces: failed. No revenue source yet.")).toBe(true);
    expect(b).toContain("Needs you: no letter sent yet. I would read the log at E:/p/logs/jobs/x.log.");
  });
});
