/**
 * Everything about starting-hand ranges:
 * - notation expansion: "22+", "ATs+", "JJ-99", "AJs-A9s" → hand labels ("AKs", "QQ")
 * - the 169-hand grid (gridLabel, GRID_RANKS) and combo counting (rangePercent)
 * - seat charts: RFI_TOKENS (opening ranges) and VS_RAISE_TOKENS (3-bet / call vs a
 *   raise), read through rangeFor / threeBetRange / callRange; BB_VS_LATE_TOKENS is the
 *   big blind's wider defence against a CO/BTN/SB raise (pass the raiser to the getters)
 * - raiserFromPresets: "open-BTN" opponent preset → raiser seat
 * - labelCombos / rangeCombos: labels → concrete [card, card] pairs for the simulator
 * - OPP_PRESETS: the opponent range choices shown in the Opponents dropdown
 * Seats are named by how many players act after you, so the 6-max charts also serve
 * shorter tables (PlayTool.seatsFor maps table size → available seats).
 * Used by: poker/strategy, poker/analyze, components/OpponentRanges, RangeGrid,
 * views/PlayTool, views/Trainer, poker/equity (Combo type).
 * Uses: poker/cards.
 */

import { Card, rankOf, suitOf, makeCard, RANKS } from "./cards";

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

/**
 * Expand a token into concrete labels. Supports:
 *   "99", "99+", "JJ-99"          pairs
 *   "AKs", "ATs+", "AJs-A9s"      suited / offsuit (same high card)
 */
export function expandToken(token: string): string[] {
  const out: string[] = [];

  if (token.includes("-")) {
    const [a, b] = token.split("-");
    if (a.length === 2 && a[0] === a[1]) {
      const top = rankIndex(a[0]);
      const bottom = rankIndex(b[0]);
      for (let x = Math.min(top, bottom); x <= Math.max(top, bottom); x++) out.push(RANKS[x] + RANKS[x]);
      return out;
    }
    const hi = a[0];
    const suit = a[2];
    const l1 = rankIndex(a[1]);
    const l2 = rankIndex(b[1]);
    for (let x = Math.min(l1, l2); x <= Math.max(l1, l2); x++) out.push(hi + RANKS[x] + suit);
    return out;
  }

  const hasPlus = token.endsWith("+");
  const t = hasPlus ? token.slice(0, -1) : token;

  if (t.length === 2 && t[0] === t[1]) {
    const r = rankIndex(t[0]);
    if (hasPlus) for (let x = r; x <= 12; x++) out.push(RANKS[x] + RANKS[x]);
    else out.push(t);
    return out;
  }

  const suit = t[2]; // 's' or 'o'
  const hi = rankIndex(t[0]);
  const lo = rankIndex(t[1]);
  if (hasPlus) for (let x = lo; x < hi; x++) out.push(RANKS[hi] + RANKS[x] + suit);
  else out.push(t);
  return out;
}

export function expandRange(tokens: string[]): Set<string> {
  const set = new Set<string>();
  for (const token of tokens) for (const label of expandToken(token)) set.add(label);
  return set;
}

export type Position = "UTG" | "MP" | "CO" | "BTN" | "SB" | "BB";
export const POSITIONS: Position[] = ["UTG", "MP", "CO", "BTN", "SB", "BB"];

// Approximate 6-max raise-first-in (RFI) opening ranges, tightest to widest.
// The big blind never opens — if it's folded to the BB, the hand is over.
export const RFI_TOKENS: Record<Position, string[]> = {
  UTG: ["22+", "ATs+", "KTs+", "QTs+", "JTs", "T9s", "98s", "AJo+", "KQo"],
  MP: ["22+", "A9s+", "KTs+", "QTs+", "J9s+", "T9s", "98s", "87s", "ATo+", "KJo+", "QJo"],
  CO: ["22+", "A2s+", "K9s+", "Q9s+", "J9s+", "T8s+", "97s+", "86s+", "75s+", "65s", "54s", "A8o+", "KTo+", "QTo+", "JTo"],
  BTN: ["22+", "A2s+", "K5s+", "Q8s+", "J8s+", "T8s+", "97s+", "86s+", "75s+", "64s+", "53s+", "A2o+", "K9o+", "Q9o+", "J9o+", "T9o", "98o"],
  SB: ["22+", "A2s+", "K7s+", "Q8s+", "J8s+", "T8s+", "97s+", "86s+", "75s+", "65s", "54s", "A7o+", "K9o+", "QTo+", "JTo"],
  BB: [],
};

// Simplified "facing a single raise" charts per seat. 3-bet is checked first.
export const VS_RAISE_TOKENS: Record<Position, { threeBet: string[]; call: string[] }> = {
  UTG: { threeBet: ["QQ+", "AKs", "AKo"], call: ["JJ-99", "AQs-AJs", "KQs"] },
  MP: { threeBet: ["QQ+", "AKs", "AKo", "A5s"], call: ["JJ-88", "AQs-ATs", "KQs", "KJs", "QJs", "JTs", "AQo"] },
  CO: {
    threeBet: ["JJ+", "AQs+", "AKo", "A5s-A4s"],
    call: ["TT-66", "AJs-ATs", "KQs", "KJs", "QJs", "JTs", "T9s", "98s", "AQo"],
  },
  BTN: {
    threeBet: ["JJ+", "AQs+", "AKo", "KQs", "A5s-A4s", "76s"],
    call: ["TT-22", "AJs-A9s", "KJs-KTs", "QJs-QTs", "JTs", "T9s", "98s", "87s", "65s", "AQo", "AJo", "KQo"],
  },
  SB: {
    threeBet: ["TT+", "AJs+", "AQo+", "KQs", "KJs", "A5s-A4s"],
    call: ["99-66", "ATs", "QJs", "JTs", "T9s"],
  },
  BB: {
    threeBet: ["QQ+", "AQs+", "AKo", "A5s-A4s"],
    call: [
      "JJ-22", "A2s+", "K6s+", "Q8s+", "J8s+", "T8s+", "97s+", "86s+", "75s+", "64s+", "54s",
      "A9o+", "KTo+", "QTo+", "JTo", "T9o",
    ],
  },
};

// The big blind against a late-position raise (CO, BTN or SB). Those openers raise much wider,
// and the BB already has 1bb in, so it calls 1.5bb to win about 5.5bb (needs ~27%): defend
// roughly half of all hands. Against UTG/MP raises the tighter VS_RAISE_TOKENS.BB chart applies.
export const LATE_RAISERS: Position[] = ["CO", "BTN", "SB"];
export const BB_VS_LATE_TOKENS: { threeBet: string[]; call: string[] } = {
  threeBet: ["TT+", "AJs+", "AQo+", "KQs", "A5s-A3s"],
  call: [
    "99-22", "A2s+", "K2s+", "Q4s+", "J6s+", "T6s+", "96s+", "85s+", "74s+", "63s+", "53s+", "43s",
    "A2o+", "K8o+", "Q9o+", "J8o+", "T7o+", "97o+", "86o+", "76o", "65o",
  ],
};

/** The raiser's seat when the only opponent is one seat's opening range ("open-BTN" → "BTN"). */
export function raiserFromPresets(keys: string[]): Position | undefined {
  if (keys.length !== 1 || !keys[0].startsWith("open-")) return undefined;
  const seat = keys[0].slice(5) as Position;
  return POSITIONS.includes(seat) ? seat : undefined;
}

/** True when the BB should use its wider defence chart against this raiser. */
export function bbVsLate(pos: Position, raiser?: Position): boolean {
  return pos === "BB" && raiser !== undefined && LATE_RAISERS.includes(raiser);
}

export const POSITION_DESC: Record<Position, string> = {
  UTG: "Under the Gun — first to act, play tightest.",
  MP: "Middle Position — still early, stay disciplined.",
  CO: "Cutoff — position is good, open up.",
  BTN: "Button — best seat, widest opening range.",
  SB: "Small Blind — open or fold, often raise-first-in.",
  BB: "Big Blind — you close the action, defend wide vs raises.",
};

const cache = new Map<string, Set<string>>();
function cached(key: string, tokens: string[]): Set<string> {
  let r = cache.get(key);
  if (!r) {
    r = expandRange(tokens);
    cache.set(key, r);
  }
  return r;
}

/** Opening (raise-first-in) range for a seat. Empty for the BB. */
export function rangeFor(pos: Position): Set<string> {
  return cached("rfi-" + pos, RFI_TOKENS[pos]);
}
export function threeBetRange(pos: Position, raiser?: Position): Set<string> {
  if (bbVsLate(pos, raiser)) return cached("3b-bb-late", BB_VS_LATE_TOKENS.threeBet);
  return cached("3b-" + pos, VS_RAISE_TOKENS[pos].threeBet);
}
export function callRange(pos: Position, raiser?: Position): Set<string> {
  if (bbVsLate(pos, raiser)) return cached("call-bb-late", BB_VS_LATE_TOKENS.call);
  return cached("call-" + pos, VS_RAISE_TOKENS[pos].call);
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

export type Combo = [Card, Card];

/** Every concrete two-card combo for a label ("AKs" → 4 combos). */
export function labelCombos(label: string): Combo[] {
  const hi = rankIndex(label[0]);
  const lo = rankIndex(label[1]);
  const out: Combo[] = [];
  for (let s1 = 0; s1 < 4; s1++) {
    for (let s2 = 0; s2 < 4; s2++) {
      if (label.length === 2) {
        if (s2 > s1) out.push([makeCard(hi, s1), makeCard(hi, s2)]);
      } else if (label[2] === "s") {
        if (s1 === s2) out.push([makeCard(hi, s1), makeCard(lo, s2)]);
      } else if (s1 !== s2) {
        out.push([makeCard(hi, s1), makeCard(lo, s2)]);
      }
    }
  }
  return out;
}

export function rangeCombos(range: Set<string>): Combo[] {
  const out: Combo[] = [];
  for (const label of range) out.push(...labelCombos(label));
  return out;
}

// ---------- Opponent range presets ----------

export interface RangePreset {
  key: string;
  name: string;
  /** null = any two cards. */
  range: Set<string> | null;
}

export const OPP_PRESETS: RangePreset[] = [
  { key: "random", name: "Any two cards", range: null },
  { key: "open-UTG", name: "UTG open", range: rangeFor("UTG") },
  { key: "open-MP", name: "MP open", range: rangeFor("MP") },
  { key: "open-CO", name: "CO open", range: rangeFor("CO") },
  { key: "open-BTN", name: "BTN open", range: rangeFor("BTN") },
  { key: "open-SB", name: "SB open", range: rangeFor("SB") },
  {
    key: "bb-defend",
    name: "BB defend",
    range: new Set([...threeBetRange("BB"), ...callRange("BB")]),
  },
  { key: "3bet", name: "3-bet range", range: expandRange(["TT+", "AQs+", "AKo", "KQs", "A5s-A4s"]) },
  { key: "premium", name: "Premium (QQ+, AK)", range: expandRange(["QQ+", "AKs", "AKo"]) },
];

export function presetByKey(key: string): RangePreset {
  return OPP_PRESETS.find((p) => p.key === key) ?? OPP_PRESETS[0];
}
