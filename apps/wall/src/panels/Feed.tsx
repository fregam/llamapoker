/**
 * The live feed: events as they happen, in plain words, newest first. A line opens into the
 * raw record. The feed reads only the store; a reading with no store says so.
 */
import type { WallEvent } from "../model";
import { Pane, Evidence, Empty } from "../components/ui";
import { clock } from "../lib/api";
import type { PanelProps } from "./registry";

const words = (e: WallEvent) =>
  e.text ??
  [e.kind, e.station && `at ${e.station}`, e.subject, e.amount !== null && e.amount !== undefined && `${e.amount} ${e.unit ?? ""}`.trim()].filter(Boolean).join(" ");

export function Feed({ state, open, setOpen, wall, flash }: PanelProps) {
  const feed = state.feed;
  return (
    <Pane id="feed" title="LIVE FEED" question="What just happened?" flash={flash} tag={`${feed.length} RECENT`}>
      {feed.length === 0 ? (
        <Empty>
          NO EVENTS IN THE STORE
          <small>{state.errors.find((e) => e.includes("Store")) ?? "jobs report with scripts/wall-event.mjs; the site's signup function can post here too"}</small>
        </Empty>
      ) : (
        <ol className="feed">
          {feed.map((e) => {
            const id = "event:" + e.id;
            const opened = open === id;
            const tone = e.kind === "fail" ? "rd" : e.kind === "signup" || e.kind === "publish" ? "g" : e.kind === "decision" || e.kind === "note" ? "am" : "";
            return (
              <li key={e.id} className={opened ? "open" : ""} onClick={() => !wall && setOpen(opened ? null : id)}>
                <span className="ts">{clock(e.ts, state.day)}</span>
                <span className={`tx ${tone}`}>{words(e)}</span>
                {e.cost ? <span className="cost">EUR {e.cost.toFixed(2)}</span> : null}
                {opened && <Evidence data={e} />}
              </li>
            );
          })}
        </ol>
      )}
    </Pane>
  );
}
