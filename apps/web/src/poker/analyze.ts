/**
 * The single place that turns a situation into everything the UI shows.
 * analyzeSpot(Spot, EquityResult | null) → Analysis: street, hand label, what calling
 * costs (capped at your stack), pot-odds price, all-in flag, SPR, made hand, draws,
 * implied odds, and the recommendation (via strategy.recommend).
 * Both the live tool and the Trainer call this, so they always agree.
 * Used by: views/PlayTool, views/Trainer, components/Readout (types).
 * Uses: poker/cards, poker/evaluator, poker/equity (types), poker/draws,
 * poker/ranges, poker/strategy.
 */

import { Card } from "./cards";
import { bestScore, categoryOf } from "./evaluator";
import { EquityResult } from "./equity";
import { analyzeDraws, DrawInfo } from "./draws";
import { handLabel, Position } from "./ranges";
import { recommend, Recommendation } from "./strategy";

export interface Spot {
  hero: [Card, Card];
  board: Card[];
  position: Position;
  raiser?: Position; // preflop raiser's seat, when known
  facingBet: boolean;
  pot: number; // pot before the bet you're facing
  bet: number; // the bet to call
  stack: number; // effective stack (what you have left behind)
  opponents: number;
}

export interface Implied {
  /** Extra you'd need to win on later streets when you hit, for the call to break even. */
  extraNeeded: number;
  /** What's realistically winnable: half of what's left behind after calling. */
  winnable: number;
  ok: boolean;
}

export interface Analysis {
  street: number;
  hand: string;
  call: number; // what calling actually costs (capped at your stack)
  requiredEquity: number;
  ratio: string;
  allIn: boolean;
  spr: number;
  madeCategory: number | null;
  draws: DrawInfo | null;
  implied: Implied | null;
  reco: Recommendation | null;
}

export function streetOf(boardLen: number): number {
  return boardLen === 0 ? 0 : boardLen === 3 ? 1 : boardLen === 4 ? 2 : 3;
}

export function analyzeSpot(s: Spot, result: EquityResult | null): Analysis {
  const street = streetOf(s.board.length);
  const hand = handLabel(s.hero[0], s.hero[1]);
  const facing = s.facingBet && s.bet > 0;
  const call = facing ? Math.max(0, Math.min(s.bet, s.stack)) : 0;
  const finalPot = s.pot + s.bet + call;
  const requiredEquity = facing && finalPot > 0 ? call / finalPot : 0;
  const ratio = facing && call > 0 ? `${((s.pot + s.bet) / call).toFixed(1)} : 1` : "—";
  const allIn = facing && s.bet >= s.stack;
  const spr = s.pot > 0 ? s.stack / s.pot : Infinity;
  const madeCategory = street > 0 ? categoryOf(bestScore([s.hero[0], s.hero[1], ...s.board])) : null;
  const draws = analyzeDraws(s.hero, s.board);

  // Implied odds: EV(call) = p·(pot + bet + X) − (1 − p)·call ≥ 0, with p = next-card hit chance.
  let implied: Implied | null = null;
  if (facing && draws && draws.outs.length > 0 && result && result.equity < requiredEquity) {
    const p = draws.nextCard;
    const extraNeeded = Math.max(0, (call * (1 - p)) / p - (s.pot + s.bet));
    const winnable = Math.max(0, (s.stack - call) * 0.5);
    implied = { extraNeeded, winnable, ok: extraNeeded <= winnable };
  }

  const reco = result
    ? recommend({
        street,
        position: s.position,
        raiser: s.raiser,
        hand,
        facingBet: facing,
        equity: result.equity,
        opponents: s.opponents,
        requiredEquity,
        madeCategory,
        draws,
        spr,
        allIn,
        impliedOk: implied?.ok ?? false,
      })
    : null;

  return { street, hand, call, requiredEquity, ratio, allIn, spr, madeCategory, draws, implied, reco };
}
