/**
 * Monte Carlo equity. simulate(hero, board, opps, iterations) deals out the unknown
 * cards many times and counts how often you win. Each opponent is either null (any two
 * cards) or a list of combos from a range; ranged opponents are dealt first, with
 * rejection sampling for card clashes. Ties are split only among the players who
 * actually tied (tieShare). Returns win/tie/lose, equity, what beat you, and an
 * `impossible` message when a range has no hands left.
 * Used by: poker/equity.worker (in the app), poker.test.ts.
 * Uses: poker/cards, poker/evaluator, poker/ranges (Combo type).
 */

import { Card } from "./cards";
import { evaluate7, categoryOf } from "./evaluator";
import type { Combo } from "./ranges";

export interface EquityResult {
  iterations: number; // hands actually simulated
  winCount: number;
  tieCount: number;
  loseCount: number;
  /** Sum of your pot share in tied hands (a 2-way tie adds 0.5, 3-way 0.333…). */
  tieShare: number;
  win: number; // fraction
  tie: number; // fraction
  lose: number; // fraction
  opponents: number;
  equity: number; // (wins + tie shares) / iterations
  /** When you LOSE, distribution of the winning opponent's hand category (0..8). */
  beatenBy: number[];
  /** Your best made-hand category distribution across all runouts (0..8). */
  heroCategories: number[];
  /** Set when an opponent's range has no hands left given the known cards. */
  impossible?: string;
}

/** One opponent: null = any two cards, otherwise a list of possible combos. */
export type OppRange = Combo[] | null;

const MAX_TRIES = 60;

function emptyResult(opponents: number, impossible?: string): EquityResult {
  return {
    iterations: 0,
    winCount: 0,
    tieCount: 0,
    loseCount: 0,
    tieShare: 0,
    win: 0,
    tie: 0,
    lose: 0,
    opponents,
    equity: 0,
    beatenBy: new Array(9).fill(0),
    heroCategories: new Array(9).fill(0),
    impossible,
  };
}

/**
 * Estimate hero equity. board may contain 0, 3, 4 or 5 cards.
 * Ranged opponents are dealt first (a random combo that doesn't clash with
 * cards already out), then random opponents, then the rest of the board.
 */
export function simulate(
  hero: [Card, Card],
  board: Card[],
  opps: OppRange[],
  iterations = 20000
): EquityResult {
  const opponents = opps.length;
  const fixed = new Uint8Array(52);
  fixed[hero[0]] = 1;
  fixed[hero[1]] = 1;
  for (const c of board) fixed[c] = 1;

  // Drop combos that use a known card; a range with nothing left is impossible.
  const ranges: OppRange[] = opps.map((r) => (r ? r.filter(([a, b]) => !fixed[a] && !fixed[b]) : null));
  for (let i = 0; i < ranges.length; i++) {
    const r = ranges[i];
    if (r && r.length === 0) return emptyResult(opponents, `Opponent ${i + 1}'s range has no hands left with these cards.`);
  }

  const deck: Card[] = [];
  for (let c = 0; c < 52; c++) if (!fixed[c]) deck.push(c);

  const stamp = new Int32Array(52); // stamp[c] === iteration+1 → card used this iteration
  const boardNeeded = 5 - board.length;
  const fullBoard: Card[] = new Array(5);
  const heroSeven: Card[] = new Array(7);
  const oppSeven: Card[] = new Array(7);
  const oppCards: Card[] = new Array(opponents * 2);
  const ranged = ranges.map((r, i) => ({ r, i })).filter((x) => x.r !== null) as { r: Combo[]; i: number }[];
  const randomIdx = ranges.map((r, i) => (r === null ? i : -1)).filter((i) => i >= 0);

  const res = emptyResult(opponents);
  let skipped = 0;

  const drawCard = (mark: number): Card => {
    for (;;) {
      const c = deck[(Math.random() * deck.length) | 0];
      if (stamp[c] !== mark) {
        stamp[c] = mark;
        return c;
      }
    }
  };

  for (let it = 0; it < iterations; it++) {
    const mark = it + 1;

    // Deal ranged opponents first.
    let ok = true;
    for (const { r, i } of ranged) {
      let placed = false;
      for (let t = 0; t < MAX_TRIES; t++) {
        const [a, b] = r[(Math.random() * r.length) | 0];
        if (stamp[a] !== mark && stamp[b] !== mark) {
          stamp[a] = mark;
          stamp[b] = mark;
          oppCards[i * 2] = a;
          oppCards[i * 2 + 1] = b;
          placed = true;
          break;
        }
      }
      if (!placed) {
        ok = false;
        break;
      }
    }
    if (!ok) {
      skipped++;
      continue;
    }

    for (const i of randomIdx) {
      oppCards[i * 2] = drawCard(mark);
      oppCards[i * 2 + 1] = drawCard(mark);
    }
    for (let i = 0; i < board.length; i++) fullBoard[i] = board[i];
    for (let i = 0; i < boardNeeded; i++) fullBoard[board.length + i] = drawCard(mark);

    heroSeven[0] = hero[0];
    heroSeven[1] = hero[1];
    for (let i = 0; i < 5; i++) heroSeven[2 + i] = oppSeven[2 + i] = fullBoard[i];
    const heroScore = evaluate7(heroSeven);
    res.heroCategories[categoryOf(heroScore)]++;

    let bestOpp = -1;
    let atBest = 0;
    for (let o = 0; o < opponents; o++) {
      oppSeven[0] = oppCards[o * 2];
      oppSeven[1] = oppCards[o * 2 + 1];
      const s = evaluate7(oppSeven);
      if (s > bestOpp) {
        bestOpp = s;
        atBest = 1;
      } else if (s === bestOpp) {
        atBest++;
      }
    }

    if (heroScore > bestOpp) {
      res.winCount++;
    } else if (heroScore === bestOpp) {
      res.tieCount++;
      res.tieShare += 1 / (atBest + 1); // split only with the players who tied
    } else {
      res.loseCount++;
      res.beatenBy[categoryOf(bestOpp)]++;
    }
  }

  const n = iterations - skipped;
  if (n === 0) return emptyResult(opponents, "These opponent ranges can't all be dealt at once — they clash too much.");
  res.iterations = n;
  res.win = res.winCount / n;
  res.tie = res.tieCount / n;
  res.lose = res.loseCount / n;
  res.equity = (res.winCount + res.tieShare) / n;
  return res;
}

/** Hero vs `opponents` players holding any two cards. */
export function equityVsRandom(hero: [Card, Card], board: Card[], opponents: number, iterations = 20000): EquityResult {
  return simulate(hero, board, new Array(opponents).fill(null), iterations);
}
