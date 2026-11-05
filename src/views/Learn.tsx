/**
 * /learn — the beginner hub: the reading path (LEARN_PATH in seo.ts) as numbered entries
 * with a one-line promise each, plus the tools. Written for someone who knows how a hand
 * is dealt and nothing else (the persona behind this site).
 * Prerendered to HTML at build time.
 * Uses: components/Link, components/Guide (Callout), seo.
 */

import { Link } from "../components/Link";
import { Callout } from "../components/Guide";
import { LEARN_PATH, routeFor } from "../seo";

const BLURBS: Record<string, string> = {
  "/learn/hand-rankings": "What beats what, from a royal flush down to high card — and how often you'll actually make each hand.",
  "/learn/positions": "What UTG, the cutoff, the button and the blinds mean, and why where you sit decides which hands you play.",
  "/learn/starting-hands": "Which two-card hands to play from each seat, and what to do when someone has already raised.",
  "/glossary": "Equity, pot odds, outs, implied odds, SPR — the numbers behind every decision, with worked examples.",
  "/strategy": "A street-by-street game plan: preflop, flop, turn and river.",
  "/learn/online-poker-helper": "What poker sites allow, why real-time helpers get accounts closed, and how to get the same edge legally.",
};

export default function Learn() {
  return (
    <div className="strategy guide">
      <h1 className="page-title">Learn poker, in order.</h1>
      <p className="lead">
        You know how a hand is dealt. These guides take you from there to playing like someone who knows what they're
        doing — positions, starting hands, odds — one short read at a time.
      </p>

      <ol className="learn-list">
        {LEARN_PATH.map((p, i) => (
          <li key={p}>
            <Link to={p} className="learn-item">
              <span className="path-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="learn-text">
                <span className="learn-name">{routeFor(p).name}</span>
                <span className="learn-blurb">{BLURBS[p]}</span>
              </span>
              <span className="path-arrow" aria-hidden="true">
                →
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <Callout to="/trainer" label="Open the trainer">
        Reading is half of it. The <strong>Preflop</strong> drill tests the starting-hand charts by seat, and{" "}
        <strong>Count the outs</strong> makes the odds automatic.
      </Callout>
    </div>
  );
}
