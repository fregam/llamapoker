/**
 * The bankroll tracker's log: a visitor's real sessions, kept in their own browser under
 * "llamapoker.bankroll.v1" (localStorage, every access guarded as in poker/stats.ts) and
 * nowhere else.
 *   - Log = { v, currency, start, entries, backedUp }. An Entry is a cash session, a tournament,
 *     a deposit or a withdrawal: `cost` is money put in, `payout` money taken back, so the change
 *     to the bankroll is always payout − cost. Deposits and withdrawals move the bankroll and never
 *     the profit. Money is whole cents; dates are "YYYY-MM-DD" strings.
 *   - Every entry has a stable id and created / updated timestamps, and the blob has a version,
 *     so the log can move into accounts later without a migration.
 *   - Everything except loadLog / saveLog / makeId is pure: ids and the clock are passed in.
 *   - summarize() gives the numbers the tracker shows; toCsv / fromCsv are the backup and the
 *     way in from a spreadsheet (unknown columns ignored, duplicates skipped, bad rows reported).
 * Used by: components/BankrollTracker, views/Bankroll.
 * Uses: poker/bankroll (money, ruinFromResults).
 */

import { parseMoney, ruinFromResults } from "./bankroll";

export type EntryKind = "cash" | "tournament" | "deposit" | "withdrawal";
export const ENTRY_KINDS: EntryKind[] = ["cash", "tournament", "deposit", "withdrawal"];

export interface Entry {
  id: string;
  /** The day it happened, "YYYY-MM-DD". */
  at: string;
  kind: EntryKind;
  /** Money put in: buy-ins and rebuys, a tournament's entry, or a withdrawal. Cents. */
  cost: number;
  /** Money taken back: the cash-out, the prize, or a deposit. Cents. */
  payout: number;
  /** Cash only: the big blind played, in cents. */
  bb?: number;
  minutes?: number;
  live?: boolean;
  note?: string;
  created: number;
  updated: number;
}

/** What a form or a CSV row provides; the id and timestamps are added by addEntry. */
export type EntryInput = Omit<Entry, "id" | "created" | "updated">;

export interface Log {
  v: 1;
  /** Shown before every amount; no conversion. */
  currency: string;
  /** The bankroll before the first entry. Cents. */
  start: number;
  entries: Entry[];
  /** How many sessions the log held at the last download (for the backup reminder). */
  backedUp: number;
}

const KEY = "llamapoker.bankroll.v1";
/** Sessions before the tracker computes a risk of ruin from the visitor's own results. */
export const OWN_RUIN_MIN = 30;
/** Remind to download a backup every this many new sessions. */
export const BACKUP_EVERY = 10;

export const emptyLog = (currency = "$", start = 0): Log => ({ v: 1, currency, start, entries: [], backedUp: 0 });

const isDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(s);
const isCents = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n >= 0;
const isEntry = (e: any): e is Entry =>
  !!e && typeof e.id === "string" && isDate(e.at) && ENTRY_KINDS.includes(e.kind) && isCents(e.cost) && isCents(e.payout);

/** Null when nothing usable is stored: the page then shows the calculator alone. */
export function loadLog(): Log | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const l = JSON.parse(raw);
    if (l?.v !== 1 || typeof l.currency !== "string" || !Number.isInteger(l.start) || !Array.isArray(l.entries)) return null;
    return { v: 1, currency: l.currency, start: l.start, entries: l.entries.filter(isEntry), backedUp: Number(l.backedUp) || 0 };
  } catch {
    return null;
  }
}

/** Pass null to remove the log from the browser. */
export function saveLog(log: Log | null): void {
  try {
    if (log) localStorage.setItem(KEY, JSON.stringify(log));
    else localStorage.removeItem(KEY);
  } catch {
    // Storage unavailable: the tracker works for this visit and won't persist.
  }
}

/** A random id. Call from event handlers only (never during render). */
export function makeId(): string {
  const c = (globalThis as any).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return "e" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export const isSession = (e: Entry) => e.kind === "cash" || e.kind === "tournament";
/** What the entry did to the bankroll. */
export const delta = (e: Entry) => e.payout - e.cost;

/** Oldest first; entries on the same day keep the order they were logged in. */
export const inOrder = (entries: Entry[]) => [...entries].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : a.created - b.created));

export function addEntry(log: Log, input: EntryInput, id: string, now: number): Log {
  return { ...log, entries: [...log.entries, { ...input, id, created: now, updated: now }] };
}

export function removeEntry(log: Log, id: string): Log {
  return { ...log, entries: log.entries.filter((e) => e.id !== id) };
}

export interface Summary {
  /** Start + everything logged. */
  bankroll: number;
  /** Sessions only: deposits and withdrawals are not results. */
  profit: number;
  sessions: number;
  cash: { n: number; profit: number; /** Per hour, over the sessions that recorded their length. */ hourly: number | null };
  tournament: { n: number; profit: number; cost: number; /** Profit ÷ buy-ins paid. */ roi: number | null; cashed: number };
  /** The bankroll after each entry, oldest first, opening with the starting bankroll. */
  series: { at: string; bankroll: number }[];
  /** The deepest fall of session results from an earlier high, and how far under the high they are now. */
  downswing: number;
  belowPeak: number;
  /** Risk of ruin from the visitor's own session results; null under OWN_RUIN_MIN sessions. */
  ownRuin: number | null;
  /** Why it reads as it does: results at a loss ("losing"), nothing left in the bankroll ("empty"), or a real estimate. */
  ownRuinWhy: "losing" | "empty" | "estimate" | null;
  /** True once there are sessions that the last download does not hold. */
  backupDue: boolean;
}

export function summarize(log: Log): Summary {
  const entries = inOrder(log.entries);
  const sessions = entries.filter(isSession);
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

  let bankroll = log.start;
  const series = [{ at: entries[0]?.at ?? "", bankroll }];
  for (const e of entries) series.push({ at: e.at, bankroll: (bankroll += delta(e)) });

  let run = 0, peak = 0, downswing = 0;
  for (const e of sessions) {
    run += delta(e);
    peak = Math.max(peak, run);
    downswing = Math.max(downswing, peak - run);
  }

  const cash = sessions.filter((e) => e.kind === "cash");
  const timed = cash.filter((e) => (e.minutes ?? 0) > 0);
  const minutes = sum(timed.map((e) => e.minutes!));
  const tours = sessions.filter((e) => e.kind === "tournament");
  const tourCost = sum(tours.map((e) => e.cost));

  const results = sessions.map(delta);
  let ownRuin: number | null = null;
  let ownRuinWhy: Summary["ownRuinWhy"] = null;
  if (results.length >= OWN_RUIN_MIN) {
    const mean = sum(results) / results.length;
    const variance = sum(results.map((r) => (r - mean) ** 2)) / (results.length - 1);
    ownRuin = ruinFromResults(bankroll, mean, variance);
    ownRuinWhy = mean <= 0 ? "losing" : bankroll <= 0 ? "empty" : "estimate";
  }

  return {
    bankroll,
    profit: run,
    sessions: sessions.length,
    cash: { n: cash.length, profit: sum(cash.map(delta)), hourly: minutes > 0 ? Math.round(sum(timed.map(delta)) / (minutes / 60)) : null },
    tournament: {
      n: tours.length,
      profit: sum(tours.map(delta)),
      cost: tourCost,
      roi: tourCost > 0 ? sum(tours.map(delta)) / tourCost : null,
      cashed: tours.filter((e) => e.payout > 0).length,
    },
    series,
    downswing,
    belowPeak: peak - run,
    ownRuin,
    ownRuinWhy,
    backupDue: sessions.length - log.backedUp >= BACKUP_EVERY,
  };
}

/** Marks the log as downloaded, so the reminder waits for ten more sessions. */
export const markBackedUp = (log: Log): Log => ({ ...log, backedUp: log.entries.filter(isSession).length });

// ---- CSV ------------------------------------------------------------------------------------

export const CSV_COLUMNS = ["date", "type", "big_blind", "money_in", "money_out", "amount", "minutes", "where", "note", "currency", "id"];

const decimal = (cents: number) => (cents / 100).toFixed(2);
const cell = (s: string) => (/[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

/**
 * One row per entry, plus a first "start" row carrying the starting bankroll. Sessions use
 * money_in / money_out; deposits, withdrawals and the start use amount. Opens in any spreadsheet.
 */
export function toCsv(log: Log): string {
  const rows: string[][] = [["", "start", "", "", "", decimal(log.start), "", "", "", log.currency, "start"]];
  for (const e of inOrder(log.entries)) {
    const session = isSession(e);
    rows.push([
      e.at,
      e.kind,
      e.bb ? decimal(e.bb) : "",
      session ? decimal(e.cost) : "",
      session ? decimal(e.payout) : "",
      session ? "" : decimal(e.kind === "deposit" ? e.payout : e.cost),
      e.minutes ? String(e.minutes) : "",
      e.live === undefined ? "" : e.live ? "live" : "online",
      e.note ?? "",
      log.currency,
      e.id,
    ]);
  }
  return [CSV_COLUMNS, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}

/** Splits CSV text into rows of cells: quoted cells, doubled quotes, commas and line breaks inside quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cur = "", quoted = false;
  const t = text.replace(/^﻿/, "");
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (quoted) {
      if (ch === '"' && t[i + 1] === '"') (cur += '"'), i++;
      else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") row.push(cur), (cur = "");
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && t[i + 1] === "\n") i++;
      row.push(cur), rows.push(row), (row = []), (cur = "");
    } else cur += ch;
  }
  if (cur !== "" || row.length) row.push(cur), rows.push(row);
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

const signature = (e: EntryInput) => [e.at, e.kind, e.cost, e.payout, e.bb ?? "", e.minutes ?? "", e.note ?? ""].join("|");

export interface ImportResult {
  log: Log;
  added: number;
  /** Rows already in the log (same id, or the same day, type and amounts). */
  skipped: number;
  /** One line per row that could not be read, with its line number in the file. */
  errors: string[];
}

/**
 * Reads a CSV into the log. Needs "date" and "type" columns; knows the columns of toCsv and ignores
 * the rest. A "start" row sets the starting bankroll and currency only when the log is still empty.
 */
export function fromCsv(text: string, log: Log, makeId: () => string, now: number): ImportResult {
  const rows = parseCsv(text);
  const header = (rows[0] ?? []).map((h) => h.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);
  if (col("date") < 0 || col("type") < 0)
    return { log, added: 0, skipped: 0, errors: ['The file needs a first line naming its columns, with at least "date" and "type".'] };

  let out = log;
  const wasEmpty = log.entries.length === 0;
  const ids = new Set(log.entries.map((e) => e.id));
  // Rows without an id are matched by day, type and amounts, by count: the third identical row in
  // a file is a duplicate only if the log already held three before this import.
  const had = new Map<string, number>();
  for (const e of log.entries) had.set(signature(e), (had.get(signature(e)) ?? 0) + 1);
  const met = new Map<string, number>();
  const errors: string[] = [];
  let added = 0, skipped = 0;

  rows.slice(1).forEach((r, i) => {
    const line = i + 2;
    const get = (name: string) => (col(name) >= 0 ? (r[col(name)] ?? "").trim() : "");
    const money = (name: string): number | null => (get(name) === "" ? 0 : parseMoney(get(name)));
    const kind = get("type").toLowerCase();

    if (kind === "start") {
      const start = money("amount");
      if (start === null) errors.push(`Line ${line}: "${get("amount")}" is not an amount.`);
      else if (wasEmpty) out = { ...out, start, currency: get("currency") || out.currency };
      return;
    }
    if (!ENTRY_KINDS.includes(kind as EntryKind)) return void errors.push(`Line ${line}: type "${get("type")}" is not cash, tournament, deposit or withdrawal.`);
    if (!isDate(get("date"))) return void errors.push(`Line ${line}: date "${get("date")}" is not written as YYYY-MM-DD.`);

    const session = kind === "cash" || kind === "tournament";
    const [cost, payout, amount, bb] = [money("money_in"), money("money_out"), money("amount"), money("big_blind")];
    if (cost === null || payout === null || amount === null || bb === null) return void errors.push(`Line ${line}: one of the amounts is not a number.`);
    if (!session && amount === 0) return void errors.push(`Line ${line}: a ${kind} needs an amount.`);

    const minutes = Number(get("minutes"));
    const where = get("where").toLowerCase();
    const input: EntryInput = {
      at: get("date"),
      kind: kind as EntryKind,
      cost: session ? cost : kind === "withdrawal" ? amount : 0,
      payout: session ? payout : kind === "deposit" ? amount : 0,
      ...(kind === "cash" && bb > 0 ? { bb } : {}),
      ...(Number.isFinite(minutes) && minutes > 0 ? { minutes: Math.round(minutes) } : {}),
      ...(where === "live" || where === "online" ? { live: where === "live" } : {}),
      ...(get("note") ? { note: get("note") } : {}),
    };
    const id = get("id");
    if (id ? ids.has(id) : met.set(signature(input), (met.get(signature(input)) ?? 0) + 1).get(signature(input))! <= (had.get(signature(input)) ?? 0))
      return void skipped++;
    const newId = id || makeId();
    ids.add(newId);
    out = addEntry(out, input, newId, now);
    added++;
  });

  return { log: out, added, skipped, errors };
}
