/**
 * The home page (/): the lead magnet's landing page. Editorial layout:
 *   hero (headline, standfirst, CTAs) + a "specimen" of the read for a real spot
 *   → what's inside (Table, Trainer, Library) → how it works → the letter (email
 *   signup, beside a plate of the brand character, public/brand/gentleman-*.webp) → FAQ. Positioned as a study, hand-review and training tool — most online
 *   poker sites forbid real-time assistance during play, and the FAQ says so plainly.
 * The specimen's numbers are what the Table shows for that exact spot (A♥5♥ on
 * K♥ 9♥ 2♣, facing 50 into 100, two random opponents); update them if the logic changes.
 * Prerendered to HTML at build time (see scripts/prerender.mjs), so no `window` at render.
 * Uses: components/Cards, components/Link, components/Signup, poker/cards.
 */

import { CardFace } from "../components/Cards";
import { Link } from "../components/Link";
import { Signup } from "../components/Signup";
import { parseCard } from "../poker/cards";
import { FAQ } from "../content/faq";
import { LEARN_PATH, routeFor } from "../seo";

const hand = ["Ah", "5h"].map(parseCard);
const board = ["Kh", "9h", "2c"].map(parseCard);

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-copy">
          <span className="kicker">
            <span className="kicker-dot" aria-hidden="true" />
            Free · in your browser · no sign-up
          </span>
          <h1 className="hero-title">Know the price of every decision.</h1>
          <p className="hero-standfirst">
            LlamaPoker reads a poker spot the way a coach would: your real odds against the hands your opponents
            actually play, the price the pot is laying you, every out, and the move that makes money long-term.
            Then it trains you until you see it without help.
          </p>
          <div className="hero-ctas">
            <Link to="/table" className="btn btn-primary">
              Open the table
            </Link>
            <Link to="/trainer" className="btn">
              Train a full hand
            </Link>
          </div>
        </div>

        <figure className="specimen" aria-label="Example: what LlamaPoker shows for a flush draw">
          <div className="specimen-cards">
            <div className="specimen-group">
              {hand.map((c) => (
                <CardFace key={c} card={c} size="md" />
              ))}
            </div>
            <div className="specimen-group">
              {board.map((c) => (
                <CardFace key={c} card={c} size="md" />
              ))}
            </div>
          </div>
          <p className="specimen-spot">Flop · facing 50 into 100 · two opponents</p>
          <span className="kicker">
            <span className="kicker-dot specimen-dot" aria-hidden="true" />
            The play · Flop
          </span>
          <p className="specimen-action">Raise (semi-bluff)</p>
          <div className="figures specimen-figures">
            <div className="figure">
              <span className="figure-label">Equity</span>
              <span className="figure-value">
                54<span className="figure-unit">%</span>
              </span>
              <span className="figure-note">Ace-high, flush draw</span>
            </div>
            <div className="figure">
              <span className="figure-label">Needed</span>
              <span className="figure-value">
                25<span className="figure-unit">%</span>
              </span>
              <span className="figure-note">price 3.0 : 1</span>
            </div>
            <div className="figure">
              <span className="figure-label">Outs</span>
              <span className="figure-value">9</span>
              <span className="figure-note">35% by the river</span>
            </div>
          </div>
          <figcaption className="specimen-caption">What the Table shows for this spot.</figcaption>
        </figure>
      </section>

      <section className="home-section beginner">
        <div>
          <h2 className="home-h2">New to poker? Start here.</h2>
          <p className="hero-standfirst">
            If you know how a hand is dealt but "UTG" and "pot odds" mean nothing yet, read these in order — each takes a
            few minutes — then open the Table and try what you learned.
          </p>
        </div>
        <ol className="path-list">
          {LEARN_PATH.slice(0, 5).map((p, i) => (
            <li key={p}>
              <Link to={p}>
                <span className="path-num">{String(i + 1).padStart(2, "0")}</span>
                <span className="path-name">{routeFor(p).name}</span>
                <span className="path-arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="home-section">
        <h2 className="home-h2">What's inside</h2>
        <div className="pillars">
          <article className="pillar">
            <span className="step-num">01</span>
            <h3>The Table</h3>
            <p>
              Enter your hand, seat, the action and what each opponent could hold. Equity, the pot-odds price, outs,
              implied odds and the recommended move update as you go — on one screen, with keyboard shortcuts.
            </p>
            <Link to="/table" className="chip-btn chip-strong">
              Open the table →
            </Link>
          </article>
          <article className="pillar">
            <span className="step-num">02</span>
            <h3>The Trainer</h3>
            <p>
              Play whole hands against an opponent holding real cards, or drill preflop charts, pot odds and counting
              outs against a shot clock. It grades every decision and shows you your leaks.
            </p>
            <Link to="/trainer" className="chip-btn chip-strong">
              Start training →
            </Link>
          </article>
          <article className="pillar">
            <span className="step-num">03</span>
            <h3>The Library</h3>
            <p>
              A street-by-street strategy guide and a plain-language glossary — equity, pot odds, outs, SPR, ranges —
              each with worked examples.
            </p>
            <span className="pillar-links">
              <Link to="/strategy" className="chip-btn chip-strong">
                Strategy →
              </Link>
              <Link to="/glossary" className="chip-btn chip-strong">
                Glossary →
              </Link>
            </span>
          </article>
        </div>
      </section>

      <section className="home-section">
        <h2 className="home-h2">How it works</h2>
        <ol className="strat-list how-list">
          <li>
            <strong>Real ranges, not random hands.</strong> A player who raised from early position doesn't hold any
            two cards. Give each opponent a range — a seat's opening range, a 3-bet range, or your own — and the odds
            reflect the table you're actually at.
          </li>
          <li>
            <strong>Twenty thousand hands in a blink.</strong> Every spot is dealt out thousands of times in your
            browser, with ties split the way real pots are.
          </li>
          <li>
            <strong>Exact outs and prices.</strong> Every card that improves you, the chance of hitting by the turn and
            river, the break-even equity for a call and the implied odds a draw needs.
          </li>
          <li>
            <strong>A move, with the reason.</strong> Open, 3-bet, value bet, semi-bluff, call or fold — chosen from
            your seat, equity, made hand, outs, the price and stack depth, explained in one line.
          </li>
        </ol>
      </section>

      <section className="home-section letter" id="letter">
        <figure className="plate">
          <img
            src="/brand/gentleman-640.webp"
            srcSet="/brand/gentleman-640.webp 640w, /brand/gentleman-1100.webp 1100w"
            sizes="(max-width: 900px) 90vw, 420px"
            width={640}
            height={640}
            loading="lazy"
            alt="The LlamaPoker llama in a dinner jacket and bow tie, holding his cards"
          />
          <figcaption>Plate I · The Gentleman</figcaption>
        </figure>
        <div className="letter-copy">
          <h2 className="home-h2">The LlamaPoker letter.</h2>
          <p className="hero-standfirst">
            New drills, sharper strategy and the poker journal we're building — tournaments, the people and the ideas
            behind the game. Occasional, never spam.
          </p>
          <Signup source="home" />
        </div>
      </section>

      <section className="home-section">
        <h2 className="home-h2">Questions</h2>
        <dl className="faq">
          {FAQ.map(([q, a]) => (
            <div className="gloss-entry" key={q}>
              <dt className="gloss-term">{q}</dt>
              <dd className="gloss-def">{a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
