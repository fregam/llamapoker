/**
 * Narration-first timing. A reel is a script of spoken lines (src/scripts/<id>.json) grouped into
 * takes: a take is one continuous voice-over recording (public/vo/<id>/<take>.wav), so the voice
 * flows through a whole scene instead of restarting cold at every sentence. The first line of a
 * take names it ("take": "hook"). scripts/vo-manifest.mjs measures each take into src/vo/<id>.json,
 * including where the speech actually starts and ends inside the file.
 *
 * The timeline puts every take at its real length, estimates each word's moment inside the
 * take (measured by scripts/vo-align.py when its word file exists, else by character weight with
 * extra time at punctuation) and turns the script's markup into caption chunks and stage cues:
 *
 *   "Your plan is simple: | [grid]*queens*, [kk]kings"
 *     |         splits the line into caption chunks (one on screen at a time)
 *     *word*    the chunk's key word (Bodoni italic in the accent colour)
 *     [name]    a cue: the stage reacts the moment this word is spoken (useNarration().since("name"))
 *
 * The text sent to the voice model is spoken(take) — the lines joined, markup removed — printed
 * by scripts/vo-lines.mjs so the audio and the captions can never drift apart.
 */

import { FPS } from "./theme";
import type { VoManifest } from "./vo";

export interface ScriptLine {
  /** Names a new take starting at this line; lines without it continue the current take. */
  take?: string;
  /** The line with chunk, key-word and cue markup. */
  t: string;
  /** Silence after the take, in frames (default 9). Only read on a take's last line. */
  gap?: number;
  /** Accent colour token for this line's key words: brass (default), sage or vermilion. */
  c?: "brass" | "sage" | "vermilion";
}

export interface Script {
  voice: Record<string, string>;
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

export interface Take {
  name: string;
  /** Indices into script.lines. */
  lines: number[];
  start: number;
  end: number;
  file?: string;
}

export interface Timeline {
  total: number;
  takes: Take[];
  lines: { start: number; end: number }[];
  chunks: Chunk[];
  cues: Record<string, number>;
}

export const LEAD = 10; // frames before the first word
export const TAIL = 24; // frames after the last word (loop breath)
const DEFAULT_GAP = 9;
const WPS = 2.4; // words per second assumed before the audio exists
const SENTENCE_PAUSE = 0.3; // seconds per sentence end, before the audio exists

/** A line as the voice model should read it: markup removed. */
export function spoken(t: string): string {
  return t
    .replace(/\[[^\]]+\]/g, "")
    .replace(/[|*]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Group the script's lines into takes, in order. */
export function takesOf(script: Script): { name: string; lines: number[] }[] {
  const out: { name: string; lines: number[] }[] = [];
  script.lines.forEach((ln, i) => {
    if (ln.take || !out.length) out.push({ name: ln.take ?? String(out.length + 1), lines: [] });
    out[out.length - 1].lines.push(i);
  });
  return out;
}

/** A take as the voice model should read it: its lines joined, one per sentence. */
export function spokenTake(script: Script, lines: number[]): string {
  return lines.map((i) => spoken(script.lines[i].t)).join(" ");
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
  const takes: Take[] = [];
  const lines: Timeline["lines"] = script.lines.map(() => ({ start: 0, end: 0 }));
  const chunks: Chunk[] = [];
  const cues: Record<string, number> = {};
  let t = LEAD;

  takesOf(script).forEach((tk, ti) => {
    const measured = vo?.takes.find((m) => m.name === tk.name);
    let dur: number;
    let speechFrom: number;
    let speechTo: number;
    if (measured) {
      dur = Math.ceil(measured.seconds * FPS);
      speechFrom = Math.round(measured.from * FPS);
      speechTo = Math.round(measured.to * FPS);
    } else {
      const text = spokenTake(script, tk.lines);
      const sentences = (text.match(/[.?!:]/g) ?? []).length;
      dur = Math.ceil((text.split(" ").length / WPS + sentences * SENTENCE_PAUSE) * FPS);
      speechFrom = 0;
      speechTo = dur;
    }
    const start = t;
    const end = t + dur;

    // Tokens of the whole take with their line, chunk, cues, key flag and weight.
    type Tok = { line: number; chunk: number; cues: string[]; text: string; key: boolean; w: number };
    const toks: Tok[] = [];
    tk.lines.forEach((li) =>
      script.lines[li].t.split("|").forEach((c, ci) =>
        c
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .forEach((raw) => {
            const cueNames = [...raw.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1]);
            const marked = raw.replace(/\[[^\]]+\]/g, "");
            const text = marked.replace(/\*/g, "");
            toks.push({ line: li, chunk: ci, cues: cueNames, text, key: /\*[^*]+\*/.test(marked), w: text ? weight(text) : 0 });
          }),
      ),
    );
    const totalW = toks.reduce((a, p) => a + p.w, 0) || 1;
    // Measured word times (scripts/vo-align.py) when they match the script word for word;
    // otherwise each word's moment is estimated from its weight inside the voiced span.
    const spokenToks = toks.filter((p) => p.text);
    const measuredWords = measured?.words && measured.words.length === spokenToks.length ? measured.words : null;
    let acc = 0;
    let wi = 0;
    const words: (Word & { line: number; chunk: number })[] = [];
    toks.forEach((p) => {
      const s = measuredWords && p.text ? start + Math.round(measuredWords[wi].s * FPS) : Math.round(start + speechFrom + (acc / totalW) * (speechTo - speechFrom));
      // A cue on the very first word of the reel fires at frame 0, so the hook is on screen before the voice.
      p.cues.forEach((c) => (cues[c] = ti === 0 && acc === 0 ? 0 : s));
      if (p.text) {
        words.push({ text: p.text, key: p.key, start: s, line: p.line, chunk: p.chunk });
        wi++;
      }
      acc += p.w;
    });

    const lastLine = script.lines[tk.lines[tk.lines.length - 1]];
    const gap = lastLine.gap ?? DEFAULT_GAP;
    const takeEnd = end + gap;

    // Lines: from their first word to the next line's first word (or the take's end).
    tk.lines.forEach((li, k) => {
      const first = words.find((w) => w.line === li);
      const nextFirst = k + 1 < tk.lines.length ? words.find((w) => w.line === tk.lines[k + 1]) : undefined;
      lines[li] = { start: k === 0 ? start : (first?.start ?? start), end: nextFirst ? nextFirst.start : takeEnd };
    });

    // Chunks: from their first word to the next chunk's first word (or the take's end).
    for (let wi = 0; wi < words.length; ) {
      const { line, chunk } = words[wi];
      let wj = wi;
      while (wj < words.length && words[wj].line === line && words[wj].chunk === chunk) wj++;
      const ws = words.slice(wi, wj).map(({ text, key, start: s }) => ({ text, key, start: s }));
      chunks.push({ line, start: ws[0].start, end: wj < words.length ? words[wj].start : takeEnd, accent: script.lines[line].c ?? "brass", words: ws });
      wi = wj;
    }

    takes.push({ name: tk.name, lines: tk.lines, start, end, file: measured?.file });
    t = takeEnd;
  });

  return { total: t + TAIL, takes, lines, chunks, cues };
}
