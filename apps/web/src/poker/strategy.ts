/**
 * The decision rules. recommend(RecoInput) → Recommendation { action, tone, choice,
 * reason }.
 * - Preflop: seat charts from poker/ranges (open / 3-bet / call / fold; the BB checks
 *   its option when unopened).
 * - Postflop: equity vs a fair share (1 ÷ players) and vs the pot-odds price, plus made
 *   hand, real outs (from poker/draws), SPR (commitment) and implied odds.
 * `choice` (fold / check / call / raise) is what the Trainer grades against; `tone`
 * picks the verdict colour in Readout. Documented for users on views/Strategy.tsx.
 * Called only through poker/analyze.ts.
 * Uses: poker/ranges, poker/odds, poker/draws (types).
 */

import { formatPct } from "./odds";
import type { DrawInfo } from "./draws";
import { Position, rangeFor, threeBetRange, callRange } from "./ranges";

export type ActionTone = "aggressive" | "call" | "passive" | "fold";
/** The basic decision — what the trainer grades you on. */
export type Choice = "fold" | "check" | "call" | "raise";

export interface Recommendation {
  action: string;
  tone: ActionTone;
  choice: Choice;
  reason: string;
}

export interface RecoInput {
  street: number; // 0 preflop, 1 flop, 2 turn, 3 river
  position: Position;
  hand: string; // e.g. "AKs"
  facingBet: boolean;
  equity: number; // overall equity share (0..1)
  opponents: number;
  requiredEquity: number; // pot-odds break-even (0 when not facing a bet)
  madeCategory: number | null; // 0..8, or null preflop
  draws: DrawInfo | null;
  spr: number; // effective stack ÷ pot
  allIn: boolean; // calling puts you all-in
  impliedOk: boolean; // future winnings can cover a short price
}

export function recommend(i: RecoInput): Recommendation {
  if (i.street === 0) return preflop(i);
  return postflop(i);
}

function preflop(i: RecoInput): Recommendation {
  const eqTxt = formatPct(i.equity);
  if (i.facingBet) {
    if (threeBetRange(i.position).has(i.hand))
      return {
        action: "Re-raise (3-bet)",
        tone: "aggressive",
        choice: "raise",
        reason: `${i.hand} is in the ${i.position} 3-bet range. Re-raise to build the pot and take the initiative (${eqTxt} vs their range).`,
      };
    if (callRange(i.position).has(i.hand))
      return {
        action: "Call",
        tone: "call",
        choice: "call",
        reason: `${i.hand} is in the ${i.position} calling range vs a raise — call and see a flop (${eqTxt} vs their range).`,
      };
    return {
      action: "Fold",
      tone: "fold",
      choice: "fold",
      reason: `${i.hand} isn't in the ${i.position} continuing range vs a raise. Fold and wait for a better spot.`,
    };
  }

  if (i.position === "BB") {
    if (threeBetRange("BB").has(i.hand))
      return {
        action: "Raise",
        tone: "aggressive",
        choice: "raise",
        reason: `Limped to you with a premium hand (${i.hand}). Raise for value instead of checking.`,
      };
    return {
      action: "Check",
      tone: "passive",
      choice: "check",
      reason: `Nobody raised and you're in the big blind — take the free flop with ${i.hand}.`,
    };
  }

  if (rangeFor(i.position).has(i.hand))
    return {
      action: "Open-raise",
      tone: "aggressive",
      choice: "raise",
      reason: `${i.hand} is in ${i.position}'s opening range — raise first in rather than limp.`,
    };
  return {
    action: "Fold",
    tone: "fold",
    choice: "fold",
    reason: `${i.hand} is outside ${i.position}'s opening range. Folding here is the disciplined, profitable play.`,
  };
}

function postflop(i: RecoInput): Recommendation {
  const players = i.opponents + 1;
  const fair = 1 / players; // equity of an average hand in the pot
  const eq = i.equity;
  const ahead = eq >= fair + 0.08;
  const wellAhead = eq >= fair + 0.25;
  const eqTxt = formatPct(eq);
  const cat = i.madeCategory ?? 0;
  const strongMade = cat >= 2 && eq >= fair; // two pair+ that isn't just the board
  const outs = i.street < 3 ? i.draws?.outs.length ?? 0 : 0;
  const drawName = i.draws?.draws[0]?.toLowerCase() ?? "draw";
  const strongDraw = outs >= 8;
  const anyDraw = outs >= 4;
  const committed = i.spr <= 2.5; // little left behind relative to the pot
  const outsTxt = `${outs} outs (${drawName})`;

  if (i.facingBet) {
    if (eq >= i.requiredEquity) {
      if ((wellAhead || strongMade) && !i.allIn)
        return {
          action: committed ? "Raise all-in" : "Raise for value",
          tone: "aggressive",
          choice: "raise",
          reason: committed
            ? `You're well ahead (${eqTxt}) and the stack is small vs the pot (SPR ${i.spr.toFixed(1)}) — get it all in now.`
            : `You're well ahead (${eqTxt}). Raise to get value from worse hands and deny equity.`,
        };
      if (strongDraw && !i.allIn && !committed && i.street === 1)
        return {
          action: "Raise (semi-bluff)",
          tone: "aggressive",
          choice: "raise",
          reason: `${eqTxt} equity with ${outsTxt}. Raising can win now and you still have two cards to hit.`,
        };
      return {
        action: i.allIn ? "Call all-in" : "Call",
        tone: "call",
        choice: "call",
        reason: `${eqTxt} equity clears the ${formatPct(i.requiredEquity)} you need — calling is +EV.`,
      };
    }
    // Below the price: only continue with a real draw and enough money left to win later.
    if (anyDraw && i.impliedOk && !i.allIn)
      return {
        action: "Call (implied odds)",
        tone: "call",
        choice: "call",
        reason: `Short of the ${formatPct(i.requiredEquity)} price, but ${outsTxt} and enough chips behind to get paid when you hit.`,
      };
    return {
      action: "Fold",
      tone: "fold",
      choice: "fold",
      reason:
        anyDraw && !i.allIn
          ? `${eqTxt} is below the ${formatPct(i.requiredEquity)} you need, and there isn't enough left in the stacks to make the draw pay. Fold.`
          : `${eqTxt} equity is below the ${formatPct(i.requiredEquity)} you need to call. Fold.`,
    };
  }

  // No bet — checked to you / you're first to act.
  if (wellAhead || strongMade)
    return {
      action: committed ? "Bet / shove" : "Bet for value",
      tone: "aggressive",
      choice: "raise",
      reason: committed
        ? `Strong hand (${eqTxt}) and a low SPR (${i.spr.toFixed(1)}) — you're committed, so bet big or all-in.`
        : `Strong hand (${eqTxt}). Bet to grow the pot while you're ahead.`,
    };
  if (strongDraw)
    return {
      action: "Bet (semi-bluff)",
      tone: "aggressive",
      choice: "raise",
      reason: `Not made yet, but ${outsTxt} gives you ${eqTxt}. Betting can win it now or improve later.`,
    };
  if (ahead && i.street === 3)
    return {
      action: "Thin value bet",
      tone: "aggressive",
      choice: "raise",
      reason: `Likely best (${eqTxt}) with no cards to come — a small bet earns thin value.`,
    };
  if (ahead)
    return {
      action: "Check / pot control",
      tone: "passive",
      choice: "check",
      reason: `Marginal edge (${eqTxt}). Check to keep the pot small and avoid tough spots.`,
    };
  return {
    action: cat === 1 ? "Check / give up" : "Check / fold to pressure",
    tone: "passive",
    choice: "check",
    reason: anyDraw
      ? `Behind (${eqTxt}) with only ${outsTxt}. Check and see a free card.`
      : `Behind here (${eqTxt}). Check; don't put more in without improvement.`,
  };
}
