/**
 * The Strategy page: static, street-by-street content explaining the rules that
 * poker/strategy.ts applies. Keep its last section in sync with recommend().
 * Uses: nothing from the app (pure content + CSS classes).
 */

import { ReactNode } from "react";

function Street({ title, tag, children }: { title: string; tag: string; children: ReactNode }) {
  return (
    <section className="strat-section">
      <div className="strat-head">
        <h2>{title}</h2>
        <span className="strat-tag">{tag}</span>
      </div>
      {children}
    </section>
  );
}

export default function Strategy() {
  return (
    <div className="strategy">
      <h1 className="page-title">No-Limit Hold'em, street by street</h1>
      <p className="lead">
        A street-by-street game plan built on the same ideas the tool uses: play position, bet when
        you're ahead, fold when the price is wrong, and put opponents on ranges rather than single
        hands. The tool's <strong>Recommended</strong> banner applies these rules to your exact spot.
      </p>

      <Street title="Foundations" tag="always">
        <ul className="strat-list">
          <li><strong>Position is power.</strong> Acting last lets you see what others do first — play more hands in late position (BTN, CO), far fewer up front (UTG).</li>
          <li><strong>Aggression beats calling.</strong> Betting and raising win in two ways: opponents fold, or you get value when ahead. Calling can only win one way.</li>
          <li><strong>Think in ranges.</strong> You can't know one hand, but you can picture every hand a player would take this line with — the tool's "what beats you" is exactly that.</li>
          <li><strong>Pot odds gate every call.</strong> Only call when your equity beats the price the pot is laying you. The tool draws that break-even line for you.</li>
          <li><strong>Fold more than feels comfortable.</strong> Most money is saved by folding marginal hands, not won by hero calls.</li>
        </ul>
      </Street>

      <Street title="Preflop" tag="before the flop">
        <ul className="strat-list">
          <li><strong>Open-raise, don't limp.</strong> If a hand is worth playing, raise first in to take the initiative and thin the field.</li>
          <li><strong>Use a range by seat.</strong> Tight from UTG/MP; open it up in CO and especially on the BTN. The big blind defends wide because it already has chips in. The tool flags whether your hand is in that seat's range.</li>
          <li><strong>Re-raise (3-bet) your strongest hands</strong> for value, and occasionally as a bluff with hands that block big holdings (e.g. Ax suited).</li>
          <li><strong>Respect early-position raises.</strong> A UTG raiser's range is strong — call or 3-bet only with hands that do well against it.</li>
          <li><strong>Avoid domination.</strong> Hands like KJo play badly against opening ranges that have AK, AJ, KQ. Suited and connected hands flop better.</li>
        </ul>
      </Street>

      <Street title="The flop" tag="first 3 community cards">
        <ul className="strat-list">
          <li><strong>Continuation-bet</strong> when the board favors your range (high cards if you raised preflop) — but check more on boards that hit the caller.</li>
          <li><strong>Bet your strong made hands and your good draws.</strong> Betting draws (a <em>semi-bluff</em>) wins the pot now or improves later — the best of both worlds.</li>
          <li><strong>Count your outs</strong> and convert with the rule of 4 (flop → river). The tool does this exactly via simulation.</li>
          <li><strong>Pick a bet size for a reason.</strong> Bigger on wet, draw-heavy boards to charge draws; smaller on dry boards where few hands continue.</li>
          <li><strong>Give up cleanly.</strong> Missed completely with no draw and facing a bet? Fold — don't float without a plan.</li>
        </ul>
      </Street>

      <Street title="The turn" tag="4th community card">
        <ul className="strat-list">
          <li><strong>The turn is the decision street.</strong> Bets get big; commit with strong hands and good draws, and let go of weak ones now rather than the river.</li>
          <li><strong>Double-barrel</strong> when the turn improves your range or completes draws you'd have — keep pressure on capped opponents.</li>
          <li><strong>Re-evaluate equity.</strong> One fewer card to come means draws are now worth half as much (rule of 2). The tool re-simulates the instant the turn lands.</li>
          <li><strong>Pot control with medium hands.</strong> Top pair on a scary turn? Checking keeps the pot manageable and your bluff-catchers intact.</li>
          <li><strong>Mind your implied odds.</strong> Keep drawing only if the chips you'd win when you hit justify the call.</li>
        </ul>
      </Street>

      <Street title="The river" tag="final card · showdown">
        <ul className="strat-list">
          <li><strong>No more draws.</strong> Your hand is what it is — every bet is purely for value or a bluff.</li>
          <li><strong>Value bet thinly.</strong> If you're called by worse more than half the time, bet. Size up with the nuts, down with marginal value.</li>
          <li><strong>Bluff with a story.</strong> Only bluff when the line you've taken credibly represents a hand that beats what your opponent holds.</li>
          <li><strong>Use pot odds to bluff-catch.</strong> Facing a bet with a medium hand, call when your equity beats the price and your opponent can be bluffing.</li>
          <li><strong>When unsure, check or fold.</strong> Don't bluff into a player who never folds, and don't pay off a player who never bluffs.</li>
        </ul>
      </Street>

      <Street title="How the tool turns this into a move" tag="recommended">
        <ul className="strat-list">
          <li>Set <strong>Action to you</strong>: preflop it's <em>Unopened</em> or <em>Facing a raise</em>; after the flop it's <em>Checked to you</em> or <em>Facing a bet</em>.</li>
          <li><strong>Preflop</strong> it uses seat charts: the opening range when unopened, and a 3-bet range plus a calling range when facing a raise. The big blind checks its option when nobody raised.</li>
          <li><strong>After the flop</strong> it compares your <strong>equity</strong> (against the ranges you gave each opponent) to a fair share (1 ÷ players) and to the <strong>pot-odds break-even</strong>.</li>
          <li>It counts your real <strong>outs</strong> (flush and straight draws, and improving to two pair or trips) and semi-bluffs strong draws of 8+ outs.</li>
          <li>When a draw is short of the price, it checks <strong>implied odds</strong>: can you realistically win enough later with what's left in the stacks?</li>
          <li>It reads <strong>SPR</strong> (stack ÷ pot): with a low SPR and a strong hand you're committed, so it says get it in.</li>
          <li>Treat it as a solid default, not gospel: opponent ranges don't narrow by their later actions, and it can't read a specific player's tendencies.</li>
        </ul>
      </Street>
    </div>
  );
}
