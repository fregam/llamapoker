/**
 * /learn/hand-rankings — all ten hands with example cards, a one-line definition and how
 * often each is the best hand you hold by the river in Texas Hold'em (standard 7-card
 * frequencies), then the tie-break rules (kickers, suits, the wheel, best five of seven).
 * Prerendered to HTML at build time.
 * Uses: components/Guide, components/Cards, poker/cards.
 */

import { Guide, Callout } from "../components/Guide";
import { CardFace } from "../components/Cards";
import { parseCard } from "../poker/cards";

// [name, example cards, what it is, % of 7-card hands]
const HANDS: [string, string, string, string][] = [
  ["Royal flush", "As Ks Qs Js Ts", "Ace, king, queen, jack and ten, all the same suit. The best hand there is.", "0.003%"],
  ["Straight flush", "9h 8h 7h 6h 5h", "Five cards in a row, all the same suit.", "0.03%"],
  ["Four of a kind", "Qc Qd Qh Qs 7d", "All four cards of one rank (\"quads\").", "0.17%"],
  ["Full house", "Kh Kd Ks 4c 4h", "Three of a kind plus a pair (\"kings full of fours\").", "2.6%"],
  ["Flush", "Ad Jd 8d 6d 2d", "Any five cards of the same suit, not in a row.", "3.0%"],
  ["Straight", "Tc 9d 8s 7h 6c", "Five cards in a row, mixed suits. Ace can be high (A-K-Q-J-10) or low (A-2-3-4-5).", "4.6%"],
  ["Three of a kind", "7c 7d 7s Kh 2d", "Three cards of one rank (\"trips\", or a \"set\" when you hold a pocket pair).", "4.8%"],
  ["Two pair", "Jh Jc 5d 5s Ac", "Two different pairs.", "23.5%"],
  ["One pair", "Ah Ad 9c 6s 3h", "Two cards of the same rank.", "43.8%"],
  ["High card", "Ac Qd 8h 5s 3c", "None of the above — your highest card plays.", "17.4%"],
];

export default function HandRankings() {
  return (
    <Guide
      path="/learn/hand-rankings"
      title="Poker hand rankings: what beats what."
      lead="Every poker hand is made of five cards. In Texas Hold'em you use the best five out of seven — your two hole cards and the five on the board. Here are all ten hands, strongest first."
    >
      <ol className="rank-list">
        {HANDS.map(([name, cards, what, freq], i) => (
          <li key={name} className="rank-item">
            <span className="path-num">{String(i + 1).padStart(2, "0")}</span>
            <div className="rank-body">
              <h2 className="rank-name">{name}</h2>
              <p className="rank-what">{what}</p>
            </div>
            <div className="rank-cards" aria-label={`Example: ${cards}`}>
              {cards.split(" ").map((c) => (
                <CardFace key={c} card={parseCard(c)} size="sm" />
              ))}
            </div>
            <span className="rank-freq" title="How often this is your best hand by the river in Hold'em">
              {freq}
            </span>
          </li>
        ))}
      </ol>
      <p className="ro-caption">
        Percentages: how often each is the best five-card hand among seven cards — what you'd end up with by the river
        if you never folded.
      </p>

      <section className="strat-section">
        <div className="strat-head">
          <h2>When two players have the same hand</h2>
        </div>
        <ul className="strat-list">
          <li>
            <strong>Higher cards win.</strong> A pair of kings beats a pair of nines; a king-high flush beats a
            ten-high flush; an eight-high straight beats a six-high one.
          </li>
          <li>
            <strong>Then the kicker.</strong> If the pairs are equal, the highest remaining card — the kicker —
            decides. A♠ A♦ K♣ beats A♥ A♣ Q♦. That's why "ace-king" is so much better than "ace-four".
          </li>
          <li>
            <strong>Suits never break ties.</strong> Two identical straights or flushes of the same ranks split the pot.
          </li>
          <li>
            <strong>Only five cards count.</strong> If the five board cards are the best hand anyone can make — say a
            straight that no one's hole cards improve — everyone still in the hand splits the pot.
          </li>
          <li>
            <strong>The wheel.</strong> A-2-3-4-5 is the lowest straight. The ace can't wrap around: Q-K-A-2-3 is not
            a straight.
          </li>
        </ul>
      </section>

      <Callout to="/table" label="Open the calculator">
        Not sure what you've got? Enter your cards and the board in the calculator — it names your hand, shows what
        beats you, and how often.
      </Callout>
    </Guide>
  );
}
