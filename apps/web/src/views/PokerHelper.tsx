/**
 * /learn/online-poker-helper — written for people searching "online poker helper",
 * "live poker tool" and similar. Many want help *during* play; this page says plainly
 * that real-time assistance is banned on most sites and card rooms, explains why, and
 * shows the legal route to the same edge (study, review, drills) — with LlamaPoker as the tool
 * for it. Keep claims general and true; don't name rules we can't stand behind.
 * Prerendered to HTML at build time.
 * Uses: components/Guide, components/Link.
 */

import { Guide, Callout } from "../components/Guide";
import { Link } from "../components/Link";

export default function PokerHelper() {
  return (
    <Guide
      path="/learn/online-poker-helper"
      title="Online poker helpers: what's allowed, and what actually works."
      lead="If you've searched for a tool to tell you what to do while you play, you're not alone — it's how this site started. Here's the honest picture: what poker sites allow, why real-time helpers get accounts closed, and how to get the same edge without the risk."
    >
      <section className="strat-section">
        <div className="strat-head">
          <h2>The short answer</h2>
        </div>
        <ul className="strat-list">
          <li>
            <strong>During a real-money game: no.</strong> Major online poker sites, including PokerStars and GGPoker,
            ban "real-time assistance" — any software or chart that tells you how to play a hand while you're playing it.
            Sites look for it, and players caught using it can have accounts closed and winnings withheld.
          </li>
          <li>
            <strong>In live card rooms: no, either.</strong> Most casinos don't allow phones or devices while you're in
            a hand, and consulting a tool at the table will get you warned or removed.
          </li>
          <li>
            <strong>Away from the table: yes.</strong> Studying, reviewing your hands after a session, using odds
            calculators and training drills is how every serious player improves — and it's what LlamaPoker is built for.
          </li>
        </ul>
        <p className="ro-caption">
          Rules differ by site and change over time. Always check your site's terms — look for "prohibited software" or
          "real-time assistance".
        </p>
      </section>

      <section className="strat-section">
        <div className="strat-head">
          <h2>Why sites ban real-time help</h2>
        </div>
        <ul className="strat-list">
          <li>
            Poker only works if every player decides for themselves. A player with software making their decisions is
            playing a different game from the people across the table — so the games, and the sites, police it hard.
          </li>
          <li>
            It also doesn't make you better. If the tool decides, you never learn to see the spot yourself — and the
            moment you play without it, the edge is gone.
          </li>
        </ul>
      </section>

      <section className="strat-section">
        <div className="strat-head">
          <h2>How to get the same edge, legally</h2>
        </div>
        <ul className="strat-list">
          <li>
            <strong>Learn the few things that matter most.</strong> Most beginner losses come from playing too many
            hands from the wrong seats and calling without the right price. Learn{" "}
            <Link to="/learn/positions">positions</Link>, the <Link to="/learn/starting-hands">starting hand charts</Link>{" "}
            and <Link to="/glossary">pot odds</Link> and you'll already beat most casual games.
          </li>
          <li>
            <strong>Review your hands after the session.</strong> Write down the two or three hands you weren't sure
            about. Afterwards, enter each one into the <Link to="/table">odds calculator</Link>: see your real equity
            against the hands that player would have, the price you were getting, and what you should have done.
          </li>
          <li>
            <strong>Drill until it's automatic.</strong> The <Link to="/trainer">trainer</Link> plays full hands with
            you and drills pot odds and counting outs against a shot clock — so at the table, the answer is already in
            your head.
          </li>
        </ul>
      </section>

      <Callout to="/table" label="Review a hand">
        Bring a hand you weren't sure about. The calculator shows your equity, the price, your outs and the
        recommended move — with the reasoning, so next time you won't need it.
      </Callout>
    </Guide>
  );
}
