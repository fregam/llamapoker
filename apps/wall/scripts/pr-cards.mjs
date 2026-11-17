// Pull requests waiting on the founder, as cards in Needs you, kept true to GitHub.
//
// An agent that opens a pull request posts its card to the queue with the id `pr-<number>` and
// the kind `pull-request` (apps/seo/scripts/run.mjs does). The pull request is merged or closed
// on GitHub, not on the wall, so the wall is told: this script asks `gh` about every waiting
// card of that kind and takes the card off when its pull request is no longer open
// (merged = called, closed without merging = folded, each with a line in the feed).
// The wall runs it by itself a few seconds after it starts and every ten minutes after
// (scripts/dev.mjs); by hand: node apps/wall/scripts/pr-cards.mjs
//
// The wall only mirrors: CALL on such a card records the decision and removes the card, it does
// not merge anything. Needs the `gh` CLI, logged in; without it the cards simply stay.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { target } from "./wall-outbox.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const TIMEOUT_MS = 4000;

/** The pull request number a queue item is the card of, or null when it is some other piece. */
export function prOf(item) {
  if (item?.kind !== "pull-request" || item.status !== "waiting") return null;
  const m = /^pr-(\d+)$/.exec(String(item.id));
  return m ? Number(m[1]) : null;
}

/** What GitHub's state means for the card: null = still open (or unknown), leave it. */
export function decisionFor(state) {
  if (state === "MERGED") return { action: "call", note: "merged on GitHub" };
  if (state === "CLOSED") return { action: "fold", note: "closed on GitHub without merging" };
  return null;
}

const GH_WINDOWS = "C:\\Program Files\\GitHub CLI\\gh.exe";

/** OPEN | MERGED | CLOSED from `gh`, or null when gh is missing, logged out or offline. */
export function ghState(number) {
  for (const gh of ["gh", ...(process.platform === "win32" && existsSync(GH_WINDOWS) ? [GH_WINDOWS] : [])]) {
    try {
      const out = execFileSync(gh, ["pr", "view", String(number), "--json", "state"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 20000 });
      return JSON.parse(out).state ?? null;
    } catch (e) {
      if (e.code !== "ENOENT") return null; // gh ran and failed: asking the other copy changes nothing
    }
  }
  return null;
}

/**
 * One pass. Returns the cards it cleared ({ id, number, action }); an unreachable wall or a card
 * GitHub can't be asked about is left for the next pass.
 */
export async function syncPrCards({ url, key, stateOf = ghState } = {}) {
  const where = { ...target(), ...(url ? { url, key } : {}) };
  const headers = { "Content-Type": "application/json", Connection: "close", ...(where.key ? { Authorization: `Bearer ${where.key}` } : {}) };
  let queue;
  try {
    const res = await fetch(`${where.url}/api/queue`, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return [];
    queue = (await res.json()).queue ?? [];
  } catch {
    return [];
  }
  const cleared = [];
  for (const item of queue) {
    const number = prOf(item);
    if (number === null) continue;
    const d = decisionFor(await stateOf(number));
    if (!d) continue;
    try {
      const res = await fetch(`${where.url}/api/queue/${item.id}`, { method: "POST", headers, body: JSON.stringify(d), signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (res.ok) cleared.push({ id: item.id, number, action: d.action });
    } catch {
      /* next pass */
    }
  }
  return cleared;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const cleared = await syncPrCards();
  console.log(cleared.length ? cleared.map((c) => `pull request #${c.number}: card ${c.action === "call" ? "cleared (merged)" : "cleared (closed)"}`).join("\n") : "pull request cards: nothing to clear");
}
