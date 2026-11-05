/**
 * /learn/positions — every 6-max seat explained: the table diagram (preflop / postflop
 * order switch), a seat-by-seat list with how many hands to open from each (computed live
 * from the opening ranges in poker/ranges, so it can't drift from the tool), why position
 * matters, and how full-ring and short tables name their seats.
 * Prerendered to HTML at build time.
 * Uses: components/Guide, components/TableDiagram, poker/ranges.
 */

import { useState } from "react";
import { Guide, Callout } from "../components/Guide";
import { TableDiagram } from "../components/TableDiagram";
import { rangeFor, rangePercent, Position } from "../poker/ranges";

const SEATS: [Position, string, string][] = [
  ["UTG", "Under the Gun", "First to act before the flop, with five players still to act behind you. Play your tightest range here."],
  ["MP", "Middle Position (also called the hijack)", "Still early: four players behind. A little wider than UTG, still disciplined."],
  ["CO", "Cutoff", "The seat right of the button. Only the button and blinds are left — open up and attack them."],
  ["BTN", "Button (the dealer)", "The best seat at the table: you act last on every street after the flop. Play the most hands here."],
  ["SB", "Small Blind", "Posts half a big blind before the cards are dealt, then acts first after the flop — a tough seat. Raise or fold more than you call."],
  ["BB", "Big Blind", "Posts one big blind and closes the action before the flop, so you get a good price to defend — but you're out of position after it."],
];

export default function Positions() {
  const [order, setOrder] = useState<"preflop" | "postflop">("preflop");
  const [seat, setSeat] = useState<Position>("BTN");

  return (
    <Guide
      path="/learn/positions"
      title="Poker positions, explained."
      lead="Where you sit relative to the dealer button decides when you act — and acting later, after you've seen what everyone else did, is one of the biggest edges in poker. Here's every seat at a six-player table."
    >
      <figure className="diagram-wrap">
        <div className="seg diagram-switch" role="group" aria-label="Order of action">
          {(["preflop", "postflop"] as const).map((o) => (
            <button key={o} className={order === o ? "seg-btn seg-active" : "seg-btn"} aria-pressed={order === o} onClick={() => setOrder(o)}>
              {o === "preflop" ? "Before the flop" : "After the flop"}
            </button>
          ))}
        </div>
        <TableDiagram order={order} highlight={seat} />
        <figcaption className="ro-caption">
          The button moves one seat to the left after every hand, so everyone rotates through every position.{" "}
          {order === "preflop"
            ? "Before the flop, the player left of the big blind (UTG) acts first and the big blind acts last."
            : "After the flop, the small blind acts first and the button always acts last — the button's big advantage."}
        </figcaption>
      </figure>

      <section className="strat-section">
        <div className="strat-head">
          <h2>Every seat</h2>
          <span className="strat-tag">share of hands to open</span>
        </div>
        <ul className="seat-list">
          {SEATS.map(([p, name, what]) => {
            const pct = p === "BB" ? null : rangePercent(rangeFor(p));
            return (
              <li key={p} className={seat === p ? "seat-item seat-on" : "seat-item"} onMouseEnter={() => setSeat(p)}>
                <span className="seat-code">{p}</span>
                <span className="seat-text">
                  <strong>{name}.</strong> {what}
                </span>
                <span className="seat-pct">{pct === null ? "defends" : `${Math.round(pct)}%`}</span>
              </li>
            );
          })}
        </ul>
        <p className="ro-caption">
          Percentages are the share of all starting hands worth raising first from each seat in a typical 6-max game.
          The big blind doesn't "open" — if everyone folds to it, it wins the pot.
        </p>
      </section>

      <section className="strat-section">
        <div className="strat-head">
          <h2>Why position matters</h2>
        </div>
        <ul className="strat-list">
          <li>
            <strong>Information.</strong> Acting last, you see whether opponents check (often weak) or bet (often strong)
            before you decide.
          </li>
          <li>
            <strong>Control.</strong> In position you choose the size of the pot: bet to build it with strong hands,
            check behind to keep it small with medium ones, take free cards with draws.
          </li>
          <li>
            <strong>Fewer players behind.</strong> From UTG, five players can still wake up with a big hand; from the
            button, only two. That's why the same hand can be a raise on the button and a fold under the gun.
          </li>
        </ul>
      </section>

      <section className="strat-section">
        <div className="strat-head">
          <h2>Bigger and smaller tables</h2>
        </div>
        <ul className="strat-list">
          <li>
            <strong>Full ring (9 players)</strong> adds early seats before the middle: UTG, UTG+1, UTG+2, then the
            lojack, hijack, cutoff, button and blinds. More players behind means even tighter early ranges.
          </li>
          <li>
            <strong>Short-handed tables</strong> drop the early seats first. Four-handed, the first player to act is
            the cutoff; heads-up, the button is also the small blind and acts first before the flop.
          </li>
          <li>
            Seats are named by how many players act after you, so a 4-handed cutoff plays like a 6-max cutoff.
          </li>
        </ul>
      </section>

      <Callout to="/trainer" label="Drill it in the trainer">
        The <strong>Preflop</strong> drill deals you a random seat and hand and asks: open, 3-bet, call or fold? A few
        minutes a day and you'll stop thinking about it.
      </Callout>
    </Guide>
  );
}
