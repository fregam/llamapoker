#!/usr/bin/env node
// Measure the voice-over takes of a reel and write its manifest for apps/reels/src/vo.ts.
//
//   node scripts/vo-manifest.mjs <reel-id> "<voice name>"
//
// Reads apps/reels/public/vo/<reel-id>/<take>.wav (one file per take named in the script) and
// writes apps/reels/src/vo/<reel-id>.json with each take's length and where the speech starts
// and ends inside it (decoded through Remotion's ffmpeg, voiced = RMS above 8% of the peak), plus
// the measured word times from src/vo/<reel-id>.words.json when scripts/vo-align.py has run.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [id, voice = "unknown"] = process.argv.slice(2);
if (!id) throw new Error("usage: vo-manifest.mjs <reel-id> [voice]");
const ffmpeg = resolve(root, "apps/reels/node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe");
const dir = resolve(root, "apps/reels/public/vo", id);
const script = JSON.parse(readFileSync(resolve(root, "apps/reels/src/scripts", `${id}.json`), "utf8"));
const names = [];
script.lines.forEach((l) => {
  if (l.take || !names.length) names.push(l.take ?? String(names.length + 1));
});

const SR = 16000;
export function measure(path) {
  // Remotion's ffmpeg has no raw s16le muxer, so decode to a wav stream and skip to its data chunk.
  const wav = execFileSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-i", path, "-f", "wav", "-c:a", "pcm_s16le", "-ac", "1", "-ar", String(SR), "-"], { maxBuffer: 1 << 28 });
  const dataAt = wav.indexOf("data");
  const pcm = wav.subarray(dataAt + 8);
  const n = pcm.length >> 1;
  const win = Math.round(SR * 0.02);
  const rms = [];
  for (let i = 0; i + win <= n; i += win) {
    let s = 0;
    for (let j = i; j < i + win; j++) {
      const v = pcm.readInt16LE(j * 2) / 32768;
      s += v * v;
    }
    rms.push(Math.sqrt(s / win));
  }
  const peak = Math.max(...rms);
  const thr = Math.max(peak * 0.08, 0.004);
  let first = rms.findIndex((r) => r > thr);
  let last = rms.length - 1;
  while (last > 0 && rms[last] <= thr) last--;
  if (first < 0) first = 0;
  const r2 = (x) => Math.round(x * 100) / 100;
  return { seconds: r2(n / SR), from: r2((first * win) / SR), to: r2(((last + 1) * win) / SR) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const wordsPath = resolve(root, "apps/reels/src/vo", `${id}.words.json`);
  const words = existsSync(wordsPath) ? JSON.parse(readFileSync(wordsPath, "utf8")) : {};
  const takes = names.map((name) => {
    const file = ["wav", "mp3", "flac"].map((e) => `${name}.${e}`).find((f) => existsSync(resolve(dir, f)));
    if (!file) throw new Error(`missing take ${name} in ${dir}`);
    return { name, file: `vo/${id}/${file}`, ...measure(resolve(dir, file)), ...(words[name] ? { words: words[name] } : {}) };
  });
  mkdirSync(resolve(root, "apps/reels/src/vo"), { recursive: true });
  writeFileSync(resolve(root, "apps/reels/src/vo", `${id}.json`), JSON.stringify({ voice, takes }, null, 2) + "\n");
  const speech = takes.reduce((a, t) => a + (t.to - t.from), 0);
  console.log(`${id}: ${takes.length} takes, ${speech.toFixed(1)} s of speech`);
}
