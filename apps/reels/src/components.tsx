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
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  // Stills have one frame: no reading line there.
  const read = durationInFrames > 1 ? interpolate(frame, [0, durationInFrames - 1], [0, 100], { extrapolateRight: "clamp" }) : 0;
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
      <div style={{ position: "absolute", left: 36, right: 36, bottom: 36, height: 1, background: C.rule }}>
        <div style={{ height: 3, marginTop: -1, width: `${read}%`, background: C.brass }} />
      </div>
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

/**
 * Typeset caption: no box. Words appear one by one from  across  frames, set in
 * Inter on the ink under a short accent rule. Words in  (matched without punctuation) switch
 * to Bodoni italic at display size in the accent colour, with a hairline drawing itself under them.
 */
export function Caption({ text, hl = [], accent = C.sage, start = 0, dur = 30, bottom = 170, size = 54 }: { text: string; hl?: string[]; accent?: string; start?: number; dur?: number; bottom?: number; size?: number }) {
  const frame = useCurrentFrame();
  const words = text.split(" ");
  const per = dur / words.length;
  const clean = (w: string) => w.replace(/[.,?!:;]/g, "").toLowerCase();
  const keys = hl.map(clean);
  return (
    <div style={{ position: "absolute", left: 110, right: 110, bottom, opacity: frame < start ? 0 : 1 }}>
      <div style={{ width: 54, height: 1, background: accent, marginBottom: 26, opacity: 0.9 }} />
      <div style={{ fontSize: size, fontWeight: 500, lineHeight: 1.3, color: C.paper, letterSpacing: "-0.005em" }}>
        {words.map((w, i) => {
          const t = interpolate(frame, [start + i * per, start + i * per + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const key = keys.includes(clean(w));
          const ul = key ? interpolate(frame, [start + i * per + 6, start + i * per + 18], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
          return (
            <span key={i} style={{ display: "inline-block", opacity: t, transform: `translateY(${(1 - t) * 10}px)`, marginRight: "0.28em", position: "relative" }}>
              {key ? <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: size * 1.55, lineHeight: 0.8, color: accent, verticalAlign: "-0.08em" }}>{w}</span> : w}
              {key && <span style={{ position: "absolute", left: 0, bottom: -6, height: 2, width: `${ul}%`, background: accent }} />}
            </span>
          );
        })}
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
