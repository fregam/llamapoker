/**
 * <TableDiagram> — an SVG 6-max table: the six seats around an oval, the dealer button
 * on the BTN, and each seat's place in the order of action, either preflop (UTG first,
 * BB last) or after the flop (SB first, BTN last). `highlight` marks one seat.
 * Drawn with hairlines in the site's palette; text is real SVG text, so it scales.
 * Used by: views/Positions.tsx.
 */

const SEATS = ["BTN", "SB", "BB", "UTG", "MP", "CO"]; // clockwise from the bottom
const PRE = ["UTG", "MP", "CO", "BTN", "SB", "BB"];
const POST = ["SB", "BB", "UTG", "MP", "CO", "BTN"];

export function TableDiagram({ order = "preflop", highlight }: { order?: "preflop" | "postflop"; highlight?: string }) {
  const W = 520;
  const H = 344;
  const cx = W / 2;
  const cy = H / 2;
  const rx = 170;
  const ry = 92;
  const seq = order === "preflop" ? PRE : POST;
  // Seat angles, clockwise starting at the bottom (BTN).
  const angles = [90, 150, 210, 270, 330, 30].map((d) => (d * Math.PI) / 180);

  return (
    <svg className="table-diagram" viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label={`A six-handed poker table. Order of action ${order}: ${seq.join(", ")}.`}>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} className="td-felt" />
      <ellipse cx={cx} cy={cy} rx={rx - 14} ry={ry - 14} className="td-rail" />
      <text x={cx} y={cy - 6} className="td-center">
        {order === "preflop" ? "Before the flop" : "After the flop"}
      </text>
      <text x={cx} y={cy + 14} className="td-center-sub">
        numbers = order of action
      </text>
      {SEATS.map((s, i) => {
        const a = angles[i];
        const x = cx + (rx + 46) * Math.cos(a);
        const y = cy + (ry + 30) * Math.sin(a);
        // Seats on the top half get their label above, so it never crosses the table.
        const labelY = Math.sin(a) < -0.1 ? y - 36 : y + 44;
        const n = seq.indexOf(s) + 1;
        const on = highlight === s;
        return (
          <g key={s} className={on ? "td-seat td-on" : "td-seat"}>
            <circle cx={x} cy={y} r={27} />
            <text x={x} y={y + 1} className="td-seat-label">
              {s}
            </text>
            <text x={x} y={labelY} className="td-seat-order">
              {n === 1 ? "acts first" : n === 6 ? "acts last" : `${n}${["", "st", "nd", "rd"][n] ?? "th"}`}
            </text>
          </g>
        );
      })}
      {/* Dealer button, in front of the BTN seat */}
      <g className="td-button">
        <circle cx={cx + 40} cy={cy + ry - 22} r={11} />
        <text x={cx + 40} y={cy + ry - 21}>
          D
        </text>
      </g>
    </svg>
  );
}
