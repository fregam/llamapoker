/**
 * Vitest suite for the bankroll rules (poker/bankroll.ts): money parsing and formatting, the
 * buy-in rules and the move-up / move-down lines, and risk of ruin (the closed form against the
 * published example and against a seeded random walk; the tournament simulation against its own
 * payout model). Simulations here are seeded, so nothing flakes.
 */

import { describe, it, expect } from "vitest";
import {
  advise,
  bankrollForRuin,
  BUYINS,
  CASH_STAKES,
  cashRuin,
  formatMoney,
  parseMoney,
  payouts,
  rng,
  ruinFromResults,
  TOURNAMENT_STAKES,
  tournamentEdge,
  tournamentRuin,
} from "./bankroll";

describe("money", () => {
  it("parses what people type into whole cents", () => {
    expect(parseMoney("500")).toBe(50000);
    expect(parseMoney("$1,250.50")).toBe(125050);
    expect(parseMoney(" 12.5 ")).toBe(1250);
    expect(parseMoney("0.02")).toBe(2);
    expect(parseMoney("19.99")).toBe(1999); // no float drift
  });

  it("reads a decimal comma as a decimal comma, never as thousands", () => {
    expect(parseMoney("12,50")).toBe(1250);
    expect(parseMoney("€5,5")).toBe(550);
    expect(parseMoney("1.250,50")).toBe(125050);
    expect(parseMoney("1,250")).toBe(125000); // three digits after the comma: thousands
    expect(parseMoney("1,250,000.75")).toBe(125000075);
  });

  it("refuses what is not an amount", () => {
    for (const bad of ["", "abc", "-5", "1.234", "1.2.3", "$", "1,2,3", "12,5,0"]) expect(parseMoney(bad), bad).toBeNull();
  });

  it("formats cents the way a person reads them", () => {
    expect(formatMoney(50000)).toBe("$500");
    expect(formatMoney(125050)).toBe("$1,250.50");
    expect(formatMoney(2)).toBe("$0.02");
    expect(formatMoney(-4000)).toBe("−$40");
    expect(formatMoney(1000, "€")).toBe("€10");
  });
});

describe("the buy-in rules", () => {
  it("keeps more buy-ins the more careful you are, and more for tournaments than cash", () => {
    for (const f of ["cash", "tournament"] as const) {
      expect(BUYINS[f].aggressive).toBeLessThan(BUYINS[f].standard);
      expect(BUYINS[f].standard).toBeLessThan(BUYINS[f].careful);
    }
    expect(BUYINS.tournament.standard).toBeGreaterThan(BUYINS.cash.standard);
  });

  it("the ladders climb, and a cash buy-in is 100 big blinds", () => {
    for (const ladder of [CASH_STAKES, TOURNAMENT_STAKES])
      for (let i = 1; i < ladder.length; i++) expect(ladder[i].buyIn).toBeGreaterThan(ladder[i - 1].buyIn);
    for (const s of CASH_STAKES) expect(s.buyIn).toBe(s.bb! * 100);
  });

  it("$500 at the standard rule plays $0.05/$0.10, with both lines", () => {
    const a = advise(50000, "cash", "standard");
    expect(a.buyins).toBe(30);
    expect(a.stake?.name).toBe("$0.05/$0.10");
    expect(a.held).toBe(50); // 500 / 10
    expect(a.moveDownBelow).toBe(30000); // 30 × $10
    expect(a.lower?.name).toBe("$0.02/$0.05");
    expect(a.moveUpAt).toBe(75000); // 30 × $25
    expect(a.next?.name).toBe("$0.10/$0.25");
  });

  it("exactly on the line counts as rolled; one cent under does not", () => {
    expect(advise(75000, "cash", "standard").stake?.name).toBe("$0.10/$0.25");
    expect(advise(74999, "cash", "standard").stake?.name).toBe("$0.05/$0.10");
  });

  it("a bankroll under the lowest stake gets no stake and what the lowest one needs", () => {
    const a = advise(3000, "cash", "standard"); // $30; the lowest needs 30 × $2
    expect(a.stake).toBeNull();
    expect(a.needs).toBe(6000);
    expect(a.next?.name).toBe("$0.01/$0.02");
    expect(a.moveUpAt).toBe(6000);
    expect(a.moveDownBelow).toBeNull();
  });

  it("the ends of the ladder: no stake below the first, no line above the last", () => {
    const bottom = advise(6000, "cash", "standard");
    expect(bottom.stake?.name).toBe("$0.01/$0.02");
    expect(bottom.lower).toBeNull();
    const top = advise(1e12, "cash", "standard");
    expect(top.stake).toBe(CASH_STAKES[CASH_STAKES.length - 1]);
    expect(top.moveUpAt).toBeNull();
    expect(top.next).toBeNull();
  });

  it("tournaments use their own table: $500 standard plays $5 buy-ins", () => {
    const a = advise(50000, "tournament", "standard");
    expect(a.buyins).toBe(100);
    expect(a.stake?.buyIn).toBe(500);
    expect(a.moveUpAt).toBe(100000);
  });

  it("a careful player is sent lower than an aggressive one on the same bankroll", () => {
    const c = advise(50000, "cash", "careful").stake!;
    const g = advise(50000, "cash", "aggressive").stake!;
    expect(c.buyIn).toBeLessThan(g.buyIn);
  });

  it("names stakes in the tracker's currency", () => {
    expect(advise(50000, "cash", "standard", "€").stake?.name).toBe("€0.05/€0.10");
  });
});

describe("risk of ruin, cash", () => {
  it("matches the published example: 2 bb/100, SD 90, 5% needs about 61 buy-ins", () => {
    const bb = bankrollForRuin(0.05, 2, 90);
    expect(bb / 100).toBeGreaterThan(60);
    expect(bb / 100).toBeLessThan(61.5);
    expect(cashRuin(bb, 2, 90)).toBeCloseTo(0.05, 6);
  });

  it("is certain for a break-even or losing player, and for an empty bankroll", () => {
    expect(cashRuin(5000, 0, 90)).toBe(1);
    expect(cashRuin(5000, -3, 90)).toBe(1);
    expect(cashRuin(0, 5, 90)).toBe(1);
    expect(bankrollForRuin(0.05, 0, 90)).toBe(Infinity);
  });

  it("falls with a bigger bankroll and a bigger edge, rises with bigger swings", () => {
    expect(cashRuin(5000, 2, 90)).toBeLessThan(cashRuin(3000, 2, 90));
    expect(cashRuin(3000, 5, 90)).toBeLessThan(cashRuin(3000, 2, 90));
    expect(cashRuin(3000, 2, 120)).toBeGreaterThan(cashRuin(3000, 2, 90));
  });

  it("agrees with a seeded random walk of 100-hand blocks", () => {
    // 20 buy-ins, 5 bb/100, SD 90. The formula treats results as continuous; real blocks jump
    // past zero, which makes the simulated number a little lower. Hence the tolerance.
    const B = 2000, wr = 5, sd = 90;
    const rand = rng(7);
    const normal = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
    const paths = 4000;
    let broke = 0;
    for (let p = 0; p < paths; p++) {
      let b = B;
      while (b > 0 && b < B + 8000) b += wr + sd * normal(); // from +80 buy-ins ruin is under 0.001%
      if (b <= 0) broke++;
    }
    const formula = cashRuin(B, wr, sd);
    expect(formula).toBeCloseTo(0.0847, 3);
    expect(Math.abs(broke / paths - formula)).toBeLessThan(0.02);
  });

  it("the same formula works on any unit: mean and variance per session", () => {
    expect(ruinFromResults(3000, 2, 90 * 90)).toBeCloseTo(cashRuin(3000, 2, 90), 12);
    expect(ruinFromResults(3000, -1, 100)).toBe(1);
    expect(ruinFromResults(3000, 5, 0)).toBe(0); // a winner who never swings never busts
  });
});

describe("risk of ruin, tournaments", () => {
  it("pays the top 15%, falling by place, and hands out the whole prize pool", () => {
    const p = payouts(100);
    expect(p.length).toBe(15);
    expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    for (let i = 1; i < p.length; i++) expect(p[i]).toBeLessThan(p[i - 1]);
    expect(payouts(2).length).toBe(1); // heads-up: winner takes all
  });

  it("the model's average result is the ROI it was given", () => {
    const e = tournamentEdge({ field: 100, roi: 0.1 });
    expect(e.mean).toBeCloseTo(0.1, 10);
    expect(e.cashes).toBeCloseTo(0.165, 10); // 15 paid places × 1.1 / 100
    // and a simulated player earns it, within noise
    const rand = rng(3);
    let total = 0;
    const n = 200000;
    for (let i = 0; i < n; i++) total += e.result(rand());
    expect(total / n).toBeGreaterThan(0.05);
    expect(total / n).toBeLessThan(0.15);
  });

  it("same seed, same answer", () => {
    const m = { field: 100, roi: 0.1 };
    expect(tournamentRuin(100, m)).toBe(tournamentRuin(100, m));
  });

  it("more buy-ins never raises the risk; a bigger field does", () => {
    const m = { field: 100, roi: 0.1 };
    const r50 = tournamentRuin(50, m), r100 = tournamentRuin(100, m), r200 = tournamentRuin(200, m);
    expect(r50).toBeGreaterThanOrEqual(r100);
    expect(r100).toBeGreaterThanOrEqual(r200);
    expect(r50).toBeGreaterThan(r200);
    expect(tournamentRuin(100, { field: 1000, roi: 0.1 })).toBeGreaterThan(r100);
  });

  it("one more buy-in never raises the risk, buy-in by buy-in", () => {
    // Every simulated player meets the same run of results whatever they start with, so a bigger
    // bankroll can only survive longer. Checked one buy-in at a time, where sampling noise would show.
    const m = { field: 100, roi: 0.1 };
    let prev = tournamentRuin(99, m);
    for (let b = 100; b <= 140; b++) {
      const r = tournamentRuin(b, m);
      expect(r, `${b} buy-ins`).toBeLessThanOrEqual(prev);
      prev = r;
    }
  });

  it("a losing player with a short roll is nearly sure to bust; nobody busts with no bankroll left over", () => {
    expect(tournamentRuin(20, { field: 100, roi: -0.3 })).toBeGreaterThan(0.9);
    expect(tournamentRuin(0, { field: 100, roi: 0.1 })).toBe(1);
  });

  it("is fast enough to run on a keystroke", () => {
    const t = performance.now();
    tournamentRuin(100, { field: 1000, roi: 0.1 });
    expect(performance.now() - t).toBeLessThan(1000);
  });
});
