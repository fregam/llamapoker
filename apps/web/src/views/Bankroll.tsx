/**
 * /bankroll — the bankroll tool: the calculator (components/BankrollCalculator) and, once the
 * visitor starts it, their tracker (components/BankrollTracker) on the same page. Targets searches
 * like "poker bankroll calculator", "what stakes should I play" and "poker bankroll tracker".
 * Prerendered: the first render is the calculator with its example bankroll and the written notes.
 * The visitor's log is read from localStorage in an effect (poker/bankrollLog) and only then does
 * the tracker mount and the calculator switch to the tracked bankroll. This view owns the log and
 * saves every change; nothing is sent anywhere.
 * Uses: components/BankrollCalculator, components/BankrollTracker, components/Link,
 * poker/bankroll (BUYINS), poker/bankrollLog.
 */

import { useEffect, useState } from "react";
import { BankrollCalculator } from "../components/BankrollCalculator";
import { BankrollTracker } from "../components/BankrollTracker";
import { Link } from "../components/Link";
import { BUYINS } from "../poker/bankroll";
import { emptyLog, loadLog, Log, saveLog, summarize } from "../poker/bankrollLog";

const CURRENCIES = ["$", "€", "£"];

export default function Bankroll() {
  const [log, setLog] = useState<Log | null>(null);
  useEffect(() => setLog(loadLog()), []);

  const update = (next: Log | null) => {
    setLog(next);
    saveLog(next);
  };

  return (
    <div className="strategy bankroll">
      <h1 className="page-title">Your bankroll, and what it can play.</h1>
      <p className="lead">
        A bankroll is the money you keep for poker and nothing else. Enter it and see the stakes it covers, when to move
        up and when to move down. Then log your sessions, and this page keeps count for you.
      </p>

      <BankrollCalculator
        tracked={log ? summarize(log).bankroll : null}
        symbol={log?.currency ?? "$"}
        onTrack={log ? undefined : (bankroll) => update(emptyLog("$", bankroll))}
      />

      {log && (
        <>
          <BankrollTracker log={log} onChange={update} />
          <div className="bk-currency">
            <span className="money-label">Currency</span>
            <div className="seg" role="group" aria-label="Currency">
              {CURRENCIES.map((c) => (
                <button key={c} type="button" className={c === log.currency ? "seg-btn seg-active" : "seg-btn"} aria-pressed={c === log.currency} onClick={() => update({ ...log, currency: c })}>
                  {c}
                </button>
              ))}
            </div>
            <span className="stats-sub">Changes the sign only; nothing is converted.</span>
          </div>
        </>
      )}

      <section className="strat-section bk-notes">
        <div className="strat-head">
          <h2>How to read it</h2>
        </div>
        <ul className="strat-list">
          <li>
            <strong>The rule is a number of buy-ins.</strong> For cash games, keep {BUYINS.cash.standard} buy-ins of 100 big
            blinds; for tournaments, {BUYINS.tournament.standard} buy-ins, because tournament results swing much harder.
            Careful keeps more ({BUYINS.cash.careful} and {BUYINS.tournament.careful}), aggressive fewer ({BUYINS.cash.aggressive} and{" "}
            {BUYINS.tournament.aggressive}). The <Link to="/learn/bankroll-management">bankroll management guide</Link>{" "}
            explains where the numbers come from.
          </li>
          <li>
            <strong>The two lines matter more than the stake.</strong> Move up when you reach the first one. Move down the
            day you fall under the second, with no exceptions for a bad run: that one habit is what keeps a bankroll alive.
          </li>
          <li>
            <strong>Log sessions after they end,</strong> the losing ones too. Deposits and withdrawals have their own
            entries, so topping up never looks like winning.
          </li>
          <li>
            <strong>Your results stay in this browser.</strong> Nothing is sent to us and there is no account. Download
            the file now and then as a backup: clearing your browser data removes the log. More on the{" "}
            <Link to="/privacy">privacy page</Link>.
          </li>
          <li>
            <strong>Only money you can afford to lose.</strong> A bankroll is set apart from rent, bills and savings. If
            playing stops being fun, use your poker site's deposit limits and self-exclusion tools. For adults, 18+.
          </li>
        </ul>
      </section>
    </div>
  );
}
