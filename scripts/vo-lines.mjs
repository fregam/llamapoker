#!/usr/bin/env node
// Print a reel's voice-over lines exactly as the voice model should read them.
//
//   node scripts/vo-lines.mjs <reel-id>          numbered, one per line
//   node scripts/vo-lines.mjs <reel-id> --json   JSON array (for batch requests)
//
// Reads apps/reels/src/scripts/<reel-id>.json and strips the caption/cue markup the same way
// apps/reels/src/narration.ts does, so the audio always matches the captions.
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [id, flag] = process.argv.slice(2);
if (!id) throw new Error("usage: vo-lines.mjs <reel-id> [--json]");
const script = JSON.parse(readFileSync(resolve(root, "apps/reels/src/scripts", `${id}.json`), "utf8"));
const spoken = (t) => t.replace(/\[[^\]]+\]/g, "").replace(/[|*]/g, "").replace(/\s+/g, " ").trim();
const lines = script.lines.map((l) => spoken(l.t));
if (flag === "--json") console.log(JSON.stringify(lines));
else {
  lines.forEach((l, i) => console.log(`${String(i + 1).padStart(2)}  ${l}`));
  console.log(`\n${lines.length} lines, voice ${script.voice.name} (${script.voice.engine})`);
}
