import { describe, expect, it } from "vitest";
import type { Job } from "../model";
import { trace } from "./jobs";

const now = new Date("2026-11-12T10:00:00Z");
const job = (over: Partial<Job>): Job => ({
  id: "j1",
  station: "reels-render",
  label: "OnlyAces",
  state: "running",
  percent: 64,
  startedAt: "2026-11-12T09:57:50Z",
  lastBeat: "2026-11-12T09:59:55Z",
  endedAt: null,
  output: "out/only-aces.mp4",
  tail: null,
  phase: "Rendered",
  log: "E:/p/logs/jobs/2026-11-12/j1.log",
  ...over,
});

describe("trace", () => {
  it("shows a running job's phase, percent and elapsed time", () => {
    expect(trace(job({}), now)).toEqual({ name: "OnlyAces", phase: "Rendered", percent: 64, elapsed: "2m 10s", word: "RUNNING", tone: "run", note: null });
  });

  it("freezes a finished job's time and shows its output", () => {
    expect(trace(job({ state: "done", percent: 100, endedAt: "2026-11-12T09:59:02Z" }), now)).toMatchObject({ elapsed: "1m 12s", word: "DONE", tone: "done", note: "out/only-aces.mp4" });
  });
  it("points a job that went wrong at its log", () => {
    for (const state of ["stuck", "failed", "lost"] as const)
      expect(trace(job({ state }), now)).toMatchObject({ word: state.toUpperCase(), tone: "bad", note: "log: E:/p/logs/jobs/2026-11-12/j1.log" });
    expect(trace(job({ state: "failed", log: null }), now).note).toBeNull();
  });
  it("reads long runs in hours and short ones in seconds", () => {
    expect(trace(job({ startedAt: "2026-11-12T08:57:00Z" }), now).elapsed).toBe("1h 03m");
    expect(trace(job({ startedAt: "2026-11-12T09:59:15Z", percent: null, phase: null }), now)).toMatchObject({ elapsed: "45s", percent: null });
  });
});
