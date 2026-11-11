/**
 * The stage: everything on screen follows the narration (see narration.ts).
 *   <Narration script vo>   wraps a reel: builds the timeline, plays each line's audio at its
 *                           real moment, draws the caption chunk being spoken, provides cues
 *   useNarration()          { frame, tl, at(cue), since(cue) } — since() is negative until the cue
 *   <Enter cue exit>        shows its children from one cue to another, with a quiet rise-in and
 *                           fade-out, so one thing arrives at a time and leaves before the next
 *   <Captions>              the typeset caption: Inter, centred, 2–6 words, key word in Bodoni
 *                           italic in the line's accent colour, inside the Instagram safe area
 *   <Stat>                  a Bodoni figure with a small-caps label (the HUD numbers)
 *   <Tag>                   a small letter-spaced pill (FOLD, RAISE, BTN)
 *   <SeatRing>              the table seen from above: six seat tags on an ellipse, one lit
 *   <Ledger>                two or three lines of signed big-blind amounts
 */

import { createContext, ReactNode, useContext, useMemo } from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Frame } from "./components";
import { buildTimeline, Script, Timeline } from "./narration";
import { C, SAFE, SANS, SERIF } from "./theme";
import type { VoManifest } from "./vo";

const Ctx = createContext<Timeline | null>(null);

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);

export function useNarration() {
  const tl = useContext(Ctx);
  if (!tl) throw new Error("useNarration outside <Narration>");
  const frame = useCurrentFrame();
  const at = (cue: string) => {
    const f = tl.cues[cue];
    if (f === undefined) throw new Error(`unknown cue "${cue}"`);
    return f;
  };
  return { tl, frame, at, since: (cue: string) => frame - at(cue) };
}

export function timelineFor(script: Script, vo: VoManifest | null) {
  return buildTimeline(script, vo?.takes?.length ? vo : null);
}

export function Narration({ script, vo, children }: { script: Script; vo: VoManifest | null; children: ReactNode }) {
  const tl = useMemo(() => timelineFor(script, vo), [script, vo]);
  return (
    <Ctx.Provider value={tl}>
      <Frame>
        <AbsoluteFill>{children}</AbsoluteFill>
        <Captions />
        {tl.takes.map(
          (tk) =>
            tk.file && (
              <Sequence key={tk.name} from={tk.start} durationInFrames={tk.end - tk.start + 2}>
                <Audio src={staticFile(tk.file)} />
              </Sequence>
            ),
        )}
      </Frame>
    </Ctx.Provider>
  );
}

const ACCENT = { brass: C.brass, sage: C.sage, vermilion: C.vermilion } as const;

export function Captions({ size = 56 }: { size?: number }) {
  const { tl, frame } = useNarration();
  const chunk = tl.chunks.find((c) => frame >= c.start && frame < c.end);
  if (!chunk) return null;
  const accent = ACCENT[chunk.accent];
  const out = clamp01((chunk.end - frame) / 3);
  return (
    <div style={{ position: "absolute", left: 100, right: SAFE.right + 40, bottom: SAFE.bottom, textAlign: "center", opacity: out }}>
      <div style={{ width: 54, height: 1, background: accent, margin: "0 auto 26px", opacity: 0.9 }} />
      <div style={{ fontFamily: SANS, fontSize: size, fontWeight: 500, lineHeight: 1.25, color: C.paper, letterSpacing: "-0.005em" }}>
        {chunk.words.map((w, i) => {
          const t = ease((frame - w.start) / 6);
          return (
            <span key={i} style={{ display: "inline-block", opacity: t, transform: `translateY(${(1 - t) * 10}px)`, marginRight: "0.28em" }}>
              {w.key ? (
                <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: size * 1.5, lineHeight: 0.8, color: accent, verticalAlign: "-0.06em" }}>{w.text}</span>
              ) : (
                w.text
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Children exist from cue `cue` until cue `exit` (or forever). Entrance: rise 24px + fade over
 * `dur` frames (`delay` frames after the cue). Exit: fade + slight drift over 8 frames.
 */
export function Enter({
  cue,
  exit,
  delay = 0,
  dur = 12,
  motion = "rise",
  style,
  children,
}: {
  cue: string;
  exit?: string;
  delay?: number;
  dur?: number;
  motion?: "rise" | "fade" | "scale" | "stamp";
  style?: React.CSSProperties;
  children: ReactNode;
}) {
  const { frame, at } = useNarration();
  const start = at(cue) + delay;
  const end = exit ? at(exit) : Infinity;
  if (frame < start || frame >= end + 8) return null;
  const tIn = dur <= 1 ? 1 : ease((frame - start) / dur);
  const tOut = clamp01((frame - end) / 8);
  const transform =
    motion === "rise"
      ? `translateY(${(1 - tIn) * 24 - tOut * 14}px)`
      : motion === "scale"
        ? `scale(${0.94 + 0.06 * tIn})`
        : motion === "stamp" // lands: slightly big, settles to size (for a number that hits)
          ? `scale(${1.18 - 0.18 * tIn})`
          : undefined;
  return <div style={{ position: "absolute", opacity: tIn * (1 - tOut), transform, ...style }}>{children}</div>;
}

/**
 * An object that stays on stage across scenes and travels between poses on cues: the number
 * stamped in the hook docks into the HUD, the cards shrink into a corner while the next scene
 * plays, the grid flies into the row of the table it becomes. `keys[0]` is where it appears;
 * each later key is a pose it eases to over `dur` frames from that cue. `cx` is the centre x,
 * `top` the top edge at scale 1 (scaling is about the top centre).
 */
export interface MoveKey {
  cue: string;
  top: number;
  cx: number;
  scale?: number;
  delay?: number;
  opacity?: number;
}

export function Move({ keys, width, exit, exitDelay = 0, dur = 14, style, children }: { keys: MoveKey[]; width: number; exit?: string; exitDelay?: number; dur?: number; style?: React.CSSProperties; children: ReactNode }) {
  const { frame, at } = useNarration();
  const start = at(keys[0].cue) + (keys[0].delay ?? 0);
  const end = exit ? at(exit) + exitDelay : Infinity;
  if (frame < start || frame >= end + 8) return null;
  let pose = { top: keys[0].top, cx: keys[0].cx, scale: keys[0].scale ?? 1, opacity: keys[0].opacity ?? 1 };
  for (let i = 1; i < keys.length; i++) {
    const t0 = at(keys[i].cue) + (keys[i].delay ?? 0);
    if (frame < t0) break;
    const t = ease((frame - t0) / dur);
    const next = { top: keys[i].top, cx: keys[i].cx, scale: keys[i].scale ?? 1, opacity: keys[i].opacity ?? 1 };
    pose = {
      top: pose.top + (next.top - pose.top) * t,
      cx: pose.cx + (next.cx - pose.cx) * t,
      scale: pose.scale + (next.scale - pose.scale) * t,
      opacity: pose.opacity + (next.opacity - pose.opacity) * t,
    };
  }
  const tIn = ease((frame - start) / 12);
  const tOut = clamp01((frame - end) / 8);
  return (
    <div style={{ position: "absolute", top: pose.top + (1 - tIn) * 24, left: pose.cx - width / 2, width, transform: `scale(${pose.scale})`, transformOrigin: "top center", opacity: tIn * (1 - tOut) * pose.opacity, ...style }}>
      {children}
    </div>
  );
}

export function Stat({ value, label, color = C.paper, size = 112, align = "left", style }: { value: string; label: string; color?: string; size?: number; align?: "left" | "center" | "right"; style?: React.CSSProperties }) {
  return (
    <div style={{ textAlign: align, ...style }}>
      <div style={{ fontFamily: SERIF, fontSize: size, lineHeight: 0.9, color, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontFamily: SANS, fontSize: 26, letterSpacing: "0.28em", color: C.text3, fontWeight: 500, marginTop: 14 }}>{label}</div>
    </div>
  );
}

export function Tag({ text, color = C.paper, fill = false, size = 28, style }: { text: string; color?: string; fill?: boolean; size?: number; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        display: "inline-block",
        padding: `${size * 0.5}px ${size * 0.9}px`,
        border: `1px solid ${color}`,
        background: fill ? color : "transparent",
        color: fill ? C.ink : color,
        fontFamily: SANS,
        fontSize: size,
        fontWeight: 600,
        letterSpacing: "0.26em",
        lineHeight: 1,
        ...style,
      }}
    >
      {text}
    </div>
  );
}

const SEATS = ["UTG", "MP", "CO", "BTN", "SB", "BB"] as const;

/** Six seats around an ellipse, clockwise from the top. `lit` seats are filled; `you` gets a label. */
export function SeatRing({ lit = [], you, color = C.sage, width = 840, height = 470 }: { lit?: string[]; you?: string; color?: string; width?: number; height?: number }) {
  const rx = width / 2 - 90;
  const ry = height / 2 - 60;
  return (
    <div style={{ position: "relative", width, height }}>
      <div style={{ position: "absolute", left: width / 2 - rx, top: height / 2 - ry, width: rx * 2, height: ry * 2, borderRadius: "50%", border: `1px solid ${C.ruleStrong}` }} />
      {SEATS.map((s, i) => {
        const a = Math.PI / 2 + ((i - 3) * Math.PI * 2) / SEATS.length; // UTG at the top, BTN at the bottom, clockwise
        const x = width / 2 + Math.cos(a) * rx;
        const y = height / 2 + Math.sin(a) * ry;
        const on = lit.includes(s);
        return (
          <div key={s} style={{ position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)", textAlign: "center" }}>
            <Tag text={s} color={on ? color : C.text3} fill={on} size={32} />
            {you === s && <div style={{ fontFamily: SANS, fontSize: 24, letterSpacing: "0.26em", color, marginTop: 12, fontWeight: 600 }}>YOU</div>}
          </div>
        );
      })}
    </div>
  );
}

export function Ledger({ rows, size = 72 }: { rows: { amount: string; label: string; color: string }[]; size?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 28 }}>
          <span style={{ fontFamily: SERIF, fontSize: size, lineHeight: 1, color: r.color, minWidth: 260, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.amount}</span>
          <span style={{ fontFamily: SANS, fontSize: 26, letterSpacing: "0.26em", color: C.text3, fontWeight: 500 }}>{r.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Interpolate 0→1 over `dur` frames from a cue (negative before). */
export function progress(since: number, dur: number) {
  return interpolate(since, [0, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}
