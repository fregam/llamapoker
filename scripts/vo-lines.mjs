#!/usr/bin/env node
// Print a reel's voice-over takes exactly as the voice model should read them.
//
//   node scripts/vo-lines.mjs <reel-id>          one take per block, with its name
//   node scripts/vo-lines.mjs <reel-id> --json   JSON array of { name, text } (for batch requests)
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

export const spoken = (t) => t.replace(/\[[^\]]+\]/g, "").replace(/[|*]/g, "").replace(/\s+/g, " ").trim();

/** The script's lines grouped into takes: [{ name, text }]. Mirrors takesOf() in narration.ts. */
export function takes(script) {
  const out = [];
  script.lines.forEach((l) => {
    if (l.take || !out.length) out.push({ name: l.take ?? String(out.length + 1), parts: [] });
    out[out.length - 1].parts.push(spoken(l.t));
  });
  return out.map(({ name, parts }) => ({ name, text: parts.join(" ") }));
}

const list = takes(script);
if (flag === "--json") console.log(JSON.stringify(list));
else {
  list.forEach((t) => console.log(`[${t.name}]\n${t.text}\n`));
  const words = list.reduce((a, t) => a + t.text.split(" ").length, 0);
  console.log(`${list.length} takes, ${words} words, voice ${script.voice.name} (${script.voice.engine})`);
}
