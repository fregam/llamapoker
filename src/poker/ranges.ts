// Preflop starting-hand notation, the 169-hand grid, and 6-max opening ranges.

import { Card, rankOf, suitOf, RANKS } from "./cards";

// Ranks ordered strongest -> weakest for grid + notation.
const ORDER = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];

/** Canonical label for a two-card holding, e.g. "AKs", "QQ", "T9o". */
export function handLabel(c1: Card, c2: Card): string {
  const r1 = rankOf(c1);
  const r2 = rankOf(c2);
  const hi = Math.max(r1, r2);
  const lo = Math.min(r1, r2);
  if (r1 === r2) return RANKS[hi] + RANKS[hi];
  const suited = suitOf(c1) === suitOf(c2);
  return RANKS[hi] + RANKS[lo] + (suited ? "s" : "o");
}

/** Label for a grid cell (row, col) using the strongest-first ordering. */
export function gridLabel(row: number, col: number): string {
  const a = ORDER[row];
  const b = ORDER[col];
  if (row === col) return RANKS[a] + RANKS[a];
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  // Upper triangle (col > row) = suited, lower = offsuit.
  return RANKS[hi] + RANKS[lo] + (col > row ? "s" : "o");
}

export const GRID_RANKS = ORDER.map((r) => RANKS[r]);

function rankIndex(ch: string): number {
  return RANKS.indexOf(ch);
}

/** Expand a token such as "22+", "ATs+", "KJo+", "T9s" into concrete labels. */
function expandToken(token: string): string[] {
  const out: string[] = [];
  const hasPlus = token.endsWith("+");
  const t = hasPlus ? token.slice(0, -1) : token;

  // Pair, e.g. "99" or "99+".
  if (t.length === 2 && t[0] === t[1]) {
    const r = rankIndex(t[0]);
    if (hasPlus) {
      for (let x = r; x <= 12; x++) out.push(RANKS[x] + RANKS[x]);
    } else {
      out.push(t);
    }
    return out;
  }

  // Suited/offsuit, e.g. "ATs", "KJo".
  const suit = t[2]; // 's' or 'o'
  const hi = rankIndex(t[0]);
  const lo = rankIndex(t[1]);
  if (hasPlus) {
    for (let x = lo; x < hi; x++) out.push(RANKS[hi] + RANKS[x] + suit);
  } else {
    out.push(t);
  }
  return out;
}

export function expandRange(tokens: string[]): Set<string> {
  const set = new Set<string>();
  for (const token of tokens) for (const label of expandToken(token)) set.add(label);
  return set;
}

export type Position = "UTG" | "MP" | "CO" | "BTN" | "SB";

// Approximate 6-max raise-first-in (RFI) opening ranges, tightest to widest.
export const RFI_TOKENS: Record<Position, string[]> = {
  UTG: ["22+", "ATs+", "KTs+", "QTs+", "JTs", "T9s", "98s", "AJo+", "KQo"],
  MP: ["22+", "A9s+", "KTs+", "QTs+", "J9s+", "T9s", "98s", "87s", "ATo+", "KJo+", "QJo"],
  CO: ["22+", "A2s+", "K9s+", "Q9s+", "J9s+", "T8s+", "97s+", "86s+", "75s+", "65s", "54s", "A8o+", "KTo+", "QTo+", "JTo"],
  BTN: ["22+", "A2s+", "K5s+", "Q8s+", "J8s+", "T8s+", "97s+", "86s+", "75s+", "64s+", "53s+", "A2o+", "K9o+", "Q9o+", "J9o+", "T9o", "98o"],
  SB: ["22+", "A2s+", "K7s+", "Q8s+", "J8s+", "T8s+", "97s+", "86s+", "75s+", "65s", "54s", "A7o+", "K9o+", "QTo+", "JTo"],
};

export const POSITIONS: Position[] = ["UTG", "MP", "CO", "BTN", "SB"];

export const POSITION_DESC: Record<Position, string> = {
  UTG: "Under the Gun — first to act, play tightest.",
  MP: "Middle Position — still early, stay disciplined.",
  CO: "Cutoff — position is good, open up.",
  BTN: "Button — best seat, widest opening range.",
  SB: "Small Blind — open or fold, often raise-first-in.",
};

const rangeCache = new Map<Position, Set<string>>();
export function rangeFor(pos: Position): Set<string> {
  let r = rangeCache.get(pos);
  if (!r) {
    r = expandRange(RFI_TOKENS[pos]);
    rangeCache.set(pos, r);
  }
  return r;
}

/** Number of combos a 169-grid label represents (pairs 6, suited 4, offsuit 12). */
export function comboCount(label: string): number {
  if (label.length === 2) return 6;
  return label.endsWith("s") ? 4 : 12;
}

/** Percentage of all 1326 combos covered by a range set. */
export function rangePercent(range: Set<string>): number {
  let combos = 0;
  for (const label of range) combos += comboCount(label);
  return (combos / 1326) * 100;
}
