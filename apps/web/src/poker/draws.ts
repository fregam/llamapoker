/**
 * Draw detection and outs counting on the flop and turn. analyzeDraws(hero, board)
 * returns the out cards (unseen cards that improve you to two pair or better using your
 * hole cards — board-only improvements don't count), outs grouped by the hand they
 * make, named draws (flush / open-ended / gutshot), overcards, and the exact chance to
 * hit on the next card and by the river. Returns null preflop and on the river.
 * Used by: poker/analyze (→ strategy and Readout).
 * Uses: poker/cards, poker/evaluator.
 */

import { Card, rankOf, suitOf } from "./cards";
import { bestScore, categoryOf, CATEGORY_NAMES } from "./evaluator";

export interface DrawInfo {
  /** Unseen cards that improve you to two pair or better (using your hole cards). */
  outs: Card[];
  /** Outs grouped by the hand they make, strongest first, e.g. [{ name: "Flush", count: 9 }]. */
  byHand: { name: string; count: number }[];
  /** Named draws, e.g. "Flush draw", "Open-ended straight draw". */
  draws: string[];
  /** Hole cards higher than every board card (only counted when you have no pair). */
  overcards: number;
  unseen: number;
  /** Chance to hit one of your outs on the very next card. */
  nextCard: number;
  /** Chance to hit by the river (equals nextCard on the turn). */
  byRiver: number;
  cardsToCome: 1 | 2;
}

function hasStraight(ranks: Set<number>): boolean {
  for (let top = 12; top >= 4; top--) {
    let ok = true;
    for (let k = 0; k < 5; k++) if (!ranks.has(top - k)) ok = false;
    if (ok) return true;
  }
  // Wheel: A-2-3-4-5.
  return ranks.has(12) && ranks.has(0) && ranks.has(1) && ranks.has(2) && ranks.has(3);
}

/** Made-hand category for any 2..7 cards (pair-type hands only below 5 cards). */
function categoryAny(cards: Card[]): number {
  if (cards.length >= 5) return categoryOf(bestScore(cards));
  const counts = new Map<number, number>();
  for (const c of cards) counts.set(rankOf(c), (counts.get(rankOf(c)) ?? 0) + 1);
  const v = [...counts.values()].sort((a, b) => b - a);
  if (v[0] === 4) return 7;
  if (v[0] === 3) return 3;
  if (v[0] === 2 && v[1] === 2) return 2;
  if (v[0] === 2) return 1;
  return 0;
}

const PAIR_BASED = new Set([2, 3, 6, 7]); // two pair, trips, full house, quads

export function analyzeDraws(hero: [Card, Card], board: Card[]): DrawInfo | null {
  if (board.length !== 3 && board.length !== 4) return null;
  const known = [hero[0], hero[1], ...board];
  const seen = new Set(known);
  const current = categoryAny(known);
  const heroRanks = new Set([rankOf(hero[0]), rankOf(hero[1])]);

  const outs: Card[] = [];
  const counts = new Map<number, number>();
  for (let c = 0; c < 52; c++) {
    if (seen.has(c)) continue;
    const next = categoryAny([...known, c]);
    if (next <= current || next < 2) continue;
    if (next <= categoryAny([...board, c])) continue; // the board alone makes it — everyone has it
    // Pair-based improvements only count when the new card pairs one of your hole cards.
    if (PAIR_BASED.has(next) && !heroRanks.has(rankOf(c))) continue;
    outs.push(c);
    counts.set(next, (counts.get(next) ?? 0) + 1);
  }

  const draws: string[] = [];
  // Flush draw: four to a suit, at least one of them yours.
  if (current < 5) {
    for (let s = 0; s < 4; s++) {
      const n = known.filter((c) => suitOf(c) === s).length;
      const mine = hero.some((c) => suitOf(c) === s);
      if (n === 4 && mine) draws.push("Flush draw");
    }
  }
  // Straight draws: how many ranks complete a straight that the board alone doesn't make.
  if (current < 4) {
    const all = new Set(known.map(rankOf));
    const boardRanks = new Set(board.map(rankOf));
    let completing = 0;
    for (let r = 0; r < 13; r++) {
      if (all.has(r)) continue;
      const withR = new Set(all).add(r);
      const boardWithR = new Set(boardRanks).add(r);
      if (hasStraight(withR) && !hasStraight(boardWithR)) completing++;
    }
    if (completing >= 2) draws.push("Open-ended straight draw");
    else if (completing === 1) draws.push("Gutshot straight draw");
  }
  if (current === 1 && counts.size > 0 && draws.length === 0) draws.push("Improve to two pair / trips");

  const maxBoard = Math.max(...board.map(rankOf));
  const overcards = current === 0 ? hero.filter((c) => rankOf(c) > maxBoard).length : 0;

  const unseen = 52 - known.length;
  const cardsToCome: 1 | 2 = board.length === 3 ? 2 : 1;
  const o = outs.length;
  const nextCard = o / unseen;
  const byRiver = cardsToCome === 2 ? 1 - ((unseen - o) * (unseen - o - 1)) / (unseen * (unseen - 1)) : nextCard;

  const byHand = [...counts.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([cat, count]) => ({ name: CATEGORY_NAMES[cat], count }));

  return { outs, byHand, draws, overcards, unseen, nextCard, byRiver, cardsToCome };
}
