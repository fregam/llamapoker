/**
 * Sound design on top of the narration (see stage.tsx):
 *   <Music src>            a bed under the whole reel, looped, ducked while the voice speaks and
 *                          lifted in the gaps between takes, the hook and the outro
 *   <Sfx cue src>          one effect at a spoken cue (public/sfx/<name>.wav), optional delay/gain
 *   <Ticks cue until n>    n short ticks spread from one cue to another (a counter counting)
 * Levels are linear gains for Remotion's <Audio volume>; the voice takes are at -16 LUFS, so the
 * bed sits about 18 dB under them while speaking and 10 dB under in the pauses.
 */

import { Audio, Sequence, interpolate, staticFile } from "remotion";
import { useNarration } from "./stage";

const dB = (x: number) => Math.pow(10, x / 20);

// The bed file sits at -20 dBFS RMS and the voice at about -18 dBFS RMS, so these gains put the
// bed ~16 dB under the voice while it speaks, ~10 dB under in the pauses, and closer in the hook.
export const MUSIC = {
  speaking: dB(-10), // under the voice
  pause: dB(-4), // between takes
  hookTail: dB(-1), // the first frames, before the first word, and after the last word
  ramp: 10, // frames to move between levels
};

/** Music bed, looped, ducked under the narration. */
export function Music({ src, gain = 1 }: { src: string; gain?: number }) {
  const { tl } = useNarration();
  // Voiced spans in absolute frames (take start + measured from/to, or the whole take).
  const spans = tl.takes.map((t) => ({ a: t.start, b: t.end }));
  const firstStart = spans[0]?.a ?? 0;
  const lastEnd = spans.length ? spans[spans.length - 1].b : 0;
  const levelAt = (g: number) => {
    if (g < firstStart - MUSIC.ramp || g >= lastEnd + 6) return MUSIC.hookTail;
    return spans.some((s) => g >= s.a - MUSIC.ramp && g < s.b) ? MUSIC.speaking : MUSIC.pause;
  };
  // Smooth: the level averaged over a window of `ramp` frames either side.
  const volume = (f: number) => {
    let acc = 0;
    for (let k = -MUSIC.ramp; k <= MUSIC.ramp; k++) acc += levelAt(f + k);
    return (acc / (2 * MUSIC.ramp + 1)) * gain;
  };
  return <Audio src={staticFile(src)} loop volume={volume} />;
}

/** One sound effect at a cue. `gain` is linear (1 = file level, the files are cut at -18 LUFS). */
export function Sfx({ cue, src, delay = 0, gain = 1, dur = 90 }: { cue: string; src: string; delay?: number; gain?: number; dur?: number }) {
  const { at } = useNarration();
  // A negative delay starts a swell (whoosh) before the cue so it peaks on it.
  const from = Math.max(0, at(cue) + delay);
  return (
    <Sequence from={from} durationInFrames={dur}>
      <Audio src={staticFile(src)} volume={gain} />
    </Sequence>
  );
}

/** A number landing: a riser into the cue, the stamp on it, a soft boom under it. */
export function Hit({ cue, delay = 0, gain = 1, riser = true }: { cue: string; delay?: number; gain?: number; riser?: boolean }) {
  return (
    <>
      {riser && <Sfx cue={cue} src="sfx/riser.wav" delay={delay - 22} gain={0.45 * gain} />}
      <Sfx cue={cue} src="sfx/stamp.wav" delay={delay} gain={gain} />
      <Sfx cue={cue} src="sfx/boom.wav" delay={delay} gain={0.7 * gain} />
    </>
  );
}

/**
 * n ticks spread evenly from a cue to another cue (`until`) or over `frames`: a counter counting,
 * dots filling, cells lighting one after another. Never on the captions: words are not events.
 */
export function Ticks({ cue, until, frames, n, src, gain = 0.6, maxPerSecond = 12, delay = 0 }: { cue: string; until?: string; frames?: number; n: number; src: string; gain?: number; maxPerSecond?: number; delay?: number }) {
  const { at } = useNarration();
  const a = at(cue) + delay;
  const b = until ? at(until) : a + (frames ?? 30);
  const count = Math.min(n, Math.floor(((b - a) / 30) * maxPerSecond));
  if (count <= 0) return null;
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const f = Math.round(interpolate(i, [0, Math.max(1, count - 1)], [a, b]));
        return (
          <Sequence key={i} from={f} durationInFrames={12}>
            <Audio src={staticFile(src)} volume={gain * (0.7 + 0.3 * (i / count))} />
          </Sequence>
        );
      })}
    </>
  );
}
