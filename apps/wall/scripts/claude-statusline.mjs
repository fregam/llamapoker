#!/usr/bin/env node
// Claude Code's status line, and the wall's source for the Claude plan limits.
//
// Set it once in ~/.claude/settings.json:
//   "statusLine": { "type": "command", "command": "node -e \"import('file:///E:/Projects/poker-trainer/apps/wall/scripts/claude-statusline.mjs').catch(()=>process.stdout.write('Claude'))\"" }
// (the import wrapper prints "Claude" instead of an error on a branch without this file)
//
// On every refresh Claude Code pipes its session JSON here. This prints one line
// ("Opus 5.5 · 5h 4% · wk 10%") and, when the 5-hour or weekly reading changed (or every
// 10 minutes while it holds), posts it to the wall as `usage` events. It never blocks the
// status line for long and never fails loudly: wall down = the line still prints, and it
// tries again after 5 minutes. Pure logic in claude-statusline-lib.mjs.
//
// Wall: WALL_URL / WALL_INGEST_KEY, else `wall.url` / `wall.ingest_key` in credentials.json,
// else the local wall at http://127.0.0.1:8788 (no key on localhost). The key is never printed.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { limitEvents, readingKey, shouldSend, statusText } from "./claude-statusline-lib.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", "..", "..");
const statePath = resolve(here, "..", "logs", "claude-statusline.json"); // logs/ is git-ignored

let input = "";
for await (const chunk of process.stdin) input += chunk;
let payload = {};
try {
  payload = JSON.parse(input);
} catch {
  /* not JSON: print the plain line, send nothing */
}
process.stdout.write(statusText(payload));

const read = (p) => {
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return null;
  }
};
const last = read(statePath);
const nowMs = Date.now();
if (shouldSend(payload, last, nowMs)) {
  let url = process.env.WALL_URL;
  let key = process.env.WALL_INGEST_KEY;
  const creds = existsSync(resolve(root, "credentials.json")) ? read(resolve(root, "credentials.json"))?.wall ?? {} : {};
  url = (url || creds.url || "http://127.0.0.1:8788").replace(/\/$/, "");
  key ??= creds.ingest_key;
  let ok = false;
  try {
    const res = await fetch(`${url}/api/event`, {
      method: "POST",
      headers: { ...(key ? { Authorization: `Bearer ${key}` } : {}), "Content-Type": "application/json" },
      body: JSON.stringify(limitEvents(payload, new Date(nowMs))),
      signal: AbortSignal.timeout(1500),
    });
    ok = res.ok;
  } catch {
    /* wall down or slow: back off */
  }
  try {
    mkdirSync(dirname(statePath), { recursive: true });
    writeFileSync(statePath, JSON.stringify(ok ? { key: readingKey(payload), sentAt: nowMs } : { ...last, failedAt: nowMs }));
  } catch {
    /* state not writable: the next refresh simply tries again */
  }
}
