/**
 * <Readout> — "the read", the right column, laid out like a short article: the verdict
 * (kicker, headline action, reason), three figures (equity / needed or pot / outs, SPR or
 * stack), the win-tie-lose split, draws, the price (pot odds, implied odds, SPR), what
 * beats you, and the math. Pure presentation: everything comes from the Analysis
 * (poker/analyze) and the EquityResult (poker/equity); it computes nothing itself
 * except display formatting. The Trainer hides the verdict with showReco={false}.
 * Used by: views/PlayTool, views/Trainer.
 * Uses: poker/cards, poker/evaluator, poker/odds, components/Charts, components/Explain.
 */

import { RANKS, SUIT_SYMBOL, rankOf, suitOf, Card } from "../poker/cards";
import { CATEGORY_NAMES, bestScore, categoryName } from "../poker/evaluator";
import type { EquityResult } from "../poker/equity";
import type { Analysis, Spot } from "../poker/analyze";
import { formatPct, outsToEquity } from "../poker/odds";
import { EquityGauge, PotBar } from "./Charts";
import { Explain, Formula, Term } from "./Explain";

const STREETS = ["Preflop", "Flop", "Turn", "River"];

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function cardText(c: Card) {
  const red = suitOf(c) === 1 || suitOf(c) === 2;
  return (
    <span className={red ? "ctext ctext-red" : "ctext"}>
      {RANKS[rankOf(c)]}
      {SUIT_SYMBOL[suitOf(c)]}
    </span>
  );
}

/** A large editorial numeral with a small-caps caption. */
function Figure({ label, value, unit, note }: { label: string; value: string; unit?: string; note?: string }) {
  return (
    <div className="figure">
      <span className="figure-label">{label}</span>
      <span className="figure-value">
        {value}
        {unit && <span className="figure-unit">{unit}</span>}
      </span>
      {note && <span className="figure-note">{note}</span>}
    </div>
  );
}

export function Readout({
  spot,
  a,
  result,
  computing,
  oppsText,
  showReco = true,
}: {
  spot: Spot;
  a: Analysis;
  result: EquityResult;
  computing: boolean;
  oppsText: string;
  showReco?: boolean;
}) {
  const facing = spot.facingBet && spot.bet > 0;
  const verdict = result.equity >= a.requiredEquity ? "Call" : "Fold";
  const madeHand = spot.board.length >= 3 ? categoryName(bestScore([spot.hero[0], spot.hero[1], ...spot.board])) : null;
  const threats = result.beatenBy
    .map((c, i) => ({ name: CATEGORY_NAMES[i], frac: result.loseCount ? c / result.loseCount : 0 }))
    .filter((t) => t.frac > 0)
    .sort((x, y) => y.frac - x.frac)
    .slice(0, 4);
  const d = a.draws;
  const reco = a.reco;
  const eqPct = Math.round(result.equity * 100);

  return (
    <article className={computing ? "readout is-computing" : "readout"}>
      {showReco && reco && (
        <header className={`verdict verdict-${reco.tone}`}>
          <span className="kicker">
            <span className="kicker-dot" aria-hidden="true" />
            The play · {STREETS[a.street]}
          </span>
          <h2 className="verdict-action">{reco.action}</h2>
          <p className="standfirst">{reco.reason}</p>
        </header>
      )}

      <div className="figures">
        <Figure label="Equity" value={String(eqPct)} unit="%" note={madeHand ?? a.hand} />
        {facing ? (
          <Figure label="Needed" value={String(Math.round(a.requiredEquity * 100))} unit="%" note={`price ${a.ratio}`} />
        ) : (
          <Figure label="Pot" value={fmt(spot.pot)} note="no bet to call" />
        )}
        {d ? (
          <Figure label="Outs" value={String(d.outs.length)} note={d.draws[0] ?? (d.outs.length ? "to improve" : "none")} />
        ) : a.street === 0 ? (
          <Figure label="Stack" value={fmt(spot.stack)} note="effective" />
        ) : (
          <Figure label="SPR" value={a.spr === Infinity ? "—" : a.spr.toFixed(1)} note="stack ÷ pot" />
        )}
      </div>

      <section className="ro-section">
        <h3 className="ro-title">Showdown</h3>
        <div className="split" role="img" aria-label={`Win ${formatPct(result.win)}, tie ${formatPct(result.tie)}, lose ${formatPct(result.lose)}`}>
          <span className="split-win" style={{ width: `${result.win * 100}%` }} />
          <span className="split-tie" style={{ width: `${result.tie * 100}%` }} />
          <span className="split-lose" style={{ width: `${result.lose * 100}%` }} />
        </div>
        <dl className="split-legend">
          <div>
            <dt>Win</dt>
            <dd>{formatPct(result.win)}</dd>
          </div>
          <div>
            <dt>Tie</dt>
            <dd>{formatPct(result.tie)}</dd>
          </div>
          <div>
            <dt>Lose</dt>
            <dd>{formatPct(result.lose)}</dd>
          </div>
        </dl>
        <p className="ro-caption">
          Your share of the pot against {oppsText}: <strong>{formatPct(result.equity)}</strong>.
        </p>
      </section>

      {d && (
        <section className="ro-section">
          <h3 className="ro-title">
            Draws <span className="ro-sub">{d.cardsToCome === 2 ? "turn and river to come" : "river to come"}</span>
          </h3>
          {d.outs.length === 0 ? (
            <p className="ro-caption">
              Nothing that makes two pair or better.
              {d.overcards > 0 &&
                ` ${d.overcards === 2 ? "Two overcards" : "One overcard"} — ${d.overcards * 3} weak outs to a pair.`}
            </p>
          ) : (
            <>
              <p className="ro-lede">
                {d.draws.length > 0 ? d.draws.join(" and ") : "Improvement"} —{" "}
                {d.byHand.map((h) => `${h.count} to ${h.name.toLowerCase()}`).join(", ")}.
              </p>
              <p className="outs-list">{d.outs.map((c) => <span key={c}>{cardText(c)}</span>)}</p>
              <p className="ro-caption">
                Next card <strong>{formatPct(d.nextCard)}</strong>
                {d.cardsToCome === 2 && (
                  <>
                    {" "}· by the river <strong>{formatPct(d.byRiver)}</strong>
                  </>
                )}{" "}
                · rule of {d.cardsToCome === 2 ? 4 : 2} ≈ {formatPct(outsToEquity(d.outs.length, d.cardsToCome), 0)}
              </p>
            </>
          )}
        </section>
      )}

      <section className="ro-section">
        <h3 className="ro-title">
          The price{" "}
          {facing && <span className={verdict === "Call" ? "verdict-mark mark-call" : "verdict-mark mark-fold"}>{verdict}</span>}
        </h3>
        {facing ? (
          <>
            <PotBar pot={spot.pot} bet={a.call} />
            <EquityGauge equity={result.equity} required={a.requiredEquity} />
            {a.allIn && (
              <p className="ro-caption">
                Calling puts you <strong>all-in</strong> for {fmt(a.call)}.
              </p>
            )}
            {a.implied && (
              <p className="ro-note">
                <em>Implied odds.</em> You'd need to win about <strong>{fmt(Math.round(a.implied.extraNeeded))}</strong> more
                when you hit. With {fmt(spot.stack - a.call)} behind, that's{" "}
                {a.implied.ok ? "realistic — the draw can pay." : "too much to count on."}
              </p>
            )}
            {a.street > 0 && (
              <p className="ro-caption">
                Stack-to-pot ratio <strong>{a.spr.toFixed(1)}</strong>.
              </p>
            )}
          </>
        ) : (
          <p className="ro-caption">
            {a.street === 0
              ? spot.position === "BB"
                ? "Limped or folded to you in the big blind — checking is free."
                : "Nobody has raised. The choice is to open or to fold."
              : "Checked to you, or you're first to act — you may check for free or bet."}
            {a.street > 0 &&
              (a.spr <= 2.5
                ? ` Low SPR (${a.spr.toFixed(1)}): with a strong hand you're committed.`
                : a.spr >= 8
                  ? ` Deep stacks (SPR ${a.spr.toFixed(1)}): big pots want big hands.`
                  : ` Medium SPR (${a.spr.toFixed(1)}): top pair bets, but beware of stacking off.`)}
          </p>
        )}
      </section>

      <section className="ro-section">
        <h3 className="ro-title">
          What beats you <span className="ro-sub">in the {formatPct(result.lose, 0)} you lose</span>
        </h3>
        {threats.length === 0 ? (
          <p className="ro-caption">Almost nothing. You're ahead of essentially every hand here.</p>
        ) : (
          <div className="threats">
            {threats.map((t) => (
              <div className="threat" key={t.name}>
                <span className="threat-name">{t.name}</span>
                <div className="threat-track">
                  <div className="threat-fill" style={{ width: `${t.frac * 100}%` }} />
                </div>
                <span className="threat-pct">{formatPct(t.frac, 0)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <Explain title="The math">
        <p>
          <strong>Equity</strong> comes from a{" "}
          <Term def="Dealing the unknown cards at random thousands of times and counting how often you win.">
            Monte Carlo simulation
          </Term>{" "}
          of {result.iterations.toLocaleString()} hands, each opponent dealt from their range. Ties are shared only
          with the players who tied.
        </p>
        <Formula
          steps={[
            {
              label: "equity",
              expr: `(${result.winCount.toLocaleString()} wins + ${result.tieShare.toFixed(0)} tie shares) ÷ ${result.iterations.toLocaleString()}`,
              result: formatPct(result.equity),
            },
          ]}
        />
        {facing && (
          <>
            <p>
              <strong>Pot odds</strong> are the price of the call: chips in ÷ final pot.
            </p>
            <Formula
              steps={[
                {
                  label: "needed",
                  expr: `${fmt(a.call)} ÷ (${fmt(spot.pot)} + ${fmt(spot.bet)} + ${fmt(a.call)})`,
                  result: formatPct(a.requiredEquity),
                },
              ]}
            />
          </>
        )}
        {a.implied && d && (
          <>
            <p>
              <strong>Implied odds</strong>: what you must win later for a call that's too expensive now. p is the
              chance to hit on the next card.
            </p>
            <Formula
              steps={[
                {
                  label: "extra",
                  expr: `${fmt(a.call)} × (1 − ${d.nextCard.toFixed(3)}) ÷ ${d.nextCard.toFixed(3)} − ${fmt(spot.pot + spot.bet)}`,
                  result: fmt(Math.round(a.implied.extraNeeded)),
                },
              ]}
            />
          </>
        )}
        {a.street > 0 && <Formula steps={[{ label: "SPR", expr: `${fmt(spot.stack)} ÷ ${fmt(spot.pot)}`, result: a.spr.toFixed(1) }]} />}
      </Explain>
    </article>
  );
}
