/**
 * "The Table" — the live tool, laid out as three columns that fit one screen:
 * cards | seat, action, chips, opponents | the read.
 * Owns all of the situation's state (hand, board, active slot, seat, facing a bet,
 * pot/bet/stack, opponents). Cards can be entered three ways: the CardPicker deck,
 * the quick-entry text box, or rank+suit hotkeys (plus B / arrows / N shortcuts).
 * Seats depend on table size (seatsFor) and rotate like the button on "Next hand".
 * Data flow: state → Spot → useEquity (web worker) → analyzeSpot → <Readout>.
 * Uses: poker/cards, poker/ranges, poker/analyze, hooks/useEquity, components/Cards,
 * CardPicker, Step, OpponentRanges, Readout.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, RANKS, SUITS, makeCard, parseCard, cardLabel, remainingDeck, shuffle } from "../poker/cards";
import { CardFace } from "../components/Cards";
import { handLabel, rangeFor, threeBetRange, callRange, raiserFromPresets, POSITIONS, POSITION_DESC, Position } from "../poker/ranges";
import { analyzeSpot, Spot } from "../poker/analyze";
import { useEquity } from "../hooks/useEquity";
import { OpponentRanges, OppSetup, newOpp, oppCombos, oppsKey, describeOpps } from "../components/OpponentRanges";
import { Readout } from "../components/Readout";
import { Step } from "../components/Step";
import { CardPicker } from "../components/CardPicker";
import { Link } from "../components/Link";

// Full seat names, shown on hover — most new players don't know the abbreviations yet.
const SEAT_NAMES: Record<Position, string> = {
  UTG: "UTG — Under the Gun: first to act before the flop",
  MP: "MP — Middle Position (the hijack)",
  CO: "CO — Cutoff: the seat right of the button",
  BTN: "BTN — Button (dealer): acts last after the flop",
  SB: "SB — Small Blind: posts half a big blind",
  BB: "BB — Big Blind: posts one big blind, acts last before the flop",
};

// Seats that exist at a table of this size (you + opponents). Seats are named by how many
// players act after you, so a 4-handed CO uses the same opening range as a 6-max CO.
function seatsFor(players: number): Position[] {
  if (players <= 2) return ["BTN", "BB"];
  if (players === 3) return ["BTN", "SB", "BB"];
  if (players === 4) return ["CO", "BTN", "SB", "BB"];
  if (players === 5) return ["MP", "CO", "BTN", "SB", "BB"];
  return POSITIONS;
}
function tableName(players: number): string {
  if (players <= 2) return "Heads-up";
  return players >= 6 ? (players === 6 ? "6-max" : `${players}-handed`) : `${players}-handed`;
}
// When the button moves on, your seat moves one step: BTN → CO → MP → UTG → BB → SB → BTN,
// skipping seats this table doesn't have.
const ROTATION: Position[] = ["BTN", "CO", "MP", "UTG", "BB", "SB"];
function nextSeat(p: Position, seats: Position[]): Position {
  const order = ROTATION.filter((s) => seats.includes(s));
  return order[(order.indexOf(p) + 1) % order.length];
}

const SLOT_NAMES = {
  hero: ["your first card", "your second card"],
  board: ["the first flop card", "the second flop card", "the third flop card", "the turn", "the river"],
};

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
  const [opps, setOpps] = useState<OppSetup[]>([newOpp(), newOpp()]);
  const [hero, setHero] = useState<(Card | null)[]>([null, null]);
  const [board, setBoard] = useState<(Card | null)[]>([null, null, null, null, null]);
  const [active, setActive] = useState<Slot>({ group: "hero", index: 0 });
  const [facing, setFacing] = useState(false);
  const [pot, setPot] = useState(100);
  const [bet, setBet] = useState(50);
  const [stack, setStack] = useState(1000);

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
  const heroPair: [Card, Card] | null = heroReady ? [hero[0]!, hero[1]!] : null;
  const street = boardCards.length === 0 ? 0 : boardCards.length - 2;

  const players = opps.length + 1;
  const seats = seatsFor(players);
  // If the table shrinks and your seat no longer exists, move to the earliest seat that does.
  useEffect(() => {
    if (!seats.includes(position)) setPosition(seats[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players]);

  const oppRanges = useMemo(() => opps.map(oppCombos), [opps]);
  const eqKey = `${hero.join(",")}|${boardCards.join(",")}|${oppsKey(opps)}|${canCompute}`;
  const { result, computing } = useEquity(canCompute ? heroPair : null, boardCards, oppRanges, eqKey);

  // Keep the quick-entry box in sync with the cards when the user isn't typing in it.
  useEffect(() => {
    if (editingQuick.current) return;
    setQuick(canonicalText(hero, board));
  }, [hero, board]);

  // Per-slot hotkeys: press a rank then a suit to fill the active slot; Backspace clears.
  // Inactive whenever focus is in a text/number input or select so typing there is unaffected.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable) return;
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

      // Table shortcuts: N next hand, B bet / check, arrows change seat.
      const k = e.key.toLowerCase();
      if (k === "n") {
        e.preventDefault();
        setPendingRank(null);
        newHand();
        return;
      }
      if (k === "b") {
        e.preventDefault();
        setFacing((f) => !f);
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const step = e.key === "ArrowRight" ? 1 : seats.length - 1;
        setPosition((p) => seats[(Math.max(0, seats.indexOf(p)) + step) % seats.length]);
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
  }, [active, pendingRank, used, hero, board, players]);

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
    setPosition((p) => nextSeat(p, seats));
    setHero([null, null]);
    setBoard([null, null, null, null, null]);
    setActive({ group: "hero", index: 0 });
    setFacing(false);
  }

  // Deal random cards: your hand if it's empty, otherwise the next street.
  // A new street means the betting starts over: default back to "checked to you".
  const lastStreet = useRef(street);
  useEffect(() => {
    if (street !== lastStreet.current) {
      lastStreet.current = street;
      setFacing(false);
    }
  }, [street]);

  const allSet = heroReady && boardCards.length === 5;
  const activeName = SLOT_NAMES[active.group][active.index];
  const pickPrompt =
    valueAt(active) !== null
      ? allSet
        ? "Every card is set. Click a card on the table to change it."
        : `Replacing ${activeName}.`
      : `Choose ${activeName}.`;

  const nextDeal = !heroReady ? "hand" : boardCards.length < 3 ? "flop" : boardCards.length === 3 ? "turn" : boardCards.length === 4 ? "river" : null;
  function dealNext() {
    const deck = shuffle(remainingDeck([...used]));
    if (nextDeal === "hand") {
      setHero(hero.map((c) => c ?? deck.pop()!));
      setActive({ group: "board", index: 0 });
      return;
    }
    const count = nextDeal === "flop" ? 3 : 1;
    const next = [...board];
    let added = 0;
    for (let i = 0; i < 5 && added < count; i++) {
      if (next[i] === null) {
        next[i] = deck.pop()!;
        added++;
      }
    }
    setBoard(next);
    setFacing(false); // new street: action starts over
  }

  const heroName = heroReady ? handLabel(hero[0]!, hero[1]!) : "—";
  // One opponent on a seat's opening range ("BTN open") tells us who raised preflop.
  const raiser = raiserFromPresets(opps.map((o) => o.preset));
  const rangeTag = (() => {
    if (!heroReady) return null;
    if (street === 0 && facing) {
      if (threeBetRange(position, raiser).has(heroName)) return { good: true, text: "3-bet range" };
      if (callRange(position, raiser).has(heroName)) return { good: true, text: "calling range" };
      return { good: false, text: "fold vs a raise" };
    }
    if (position === "BB") return null;
    return rangeFor(position).has(heroName)
      ? { good: true, text: "in opening range" }
      : { good: false, text: "below opening range" };
  })();

  const spot: Spot | null = heroPair
    ? { hero: heroPair, board: boardCards, position, raiser, facingBet: facing, pot, bet, stack, opponents: opps.length }
    : null;
  const analysis = spot && result && !result.impossible ? analyzeSpot(spot, result) : null;
  const facingLabels = street === 0 ? ["Unopened", "Facing a raise"] : ["Checked to you", "Facing a bet"];

  return (
    <div className="tool tool-cockpit">
      <h1 className="sr-only">Poker odds calculator</h1>
      {/* ---------- CARDS ---------- */}
      <div className="tool-input tool-cards">
        <Step
          num="01"
          title="Cards"
          aside={
            rangeTag && (
              <span className={rangeTag.good ? "tag tag-good" : "tag tag-warn"}>
                {heroName} · {rangeTag.text}
              </span>
            )
          }
        >
          <div className="table table-row">
            <div className="table-hero" role="group" aria-label="Your two cards">
              {[0, 1].map((i) => (
                <div className="board-slot" key={i}>
                  <CardFace
                    card={hero[i]}
                    size="md"
                    active={active.group === "hero" && active.index === i}
                    onClick={() => toggleSlot({ group: "hero", index: i })}
                  />
                  <span className="board-tick">Hand</span>
                </div>
              ))}
            </div>
            <div className="table-board" role="group" aria-label="Community cards">
              {[0, 1, 2, 3, 4].map((i) => (
                <div className={i >= 3 ? "board-slot board-gap" : "board-slot"} key={i}>
                  <CardFace
                    card={board[i]}
                    size="md"
                    active={active.group === "board" && active.index === i}
                    onClick={() => toggleSlot({ group: "board", index: i })}
                  />
                  <span className="board-tick">{STREET_LABEL[i]}</span>
                </div>
              ))}
            </div>
          </div>

          <CardPicker used={used} onPick={pick} prompt={pickPrompt} disabled={allSet && valueAt(active) !== null} />

          <div className="quick-wrap">
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
              placeholder="or type them · As Ks  Td 9h 2c"
              aria-label="Quick card entry — type your hand then the board, e.g. As Ks Td 9h 2c"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          <div className="table-actions">
            <span className="board-actions">
              <button className="chip-btn chip-strong" onClick={newHand} title="Shortcut: N">
                Next hand · seat → {nextSeat(position, seats)}
              </button>
              <button className="chip-btn" onClick={clearBoard} disabled={boardCards.length === 0}>
                Clear board
              </button>
              <button className="chip-btn" onClick={dealNext} disabled={nextDeal === null}>
                {nextDeal ? `Random ${nextDeal}` : "Board complete"}
              </button>
            </span>
            {pendingRank !== null && (
              <span className="pending">
                {RANKS[pendingRank]} — now a suit: <kbd>s</kbd> <kbd>h</kbd> <kbd>d</kbd> <kbd>c</kbd>
              </span>
            )}
          </div>
        </Step>
      </div>

      {/* ---------- SETTINGS ---------- */}
      <div className="tool-input tool-settings">
        <Step
          num="02"
          title="Seat"
          aside={
            <>
              {tableName(players)} · {POSITION_DESC[position].split("—")[1]?.trim() ?? ""}{" "}
              <Link to="/learn/positions" className="aside-link">
                What's this?
              </Link>
            </>
          }
        >
          <div className="seg seg-wide">
            {seats.map((p) => (
              <button
                key={p}
                className={p === position ? "seg-btn seg-active" : "seg-btn"}
                onClick={() => setPosition(p)}
                aria-pressed={p === position}
                title={SEAT_NAMES[p]}
              >
                {p}
              </button>
            ))}
          </div>
        </Step>

        <Step num="03" title="Action">
          <div className="seg seg-wide">
            {facingLabels.map((label, i) => (
              <button
                key={label}
                className={facing === (i === 1) ? "seg-btn seg-active" : "seg-btn"}
                onClick={() => setFacing(i === 1)}
                aria-pressed={facing === (i === 1)}
                title="Shortcut: B"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="money-row">
            <label className="money">
              <span className="money-label">Pot</span>
              <input className="num" type="number" min={0} value={pot} onChange={(e) => setPot(Math.max(0, Number(e.target.value)))} />
            </label>
            <label className={facing ? "money" : "money money-off"}>
              <span className="money-label">To call</span>
              <input
                className="num"
                type="number"
                min={0}
                value={facing ? bet : 0}
                disabled={!facing}
                onChange={(e) => setBet(Math.max(0, Number(e.target.value)))}
              />
            </label>
            <label className="money">
              <span className="money-label">Your stack</span>
              <input
                className="num"
                type="number"
                min={0}
                value={stack}
                onChange={(e) => setStack(Math.max(0, Number(e.target.value)))}
                title="Effective stack — the smaller of your stack and the biggest opponent's"
              />
            </label>
          </div>
        </Step>

        <OpponentRanges opps={opps} onChange={setOpps} />

        <p className="shortcuts">
          <span>
            <kbd>A</kbd>–<kbd>2</kbd> + <kbd>s</kbd><kbd>h</kbd><kbd>d</kbd><kbd>c</kbd> card
          </span>
          <span>
            <kbd>⌫</kbd> undo card
          </span>
          <span>
            <kbd>B</kbd> bet / check
          </span>
          <span>
            <kbd>←</kbd>
            <kbd>→</kbd> seat
          </span>
          <span>
            <kbd>N</kbd> next hand
          </span>
        </p>
      </div>

      {/* ---------- READOUT ---------- */}
      <div className="tool-output" aria-live="polite">
        {!canCompute && (
          <div className="placeholder">
            <div className="placeholder-mark" aria-hidden="true">
              <span>♠</span>
              <span>♥</span>
            </div>
            <p className="placeholder-big">
              {heroReady ? "Complete the flop" : "What are you holding?"}
            </p>
            <p className="hint">
              {boardCards.length === 1 || boardCards.length === 2
                ? "The board needs all three flop cards before the odds can be read."
                : "Pick your two cards from the deck. Add the flop, turn and river as they come — or leave the board empty to read preflop."}
            </p>
            {!heroReady && (
              <button className="btn" onClick={dealNext}>
                Or deal a random hand
              </button>
            )}
            {!heroReady && (
              <div className="starter">
                <span className="figure-label">New here? Three steps</span>
                <ol>
                  <li>
                    <strong>Your two cards</strong> — click them in the deck.
                  </li>
                  <li>
                    <strong>Your seat</strong> — where you sit relative to the dealer button.{" "}
                    <Link to="/learn/positions">Positions explained</Link>
                  </li>
                  <li>
                    <strong>The action</strong> — did someone raise or bet before you? If so, enter the pot and the bet.
                  </li>
                </ol>
                <p>
                  Add the flop, turn and river as they come. New to the hands themselves?{" "}
                  <Link to="/learn/hand-rankings">What beats what</Link>.
                </p>
              </div>
            )}
          </div>
        )}

        {canCompute && !result && (
          <div className="placeholder">
            <p className="placeholder-big">Reading the table…</p>
          </div>
        )}

        {canCompute && result?.impossible && (
          <div className="placeholder">
            <p className="placeholder-big">Can't compute these odds</p>
            <p className="hint">{result.impossible} Widen the range or pick a preset.</p>
          </div>
        )}

        {canCompute && spot && result && analysis && (
          <Readout spot={spot} a={analysis} result={result} computing={computing} oppsText={describeOpps(opps)} />
        )}
      </div>
    </div>
  );
}
