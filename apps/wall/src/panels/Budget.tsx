/**
 * Experiments and budget: each running test with an honest status (including "too early to
 * call"), and the month's spend against the ceiling. Spend is the sum of event costs in the
 * store; the ceiling and the experiments list are flags set from the command bar.
 */
import { Pane, Meter, Empty } from "../components/ui";
import type { PanelProps } from "./registry";

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
