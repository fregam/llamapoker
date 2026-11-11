/**
 * The north star: subscribers as very large segmented digits, their trend, reach and the
 * weekly-active share beside them, the day's real line (what changed, what to do) under them.
 * Opens into the day-by-day table the trend is drawn from. Every number comes from Beehiiv or
 * the store; a missing source shows as dashes and says why.
 */
import { Pane, Seg, Evidence, signed } from "../components/ui";
import type { PanelProps } from "./registry";

export function North({ state, open, setOpen, wall, flash }: PanelProps) {
  const n = state.north;
  const opened = open === "north";
  const pts = n.byDay.slice(-30);
  const max = Math.max(1, ...pts.map((p) => p.count));
  const spark = pts.length >= 2 ? pts.map((p, i) => `${(i / (pts.length - 1)) * 300},${60 - (p.count / max) * 56}`).join(" ") : "";
  return (
    <Pane id="north" title="NORTH STAR" question="Are subscribers growing, and what changed today?" flash={flash} tag={state.live ? "LIVE" : `SNAPSHOT ${state.day}`}>
      <div className="ns" onClick={() => !wall && setOpen(opened ? null : "north")} style={{ cursor: wall ? "default" : "pointer" }}>
        <div className="ret">
          <Seg value={n.subscribers} digits={6} className="huge" fit />
          <div className="under">SUBSCRIBERS{n.subscribers === null && <span className="rd"> · BEEHIIV UNREACHABLE</span>}</div>
          {spark ? (
            <svg className="spark" viewBox="0 0 300 64" preserveAspectRatio="none">
              <polyline points={spark} />
            </svg>
          ) : (
            <div className="faint small">{pts.length === 1 ? "one day of data, no trend yet" : "no day-by-day data"}</div>
          )}
        </div>
        <div className="tr">
          <Row k="24 H" v={signed(n.delta1)} s="subscribers" />
          <Row k="7 D" v={signed(n.delta7)} s={n.delta7 === null ? "no data" : "subscribers"} />
          <Row k="REACH 7D" v={n.reach === null ? "--" : String(n.reach)} s={n.reach === null ? "no channel reports views yet" : "views, all channels"} />
          <Row k="ACTIVE" v={n.weeklyActiveShare === null ? "--" : `${Math.round(n.weeklyActiveShare * 100)}%`} s={n.weeklyActiveShare === null ? "no letter sent yet" : "average open rate"} />
        </div>
      </div>
      <div className="line">
        <span className="dim">{n.today}</span>
        <div className="do">
          <b>DO</b>
          {n.action}
        </div>
      </div>
      {opened && (
        <div className="drawer">
          <div className="drawer-h">SUBSCRIBERS BY DAY (Beehiiv, active, first touch counted on the channels panel)</div>
          <Evidence data={n.byDay.length ? n.byDay.map((p) => `${p.day}  ${String(p.count).padStart(6)}`).join("\n") : "no subscribers yet"} />
        </div>
      )}
    </Pane>
  );
}

function Row({ k, v, s }: { k: string; v: string; s: string }) {
  return (
    <div className="row">
      <div className="a">
        <span className="k">{k}</span>
        <span className="v">{v}</span>
      </div>
      <div className="s">{s}</div>
    </div>
  );
}
