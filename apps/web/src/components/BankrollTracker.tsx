/**
 * <BankrollTracker>: the visitor's own sessions on /bankroll. Shows the figures from
 * bankrollLog.summarize() (bankroll, profit, hourly, tournament ROI, downswing), the bankroll as a
 * line (<BankrollLine>, one series in paper on ink, hover for each point), the form to log a
 * session, a tournament, a deposit or a withdrawal, the list with delete, and the backup: download
 * a CSV, import one, delete everything (two clicks).
 * The parent (views/Bankroll) owns the log and saves it; this component only calls onChange.
 * It is mounted in the browser only, after the log has been read from storage, so it may use the
 * clock (today's date, timestamps) and random ids freely. It is never prerendered.
 * Used by: views/Bankroll.
 * Uses: poker/bankroll, poker/bankrollLog, poker/odds (formatPct), seo (longDate), components/Select.
 */

import { FormEvent, useRef, useState } from "react";
import { formatMoney, parseMoney, stakes } from "../poker/bankroll";
import {
  addEntry,
  delta,
  Entry,
  ENTRY_KINDS,
  EntryInput,
  EntryKind,
  fromCsv,
  inOrder,
  isSession,
  Log,
  makeId,
  markBackedUp,
  OWN_RUIN_MIN,
  removeEntry,
  summarize,
  toCsv,
} from "../poker/bankrollLog";
import { formatPct } from "../poker/odds";
import { longDate } from "../seo";
import { Select } from "./Select";

const KIND_NAME: Record<EntryKind, string> = { cash: "Cash game", tournament: "Tournament", deposit: "Deposit", withdrawal: "Withdrawal" };

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function BankrollTracker({ log, onChange }: { log: Log; onChange: (log: Log | null) => void }) {
  const money = (cents: number) => formatMoney(cents, log.currency);
  const s = summarize(log);
  const ladder = stakes("cash", log.currency);
  const lastCash = [...log.entries].reverse().find((e) => e.kind === "cash" && e.bb);

  const [kind, setKind] = useState<EntryKind>("cash");
  const [at, setAt] = useState(today);
  const [bb, setBb] = useState(String(lastCash?.bb ?? 10));
  const [cost, setCost] = useState("");
  const [payout, setPayout] = useState("");
  const [hours, setHours] = useState("");
  const [where, setWhere] = useState<"" | "online" | "live">("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<string[]>([]);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  const session = kind === "cash" || kind === "tournament";
  const labels: Record<EntryKind, [string, string]> = {
    cash: ["Bought in for", "Cashed out"],
    tournament: ["Buy-ins paid, with fees and rebuys", "Prize"],
    deposit: ["Amount added", ""],
    withdrawal: ["Amount taken out", ""],
  };

  function submit(e: FormEvent) {
    e.preventDefault();
    const a = parseMoney(cost);
    const b = session ? (payout.trim() === "" ? 0 : parseMoney(payout)) : 0;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(at)) return setError("Pick the day it happened.");
    if (a === null || (a === 0 && !session)) return setError(`"${labels[kind][0]}" needs an amount, like 20 or 5.50.`);
    if (session && a === 0 && b === 0) return setError("A session needs at least what you put in.");
    if (b === null) return setError(`"${labels[kind][1]}" needs an amount, or leave it empty for nothing.`);
    const h = Number(hours);
    if (hours.trim() !== "" && !(h > 0 && h < 100)) return setError("Hours played should be a number, like 1.5.");
    const input: EntryInput = {
      at,
      kind,
      cost: kind === "deposit" ? 0 : a,
      payout: kind === "deposit" ? a : b,
      ...(kind === "cash" ? { bb: Number(bb) } : {}),
      ...(session && h > 0 ? { minutes: Math.round(h * 60) } : {}),
      ...(session && where ? { live: where === "live" } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
    };
    onChange(addEntry(log, input, makeId(), Date.now()));
    setCost("");
    setPayout("");
    setHours("");
    setNote("");
    setError("");
    setNotice([]);
  }

  function download() {
    // The byte-order mark makes Excel read the file as UTF-8 (€, £, notes); fromCsv strips it.
    const url = URL.createObjectURL(new Blob(["\uFEFF", toCsv(log)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `llamapoker-bankroll-${today()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000); // after the browser has started the download
    onChange(markBackedUp(log));
  }

  async function importFile(f: File | undefined) {
    if (!f) return;
    const r = fromCsv(await f.text(), log, makeId, Date.now());
    if (r.added || r.log !== log) onChange(r.log);
    setNotice([`${r.added} added${r.skipped ? `, ${r.skipped} already here` : ""}${r.errors.length ? `, ${r.errors.length} not read:` : "."}`, ...r.errors.slice(0, 8)]);
    if (file.current) file.current.value = "";
  }

  const rows = inOrder(log.entries).reverse();

  return (
    <section className="bk-tracker" aria-label="Your bankroll tracker">
      <div className="strat-head">
        <h2>Your bankroll</h2>
      </div>

      <div className="figures bk-figures">
        <div className="figure">
          <span className="figure-label">Bankroll now</span>
          <span className="figure-value">{money(s.bankroll)}</span>
          <span className="figure-note">started at {money(log.start)}</span>
        </div>
        <div className="figure">
          <span className="figure-label">Results</span>
          <span className={`figure-value ${s.profit > 0 ? "bk-up" : s.profit < 0 ? "bk-down" : ""}`}>{money(s.profit)}</span>
          <span className="figure-note">
            over {s.sessions} session{s.sessions === 1 ? "" : "s"}
          </span>
        </div>
        <div className="figure">
          <span className="figure-label">Biggest drop from a high</span>
          <span className="figure-value">{money(s.downswing)}</span>
          <span className="figure-note">{s.belowPeak > 0 ? `${money(s.belowPeak)} under your high now` : "at your high now"}</span>
        </div>
      </div>

      {(s.cash.n > 0 || s.tournament.n > 0) && (
        <p className="ro-caption">
          {s.cash.n > 0 && (
            <>
              <strong>Cash:</strong> {money(s.cash.profit)} over {s.cash.n} session{s.cash.n === 1 ? "" : "s"}
              {s.cash.hourly !== null && <>, {money(s.cash.hourly)} an hour where you logged the time</>}.{" "}
            </>
          )}
          {s.tournament.n > 0 && (
            <>
              <strong>Tournaments:</strong> {money(s.tournament.profit)} over {s.tournament.n}, cashed in {s.tournament.cashed}
              {s.tournament.roi !== null && <>, ROI (profit ÷ buy-ins paid) {formatPct(s.tournament.roi, 0)}</>}.
            </>
          )}
        </p>
      )}

      {s.ownRuin !== null ? (
        <p className="ro-note">
          {s.ownRuinWhy === "losing" ? (
            <>
              <strong>Your logged results are at a loss so far.</strong> No bankroll outlasts a losing game, so treat what's
              here as a budget, drop a stake, and put the hours into study. {s.sessions} sessions is still a small sample.
            </>
          ) : s.ownRuinWhy === "empty" ? (
            <>
              <strong>There is no bankroll left here to risk.</strong> Your sessions are ahead overall, but everything has
              been taken out. Log a deposit when you put money back in.
            </>
          ) : (
            <>
              <strong>
                Risk of ruin from your own results:{" "}
                {s.ownRuin >= 0.995 ? "close to 100%" : s.ownRuin < 0.001 ? "under 0.1%" : formatPct(s.ownRuin, s.ownRuin < 0.1 ? 1 : 0)}.
              </strong>{" "}
              That's the chance of losing all of it if you keep playing as you have and never move down. It's rough:{" "}
              {s.sessions} sessions is a small sample, and a good run makes it look safer than it is.
            </>
          )}
        </p>
      ) : (
        s.sessions > 0 && (
          <p className="hint">
            After {OWN_RUIN_MIN} sessions this page also works out your risk of ruin from your own results ({OWN_RUIN_MIN - s.sessions} to go).
          </p>
        )
      )}

      {s.series.length > 1 && <BankrollLine series={s.series} money={money} />}

      <form className="bk-form" onSubmit={submit} noValidate>
        <h3 className="ro-title">Log it</h3>
        <div className="seg bk-kinds" role="group" aria-label="What to log">
          {ENTRY_KINDS.map((k) => (
            <button key={k} type="button" className={k === kind ? "seg-btn seg-active" : "seg-btn"} aria-pressed={k === kind} onClick={() => (setKind(k), setError(""))}>
              {KIND_NAME[k]}
            </button>
          ))}
        </div>
        <div className="bk-fields">
          <label className="money">
            <span className="money-label">Day</span>
            <input className="num bk-date" type="date" value={at} max="2099-12-31" onChange={(e) => setAt(e.target.value)} />
          </label>
          {kind === "cash" && (
            <div className="money">
              <span className="money-label">Blinds</span>
              <Select value={bb} onChange={setBb} ariaLabel="Blinds played" options={ladder.map((st) => ({ value: String(st.bb), label: st.name }))} />
            </div>
          )}
          <label className="money">
            <span className="money-label">{labels[kind][0]}</span>
            <input className="num" inputMode="decimal" autoComplete="off" value={cost} onChange={(e) => setCost(e.target.value)} />
          </label>
          {session && (
            <label className="money">
              <span className="money-label">{labels[kind][1]}</span>
              <input className="num" inputMode="decimal" autoComplete="off" placeholder="0" value={payout} onChange={(e) => setPayout(e.target.value)} />
            </label>
          )}
        </div>
        <details className="bk-more">
          <summary className="link-btn">More: time, where, a note</summary>
          <div className="bk-fields">
            {session && (
              <label className="money">
                <span className="money-label">Hours played</span>
                <input className="num" inputMode="decimal" autoComplete="off" value={hours} onChange={(e) => setHours(e.target.value)} />
              </label>
            )}
            {session && (
              <div className="money">
                <span className="money-label">Where</span>
                <div className="seg" role="group" aria-label="Where">
                  {(["online", "live"] as const).map((w) => (
                    <button key={w} type="button" className={w === where ? "seg-btn seg-active" : "seg-btn"} aria-pressed={w === where} onClick={() => setWhere(w === where ? "" : w)}>
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <label className="money bk-note">
              <span className="money-label">Note</span>
              <input className="num bk-text" maxLength={140} value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
          </div>
        </details>
        {error && (
          <p className="signup-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary">
          Log it
        </button>
      </form>

      {s.backupDue && (
        <p className="ro-note">
          <strong>Time for a backup.</strong> Your sessions live in this browser only. Download the file below and keep it
          somewhere safe; clearing your browser data would otherwise take them with it.
        </p>
      )}

      <h3 className="ro-title">
        Everything logged <span className="ro-sub">newest first</span>
      </h3>
      {rows.length === 0 ? (
        <p className="hint">Nothing yet. Log your next session above, win or lose. The losing ones are the ones people skip.</p>
      ) : (
        <table className="odds-table bk-table">
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">What</th>
              <th scope="col">Result</th>
              <th scope="col">
                <span className="sr-only">Delete</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <Row key={e.id} e={e} money={money} stakeName={ladder.find((st) => st.bb === e.bb)?.name} onDelete={() => onChange(removeEntry(log, e.id))} />
            ))}
          </tbody>
        </table>
      )}

      <div className="bk-backup">
        <button type="button" className="btn" onClick={download} disabled={log.entries.length === 0}>
          Download my sessions (CSV)
        </button>
        <button type="button" className="btn" onClick={() => file.current?.click()}>
          Import a CSV
        </button>
        <input ref={file} type="file" accept=".csv,text/csv" className="sr-only" tabIndex={-1} aria-label="CSV file to import" onChange={(e) => importFile(e.target.files?.[0])} />
        {confirmWipe ? (
          <span className="bk-wipe">
            <button type="button" className="link-btn bk-danger" onClick={() => onChange(null)}>
              Yes, delete all of it
            </button>
            <button type="button" className="link-btn" onClick={() => setConfirmWipe(false)}>
              Keep it
            </button>
          </span>
        ) : (
          <button type="button" className="link-btn" onClick={() => setConfirmWipe(true)}>
            Delete everything
          </button>
        )}
      </div>
      {notice.length > 0 && (
        <p className="hint" role="status">
          {notice.map((n, i) => (
            <span key={i} className="bk-notice-line">
              {n}
            </span>
          ))}
        </p>
      )}
      <p className="hint">
        The file opens in any spreadsheet. To bring in results you already keep in one, give it a first line with the
        column names <code>date</code> (as 2026-11-19), <code>type</code> (cash, tournament, deposit or withdrawal),{" "}
        <code>money_in</code> and <code>money_out</code>; deposits and withdrawals use <code>amount</code>. Other columns are
        ignored.
      </p>
    </section>
  );
}

function Row({ e, money, stakeName, onDelete }: { e: Entry; money: (c: number) => string; stakeName?: string; onDelete: () => void }) {
  const d = delta(e);
  const what =
    e.kind === "cash" ? `Cash${stakeName ? " " + stakeName : ""}` : e.kind === "tournament" ? `Tournament, ${money(e.cost)} in` : KIND_NAME[e.kind];
  const extra = [e.live === undefined ? "" : e.live ? "live" : "online", e.minutes ? `${+(e.minutes / 60).toFixed(1)} h` : "", e.note ?? ""].filter(Boolean).join(" · ");
  return (
    <tr>
      <td>
        <time dateTime={e.at}>{longDate(e.at).replace(/ \d{4}$/, "")}</time>
      </td>
      <th scope="row">
        {what}
        {extra && <span className="odds-sub">{extra}</span>}
      </th>
      <td>
        {isSession(e) ? (
          <span className={d > 0 ? "tag tag-good" : d < 0 ? "tag tag-warn" : "tag bk-even"}>{money(d)}</span>
        ) : (
          <span className="bk-move">{d > 0 ? "+" : ""}{money(d)}</span>
        )}
      </td>
      <td className="bk-del">
        <button type="button" className="link-btn" onClick={onDelete} aria-label={`Delete ${what}, ${e.at}`}>
          Delete
        </button>
      </td>
    </tr>
  );
}

/**
 * The bankroll after every entry, as one line. A single series: paper on ink, no legend (the
 * heading names it), the starting bankroll as a dotted hairline, the low and high in the caption
 * (HTML, so they stay readable on a phone). Hover or drag to read any point; the list below is its table view.
 */
export function BankrollLine({ series, money }: { series: { at: string; bankroll: number }[]; money: (c: number) => string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 720, H = 200, L = 8, R = 8, T = 10, B = 10;
  const values = series.map((p) => p.bankroll);
  const lo = Math.min(...values), hi = Math.max(...values);
  const span = hi - lo || 1;
  const x = (i: number) => L + (i / (series.length - 1)) * (W - L - R);
  const y = (v: number) => T + (1 - (v - lo) / span) * (H - T - B);
  const path = series.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.bankroll).toFixed(1)}`).join(" ");
  const last = series.length - 1;
  const at = hover ?? last;
  const day = (i: number) => (series[i].at ? longDate(series[i].at) : "Start");

  const pick = (clientX: number, el: SVGSVGElement) => {
    const box = el.getBoundingClientRect();
    const i = Math.round((((clientX - box.left) / box.width) * W - L) / ((W - L - R) / last));
    setHover(Math.max(0, Math.min(last, i)));
  };

  return (
    <figure className="bk-line">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Your bankroll over ${last} entries: from ${money(series[0].bankroll)} to ${money(series[last].bankroll)}, low ${money(lo)}, high ${money(hi)}.`}
        onPointerMove={(e) => pick(e.clientX, e.currentTarget)}
        onPointerDown={(e) => pick(e.clientX, e.currentTarget)}
        onPointerLeave={() => setHover(null)}
      >
        <line className="bk-line-base" x1={L} x2={W - R} y1={y(series[0].bankroll)} y2={y(series[0].bankroll)} />
        <path className="bk-line-path" d={path} />
        {hover !== null && <line className="bk-line-cross" x1={x(at)} x2={x(at)} y1={T} y2={H - B} />}
        <circle className="bk-line-dot" cx={x(at)} cy={y(series[at].bankroll)} r={4} />
      </svg>
      <figcaption className="bk-line-caption">
        <span>
          <strong>{money(series[at].bankroll)}</strong> · {hover === null ? "now" : day(at)}
          {hover !== null && at > 0 && <> · entry {at} of {last}</>}
        </span>
        <span>
          low {money(lo)} · high {money(hi)}
        </span>
      </figcaption>
    </figure>
  );
}
