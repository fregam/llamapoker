/**
 * The Trainer page. Five drills, picked in the bar at the top:
 *   Full hand      play a whole hand street by street vs one villain (poker/handPlay)
 *   Mixed          single random spots from every street (poker/drills.randomSpot)
 *   Preflop        seat charts only
 *   Call or fold   facing a bet: does your equity beat the price?
 *   Count the outs type how many cards improve you (poker/drills.outsSpot)
 * Every question runs the same pipeline as the live tool: useEquity → analyzeSpot.
 * grade() compares your answer with reco.choice (or the pure price / the outs count),
 * accepting either call or fold when equity is within 3% of the price ("close call").
 * Answers are allowed only once the full simulation for this exact question has landed.
 * An optional shot clock turns a timeout into a fold / check. Results go to
 * poker/stats (all-time + leaks) and to in-memory session totals.
 * Layout: drill bar on top; left = the spot, table, answers, feedback; right = your
 * stats and leaks while deciding, then <Readout showReco={false}> after answering.
 * Uses: poker/handPlay, poker/drills, poker/analyze, poker/stats, poker/cards, poker/ranges,
 * hooks/useEquity, components/Cards, OpponentRanges (helpers), Readout.
 */

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Card, cardLabel } from "../poker/cards";
import { CardFace } from "../components/Cards";
import { presetByKey } from "../poker/ranges";
import { analyzeSpot, Analysis, Spot } from "../poker/analyze";
import type { EquityResult } from "../poker/equity";
import type { Choice } from "../poker/strategy";
import { useEquity } from "../hooks/useEquity";
import { newOpp, oppCombos, describeOpps } from "../components/OpponentRanges";
import { Readout } from "../components/Readout";
import { Stats, emptyStats, loadStats, recordDecision, saveStats, findLeaks, isOk } from "../poker/stats";
import { formatPct } from "../poker/odds";
import { HandState, dealHand, spotOf, optionsOf, applyChoice, pretty, boardOf } from "../poker/handPlay";
import { randomSpot, outsSpot, optionsFor } from "../poker/drills";

const STREETS = ["Preflop", "Flop", "Turn", "River"];

type Mode = "hand" | "mixed" | "preflop" | "price" | "outs";
const MODES: { id: Mode; label: string; blurb: string }[] = [
  { id: "hand", label: "Full hand", blurb: "Play a whole hand, street by street." },
  { id: "mixed", label: "Mixed", blurb: "Single spots from every street." },
  { id: "preflop", label: "Preflop", blurb: "Open, 3-bet, call or fold by seat." },
  { id: "price", label: "Call or fold", blurb: "Does your equity beat the price?" },
  { id: "outs", label: "Count the outs", blurb: "How many cards improve you?" },
];
const CLOCKS = [0, 20, 10];
const CLOSE = 0.03; // within 3% of the price, call and fold are both fine

interface Question {
  key: string;
  mode: Mode;
  spot: Spot;
  oppPresets: string[];
  story: string;
  kind: "choice" | "outs";
}

interface Verdict {
  ok: boolean;
  close: boolean;
  target: string;
  title: string;
  body: string;
  ev?: number; // average result of calling, in bb
}

let qid = 1;
function questionFromHand(h: HandState): Question {
  return {
    key: `h${h.id}-${h.log.length}`,
    mode: "hand",
    spot: spotOf(h),
    oppPresets: [h.villainPreset],
    story: h.log[h.log.length - 1].text,
    kind: "choice",
  };
}
function newQuestion(mode: Mode): { q: Question; hand: HandState | null } {
  if (mode === "hand") {
    const hand = dealHand();
    return { q: questionFromHand(hand), hand };
  }
  const d =
    mode === "preflop"
      ? randomSpot({ street: 0 })
      : mode === "price"
        ? randomSpot({ street: 1 + ((Math.random() * 3) | 0), facing: true })
        : mode === "outs"
          ? outsSpot()
          : randomSpot();
  return { q: { key: `q${qid++}`, mode, ...d, kind: mode === "outs" ? "outs" : "choice" }, hand: null };
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
const signed = (n: number) => (n > 0 ? "+" : n < 0 ? "−" : "") + fmt(Math.abs(n));
const pct = (c: number, t: number) => (t ? formatPct(c / t, 0) : "—");

function labelFor(c: Choice, s: Spot): string {
  if (c === "raise") return s.facingBet && s.bet > 0 ? "Raise" : s.board.length === 0 ? "Raise" : "Bet";
  return c[0].toUpperCase() + c.slice(1);
}

function grade(q: Question, a: Analysis, r: EquityResult, answer: string, timedOut: boolean): Verdict {
  if (q.kind === "outs") {
    const n = Number.parseInt(answer, 10);
    const right = a.draws?.outs.length ?? 0;
    const ok = !timedOut && n === right;
    const close = !ok && !timedOut && Math.abs(n - right) === 1;
    const what = a.draws && right > 0 ? `${a.draws.draws.join(" and ") || "Improvement"} — ${a.draws.byHand.map((h) => `${h.count} to ${h.name.toLowerCase()}`).join(", ")}.` : "No card makes two pair or better here.";
    return {
      ok,
      close,
      target: String(right),
      title: timedOut ? `Time's up — it's ${right}.` : ok ? `Exactly — ${right} outs.` : close ? `Close — it's ${right}.` : `It's ${right}.`,
      body: what,
    };
  }

  const s = q.spot;
  const facing = s.facingBet && s.bet > 0;
  const eq = r.equity;
  const req = a.requiredEquity;
  const target = q.mode === "price" ? (eq >= req ? "call" : "fold") : a.reco!.choice;
  const near = facing && Math.abs(eq - req) < CLOSE;
  const close = near && !timedOut && (answer === "call" || answer === "fold") && (target === "call" || target === "fold");
  const ok = !timedOut && (answer === target || close);
  const ev = facing ? eq * (s.pot + s.bet + a.call) - a.call : undefined;
  const play = q.mode === "price" ? (target === "call" ? "call" : "fold") : a.reco!.action.toLowerCase();
  const body =
    q.mode === "price"
      ? `${formatPct(eq)} equity against the ${formatPct(req)} you need${near ? " — razor thin" : ""}.`
      : a.reco!.reason;
  const title = timedOut
    ? `Time's up — the play was ${play}.`
    : ok
      ? close && answer !== target
        ? "Close call — either is fine."
        : "Correct."
      : `Not quite — the play is ${play}.`;
  return { ok, close, target, title, body, ev };
}

export default function Trainer() {
  const [mode, setMode] = useState<Mode>("hand");
  const [clock, setClock] = useState(0);
  const [{ q, hand: dealt }] = useState(() => newQuestion("hand"));
  const [question, setQuestion] = useState<Question>(q);
  const [hand, setHand] = useState<HandState | null>(dealt);
  const [next, setNext] = useState<HandState | null>(null); // hand state after your answer
  const [answer, setAnswer] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [handMarks, setHandMarks] = useState<{ street: number; ok: boolean }[]>([]);
  const [outsInput, setOutsInput] = useState("");
  const [stats, setStats] = useState<Stats>(loadStats);
  const [session, setSession] = useState({ total: 0, correct: 0, net: 0, hands: 0 });
  const [confirmReset, setConfirmReset] = useState(false);
  const [left, setLeft] = useState<number | null>(null);
  const outsRef = useRef<HTMLInputElement>(null);

  const spot = question.spot;
  const oppRanges = useMemo(() => question.oppPresets.map((p) => oppCombos(newOpp(p))), [question]);
  const { result, resultKey, computing } = useEquity(spot.hero, spot.board, oppRanges, question.key);
  // Grade only against the full simulation for this exact question, not the quick first pass.
  const fresh = result !== null && resultKey === question.key && !computing;
  const analysis = fresh ? analyzeSpot(spot, result) : null;
  const ready = analysis !== null && (question.kind === "outs" || analysis.reco !== null);
  const opts: Choice[] = question.mode === "hand" && hand ? optionsOf(hand) : optionsFor(spot);
  const verdict = answer !== null && analysis && result ? grade(question, analysis, result, answer, timedOut) : null;
  const handOver = question.mode === "hand" && hand?.over ? hand.over : null;

  function load(m: Mode) {
    const n = newQuestion(m);
    setQuestion(n.q);
    setHand(n.hand);
    setNext(null);
    setAnswer(null);
    setTimedOut(false);
    setOutsInput("");
    if (m === "hand") setHandMarks([]);
  }

  function submit(ans: string, timeout = false) {
    if (!ready || !analysis || !result || answer !== null) return;
    const v = grade(question, analysis, result, ans, timeout);
    setAnswer(ans);
    setTimedOut(timeout);
    const facing = spot.facingBet && spot.bet > 0;
    const s = recordDecision(stats, {
      at: Date.now(),
      mode: question.mode,
      street: analysis.street,
      position: spot.position,
      hand: spot.hero.map(cardLabel).join(""),
      board: spot.board.map(cardLabel).join(""),
      facing,
      answer: ans,
      correct: v.target,
      ok: v.ok,
      close: v.close,
      timedOut: timeout,
      action: question.kind === "outs" ? `${v.target} outs` : question.mode === "price" ? v.target : analysis.reco!.action,
    });
    setStats(s);
    saveStats(s);
    setSession((x) => ({ ...x, total: x.total + 1, correct: x.correct + (v.ok ? 1 : 0) }));
    if (question.mode === "hand" && hand) {
      setNext(applyChoice(hand, ans as Choice));
      setHandMarks((m) => [...m, { street: analysis.street, ok: v.ok }]);
    }
  }
  const submitRef = useRef(submit);
  submitRef.current = submit;

  function proceed() {
    if (answer === null && !handOver) return;
    if (question.mode !== "hand") return load(question.mode);
    if (handOver) return load("hand"); // the hand is finished: deal the next one
    if (!next) return;
    if (next.over) {
      // Show the result of the hand; the last decision's breakdown stays on the right.
      setHand(next);
      setNext(null);
      setSession((x) => ({ ...x, net: x.net + next.over!.heroNet, hands: x.hands + 1 }));
      return;
    }
    setHand(next);
    setQuestion(questionFromHand(next));
    setNext(null);
    setAnswer(null);
    setTimedOut(false);
  }
  const proceedRef = useRef(proceed);
  proceedRef.current = proceed;

  // Shot clock: counts down once the question is ready; at zero you fold / check.
  useEffect(() => {
    if (!clock || !ready || answer !== null || handOver) {
      setLeft(null);
      return;
    }
    const start = performance.now();
    setLeft(clock);
    const id = window.setInterval(() => {
      const l = clock - (performance.now() - start) / 1000;
      if (l <= 0) {
        window.clearInterval(id);
        setLeft(0);
        const fallback = question.kind === "outs" ? "" : opts.includes("check") ? "check" : "fold";
        submitRef.current(fallback, true);
      } else setLeft(l);
    }, 100);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clock, ready, answer, question.key, handOver]);

  // Focus the outs box as soon as a counting question is ready.
  useEffect(() => {
    if (question.kind === "outs" && ready && answer === null) outsRef.current?.focus();
  }, [question.key, ready, answer]);

  // Keyboard: 1–3 answer, Enter / N continue.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      const n = Number(e.key);
      if (answer === null && !handOver && question.kind === "choice" && n >= 1 && n <= opts.length) {
        submitRef.current(opts[n - 1]);
      } else if ((answer !== null || handOver) && (e.key === "Enter" || e.key.toLowerCase() === "n")) {
        e.preventDefault();
        proceedRef.current();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function onOuts(e: FormEvent) {
    e.preventDefault();
    if (outsInput.trim() === "") return;
    submit(String(Number.parseInt(outsInput, 10) || 0));
  }

  const leaks = findLeaks(stats.history);
  // At showdown the whole runout is shown; if someone folded, only what was dealt.
  const boardShown = handOver && hand ? (handOver.result === "showdown" ? hand.runout : boardOf(hand)) : spot.board;
  // The hand so far (everything before the headline line), newest last.
  const history = question.mode === "hand" && hand ? hand.log.slice(0, -1).slice(-4) : [];
  const headline = handOver ? hand!.log[hand!.log.length - 1].text : question.story;
  const continueLabel =
    question.mode !== "hand"
      ? "Next spot"
      : handOver
        ? "Next hand"
        : next?.over
          ? "See how it ends"
          : next
            ? `On to the ${STREETS[next.street].toLowerCase()}`
            : "Continue";

  return (
    <div className="trainer-page">
      <h1 className="sr-only">Poker trainer</h1>
      <div className="trainer-bar">
        <div className="seg trainer-modes" role="group" aria-label="Drill">
          {MODES.map((m) => (
            <button
              key={m.id}
              className={mode === m.id ? "seg-btn seg-active" : "seg-btn"}
              aria-pressed={mode === m.id}
              title={m.blurb}
              onClick={() => {
                setMode(m.id);
                load(m.id);
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="trainer-clock-pick">
          <span className="money-label">Shot clock</span>
          <div className="seg" role="group" aria-label="Shot clock">
            {CLOCKS.map((c) => (
              <button
                key={c}
                className={clock === c ? "seg-btn seg-active" : "seg-btn"}
                aria-pressed={clock === c}
                onClick={() => setClock(c)}
              >
                {c === 0 ? "Off" : `${c}s`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="tool trainer">
        <div className="tool-input">
          <p className="trainer-blurb">{MODES.find((m) => m.id === mode)!.blurb}</p>
          <div className="trainer-top">
            <span className="strat-tag">{STREETS[spot.board.length === 0 ? 0 : spot.board.length - 2]}</span>
            <span className="strat-tag">{spot.position}</span>
            <span className="strat-tag">stack {fmt(spot.stack)}bb</span>
          </div>

          {history.length > 0 && (
            <ol className="hand-log">
              {history.map((e, i) => (
                <li key={i}>
                  <span className="hand-log-street">{STREETS[e.street]}</span>
                  {e.text.replace(/^(Preflop|Flop|Turn|River)\.? /, "")}
                </li>
              ))}
            </ol>
          )}

          <p className="trainer-story">{headline}</p>
          {!handOver && (
            <p className="quick-hint" style={{ marginTop: 0 }}>
              Against: {question.oppPresets.map((p) => presetByKey(p).name).join(", ")}
            </p>
          )}

          <div className="table table-row trainer-cards">
            <div className="table-hero" aria-label="Your hand">
              {spot.hero.map((c) => (
                <div className="board-slot" key={c}>
                  <CardFace card={c} size="md" />
                  <span className="board-tick">You</span>
                </div>
              ))}
            </div>
            <div className="table-board" aria-label="Board">
              {[0, 1, 2, 3, 4].map((i) => (
                <div className={i >= 3 ? "board-slot board-gap" : "board-slot"} key={i}>
                  <CardFace card={(boardShown[i] as Card | undefined) ?? null} size="md" />
                  <span className="board-tick">{["Flop", "Flop", "Flop", "Turn", "River"][i]}</span>
                </div>
              ))}
            </div>
          </div>
          {handOver && hand && (
            <div className="villain-row">
              {hand.villain.map((c) => (
                <CardFace key={c} card={c} size="md" />
              ))}
              <span className="table-label">
                {hand.villainSeat} held {pretty(hand.villain[0])} {pretty(hand.villain[1])}
              </span>
            </div>
          )}
          {!handOver && spot.board.length > 0 && (
            <p className="felt-pot">
              Pot <strong>{fmt(spot.pot)}bb</strong>
              {spot.facingBet && spot.bet > 0 && (
                <>
                  {" "}· to call <strong>{fmt(spot.bet)}bb</strong>
                </>
              )}
            </p>
          )}

          {left !== null && (
            <div className={left < 4 ? "shot-clock shot-clock-low" : "shot-clock"} aria-label={`${Math.ceil(left)} seconds left`}>
              <span style={{ width: `${(left / clock) * 100}%` }} />
              <em>{Math.ceil(left)}s</em>
            </div>
          )}

          {handOver ? (
            <div className="hand-result">
              <span className="figure-label">This hand</span>
              <span className={handOver.heroNet >= 0 ? "hand-net hand-net-up" : "hand-net hand-net-down"}>
                {signed(handOver.heroNet)}
                <span className="figure-unit">bb</span>
              </span>
              <span className="hand-marks">
                {handMarks.map((m, i) => (
                  <span key={i} className={m.ok ? "mark-ok" : "mark-bad"}>
                    {m.ok ? "✓" : "✗"} {STREETS[m.street]}
                  </span>
                ))}
              </span>
              <p className="ro-caption">
                Graded on the decisions, not the cards: a good call can still lose.
              </p>
            </div>
          ) : question.kind === "outs" ? (
            <form className="outs-form" onSubmit={onOuts}>
              <input
                ref={outsRef}
                className="num outs-input"
                type="number"
                min={0}
                max={25}
                inputMode="numeric"
                placeholder="?"
                value={outsInput}
                disabled={!ready || answer !== null}
                onChange={(e) => setOutsInput(e.target.value)}
                aria-label="Number of outs"
              />
              <button className="btn btn-primary" type="submit" disabled={!ready || answer !== null || outsInput === ""}>
                Answer
              </button>
              <span className="quick-hint">Cards that make two pair or better with your hand.</span>
            </form>
          ) : (
            <div className="answer-row" role="group" aria-label="Your decision">
              {opts.map((o, i) => (
                <button
                  key={o}
                  className={[
                    "btn answer-btn",
                    verdict && o === verdict.target ? "answer-correct" : "",
                    verdict && answer === o && !verdict.ok ? "answer-wrong" : "",
                  ].join(" ")}
                  disabled={!ready || answer !== null}
                  onClick={() => submit(o)}
                >
                  <span className="answer-key">{i + 1}</span>
                  {labelFor(o, spot)}
                </button>
              ))}
            </div>
          )}
          {!ready && !handOver && <p className="hint">Reading the spot…</p>}

          {verdict && !handOver && (
            <div className={verdict.ok ? "quiz-feedback feedback-right" : "quiz-feedback feedback-wrong"} aria-live="polite">
              <strong>{verdict.title}</strong>
              <p style={{ margin: "6px 0 0" }}>{verdict.body}</p>
              {verdict.ev !== undefined && (
                <p className="feedback-ev">
                  Calling is worth <b>{signed(Math.round(verdict.ev * 10) / 10)}bb</b> on average here.
                </p>
              )}
              {next && !next.over && question.mode === "hand" && (
                <p className="feedback-ev">{next.log[next.log.length - 2]?.text}</p>
              )}
            </div>
          )}

          {(answer !== null || handOver) && (
            <button className="btn btn-primary next-btn" onClick={proceed}>
              {continueLabel} <span className="answer-key">Enter</span>
            </button>
          )}
        </div>

        <div className="tool-output" aria-live="polite">
          {answer !== null && analysis && result ? (
            <Readout
              spot={spot}
              a={analysis}
              result={result}
              computing={false}
              oppsText={describeOpps(question.oppPresets.map((p) => newOpp(p)))}
              showReco={false}
            />
          ) : (
            <SidePanel
              stats={stats}
              session={session}
              leaks={leaks}
              confirmReset={confirmReset}
              onReset={() => {
                if (!confirmReset) {
                  setConfirmReset(true);
                  return;
                }
                const s = emptyStats();
                setStats(s);
                saveStats(s);
                setConfirmReset(false);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function SidePanel({
  stats,
  session,
  leaks,
  onReset,
  confirmReset,
}: {
  stats: Stats;
  session: { total: number; correct: number; net: number; hands: number };
  leaks: ReturnType<typeof findLeaks>;
  onReset: () => void;
  confirmReset: boolean;
}) {
  return (
    <div className="side-panel">
      <div className="figures">
        <div className="figure">
          <span className="figure-label">This session</span>
          <span className="figure-value">
            {session.total ? Math.round((session.correct / session.total) * 100) : "—"}
            {session.total > 0 && <span className="figure-unit">%</span>}
          </span>
          <span className="figure-note">
            {session.correct} of {session.total} right
          </span>
        </div>
        <div className="figure">
          <span className="figure-label">Results</span>
          <span className="figure-value">
            {session.hands ? signed(session.net) : "—"}
            {session.hands > 0 && <span className="figure-unit">bb</span>}
          </span>
          <span className="figure-note">{session.hands} full hands · luck included</span>
        </div>
        <div className="figure">
          <span className="figure-label">All time</span>
          <span className="figure-value">
            {stats.total ? Math.round((stats.correct / stats.total) * 100) : "—"}
            {stats.total > 0 && <span className="figure-unit">%</span>}
          </span>
          <span className="figure-note">
            streak {stats.streak} · best {stats.bestStreak}
          </span>
        </div>
      </div>

      <section className="ro-section">
        <h3 className="ro-title">
          Your leaks <span className="ro-sub">the spots you miss most</span>
        </h3>
        {leaks.length === 0 ? (
          <p className="ro-caption">
            {stats.total < 12
              ? "Play a few more spots — leaks show up after four or more tries of a kind."
              : "Nothing under 75% right now. Keep going."}
          </p>
        ) : (
          <div className="threats">
            {leaks.map((l) => (
              <div className="threat" key={l.label}>
                <span className="threat-name leak-name">{l.label}</span>
                <div className="threat-track">
                  <div className="threat-fill" style={{ width: `${(l.correct / l.total) * 100}%` }} />
                </div>
                <span className="threat-pct">{pct(l.correct, l.total)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="ro-section">
        <h3 className="ro-title">By street</h3>
        <dl className="split-legend">
          {stats.byStreet.map((b, i) => (
            <div key={i}>
              <dt>{STREETS[i]}</dt>
              <dd>{pct(b.correct, b.total)}</dd>
            </div>
          ))}
        </dl>
      </section>

      {stats.history.length > 0 && (
        <section className="ro-section">
          <h3 className="ro-title">
            Recent{" "}
            <button className="link-btn" onClick={onReset} style={{ marginLeft: "auto" }}>
              {confirmReset ? "click again to reset" : "reset stats"}
            </button>
          </h3>
          <ul className="history">
            {stats.history.slice(0, 6).map((d) => (
              <li key={d.at} className={isOk(d) ? "hist-ok" : "hist-bad"}>
                <span aria-hidden="true">{isOk(d) ? "✓" : "✗"}</span>
                <span className="hist-hand">{d.hand}</span>
                <span className="hist-board">{d.board || "preflop"}</span>
                <span className="hist-pos">{d.position}</span>
                <span className="hist-act">
                  {d.timedOut ? "timed out · " : ""}
                  {isOk(d) ? d.action : `you: ${d.answer || "—"} · play: ${d.action}`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
