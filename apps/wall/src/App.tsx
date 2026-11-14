/**
 * The wall. One full screen, no scrolling, every panel from panels/registry.ts in its grid
 * area; the header carries the clock, the day being viewed, the pause state and the keys.
 * Behaviour (docs/interface.md): everything opens in place (`open`), one key opens the command
 * bar (`act` runs its commands), `[` and `]` scrub to past days' snapshots, the kill switch is
 * guarded, the briefing shows on the first open of each day (`?nobrief` skips it, e.g. for a
 * screenshot), `w` is wall mode, and under 800 px the wall becomes a column of the panels marked
 * `phone` (Results, Needs you) followed by the briefing.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { post, shiftDay, useMedia, useWall } from "./lib/api";
import { panels } from "./panels/registry";
import { CommandBar } from "./components/CommandBar";

const PANEL_KEYS = Object.fromEntries(panels.map((p) => [p.key, p.id]));

function read(key: string, fallback = "") {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private window: the page still works */
  }
}

export default function App() {
  const [day, setDay] = useState<string | null>(null);
  const { state, error, loading, reload, changedAt } = useWall(day);
  const [open, setOpen] = useState<string | null>(null);
  const [wall, setWall] = useState(() => new URLSearchParams(window.location.search).get("mode") === "wall"); // ?mode=wall for the second screen
  const [overlays, setOverlays] = useState(() => read("wall-overlays") === "1");
  const [bar, setBar] = useState(false);
  const [help, setHelp] = useState(false);
  const [brief, setBrief] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const phone = useMedia("(max-width: 800px)");
  const flash = Date.now() - changedAt < 1500;

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => write("wall-overlays", overlays ? "1" : "0"), [overlays]);
  useEffect(() => {
    if (state && state.live && !wall && !new URLSearchParams(window.location.search).has("nobrief") && read("wall-briefed") !== state.day) {
      setBrief(true);
      write("wall-briefed", state.day);
    }
  }, [state, wall]);
  useEffect(() => {
    if (!msg) return;
    const id = window.setTimeout(() => setMsg(null), 6000);
    return () => window.clearTimeout(id);
  }, [msg]);
  useEffect(() => {
    if (!focus) return;
    document.getElementById(`pane-${focus}`)?.scrollIntoView({ block: "nearest" });
    const id = window.setTimeout(() => setFocus(null), 1200);
    return () => window.clearTimeout(id);
  }, [focus]);
  useEffect(() => {
    if (open) write("wall-opened", `${read("wall-opened")}\n${new Date().toISOString()} ${open}`.slice(-4000)); // what gets opened, for the monthly review
  }, [open]);

  const act = useCallback(
    async (cmd: string) => {
      const [verb, ...rest] = cmd.trim().split(/\s+/);
      const arg = rest.join(" ");
      const v = verb.toLowerCase();
      try {
        if (v === "go") {
          const p = panels.find((x) => x.id.startsWith(arg.toLowerCase()));
          if (!p) throw new Error("no panel " + arg);
          setFocus(p.id);
        } else if (v === "open") {
          const s = state?.stations.find((x) => x.id.startsWith(arg.toLowerCase()));
          if (!s) throw new Error("no station " + arg);
          setOpen("station:" + s.id);
          setFocus("work");
        } else if (v === "call" || v === "fold" || v === "raise") {
          const [idArg, ...noteWords] = rest;
          const item = state?.queue.find((q) => q.id === idArg || q.id.startsWith(idArg ?? "") || q.title.toLowerCase().startsWith((idArg ?? "").toLowerCase()));
          if (!item) throw new Error("no waiting piece " + idArg);
          const note = noteWords.join(" ");
          if (v === "raise" && !note) throw new Error("raise needs a note");
          await post(`/api/queue/${item.id}`, { action: v, note: note || null });
          setMsg(`${item.title}: ${v === "call" ? "called" : v === "fold" ? "folded" : "raised"}`);
          await reload();
        } else if (v === "day") {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(arg)) throw new Error("day <YYYY-MM-DD>");
          setDay(arg);
        } else if (v === "today") setDay(null);
        else if (v === "pause") {
          if (arg.toLowerCase() !== "now") throw new Error("type the full phrase: pause now");
          await post("/api/flags", { key: "paused", value: "1" });
          setMsg("KILL SWITCH ON: outbound paused");
          await reload();
        } else if (v === "resume") {
          await post("/api/flags", { key: "paused", value: "0" });
          setMsg("kill switch off: outbound resumed");
          await reload();
        } else if (v === "ceiling") {
          if (Number.isNaN(Number(arg)) || !arg) throw new Error("ceiling <eur>");
          await post("/api/flags", { key: "budget_ceiling", value: arg });
          setMsg(`ceiling set to EUR ${arg}`);
          await reload();
        } else if (v === "note") {
          if (!arg) throw new Error("note <text>");
          await post("/api/event", { kind: "note", station: "wall", text: arg });
          await reload();
        } else if (v === "wall") setWall((w) => !w);
        else if (v === "overlays") setOverlays((o) => !o);
        else if (v === "briefing") setBrief(true);
        else if (v === "reload") await reload();
        else if (v === "logout") window.location.href = "/api/logout";
        else if (v === "help") setHelp(true);
        else throw new Error("unknown command: " + verb);
      } catch (e) {
        setMsg("! " + (e as Error).message);
        throw e;
      }
    },
    [state, reload],
  );

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (brief) {
        setBrief(false);
        return;
      }
      if (e.key === "Escape") {
        setBar(false);
        setHelp(false);
        setOpen(null);
        return;
      }
      if (wall && e.key !== "w") return;
      const k = e.key;
      if (k === "/" || k === "k") {
        e.preventDefault();
        setBar(true);
      } else if (k === "w") setWall((w) => !w);
      else if (k === "o") setOverlays((o) => !o);
      else if (k === "?") setHelp((h) => !h);
      else if (k === "b") setBrief(true);
      else if (k === "r") void reload();
      else if (k === "t") setDay(null);
      else if (k === "[" || k === "]") {
        const base = day ?? state?.day ?? new Date().toISOString().slice(0, 10);
        const next = shiftDay(base, k === "[" ? -1 : 1);
        const today = new Date().toISOString().slice(0, 10);
        setDay(next >= today ? null : next);
      } else if (k === "p") {
        setBar(true);
      } else if (PANEL_KEYS[k]) setFocus(PANEL_KEYS[k]);
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [wall, brief, day, state, reload]);

  const shown = useMemo(() => (state ? panels.filter((p) => !p.enabled || p.enabled(state)) : []), [state]);
  const hhmm = now.toISOString().slice(11, 16);

  if (!state) {
    return (
      <div className="boot">
        <div className="boot-t">LLAMAPOKER · WALL</div>
        <div className={error ? "rd" : "dim"}>{error ? `cannot read the state: ${error}` : "reading the state…"}</div>
        {error && day && (
          <button className="link" onClick={() => setDay(null)}>
            back to today
          </button>
        )}
      </div>
    );
  }

  const header = (
    <header className="hdr">
      <div className="brand">
        LLAMAPOKER<span>WALL</span>
      </div>
      <div className="date">
        {state.live ? "LIVE" : "SNAPSHOT"} · {state.day}
        {!state.live && <span className="am"> · AS OF {state.asof.slice(11, 16)}Z</span>}
        <span className="clk">
          <i>88:88</i>
          {hhmm}
        </span>
        <span className="dim"> UTC</span>
      </div>
      <div className="sw">
        {msg && <span className={`msg${msg.startsWith("!") ? " am" : ""}`}>{msg}</span>}
        {loading && <span className="faint">READING</span>}
        {state.errors.length > 0 && <span className="rd">{state.errors.length} SOURCE{state.errors.length > 1 ? "S" : ""} DOWN</span>}
        <span className={`box${state.paused ? " paused" : ""}`}>
          <i />
          {state.paused ? "OUTBOUND PAUSED" : "OUTBOUND LIVE"}
        </span>
        {!wall && <span className="kill">KILL: type “pause now”</span>}
      </div>
    </header>
  );

  if (phone) {
    const phonePanels = shown.filter((p) => p.phone);
    return (
      <div className="phone">
        {header}
        {phonePanels.map((p) => (
          <p.Component key={p.id} state={state} open={open} setOpen={setOpen} act={act} wall={false} flash={flash} phone />
        ))}
        <section className="briefing-card">
          <h2>BRIEFING</h2>
          <p>{state.briefing}</p>
        </section>
      </div>
    );
  }

  return (
    <div className={`wall${wall ? " wallmode" : ""}${overlays || wall ? " overlays" : ""}`}>
      {header}
      {shown.map((p) => (
        <div key={p.id} className={`area ${p.area}${focus === p.id ? " focus" : ""}`}>
          <p.Component state={state} open={open} setOpen={setOpen} act={act} wall={wall} flash={flash} />
        </div>
      ))}
      {!wall && (
        <footer className="keys">
          <span>
            <b>/</b> command
          </span>
          <span>
            <b>1–5</b> panels
          </span>
          <span>
            <b>[ ]</b> days
          </span>
          <span>
            <b>t</b> today
          </span>
          <span>
            <b>b</b> briefing
          </span>
          <span>
            <b>w</b> wall mode
          </span>
          <span>
            <b>o</b> overlays
          </span>
          <span>
            <b>esc</b> close
          </span>
          <span>
            <b>?</b> help
          </span>
          {state.days.length > 0 && <span className="faint">{state.days.length} DAYS STORED</span>}
        </footer>
      )}
      <CommandBar open={bar} onClose={() => setBar(false)} run={act} />
      {brief && (
        <div className="brief-wrap" onClick={() => setBrief(false)}>
          <div className="brief">
            <h2>THE GENTLEMAN'S BRIEFING · {state.day}</h2>
            <p>{state.briefing}</p>
            <div className="faint">any key to close</div>
          </div>
        </div>
      )}
      {help && (
        <div className="brief-wrap" onClick={() => setHelp(false)}>
          <div className="brief">
            <h2>PANELS AND WHAT THEY ANSWER</h2>
            <ul>
              {shown.map((p) => (
                <li key={p.id}>
                  <b>{p.key}</b> {p.title}: {p.question} <span className="faint">reads {p.reads.join(", ")}</span>
                </li>
              ))}
            </ul>
            <div className="faint">esc to close</div>
          </div>
        </div>
      )}
      <div className="scan" />
      <div className="glass" />
    </div>
  );
}
