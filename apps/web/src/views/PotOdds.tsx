/**
 * /learn/pot-odds — pot odds for beginners: what "the price" is, the one formula
 * (call ÷ final pot = equity you need), a worked example, a bet-size → needed-equity table
 * computed with poker/odds.potOdds (so it can't drift from the tool), how to compare it
 * with your equity, and implied odds in one paragraph.
 * Targets searches like "pot odds", "pot odds explained", "how to calculate pot odds",
 * "pot odds chart". Prerendered to HTML at build time.
 * Uses: components/Guide, components/Link, poker/odds.
 */

import { Guide, Callout } from "../components/Guide";
import { Link } from "../components/Link";
import { potOdds, formatPct } from "../poker/odds";

// Common bet sizes as a fraction of the pot, with the names players use for them.
const SIZES: [number, string][] = [
  [0.25, "Quarter pot"],
  [1 / 3, "Third of the pot"],
  [0.5, "Half pot"],
  [2 / 3, "Two-thirds pot"],
  [0.75, "Three-quarters pot"],
  [1, "Pot-size bet"],
  [1.5, "1.5× pot (overbet)"],
  [2, "2× pot (overbet)"],
];

const example = potOdds(100, 50);

export default function PotOdds() {
  return (
    <Guide
      path="/learn/pot-odds"
      title="Pot odds, explained simply."
      lead="Every time someone bets, the pot offers you a price. Pot odds tell you how often you need to win for calling to pay off. Learn one formula and you'll never again guess whether a call is good."
    >
      <section className="strat-section">
        <div className="strat-head">
          <h2>The price of a call</h2>
        </div>
        <ul className="strat-list">
          <li>
            <strong>Pot odds compare what you pay with what you can win.</strong> If calling costs a little and the pot
            is big, you don't need to win often. If calling costs a lot, you need to win a lot.
          </li>
          <li>
            <strong>The formula:</strong> equity you need = <em>your call</em> ÷ <em>the pot after you call</em>. The
            pot after you call is the pot before the bet, plus the bet, plus your call.
          </li>
          <li>
            <strong>Equity</strong> is how often your hand wins (your share of the pot over many replays). If your
            equity is higher than the equity you need, calling makes money in the long run. If it's lower, fold, unless
            you'll win more later (see implied odds below).
          </li>
        </ul>
      </section>

      <section className="strat-section">
        <div className="strat-head">
          <h2>A worked example</h2>
        </div>
        <div className="figures">
          <div className="figure">
            <span className="figure-label">Pot</span>
            <span className="figure-value">100</span>
            <span className="figure-note">before the bet</span>
          </div>
          <div className="figure">
            <span className="figure-label">They bet</span>
            <span className="figure-value">50</span>
            <span className="figure-note">half the pot</span>
          </div>
          <div className="figure">
            <span className="figure-label">You need</span>
            <span className="figure-value">
              {Math.round(example.requiredEquity * 100)}
              <span className="figure-unit">%</span>
            </span>
            <span className="figure-note">price {example.ratio}</span>
          </div>
        </div>
        <p className="ro-caption">
          You call 50 to win a pot of {example.potAfterCall} (100 + their 50 + your 50). 50 ÷ {example.potAfterCall} ={" "}
          {formatPct(example.requiredEquity, 0)}. Players also say you're getting <strong>{example.ratio}</strong>: the 150
          already in the middle against your 50. Win more than one time in four and the call is profitable.
        </p>
      </section>

      <section className="strat-section">
        <div className="strat-head">
          <h2>Pot odds chart: bet size → equity you need</h2>
        </div>
        <table className="odds-table">
          <thead>
            <tr>
              <th scope="col">Bet</th>
              <th scope="col">Price</th>
              <th scope="col">You need</th>
            </tr>
          </thead>
          <tbody>
            {SIZES.map(([f, name]) => {
              const o = potOdds(100, 100 * f);
              return (
                <tr key={name}>
                  <th scope="row">{name}</th>
                  <td>{o.ratio}</td>
                  <td>{formatPct(o.requiredEquity)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="ro-caption">
          The bigger the bet compared with the pot, the more often you need to win. A half-pot bet asks for 25%, a pot-size
          bet 33%, and even a huge overbet never asks for more than 50%.
        </p>
      </section>

      <section className="strat-section">
        <div className="strat-head">
          <h2>Putting it together</h2>
        </div>
        <ul className="strat-list">
          <li>
            <strong>Work out the price,</strong> using the chart above.
          </li>
          <li>
            <strong>Estimate your equity.</strong> With a draw, count your outs and use the{" "}
            <Link to="/learn/outs">rule of 2 and 4</Link>. A flush draw on the flop is about 35% to hit by the river.
          </li>
          <li>
            <strong>Compare.</strong> Facing a half-pot bet with a flush draw: 35% against the 25% you need, so it's a
            call (or a raise). Facing a 2× pot overbet, you'd need 40%: fold, unless you expect to win a lot more when
            you hit.
          </li>
        </ul>
      </section>

      <section className="strat-section">
        <div className="strat-head">
          <h2>Implied odds: when the price is short</h2>
        </div>
        <p className="ro-caption">
          Pot odds only count the money in the pot now. <strong>Implied odds</strong> add what you expect to win later
          when you hit. That's why small pairs can call raises before the flop: they rarely hit a set, but when they do,
          they can win a big pot. Implied odds only work when there's plenty of money left behind (a deep stack) and
          your opponent will pay you off. Short stacks mean no implied odds. The{" "}
          <Link to="/glossary">glossary</Link> has the details.
        </p>
      </section>

      <Callout to="/table" label="Check a spot">
        The odds calculator does all of this for you: enter the pot and the bet and it shows the equity you need, your
        real equity against their range, and whether to call.
      </Callout>
    </Guide>
  );
}
