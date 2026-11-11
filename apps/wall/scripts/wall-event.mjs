#!/usr/bin/env node
// Writes to the wall's store from the PC: the way local jobs (renders, voice, research runs)
// report in the common event format, and the way a station reports its state.
//
//   node scripts/wall-event.mjs event --kind run --station reels --subject only-aces \
//        --text "Rendered only-aces v9" --amount 87 --unit s --cost 0 --channel ig
//   node scripts/wall-event.mjs station --id reels --name Reels --state ok --message "v9 rendered" \
//        --next-run 2026-11-14T18:00:00Z
//   node scripts/wall-event.mjs queue --kind reel --title "002 Only playing aces?" --preview-file content/reels/002-only-aces.md
//
// Where and how: WALL_URL and WALL_INGEST_KEY from the environment, else `wall.url` and
// `wall.ingest_key` in the repo's credentials.json (git-ignored). No dependencies.
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const [cmd, ...rest] = process.argv.slice(2);
const args = {};
for (let i = 0; i < rest.length; i += 2) args[rest[i].replace(/^--/, "").replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = rest[i + 1];

let url = process.env.WALL_URL;
let key = process.env.WALL_INGEST_KEY;
const credsPath = resolve(root, "credentials.json");
if ((!url || !key) && existsSync(credsPath)) {
  const c = JSON.parse(readFileSync(credsPath, "utf8")).wall ?? {};
  url ??= c.url;
  key ??= c.ingest_key;
}
if (!cmd || !["event", "station", "queue"].includes(cmd)) {
  console.error("usage: wall-event.mjs event|station|queue --key value ...");
  process.exit(2);
}
if (!url || !key) {
  console.error("set WALL_URL and WALL_INGEST_KEY, or wall.url and wall.ingest_key in credentials.json");
  process.exit(2);
}
if (args.previewFile) args.preview = readFileSync(resolve(process.cwd(), args.previewFile), "utf8");
delete args.previewFile;
const res = await fetch(`${url.replace(/\/$/, "")}/api/${cmd}`, {
  method: "POST",
  headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  body: JSON.stringify(args),
});
const out = await res.text();
console.log(res.status, out);
process.exit(res.ok ? 0 : 1);
