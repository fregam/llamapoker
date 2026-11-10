/**
 * Voice-over timing. Each reel has a manifest in src/vo/<id>.json, written by
 * `node scripts/vo-manifest.mjs <id>` from the audio files in public/vo/<id>/<n>.wav:
 *   { "voice": "...", "lines": [{ "file": "vo/<id>/1.wav", "seconds": 5.2 }, ...] }
 * A beat lasts as long as its line plus a breath, but never less than its graphics need.
 */

import { FPS } from "./theme";

export interface VoManifest {
  voice: string;
  lines: { file: string; seconds: number }[];
}

export const BREATH = 18; // frames of silence after each line

/** Beat durations in frames from a manifest and the graphics' minimum lengths. */
export function beatDurations(vo: VoManifest | null, minimums: number[]): number[] {
  return minimums.map((min, i) => {
    const line = vo?.lines[i];
    return line ? Math.max(min, Math.ceil(line.seconds * FPS) + BREATH) : min;
  });
}

export function beatStarts(durations: number[]): number[] {
  const out: number[] = [];
  let t = 0;
  for (const d of durations) {
    out.push(t);
    t += d;
  }
  return out;
}
