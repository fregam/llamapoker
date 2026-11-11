/**
 * The machine: a wireframe schematic of every station that exists, with real counts moving
 * through the links. Colour is state: cyan ok, dim idle, amber waiting on you or paused, red
 * failed (with glow, visible from across the room), faint no data. A station opens in place
 * into its evidence (the row, the last failure, its last events from the store).
 */
import { useEffect, useState } from "react";
import type { Station } from "../model";
import { fetchEvents, clock } from "../lib/api";
import { Pane, Evidence } from "../components/ui";
import type { PanelProps } from "./registry";

const W = 172;
const H = 118;
const GAP = 34;
const STATE_WORD: Record<Station["state"], string> = { ok: "OK", idle: "IDLE", waiting: "WAITING", failed: "FAILED", paused: "PAUSED", nodata: "NO DATA" };

const trim = (s: string | null | undefined, n: number) => (s ? (s.length > n ? s.slice(0, n - 1) + "…" : s) : "");

export function Machine({ state, open, setOpen, wall, flash }: PanelProps) {
  const n = state.stations.length;
  const total = n * W + (n - 1) * GAP + 40;
  const x = (i: number) => 20 + i * (W + GAP);
  const index = new Map(state.stations.map((s, i) => [s.id, i]));
  const failed = state.stations.filter((s) => s.state === "failed").length;
  const waiting = state.stations.filter((s) => s.state === "waiting").length;
  const opened = open?.startsWith("station:") ? state.stations.find((s) => "station:" + s.id === open) : undefined;

  return (
    <Pane
      id="machine"
      title="THE MACHINE"
      question="Is anything in the pipeline stuck or broken, and where?"
      tone={failed ? "red" : waiting ? "amber" : undefined}
      flash={flash}
      tag={
        <>
          {n} STATIONS · <span className={failed ? "rd" : ""}>{failed} FAILED</span> · <span className={waiting ? "am" : ""}>{waiting} WAITING</span>
          {state.paused && <span className="am"> · PAUSED</span>}
        </>
      }
    >
      <div className="mach-wrap">
      <svg className="mach" viewBox={`0 0 ${total} 200`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="glr" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* the bus: every station writes to the one store */}
        <path className="bus" d={`M ${x(0) + W / 2} 150 V 172 H ${x(n - 1) + W / 2} V 150`} />
        <text className="bustext" x={x(0) + W / 2 + 8} y={186}>
          EVENT BUS → STORE {state.feed.length ? <tspan>{state.feed.length} RECENT</tspan> : <tspan>EMPTY</tspan>}
        </text>
        {state.links.map((l) => {
          const a = index.get(l.from);
          const b = index.get(l.to);
          if (a === undefined || b === undefined) return null;
          const adjacent = b === a + 1;
          const d = adjacent
            ? `M ${x(a) + W} 60 H ${x(b)}`
            : `M ${x(a) + W / 2} ${H + 20} V ${H + 34} H ${x(b) + W / 2 - 24} V ${H + 20}`;
          const mx = adjacent ? (x(a) + W + x(b)) / 2 : x(b) + W / 2 - 24;
          return (
            <g key={l.from + l.to}>
              <path className={`ln${l.stalled ? " stall" : ""}`} d={d} />
              {adjacent && <path className="ln" d={`M ${x(b) - 7} 55 L ${x(b)} 60 L ${x(b) - 7} 65`} />}
              {l.label && (
                <text className="lnlab" x={mx} y={adjacent ? 52 : H + 46} textAnchor="middle">
                  {l.label}
                </text>
              )}
            </g>
          );
        })}
        {state.stations.map((s, i) => (
          <g
            key={s.id}
            className={`node ${s.state}${opened?.id === s.id ? " open" : ""}`}
            transform={`translate(${x(i)} 20)`}
            onClick={() => !wall && setOpen(opened?.id === s.id ? null : "station:" + s.id)}
            style={{ cursor: wall ? "default" : "pointer" }}
          >
            <rect className="bx" width={W} height={H} rx="1" filter={s.state === "failed" ? "url(#glr)" : undefined} />
            <path className="ck" d={`M 0 10 V 0 H 10 M ${W - 10} 0 H ${W} V 10 M ${W} ${H - 10} V ${H} H ${W - 10} M 10 ${H} H 0 V ${H - 10}`} />
            <text className="nm" x={10} y={18}>
              {trim(s.name, 10).toUpperCase()}
            </text>
            <text className="st" x={W - 8} y={18} textAnchor="end">
              {STATE_WORD[s.state]}
            </text>
            <text className="big" x={10} y={58}>
              {s.count === null || s.count === undefined ? "--" : s.count}
            </text>
            <text className="unit" x={W - 8} y={58} textAnchor="end">
              {(s.countLabel ?? "").toUpperCase()}
            </text>
            <text className="sm" x={10} y={80}>
              {trim(s.message, 25)}
            </text>
            <text className="sm" x={10} y={96}>
              LAST <tspan className="v">{s.lastRun ? clock(s.lastRun, state.day) : "--"}</tspan>
            </text>
            <text className="sm" x={10} y={110}>
              NEXT <tspan className="v">{s.nextRun ? clock(s.nextRun, state.day) : "--"}</tspan>
            </text>
          </g>
        ))}
      </svg>
      </div>
      {opened && <StationEvidence station={opened} />}
    </Pane>
  );
}

function StationEvidence({ station }: { station: Station }) {
  const [events, setEvents] = useState<unknown[] | null>(null);
  useEffect(() => {
    let on = true;
    fetchEvents({ station: station.id, limit: "20" })
      .then((r) => on && setEvents(r.events))
      .catch(() => on && setEvents([]));
    return () => {
      on = false;
    };
  }, [station.id]);
  return (
    <div className="drawer">
      <div className="drawer-h">
        {station.name.toUpperCase()} · {station.state.toUpperCase()} · {station.message ?? ""}
      </div>
      <div className="drawer-cols">
        <Evidence data={station.evidence ?? "no evidence recorded for this station"} />
        <Evidence data={events === null ? "loading events…" : events.length ? events : "no events from this station in the store"} />
      </div>
    </div>
  );
}
