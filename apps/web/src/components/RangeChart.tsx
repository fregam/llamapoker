/**
 * <RangeChart> — a read-only 13×13 starting-hand chart (the printable kind). Each layer
 * is a set of hand labels with a CSS class; a cell takes the first layer that contains it
 * (so list the strongest action first, e.g. 3-bet before call). Unlisted hands are folds.
 * Same grid geometry as the editable <RangeGrid>: pairs on the diagonal, suited above,
 * offsuit below.
 * Used by: views/StartingHands.tsx.
 * Uses: poker/ranges (grid labels).
 */

import { GRID_RANKS, gridLabel } from "../poker/ranges";

export interface ChartLayer {
  range: Set<string>;
  className: string;
  label: string;
}

export function RangeChart({ layers, caption }: { layers: ChartLayer[]; caption: string }) {
  return (
    <figure className="range-chart">
      <div className="grid" role="img" aria-label={caption}>
        {GRID_RANKS.map((_, row) => (
          <div className="grid-row" key={row}>
            {GRID_RANKS.map((_, col) => {
              const label = gridLabel(row, col);
              const layer = layers.find((l) => l.range.has(label));
              return (
                <span key={label} className={`grid-cell chart-cell ${layer ? layer.className : "out-range"}`}>
                  {label}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <figcaption className="chart-legend">
        {layers.map((l) => (
          <span key={l.label}>
            <i className={`chart-swatch ${l.className}`} aria-hidden="true" />
            {l.label}
          </span>
        ))}
        <span>
          <i className="chart-swatch out-range" aria-hidden="true" />
          Fold
        </span>
      </figcaption>
    </figure>
  );
}
