/**
 * Threats: what is going wrong or about to, ranked by weight, each with the fix the Gentleman
 * would apply, shown inside Needs you. Red is a failure, amber waits on the founder, cyan is a
 * note. A threat opens in place into its evidence.
 */
import type { Threat } from "../model";
import { Evidence, Empty } from "./ui";

export function ThreatList({ threats: t, open, setOpen, wall }: { threats: Threat[]; open: string | null; setOpen: (id: string | null) => void; wall: boolean }) {
  if (t.length === 0) return <Empty>NOTHING THREATENS THE OPERATION RIGHT NOW</Empty>;
  return (
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
  );
}
