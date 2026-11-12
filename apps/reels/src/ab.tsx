/**
 * A/B variants for the reel craft research (docs/research/2026-11-12-reel-craft-research.md).
 * A reel reads its variant from props; the default is the approved baseline. Each variant changes
 * exactly one thing:
 *   camera   a 2D virtual camera that moves over the stage on cues (upgrade 1)
 *   bedDb    extra gain on the music bed, in dB (upgrade 2: -6)
 *   fxDb     extra gain on every effect, in dB (upgrade 2: -6)
 *   blur     real motion blur on everything that moves (upgrade 5): 5 sub-frames, 180° shutter
 *   drift    never-still holds: while the camera holds, it keeps pushing in slowly (up to 2.5 %) with a
 *            faint wobble (upgrade 3)
 *   shortCaptions  caption chunks of at most 3 words (upgrade 6)
 *   fill     the share fills the grid itself instead of standing beside it (upgrade 7)
 *   sfx      "generated" (MOSS, public/sfx), "recorded" (public/sfx-rec, real foley) or "none"
 *            (silent effects: the render fed to a video-to-audio model, upgrade 16)
 * Winners move into stage.tsx / sound.tsx and this file shrinks back.
 */

import { createContext, useContext, type ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import { clamp01, E, useNarration } from "./stage";

export interface Variant {
  camera?: boolean;
  blur?: boolean;
  drift?: boolean;
  shortCaptions?: boolean;
  fill?: boolean;
  bedDb?: number;
  fxDb?: number;
  sfx?: "generated" | "recorded" | "none";
}

const Ctx = createContext<Variant>({});
export const useVariant = () => useContext(Ctx);
export function VariantProvider({ variant, children }: { variant?: Variant; children: ReactNode }) {
  return <Ctx.Provider value={variant ?? {}}>{children}</Ctx.Provider>;
}

/** The effect file a variant plays, or null when effects are silenced. */
export function useSfxSrc(src: string): string | null {
  const v = useVariant();
  if (v.sfx === "none") return null;
  if (v.sfx === "recorded") return src.replace(/^sfx\//, "sfx-rec/");
  return src;
}

/**
 * A camera pose: the world point (x, y) is shown at screen point (sx, sy), magnified s times.
 * The identity pose is { x: 540, y: 960, s: 1 }. A key moves the camera to its pose starting at
 * its cue (+ delay) over `dur` frames: "push" decelerates hard (a push-in landing with a number),
 * "travel" is slow-fast-slow (moving between subjects).
 */
export interface CameraKey {
  cue: string;
  delay?: number;
  x: number;
  y: number;
  s: number;
  sx?: number;
  sy?: number;
  dur?: number;
  ease?: "push" | "travel";
}

type Pose = { x: number; y: number; s: number; sx: number; sy: number };
const IDENTITY: Pose = { x: 540, y: 960, s: 1, sx: 540, sy: 960 };

export function Camera({ keys, drift = false, children }: { keys: CameraKey[]; drift?: boolean; children: ReactNode }) {
  const { frame, at } = useNarration();
  const timed = keys.map((k) => ({ ...k, start: at(k.cue) + (k.delay ?? 0) })).sort((a, b) => a.start - b.start);
  let pose: Pose = IDENTITY;
  for (const k of timed) {
    if (frame < k.start) break;
    const target: Pose = { x: k.x, y: k.y, s: k.s, sx: k.sx ?? k.x, sy: k.sy ?? k.y };
    const dur = k.dur ?? 20;
    const p = dur <= 0 ? 1 : clamp01((frame - k.start) / dur);
    const t = k.ease === "push" ? E.outExpo(p) : E.inOutQuint(p);
    const from = pose;
    pose = {
      x: from.x + (target.x - from.x) * t,
      y: from.y + (target.y - from.y) * t,
      s: from.s + (target.s - from.s) * t,
      sx: from.sx + (target.sx - from.sx) * t,
      sy: from.sy + (target.sy - from.sy) * t,
    };
  }
  if (drift) {
    // the latest key that has finished moving: hold time since it landed
    const last = [...timed].reverse().find((k) => frame >= k.start + (k.dur ?? 20));
    const held = last ? frame - (last.start + (last.dur ?? 20)) : frame;
    const ramp = clamp01(held / 12); // ease the drift in after a move lands
    pose = { ...pose, s: pose.s * (1 + Math.min(0.025, held * 0.00025) * ramp) };
    pose.sx += Math.sin(frame / 47) * 3 * ramp;
    pose.sy += Math.sin(frame / 61 + 1) * 2 * ramp;
  }
  const tx = pose.sx - pose.s * pose.x;
  const ty = pose.sy - pose.s * pose.y;
  return (
    <AbsoluteFill style={{ transformOrigin: "0 0", transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${pose.s.toFixed(4)})` }}>
      {children}
    </AbsoluteFill>
  );
}
