#!/usr/bin/env node
// Measure the voice-over lines of a reel and write its manifest for apps/reels/src/vo.ts.
//
//   node scripts/vo-manifest.mjs <reel-id> "<voice name>"
//
// Reads apps/reels/public/vo/<reel-id>/<n>.wav (1-based, one per beat) and writes
// apps/reels/src/vo/<reel-id>.json with each line's length in seconds (via Remotion's ffmpeg).
import { execFileSync } from "node:child_process";
import { readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [id, voice = "unknown"] = process.argv.slice(2);
if (!id) throw new Error("usage: vo-manifest.mjs <reel-id> [voice]");
const ffmpeg = resolve(root, "apps/reels/node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe");
const dir = resolve(root, "apps/reels/public/vo", id);
const files = readdirSync(dir).filter((f) => /^\d+\.(wav|mp3)$/.test(f)).sort((a, b) => parseInt(a) - parseInt(b));
const lines = files.map((f) => {
  let out = "";
  try {
    execFileSync(ffmpeg, ["-hide_banner", "-i", resolve(dir, f)], { stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    out = String(e.stderr);
  }
  const m = out.match(/Duration: (\d+):(\d+):([\d.]+)/);
  const seconds = m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : 0;
  return { file: `vo/${id}/${f}`, seconds: Math.round(seconds * 100) / 100 };
});
mkdirSync(resolve(root, "apps/reels/src/vo"), { recursive: true });
writeFileSync(resolve(root, "apps/reels/src/vo", `${id}.json`), JSON.stringify({ voice, lines }, null, 2) + "\n");
console.log(`${id}: ${lines.length} lines, ${lines.reduce((a, l) => a + l.seconds, 0).toFixed(1)} s of speech`);
