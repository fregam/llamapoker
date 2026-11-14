import { describe, expect, it } from "vitest";
import { lineOpen } from "./work";

const ok = { open: false, latest: "only-aces: done in 19 s" };
const failed = { open: true, latest: "wltest-c: failed (boom)" };

describe("lineOpen: whether a Work line shows its stations and traces", () => {
  it("follows the line's own `open` when the founder hasn't clicked it", () => {
    expect(lineOpen(ok, undefined)).toBe(false);
    expect(lineOpen(failed, undefined)).toBe(true);
  });
  it("keeps the founder's click while nothing new happens on the line", () => {
    expect(lineOpen(failed, { open: false, latest: failed.latest })).toBe(false);
    expect(lineOpen(ok, { open: true, latest: ok.latest })).toBe(true);
  });
  it("opens again by itself when a new failure lands on a line closed by hand", () => {
    const closedWhenQuiet = { open: false, latest: ok.latest };
    expect(lineOpen(failed, closedWhenQuiet)).toBe(true);
  });
  it("closes again when the line recovers after being opened by hand", () => {
    const openedWhileFailed = { open: true, latest: failed.latest };
    expect(lineOpen(ok, openedWhileFailed)).toBe(false);
  });
});
