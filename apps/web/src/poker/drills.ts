/**
 * Single-spot generators for the Trainer's drills (everything except "Full hand",
 * which lives in poker/handPlay.ts).
 *   randomSpot({ street?, facing? })  realistic one-decision spots; the options pin a
 *                                     street or force "facing a bet" (Preflop and
 *                                     Call-or-fold drills use them)
 *   outsSpot()                        a flop or turn, usually with a draw, for
 *                                     "Count the outs"
 *   optionsFor(spot)                  which answers make sense (fold/check/call/raise)
 * Opponents are returned as OPP_PRESETS keys; the Trainer turns them into combos.
 * Used by: views/Trainer.tsx.
 * Uses: poker/cards, poker/ranges, poker/draws, poker/analyze (Spot type),
 * poker/strategy (Choice type).
 */

import { Card, remainingDeck, shuffle } from "./cards";
import { POSITIONS, Position, rangeCombos, rangeFor } from "./ranges";
import { analyzeDraws } from "./draws";
import type { Spot } from "./analyze";
import type { Choice } from "./strategy";

export interface DrillSpot {
  spot: Spot;
  oppPresets: string[];
  story: string;
}

const pick = <T,>(xs: T[]): T => xs[(Math.random() * xs.length) | 0];
const rint = (lo: number, hi: number) => lo + ((Math.random() * (hi - lo + 1)) | 0);
const POSTFLOP_RANGES = ["open-UTG", "open-MP", "open-CO", "open-BTN", "bb-defend"];

export function randomSpot(opts: { street?: number; facing?: boolean } = {}): DrillSpot {
  // ~35% preflop, the rest spread over flop / turn / river, unless a street is pinned.
  const r = Math.random();
  const street = opts.street ?? (r < 0.35 ? 0 : r < 0.65 ? 1 : r < 0.86 ? 2 : 3);

  if (street === 0) {
    const position = pick(POSITIONS);
    const idx = POSITIONS.indexOf(position);
    const facing =
      opts.facing ?? (position === "UTG" ? false : position === "BB" ? Math.random() < 0.85 : Math.random() < 0.5);
    const hero = shuffle(remainingDeck([])).slice(0, 2) as [Card, Card];

    if (facing && position !== "UTG") {
      const opener = pick(POSITIONS.slice(0, Math.min(idx, 5)));
      // Raise to 2.5bb; blinds already posted. pot + bet + call = everything after you call.
      const call = position === "SB" ? 2 : position === "BB" ? 1.5 : 2.5;
      return {
        spot: { hero, board: [], position, facingBet: true, pot: 4 - call, bet: call, stack: 100, opponents: 1 },
        oppPresets: ["open-" + opener],
        story: `${opener} raises to 2.5bb, everyone else folds. You're in the ${position}.`,
      };
    }
    if (position === "BB") {
      return {
        spot: { hero, board: [], position, facingBet: false, pot: 3, bet: 0, stack: 100, opponents: 1 },
        oppPresets: ["random"],
        story: "One player limps, the small blind folds. You're in the big blind.",
      };
    }
    return {
      spot: { hero, board: [], position, facingBet: false, pot: 1.5, bet: 0, stack: 100, opponents: 1 },
      oppPresets: ["random"],
      story: `Folded to you in the ${position}.`,
    };
  }

  // Postflop: you hold a hand you'd plausibly play, against realistic ranges.
  const position = pick<Position>(["BTN", "CO", "MP", "SB", "BB"]);
  const opponents = Math.random() < 0.75 ? 1 : 2;
  const oppPresets = Array.from({ length: opponents }, () => pick(POSTFLOP_RANGES));
  const hero = pick(rangeCombos(rangeFor("BTN"))) as [Card, Card];
  const board = shuffle(remainingDeck(hero)).slice(0, street + 2);
  const pot = rint(6, 30);
  const stack = rint(15, 120);
  const facing = opts.facing ?? Math.random() < 0.55;
  const bet = facing ? Math.max(1, Math.round(pot * pick([0.33, 0.5, 0.75, 1]))) : 0;
  const who = opponents === 1 ? "Your opponent" : "An opponent";
  return {
    spot: { hero, board, position, facingBet: facing, pot, bet, stack, opponents },
    oppPresets,
    story: facing ? `${who} bets ${bet}bb into ${pot}bb.` : `It's checked to you. Pot ${pot}bb.`,
  };
}

/** A flop or turn for counting outs — three times in four you have at least one. */
export function outsSpot(): DrillSpot {
  const wantDraw = Math.random() < 0.75;
  for (let tries = 0; tries < 200; tries++) {
    const s = randomSpot({ street: Math.random() < 0.6 ? 1 : 2, facing: false });
    const d = analyzeDraws(s.spot.hero, s.spot.board);
    const n = d?.outs.length ?? 0;
    if (wantDraw ? n > 0 : true) return { ...s, story: "How many outs do you have?" };
  }
  return { ...randomSpot({ street: 1, facing: false }), story: "How many outs do you have?" };
}

export function optionsFor(s: Spot): Choice[] {
  if (s.facingBet && s.bet > 0) return ["fold", "call", "raise"];
  if (s.board.length === 0) return s.position === "BB" ? ["check", "raise"] : ["fold", "raise"];
  return ["check", "raise"];
}
