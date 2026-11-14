import { describe, expect, it } from "vitest";
import { normaliseJob, normaliseStation } from "./store";

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
      phase: null,
      log: null,
      department: null,
    });
  });
  it("keeps the phase word and the log path", () => {
    expect(normaliseJob({ id: "j1", station: "s", state: "running", percent: 55, phase: "Encoded", log: "E:/p/logs/jobs/2026-11-11/j1.log" }, now)).toMatchObject({
      phase: "Encoded",
      log: "E:/p/logs/jobs/2026-11-11/j1.log",
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

describe("departments on reports", () => {
  it("keeps a job's --dept and refuses anything but content or development", () => {
    expect(normaliseJob({ id: "j1", station: "ffmpeg", state: "running", department: "Content" }, now)).toMatchObject({ department: "content" });
    expect(normaliseJob({ id: "j1", station: "ffmpeg", state: "running" }, now)).toMatchObject({ department: null });
    expect(normaliseJob({ id: "j1", station: "ffmpeg", state: "running", department: "marketing" }, now)).toBe("department must be content | development");
  });
  it("keeps a station's department and refuses junk", () => {
    expect(normaliseStation({ id: "Deploy", state: "ok", department: "development" })).toMatchObject({ id: "deploy", name: "Deploy", state: "ok", department: "development" });
    expect(normaliseStation({ id: "deploy" })).toMatchObject({ state: "idle", department: null });
    expect(normaliseStation({ id: "deploy", department: "sales" })).toBe("department must be content | development");
    expect(normaliseStation({ id: "deploy", state: "busy" })).toBe("state must be ok | idle | waiting | failed | paused | nodata");
    expect(normaliseStation({ name: "x" })).toBe("id is required");
  });
});
