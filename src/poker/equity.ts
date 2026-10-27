// Monte Carlo equity estimation for Texas Hold'em.

import { Card, remainingDeck } from "./cards";
import { evaluate7, categoryOf } from "./evaluator";

export interface EquityResult {
  iterations: number;
  winCount: number;
  tieCount: number;
  loseCount: number;
  win: number; // fraction
  tie: number; // fraction
  lose: number; // fraction
  opponents: number;
  equity: number; // win + tie split share
  /** When you LOSE, distribution of the winning opponent's hand category (0..8). */
  beatenBy: number[];
  /** Your best made-hand category distribution across all runouts (0..8). */
  heroCategories: number[];
}

function sample(deck: Card[], n: number, out: Card[], offset: number): void {
  // Partial Fisher–Yates: pick n cards into out[offset..].
  for (let i = 0; i < n; i++) {
    const j = i + ((Math.random() * (deck.length - i)) | 0);
    const tmp = deck[i];
    deck[i] = deck[j];
    deck[j] = tmp;
    out[offset + i] = deck[i];
  }
}

/**
 * Estimate hero equity vs `opponents` random hands.
 * board may contain 0, 3, 4 or 5 cards.
 */
export function equityVsRandom(
  hero: [Card, Card],
  board: Card[],
  opponents: number,
  iterations = 25000
): EquityResult {
  const used = [hero[0], hero[1], ...board];
  const deck = remainingDeck(used);
  const boardNeeded = 5 - board.length;
  const drawCount = boardNeeded + opponents * 2;

  const beatenBy = new Array(9).fill(0);
  const heroCategories = new Array(9).fill(0);
  let win = 0;
  let tie = 0;
  let lose = 0;

  const drawn: Card[] = new Array(drawCount);
  const fullBoard: Card[] = new Array(5);
  const heroSeven: Card[] = new Array(7);
  const oppSeven: Card[] = new Array(7);

  for (let it = 0; it < iterations; it++) {
    sample(deck, drawCount, drawn, 0);

    for (let i = 0; i < board.length; i++) fullBoard[i] = board[i];
    for (let i = 0; i < boardNeeded; i++) fullBoard[board.length + i] = drawn[i];

    heroSeven[0] = hero[0];
    heroSeven[1] = hero[1];
    for (let i = 0; i < 5; i++) heroSeven[2 + i] = fullBoard[i];
    const heroScore = evaluate7(heroSeven);
    heroCategories[categoryOf(heroScore)]++;

    let bestOpp = -1;
    let bestOppCat = 0;
    let oppOffset = boardNeeded;
    for (let o = 0; o < opponents; o++) {
      oppSeven[0] = drawn[oppOffset];
      oppSeven[1] = drawn[oppOffset + 1];
      oppOffset += 2;
      for (let i = 0; i < 5; i++) oppSeven[2 + i] = fullBoard[i];
      const s = evaluate7(oppSeven);
      if (s > bestOpp) {
        bestOpp = s;
        bestOppCat = categoryOf(s);
      }
    }

    if (heroScore > bestOpp) {
      win++;
    } else if (heroScore === bestOpp) {
      tie++;
    } else {
      lose++;
      beatenBy[bestOppCat]++;
    }
  }

  const w = win / iterations;
  const t = tie / iterations;
  const l = lose / iterations;
  // Split ties evenly assuming heads-up-equivalent split share.
  return {
    iterations,
    winCount: win,
    tieCount: tie,
    loseCount: lose,
    win: w,
    tie: t,
    lose: l,
    opponents,
    equity: w + t / (opponents + 1),
    beatenBy,
    heroCategories,
  };
}
