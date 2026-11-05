/**
 * <RangeGrid> — the clickable 13×13 starting-hand grid (pairs on the diagonal, suited
 * above, offsuit below). Click toggles a hand; press and drag paints several.
 * Controlled: takes a Set of labels ("AKs", "QQ") and reports a new Set via onChange.
 * Used by: components/OpponentRanges.
 * Uses: poker/ranges (grid labels, range %).
 */

import { useEffect, useRef } from "react";
import { GRID_RANKS, gridLabel, rangePercent } from "../poker/ranges";

export function RangeGrid({
  range,
  onChange,
}: {
  range: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  // While dragging: true = adding cells, false = removing them.
  const paint = useRef<boolean | null>(null);

  useEffect(() => {
    const stop = () => (paint.current = null);
    window.addEventListener("pointerup", stop);
    return () => window.removeEventListener("pointerup", stop);
  }, []);

  function apply(label: string, add: boolean) {
    if (range.has(label) === add) return;
    const next = new Set(range);
    if (add) next.add(label);
    else next.delete(label);
    onChange(next);
  }

  return (
    <div className="range-editor">
      <div className="grid range-grid" role="group" aria-label="Starting hand grid">
        {GRID_RANKS.map((_, row) => (
          <div className="grid-row" key={row}>
            {GRID_RANKS.map((_, col) => {
              const label = gridLabel(row, col);
              const on = range.has(label);
              const kind = row === col ? "pair" : col > row ? "suited" : "offsuit";
              return (
                <button
                  type="button"
                  key={label}
                  className={`grid-cell grid-btn ${kind} ${on ? "in-range" : "out-range"}`}
                  aria-pressed={on}
                  aria-label={`${label}${on ? ", in range" : ""}`}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    paint.current = !on;
                    apply(label, !on);
                  }}
                  onPointerEnter={() => {
                    if (paint.current !== null) apply(label, paint.current);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      apply(label, !on);
                    }
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="range-foot">
        <span className="range-stat">
          {range.size} hands · {rangePercent(range).toFixed(1)}% of all combos
        </span>
        <button type="button" className="link-btn" onClick={() => onChange(new Set())} disabled={range.size === 0}>
          clear
        </button>
      </div>
    </div>
  );
}
