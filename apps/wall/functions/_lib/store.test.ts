import { describe, expect, it } from "vitest";
import { normaliseJob } from "./store";

const now = new Date("2026-11-11T20:00:00Z");

describe("normaliseJob", () => {
  it("accepts a wrapper's report and stamps the heartbeat", () => {
    const j = normaliseJob({ id: "j1", station: "Reels-Render", label: "OnlyAces", state: "running", percent: 40, startedAt: "2026-11-11T19:50:00Z" }, now);
    expect(j).toEqual({
      id: "j1",
      station: "reels-render",
      label: "OnlyAces",
      state: "running",
      percent: 40,
      startedAt: "2026-11-11T19:50:00.000Z",
      lastBeat: "2026-11-11T20:00:00.000Z",
      endedAt: null,
      output: null,
      tail: null,
    });
  });
  it("rejects junk with a plain error", () => {
    expect(normaliseJob({ station: "reels-render", label: "x", state: "running" }, now)).toBe("id is required");
    expect(normaliseJob({ id: "j1", label: "x", state: "running" }, now)).toBe("station is required");
    expect(normaliseJob({ id: "j1", station: "s", label: "x", state: "lost" }, now)).toBe("state must be running | done | failed | stuck");
    expect(normaliseJob({ id: "j1", station: "s", label: "x", state: "running", percent: 250 }, now)).toBe("percent must be 0-100");
  });
  it("defaults the label to the id", () => {
    expect(normaliseJob({ id: "j1", station: "s", state: "done" }, now)).toMatchObject({ label: "j1", endedAt: "2026-11-11T20:00:00.000Z" });
  });
});
