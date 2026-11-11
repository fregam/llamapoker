/**
 * Channels side by side: each with its key number, its trend and what it brought to the north
 * star (subscribers by first touch, from Beehiiv). A channel with no view events yet says so
 * instead of showing a number.
 */
import { Pane, Meter, Evidence } from "../components/ui";
import type { PanelProps } from "./registry";

export function Channels({ state, open, setOpen, wall, flash }: PanelProps) {
  const ch = state.channels;
  const maxBrought = Math.max(1, ...ch.map((c) => c.brought ?? 0));
  const opened = open === "channels";
  return (
    <Pane id="channels" title="CHANNELS" question="Which channel is bringing subscribers, and which went quiet?" flash={flash} tag={`${ch.length} LIVE`}>
      <ul className="channels" onClick={() => !wall && setOpen(opened ? null : "channels")} style={{ cursor: wall ? "default" : "pointer" }}>
        {ch.map((c) => (
          <li key={c.id}>
            <div className="a">
              <span className="k">{c.name}</span>
              <span className="v">{c.value === null ? "--" : c.value}</span>
              <span className="u">{c.value === null ? c.note.toUpperCase() : c.unit.toUpperCase()}</span>
            </div>
            <div className="b">
              <span className="s">BROUGHT</span>
              <Meter share={(c.brought ?? 0) / maxBrought} dim={!c.brought} />
              <span className="n">{c.brought ?? "--"}</span>
            </div>
          </li>
        ))}
      </ul>
      {opened && (
        <div className="drawer">
          <div className="drawer-h">SOURCES</div>
          <Evidence data={ch.map((c) => `${c.name.padEnd(10)} ${c.note}`).join("\n")} />
        </div>
      )}
    </Pane>
  );
}
