/**
 * Shared frame for the Learn guides:
 *   <Guide path title lead>  breadcrumb (Learn / this guide), the page's single <h1>, a
 *                            standfirst, the content, then "Next in the path" and links
 *                            back to the tools — internal links that help both readers
 *                            and search engines.
 *   <Callout to label>       an inline "try it in the tool" box.
 * The breadcrumb's structured data lives in seo.ts (BreadcrumbList); this is the visible one.
 * Used by: views/Learn.tsx and every guide (HandRankings, Positions, StartingHands, PotOdds, Outs,
 * PokerHelper).
 * Uses: components/Link, components/Signup (the letter form at the foot of every guide, source
 * "guide-<slug>"), seo (LEARN_PATH, routeFor).
 */

import { ReactNode } from "react";
import { Link } from "./Link";
import { LEARN_PATH, routeFor } from "../seo";
import { Signup } from "./Signup";

export function Guide({ path, title, lead, children }: { path: string; title: string; lead: ReactNode; children: ReactNode }) {
  const i = LEARN_PATH.indexOf(path);
  const next = i >= 0 && i < LEARN_PATH.length - 1 ? LEARN_PATH[i + 1] : null;
  return (
    <article className="strategy guide">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/learn">Learn</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{routeFor(path).name}</span>
      </nav>
      <h1 className="page-title">{title}</h1>
      <p className="lead">{lead}</p>
      {children}
      <footer className="guide-foot">
        <Signup source={`guide-${path.split("/").pop()}`} compact />
        {next && (
          <Link to={next} className="guide-next">
            <span className="figure-label">Next in the path</span>
            <span className="guide-next-name">{routeFor(next).name} →</span>
          </Link>
        )}
        <p className="guide-tools">
          Put it to work: <Link to="/table">the poker odds calculator</Link> · <Link to="/trainer">the trainer</Link> ·{" "}
          <Link to="/learn">all guides</Link>
        </p>
      </footer>
    </article>
  );
}

export function Callout({ to, label, children }: { to: string; label: string; children: ReactNode }) {
  return (
    <aside className="callout">
      <p>{children}</p>
      <Link to={to} className="btn">
        {label}
      </Link>
    </aside>
  );
}
