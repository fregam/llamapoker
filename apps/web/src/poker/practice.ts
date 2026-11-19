/**
 * The Trainer's practice bankroll: play money that carries over between visits, so moving up and
 * down the stakes can be practised with nothing at risk. Kept in localStorage under
 * "llamapoker.practice.v1" (guarded, as poker/stats.ts).
 *   - It starts at PRACTICE_START on the lowest cash stake and follows the same standard buy-in
 *     rule as the bankroll calculator (poker/bankroll.advise).
 *   - playHand() turns a full hand's result (big blinds, from poker/handPlay) into play money at
 *     the stake being played.
 *   - Moving up is the player's choice, offered only once the bankroll reaches the line for the
 *     next stake. Moving down is also their choice: staying under the line is the mistake this
 *     exists to practise, so the Trainer says so and counts the hands, but does not force it.
 *     Two things are forced: a bankroll that cannot cover one buy-in drops a stake, and one that
 *     cannot cover a buy-in at the lowest stake is a bust (counted, then a fresh start).
 * Everything except loadPractice / savePractice is pure.
 * Used by: views/Trainer.
 * Uses: poker/bankroll (CASH_STAKES, BUYINS).
 */

import { BUYINS, CASH_STAKES, Stake } from "./bankroll";

export interface Practice {
  v: 1;
  /** Play money, in cents. */
  bankroll: number;
  /** Index into CASH_STAKES. */
  stake: number;
  /** Full hands played with this bankroll, and how many of them under the line for the stake. */
  hands: number;
  under: number;
  /** The highest stake reached, and how many times the bankroll went bust. */
  best: number;
  busts: number;
}

/** $100 of play money: 50 buy-ins at the lowest stake, 20 short of the line for the next one. */
export const PRACTICE_START = 10000;
const KEEP = BUYINS.cash.standard;
const KEY = "llamapoker.practice.v1";

export const emptyPractice = (busts = 0): Practice => ({ v: 1, bankroll: PRACTICE_START, stake: 0, hands: 0, under: 0, best: 0, busts });

export function loadPractice(): Practice {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? "null");
    const whole = (n: unknown) => Number.isInteger(n) && (n as number) >= 0;
    if (p?.v !== 1 || !Number.isInteger(p.bankroll) || !whole(p.stake) || p.stake >= CASH_STAKES.length) return emptyPractice();
    return { v: 1, bankroll: p.bankroll, stake: p.stake, hands: whole(p.hands) ? p.hands : 0, under: whole(p.under) ? p.under : 0, best: whole(p.best) ? p.best : p.stake, busts: whole(p.busts) ? p.busts : 0 };
  } catch {
    return emptyPractice();
  }
}

export function savePractice(p: Practice): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // Storage unavailable: the practice bankroll lasts for this visit only.
  }
}

export interface PracticeStatus {
  stake: Stake;
  /** Buy-ins the bankroll holds at the stake being played. */
  held: number;
  /** The bankroll the rule asks for at this stake; under it, the rule says move down. */
  line: number;
  underLine: boolean;
  /** The stake below, if there is one to move down to. */
  lower: Stake | null;
  /** The next stake and the bankroll that unlocks it; null at the top. */
  next: Stake | null;
  moveUpAt: number | null;
  canMoveUp: boolean;
}

export function practiceStatus(p: Practice): PracticeStatus {
  const stake = CASH_STAKES[p.stake];
  const next = CASH_STAKES[p.stake + 1] ?? null;
  const line = stake.buyIn * KEEP;
  const moveUpAt = next ? next.buyIn * KEEP : null;
  return {
    stake,
    held: p.bankroll / stake.buyIn,
    line,
    // On the lowest stake there is nowhere to move down to, so the line asks nothing.
    underLine: p.stake > 0 && p.bankroll < line,
    lower: p.stake > 0 ? CASH_STAKES[p.stake - 1] : null,
    next,
    moveUpAt,
    canMoveUp: moveUpAt !== null && p.bankroll >= moveUpAt,
  };
}

export interface HandOutcome {
  practice: Practice;
  /** What the hand did to the bankroll, in cents of play money. */
  change: number;
  /** The stake the hand was played at. */
  stake: Stake;
  /** The bankroll could no longer cover a buy-in here, so the stake dropped. */
  droppedTo: Stake | null;
  /** Not even a buy-in at the lowest stake was left: counted, and the bankroll starts again. */
  bust: boolean;
}

/** Applies one finished full hand: `netBb` is the result in big blinds (handPlay's heroNet). */
export function playHand(p: Practice, netBb: number): HandOutcome {
  const stake = CASH_STAKES[p.stake];
  const change = Math.round(netBb * stake.bb!);
  const bankroll = p.bankroll + change;
  const played = { ...p, bankroll, hands: p.hands + 1, under: p.under + (practiceStatus(p).underLine ? 1 : 0) };
  if (bankroll < CASH_STAKES[0].buyIn) return { practice: emptyPractice(p.busts + 1), change, stake, droppedTo: null, bust: true };
  let i = p.stake;
  while (i > 0 && bankroll < CASH_STAKES[i].buyIn) i--;
  return { practice: { ...played, stake: i }, change, stake, droppedTo: i < p.stake ? CASH_STAKES[i] : null, bust: false };
}

/** Takes the shot at the next stake, if the bankroll has reached its line. */
export function moveUp(p: Practice): Practice {
  if (!practiceStatus(p).canMoveUp) return p;
  return { ...p, stake: p.stake + 1, best: Math.max(p.best, p.stake + 1) };
}

export function moveDown(p: Practice): Practice {
  return p.stake > 0 ? { ...p, stake: p.stake - 1 } : p;
}
