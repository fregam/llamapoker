/**
 * Narration-first timing. A reel is a script of spoken lines (src/scripts/<id>.json); each line is
 * one voice-over file (public/vo/<id>/<n>.mp3) measured into src/vo/<id>.json by
 * scripts/vo-manifest.mjs. The timeline puts every line at its real length, estimates each word's
 * moment inside the line (by character weight, with extra time at punctuation) and turns the
 * script's markup into caption chunks and stage cues:
 *
 *   "Your plan is simple: | [grid]*queens*, [kk]kings"
 *     |         splits the line into caption chunks (one on screen at a time)
 *     *word*    the chunk's key word (Bodoni italic in the accent colour)
 *     [name]    a cue: the stage reacts the moment this word is spoken (useNarration().since("name"))
 *
 * The text sent to the voice model is spoken(line) — the same string with the markup removed —
 * printed by scripts/vo-lines.mjs so the audio and the captions can never drift apart.
 */

import { FPS } from "./theme";
import type { VoManifest } from "./vo";

export interface ScriptLine {
  /** The line with chunk, key-word and cue markup. */
  t: string;
  /** Silence after the line, in frames (default 9). */
  gap?: number;
  /** Accent colour token for this line's key words: brass (default), sage or vermilion. */
  c?: "brass" | "sage" | "vermilion";
}

export interface Script {
  voice: { engine: string; name: string; voice_id: string };
  lines: ScriptLine[];
}

export interface Word {
  text: string;
  key: boolean;
  start: number;
}

export interface Chunk {
  line: number;
  start: number;
  end: number;
  accent: NonNullable<ScriptLine["c"]>;
  words: Word[];
}

export interface Timeline {
  total: number;
  lines: { start: number; end: number; file?: string }[];
  chunks: Chunk[];
  cues: Record<string, number>;
}

export const LEAD = 10; // frames before the first word
export const TAIL = 24; // frames after the last word (loop breath)
const DEFAULT_GAP = 9;
const WPS = 2.4; // words per second assumed before the audio exists

/** The line as the voice model should read it: markup removed. */
export function spoken(t: string): string {
  return t
    .replace(/\[[^\]]+\]/g, "")
    .replace(/[|*]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Relative time a word takes to say: its letters, plus a pause at punctuation. */
function weight(text: string): number {
  const bare = text.replace(/[^a-z0-9'’]/gi, "");
  let n = Math.max(1, bare.length) + 1;
  if (/[,;:]$/.test(text)) n += 3;
  if (/[.?!]$/.test(text)) n += 6;
  return n;
}

export function buildTimeline(script: Script, vo: VoManifest | null): Timeline {
  const lines: Timeline["lines"] = [];
  const chunks: Chunk[] = [];
  const cues: Record<string, number> = {};
  let t = LEAD;

  script.lines.forEach((ln, i) => {
    const measured = vo?.lines[i];
    const secs = measured ? measured.seconds : spoken(ln.t).split(" ").length / WPS;
    const dur = Math.ceil(secs * FPS);
    const start = t;
    const end = t + dur;
    lines.push({ start, end, file: measured?.file });

    // Tokens with their chunk index, cues, key flag and weight.
    const rawChunks = ln.t.split("|");
    const toks: { chunk: number; cues: string[]; text: string; key: boolean; w: number }[] = [];
    rawChunks.forEach((c, ci) =>
      c
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .forEach((raw) => {
          const cueNames = [...raw.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1]);
          const marked = raw.replace(/\[[^\]]+\]/g, "");
          const text = marked.replace(/\*/g, "");
          toks.push({ chunk: ci, cues: cueNames, text, key: /\*[^*]+\*/.test(marked), w: text ? weight(text) : 0 });
        }),
    );
    const totalW = toks.reduce((a, p) => a + p.w, 0) || 1;
    const speech = dur * 0.95; // the file ends with a short tail of silence
    let acc = 0;
    const words: (Word & { chunk: number })[] = [];
    toks.forEach((p) => {
      const s = Math.round(start + (acc / totalW) * speech);
      // A cue on the very first word fires at frame 0, so the hook is on screen before the voice.
      p.cues.forEach((c) => (cues[c] = i === 0 && acc === 0 ? 0 : s));
      if (p.text) words.push({ text: p.text, key: p.key, start: s, chunk: p.chunk });
      acc += p.w;
    });
    const gap = ln.gap ?? DEFAULT_GAP;
    for (let ci = 0; ci < rawChunks.length; ci++) {
      const ws = words.filter((w) => w.chunk === ci);
      if (!ws.length) continue;
      const next = words.find((w) => w.chunk === ci + 1);
      chunks.push({ line: i, start: ws[0].start, end: next ? next.start : end + gap, accent: ln.c ?? "brass", words: ws });
    }
    t = end + gap;
  });

  return { total: t + TAIL, lines, chunks, cues };
}
