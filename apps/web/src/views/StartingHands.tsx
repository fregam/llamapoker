/**
 * /learn/starting-hands — the preflop charts, generated from the same data the tool and
 * trainer use (RFI_TOKENS / VS_RAISE_TOKENS in poker/ranges), so they never disagree:
 *   - how to read hand notation and the 13×13 grid
 *   - "First in" chart per seat (pick the seat), with the share of hands
 *   - "Facing a raise" chart per seat: 3-bet / call / fold; for the big blind, a switch between
 *     an early-position raiser and a late one (CO/BTN/SB, the wider BB_VS_LATE chart)
 * Prerendered with the button selected; the seat switch is client-side.
 * Uses: components/Guide, components/RangeChart, poker/ranges.
 */

import { useState } from "react";
import { Guide, Callout } from "../components/Guide";
import { RangeChart } from "../components/RangeChart";
import { POSITIONS, Position, rangeFor, threeBetRange, callRange, rangePercent } from "../poker/ranges";

const OPEN_SEATS: Position[] = ["UTG", "MP", "CO", "BTN", "SB"];

export default function StartingHands() {
  const [openSeat, setOpenSeat] = useState<Position>("BTN");
  const [vsSeat, setVsSeat] = useState<Position>("BB");
  // The big blind's chart depends on who raised: an early seat (tight) or a late one (wide).
  const [bbVsLate, setBbVsLate] = useState(true);
  const open = rangeFor(openSeat);
  const raiser: Position | undefined = vsSeat === "BB" && bbVsLate ? "BTN" : undefined;
  const threeBet = threeBetRange(vsSeat, raiser);
  const call = callRange(vsSeat, raiser);

  return (
    <Guide
      path="/learn/starting-hands"
      title="Poker starting hands, by position."
      lead="Most of your profit in poker comes from one decision made before the flop: which hands to play at all. These charts show what to raise from each seat when nobody has raised yet, and what to do when someone has."
    >
      <section className="strat-section">
        <div className="strat-head">
          <h2>How to read a chart</h2>
        </div>
        <ul className="strat-list">
          <li>
            <strong>There are 169 different starting hands.</strong> Pairs like <em>QQ</em>, suited hands like{" "}
            <em>AKs</em> (both cards the same suit) and offsuit hands like <em>AKo</em>.
          </li>
          <li>
            <strong>Pairs run down the diagonal</strong>, suited hands sit above it, offsuit hands below it. Read a cell
            as its row's card plus its column's card.
          </li>
          <li>
            <strong>Suited hands are better</strong> than the same cards offsuit — they can make flushes — which is why
            the top-right of every chart fills up first.
          </li>
          <li>
            <strong>If your hand isn't coloured, fold it.</strong> Folding most hands is not timid; it's how winning
            players play.
          </li>
        </ul>
      </section>

      <section className="strat-section">
        <div className="strat-head">
          <h2>First in: nobody has raised</h2>
          <span className="strat-tag">{Math.round(rangePercent(open))}% of hands</span>
        </div>
        <div className="seg seg-wide chart-seats" role="group" aria-label="Your seat">
          {OPEN_SEATS.map((p) => (
            <button key={p} className={openSeat === p ? "seg-btn seg-active" : "seg-btn"} aria-pressed={openSeat === p} onClick={() => setOpenSeat(p)}>
              {p}
            </button>
          ))}
        </div>
        <RangeChart
          layers={[{ range: open, className: "chart-open", label: "Raise" }]}
          caption={`Hands to raise first from ${openSeat}`}
        />
        <p className="ro-caption">
          Raise to about 2.5 big blinds with these from {openSeat}; fold the rest. Don't just call (limp) — raising
          first lets you win the pot right away and take control. From the big blind you never open: if everyone
          folds, the pot is yours.
        </p>
      </section>

      <section className="strat-section">
        <div className="strat-head">
          <h2>Facing a raise</h2>
          <span className="strat-tag">
            3-bet {Math.round(rangePercent(threeBet))}% · call {Math.round(rangePercent(new Set([...call].filter((h) => !threeBet.has(h)))))}%
          </span>
        </div>
        <div className="seg seg-wide chart-seats" role="group" aria-label="Your seat">
          {POSITIONS.filter((p) => p !== "UTG").map((p) => (
            <button key={p} className={vsSeat === p ? "seg-btn seg-active" : "seg-btn"} aria-pressed={vsSeat === p} onClick={() => setVsSeat(p)}>
              {p}
            </button>
          ))}
        </div>
        {vsSeat === "BB" && (
          <div className="seg chart-seats" role="group" aria-label="Who raised">
            <button className={bbVsLate ? "seg-btn seg-active" : "seg-btn"} aria-pressed={bbVsLate} onClick={() => setBbVsLate(true)}>
              Late raise (CO, BTN, SB)
            </button>
            <button className={!bbVsLate ? "seg-btn seg-active" : "seg-btn"} aria-pressed={!bbVsLate} onClick={() => setBbVsLate(false)}>
              Early raise (UTG, MP)
            </button>
          </div>
        )}
        <RangeChart
          layers={[
            { range: threeBet, className: "chart-3bet", label: "Re-raise (3-bet)" },
            { range: call, className: "chart-call", label: "Call" },
          ]}
          caption={vsSeat === "BB" ? `Big blind vs ${bbVsLate ? "a late-position" : "an early-position"} raise` : `What to do from ${vsSeat} when someone has raised`}
        />
        <p className="ro-caption">
          Someone raised before you. Re-raise (3-bet) your best hands, call with hands that play well after the flop,
          fold everything else. The big blind defends widest because it already has a chip in and gets the best price —
          about half of all hands against a raise from the cutoff, button or small blind, who raise wide, and far fewer
          against an early-position raise.
          These are simplified charts for 6-max cash games at 100 big blinds — a strong default while you learn.
        </p>
      </section>

      <Callout to="/trainer" label="Test yourself">
        Charts stick when you use them. The trainer's <strong>Preflop</strong> drill quizzes you on exactly these
        ranges, seat by seat.
      </Callout>
    </Guide>
  );
}
