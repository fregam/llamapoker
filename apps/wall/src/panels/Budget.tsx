/**
 * Experiments and budget: each running test with an honest status (including "too early to
 * call"), and the month's spend against the ceiling. Spend is the sum of event costs in the
 * store; the ceiling and the experiments list are flags set from the command bar. Below them, the
 * Claude plan limits (5-hour and weekly) from the status line reporter, so the question "can I
 * start a big session now?" is answered on the same pane as the money.
 */
import { Pane, Meter, Empty } from "../components/ui";
import type { PanelProps } from "./registry";
import type { ClaudeLimits } from "../model";

/** UTC clock time, like the wall's header; the weekday too when it isn't today. */
function when(iso: string): string {
  const time = iso.slice(11, 16) + " UTC";
  if (iso.slice(0, 10) === new Date().toISOString().slice(0, 10)) return time;
  return new Date(iso).toLocaleDateString("en", { weekday: "short", timeZone: "UTC" }).toUpperCase() + " " + time;
}

function Claude({ c }: { c: ClaudeLimits | undefined }) {
  // Older snapshots (time control) have no Claude reading: say so rather than show zeros.
  if (!c) return <div className="claude"><span className="k">CLAUDE</span> <span className="u">NOT RECORDED ON THIS DAY</span></div>;
  return (
    <div className="claude">
      <div className="a">
        <span className="k">CLAUDE LIMITS</span>
        <span className="u">{c.asof ? `AS OF ${when(c.asof)}` : "NO READING YET"}</span>
      </div>
      {c.windows.map((w) => {
        const tone = w.used === null ? "" : w.used >= 100 ? "rd" : w.used >= (w.id === "five_hour" ? 90 : 80) ? "am" : "";
        return (
          <div className={`win ${tone}`} key={w.id}>
            <span className="k">{w.name}</span>
            <span className={`v ${tone}`}>{w.used === null ? "--" : `${Math.round(w.used)}%`}</span>
            <Meter share={(w.used ?? 0) / 100} dim={w.used === null} />
            <span className="u">{w.used === null ? w.note.toUpperCase() : w.resetsAt ? `RESETS ${when(w.resetsAt)}` : ""}</span>
          </div>
        );
      })}
    </div>
  );
}

export function Budget({ state, flash }: PanelProps) {
  const b = state.budget;
  const over = b.ceiling !== null && b.spentMonth > b.ceiling;
  const near = b.ceiling !== null && !over && b.spentMonth > 0.8 * b.ceiling;
  return (
    <Pane
      id="budget"
      title="EXPERIMENTS AND BUDGET"
      question="Is a test ready to call, and is spend inside the ceiling?"
      tone={over ? "red" : near ? "amber" : undefined}
      flash={flash}
      tag={b.month}
    >
      <div className="budget">
        <div className="a">
          <span className="k">SPENT</span>
          <span className={`v ${over ? "rd" : near ? "am" : ""}`}>EUR {b.spentMonth.toFixed(2)}</span>
          <span className="u">{b.ceiling === null ? "NO CEILING SET (command bar: ceiling <eur>)" : `OF ${b.ceiling} CEILING`}</span>
        </div>
        <Meter share={b.ceiling ? b.spentMonth / b.ceiling : 0} dim={!b.ceiling} />
      </div>
      <Claude c={state.claude} />
      {state.experiments.length === 0 ? (
        <Empty>
          NO EXPERIMENT RUNNING
          <small>before/after tests start in Phase 3 of the plan</small>
        </Empty>
      ) : (
        <ul className="experiments">
          {state.experiments.map((x) => (
            <li key={x.id}>
              <span className="k">{x.name}</span>
              <span className="s">{x.status.toUpperCase()}</span>
              <span className="d">
                since {x.started} · {x.detail}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Pane>
  );
}
