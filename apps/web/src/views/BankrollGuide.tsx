/**
 * /learn/bankroll-management — bankroll management for beginners: what a bankroll is, the buy-in
 * rule (table from poker/bankroll.BUYINS), a chart of the bankroll each stake needs, the
 * calculator inline, moving up and down, why tournaments need more (and sit & gos), and risk of
 * ruin in plain words with a table computed by poker/bankroll.cashRuin.
 * Every number on the page comes from the engine, so the guide and the calculator can't disagree.
 * Targets searches like "poker bankroll management", "how many buy-ins", "what stakes should I
 * play", "poker bankroll chart". Prerendered to HTML at build time.
 * Uses: components/Guide, components/Link, components/BankrollCalculator, poker/bankroll, poker/odds.
 */

import { Guide, Callout } from "../components/Guide";
import { Link } from "../components/Link";
import { BankrollCalculator, ruleRows } from "../components/BankrollCalculator";
import { bankrollForRuin, BUYINS, CASH_DEFAULTS, CASH_STAKES, cashRuin, formatMoney, PAID_SHARE, TOURNAMENT_STAKES } from "../poker/bankroll";
import { formatPct } from "../poker/odds";

const RULES = ruleRows();
const { winRate, sd } = CASH_DEFAULTS;
const std = BUYINS.cash.standard;
const example = CASH_STAKES[2]; // $0.05/$0.10
const ONE_IN = ["", "", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][Math.round(1 / PAID_SHARE)] ?? String(Math.round(1 / PAID_SHARE));

export default function BankrollGuide() {
  return (
    <Guide
      path="/learn/bankroll-management"
      title="Bankroll management, without the maths degree."
      lead="Good players lose for weeks at a time. Bankroll management is how they survive it: keep enough money behind the stakes you play, and move down when you don't. One rule, two lines, and you can stop worrying about going broke."
    >
      <section className="strat-section">
        <div className="strat-head">
          <h2>What a bankroll is</h2>
        </div>
        <ul className="strat-list">
          <li>
            <strong>Your bankroll is money kept for poker and nothing else.</strong> It isn't your bank balance. It's an
            amount you could lose completely without touching rent, bills or savings.
          </li>
          <li>
            <strong>A buy-in</strong> is what you sit down with. In cash games that's 100 big blinds: at {example.name}{" "}
            blinds, {formatMoney(example.buyIn)}. In a tournament it's the entry price, fee included.
          </li>
          <li>
            <strong>Variance</strong> is the luck in your results: the gap between how well you played and what you won
            this week. Even a winning player has long losing runs. The bankroll exists to outlast them.
          </li>
        </ul>
      </section>

      <section className="strat-section">
        <div className="strat-head">
          <h2>The rule: count buy-ins</h2>
        </div>
        <table className="odds-table">
          <thead>
            <tr>
              <th scope="col">How careful</th>
              <th scope="col">Cash games</th>
              <th scope="col">Tournaments</th>
            </tr>
          </thead>
          <tbody>
            {RULES.map((r) => (
              <tr key={r.risk}>
                <th scope="row">{r.name}</th>
                <td>{r.cash} buy-ins</td>
                <td>{r.tournament} buy-ins</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="ro-caption">
          Pick the row that fits you and keep at least that many buy-ins for the stake you play. <strong>Standard</strong>{" "}
          suits most people. <strong>Careful</strong> is for anyone who can't easily replace the money, or who hates
          moving down. <strong>Aggressive</strong> is for players who can top up from a salary and will drop a stake without
          sulking. These are the ranges coaches have taught for years; they are conventions, not laws of nature.
        </p>
      </section>

      <section className="strat-section">
        <div className="strat-head">
          <h2>Bankroll chart: what each stake needs</h2>
        </div>
        <table className="odds-table">
          <thead>
            <tr>
              <th scope="col">Cash blinds</th>
              <th scope="col">One buy-in</th>
              <th scope="col">Bankroll, standard rule</th>
            </tr>
          </thead>
          <tbody>
            {CASH_STAKES.slice(0, 8).map((s) => (
              <tr key={s.name}>
                <th scope="row">{s.name}</th>
                <td>{formatMoney(s.buyIn)}</td>
                <td>{formatMoney(s.buyIn * std)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <table className="odds-table">
          <thead>
            <tr>
              <th scope="col">Tournament buy-in</th>
              <th scope="col">Bankroll, standard rule</th>
              <th scope="col">Careful</th>
            </tr>
          </thead>
          <tbody>
            {TOURNAMENT_STAKES.slice(1, 8).map((s) => (
              <tr key={s.name}>
                <th scope="row">{formatMoney(s.buyIn)}</th>
                <td>{formatMoney(s.buyIn * BUYINS.tournament.standard)}</td>
                <td>{formatMoney(s.buyIn * BUYINS.tournament.careful)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="ro-caption">
          Read it both ways: the bankroll a stake needs, or the highest stake your bankroll covers. If the number looks
          large next to the stakes, that's the point. Playing {example.name} on {formatMoney(example.buyIn * 5)} feels
          fine until the first bad week.
        </p>
      </section>

      <section className="strat-section">
        <div className="strat-head">
          <h2>Work out yours</h2>
        </div>
        <BankrollCalculator />
      </section>

      <section className="strat-section">
        <div className="strat-head">
          <h2>Moving up and moving down</h2>
        </div>
        <ul className="strat-list">
          <li>
            <strong>Move up when the bankroll covers the next stake.</strong> With the standard rule that's {std} buy-ins
            of the bigger game, not {std} of the one you're in.
          </li>
          <li>
            <strong>Move down the day you fall under the line for your stake.</strong> No "one more session to win it
            back". Dropping a stake isn't a punishment; it's the rule doing its job while you still have a bankroll to
            protect.
          </li>
          <li>
            <strong>A first try at a new stake is a shot.</strong> You may land right on the line, lose a buy-in and be
            back down the same evening. That's normal. Go back, rebuild, try again.
          </li>
          <li>
            <strong>Winning is the other half.</strong> A bankroll only slows a losing player's losses. If your results
            are negative over a few months, the fix is study: the <Link to="/trainer">trainer</Link> and the guides in
            the <Link to="/learn">Learn path</Link>.
          </li>
        </ul>
      </section>

      <section className="strat-section">
        <div className="strat-head">
          <h2>Why tournaments need more</h2>
        </div>
        <p className="ro-caption">
          In a cash game you win or lose a little most days. In a tournament you lose your buy-in most of the time and
          occasionally win many buy-ins at once, since only about one player in {ONE_IN} gets paid and most of the prize
          money sits at the final table. Results that lopsided mean long stretches without a cash, even for good players,
          so the rule asks for {BUYINS.tournament.standard} buy-ins where cash asks for {std}. The bigger the field, the
          longer the dry spells: a 1,000-player tournament needs a deeper bankroll than a 100-player one.
        </p>
        <p className="ro-caption">
          <strong>Sit & gos and spins</strong> (small tournaments that start when the seats fill) sit in between. Count
          them as tournaments: the {BUYINS.tournament.aggressive}-buy-in row is reasonable for single-table games, the
          standard row for anything with a jackpot or a big field.
        </p>
      </section>

      <section className="strat-section">
        <div className="strat-head">
          <h2>Risk of ruin, in plain words</h2>
        </div>
        <p className="ro-caption">
          <strong>Risk of ruin</strong> is the chance of losing your whole bankroll before it grows for good, if you stay
          at one stake and never move down. For a cash player who wins {winRate} big blinds per 100 hands, a small but
          real edge, with typical swings (a standard deviation of {sd} big blinds per 100 hands):
        </p>
        <table className="odds-table">
          <thead>
            <tr>
              <th scope="col">Bankroll</th>
              <th scope="col">Risk of ruin, never moving down</th>
            </tr>
          </thead>
          <tbody>
            {[...RULES.map((r) => r.cash), 100].map((n) => (
              <tr key={n}>
                <th scope="row">{n} buy-ins</th>
                <td>{formatPct(cashRuin(n * 100, winRate, sd), 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="ro-caption">
          Those numbers are higher than most people expect, and they explain the whole subject. To hold the risk at 5%
          without ever moving down, this player would need about {Math.ceil(bankrollForRuin(0.05, winRate, sd) / 100)}{" "}
          buy-ins. Nobody waits for that. Instead, you keep {std} and <strong>move down at the line</strong>, which cuts the
          size of your bets as the bankroll shrinks, so the money is never all at risk. A player who breaks even or loses
          has a risk of ruin of 100% at any bankroll: more buy-ins only make it take longer.
        </p>
      </section>

      <Callout to="/bankroll" label="Open the tracker">
        The <strong>bankroll calculator</strong> gives you your stake and both lines, and the tracker on the same page
        keeps your real results, in your own browser, so the answer stays true as the bankroll moves.
      </Callout>

      <section className="strat-section">
        <div className="strat-head">
          <h2>Keep it healthy</h2>
        </div>
        <p className="ro-caption">
          Poker involves real financial risk. Only build a bankroll from money you can afford to lose, keep it apart
          from everything else, and use your poker site's deposit limits and self-exclusion tools if you need them. For
          adults, 18+.
        </p>
      </section>
    </Guide>
  );
}
