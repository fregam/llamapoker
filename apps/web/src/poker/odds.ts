/**
 * Odds helpers. formatPct (used for every percentage in the UI) and outsToEquity
 * (the rule of 2 and 4, shown next to the exact hit chance in Readout).
 * potOdds() feeds the pot odds guide's chart (views/PotOdds); the tool itself computes the
 * price in poker/analyze.ts, with the call capped at your stack.
 * Used by: components/Readout, components/Charts, poker/strategy, views/Trainer, views/PotOdds, views/Outs.
 */

export interface PotOdds {
  callAmount: number;
  potAfterCall: number;
  requiredEquity: number; // fraction you need to break even
  ratio: string; // e.g. "3.0 : 1"
}

export function potOdds(pot: number, bet: number): PotOdds {
  const callAmount = bet;
  const potAfterCall = pot + bet + callAmount;
  const requiredEquity = callAmount / potAfterCall;
  const r = bet > 0 ? (pot + bet) / callAmount : 0;
  return {
    callAmount,
    potAfterCall,
    requiredEquity,
    ratio: `${r.toFixed(1)} : 1`,
  };
}

/** Rule of 2 and 4: approximate equity from outs by remaining streets. */
export function outsToEquity(outs: number, streetsToCome: 1 | 2): number {
  const pct = streetsToCome === 2 ? outs * 4 : outs * 2;
  return Math.min(pct, 95) / 100;
}

export function formatPct(x: number, digits = 1): string {
  return (x * 100).toFixed(digits) + "%";
}
