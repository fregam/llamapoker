import { describe, expect, it } from "vitest";
import { BACKOFF_MS, HEARTBEAT_MS, limitEvents, readingKey, shouldSend, statusText } from "./claude-statusline-lib.mjs";

// The shape Claude Code 2.1.325 pipes to the status line (captured 2026-11-14, trimmed).
const payload = {
  model: { id: "claude-opus-5-5", display_name: "Opus 5.5" },
  rate_limits: { five_hour: { used_percentage: 4, resets_at: 1794695400 }, seven_day: { used_percentage: 10, resets_at: 1794978000 } },
};
const now = new Date("2026-11-14T19:00:00Z");

describe("limitEvents", () => {
  it("sends one usage event per window, percent in amount and the reset time in meta", () => {
    expect(limitEvents(payload, now)).toEqual([
      { kind: "usage", channel: "claude", subject: "five_hour", amount: 4, unit: "%", ts: "2026-11-14T19:00:00.000Z", meta: { resets_at: 1794695400 } },
      { kind: "usage", channel: "claude", subject: "seven_day", amount: 10, unit: "%", ts: "2026-11-14T19:00:00.000Z", meta: { resets_at: 1794978000 } },
    ]);
  });
  it("sends nothing before the first API response or for an API-key session, and never a zero for a missing window", () => {
    expect(limitEvents({ model: payload.model }, now)).toEqual([]);
    expect(limitEvents({ rate_limits: { seven_day: payload.rate_limits.seven_day } }, now).map((e) => e.subject)).toEqual(["seven_day"]);
    expect(limitEvents({ rate_limits: { five_hour: { used_percentage: null, resets_at: 1 } } }, now)).toEqual([]);
  });
});

describe("shouldSend", () => {
  const t = now.getTime();
  it("sends a new reading, then not again until it changes or the heartbeat is due", () => {
    const key = readingKey(payload);
    expect(shouldSend(payload, null, t)).toBe(true);
    expect(shouldSend(payload, { key, sentAt: t - 60000 }, t)).toBe(false);
    expect(shouldSend(payload, { key, sentAt: t - HEARTBEAT_MS }, t)).toBe(true);
    const moved = { ...payload, rate_limits: { ...payload.rate_limits, five_hour: { used_percentage: 5.2, resets_at: 1794695400 } } };
    expect(shouldSend(moved, { key, sentAt: t - 60000 }, t)).toBe(true);
  });
  it("waits out the backoff after the wall did not answer, and has nothing to send without a reading", () => {
    expect(shouldSend(payload, { failedAt: t - 1000 }, t)).toBe(false);
    expect(shouldSend(payload, { failedAt: t - BACKOFF_MS }, t)).toBe(true);
    expect(shouldSend({}, null, t)).toBe(false);
  });
});

describe("statusText", () => {
  it("shows the model and each window", () => {
    expect(statusText(payload)).toBe("Opus 5.5 · 5h 4% · wk 10%");
    expect(statusText({ model: payload.model })).toBe("Opus 5.5");
    expect(statusText({})).toBe("Claude");
  });
});
