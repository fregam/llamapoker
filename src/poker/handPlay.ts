/**
 * The Trainer's "Full hand" engine: one hand played street by street against a
 * single opponent ("villain") who holds real cards from a realistic range.
 * Pure state machine — no React, no rendering:
 *   dealHand()                 → a fresh HandState (seat, hole cards, villain cards,
 *                                the whole runout dealt up front, the preflop action)
 *   spotOf(hand)               → the Spot to grade (fed to useEquity + analyzeSpot)
 *   applyChoice(hand, choice)  → the next HandState: pot / stack bookkeeping, the
 *                                villain's response, the next street's action, and
 *                                finally the showdown or a fold.
 * The villain's play is simple on purpose: they continue with a pair or better that
 * uses a hole card or a strong draw, and bet more often when strong.
 * Chips are in big blinds, rounded to 0.5.
 * Used by: views/Trainer.tsx.
 * Uses: poker/cards, poker/evaluator, poker/ranges, poker/draws, poker/analyze (Spot type),
 * poker/strategy (Choice type).
 */

import { Card, RANKS, SUIT_SYMBOL, rankOf, suitOf, remainingDeck, shuffle } from "./cards";
import { bestScore, categoryOf, categoryName, CATEGORY_NAMES } from "./evaluator";
import { POSITIONS, Position, presetByKey, rangeCombos, handLabel } from "./ranges";
import { analyzeDraws } from "./draws";
import type { Spot } from "./analyze";
import type { Choice } from "./strategy";

export interface HandEvent {
  street: number; // 0 preflop … 3 river
  text: string;
}

export interface HandOver {
  result: "hero-fold" | "villain-fold" | "showdown";
  /** Your profit or loss for the hand, in big blinds. */
  heroNet: number;
  text: string;
}

export interface HandState {
  id: number;
  position: Position;
  hero: [Card, Card];
  villainSeat: string;
  villainPreset: string; // OPP_PRESETS key the villain was dealt from
  villain: [Card, Card];
  runout: Card[]; // all five board cards, revealed street by street
  street: number;
  pot: number; // pot before the bet you're facing
  bet: number; // the bet you face (0 = unopened / checked to you)
  stack: number; // what you have left behind
  invested: number; // what you've put in this hand (for the result)
  heroAggressor: boolean; // you made the last raise preflop
  log: HandEvent[];
  over: HandOver | null;
}

const STREETS = ["Preflop", "Flop", "Turn", "River"];
const START_STACK = 100;
const OPEN_TO = 2.5;
const THREE_BET_TO = 8.5;

const half = (x: number) => Math.round(x * 2) / 2;
const pick = <T,>(xs: T[]): T => xs[(Math.random() * xs.length) | 0];
const bb = (x: number) => `${Number.isInteger(x) ? x : x.toFixed(1)}bb`;

/** "K♠" style label for story text. */
export function pretty(c: Card): string {
  const r = RANKS[rankOf(c)];
  return (r === "T" ? "10" : r) + SUIT_SYMBOL[suitOf(c)];
}

let nextId = 1;

export function boardOf(h: HandState): Card[] {
  return h.street === 0 ? [] : h.runout.slice(0, h.street + 2);
}

export function spotOf(h: HandState): Spot {
  return {
    hero: h.hero,
    board: boardOf(h),
    position: h.position,
    facingBet: h.bet > 0,
    pot: h.pot,
    bet: h.bet,
    stack: h.stack,
    opponents: 1,
  };
}

/** Which answers make sense right now. */
export function optionsOf(h: HandState): Choice[] {
  if (h.bet > 0) return ["fold", "call", "raise"];
  if (h.street === 0) return ["fold", "raise"]; // unopened preflop: open or fold
  return ["check", "raise"];
}

// ---------- Villain logic ----------

/** Made-hand category that actually uses a hole card (0 if the board does all the work). */
function madeWithHole(hole: [Card, Card], board: Card[]): number {
  if (board.length < 3) return 0;
  const cat = categoryOf(bestScore([...hole, ...board]));
  let boardCat = 0;
  if (board.length >= 5) boardCat = categoryOf(bestScore(board));
  else {
    const counts = new Map<number, number>();
    for (const c of board) counts.set(rankOf(c), (counts.get(rankOf(c)) ?? 0) + 1);
    const v = [...counts.values()].sort((a, b) => b - a);
    boardCat = v[0] === 3 ? 3 : v[0] === 2 && v[1] === 2 ? 2 : v[0] === 2 ? 1 : 0;
  }
  return cat > boardCat ? cat : 0;
}

function villainContinues(h: HandState, board: Card[]): boolean {
  if (board.length === 0) {
    const label = handLabel(h.villain[0], h.villain[1]);
    return presetByKey("3bet").range!.has(label) || presetByKey("premium").range!.has(label);
  }
  if (madeWithHole(h.villain, board) >= 1) return true;
  const d = analyzeDraws(h.villain, board);
  return (d?.outs.length ?? 0) >= 8;
}

/** The villain's action at the start of a street (they act first). */
function villainActs(h: HandState): HandState {
  const board = boardOf(h);
  const strength = madeWithHole(h.villain, board);
  let pBet = h.heroAggressor ? 0.25 : [0, 0.6, 0.5, 0.45][h.street];
  if (strength >= 2) pBet += 0.3;
  if (strength === 0 && h.street === 3) pBet -= 0.15;
  const cards = h.street === 1 ? board.map(pretty).join(" ") : pretty(board[board.length - 1]);
  if (Math.random() < pBet) {
    const size = Math.max(1, Math.min(half(h.pot * pick([0.33, 0.5, 0.75])), h.stack));
    return {
      ...h,
      bet: size,
      log: [...h.log, { street: h.street, text: `${STREETS[h.street]} ${cards}. ${h.villainSeat} bets ${bb(size)} into ${bb(h.pot)}.` }],
    };
  }
  return {
    ...h,
    bet: 0,
    log: [...h.log, { street: h.street, text: `${STREETS[h.street]} ${cards}. ${h.villainSeat} checks to you. Pot ${bb(h.pot)}.` }],
  };
}

// ---------- Dealing ----------

export function dealHand(): HandState {
  const position = pick(POSITIONS);
  const idx = POSITIONS.indexOf(position);
  const heroBlind = position === "SB" ? 0.5 : position === "BB" ? 1 : 0;
  // The BB only gets a decision if someone raised; UTG can never face an open.
  const facing = position === "UTG" ? false : position === "BB" ? true : Math.random() < 0.5;

  const deck = shuffle(remainingDeck([]));
  const hero: [Card, Card] = [deck[0], deck[1]];

  let villainSeat: string;
  let villainPreset: string;
  let pot: number;
  let bet: number;
  let text: string;
  if (facing) {
    villainSeat = pick(POSITIONS.slice(0, Math.min(idx, 5)));
    villainPreset = "open-" + villainSeat;
    bet = OPEN_TO - heroBlind; // what it costs you to call
    pot = 1.5 + OPEN_TO - bet; // everything else in the middle
    text = `Preflop. ${villainSeat} raises to ${bb(OPEN_TO)}, everyone else folds. You're in the ${position}.`;
  } else {
    villainSeat = "BB";
    villainPreset = "bb-defend";
    pot = 1.5;
    bet = 0;
    text = `Preflop. Folded to you in the ${position}.`;
  }

  const combos = rangeCombos(presetByKey(villainPreset).range!).filter(
    ([a, b]) => a !== hero[0] && a !== hero[1] && b !== hero[0] && b !== hero[1]
  );
  const villain = pick(combos);
  const rest = shuffle(remainingDeck([...hero, ...villain]));

  return {
    id: nextId++,
    position,
    hero,
    villainSeat,
    villainPreset,
    villain,
    runout: rest.slice(0, 5),
    street: 0,
    pot,
    bet,
    stack: START_STACK - heroBlind,
    invested: heroBlind,
    heroAggressor: false,
    log: [{ street: 0, text }],
    over: null,
  };
}

// ---------- Your action ----------

function ended(h: HandState, result: HandOver["result"], heroNet: number, text: string): HandState {
  return { ...h, bet: 0, over: { result, heroNet: half(heroNet), text }, log: [...h.log, { street: h.street, text }] };
}

/** Move to the next street, or to showdown after the river / an all-in. */
function advance(h: HandState): HandState {
  if (h.street === 3 || h.stack <= 0) {
    const board = h.runout;
    const heroScore = bestScore([...h.hero, ...board]);
    const villScore = bestScore([...h.villain, ...board]);
    const shows = `${h.villainSeat} shows ${pretty(h.villain[0])} ${pretty(h.villain[1])} — ${categoryName(villScore)}.`;
    const runIt = h.street < 3 ? `All-in — the board runs out ${board.slice(h.street + 2).map(pretty).join(" ")}. ` : "";
    if (heroScore > villScore)
      return ended({ ...h, street: 3 }, "showdown", h.pot - h.invested, `${runIt}${shows} You win ${bb(h.pot)} with ${CATEGORY_NAMES[categoryOf(heroScore)]}.`);
    if (heroScore === villScore)
      return ended({ ...h, street: 3 }, "showdown", h.pot / 2 - h.invested, `${runIt}${shows} Split pot.`);
    return ended({ ...h, street: 3 }, "showdown", -h.invested, `${runIt}${shows} You lose with ${CATEGORY_NAMES[categoryOf(heroScore)]}.`);
  }
  return villainActs({ ...h, street: h.street + 1, bet: 0 });
}

export function applyChoice(h: HandState, choice: Choice): HandState {
  if (h.over) return h;
  const board = boardOf(h);
  const log = (s: HandState, text: string): HandState => ({ ...s, log: [...s.log, { street: s.street, text }] });

  if (choice === "fold") return ended(h, "hero-fold", -h.invested, "You fold.");

  // ----- Preflop -----
  if (h.street === 0) {
    if (choice === "call") {
      const call = Math.min(h.bet, h.stack);
      const s = { ...h, invested: h.invested + call, stack: h.stack - call, pot: h.pot + h.bet + call, bet: 0 };
      return advance(log(s, `You call. Pot ${bb(s.pot)}.`));
    }
    // raise: open if unopened, otherwise 3-bet
    if (h.bet === 0) {
      const add = OPEN_TO - h.invested;
      const pot = OPEN_TO * 2 + (h.position === "SB" ? 0 : 0.5);
      const s = { ...h, invested: OPEN_TO, stack: h.stack - add, pot, bet: 0, heroAggressor: true };
      return advance(log(s, `You open to ${bb(OPEN_TO)}. The BB calls. Pot ${bb(pot)}.`));
    }
    const add = THREE_BET_TO - h.invested;
    const s = { ...h, invested: THREE_BET_TO, stack: h.stack - add, heroAggressor: true };
    if (!villainContinues(h, [])) {
      const won = h.pot + h.bet + add;
      return ended(s, "villain-fold", won - THREE_BET_TO, `You 3-bet to ${bb(THREE_BET_TO)}. ${h.villainSeat} folds — you win ${bb(won)}.`);
    }
    // Both players put in the 3-bet; the blinds of anyone else are dead money.
    const heroBlind = h.position === "SB" ? 0.5 : h.position === "BB" ? 1 : 0;
    const villainBlind = h.villainSeat === "SB" ? 0.5 : 0;
    const s2 = { ...s, pot: THREE_BET_TO * 2 + 1.5 - heroBlind - villainBlind, bet: 0 };
    return advance(log(s2, `You 3-bet to ${bb(THREE_BET_TO)}. ${h.villainSeat} calls. Pot ${bb(s2.pot)}.`));
  }

  // ----- Postflop -----
  if (h.bet > 0) {
    if (choice === "call") {
      const call = Math.min(h.bet, h.stack);
      const s = { ...h, invested: h.invested + call, stack: h.stack - call, pot: h.pot + h.bet + call, bet: 0 };
      return advance(log(s, `You call ${bb(call)}. Pot ${bb(s.pot)}.`));
    }
    // raise to 3x
    const to = Math.min(half(h.bet * 3), h.stack);
    const s = { ...h, invested: h.invested + to, stack: h.stack - to };
    if (!villainContinues(h, board)) {
      const won = h.pot + h.bet + to;
      return ended(s, "villain-fold", won - s.invested, `You raise to ${bb(to)}. ${h.villainSeat} folds — you win ${bb(won)}.`);
    }
    const s2 = { ...s, pot: h.pot + to * 2, bet: 0 };
    return advance(log(s2, `You raise to ${bb(to)}. ${h.villainSeat} calls. Pot ${bb(s2.pot)}.`));
  }

  if (choice === "check") return advance(log(h, "You check behind."));

  // bet about two thirds of the pot
  const size = Math.max(1, Math.min(half(h.pot * 0.66), h.stack));
  const s = { ...h, invested: h.invested + size, stack: h.stack - size };
  if (!villainContinues(h, board)) {
    const won = h.pot + size;
    return ended(s, "villain-fold", won - s.invested, `You bet ${bb(size)}. ${h.villainSeat} folds — you win ${bb(won)}.`);
  }
  const s2 = { ...s, pot: h.pot + size * 2, bet: 0 };
  return advance(log(s2, `You bet ${bb(size)}. ${h.villainSeat} calls. Pot ${bb(s2.pot)}.`));
}
