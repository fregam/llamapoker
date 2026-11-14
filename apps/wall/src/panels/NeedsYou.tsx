/**
 * Needs you: "what is going wrong, and what is waiting on me?". Threats (ranked, with the fix)
 * above approvals (cards: call, fold, raise), in one pane beside Results that never shrinks
 * (spec: .scratch/wall-layout/spec.md, decision 5). Red when anything failed, amber when
 * something waits.
 */
import { Pane } from "../components/ui";
import { ThreatList } from "../components/ThreatList";
import { Cards } from "../components/ApprovalCards";
import type { PanelProps } from "./registry";

export function NeedsYou({ state, open, setOpen, act, wall, flash }: PanelProps) {
  const t = state.threats;
  const q = state.queue;
  const reds = t.filter((x) => x.level === "red").length;
  const ambers = t.filter((x) => x.level === "amber").length;
  return (
    <Pane
      id="needs"
      title="NEEDS YOU"
      question="What is going wrong, and what is waiting on me?"
      tone={reds ? "red" : ambers || q.length ? "amber" : undefined}
      flash={flash}
      tag={
        <>
          <span className={reds ? "rd" : ""}>{reds} RED</span> · {t.length} THREATS · <span className={q.length ? "am" : ""}>{q.length} WAITING</span>
        </>
      }
    >
      <div className="needs">
        <section>
          <h3>THREATS</h3>
          <ThreatList threats={t} open={open} setOpen={setOpen} wall={wall} />
        </section>
        <section>
          <h3>APPROVALS</h3>
          <Cards queue={q} day={state.day} open={open} setOpen={setOpen} act={act} wall={wall} />
        </section>
      </div>
    </Pane>
  );
}
