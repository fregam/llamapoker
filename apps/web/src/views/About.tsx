/**
 * The about page (/about): who makes LlamaPoker, how its numbers are computed, how the guides
 * are written and what the site is for. It is the page every guide's byline links to, and the
 * `url` of the author in the guides' structured data (seo.ts AUTHOR). Keep every statement
 * true: no credentials, results or experience that are not real. Prerendered at build time.
 * Uses: components/Link, seo (AUTHOR).
 */

import { Link } from "../components/Link";
import { AUTHOR } from "../seo";

export default function About() {
  return (
    <div className="strategy">
      <h1 className="page-title">About LlamaPoker</h1>
      <p className="lead">
        LlamaPoker is a free study tool for No-Limit Hold'em, made by {AUTHOR.name}. This page says who is behind it
        and where every number on the site comes from.
      </p>

      <section className="strat-section">
        <div className="strat-head">
          <h2>Who makes it</h2>
        </div>
        <ul className="strat-list">
          <li>
            <strong>{AUTHOR.name}</strong> builds LlamaPoker and signs the guides. It is an independent project: no
            poker site owns it, pays for it or advertises on it.
          </li>
          <li>
            <strong>The Gentleman and the llama</strong> are drawings. They are the brand's characters, not authors
            and not experts.
          </li>
        </ul>
      </section>

      <section className="strat-section">
        <div className="strat-head">
          <h2>How the numbers are made</h2>
        </div>
        <ul className="strat-list">
          <li>
            <strong>One engine, everywhere.</strong> The <Link to="/table">odds calculator</Link>, the{" "}
            <Link to="/trainer">trainer</Link> and the charts in the <Link to="/learn">guides</Link> all run on the
            same code, so a range chart or a percentage in a guide is what the Table gives you for that spot. You can
            check any of them yourself.
          </li>
          <li>
            <strong>Equity is simulated.</strong> Your chance of winning against a range is estimated by dealing the
            rest of the hand thousands of times (a Monte Carlo simulation), so it can move by a fraction of a percent
            between runs.
          </li>
          <li>
            <strong>Outs and hit chances are exact.</strong> The odds of a draw coming in are counted from the cards
            left in the deck, not estimated.
          </li>
          <li>
            <strong>The code is public.</strong> The engine and its tests are open to read at{" "}
            <a href="https://github.com/fregam/llamapoker">github.com/fregam/llamapoker</a>.
          </li>
        </ul>
      </section>

      <section className="strat-section">
        <div className="strat-head">
          <h2>How the guides are written</h2>
        </div>
        <ul className="strat-list">
          <li>
            The guides are drafted with AI assistance, then read and approved by {AUTHOR.name} before they are
            published. Their charts and percentages are computed when the site is built, from the same engine and
            formulas the Table uses. The one exception is the frequency column on the{" "}
            <Link to="/learn/hand-rankings">hand rankings</Link> page: those are the standard published figures for
            seven-card hands.
          </li>
          <li>
            Each guide shows the date it last changed. If you find a mistake, reply to the letter and it will be
            fixed.
          </li>
        </ul>
      </section>

      <section className="strat-section">
        <div className="strat-head">
          <h2>What it is for</h2>
        </div>
        <ul className="strat-list">
          <li>
            Studying, reviewing hands you have played and training. Most online poker sites forbid real-time
            assistance during play, so LlamaPoker is not for use at a real-money table. More on that in{" "}
            <Link to="/learn/online-poker-helper">what's allowed</Link>.
          </li>
          <li>
            For adults (18+). What the site stores about you is on the <Link to="/privacy">privacy page</Link>: very
            little.
          </li>
        </ul>
      </section>
    </div>
  );
}
