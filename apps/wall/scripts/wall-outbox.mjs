// Reports to the wall that survive the wall being closed. The wall runs only while the founder
// has it open, and unattended jobs (the weekly SEO run) report at hours when it is not: a report
// that gets no answer is kept in an outbox file and sent later, in order, by whoever reaches the
// wall next: the next `send`, or the wall itself a few seconds after it starts (scripts/dev.mjs).
//
//   import { send } from ".../apps/wall/scripts/wall-outbox.mjs";
//   await send("event", { kind: "run", station: "seo", text: "…" });   // "sent" | "kept" | "rejected"
//   await send("station", { id: "seo", name: "SEO", state: "ok" });
//   node apps/wall/scripts/wall-outbox.mjs                              // send what is waiting, say how many
//
// An event is given its id and time when it is first sent, so a replay lands once (the store
// ignores an id it already has) and at the moment it happened, not the moment it was replayed.
// A queue card is given its id the same way; a station is one row. So sending twice is harmless.
// Kept: no answer, or an answer that may change (401, 5xx, a wall without its store). Dropped: a
// 400, which is the wall saying the report itself is wrong and always will be.
// Wall: WALL_URL / WALL_INGEST_KEY, else `wall.url` / `wall.ingest_key` in credentials.json, else
// the local wall at http://127.0.0.1:8788. Outbox: WALL_OUTBOX, else logs/wall-outbox.jsonl in the
// main checkout (git-ignored), so a job in a worktree and the wall in the main checkout agree.
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", "..", "..");
const TIMEOUT_MS = 3000;
/** A claimed batch this old belongs to a sender that died mid-way: it is taken back. */
const ORPHAN_MS = 60000;

/** The main checkout (a worktree's git-ignored files live only there); this checkout if git can't say. */
export function mainCheckout() {
  try {
    const common = execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    return resolve(common, "..");
  } catch {
    return root;
  }
}

export const outboxFile = () => (process.env.WALL_OUTBOX ? resolve(process.env.WALL_OUTBOX) : resolve(mainCheckout(), "logs", "wall-outbox.jsonl"));

/** Where the wall is and the key for it, if it needs one. Never printed. */
export function target() {
  let url = process.env.WALL_URL;
  let key = process.env.WALL_INGEST_KEY;
  if (!url || key === undefined) {
    for (const dir of [root, mainCheckout()]) {
      const path = resolve(dir, "credentials.json");
      if (!existsSync(path)) continue;
      try {
        const c = JSON.parse(readFileSync(path, "utf8")).wall ?? {};
        url ??= c.url;
        key ??= c.ingest_key;
      } catch {
        /* unreadable credentials: the local wall */
      }
      break;
    }
  }
  return { url: (url || "http://127.0.0.1:8788").replace(/\/$/, ""), key: key || undefined };
}

/** One POST. "sent", "kept" (try again later) or "rejected" (the wall refused the report itself). */
async function post(path, body, { url, key }) {
  try {
    const res = await fetch(`${url}/api/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Connection: "close", ...(key ? { Authorization: `Bearer ${key}` } : {}) },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.ok) return "sent";
    return res.status === 400 ? "rejected" : "kept";
  } catch {
    return "kept";
  }
}

const keep = (file, lines) => {
  if (!lines.length) return;
  mkdirSync(dirname(file), { recursive: true });
  appendFileSync(file, lines.map((l) => l + "\n").join(""));
};

/** Every waiting line, claimed for this process: the outbox itself and any batch a dead sender left. */
function claim(file) {
  const dir = dirname(file);
  if (!existsSync(dir)) return [];
  const mine = `${file}.${process.pid}.${Date.now()}.sending`;
  const lines = [];
  for (const name of readdirSync(dir).sort()) {
    const path = resolve(dir, name);
    if (!name.startsWith(basename(file) + ".") || !name.endsWith(".sending")) continue;
    try {
      if (Date.now() - statSync(path).mtimeMs < ORPHAN_MS) continue; // another sender is on it
      lines.push(...readFileSync(path, "utf8").split("\n").filter(Boolean));
      rmSync(path);
    } catch {
      /* taken by someone else meanwhile */
    }
  }
  try {
    renameSync(file, mine); // atomic: two senders never read the same lines
    lines.push(...readFileSync(mine, "utf8").split("\n").filter(Boolean));
    rmSync(mine);
  } catch {
    /* no outbox, or another sender claimed it first */
  }
  return lines;
}

/**
 * Sends what is waiting, oldest first, and stops at the first report the wall does not take, so
 * the order holds. Returns how many were sent, dropped (rejected or unreadable) and are left.
 */
export async function flush(opts = {}) {
  const file = opts.file ?? outboxFile();
  const where = { ...target(), ...opts };
  const lines = claim(file);
  let sent = 0;
  let dropped = 0;
  for (let i = 0; i < lines.length; i++) {
    let entry;
    try {
      entry = JSON.parse(lines[i]);
    } catch {
      dropped++;
      continue;
    }
    const r = await post(entry.path, entry.body, where);
    if (r === "kept") {
      // What arrived in the outbox while this ran is newer: it goes after what is put back.
      const newer = claim(file);
      keep(file, [...lines.slice(i), ...newer]);
      return { sent, dropped, left: lines.length - i + newer.length };
    }
    if (r === "sent") sent++;
    else dropped++;
  }
  return { sent, dropped, left: 0 };
}

const stamp = (e) => (e && typeof e === "object" ? { ...e, id: e.id ?? randomUUID(), ts: e.ts ?? new Date().toISOString() } : e);

/**
 * Reports to the wall now, or keeps the report for later. Never throws and never waits on a
 * closed wall for more than a few seconds: reporting must not fail the job that reports.
 */
export async function send(path, body, opts = {}) {
  const file = opts.file ?? outboxFile();
  const where = { ...target(), ...opts };
  // A card gets its id here too: a report the wall took but answered too slowly is sent again,
  // and must land on the same card (stations are one row each already).
  const stamped = path === "event" ? (Array.isArray(body) ? body.map(stamp) : stamp(body)) : path === "queue" && body && !body.id ? { ...body, id: randomUUID() } : body;
  const line = JSON.stringify({ at: new Date().toISOString(), path, body: stamped });
  try {
    // Older reports first, or a newer station state would be overwritten by a replayed older one.
    const before = await flush({ ...where, file });
    if (before.left) {
      keep(file, [line]);
      return "kept";
    }
    const r = await post(path, stamped, where);
    if (r === "kept") keep(file, [line]);
    return r;
  } catch {
    try {
      keep(file, [line]);
    } catch {
      /* no disk either: the report is lost, the job goes on */
    }
    return "kept";
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const r = await flush();
  console.log(`wall outbox: ${r.sent} sent, ${r.dropped} dropped, ${r.left} still waiting (${target().url})`);
}
