/**
 * <BankrollCalculator>: a bankroll, the game (cash or tournaments) and how careful you want to be
 * → the verdict from poker/bankroll.advise(): the stake you are rolled for, the line to move up at
 * and the line to move down below. Risk of ruin is the second number, behind "How risky is that?",
 * with the assumptions it rests on shown and editable.
 * With `tracked` set (the tracker's bankroll) the amount is read from there instead of typed.
 * With `onTrack` set, a button under the verdict starts the tracker from the typed bankroll.
 * Prerendered: the first render is the example bankroll below, with no storage, clock or
 * randomness (the tournament simulation is seeded).
 * Used by: views/Bankroll, views/BankrollGuide.
 * Uses: poker/bankroll, poker/odds (formatPct), components/Explain.
 */

import { useMemo, useState } from "react";
import {
  advise,
  bankrollForRuin,
  BUYINS,
  CASH_DEFAULTS,
  cashRuin,
  Format,
  formatMoney,
  parseMoney,
  Risk,
  RISKS,
  TOURNAMENT_DEFAULTS,
  tournamentEdge,
  tournamentRuin,
} from "../poker/bankroll";
import { formatPct } from "../poker/odds";
import { Explain, Formula } from "./Explain";

const RISK_NAME: Record<Risk, string> = { aggressive: "Aggressive", standard: "Standard", careful: "Careful" };
const FORMAT_NAME: Record<Format, string> = { cash: "Cash games", tournament: "Tournaments" };

/** Buy-ins as a person says them: "50", or "7.5" when small enough for the half to matter. */
const count = (n: number) => (n >= 10 ? String(Math.floor(n)) : (Math.floor(n * 10) / 10).toString());
/** A chance as a percentage, without pretending to more precision than it has. */
const chance = (p: number) => (p >= 0.995 ? "100%" : p > 0 && p < 0.001 ? "under 0.1%" : formatPct(p, p < 0.1 ? 1 : 0));
const number = (text: string, fallback: number) => (text.trim() !== "" && Number.isFinite(Number(text)) ? Number(text) : fallback);

export function BankrollCalculator({
  tracked = null,
  symbol = "$",
  onTrack,
}: {
  tracked?: number | null;
  symbol?: string;
  onTrack?: (bankroll: number) => void;
}) {
  const [text, setText] = useState("500");
  const [format, setFormat] = useState<Format>("cash");
  const [risk, setRisk] = useState<Risk>("standard");
  const [winRate, setWinRate] = useState(String(CASH_DEFAULTS.winRate));
  const [sd, setSd] = useState(String(CASH_DEFAULTS.sd));
  const [field, setField] = useState(String(TOURNAMENT_DEFAULTS.field));
  const [roi, setRoi] = useState(String(TOURNAMENT_DEFAULTS.roi * 100));

  const bankroll = tracked ?? parseMoney(text);
  const a = bankroll === null ? null : advise(Math.max(0, bankroll), format, risk, symbol);
  const money = (cents: number) => formatMoney(cents, symbol);

  const wr = number(winRate, CASH_DEFAULTS.winRate);
  const swing = Math.max(1, number(sd, CASH_DEFAULTS.sd));
  const players = Math.min(100000, Math.max(2, Math.round(number(field, TOURNAMENT_DEFAULTS.field))));
  const edge = number(roi, TOURNAMENT_DEFAULTS.roi * 100) / 100;
  const held = a?.stake ? a.held : 0;
  const tourRuin = useMemo(
    () => (format === "tournament" && held > 0 ? tournamentRuin(held, { field: players, roi: edge }) : null),
    [format, held, players, edge]
  );

  return (
    <div className="bk-calc">
      <div className="bk-inputs">
        <label className="money">
          <span className="money-label">{tracked === null ? "Your bankroll" : "Your bankroll (tracked)"}</span>
          {tracked === null ? (
            <span className="bk-amount">
              <span aria-hidden="true">{symbol}</span>
              <input className="num" inputMode="decimal" autoComplete="off" value={text} onChange={(e) => setText(e.target.value)} />
            </span>
          ) : (
            <span className="num bk-fixed">{money(tracked)}</span>
          )}
        </label>
        <div className="money">
          <span className="money-label">You play</span>
          <div className="seg" role="group" aria-label="Game type">
            {(["cash", "tournament"] as Format[]).map((f) => (
              <button key={f} type="button" className={f === format ? "seg-btn seg-active" : "seg-btn"} aria-pressed={f === format} onClick={() => setFormat(f)}>
                {FORMAT_NAME[f]}
              </button>
            ))}
          </div>
        </div>
        <div className="money">
          <span className="money-label">How careful</span>
          <div className="seg" role="group" aria-label="How careful">
            {RISKS.map((r) => (
              <button key={r} type="button" className={r === risk ? "seg-btn seg-active" : "seg-btn"} aria-pressed={r === risk} onClick={() => setRisk(r)}>
                {RISK_NAME[r]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!a || bankroll === null ? (
        <p className="hint bk-empty">Type your bankroll as a plain amount, like 500 or 1,250.50.</p>
      ) : a.stake ? (
        <>
          <div className="verdict verdict-aggressive bk-verdict" aria-live="polite">
            <span className="kicker">
              <span className="kicker-dot" />
              You're rolled for
            </span>
            <p className="verdict-action">{a.stake.name}</p>
            <p className="standfirst">
              {money(bankroll)} is {count(a.held)} buy-ins of {money(a.stake.buyIn)}. The {risk} rule keeps {a.buyins}
              {format === "cash" ? ", and a buy-in is 100 big blinds." : ", fee included."}
            </p>
          </div>
          <div className="figures bk-figures">
            <div className="figure">
              <span className="figure-label">Buy-ins held</span>
              <span className="figure-value">{count(a.held)}</span>
              <span className="figure-note">the rule keeps {a.buyins}</span>
            </div>
            <div className="figure">
              <span className="figure-label">Move up at</span>
              <span className="figure-value">{a.moveUpAt === null ? "—" : money(a.moveUpAt)}</span>
              <span className="figure-note">{a.next ? `to ${a.next.name}` : "the top of this ladder"}</span>
            </div>
            <div className="figure">
              <span className="figure-label">Move down below</span>
              <span className="figure-value">{money(a.moveDownBelow!)}</span>
              <span className="figure-note">{a.lower ? `to ${a.lower.name}` : "the lowest stake here"}</span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="verdict verdict-fold bk-verdict" aria-live="polite">
            <span className="kicker">
              <span className="kicker-dot" />
              Not rolled yet
            </span>
            <p className="verdict-action">Build to {money(a.needs)}</p>
            <p className="standfirst">
              The lowest stake here, {a.next!.name}, takes {a.buyins} buy-ins of {money(a.next!.buyIn)} at the {risk} rule.
              Until then, practice costs nothing: play-money tables and the trainer.
            </p>
          </div>
          <div className="figures bk-figures">
            <div className="figure">
              <span className="figure-label">You have</span>
              <span className="figure-value">{money(bankroll)}</span>
              <span className="figure-note">{count(bankroll / a.next!.buyIn)} buy-ins</span>
            </div>
            <div className="figure">
              <span className="figure-label">Lowest stake needs</span>
              <span className="figure-value">{money(a.needs)}</span>
              <span className="figure-note">{a.next!.name}</span>
            </div>
            <div className="figure">
              <span className="figure-label">Short by</span>
              <span className="figure-value">{money(a.needs - bankroll)}</span>
              <span className="figure-note">at the {risk} rule</span>
            </div>
          </div>
        </>
      )}

      {a?.stake && bankroll !== null && (
        <Explain title="How risky is that? Risk of ruin">
          <p>
            <strong>Risk of ruin</strong> is the chance of losing the whole bankroll if you stay at this stake and{" "}
            <strong>never move down</strong>. The buy-in rule above is what stops that from happening: you move down at the
            line, long before the money is gone. Read this number as the price of ignoring the line.
          </p>
          {format === "cash" ? (
            <CashRuin bb={bankroll / a.stake.bb!} wr={wr} sd={swing} winRate={winRate} sdText={sd} setWinRate={setWinRate} setSd={setSd} />
          ) : (
            <>
              <p className="bk-ruin">
                <span className="bk-ruin-value">{chance(tourRuin ?? 1)}</span>
                <span>
                  of players like this one run out of buy-ins within their next {TOURNAMENT_DEFAULTS.tournaments.toLocaleString("en-US")}{" "}
                  tournaments, starting with {count(a.held)} buy-ins.
                </span>
              </p>
              <div className="bk-assume">
                <label className="money">
                  <span className="money-label">Players per tournament</span>
                  <input className="num" inputMode="numeric" value={field} onChange={(e) => setField(e.target.value)} />
                </label>
                <label className="money">
                  <span className="money-label">Your ROI, in %</span>
                  <input className="num" inputMode="decimal" value={roi} onChange={(e) => setRoi(e.target.value)} />
                </label>
              </div>
              <p>
                <strong>What this assumes.</strong> ROI (return on investment) is what you win back on top of the buy-ins you
                pay: 10% means $11 back for every $10 paid, on average. The top 15% of the field is paid, each place 1 ÷ its
                rank of the prize pool, and you reach each paid place {edge >= 0 ? "more" : "less"} often than an average
                player by exactly your ROI. With these numbers you cash {formatPct(tournamentEdge({ field: players, roi: edge }).cashes, 0)} of
                the time. We then play {TOURNAMENT_DEFAULTS.tournaments.toLocaleString("en-US")} tournaments 2,000 times over and
                count the runs that go broke. Real payouts differ from site to site, so treat it as a close estimate.
              </p>
              {edge <= 0 && (
                <p>
                  <strong>With an ROI of zero or less, no bankroll is big enough.</strong> More buy-ins only make it last
                  longer. That's a budget for playing, which is fine, but it isn't a bankroll.
                </p>
              )}
              <p>
                Bigger fields swing harder: the same bankroll that is safe in 100-player tournaments is thin in 1,000-player
                ones. Try it above.
              </p>
            </>
          )}
        </Explain>
      )}

      {onTrack && (
        <div className="callout bk-track">
          <p>
            <strong>Keep it honest from here.</strong> Log each session and this page works from your real bankroll: what
            you can play today, your results, and when to move.
          </p>
          <button type="button" className="btn" disabled={bankroll === null} onClick={() => bankroll !== null && onTrack(bankroll)}>
            Track it from here
          </button>
        </div>
      )}
    </div>
  );
}

function CashRuin({
  bb,
  wr,
  sd,
  winRate,
  sdText,
  setWinRate,
  setSd,
}: {
  bb: number;
  wr: number;
  sd: number;
  winRate: string;
  sdText: string;
  setWinRate: (s: string) => void;
  setSd: (s: string) => void;
}) {
  const ruin = cashRuin(bb, wr, sd);
  const safe = bankrollForRuin(0.05, wr, sd) / 100;
  return (
    <>
      <p className="bk-ruin">
        <span className="bk-ruin-value">{chance(ruin)}</span>
        <span>chance of losing all {count(bb / 100)} buy-ins at this stake, if you never move down.</span>
      </p>
      <div className="bk-assume">
        <label className="money">
          <span className="money-label">Your win rate, bb per 100 hands</span>
          <input className="num" inputMode="decimal" value={winRate} onChange={(e) => setWinRate(e.target.value)} />
        </label>
        <label className="money">
          <span className="money-label">Your swings (SD), bb per 100 hands</span>
          <input className="num" inputMode="decimal" value={sdText} onChange={(e) => setSd(e.target.value)} />
        </label>
      </div>
      <p>
        <strong>What this assumes.</strong> Your <strong>win rate</strong> is what you win per 100 hands, in big blinds (bb);{" "}
        {CASH_DEFAULTS.winRate} is a small winner. Your <strong>swings</strong> are the standard deviation (SD) of those
        results; {CASH_DEFAULTS.sd} is typical for six-handed no-limit hold'em. A tracking program shows both. If you don't
        know yours, leave them: most players guess their win rate too high.
      </p>
      {wr > 0 ? (
        <>
          <Formula
            steps={[
              { label: "Formula", expr: "e^(−2 × win rate × bankroll ÷ SD²)" },
              { label: "Yours", expr: `e^(−2 × ${wr} × ${Math.round(bb).toLocaleString("en-US")} ÷ ${sd}²)`, result: chance(ruin) },
            ]}
          />
          <p>
            To hold that risk at 5% without ever moving down, this player would need about <strong>{Math.ceil(safe)} buy-ins</strong>.
            That's why the rule that matters is the move-down line, not the size of the pile.
          </p>
        </>
      ) : (
        <p>
          <strong>With a win rate of zero or less, no bankroll is big enough.</strong> More buy-ins only make it last longer.
          That's a budget for playing, which is fine, but it isn't a bankroll.
        </p>
      )}
    </>
  );
}

/** The rule table as rows, for the guide: every number comes from poker/bankroll. */
export function ruleRows(): { risk: Risk; name: string; cash: number; tournament: number }[] {
  return RISKS.map((r) => ({ risk: r, name: RISK_NAME[r], cash: BUYINS.cash[r], tournament: BUYINS.tournament[r] }));
}
