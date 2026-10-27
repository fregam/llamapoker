// Lightweight dependency-free SVG/CSS visualizations for the calculations.

import { formatPct } from "../poker/odds";

export interface Segment {
  label: string;
  value: number;
  color: string;
}

/** Donut chart with a value in the middle. Accessible via role=img + aria-label. */
export function Donut({
  segments,
  size = 168,
  thickness = 28,
  center,
  centerSub,
}: {
  segments: Segment[];
  size?: number;
  thickness?: number;
  center: string;
  centerSub?: string;
}) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  const aria = segments.map((s) => `${s.label} ${formatPct(s.value / total)}`).join(", ");

  return (
    <div className="donut-wrap">
      <svg width={size} height={size} role="img" aria-label={`${center}. ${aria}`}>
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1c2b25" strokeWidth={thickness} />
          {segments.map((s) => {
            const frac = s.value / total;
            const dash = frac * circ;
            const el = (
              <circle
                key={s.label}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return el;
          })}
        </g>
        <text x={cx} y={cy - 2} textAnchor="middle" className="donut-center">
          {center}
        </text>
        {centerSub && (
          <text x={cx} y={cy + 18} textAnchor="middle" className="donut-sub">
            {centerSub}
          </text>
        )}
      </svg>
      <ul className="donut-legend">
        {segments.map((s) => (
          <li key={s.label}>
            <span className="legend-dot" style={{ background: s.color }} aria-hidden="true" />
            {s.label}
            <strong>{formatPct(s.value / total)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * A 0–100% meter where your equity fills the bar and a marker shows the
 * break-even threshold. Green when you're above the line, red when below.
 */
export function EquityGauge({
  equity,
  required,
  height = 30,
}: {
  equity: number;
  required: number;
  height?: number;
}) {
  const pass = equity >= required;
  const e = Math.max(0, Math.min(1, equity));
  const t = Math.max(0, Math.min(1, required));
  return (
    <div
      className="gauge"
      role="img"
      aria-label={`Your equity ${formatPct(equity)}; break-even at ${formatPct(
        required
      )}; ${pass ? "above the line, a profitable call" : "below the line, a fold"}.`}
    >
      <div className="gauge-track" style={{ height }}>
        <div
          className={pass ? "gauge-fill gauge-pass" : "gauge-fill gauge-fail"}
          style={{ width: `${e * 100}%` }}
        />
        <div className="gauge-threshold" style={{ left: `${t * 100}%` }}>
          <span className="gauge-flag">break-even {formatPct(required, 0)}</span>
        </div>
      </div>
      <div className="gauge-scale" aria-hidden="true">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>
      <p className={pass ? "gauge-note gauge-note-pass" : "gauge-note gauge-note-fail"}>
        Your equity <strong>{formatPct(equity)}</strong> is {pass ? "above" : "below"} the
        break-even point <strong>{formatPct(required)}</strong> → {pass ? "calling wins money long-term." : "calling loses money long-term."}
      </p>
    </div>
  );
}

/** Visual split of the pot you could win vs the chips you must risk to call. */
export function PotBar({ pot, bet }: { pot: number; bet: number }) {
  const total = pot + bet + bet;
  const winW = ((pot + bet) / total) * 100;
  const riskW = (bet / total) * 100;
  return (
    <div className="potbar" role="img" aria-label={`If you call ${bet}, you risk ${bet} to win ${pot + bet}.`}>
      <div className="potbar-track">
        <div className="potbar-win" style={{ width: `${winW}%` }}>
          win {pot + bet}
        </div>
        <div className="potbar-risk" style={{ width: `${riskW}%` }}>
          risk {bet}
        </div>
      </div>
      <p className="potbar-note">
        You put in <strong>{bet}</strong> to try to win the <strong>{pot + bet}</strong> already
        out there — that's the price the pot is offering you.
      </p>
    </div>
  );
}
