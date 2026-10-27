// 5- and 7-card hand evaluation.
// evaluate5 returns a single comparable integer: higher == stronger.
// Encoding: category in the high digits, then up to 5 tie-break ranks.

import { Card, rankOf, suitOf } from "./cards";

export const CATEGORY_NAMES = [
  "High Card",
  "Pair",
  "Two Pair",
  "Three of a Kind",
  "Straight",
  "Flush",
  "Full House",
  "Four of a Kind",
  "Straight Flush",
];

const BASE = 15;

function score(category: number, tiebreakers: number[]): number {
  // Pack: category first, then up to 5 tiebreakers, base-15.
  let s = category;
  for (let i = 0; i < 5; i++) {
    s = s * BASE + (tiebreakers[i] ?? 0);
  }
  return s;
}

/** Evaluate exactly 5 cards. */
export function evaluate5(cards: Card[]): number {
  const ranks = cards.map(rankOf).sort((a, b) => b - a); // 0..12 desc
  const suits = cards.map(suitOf);

  const isFlush = suits[0] === suits[1] && suits[1] === suits[2] && suits[2] === suits[3] && suits[3] === suits[4];

  // Straight detection on unique ranks.
  const uniq = [...new Set(ranks)];
  let straightHigh = -1;
  if (uniq.length === 5) {
    if (uniq[0] - uniq[4] === 4) {
      straightHigh = uniq[0];
    } else if (uniq[0] === 12 && uniq[1] === 3 && uniq[2] === 2 && uniq[3] === 1 && uniq[4] === 0) {
      // Wheel: A-2-3-4-5, ace plays low. High card is the 5 (rank index 3).
      straightHigh = 3;
    }
  }

  // Rank multiplicities.
  const counts = new Map<number, number>();
  for (const r of ranks) counts.set(r, (counts.get(r) ?? 0) + 1);
  // groups: [count, rank] sorted by count desc, then rank desc.
  const groups = [...counts.entries()]
    .map(([r, c]) => [c, r] as [number, number])
    .sort((a, b) => b[0] - a[0] || b[1] - a[1]);
  const pattern = groups.map((g) => g[0]).join("");

  if (straightHigh >= 0 && isFlush) return score(8, [straightHigh]);
  if (pattern === "41") return score(7, [groups[0][1], groups[1][1]]);
  if (pattern === "32") return score(6, [groups[0][1], groups[1][1]]);
  if (isFlush) return score(5, ranks);
  if (straightHigh >= 0) return score(4, [straightHigh]);
  if (pattern === "311") return score(3, [groups[0][1], groups[1][1], groups[2][1]]);
  if (pattern === "221") return score(2, [groups[0][1], groups[1][1], groups[2][1]]);
  if (pattern === "2111") return score(1, [groups[0][1], groups[1][1], groups[2][1], groups[3][1]]);
  return score(0, ranks);
}

// The 21 combinations of choosing 5 cards from 7.
const C7x5: number[][] = (() => {
  const out: number[][] = [];
  for (let a = 0; a < 7; a++)
    for (let b = a + 1; b < 7; b++)
      for (let c = b + 1; c < 7; c++)
        for (let d = c + 1; d < 7; d++)
          for (let e = d + 1; e < 7; e++) out.push([a, b, c, d, e]);
  return out;
})();

const FIVE: Card[] = [0, 0, 0, 0, 0];

/** Best 5-card score out of 7 cards. */
export function evaluate7(cards: Card[]): number {
  let best = -1;
  for (let i = 0; i < C7x5.length; i++) {
    const idx = C7x5[i];
    FIVE[0] = cards[idx[0]];
    FIVE[1] = cards[idx[1]];
    FIVE[2] = cards[idx[2]];
    FIVE[3] = cards[idx[3]];
    FIVE[4] = cards[idx[4]];
    const s = evaluate5(FIVE);
    if (s > best) best = s;
  }
  return best;
}

/** Category index (0..8) from a packed score. */
export function categoryOf(scoreValue: number): number {
  return Math.floor(scoreValue / Math.pow(BASE, 5));
}

export function categoryName(scoreValue: number): string {
  return CATEGORY_NAMES[categoryOf(scoreValue)];
}

/** Best made hand for any number of cards (2..7), used for naming. */
export function bestScore(cards: Card[]): number {
  if (cards.length < 5) return -1;
  if (cards.length === 5) return evaluate5(cards);
  if (cards.length === 7) return evaluate7(cards);
  // 6 cards: choose 5 of 6.
  let best = -1;
  for (let skip = 0; skip < cards.length; skip++) {
    const five = cards.filter((_, i) => i !== skip);
    const s = evaluate5(five);
    if (s > best) best = s;
  }
  return best;
}
