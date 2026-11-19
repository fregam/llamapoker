/**
 * Vitest suite for the Trainer's practice bankroll (poker/practice.ts): a hand's result in big
 * blinds becomes play money at the stake played, the lines match the bankroll calculator's rule,
 * moving up needs the line, and the two forced moves (cannot cover a buy-in, bust) happen.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { advise, CASH_STAKES } from "./bankroll";
import { emptyPractice, loadPractice, moveDown, moveUp, playHand, Practice, PRACTICE_START, practiceStatus, savePractice } from "./practice";

const at = (bankroll: number, stake: number, extra: Partial<Practice> = {}): Practice => ({ ...emptyPractice(), bankroll, stake, best: stake, ...extra });

describe("practice bankroll", () => {
  it("starts with $100 of play money on the lowest stake, rolled but short of the next one", () => {
    const p = emptyPractice();
    const s = practiceStatus(p);
    expect(p.bankroll).toBe(10000);
    expect(s.stake).toBe(CASH_STAKES[0]);
    expect(s.held).toBe(50);
    expect(s.underLine).toBe(false);
    expect(s.canMoveUp).toBe(false);
    expect(s.moveUpAt).toBe(15000);
  });

  it("uses the same lines as the bankroll calculator", () => {
    for (const bankroll of [10000, 15000, 40000, 75000]) {
      const a = advise(bankroll, "cash", "standard");
      const i = CASH_STAKES.indexOf(a.stake!);
      const s = practiceStatus(at(bankroll, i));
      expect(s.line).toBe(a.moveDownBelow);
      expect(s.moveUpAt).toBe(a.moveUpAt);
      expect(s.underLine).toBe(false);
      expect(s.canMoveUp).toBe(false); // the calculator already put it on the highest stake it covers
    }
  });

  it("a hand's big blinds become play money at the stake played", () => {
    const low = playHand(emptyPractice(), 12.5); // $0.02 big blind
    expect(low.change).toBe(25);
    expect(low.practice.bankroll).toBe(10025);
    expect(low.practice.hands).toBe(1);
    const higher = playHand(at(40000, 2), -100); // a whole buy-in at $0.05/$0.10
    expect(higher.change).toBe(-1000);
    expect(higher.practice.bankroll).toBe(39000);
    expect(playHand(at(20000, 1), 0.5).change).toBe(3); // half of a 5-cent big blind, rounded
  });

  it("moving up needs the line; moving down is always allowed until the bottom", () => {
    expect(moveUp(at(14999, 0)).stake).toBe(0);
    const up = moveUp(at(15000, 0));
    expect(up.stake).toBe(1);
    expect(up.best).toBe(1);
    expect(moveDown(up).stake).toBe(0);
    expect(moveDown(up).best).toBe(1); // the best stake reached is kept
    expect(moveDown(at(100, 0)).stake).toBe(0);
    expect(moveUp(at(1e12, CASH_STAKES.length - 1)).stake).toBe(CASH_STAKES.length - 1);
  });

  it("staying under the line is allowed, said out loud and counted", () => {
    const p = at(14000, 1); // took the shot at $0.02/$0.05, now under its $150 line
    expect(practiceStatus(p).underLine).toBe(true);
    const o = playHand(p, -10);
    expect(o.practice.stake).toBe(1);
    expect(o.practice.under).toBe(1);
    expect(o.droppedTo).toBeNull();
    expect(playHand(at(20000, 1), -10).practice.under).toBe(0);
  });

  it("a bankroll that cannot cover one buy-in drops to a stake it can", () => {
    const o = playHand(at(2600, 3), -100); // $26 at $0.10/$0.25: loses $25, left with $1... a bust
    expect(o.bust).toBe(true);
    const d = playHand(at(3000, 3), -40); // $30, loses $10: $20 covers $0.05/$0.10 ($10), not $0.10/$0.25 ($25)
    expect(d.bust).toBe(false);
    expect(d.droppedTo).toBe(CASH_STAKES[2]);
    expect(d.practice.stake).toBe(2);
  });

  it("a bust is counted and the bankroll starts again", () => {
    const o = playHand(at(250, 0, { busts: 1, hands: 40 }), -100); // $2.50, loses a $2 buy-in
    expect(o.bust).toBe(true);
    expect(o.practice).toEqual(emptyPractice(2));
    expect(o.practice.bankroll).toBe(PRACTICE_START);
  });
});

describe("practice storage", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("saves and loads; anything broken or missing is a fresh start, never a throw", () => {
    const data: Record<string, string> = {};
    vi.stubGlobal("localStorage", { getItem: (k: string) => data[k] ?? null, setItem: (k: string, v: string) => void (data[k] = v) });
    expect(loadPractice()).toEqual(emptyPractice());
    const p = at(15250, 1, { hands: 12, busts: 1 });
    savePractice(p);
    expect(loadPractice()).toEqual(p);
    data["llamapoker.practice.v1"] = JSON.stringify({ v: 1, bankroll: 500, stake: 99 });
    expect(loadPractice()).toEqual(emptyPractice());
    data["llamapoker.practice.v1"] = "{broken";
    expect(loadPractice()).toEqual(emptyPractice());
    vi.unstubAllGlobals();
    expect(loadPractice()).toEqual(emptyPractice());
    expect(() => savePractice(p)).not.toThrow();
  });
});
