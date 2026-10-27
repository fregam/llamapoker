import { useState } from "react";
import PlayTool from "./views/PlayTool";
import Strategy from "./views/Strategy";
import Glossary from "./views/Glossary";

type Page = "tool" | "strategy" | "glossary";

export default function App() {
  const [page, setPage] = useState<Page>("tool");

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-chip">♠</span>
          <div>
            <h1>Poker Odds — live table tool</h1>
            <p>Set your seat, hand and board. Odds, threats and the call/fold verdict update as you go.</p>
          </div>
        </div>
        <nav className="header-nav" aria-label="Pages">
          {([
            ["tool", "Tool"],
            ["strategy", "Strategy"],
            ["glossary", "Glossary"],
          ] as [Page, string][]).map(([id, label]) => (
            <button
              key={id}
              className={page === id ? "nav-btn nav-active" : "nav-btn"}
              onClick={() => setPage(id)}
              aria-pressed={page === id}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {page === "tool" && <PlayTool />}
      {page === "strategy" && <Strategy />}
      {page === "glossary" && <Glossary />}

      <footer className="app-footer">
        Equities are Monte-Carlo estimates vs random opponents. For study — not real-money advice.
      </footer>
    </div>
  );
}
