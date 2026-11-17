/**
 * /trainer as a page: the Trainer app on top, then a short written guide to what it drills and
 * how it grades (TrainerGuide). The Trainer deals a random hand on every load, so it cannot be
 * prerendered; this wrapper can. At build time and on the browser's first render it shows a
 * placeholder of the app's height plus the guide (identical HTML, so the page hydrates), then
 * mounts the real Trainer after mount. That gives search engines and no-script readers a page
 * with text on it instead of an empty shell.
 * The guide's figures come from poker/odds (the same formula the "Call or fold" drill grades on)
 * and the grading rules it states are the ones in views/Trainer.tsx: keep them in step.
 * Used by: App.tsx. Uses: views/Trainer, components/Link, poker/odds.
 */

import { useEffect, useState } from "react";
import Trainer from "./Trainer";
import { Link } from "../components/Link";
import { potOdds, formatPct } from "../poker/odds";

// A half-pot bet: 50 into 100.
const half = potOdds(100, 50);

export default function TrainerPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <>
      {mounted ? (
        <Trainer />
      ) : (
        <div className="trainer-page trainer-loading" aria-busy="true">
          <h1 className="sr-only">Poker trainer</h1>
        </div>
      )}
      <TrainerGuide />
    </>
  );
}

function TrainerGuide() {
  return (
    <div className="strategy trainer-guide">
      <h2 className="page-title trainer-guide-title">How the trainer works</h2>
      <p className="trainer-guide-lead">
        Five drills, one rule: you decide first, then you see the numbers. Every spot is dealt at random and graded
        by the same engine as <Link to="/table">the odds calculator</Link>, so the trainer and the Table never
        disagree.
      </p>

      <section className="strat-section">
        <div className="strat-head">
          <h2>The five drills</h2>
        </div>
        <ul className="strat-list">
          <li>
            <strong>Full hand.</strong> Play a whole hand against one opponent, street by street: preflop, flop, turn
            and river. Each decision is graded on its own, and at the end you see the opponent's cards and what the
            hand won or lost.
          </li>
          <li>
            <strong>Mixed.</strong> Single spots from any street. Raise, call or fold?
          </li>
          <li>
            <strong>Preflop.</strong> Open, 3-bet, call or fold from each seat, graded against the{" "}
            <Link to="/learn/starting-hands">starting hand charts</Link>. If the seat names are new, read{" "}
            <Link to="/learn/positions">positions</Link> first.
          </li>
          <li>
            <strong>Call or fold.</strong> You face a bet. Does your chance of winning beat the price? Against a
            half-pot bet you need {formatPct(half.requiredEquity, 0)} equity to call, which is what{" "}
            <Link to="/learn/pot-odds">pot odds</Link> are.
          </li>
          <li>
            <strong>Count the outs.</strong> Type how many cards improve your hand. The{" "}
            <Link to="/learn/outs">outs guide</Link> shows how to count them.
          </li>
        </ul>
      </section>

      <section className="strat-section">
        <div className="strat-head">
          <h2>How answers are graded</h2>
        </div>
        <ul className="strat-list">
          <li>
            <strong>Against the recommended move.</strong> Your answer is compared with what the engine recommends
            for that exact spot. After you answer, the full read appears: your equity, the price, your outs and the
            reason.
          </li>
          <li>
            <strong>Close calls count either way.</strong> When your equity is within 3% of the price, both calling
            and folding are marked right.
          </li>
          <li>
            <strong>The shot clock is optional.</strong> Off, 20 seconds or 10. If it runs out, the answer becomes a
            fold (or a check) and is marked wrong.
          </li>
          <li>
            <strong>It finds your leaks.</strong> Your recent decisions are grouped by kind of spot, such as "turn,
            facing a bet", and the ones you get wrong most often are listed. The stats stay in your browser; nothing
            is sent anywhere.
          </li>
        </ul>
      </section>

      <section className="strat-section">
        <div className="strat-head">
          <h2>What it is for</h2>
        </div>
        <ul className="strat-list">
          <li>
            Practice away from the table. The trainer is a study tool: it is not for use during a real-money hand,
            and most poker sites forbid that kind of help while you play.
          </li>
          <li>
            New to the game? Start with <Link to="/learn">the beginner's path</Link>, then come back and drill.
          </li>
        </ul>
      </section>
    </div>
  );
}
