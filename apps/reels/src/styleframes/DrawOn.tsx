/**
 * Style frame 3 (research round 4): the hook draws itself like an engraver at work. Each headline
 * letter is traced in a fine cream stroke, then fills with engraved hatching, then settles to
 * solid; each card is outlined, hatched, filled, and its rank and suit are drawn last. Real Bodoni
 * outlines (scripts/glyph-paths.py), so the type is exactly the brand's.
 */

import { useCurrentFrame } from "remotion";
import { C } from "../theme";
import glyphs from "./glyphs.json";

type Laid = { glyphs: { ch: string; d: string; x: number; w: number }[]; width: number; unitsPerEm: number; ascender: number };
const G = glyphs as unknown as Record<string, Laid>;

const clamp = (x: number) => Math.max(0, Math.min(1, x));
const outCubic = (x: number) => 1 - Math.pow(1 - clamp(x), 3);

const SPADE = "M50 5 C30 30 5 45 5 62 C5 78 22 86 36 80 C42 77 46 72 48 68 C47 80 42 90 34 95 L66 95 C58 90 53 80 52 68 C54 72 58 77 64 80 C78 86 95 78 95 62 C95 45 70 30 50 5 Z";
const HEART = "M50 92 C20 70 4 52 4 32 C4 16 16 6 30 6 C40 6 47 12 50 20 C53 12 60 6 70 6 C84 6 96 16 96 32 C96 52 80 70 50 92 Z";

/** One shape drawn on: stroke traces (pathLength 1), engraved hatching fills it, then solid. */
function Drawn({ d, f, color, stroke = 1.6, hatchId, scale = 1, trace = 12 }: { d: string; f: number; color: string; stroke?: number; hatchId: string; scale?: number; trace?: number }) {
  const draw = outCubic(f / trace);
  const hatch = clamp((f - trace * 0.6) / 8);
  const solid = clamp((f - trace - 4) / 8);
  if (f < 0) return null;
  return (
    <g>
      <path d={d} fill={`url(#${hatchId})`} opacity={hatch * (1 - solid)} />
      <path d={d} fill={color} opacity={solid} />
      <path d={d} fill="none" stroke={color} strokeWidth={stroke / scale} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} opacity={1 - solid * 0.6} />
    </g>
  );
}

function Hatch({ id, color, spacing = 5, angle = 35, width = 1.1 }: { id: string; color: string; spacing?: number; angle?: number; width?: number }) {
  return (
    <pattern id={id} patternUnits="userSpaceOnUse" width={spacing} height={spacing} patternTransform={`rotate(${angle})`}>
      <line x1={0} y1={0} x2={0} y2={spacing} stroke={color} strokeWidth={width} />
    </pattern>
  );
}

/** A line of type centred at y (top of the em box), drawn letter by letter from frame `at`. */
function TypeLine({ spec, size, y, at, stagger, frame }: { spec: string; size: number; y: number; at: number; stagger: number; frame: number }) {
  const L = G[spec];
  const s = size / L.unitsPerEm;
  const x0 = 540 - (L.width * s) / 2;
  return (
    <g transform={`translate(${x0} ${y}) scale(${s})`}>
      {L.glyphs.map((g, i) => (
        <Drawn key={i} d={g.d} f={frame - at - i * stagger} color={C.paper} hatchId="hatch-paper-type" scale={s} stroke={1.4} trace={14} />
      ))}
    </g>
  );
}

function Card({ x, y, at, frame, suit, red }: { x: number; y: number; at: number; frame: number; suit: string; red: boolean }) {
  const w = 150;
  const h = 210;
  const f = frame - at;
  const ink = red ? C.vermilion : C.ink;
  const outline = `M${12} 0 H${w - 12} Q${w} 0 ${w} 12 V${h - 12} Q${w} ${h} ${w - 12} ${h} H12 Q0 ${h} 0 ${h - 12} V12 Q0 0 12 0 Z`;
  const A = G["A"];
  const rs = 44 / A.unitsPerEm;
  return (
    <g transform={`translate(${x} ${y})`}>
      <Drawn d={outline} f={f} color={C.paper} hatchId="hatch-paper-card" trace={12} />
      <g transform={`translate(14 ${10 - (A.ascender - A.unitsPerEm * 0.72) * rs}) scale(${rs})`}>
        <Drawn d={A.glyphs[0].d} f={f - 18} color={ink} hatchId={red ? "hatch-red" : "hatch-ink"} scale={rs} trace={10} stroke={1.2} />
      </g>
      <g transform={`translate(${w - 14 - 62} ${h - 8 - 62}) scale(0.62)`}>
        <Drawn d={suit} f={f - 22} color={ink} hatchId={red ? "hatch-red" : "hatch-ink"} scale={0.62} trace={12} stroke={1.4} />
      </g>
    </g>
  );
}

export function DrawOn() {
  const frame = useCurrentFrame();
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
      <defs>
        <Hatch id="hatch-paper-type" color={C.paper} spacing={36} width={9} />
        <Hatch id="hatch-paper-card" color={C.paper} spacing={6} width={1.4} angle={-40} />
        <Hatch id="hatch-ink" color={C.ink} spacing={40} width={10} angle={-40} />
        <Hatch id="hatch-red" color={C.vermilion} spacing={40} width={10} angle={-40} />
      </defs>
      {/* the headline, as set in the 2D hook: Bodoni 118, line height 0.95, top 390 */}
      <TypeLine spec="Only playing" size={118} y={360} at={0} stagger={2} frame={frame} />
      <TypeLine spec="aces?|italic" size={118} y={360 + 112} at={16} stagger={3} frame={frame} />
      {/* the two aces where the 2D hook deals them (top 650, centred, gap 22) */}
      <Card x={540 - 11 - 150} y={650} at={2} frame={frame} suit={SPADE} red={false} />
      <Card x={540 + 11} y={650} at={6} frame={frame} suit={HEART} red />
    </svg>
  );
}
