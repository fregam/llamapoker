// Turns the situation (position, equity, made hand, pot odds) into a single
// recommended action, using standard street-by-street strategy heuristics.

import { formatPct } from "./odds";

export type ActionTone = "aggressive" | "call" | "passive" | "fold";

export interface Recommendation {
  action: string;
  tone: ActionTone;
  reason: string;
}

export interface RecoInput {
  street: number; // 0 preflop, 1 flop, 2 turn, 3 river
  inRange: boolean; // hand is in the position's opening range (preflop)
  equity: number; // overall equity share (0..1)
  opponents: number;
  facingBet: boolean; // is there a bet to call?
  requiredEquity: number; // pot-odds break-even
  madeCategory: number | null; // 0..8, or null preflop
  position: string;
}

export function recommend(i: RecoInput): Recommendation {
  const players = i.opponents + 1;
  const fair = 1 / players; // equity of an average hand in the pot
  const eq = i.equity;
  const ahead = eq >= fair + 0.08;
  const wellAhead = eq >= fair + 0.25;
  const eqTxt = formatPct(eq);

  // ---------- Preflop ----------
  if (i.street === 0) {
    const premium = eq >= fair + 0.22;
    if (i.facingBet) {
      if (premium)
        return {
          action: "Re-raise (3-bet)",
          tone: "aggressive",
          reason: `Premium hand — ${eqTxt} equity. Re-raise to build the pot and isolate.`,
        };
      if (i.inRange && eq >= i.requiredEquity)
        return {
          action: "Call",
          tone: "call",
          reason: `Playable from ${i.position} and ${eqTxt} equity beats the price — call and see a flop.`,
        };
      return {
        action: "Fold",
        tone: "fold",
        reason: `Not strong enough to continue against a raise from ${i.position}.`,
      };
    }
    // No bet yet — it's your decision to open.
    if (i.inRange)
      return {
        action: "Open-raise",
        tone: "aggressive",
        reason: `In ${i.position}'s opening range — raise first in rather than limp.`,
      };
    return {
      action: "Fold",
      tone: "fold",
      reason: `Outside ${i.position}'s opening range. Folding here is the disciplined, profitable play.`,
    };
  }

  // ---------- Postflop ----------
  const strongMade = (i.madeCategory ?? 0) >= 2; // two pair or better
  const madePair = i.madeCategory === 1;
  const hasDraw = i.street < 3 && !strongMade && eq >= Math.max(i.requiredEquity, fair);

  if (i.facingBet) {
    if (eq >= i.requiredEquity) {
      if (wellAhead || strongMade)
        return {
          action: "Raise for value",
          tone: "aggressive",
          reason: `You're well ahead (${eqTxt}). Raise to get value from worse hands and deny equity.`,
        };
      return {
        action: "Call",
        tone: "call",
        reason: `${eqTxt} equity clears the ${formatPct(i.requiredEquity)} you need — calling is +EV.`,
      };
    }
    // Below the price: only continue with a real draw and implied odds.
    if (hasDraw && eq >= i.requiredEquity * 0.85)
      return {
        action: "Call (drawing)",
        tone: "call",
        reason: `Just short of the price, but with a draw and implied odds a call is defensible.`,
      };
    return {
      action: "Fold",
      tone: "fold",
      reason: `${eqTxt} equity is below the ${formatPct(i.requiredEquity)} you need to call. Fold.`,
    };
  }

  // No bet — checked to you / you're first to act.
  if (wellAhead || strongMade)
    return {
      action: "Bet for value",
      tone: "aggressive",
      reason: `Strong hand (${eqTxt}). Bet to grow the pot while you're ahead.`,
    };
  if (hasDraw)
    return {
      action: "Bet (semi-bluff)",
      tone: "aggressive",
      reason: `Weak now but lots of equity (${eqTxt}). Betting can win it outright or improve later.`,
    };
  if (ahead && i.street === 3)
    return {
      action: "Thin value bet",
      tone: "aggressive",
      reason: `Likely best (${eqTxt}) with no cards to come — a small bet earns thin value.`,
    };
  if (ahead)
    return {
      action: "Check / pot control",
      tone: "passive",
      reason: `Marginal edge (${eqTxt}). Check to keep the pot small and avoid tough spots.`,
    };
  return {
    action: madePair ? "Check / give up" : "Check / fold to pressure",
    tone: "passive",
    reason: `Behind here (${eqTxt}). Check; don't put more in without improvement.`,
  };
}
