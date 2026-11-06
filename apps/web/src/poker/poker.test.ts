/**
 * Vitest suite for the pure poker logic: evaluator ordering and kickers, equity
 * sanity checks (AA vs random ≈ 85%, AKs vs QQ ≈ 46%, tie splitting), range notation,
 * outs counting, strategy charts, analyzeSpot (implied odds, all-in capping) and stats.
 * Run with `npm test`. Monte Carlo tests use generous tolerances.
 * Uses: everything in poker/ except the worker.
 */

import { describe, it, expect } from "vitest";
import { Card, parseCard } from "./cards";
import { evaluate5, evaluate7, categoryOf } from "./evaluator";
import { simulate, equityVsRandom } from "./equity";
import { expandToken, labelCombos, rangePercent, gridLabel, Combo, raiserFromPresets, callRange } from "./ranges";
import { analyzeDraws } from "./draws";
import { recommend, RecoInput } from "./strategy";
import { analyzeSpot } from "./analyze";
import { emptyStats, recordDecision, findLeaks } from "./stats";
import { dealHand, applyChoice, optionsOf, spotOf } from "./handPlay";
import { randomSpot, outsSpot } from "./drills";

const cs = (s: string): Card[] => s.trim().split(/\s+/).map(parseCard);
const two = (s: string) => cs(s) as [Card, Card];

describe("evaluator", () => {
  it("ranks every category in order", () => {
    const hands = [
      "As Kd 9c 7h 3s", // high card
      "As Ad 9c 7h 3s", // pair
      "As Ad 9c 9h 3s", // two pair
      "As Ad Ac 7h 3s", // trips
      "9s 8d 7c 6h 5s", // straight
      "As Js 9s 7s 3s", // flush
      "As Ad Ac 7h 7s", // full house
      "As Ad Ac Ah 3s", // quads
      "9s 8s 7s 6s 5s", // straight flush
    ].map((h) => evaluate5(cs(h)));
    hands.forEach((s, i) => expect(categoryOf(s)).toBe(i));
    for (let i = 1; i < hands.length; i++) expect(hands[i]).toBeGreaterThan(hands[i - 1]);
  });

  it("treats the wheel as the lowest straight", () => {
    const wheel = evaluate5(cs("As 2d 3c 4h 5s"));
    const sixHigh = evaluate5(cs("2d 3c 4h 5s 6c"));
    expect(categoryOf(wheel)).toBe(4);
    expect(sixHigh).toBeGreaterThan(wheel);
  });

  it("uses kickers", () => {
    expect(evaluate5(cs("As Ad Kc 7h 3s"))).toBeGreaterThan(evaluate5(cs("Ah Ac Qc 7d 3d")));
  });

  it("finds the best 5 of 7", () => {
    expect(categoryOf(evaluate7(cs("Ah Kh Qh Jh Th 2c 2d")))).toBe(8);
  });
});

describe("equity", () => {
  it("AA vs one random hand is about 85%", () => {
    const r = equityVsRandom(two("As Ah"), [], 1, 40000);
    expect(r.equity).toBeGreaterThan(0.835);
    expect(r.equity).toBeLessThan(0.865);
  });

  it("AKs vs QQ is roughly a coin flip (~46%)", () => {
    const r = simulate(two("As Ks"), [], [[two("Qh Qd") as Combo]], 40000);
    expect(r.equity).toBeGreaterThan(0.44);
    expect(r.equity).toBeLessThan(0.48);
  });

  it("splits a board-plays tie among everyone", () => {
    const r = equityVsRandom(two("2c 3d"), cs("As Ks Qs Js Ts"), 3, 2000);
    expect(r.tie).toBe(1);
    expect(r.equity).toBeCloseTo(0.25, 10);
  });

  it("splits a 2-way tie with only the player who tied (3 in the pot)", () => {
    const board = cs("Ac Kd Qh Jc 9s");
    const r = simulate(two("Th 3c"), board, [[two("Td 4h") as Combo], [two("2c 2d") as Combo]], 500);
    expect(r.tie).toBe(1);
    expect(r.equity).toBeCloseTo(0.5, 10); // the old formula gave 1/3
  });

  it("is stronger vs a wide range than vs a tight one", () => {
    const hero = two("Ah Jd");
    const wide = simulate(hero, [], [null], 20000).equity;
    const tight = simulate(hero, [], [["QQ", "KK", "AA", "AKs", "AKo"].flatMap(labelCombos)], 20000).equity;
    expect(wide).toBeGreaterThan(tight + 0.25);
  });

  it("flags a range that can't be dealt", () => {
    const r = simulate(two("As Kd"), [], [[two("As Ks") as Combo]], 100);
    expect(r.impossible).toBeTruthy();
  });
});

describe("ranges", () => {
  it("expands +, dash and plain tokens", () => {
    expect(expandToken("JJ-99").sort()).toEqual(["99", "JJ", "TT"]);
    expect(expandToken("AJs-A9s").sort()).toEqual(["A9s", "AJs", "ATs"]);
    expect(expandToken("AQo+").sort()).toEqual(["AKo", "AQo"]);
    expect(expandToken("QQ+").sort()).toEqual(["AA", "KK", "QQ"]);
    expect(expandToken("T9s")).toEqual(["T9s"]);
  });

  it("produces the right number of combos", () => {
    expect(labelCombos("QQ")).toHaveLength(6);
    expect(labelCombos("AKs")).toHaveLength(4);
    expect(labelCombos("AKo")).toHaveLength(12);
  });

  it("the full grid covers 100% of hands", () => {
    const all = new Set<string>();
    for (let r = 0; r < 13; r++) for (let c = 0; c < 13; c++) all.add(gridLabel(r, c));
    expect(all.size).toBe(169);
    expect(rangePercent(all)).toBeCloseTo(100, 6);
  });
});

describe("draws", () => {
  const outs = (h: string, b: string) => analyzeDraws(two(h), cs(b))!;

  it("flush draw = 9 outs", () => {
    const d = outs("Ah 5h", "Kh 9h 2c");
    expect(d.outs).toHaveLength(9);
    expect(d.draws).toContain("Flush draw");
  });
  it("open-ended straight draw = 8 outs", () => {
    const d = outs("9c 8d", "7h 6s 2c");
    expect(d.outs).toHaveLength(8);
    expect(d.draws).toContain("Open-ended straight draw");
  });
  it("gutshot = 4 outs", () => {
    const d = outs("9c 8d", "6h 5s Kc");
    expect(d.outs).toHaveLength(4);
    expect(d.draws).toContain("Gutshot straight draw");
  });
  it("combo draw doesn't double-count shared outs (15)", () => {
    expect(outs("9h 8h", "7h 6c 2h").outs).toHaveLength(15);
  });
  it("top pair has 5 outs to two pair / trips, ignoring board pairs", () => {
    expect(outs("Ah Kd", "Ac 7s 2d").outs).toHaveLength(5);
  });
  it("counts overcards separately", () => {
    const d = outs("Ah Kd", "7c 5s 2d");
    expect(d.outs).toHaveLength(0);
    expect(d.overcards).toBe(2);
  });
  it("hit chances match the exact math", () => {
    const d = outs("Ah 5h", "Kh 9h 2c");
    expect(d.nextCard).toBeCloseTo(9 / 47, 10);
    expect(d.byRiver).toBeCloseTo(1 - (38 * 37) / (47 * 46), 10);
  });
  it("is null preflop and on the river", () => {
    expect(analyzeDraws(two("Ah 5h"), [])).toBeNull();
    expect(analyzeDraws(two("Ah 5h"), cs("Kh 9h 2c 3d 4s"))).toBeNull();
  });
});

describe("strategy", () => {
  const base: RecoInput = {
    street: 0,
    position: "UTG",
    hand: "72o",
    facingBet: false,
    equity: 0.5,
    opponents: 1,
    requiredEquity: 0,
    madeCategory: null,
    draws: null,
    spr: 20,
    allIn: false,
    impliedOk: false,
  };
  it("preflop charts", () => {
    expect(recommend(base).choice).toBe("fold");
    expect(recommend({ ...base, hand: "AA" }).choice).toBe("raise");
    expect(recommend({ ...base, position: "BB", hand: "72o" }).choice).toBe("check");
    expect(recommend({ ...base, position: "BB", hand: "KTo", facingBet: true }).choice).toBe("call");
    expect(recommend({ ...base, position: "BB", hand: "AKo", facingBet: true }).choice).toBe("raise");
    expect(recommend({ ...base, position: "SB", hand: "72o", facingBet: true }).choice).toBe("fold");
  });
  it("big blind defends wider against a late-position raise", () => {
    const bb = { ...base, position: "BB" as const, facingBet: true };
    expect(recommend({ ...bb, hand: "T7o", raiser: "BTN" }).choice).toBe("call");
    expect(recommend({ ...bb, hand: "T7o", raiser: "UTG" }).choice).toBe("fold");
    expect(recommend({ ...bb, hand: "T7o" }).choice).toBe("fold"); // raiser unknown: tight chart
    expect(recommend({ ...bb, hand: "72o", raiser: "BTN" }).choice).toBe("fold");
    expect(recommend({ ...bb, hand: "A4s", raiser: "SB" }).choice).toBe("raise");
    const late = rangePercent(callRange("BB", "BTN"));
    expect(late).toBeGreaterThan(40);
    expect(late).toBeLessThan(60);
  });
  it("reads the raiser from the opponent preset", () => {
    expect(raiserFromPresets(["open-BTN"])).toBe("BTN");
    expect(raiserFromPresets(["random"])).toBeUndefined();
    expect(raiserFromPresets(["open-BTN", "open-CO"])).toBeUndefined();
  });
  it("folds a weak hand that misses the price", () => {
    expect(recommend({ ...base, street: 2, facingBet: true, equity: 0.15, requiredEquity: 0.3, madeCategory: 0 }).choice).toBe(
      "fold"
    );
  });
});

describe("analyzeSpot", () => {
  it("allows a short-priced draw call only when stacks are deep", () => {
    const spot = {
      hero: two("Ah 5h"),
      board: cs("Kh 9h 2c 3d"), // turn: flush draw + gutshot
      position: "BTN" as const,
      facingBet: true,
      pot: 10,
      bet: 10,
      opponents: 1,
    };
    const fake = { ...equityVsRandom(two("Ah 5h"), [], 1, 10), equity: 0.22 };
    expect(analyzeSpot({ ...spot, stack: 500 }, fake).implied?.ok).toBe(true);
    expect(analyzeSpot({ ...spot, stack: 25 }, fake).implied?.ok).toBe(false);
  });
  it("caps the call at the stack and flags all-in", () => {
    const a = analyzeSpot(
      { hero: two("Ah Ad"), board: [], position: "BTN", facingBet: true, pot: 10, bet: 50, stack: 20, opponents: 1 },
      null
    );
    expect(a.call).toBe(20);
    expect(a.allIn).toBe(true);
  });
});

describe("stats", () => {
  it("tracks accuracy, streaks and per-street counts", () => {
    let s = emptyStats();
    const d = { at: 1, street: 1, position: "BTN", hand: "AsKs", board: "", action: "Call" };
    s = recordDecision(s, { ...d, answer: "call", correct: "call" });
    s = recordDecision(s, { ...d, at: 2, answer: "call", correct: "call" });
    s = recordDecision(s, { ...d, at: 3, answer: "fold", correct: "call" });
    expect(s.total).toBe(3);
    expect(s.correct).toBe(2);
    expect(s.streak).toBe(0);
    expect(s.bestStreak).toBe(2);
    expect(s.byStreet[1]).toEqual({ total: 3, correct: 2 });
    expect(s.history[0].at).toBe(3);
  });
});

describe("full-hand engine", () => {
  it("deals distinct cards and a preflop decision", () => {
    for (let i = 0; i < 50; i++) {
      const h = dealHand();
      const all = [...h.hero, ...h.villain, ...h.runout];
      expect(new Set(all).size).toBe(9);
      expect(h.street).toBe(0);
      expect(h.over).toBeNull();
      expect(h.stack + h.invested).toBe(100);
    }
  });

  it("folding ends the hand and loses only what you put in", () => {
    const h = dealHand();
    const f = applyChoice(h, "fold");
    expect(f.over?.result).toBe("hero-fold");
    expect(f.over?.heroNet).toBe(-h.invested);
  });

  it("calling an open adds both bets to the pot and moves to the flop", () => {
    let h = dealHand();
    while (h.bet === 0) h = dealHand();
    const c = applyChoice(h, "call");
    expect(c.street).toBe(1);
    expect(c.pot).toBeCloseTo(h.pot + h.bet + h.bet, 6);
    expect(c.stack).toBeCloseTo(h.stack - h.bet, 6);
  });

  it("every hand finishes, chips never go negative, and results are bounded", () => {
    for (let i = 0; i < 400; i++) {
      let h = dealHand();
      let steps = 0;
      while (!h.over && steps < 12) {
        expect(h.stack).toBeGreaterThanOrEqual(0);
        expect(spotOf(h).board.length).toBe(h.street === 0 ? 0 : h.street + 2);
        const opts = optionsOf(h);
        h = applyChoice(h, opts[(Math.random() * opts.length) | 0]);
        steps++;
      }
      expect(h.over).not.toBeNull();
      expect(h.over!.heroNet).toBeGreaterThanOrEqual(-100);
      expect(h.over!.heroNet).toBeLessThanOrEqual(h.pot + 100);
      expect(h.invested).toBeLessThanOrEqual(100);
    }
  });
});

describe("drills", () => {
  it("pins the street and the bet when asked", () => {
    for (let i = 0; i < 30; i++) {
      expect(randomSpot({ street: 0 }).spot.board).toHaveLength(0);
      const p = randomSpot({ street: 2, facing: true }).spot;
      expect(p.board).toHaveLength(4);
      expect(p.facingBet && p.bet > 0).toBe(true);
    }
  });
  it("outs spots are on the flop or turn", () => {
    for (let i = 0; i < 20; i++) expect([3, 4]).toContain(outsSpot().spot.board.length);
  });
});

describe("leaks", () => {
  it("finds the spot types you miss most", () => {
    const base = { position: "BTN", hand: "", board: "", action: "", correct: "call" };
    const hist = [
      ...Array.from({ length: 5 }, (_, i) => ({ ...base, at: i, street: 2, facing: true, answer: "fold" })),
      ...Array.from({ length: 5 }, (_, i) => ({ ...base, at: 10 + i, street: 1, facing: true, answer: "call" })),
    ];
    const leaks = findLeaks(hist);
    expect(leaks).toHaveLength(1);
    expect(leaks[0].label).toBe("Turn · facing a bet");
    expect(leaks[0].correct).toBe(0);
  });
});