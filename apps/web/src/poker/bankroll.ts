/**
 * Bankroll rules: how much money to keep behind the stakes you play.
 *   - Money is whole cents everywhere (parseMoney / formatMoney), so sums never drift.
 *   - BUYINS is the rule table (buy-ins to keep, by format and by how careful you are);
 *     CASH_STAKES / TOURNAMENT_STAKES are the ladders. advise() turns a bankroll into the verdict:
 *     the highest stake you are rolled for, the line to move up at and the line to move down below.
 *   - Risk of ruin is the second number, behind the verdict. Cash: the closed form
 *     exp(−2 × win rate × bankroll ÷ SD²) (cashRuin, bankrollForRuin; ruinFromResults is the same
 *     formula on any unit, used for a visitor's own sessions). Tournaments: a seeded simulation
 *     (tournamentRuin) over a simple payout model (payouts, tournamentEdge), because tournament
 *     results are too lopsided for the formula. Same inputs, same answer: no clock, no Math.random.
 * The rules and their sources are in .scratch/bankroll/spec.md; the guide explains them to readers.
 * Used by: components/BankrollCalculator, components/BankrollTracker, views/Bankroll,
 * views/BankrollGuide, views/Glossary, content/faq, poker/bankrollLog.
 */

export type Format = "cash" | "tournament";
export type Risk = "aggressive" | "standard" | "careful";

export const FORMATS: Format[] = ["cash", "tournament"];
export const RISKS: Risk[] = ["aggressive", "standard", "careful"];

/** Buy-ins to keep. A cash buy-in is 100 big blinds; a tournament buy-in includes the fee. */
export const BUYINS: Record<Format, Record<Risk, number>> = {
  cash: { aggressive: 20, standard: 30, careful: 50 },
  tournament: { aggressive: 50, standard: 100, careful: 200 },
};

/** What the page assumes about the player until they say otherwise. Shown next to the number. */
export const CASH_DEFAULTS = { winRate: 2, sd: 90 }; // bb per 100 hands
export const TOURNAMENT_DEFAULTS = { field: 100, roi: 0.1, tournaments: 1000 };

// ---- Money ----------------------------------------------------------------------------------

/**
 * "$1,250.50" → 125050. Null for anything that is not a plain, non-negative amount.
 * A comma followed by one or two last digits is a decimal comma ("12,50", "1.250,50"), as written
 * in most of Europe; commas in groups of three are thousands. Anything else with a comma is refused
 * rather than guessed at: reading "12,50" as 1,250 would be a silent hundredfold error.
 */
export function parseMoney(text: string): number | null {
  let t = text.replace(/\s/g, "").replace(/^[^\d.-]+/, "");
  if (/^(\d+|\d{1,3}(\.\d{3})+),\d{1,2}$/.test(t)) t = t.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(t)) t = t.replace(/,/g, "");
  else if (t.includes(",")) return null;
  const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(t);
  if (!m) return null;
  return Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0"));
}

/** 125050 → "$1,250.50"; whole amounts drop the cents; losses get a real minus sign. */
export function formatMoney(cents: number, symbol = "$"): string {
  const abs = Math.abs(Math.round(cents));
  const whole = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const frac = abs % 100;
  return `${cents < 0 ? "−" : ""}${symbol}${whole}${frac ? "." + String(frac).padStart(2, "0") : ""}`;
}

// ---- Stakes ---------------------------------------------------------------------------------

export interface Stake {
  /** What a player calls it: "$0.05/$0.10" or "$5 tournaments". */
  name: string;
  /** One buy-in, in cents. */
  buyIn: number;
  /** Cash only: the big blind, in cents. */
  bb?: number;
}

const BLINDS: [number, number][] = [
  [1, 2], [2, 5], [5, 10], [10, 25], [25, 50], [50, 100], [100, 200], [200, 500], [500, 1000], [1000, 2000], [2500, 5000],
];
const ENTRIES = [50, 100, 200, 300, 500, 1000, 2000, 3000, 5000, 10000, 20000, 50000, 100000];

export function stakes(format: Format, symbol = "$"): Stake[] {
  return format === "cash"
    ? BLINDS.map(([sb, bb]) => ({ name: `${formatMoney(sb, symbol)}/${formatMoney(bb, symbol)}`, buyIn: bb * 100, bb }))
    : ENTRIES.map((e) => ({ name: `${formatMoney(e, symbol)} tournaments`, buyIn: e }));
}

export const CASH_STAKES = stakes("cash");
export const TOURNAMENT_STAKES = stakes("tournament");

// ---- The verdict ----------------------------------------------------------------------------

export interface Advice {
  format: Format;
  risk: Risk;
  /** Buy-ins the rule asks for. */
  buyins: number;
  /** The highest stake the bankroll covers; null when it is under the lowest one. */
  stake: Stake | null;
  /** Buy-ins the bankroll holds at that stake (0 without one). */
  held: number;
  /** The next stake up and the bankroll that unlocks it; null at the top of the ladder. */
  next: Stake | null;
  moveUpAt: number | null;
  /** Under this bankroll the verdict drops to `lower` (null at the bottom: nothing left to drop to). */
  moveDownBelow: number | null;
  lower: Stake | null;
  /** What the lowest stake on the ladder needs. */
  needs: number;
}

/** The verdict is a function of the bankroll alone: rolled for a stake means bankroll ≥ buy-ins × its buy-in. */
export function advise(bankroll: number, format: Format, risk: Risk, symbol = "$"): Advice {
  const ladder = symbol === "$" ? (format === "cash" ? CASH_STAKES : TOURNAMENT_STAKES) : stakes(format, symbol);
  const buyins = BUYINS[format][risk];
  let i = -1;
  while (i + 1 < ladder.length && bankroll >= ladder[i + 1].buyIn * buyins) i++;
  const stake = i >= 0 ? ladder[i] : null;
  const next = i + 1 < ladder.length ? ladder[i + 1] : null;
  return {
    format,
    risk,
    buyins,
    stake,
    held: stake ? bankroll / stake.buyIn : 0,
    next,
    moveUpAt: next ? next.buyIn * buyins : null,
    moveDownBelow: stake ? stake.buyIn * buyins : null,
    lower: i > 0 ? ladder[i - 1] : null,
    needs: ladder[0].buyIn * buyins,
  };
}

// ---- Risk of ruin: cash ---------------------------------------------------------------------

/**
 * The chance of losing the whole bankroll before it grows for good, if you stay at one stake and
 * never move down. `mean` and `variance` are per any one unit (100 hands, a session), in the same
 * money unit as `bankroll`. William Chen's formula: exp(−2 × bankroll × mean ÷ variance).
 */
export function ruinFromResults(bankroll: number, mean: number, variance: number): number {
  if (bankroll <= 0 || mean <= 0) return 1;
  if (variance <= 0) return 0;
  return Math.min(1, Math.exp((-2 * bankroll * mean) / variance));
}

/** Cash: bankroll in big blinds, win rate and standard deviation in big blinds per 100 hands. */
export function cashRuin(bankrollBb: number, winRate: number, sd: number): number {
  return ruinFromResults(bankrollBb, winRate, sd * sd);
}

/** The inverse: big blinds needed to hold the risk of ruin at `target` (0–1). Infinity without an edge. */
export function bankrollForRuin(target: number, winRate: number, sd: number): number {
  if (winRate <= 0) return Infinity;
  return (-Math.log(target) * sd * sd) / (2 * winRate);
}

// ---- Risk of ruin: tournaments --------------------------------------------------------------

/** A small seeded generator (mulberry32): the same seed always gives the same run. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The share of a tournament's field that is paid, and how many players the simulation follows. */
export const PAID_SHARE = 0.15;
export const RUIN_PATHS = 2000;

/** Share of the prize pool for 1st, 2nd, …: the top PAID_SHARE are paid, each place 1 ÷ its rank. */
export function payouts(field: number): number[] {
  const paid = Math.max(1, Math.round(field * PAID_SHARE));
  const weights = Array.from({ length: paid }, (_, i) => 1 / (i + 1));
  const total = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => w / total);
}

export interface TournamentModel {
  /** Players in the tournament. */
  field: number;
  /** Return on investment: 0.1 = wins back 10% more than the buy-ins paid, fee included. */
  roi: number;
}

/**
 * One player in one tournament. An average player lands on each place 1 time in `field`; a player
 * with ROI r lands on each paid place (1 + r) times as often. The prize pool is one buy-in per
 * player (the fee is inside the ROI). `result(u)` maps a uniform number to the net result in
 * buy-ins: −1 for no cash, the prize minus the buy-in otherwise.
 */
export function tournamentEdge(m: TournamentModel) {
  const field = Math.max(2, Math.round(m.field));
  const shares = payouts(field);
  const each = Math.min((1 + Math.max(-1, m.roi)) / field, 1 / shares.length); // chance of each paid place
  const prizes = shares.map((s) => s * field - 1);
  const cashes = each * shares.length;
  return {
    cashes,
    mean: prizes.reduce((a, p) => a + each * (p + 1), 0) - 1,
    result: (u: number) => (u < cashes ? prizes[Math.min(shares.length - 1, Math.floor(u / each))] : -1),
  };
}

/**
 * The share of simulated players who can no longer pay a buy-in at some point in their next
 * `tournaments` events, starting with `buyins` buy-ins and never moving down. A finite horizon on
 * purpose: "within your next 1,000 tournaments" is a question with an answer.
 */
export function tournamentRuin(
  buyins: number,
  m: TournamentModel,
  { tournaments = TOURNAMENT_DEFAULTS.tournaments, paths = RUIN_PATHS, seed = 1 }: { tournaments?: number; paths?: number; seed?: number } = {}
): number {
  if (buyins < 1) return 1;
  const edge = tournamentEdge(m);
  let broke = 0;
  for (let p = 0; p < paths; p++) {
    // Each simulated player has their own stream, so player p meets the same results whatever the
    // bankroll: a bigger one can only last longer, and the answer never rises with more buy-ins.
    const rand = rng(seed + Math.imul(p, 0x9e3779b1));
    let b = buyins;
    for (let t = 0; t < tournaments; t++) {
      if (b < 1) {
        broke++;
        break;
      }
      b += edge.result(rand());
    }
  }
  return broke / paths;
}
