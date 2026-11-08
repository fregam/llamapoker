/**
 * Building blocks shared by every reel, all in the brand style (brand/README.md):
 *   <Frame>     ink background, hairline border, small "LLAMAPOKER" kicker at the top
 *   <PlayingCard> cream card face with corner rank and a big suit pip (red suits in vermilion)
 *   <Caption>   the word-by-word subtitle box at the bottom; `hl` words are highlighted
 *   <BigNumber> a Bodoni figure with a small caps label, for the number that proves the point
 *   <Bar>       a labelled horizontal bar that fills to a percentage
 *   pop() / fadeUp() helpers for entrance animations.
 */

import { ReactNode } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, SANS, SERIF } from "./theme";

export function pop(frame: number, fps: number, delay = 0) {
  return spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 140 } });
}

export function fadeUp(frame: number, delay = 0, dur = 12) {
  const t = interpolate(frame, [delay, delay + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return { opacity: t, transform: `translateY(${(1 - t) * 30}px)` };
}

export function Frame({ children }: { children: ReactNode }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: C.ink, color: C.paper, fontFamily: SANS, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 36, border: `1px solid ${C.rule}` }} />
      <div
        style={{
          position: "absolute",
          top: 84,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 26,
          letterSpacing: "0.32em",
          color: C.text3,
          fontWeight: 500,
        }}
      >
        LLAMAPOKER
      </div>
      {children}
    </div>
  );
}

const SUITS: Record<string, { glyph: string; red: boolean }> = {
  h: { glyph: "♥", red: true },
  d: { glyph: "♦", red: true },
  s: { glyph: "♠", red: false },
  c: { glyph: "♣", red: false },
};

export function PlayingCard({ card, size = 1, style }: { card: string; size?: number; style?: React.CSSProperties }) {
  const rank = card.slice(0, -1).replace("T", "10");
  const s = SUITS[card.slice(-1)];
  const w = 150 * size;
  const color = s.red ? C.vermilion : C.ink;
  return (
    <div
      style={{
        width: w,
        height: w * 1.4,
        background: C.paper,
        borderRadius: 12 * size,
        position: "relative",
        boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
        color,
        fontFamily: SERIF,
        ...style,
      }}
    >
      <div style={{ position: "absolute", top: 10 * size, left: 14 * size, fontSize: 44 * size, lineHeight: 1 }}>{rank}</div>
      <div style={{ position: "absolute", bottom: 8 * size, right: 14 * size, fontSize: 70 * size, lineHeight: 1 }}>{s.glyph}</div>
    </div>
  );
}

/** Subtitle box: words appear one by one across `dur` frames; words in `hl` get the accent colour. */
export function Caption({ text, hl = [], accent = C.sage, start = 0, dur = 30 }: { text: string; hl?: string[]; accent?: string; start?: number; dur?: number }) {
  const frame = useCurrentFrame();
  const words = text.split(" ");
  const shown = Math.max(1, Math.ceil(interpolate(frame, [start, start + dur], [0, words.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })));
  const clean = (w: string) => w.replace(/[.,?!:]/g, "").toLowerCase();
  return (
    <div style={{ position: "absolute", left: 90, right: 90, bottom: 250, display: "flex", justifyContent: "center", opacity: frame < start ? 0 : 1 }}>
      <div
        style={{
          background: "rgba(17,17,19,0.92)",
          border: `1px solid ${C.ruleStrong}`,
          padding: "26px 40px",
          fontSize: 50,
          fontWeight: 600,
          lineHeight: 1.25,
          textAlign: "center",
          color: C.paper,
        }}
      >
        {words.map((w, i) => (
          <span key={i} style={{ opacity: i < shown ? 1 : 0, color: hl.includes(clean(w)) ? accent : undefined }}>
            {w}{" "}
          </span>
        ))}
      </div>
    </div>
  );
}

export function BigNumber({ value, label, color = C.paper, style }: { value: string; label: string; color?: string; style?: React.CSSProperties }) {
  return (
    <div style={{ textAlign: "center", ...style }}>
      <div style={{ fontSize: 30, letterSpacing: "0.28em", color: C.text3, fontWeight: 500, marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: SERIF, fontSize: 260, lineHeight: 0.9, color }}>{value}</div>
    </div>
  );
}

export function Bar({ label, pct, color, progress }: { label: string; pct: number; color: string; progress: number }) {
  return (
    <div style={{ width: 840 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 34, marginBottom: 14, color: C.text2 }}>
        <span style={{ letterSpacing: "0.2em", fontWeight: 500 }}>{label}</span>
        <span style={{ fontFamily: SERIF, fontSize: 56, color }}>{Math.round(pct * progress)}%</span>
      </div>
      <div style={{ height: 34, background: C.ink2, border: `1px solid ${C.rule}` }}>
        <div style={{ height: "100%", width: `${pct * progress}%`, background: color }} />
      </div>
    </div>
  );
}

export function useT() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return { frame, fps };
}
