/**
 * App shell: the masthead (dateline, "LlamaPoker" wordmark linking home, page nav), the
 * decorative city backdrop, the page itself and the colophon (links, 18+ notice).
 * Pages come from the URL via src/router.ts (usePath) and the route table in src/seo.ts;
 * on every navigation the document title and meta description are updated.
 * The masthead turns compact on the working pages (Table, Trainer) so the live tool fits
 * one screen. <main key={page}> remounts a page when you switch.
 * Also rendered to HTML at build time by entry-server.tsx, so nothing here may touch
 * `window` outside effects.
 * Uses: views/* (one per route in seo.ts), components/Skyline, components/Link, router, seo.
 */

import { useEffect, useState } from "react";
import PlayTool from "./views/PlayTool";
import Strategy from "./views/Strategy";
import Glossary from "./views/Glossary";
import Trainer from "./views/Trainer";
import Home from "./views/Home";
import Privacy from "./views/Privacy";
import NotFound from "./views/NotFound";
import Learn from "./views/Learn";
import Positions from "./views/Positions";
import StartingHands from "./views/StartingHands";
import HandRankings from "./views/HandRankings";
import PokerHelper from "./views/PokerHelper";
import { CityBackdrop } from "./components/Skyline";
import { Link } from "./components/Link";
import { usePath } from "./router";
import { routeFor, PageId } from "./seo";

const NAV: [string, string][] = [
  ["/table", "The Table"],
  ["/trainer", "Trainer"],
  ["/learn", "Learn"],
  ["/glossary", "Glossary"],
];

function now() {
  const d = new Date();
  return {
    time: new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(d),
    date: new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(d),
  };
}

function Dateline() {
  // Filled in after mount, so the prerendered HTML never bakes in a build-time date.
  const [t, setT] = useState<{ time: string; date: string } | null>(null);
  useEffect(() => {
    setT(now());
    const id = window.setInterval(() => setT(now()), 15000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="dateline">
      <span>{t?.date ?? " "}</span>
      <span className="dateline-time">{t?.time}</span>
    </div>
  );
}

function Page({ page }: { page: PageId }) {
  switch (page) {
    case "home":
      return <Home />;
    case "tool":
      return <PlayTool />;
    case "trainer":
      return <Trainer />;
    case "strategy":
      return <Strategy />;
    case "glossary":
      return <Glossary />;
    case "privacy":
      return <Privacy />;
    case "learn":
      return <Learn />;
    case "positions":
      return <Positions />;
    case "starting-hands":
      return <StartingHands />;
    case "hand-rankings":
      return <HandRankings />;
    case "poker-helper":
      return <PokerHelper />;
    default:
      return <NotFound />;
  }
}

export default function App() {
  const path = usePath();
  const route = routeFor(path);
  const page = route.page;

  useEffect(() => {
    document.title = route.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", route.description);
  }, [route]);

  return (
    <>
      <CityBackdrop />
      <div className="app">
        <header className={page === "tool" || page === "trainer" ? "masthead masthead-compact" : "masthead"}>
          <Dateline />
          <div className="masthead-main">
            <Link to="/" className="wordmark" aria-label="LlamaPoker — home">
              LlamaPoker
            </Link>
            <nav className="header-nav" aria-label="Pages">
              {NAV.map(([to, label]) => (
                <Link
                  key={to}
                  to={to}
                  className={path === to || (to === "/learn" && path.startsWith("/learn")) ? "nav-btn nav-active" : "nav-btn"}
                  aria-current={path === to ? "page" : undefined}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <p className="masthead-sub">Odds, ranges and decisions for No-Limit Hold'em</p>
        </header>

        <main key={page} className="page">
          <Page page={page} />
        </main>

        <footer className="colophon">
          <span>LlamaPoker</span>
          <span>
            A study and training tool. Figures are Monte Carlo estimates against the ranges you choose — not financial
            advice. 18+ · Play responsibly.
          </span>
          <span className="colophon-links">
            <Link to="/table">Odds calculator</Link>
            <Link to="/learn/hand-rankings">Hand rankings</Link>
            <Link to="/learn/positions">Positions</Link>
            <Link to="/learn/starting-hands">Starting hands</Link>
            <Link to="/strategy">Strategy</Link>
            <Link to="/privacy">Privacy</Link>
          </span>
        </footer>
      </div>
    </>
  );
}
