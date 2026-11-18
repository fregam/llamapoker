/**
 * Vitest suite for the bankroll tracker's log (poker/bankrollLog.ts): what an entry does to the
 * bankroll and to the profit, the summary numbers, storage that never throws, and the CSV file
 * out and back in.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { addEntry, emptyLog, EntryInput, fromCsv, loadLog, Log, markBackedUp, parseCsv, removeEntry, saveLog, summarize, toCsv } from "./bankrollLog";

let n = 0;
const id = () => `id${++n}`;
const add = (log: Log, e: Partial<EntryInput> & Pick<EntryInput, "kind">, at = "2026-11-01") =>
  addEntry(log, { at, cost: 0, payout: 0, ...e }, id(), ++n);

const cash = (cost: number, payout: number, extra: Partial<EntryInput> = {}) => ({ kind: "cash" as const, cost, payout, bb: 10, ...extra });

describe("entries and the summary", () => {
  it("an empty log is its starting bankroll", () => {
    const s = summarize(emptyLog("$", 50000));
    expect(s.bankroll).toBe(50000);
    expect(s.profit).toBe(0);
    expect(s.sessions).toBe(0);
    expect(s.series).toEqual([{ at: "", bankroll: 50000 }]);
    expect(s.ownRuin).toBeNull();
  });

  it("a deposit moves the bankroll and not the profit; a withdrawal the same, downwards", () => {
    let log = emptyLog("$", 50000);
    log = add(log, cash(1000, 2500)); // +$15
    log = add(log, { kind: "deposit", payout: 20000 });
    log = add(log, { kind: "withdrawal", cost: 5000 });
    const s = summarize(log);
    expect(s.profit).toBe(1500);
    expect(s.bankroll).toBe(50000 + 1500 + 20000 - 5000);
    expect(s.sessions).toBe(1);
  });

  it("cash: profit and an hourly rate over the sessions that recorded their length", () => {
    let log = emptyLog();
    log = add(log, cash(1000, 1600, { minutes: 90 })); // +$6 in 1.5 h
    log = add(log, cash(1000, 400, { minutes: 30 })); // −$6 in 0.5 h
    log = add(log, cash(1000, 3000)); // +$20, no length: not in the hourly
    const s = summarize(log);
    expect(s.cash.n).toBe(3);
    expect(s.cash.profit).toBe(2000);
    expect(s.cash.hourly).toBe(0);
    expect(summarize(add(emptyLog(), cash(1000, 3000))).cash.hourly).toBeNull();
  });

  it("tournaments: ROI is profit over buy-ins paid", () => {
    let log = emptyLog();
    for (let i = 0; i < 9; i++) log = add(log, { kind: "tournament", cost: 500 });
    log = add(log, { kind: "tournament", cost: 500, payout: 6500 });
    const s = summarize(log);
    expect(s.tournament.n).toBe(10);
    expect(s.tournament.cost).toBe(5000);
    expect(s.tournament.profit).toBe(1500);
    expect(s.tournament.roi).toBeCloseTo(0.3, 10);
    expect(s.tournament.cashed).toBe(1);
    expect(summarize(emptyLog()).tournament.roi).toBeNull();
  });

  it("the series follows the dates, not the order of typing", () => {
    let log = emptyLog("$", 10000);
    log = add(log, cash(1000, 2000), "2026-11-03");
    log = add(log, cash(1000, 0), "2026-11-01");
    expect(summarize(log).series).toEqual([
      { at: "2026-11-01", bankroll: 10000 },
      { at: "2026-11-01", bankroll: 9000 },
      { at: "2026-11-03", bankroll: 10000 },
    ]);
  });

  it("the downswing is the deepest fall from a high, deposits left out", () => {
    let log = emptyLog();
    for (const [c, p] of [[1000, 3000], [1000, 0], [1000, 0], [1000, 1500]]) log = add(log, cash(c, p));
    log = add(log, { kind: "deposit", payout: 100000 });
    const s = summarize(log);
    expect(s.downswing).toBe(2000); // +20, then −10, −10
    expect(s.belowPeak).toBe(1500); // back up 5 of the 20
  });

  it("risk of ruin from your own results needs 30 sessions, and is certain when they lose", () => {
    let win = emptyLog("$", 100000), lose = emptyLog("$", 100000);
    for (let i = 0; i < 29; i++) win = add(win, cash(1000, i % 2 ? 0 : 2600));
    expect(summarize(win).ownRuin).toBeNull();
    win = add(win, cash(1000, 2600));
    const r = summarize(win).ownRuin!;
    expect(r).toBeGreaterThan(0);
    expect(r).toBeLessThan(1);
    for (let i = 0; i < 30; i++) lose = add(lose, cash(1000, i % 2 ? 0 : 1500));
    expect(summarize(lose).ownRuin).toBe(1);
  });

  it("says why the risk is certain: results at a loss, or a winner with nothing left in the bankroll", () => {
    let win = emptyLog("$", 100000);
    for (let i = 0; i < 30; i++) win = add(win, cash(1000, i % 2 ? 0 : 2600));
    expect(summarize(win).ownRuinWhy).toBe("estimate");
    const emptied = add(win, { kind: "withdrawal", cost: summarize(win).bankroll });
    expect(summarize(emptied).ownRuin).toBe(1);
    expect(summarize(emptied).ownRuinWhy).toBe("empty"); // a winner: "at a loss" would be false
    let lose = emptyLog("$", 100000);
    for (let i = 0; i < 30; i++) lose = add(lose, cash(1000, i % 2 ? 0 : 1500));
    expect(summarize(lose).ownRuinWhy).toBe("losing");
    expect(summarize(emptyLog()).ownRuinWhy).toBeNull();
  });

  it("asks for a backup every ten sessions until one is downloaded", () => {
    let log = emptyLog();
    for (let i = 0; i < 9; i++) log = add(log, cash(1000, 1000));
    expect(summarize(log).backupDue).toBe(false);
    log = add(log, cash(1000, 1000));
    expect(summarize(log).backupDue).toBe(true);
    log = markBackedUp(log);
    expect(summarize(log).backupDue).toBe(false);
  });

  it("removes an entry by id", () => {
    const log = add(emptyLog(), cash(1000, 2000));
    expect(removeEntry(log, log.entries[0].id).entries).toEqual([]);
  });
});

describe("storage", () => {
  afterEach(() => vi.unstubAllGlobals());

  const fakeStorage = (initial: Record<string, string> = {}) => {
    const data = { ...initial };
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => data[k] ?? null,
      setItem: (k: string, v: string) => void (data[k] = v),
      removeItem: (k: string) => void delete data[k],
    });
    return data;
  };

  it("saves, loads and removes", () => {
    const data = fakeStorage();
    expect(loadLog()).toBeNull();
    const log = add(emptyLog("€", 5000), cash(1000, 2000));
    saveLog(log);
    expect(loadLog()).toEqual(log);
    saveLog(null);
    expect(Object.keys(data)).toEqual([]);
  });

  it("a broken blob, another version or no storage at all loads as nothing, never throws", () => {
    fakeStorage({ "llamapoker.bankroll.v1": "{not json" });
    expect(loadLog()).toBeNull();
    fakeStorage({ "llamapoker.bankroll.v1": JSON.stringify({ v: 2, entries: [] }) });
    expect(loadLog()).toBeNull();
    vi.unstubAllGlobals(); // Node: no localStorage
    expect(loadLog()).toBeNull();
    expect(() => saveLog(emptyLog())).not.toThrow();
  });

  it("drops entries it cannot trust and keeps the rest", () => {
    const good = add(emptyLog(), cash(1000, 2000)).entries[0];
    fakeStorage({ "llamapoker.bankroll.v1": JSON.stringify({ v: 1, currency: "$", start: 0, entries: [good, { id: "x", at: "soon", kind: "cash", cost: 1, payout: 1 }, null] }) });
    expect(loadLog()!.entries).toEqual([good]);
  });
});

describe("CSV", () => {
  const sample = () => {
    let log = emptyLog("€", 50000);
    log = add(log, cash(1000, 2550, { minutes: 90, live: false, note: 'ran well, "hero call"' }), "2026-11-02");
    log = add(log, { kind: "tournament", cost: 1100, payout: 0, live: true, note: "two rebuys,\nlate" }, "2026-11-03");
    log = add(log, { kind: "deposit", payout: 20000 }, "2026-11-04");
    log = add(log, { kind: "withdrawal", cost: 5000 }, "2026-11-05");
    return log;
  };

  it("out and back in gives the same log", () => {
    const log = sample();
    const back = fromCsv(toCsv(log), emptyLog(), id, 99);
    expect(back.errors).toEqual([]);
    expect(back.added).toBe(4);
    expect(back.log.currency).toBe("€");
    expect(back.log.start).toBe(50000);
    const strip = (l: Log) => l.entries.map(({ created, updated, ...e }) => e);
    expect(strip(back.log)).toEqual(strip(log));
    expect(summarize(back.log).bankroll).toBe(summarize(log).bankroll);
  });

  it("importing the same file twice adds nothing, and never moves the start of a log in use", () => {
    const log = sample();
    const again = fromCsv(toCsv({ ...log, start: 1 }), log, id, 99);
    expect(again.added).toBe(0);
    expect(again.skipped).toBe(4);
    expect(again.log).toEqual(log);
  });

  it("reads a plain spreadsheet: other column order, unknown columns, no ids, a BOM", () => {
    const text = "﻿Type,Date,Site,money_out,money_in,big_blind\r\ncash,2026-10-01,Somewhere,35,20,0.10\r\ntournament,2026-10-02,Somewhere,,5.50,\r\n";
    const r = fromCsv(text, emptyLog(), id, 1);
    expect(r.errors).toEqual([]);
    expect(r.added).toBe(2);
    expect(r.log.entries[0]).toMatchObject({ kind: "cash", at: "2026-10-01", cost: 2000, payout: 3500, bb: 10 });
    expect(r.log.entries[1]).toMatchObject({ kind: "tournament", cost: 550, payout: 0 });
    expect(fromCsv(text, r.log, id, 2).added).toBe(0); // no ids: matched by day, type and amounts
  });

  it("keeps two identical sessions from one file, and still adds nothing on a second import", () => {
    // Two $5.50 tournaments busted on the same day are two sessions, not a duplicate.
    const text = "date,type,money_in,money_out\n2026-10-02,tournament,5.50,\n2026-10-02,tournament,5.50,\n2026-10-02,tournament,5.50,\n";
    const first = fromCsv(text, emptyLog(), id, 1);
    expect(first.added).toBe(3);
    expect(summarize(first.log).profit).toBe(-1650);
    const second = fromCsv(text, first.log, id, 2);
    expect(second.added).toBe(0);
    expect(second.skipped).toBe(3);
    // a file with one more of them adds exactly that one
    const third = fromCsv(text + "2026-10-02,tournament,5.50,\n", first.log, id, 3);
    expect(third.added).toBe(1);
  });

  it("reads amounts written with a decimal comma", () => {
    const r = fromCsv('date,type,money_in,money_out\n2026-10-01,cash,"20,00","35,50"\n', emptyLog("€"), id, 1);
    expect(r.errors).toEqual([]);
    expect(r.log.entries[0]).toMatchObject({ cost: 2000, payout: 3550 });
  });

  it("reports a bad row with its line number and imports the rest", () => {
    const text = "date,type,money_in,money_out,amount\n2026-10-01,cash,20,35,\n01/10/2026,cash,20,35,\n2026-10-02,roulette,1,2,\n2026-10-03,cash,twenty,35,\n2026-10-04,deposit,,,\n2026-10-05,deposit,,,100\n";
    const r = fromCsv(text, emptyLog(), id, 1);
    expect(r.added).toBe(2);
    expect(r.errors.map((e) => e.slice(0, 7))).toEqual(["Line 3:", "Line 4:", "Line 5:", "Line 6:"]);
  });

  it("refuses a file without its column names", () => {
    const r = fromCsv("2026-10-01,cash,20,35\n", emptyLog(), id, 1);
    expect(r.added).toBe(0);
    expect(r.errors.length).toBe(1);
  });

  it("splits quoted cells", () => {
    expect(parseCsv('a,"b,c","d ""e"""\r\n\r\n1,"2\n3",4')).toEqual([["a", "b,c", 'd "e"'], ["1", "2\n3", "4"]]);
  });
});
