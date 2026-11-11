/**
 * Threats: what is going wrong or about to, ranked by weight, each with the fix the Gentleman
 * would apply. Red is a failure, amber waits on the founder, cyan is a note. A threat opens in
 * place into its evidence. On the phone this is the second of the three screens.
 */
import { Pane, Evidence, Empty } from "../components/ui";
import type { PanelProps } from "./registry";

export function Threats({ state, open, setOpen, wall, flash }: PanelProps) {
  const t = state.threats;
  const reds = t.filter((x) => x.level === "red").length;
  return (
    <Pane
      id="threats"
      title="THREATS"
      question="What is going wrong or about to, and what do I do first?"
      tone={reds ? "red" : t.some((x) => x.level === "amber") ? "amber" : undefined}
      flash={flash}
      tag={`${t.length} RANKED · ${reds} RED`}
    >
      {t.length === 0 ? (
        <Empty>NOTHING THREATENS THE OPERATION RIGHT NOW</Empty>
      ) : (
        <ol className="threats">
          {t.map((x, i) => {
            const id = "threat:" + x.id;
            const opened = open === id;
            return (
              <li key={x.id} className={`${x.level}${opened ? " open" : ""}`} onClick={() => !wall && setOpen(opened ? null : id)}>
                <span className="n">{String(i + 1).padStart(2, "0")}</span>
                <span className="lamp" />
                <div className="t">
                  <div className="title">{x.title}</div>
                  <div className="detail">{x.detail}</div>
                  <div className="fix">
                    <b>FIX</b> {x.fix}
                  </div>
                  {opened && <Evidence data={x.evidence ?? { id: x.id, weight: x.weight, level: x.level }} />}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Pane>
  );
}
