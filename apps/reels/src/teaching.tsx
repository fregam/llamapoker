/**
 * The teaching layer: code-drawn graphics that show exactly what the narration says, with
 * numbers from the website's poker engine (../web/src/poker/). All in the brand style.
 *   <Engraving>  a library engraving (cream on black) composited onto ink with screen blending,
 *                so the black vanishes and only the cream lines remain; optional edge fade
 *   <RangeGrid>  the 13×13 starting-hand grid; `lit` cells light up in order as `progress` grows
 *   <Counter>    a Bodoni number that ticks from 0 to `to` as `progress` grows
 *   <ChipStack>  an SVG stack of chips; `count` chips, drawn from the bottom up
 *   <Seat>       an opponent's two face-down cards that can flip to a FOLD label
 *   <DotRow>     one dot per hand, filled up to `filled`; the `mark` index is drawn in brass
 */

import { Img, interpolate, staticFile } from "remotion";
import { GRID_RANKS, gridLabel } from "../../web/src/poker/ranges";
import { C, SANS, SERIF } from "./theme";

export function Engraving({
  file,
  style,
  fade = 0,
}: {
  file: string;
  style?: React.CSSProperties;
  /** 0–1: how far from the edges the image fades to nothing (0 = hard edges). */
  fade?: number;
}) {
  const mask =
    fade > 0
      ? `radial-gradient(ellipse at center, #000 ${Math.round((1 - fade) * 100)}%, transparent 100%)`
      : undefined;
  return (
    <Img
      src={staticFile(`library/${file}`)}
      style={{
        mixBlendMode: "screen",
        WebkitMaskImage: mask,
        maskImage: mask,
        objectFit: "cover",
        ...style,
      }}
    />
  );
}

/** Cell order for lighting up: strongest hands first (pairs, then by distance from the top-left). */
export function gridOrder(): string[] {
  const cells: { label: string; key: number }[] = [];
  for (let r = 0; r < 13; r++) {
    for (let c = 0; c < 13; c++) {
      const label = gridLabel(r, c);
      const pair = r === c ? 0 : 1;
      cells.push({ label, key: pair * 100 + Math.max(r, c) * 13 + Math.min(r, c) });
    }
  }
  return cells.sort((a, b) => a.key - b.key).map((x) => x.label);
}
const ORDER = gridOrder();

export function RangeGrid({
  lit,
  progress = 1,
  color = C.sage,
  cell = 64,
  dim = false,
  ghost,
  hot,
  style,
}: {
  lit: Set<string>;
  progress?: number;
  color?: string;
  cell?: number;
  /** Draw unlit cells almost invisible (for a quiet background grid). */
  dim?: boolean;
  /** 0–1: fade the unlit cells from readable to ghosted (animated version of `dim`). */
  ghost?: number;
  /** Cells drawn in paper for a moment, to point at a group ("suited connectors"). */
  hot?: Set<string>;
  style?: React.CSSProperties;
}) {
  const litList = ORDER.filter((l) => lit.has(l));
  const shown = new Set(litList.slice(0, Math.round(litList.length * progress)));
  const g = ghost ?? (dim ? 1 : 0);
  const unlitText = `rgba(145,140,131,${1 - 0.65 * g})`;
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(13, ${cell}px)`, gap: 3, ...style }}>
      {GRID_RANKS.map((_, r) =>
        GRID_RANKS.map((__, c) => {
          const label = gridLabel(r, c);
          const on = shown.has(label);
          const isHot = on && hot?.has(label);
          return (
            <div
              key={label}
              style={{
                width: cell,
                height: cell,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: SANS,
                fontWeight: on ? 600 : 400,
                fontSize: cell * 0.3,
                background: isHot ? C.paper : on ? color : C.ink2,
                color: on ? C.ink : unlitText,
                border: `1px solid ${isHot ? C.paper : on ? color : C.rule}`,
                transform: on ? "scale(1)" : "scale(0.97)",
              }}
            >
              {label}
            </div>
          );
        }),
      )}
    </div>
  );
}

export function Counter({ to, progress, label, color = C.paper, size = 220, style }: { to: number; progress: number; label: string; color?: string; size?: number; style?: React.CSSProperties }) {
  const n = Math.round(interpolate(progress, [0, 1], [0, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return (
    <div style={{ textAlign: "center", ...style }}>
      <div style={{ fontFamily: SERIF, fontSize: size, lineHeight: 0.9, color, fontVariantNumeric: "tabular-nums" }}>{n}</div>
      <div style={{ fontSize: 30, letterSpacing: "0.28em", color: C.text3, fontWeight: 500, marginTop: 18 }}>{label}</div>
    </div>
  );
}

export function ChipStack({ count, max = 40, color = C.paper, width = 130, style }: { count: number; max?: number; color?: string; width?: number; style?: React.CSSProperties }) {
  const h = 10;
  const stackH = max * h + 24;
  return (
    <svg width={width} height={stackH} viewBox={`0 0 ${width} ${stackH}`} style={style}>
      {Array.from({ length: Math.max(0, Math.round(count)) }).map((_, i) => {
        const y = stackH - 14 - i * h;
        return (
          <g key={i}>
            <ellipse cx={width / 2} cy={y} rx={width / 2 - 4} ry={11} fill={C.ink} stroke={color} strokeWidth={2} />
            <path d={`M ${width / 2 - 36} ${y - 10} h 18 M ${width / 2 + 18} ${y - 10} h 18`} stroke={color} strokeWidth={3} />
          </g>
        );
      })}
    </svg>
  );
}

export function Seat({ name, folded, delay = 0, frame }: { name: string; folded: boolean; delay?: number; frame: number }) {
  const t = interpolate(frame - delay, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const flip = folded ? t : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      <div style={{ position: "relative", width: 150, height: 110 }}>
        {[0, 1].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: i * 54,
              top: 0,
              width: 78,
              height: 110,
              borderRadius: 8,
              background: C.ink2,
              border: `1px solid ${C.ruleStrong}`,
              backgroundImage: `repeating-linear-gradient(45deg, ${C.rule} 0 2px, transparent 2px 9px)`,
              transform: `rotate(${i ? 8 : -6}deg) translateY(${flip * 40}px) rotateX(${flip * 90}deg)`,
              opacity: 1 - flip * 0.85,
            }}
          />
        ))}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 56, color: C.vermilion, opacity: flip, letterSpacing: "0.02em" }}>Fold</div>
      </div>
      <div style={{ fontSize: 26, letterSpacing: "0.24em", color: C.text3, fontWeight: 500 }}>{name}</div>
    </div>
  );
}

export function DotRow({ total, filled, mark, style }: { total: number; filled: number; mark?: number; style?: React.CSSProperties }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", ...style }}>
      {Array.from({ length: total }).map((_, i) => {
        const on = i < filled;
        const isMark = i === mark;
        return (
          <div
            key={i}
            style={{
              width: isMark ? 30 : 22,
              height: isMark ? 42 : 30,
              borderRadius: 4,
              background: isMark ? (on ? C.brass : C.ink2) : on ? C.text3 : C.ink2,
              border: `1px solid ${isMark ? C.brass : C.rule}`,
              opacity: on ? 1 : 0.7,
            }}
          />
        );
      })}
    </div>
  );
}
