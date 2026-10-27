import { useEffect, useMemo, useRef, useState } from "react";
import { Card, RANKS, SUITS, makeCard, parseCard, cardLabel } from "../poker/cards";
import { CardFace } from "../components/Cards";
import { EquityResult } from "../poker/equity";
import type { EquityResponse } from "../poker/equity.worker";
import { bestScore, categoryName, categoryOf, CATEGORY_NAMES } from "../poker/evaluator";
import { recommend } from "../poker/strategy";
import { handLabel, rangeFor, POSITIONS, POSITION_DESC, Position } from "../poker/ranges";
import { potOdds, formatPct } from "../poker/odds";
import { Donut, EquityGauge, PotBar } from "../components/Charts";
import { Explain, Formula, Term } from "../components/Explain";

type Slot = { group: "hero" | "board"; index: number };
const FILL_ORDER: Slot[] = [
  { group: "hero", index: 0 },
  { group: "hero", index: 1 },
  ...[0, 1, 2, 3, 4].map((i) => ({ group: "board" as const, index: i })),
];
const STREET_LABEL = ["Flop", "Flop", "Flop", "Turn", "River"];

// Parse a free-typed string ("asks td9h2c", "AsKsTd9h2c") into an ordered,
// de-duplicated list of cards. Forgiving: skips junk and realigns.
function parseSequence(raw: string): Card[] {
  const clean = raw.replace(/[^a-zA-Z0-9]/g, "");
  const cards: Card[] = [];
  const seen = new Set<Card>();
  let i = 0;
  while (i + 1 < clean.length && cards.length < 7) {
    const c = parseCard(clean.slice(i, i + 2));
    if (c >= 0) {
      if (!seen.has(c)) {
        cards.push(c);
        seen.add(c);
      }
      i += 2;
    } else {
      i += 1;
    }
  }
  return cards;
}

// Canonical "AsKs Td9h2c" text for a given hero + board, hand and board grouped.
function canonicalText(hero: (Card | null)[], board: (Card | null)[]): string {
  const filled = (cs: (Card | null)[]) =>
    cs.filter((c): c is Card => c !== null && c >= 0).map(cardLabel).join("");
  return [filled(hero), filled(board)].filter(Boolean).join(" ");
}

export default function PlayTool() {
  const [position, setPosition] = useState<Position>("BTN");
  const [opponents, setOpponents] = useState(2);
  const [hero, setHero] = useState<(Card | null)[]>([null, null]);
  const [board, setBoard] = useState<(Card | null)[]>([null, null, null, null, null]);
  const [active, setActive] = useState<Slot>({ group: "hero", index: 0 });
  const [pot, setPot] = useState(100);
  const [bet, setBet] = useState(50);

  const [result, setResult] = useState<EquityResult | null>(null);
  const [computing, setComputing] = useState(false);
  const timer = useRef<number | null>(null);
  const worker = useRef<Worker | null>(null);
  const reqId = useRef(0);

  // Fast input: a quick-entry text box and per-slot rank+suit hotkeys.
  const [quick, setQuick] = useState("");
  const [pendingRank, setPendingRank] = useState<number | null>(null);
  const editingQuick = useRef(false);

  const used = useMemo(() => {
    const s = new Set<Card>();
    for (const c of [...hero, ...board]) if (c !== null && c >= 0) s.add(c);
    return s;
  }, [hero, board]);

  const heroReady = hero[0] !== null && hero[1] !== null;
  const boardCards = board.filter((c): c is Card => c !== null && c >= 0);
  const boardLegal = boardCards.length === 0 || boardCards.length >= 3;
  const canCompute = heroReady && boardLegal;

  // Spin up the equity worker once; it runs the heavy simulation off the main
  // thread so the UI stays responsive. Stale results (older request id) are dropped.
  useEffect(() => {
    const w = new Worker(new URL("../poker/equity.worker.ts", import.meta.url), { type: "module" });
    w.onmessage = (e: MessageEvent<EquityResponse>) => {
      if (e.data.id !== reqId.current) return;
      setResult(e.data.result);
      setComputing(false);
    };
    worker.current = w;
    return () => w.terminate();
  }, []);

  // Auto-recompute (debounced) whenever the situation changes — no "run" button.
  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    const id = ++reqId.current; // invalidate any in-flight computation
    if (!canCompute) {
      setResult(null);
      setComputing(false);
      return;
    }
    setComputing(true);
    timer.current = window.setTimeout(() => {
      worker.current?.postMessage({
        id,
        hero: [hero[0]!, hero[1]!],
        board: boardCards,
        opponents,
        iterations: 16000,
      });
    }, 70);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hero, board, opponents]);

  // Keep the quick-entry box in sync with the cards when the user isn't typing in it
  // (e.g. after clicking the palette or starting a new hand).
  useEffect(() => {
    if (editingQuick.current) return;
    setQuick(canonicalText(hero, board));
  }, [hero, board]);

  // Per-slot hotkeys: press a rank then a suit to fill the active slot; Backspace clears.
  // Inactive whenever focus is in a text/number input so typing there is unaffected.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || el?.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "Backspace") {
        e.preventDefault();
        setPendingRank(null);
        if (valueAt(active) !== null) {
          setSlot(active, null);
          return;
        }
        const cur = FILL_ORDER.findIndex((s) => s.group === active.group && s.index === active.index);
        for (let k = 1; k <= FILL_ORDER.length; k++) {
          const s = FILL_ORDER[(cur - k + FILL_ORDER.length) % FILL_ORDER.length];
          if (valueAt(s) !== null) {
            setSlot(s, null);
            setActive(s);
            break;
          }
        }
        return;
      }

      const rankIdx = RANKS.indexOf(e.key.toUpperCase());
      if (rankIdx >= 0) {
        e.preventDefault();
        setPendingRank(rankIdx);
        return;
      }
      const suitIdx = SUITS.indexOf(e.key.toLowerCase());
      if (suitIdx >= 0 && pendingRank !== null) {
        e.preventDefault();
        const card = makeCard(pendingRank, suitIdx);
        if (!used.has(card)) pick(card);
        setPendingRank(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, pendingRank, used, hero, board]);

  function setSlot(slot: Slot, value: Card | null) {
    if (slot.group === "hero") {
      const next = [...hero];
      next[slot.index] = value;
      setHero(next);
    } else {
      const next = [...board];
      next[slot.index] = value;
      setBoard(next);
    }
  }
  const valueAt = (s: Slot) => (s.group === "hero" ? hero[s.index] : board[s.index]);

  function pick(card: Card) {
    setSlot(active, card);
    const cur = FILL_ORDER.findIndex((s) => s.group === active.group && s.index === active.index);
    for (let k = 1; k <= FILL_ORDER.length; k++) {
      const s = FILL_ORDER[(cur + k) % FILL_ORDER.length];
      const same = s.group === active.group && s.index === active.index;
      if (!same && valueAt(s) === null) {
        setActive(s);
        break;
      }
    }
  }
  function toggleSlot(slot: Slot) {
    if (valueAt(slot) === null) setActive(slot);
    else {
      setSlot(slot, null);
      setActive(slot);
    }
  }

  // Quick-entry box: re-derive hero + board from the typed string on every keystroke.
  function applyQuick(raw: string) {
    setQuick(raw);
    const cards = parseSequence(raw);
    const nextHero: (Card | null)[] = [cards[0] ?? null, cards[1] ?? null];
    const nextBoard: (Card | null)[] = [0, 1, 2, 3, 4].map((i) => cards[i + 2] ?? null);
    setHero(nextHero);
    setBoard(nextBoard);
    setPendingRank(null);
    const firstEmpty = [...nextHero, ...nextBoard].findIndex((c) => c === null);
    if (firstEmpty === 0 || firstEmpty === 1) setActive({ group: "hero", index: firstEmpty });
    else if (firstEmpty >= 2) setActive({ group: "board", index: firstEmpty - 2 });
  }

  function clearBoard() {
    setBoard([null, null, null, null, null]);
    setActive({ group: "board", index: 0 });
  }

  function newHand() {
    setHero([null, null]);
    setBoard([null, null, null, null, null]);
    setActive({ group: "hero", index: 0 });
  }

  const odds = potOdds(pot, bet);
  const players = opponents + 1;
  const verdict = result ? (result.equity >= odds.requiredEquity ? "CALL" : "FOLD") : null;
  const inRange = heroReady ? rangeFor(position).has(handLabel(hero[0]!, hero[1]!)) : false;
  const heroName = heroReady ? handLabel(hero[0]!, hero[1]!) : "—";

  const madeHand = (() => {
    if (!heroReady) return null;
    const cards = [hero[0]!, hero[1]!, ...boardCards];
    if (cards.length < 5) return null;
    return categoryName(bestScore(cards));
  })();

  const threats = result
    ? result.beatenBy
        .map((c, i) => ({ name: CATEGORY_NAMES[i], frac: result.loseCount ? c / result.loseCount : 0 }))
        .filter((t) => t.frac > 0)
        .sort((a, b) => b.frac - a.frac)
        .slice(0, 4)
    : [];

  const street =
    boardCards.length === 0 ? 0 : boardCards.length === 3 ? 1 : boardCards.length === 4 ? 2 : 3;
  const madeCategory =
    heroReady && boardCards.length >= 3 ? categoryOf(bestScore([hero[0]!, hero[1]!, ...boardCards])) : null;
  const reco = result
    ? recommend({
        street,
        inRange,
        equity: result.equity,
        opponents,
        facingBet: bet > 0,
        requiredEquity: odds.requiredEquity,
        madeCategory,
        position,
      })
    : null;

  return (
    <div className="tool">
      {/* ---------- INPUTS ---------- */}
      <div className="tool-input">
        <div className="field">
          <div className="field-head">
            <span className="field-label">Quick entry</span>
            <span className="field-note">type cards — fastest</span>
          </div>
          <input
            className="quick-input"
            type="text"
            value={quick}
            onChange={(e) => applyQuick(e.target.value)}
            onFocus={() => {
              editingQuick.current = true;
            }}
            onBlur={() => {
              editingQuick.current = false;
              setQuick(canonicalText(hero, board));
            }}
            placeholder="As Ks Td 9h 2c"
            aria-label="Quick card entry — type your hand then the board, e.g. As Ks Td 9h 2c"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <p className="quick-hint">
            First two cards are your hand, the rest is the board. Or click a slot and press a rank
            (A K Q J T 9–2) then a suit (s h d c).
            {pendingRank !== null && (
              <span className="pending">
                {" "}· waiting for suit after <strong>{RANKS[pendingRank]}</strong>
              </span>
            )}
          </p>
        </div>

        <div className="field">
          <div className="field-head">
            <span className="field-label">Position</span>
            <span className="field-note">{POSITION_DESC[position].split("—")[1]?.trim()}</span>
          </div>
          <div className="seg seg-wide">
            {POSITIONS.map((p) => (
              <button
                key={p}
                className={p === position ? "seg-btn seg-active" : "seg-btn"}
                onClick={() => setPosition(p)}
                aria-pressed={p === position}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field-label">Opponents</span>
          <div className="stepper">
            <button className="step-btn" onClick={() => setOpponents((o) => Math.max(1, o - 1))} aria-label="Fewer opponents">
              −
            </button>
            <span className="step-value" aria-live="polite">{opponents}</span>
            <button className="step-btn" onClick={() => setOpponents((o) => Math.min(8, o + 1))} aria-label="More opponents">
              +
            </button>
          </div>
        </div>

        <div className="field field-cards">
          <div className="field-head">
            <span className="field-label">Your hand</span>
            {heroReady && (
              <span className={inRange ? "tag tag-good" : "tag tag-warn"}>
                {heroName} · {inRange ? "in opening range" : "below opening range"}
              </span>
            )}
          </div>
          <div className="slots" role="group" aria-label="Your two cards">
            {[0, 1].map((i) => (
              <CardFace
                key={i}
                card={hero[i]}
                size="lg"
                active={active.group === "hero" && active.index === i}
                onClick={() => toggleSlot({ group: "hero", index: i })}
              />
            ))}
          </div>
        </div>

        <div className="field field-cards">
          <div className="field-head">
            <span className="field-label">Board</span>
            <button className="link-btn" onClick={clearBoard} disabled={boardCards.length === 0}>
              clear board
            </button>
          </div>
          <div className="board-slots" role="group" aria-label="Community cards">
            {[0, 1, 2, 3, 4].map((i) => (
              <div className="board-slot" key={i}>
                <CardFace
                  card={board[i]}
                  size="lg"
                  active={active.group === "board" && active.index === i}
                  onClick={() => toggleSlot({ group: "board", index: i })}
                />
                <span className="board-tick">{STREET_LABEL[i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="field field-row">
          <div className="field">
            <span className="field-label">Pot</span>
            <input className="num" type="number" min={0} value={pot} onChange={(e) => setPot(Number(e.target.value))} />
          </div>
          <div className="field">
            <span className="field-label">Bet to call</span>
            <input className="num" type="number" min={0} value={bet} onChange={(e) => setBet(Number(e.target.value))} />
          </div>
          <button className="btn newhand-btn" onClick={newHand}>New hand</button>
        </div>
      </div>

      {/* ---------- READOUT ---------- */}
      <div className="tool-output" aria-live="polite">
        {!canCompute && (
          <div className="placeholder">
            <p className="placeholder-big">{computing ? "…" : "Pick your two cards to start"}</p>
            <p className="hint">
              {boardCards.length === 1 || boardCards.length === 2
                ? "A board needs the full 3-card flop before odds can be shown."
                : "Leave the board empty for preflop odds, or add the flop / turn / river as they come."}
            </p>
          </div>
        )}

        {canCompute && result && (
          <>
            {reco && (
              <div className={`ro-card reco reco-${reco.tone}`}>
                <div className="reco-head">
                  <span className="reco-label">Recommended ({["Preflop", "Flop", "Turn", "River"][street]})</span>
                  <span className="reco-action">{reco.action}</span>
                </div>
                <p className="reco-reason">{reco.reason}</p>
              </div>
            )}

            <div className="ro-card ro-equity">
              <Donut
                size={150}
                center={formatPct(result.equity, 0)}
                centerSub="equity"
                segments={[
                  { label: "Win", value: result.win, color: "#36c98a" },
                  { label: "Tie", value: result.tie, color: "#d7b34a" },
                  { label: "Lose", value: result.lose, color: "#e0594f" },
                ]}
              />
              <div className="ro-equity-side">
                <div className="madehand">
                  <span className="madehand-label">{boardCards.length >= 3 ? "You currently have" : "Your hand"}</span>
                  <strong>{madeHand ?? heroName}</strong>
                </div>
                <p className="ro-caption">
                  You win this hand <strong>{formatPct(result.equity)}</strong> of the time vs{" "}
                  {opponents} random {opponents === 1 ? "opponent" : "opponents"}{" "}
                  {computing && <span className="recompute">updating…</span>}
                </p>
              </div>
            </div>

            <div className="ro-card">
              <div className="ro-head">
                <span className="ro-title">Pot odds</span>
                <span className={verdict === "CALL" ? "verdict-pill pill-call" : "verdict-pill pill-fold"}>
                  {verdict}
                </span>
              </div>
              <PotBar pot={pot} bet={bet} />
              <EquityGauge equity={result.equity} required={odds.requiredEquity} />
              <p className="ro-caption">
                You need <strong>{formatPct(odds.requiredEquity)}</strong> to call ({odds.ratio}); you
                have <strong>{formatPct(result.equity)}</strong>.
              </p>
            </div>

            <div className="ro-card">
              <div className="ro-head">
                <span className="ro-title">What beats you</span>
                <span className="ro-sub">when you lose ({formatPct(result.lose)} of hands)</span>
              </div>
              {threats.length === 0 ? (
                <p className="hint">You're ahead of essentially every hand here.</p>
              ) : (
                <div className="threats">
                  {threats.map((t) => (
                    <div className="threat" key={t.name}>
                      <span className="threat-name">{t.name}</span>
                      <div className="threat-track">
                        <div className="threat-fill" style={{ width: `${t.frac * 100}%` }} />
                      </div>
                      <span className="threat-pct">{formatPct(t.frac, 0)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Explain title="Show the math behind these numbers">
              <p>
                <strong>Equity</strong> comes from a{" "}
                <Term def="Dealing the unknown cards at random thousands of times and counting how often you win.">
                  Monte Carlo simulation
                </Term>{" "}
                of 16,000 hands. Ties split among all {players} players in the pot.
              </p>
              <Formula
                steps={[
                  {
                    label: "equity",
                    expr: `(${result.winCount.toLocaleString()} wins + ${result.tieCount.toLocaleString()} ties ÷ ${players}) ÷ ${result.iterations.toLocaleString()}`,
                    result: formatPct(result.equity),
                  },
                ]}
              />
              <p>
                <strong>Pot odds</strong> are the price of the call: chips in ÷ final pot.
              </p>
              <Formula
                steps={[
                  { label: "needed", expr: `${bet} ÷ (${pot} + ${bet} + ${bet})`, result: formatPct(odds.requiredEquity) },
                ]}
              />
              <p>
                Call when equity beats the needed number → here the math says{" "}
                <strong>{verdict}</strong>. <strong>What beats you</strong> tallies the winning
                opponent's hand type across your losses, so you know which cards to fear.
              </p>
            </Explain>
          </>
        )}
      </div>
    </div>
  );
}
