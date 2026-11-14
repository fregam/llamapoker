/**
 * Results: "how are we doing?". The money hero (revenue, the north star; a dash with its reason
 * until a revenue source exists), subscribers beside it as the leading number, then one row per
 * channel in one shape: the Newsletter from Beehiiv, any other channel from its `followers` /
 * `post` events (spec: .scratch/wall-layout/spec.md, decisions 2, 3, 8). A row opens in place
 * into its evidence. Snapshots stored before this layout have no `results`: they say so.
 */
import type { ChannelRow } from "../model";
import { Pane, Seg, Evidence, Empty, signed } from "../components/ui";
import type { PanelProps } from "./registry";

export function Results({ state, open, setOpen, wall, flash, phone }: PanelProps) {
  const r = state.results;
  if (!r) {
    return (
      <Pane id="results" title="RESULTS" question="How are we doing?" flash={flash} tag={`SNAPSHOT ${state.day}`}>
        <Empty>
          NO RESULTS IN THIS SNAPSHOT
          <small>stored before the results-first layout; today's reading has them</small>
        </Empty>
      </Pane>
    );
  }
  const m = r.money;
  return (
    <Pane id="results" title="RESULTS" question="How are we doing?" flash={flash} tag={state.live ? "LIVE" : `SNAPSHOT ${state.day}`}>
      <div className="hero">
        <div className="money">
          <Seg value={m.month} digits={6} className="huge" fit />
          <div className="under">
            REVENUE · {m.unit} · 30 DAYS
            {m.month === null ? <span className="note"> · {m.note.toUpperCase()}</span> : <span className="note"> · TODAY {m.today ?? "--"}</span>}
          </div>
        </div>
        <div className="lead">
          <div className="k">LEADING · SUBSCRIBERS</div>
          <Seg value={r.subscribers} digits={5} className="mid" />
          <div className="ds">
            <span>
              <b>24 H</b> {signed(r.delta1)}
            </span>
            <span>
              <b>7 D</b> {signed(r.delta7)}
            </span>
          </div>
        </div>
      </div>
      <ul className="rows">
        {(phone ? r.rows.filter((row) => row.channel === "newsletter") : r.rows).map((row) => (
          <Row key={row.channel} row={row} opened={open === "row:" + row.channel} toggle={() => !wall && setOpen(open === "row:" + row.channel ? null : "row:" + row.channel)} />
        ))}
      </ul>
    </Pane>
  );
}

const EXTRA_LABEL: Record<string, string> = { signupsToday: "SIGNUPS TODAY", lastLetter: "LAST LETTER", sends: "LETTERS SENT", cameFrom: "NEW FROM · 7 D" };

function Row({ row, opened, toggle }: { row: ChannelRow; opened: boolean; toggle: () => void }) {
  const p = row.latestPost;
  const extras = Object.entries(row.extra);
  return (
    <li className={`crow${opened ? " open" : ""}`} onClick={toggle}>
      <div className="a">
        <span className="k">{row.name}</span>
        <span className="v">{row.headline ?? "--"}</span>
        <span className="u">{row.unit.toUpperCase()}</span>
        <span className="d">
          <b>24 H</b> {signed(row.delta1)}
        </span>
        <span className="d">
          <b>7 D</b> {signed(row.delta7)}
        </span>
        <Spark values={row.spark} />
      </div>
      <div className="b">
        {p ? (
          <span>
            <b>LATEST</b> {p.subject}
            {[p.views !== null && `${p.views} views`, p.likes !== null && `${p.likes} likes`, p.saves !== null && `${p.saves} saves`, p.comments !== null && `${p.comments} comments`]
              .filter(Boolean)
              .map((x) => ` · ${x}`)}
          </span>
        ) : null}
        {extras.map(([k, v]) => (
          <span key={k}>
            <b>{EXTRA_LABEL[k] ?? k.toUpperCase()}</b> {v ?? "--"}
          </span>
        ))}
        <span className="faint">{row.note}</span>
      </div>
      {opened && <Evidence data={row} />}
    </li>
  );
}

/** The headline at the end of each of the last 30 days; a flat note when there are fewer than two. */
function Spark({ values }: { values: number[] }) {
  if (values.length < 2) return <span className="spark-none">{values.length ? "1 DAY" : "NO TREND"}</span>;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${28 - ((v - min) / span) * 24}`).join(" ");
  return (
    <svg className="spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-label="last 30 days">
      <polyline points={pts} />
    </svg>
  );
}
