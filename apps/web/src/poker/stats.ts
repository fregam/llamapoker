/**
 * Trainer stats (accuracy, streaks, per-street results, the last 200 decisions),
 * stored in localStorage under "pokerTrainer.stats.v1". Every access is wrapped in
 * try/catch so the Trainer still works when storage is blocked (private mode etc.).
 * findLeaks() groups the history by spot type (street × facing a bet, outs counting)
 * and returns the weakest ones, shown in the Trainer's side column.
 * Older saved records (before drills existed) lack mode / ok / facing; every reader
 * here copes with that.
 * Used by: views/Trainer.
 */

export interface Decision {
  at: number; // timestamp
  street: number;
  position: string;
  hand: string; // e.g. "AsKd"
  board: string; // e.g. "Td9h2c"
  answer: string; // fold / check / call / raise, or a number of outs
  correct: string; // the right answer
  action: string; // the recommended action text
  mode?: string; // which drill: hand / mixed / preflop / price / outs
  facing?: boolean; // were you facing a bet
  ok?: boolean; // counted as right (includes close calls); falls back to answer === correct
  close?: boolean; // a close spot where either answer was fine
  timedOut?: boolean;
}

export interface Stats {
  total: number;
  correct: number;
  streak: number;
  bestStreak: number;
  byStreet: { total: number; correct: number }[]; // preflop, flop, turn, river
  history: Decision[]; // newest first, capped
}

const KEY = "pokerTrainer.stats.v1";
const HISTORY_CAP = 200;
const STREETS = ["Preflop", "Flop", "Turn", "River"];

export const isOk = (d: Decision) => d.ok ?? d.answer === d.correct;

export function emptyStats(): Stats {
  return {
    total: 0,
    correct: 0,
    streak: 0,
    bestStreak: 0,
    byStreet: [0, 1, 2, 3].map(() => ({ total: 0, correct: 0 })),
    history: [],
  };
}

export function loadStats(): Stats {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyStats();
    const s = JSON.parse(raw) as Stats;
    if (typeof s.total !== "number" || !Array.isArray(s.byStreet) || !Array.isArray(s.history)) return emptyStats();
    return s;
  } catch {
    return emptyStats();
  }
}

export function saveStats(s: Stats): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Storage unavailable — stats just won't persist.
  }
}

export function recordDecision(s: Stats, d: Decision): Stats {
  const ok = isOk(d);
  const byStreet = s.byStreet.map((b, i) =>
    i === d.street ? { total: b.total + 1, correct: b.correct + (ok ? 1 : 0) } : b
  );
  const streak = ok ? s.streak + 1 : 0;
  return {
    total: s.total + 1,
    correct: s.correct + (ok ? 1 : 0),
    streak,
    bestStreak: Math.max(s.bestStreak, streak),
    byStreet,
    history: [d, ...s.history].slice(0, HISTORY_CAP),
  };
}

export interface Leak {
  label: string;
  total: number;
  correct: number;
}

function spotType(d: Decision): string {
  if (d.mode === "outs") return `Counting outs · ${STREETS[d.street]}`;
  if (d.facing === undefined) return STREETS[d.street];
  if (d.street === 0) return d.facing ? "Preflop · facing a raise" : "Preflop · first in";
  return `${STREETS[d.street]} · ${d.facing ? "facing a bet" : "checked to you"}`;
}

/** Spot types you get wrong most (at least `min` attempts, under 75%), worst first. */
export function findLeaks(history: Decision[], min = 4, max = 3): Leak[] {
  const groups = new Map<string, Leak>();
  for (const d of history) {
    const label = spotType(d);
    const g = groups.get(label) ?? { label, total: 0, correct: 0 };
    g.total++;
    if (isOk(d)) g.correct++;
    groups.set(label, g);
  }
  return [...groups.values()]
    .filter((g) => g.total >= min && g.correct / g.total < 0.75)
    .sort((a, b) => a.correct / a.total - b.correct / b.total)
    .slice(0, max);
}
