/**
 * /learn/outs — counting outs and turning them into a percentage: what an out is, the
 * common draws with their outs, the rule of 2 and 4 (and where it overshoots), and a full
 * outs chart (1–21 outs: hit chance from flop to turn, flop to river, turn to river, plus
 * odds against). Every percentage is computed exactly here from the unseen cards (47 on the
 * flop, 46 on the turn), the same maths as the tool. Also covers "dirty" outs.
 * Targets searches like "poker outs", "outs chart", "how to count outs", "rule of 2 and 4".
 * Prerendered to HTML at build time.
 * Uses: components/Guide, components/Link, poker/odds.
 */

import { Guide, Callout } from "../components/Guide";
import { Link } from "../components/Link";
import { formatPct } from "../poker/odds";

/** Chance to hit at least one out: with one card to come (from `unseen`), or two (flop → river). */
const oneCard = (outs: number, unseen: number) => outs / unseen;
const twoCards = (outs: number) => 1 - ((47 - outs) * (46 - outs)) / (47 * 46);
const against = (p: number) => `${((1 - p) / p).toFixed(1)} : 1`;

// [draw, example, outs, turn draw (one card left)?]
const DRAWS: [string, string, number, boolean?][] = [
  ["Flush draw", "Four cards of one suit: A♥ 5♥ on K♥ 9♥ 2♣", 9],
  ["Open-ended straight draw", "Four in a row, open at both ends: 8 7 on 6 5 K", 8],
  ["Gutshot (inside straight draw)", "One card fills the gap: 9 8 on 6 5 K", 4],
  ["Two overcards", "Both your cards beat the board: A K on 9 6 2", 6],
  ["Flush draw + open-ended", "The monster draw: 8♥ 7♥ on 6♥ 5♥ K♣", 15],
  ["Flush draw + gutshot", "9♥ 8♥ on 6♥ 5♥ K♣ (a 7 fills it)", 12],
  ["Pocket pair to a set", "You hold 7 7, the board has no 7", 2],
  ["Two pair to a full house", "On the turn, with two pair: one card left", 4, true],
];

const CHART = Array.from({ length: 21 }, (_, i) => i + 1);

export default function Outs() {
  return (
    <Guide
      path="/learn/outs"
      title="Poker outs, and how to count them."
      lead="An out is a card that turns your hand into the winner. Count them and you know your odds of hitting, which, put next to the pot odds, tells you whether to call. Here's how, with a full outs chart."
    >
      <section className="strat-section">
        <div className="strat-head">
          <h2>What counts as an out</h2>
        </div>
        <ul className="strat-list">
          <li>
            <strong>An out is any card still to come that makes your hand the best one.</strong> With four hearts after
            the flop, there are 13 hearts in the deck, 4 are in sight, so 9 hearts are left: 9 outs.
          </li>
          <li>
            <strong>Count each card once.</strong> If a card gives you both a flush and a straight, it's still one out.
          </li>
          <li>
            <strong>Watch for dirty outs:</strong> cards that improve you but also give your opponent a better hand. If
            the board is paired, your flush card might give them a full house. When in doubt, count a doubtful out as
            half.
          </li>
        </ul>
      </section>

      <section className="strat-section">
        <div className="strat-head">
          <h2>Common draws</h2>
        </div>
        <table className="odds-table">
          <thead>
            <tr>
              <th scope="col">Draw</th>
              <th scope="col">Outs</th>
              <th scope="col">By the river</th>
            </tr>
          </thead>
          <tbody>
            {DRAWS.map(([name, example, outs, turn]) => (
              <tr key={name}>
                <th scope="row">
                  {name}
                  <span className="odds-sub">{example}</span>
                </th>
                <td>{outs}</td>
                <td>{formatPct(turn ? oneCard(outs, 46) : twoCards(outs))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="ro-caption">
          "By the river" is the chance of hitting from the flop with both the turn and the river to come, except two pair
          to a full house, which is a turn draw with only the river left.
        </p>
      </section>

      <section className="strat-section">
        <div className="strat-head">
          <h2>The rule of 2 and 4</h2>
        </div>
        <ul className="strat-list">
          <li>
            <strong>On the flop,</strong> with two cards to come, multiply your outs by <strong>4</strong>. Nine outs ×
            4 ≈ 36%. The exact figure is {formatPct(twoCards(9))}.
          </li>
          <li>
            <strong>On the turn,</strong> with one card to come, multiply by <strong>2</strong>. Nine outs × 2 ≈ 18%.
            Exactly: {formatPct(oneCard(9, 46))}.
          </li>
          <li>
            <strong>It overshoots big draws.</strong> Above about 8 outs, the ×4 rule runs high: 15 outs × 4 = 60%, but
            the real chance is {formatPct(twoCards(15))}. A quick fix: on the flop, subtract (outs − 8) from the
            answer.
          </li>
          <li>
            <strong>Only count "by the river" if you'll see both cards.</strong> If someone can bet big again on the
            turn, you'll pay twice. Then the one-card number (×2) is the honest one for this call.
          </li>
        </ul>
      </section>

      <section className="strat-section">
        <div className="strat-head">
          <h2>Outs chart</h2>
        </div>
        <table className="odds-table odds-chart">
          <thead>
            <tr>
              <th scope="col">Outs</th>
              <th scope="col">Flop → turn</th>
              <th scope="col">Flop → river</th>
              <th scope="col">Turn → river</th>
              <th scope="col">Odds against (turn)</th>
            </tr>
          </thead>
          <tbody>
            {CHART.map((o) => (
              <tr key={o}>
                <th scope="row">{o}</th>
                <td>{formatPct(oneCard(o, 47))}</td>
                <td>{formatPct(twoCards(o))}</td>
                <td>{formatPct(oneCard(o, 46))}</td>
                <td>{against(oneCard(o, 46))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="ro-caption">
          Flop → turn and turn → river: one card to come (47 and 46 unseen cards). Flop → river: either the turn or the
          river hits. "Odds against" compares misses with hits on the river card: with 9 outs it's about 4 to 1, so the
          pot needs to pay you at least 4 to 1 to call. Compare it with the <Link to="/learn/pot-odds">pot odds</Link>.
        </p>
      </section>

      <Callout to="/trainer" label="Drill your outs">
        Counting outs becomes automatic with practice. The trainer's <strong>Count the outs</strong> drill gives you a
        new board against a shot clock. Get ten in a row and it sticks.
      </Callout>
    </Guide>
  );
}
