/**
 * The Glossary page: static definitions of every term the tool uses, with worked
 * formulas. Keep it in sync when the math or terminology changes.
 * Uses: components/Explain (Formula), components/Link (to the pot odds and outs guides).
 */

import { ReactNode } from "react";
import { Formula } from "../components/Explain";
import { Link } from "../components/Link";

function Entry({ term, children }: { term: string; id?: string; children: ReactNode }) {
  return (
    <div className="gloss-entry">
      <dt className="gloss-term">{term}</dt>
      <dd className="gloss-def">{children}</dd>
    </div>
  );
}

export default function Glossary() {
  return (
    <div className="glossary">
      <h1 className="page-title">The glossary</h1>
      <p className="lead">
        Plain-language definitions for every term the tool uses. Each one shows the idea, the
        formula where there is one, and a quick example.
      </p>

      <section className="gloss-section">
        <h2>The core numbers</h2>
        <dl>
          <Entry term="Equity">
            Your share of the pot if the hand were dealt out to the end right now — in practice, your
            chance of winning the hand. 60% equity means you'd win 6 times out of 10 on average.
            <Formula steps={[{ label: "equity", expr: "(wins + your share of each tie) ÷ hands simulated" }]} />
            The tool estimates this by dealing the unknown cards thousands of times (a{" "}
            <em>Monte Carlo simulation</em>) and counting how often you end up best.
          </Entry>

          <Entry term="Pot odds">
            The price you're being offered to call. It's the size of your call compared to the total
            pot you could win — usually written as a ratio.
            <Formula
              steps={[
                { label: "as a ratio", expr: "(pot + bet) : call" },
                { label: "example", expr: "(100 + 50) : 50", result: "3 : 1" },
              ]}
            />
            3 : 1 means you risk 1 to win 3 — you only need to win 1 time in 4 to break even.{" "}
            <Link to="/learn/pot-odds">Full guide and chart</Link>.
          </Entry>

          <Entry term="Break-even equity (equity needed)">
            The minimum equity that makes a call profitable. Convert pot odds into a percentage: your
            call divided by the final pot after you call.
            <Formula
              steps={[
                { label: "needed", expr: "call ÷ (pot + bet + call)" },
                { label: "example", expr: "50 ÷ (100 + 50 + 50)", result: "25%" },
              ]}
            />
            If your equity is above this line, calling wins money long-term; below it, fold. The
            tool's gauge draws this line in gold.
          </Entry>

          <Entry term="EV (expected value)">
            The average amount a decision wins or loses if you made it many times. A <strong>+EV</strong>{" "}
            play makes money over the long run, a <strong>−EV</strong> play loses it. Calling when
            your equity beats the break-even point is +EV — that's the whole reason pot odds matter.
          </Entry>

          <Entry term="Win / Tie / Lose">
            How often, across all simulated runouts, you end up with the best hand (win), share the
            pot (tie), or lose. A tie is worth a fraction of a win because the pot is split between
            everyone still in it.
          </Entry>
        </dl>
      </section>

      <section className="gloss-section">
        <h2>Drawing &amp; chasing</h2>
        <dl>
          <Entry term="Outs">
            The cards still in the deck that improve you to a likely-winning hand. A flush draw has 9
            outs (13 cards of the suit − 4 you can already see). <Link to="/learn/outs">Outs chart</Link>.
          </Entry>

          <Entry term="Rule of 2 and 4">
            A fast way to turn outs into equity. About 2% per out for one card to come, 4% per out
            for two.
            <Formula
              steps={[
                { label: "turn → river", expr: "outs × 2%" },
                { label: "flop → river", expr: "outs × 4%" },
              ]}
            />
            Example: a 9-out flush draw on the flop ≈ 9 × 4 = 36% to get there by the river.
          </Entry>

          <Entry term="Implied odds">
            Extra chips you expect to win on later streets <em>if</em> you complete your draw. They
            can justify a call even when raw pot odds fall a little short — but only if your opponent
            is likely to pay you off.
          </Entry>
        </dl>
      </section>

      <section className="gloss-section">
        <h2>Cards &amp; hands</h2>
        <dl>
          <Entry term="Made hand">
            The best five-card hand you can actually form right now from your two cards plus the
            board. The tool shows it as "You currently have: Two Pair", etc.
          </Entry>

          <Entry term="Hand rankings (strongest first)">
            Straight Flush ▸ Four of a Kind ▸ Full House ▸ Flush ▸ Straight ▸ Three of a Kind ▸ Two
            Pair ▸ Pair ▸ High Card. Higher category always beats a lower one; within a category the
            higher cards win.
          </Entry>

          <Entry term="Suited / Offsuit">
            Two cards of the same suit are <strong>suited</strong> (they can make a flush); different
            suits are <strong>offsuit</strong>. Written AKs (suited) vs AKo (offsuit). Suited hands
            are worth a little more.
          </Entry>

          <Entry term="Showdown">
            The end of a hand where remaining players reveal their cards and the best hand wins.
            "What beats you" is built from the opponent hands that win at showdown in the simulation.
          </Entry>
        </dl>
      </section>

      <section className="gloss-section">
        <h2>Before the flop</h2>
        <dl>
          <Entry term="Position">
            Your seat relative to the dealer button, which decides when you act. Acting last is a big
            advantage. From earliest to latest: <strong>UTG</strong> (under the gun),{" "}
            <strong>MP</strong> (middle), <strong>CO</strong> (cutoff), <strong>BTN</strong> (button,
            best seat), <strong>SB</strong> (small blind).
          </Entry>

          <Entry term="Opening range (RFI)">
            The set of hands strong enough to raise with when everyone has folded to you — "raise
            first in". Later positions can open many more hands; early positions should stay tight.
            The tool tells you whether your hand is in that seat's opening range.
          </Entry>

          <Entry term="Combos & the 1326">
            There are 1,326 distinct two-card starting hands (52 × 51 ÷ 2). The 13×13 grid groups
            them into 169 types: each pair is 6 combos, each suited hand 4, each offsuit hand 12.
            "% of hands" = combos in the range ÷ 1,326.
          </Entry>
        </dl>
      </section>

      <section className="gloss-section">
        <h2>Under the hood</h2>
        <dl>
          <Entry term="Monte Carlo simulation">
            Estimating a probability by repeating a random experiment many times and averaging. Here:
            deal the opponents' cards and the rest of the board at random thousands of times, and
            count your wins. More repetitions = a steadier estimate (and a number that wobbles a
            little less each time you run it).
          </Entry>

          <Entry term="What beats you">
            When the simulation gives the pot to an opponent, it records the category of their winning
            hand. The bars show each category's share of your losses, so you can see which cards are
            the real danger on this board.
          </Entry>

          <Entry term="Opponent ranges">
            The set of hands a player could hold given how they've played. Each opponent in the tool gets
            a range (a preset like <em>UTG open</em> or <em>BB defend</em>, or your own grid), and the
            simulation only deals them hands from it. <em>Any two cards</em> is the old random-opponent
            assumption and makes your equity look better than it is against real players.
          </Entry>

          <Entry term="Split pot (ties)">
            When players tie, only the players who tied share the pot. A two-way tie in a three-way pot
            gives you half, not a third.
          </Entry>

          <Entry term="Effective stack & SPR">
            The <strong>effective stack</strong> is the smaller of your stack and your opponent's, since
            that's the most either of you can win or lose. <strong>SPR</strong> (stack-to-pot ratio) compares
            it to the pot:
            <Formula steps={[{ label: "SPR", expr: "effective stack ÷ pot", result: "e.g. 300 ÷ 100 = 3" }]} />
            Low SPR (under ~3): top pair or better is usually committed. High SPR (8+): you need a strong
            hand to play a big pot, and draws gain value from implied odds.
          </Entry>

          <Entry term="3-bet">
            The first re-raise before the flop (the blinds count as the first bet and the open as the
            second). You 3-bet strong hands for value and a few suited aces as bluffs.
          </Entry>
        </dl>
      </section>
    </div>
  );
}
