#!/usr/bin/env node
// Claude Code hook: shows research subagents on the wall, one trace each under the `research`
// station (CONTENT), from launch to finish. Pure logic in claude-agents-lib.mjs.
//
// Set once, for every project, in ~/.claude/settings.json (README, "Research on the wall"):
// PreToolUse with matcher "Agent|Task", SubagentStart and SubagentStop, each running
//   node -e "import('file:///E:/Projects/poker-trainer/apps/wall/scripts/claude-agents.mjs').catch(()=>{})"
// with "async": true, so it never slows a session and does nothing on a branch without it.
//
// PreToolUse remembers each launch (what it was asked, and whether it is research);
// SubagentStart claims the oldest waiting launch of its session and type and, for research,
// posts a running job; SubagentStop posts it done. State is one small file per launch under
// logs/agents/ (git-ignored); claiming is a file rename, so parallel agents never take the same
// launch. Wall down = nothing is shown and nothing fails. Non-research agents are only tracked
// so the matching stays in order; the wall never hears of them.
//
// Wall: WALL_URL / WALL_INGEST_KEY, else `wall.url` / `wall.ingest_key` in credentials.json,
// else the local wall at http://127.0.0.1:8788 (no key on localhost). The key is never printed.
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PENDING_TTL_MS, agentEvent, candidates, doneJob, launch, startJob } from "./claude-agents-lib.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", "..", "..");
const dir = resolve(here, "..", "logs", "agents");
const pendingDir = join(dir, "pending");
const runningDir = join(dir, "running");

const read = (p) => {
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return null;
  }
};
const safe = (s) => String(s ?? "").replace(/[^\w-]/g, "").slice(0, 80);

let input = "";
for await (const chunk of process.stdin) input += chunk;
let payload = {};
try {
  payload = JSON.parse(input);
} catch {
  process.exit(0);
}

async function send(path, body) {
  let url = process.env.WALL_URL;
  let key = process.env.WALL_INGEST_KEY;
  const creds = existsSync(resolve(root, "credentials.json")) ? read(resolve(root, "credentials.json"))?.wall ?? {} : {};
  url = (url || creds.url || "http://127.0.0.1:8788").replace(/\/$/, "");
  key ??= creds.ingest_key;
  try {
    await fetch(`${url}/api/${path}`, {
      method: "POST",
      headers: { ...(key ? { Authorization: `Bearer ${key}` } : {}), "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    /* wall down: the trace is simply missing */
  }
}

const now = new Date();
/** A start or stop that can't be placed, kept for debugging the hook (keys only, never the prompt). */
const unmatched = (why) => {
  try {
    appendFileSync(join(dir, "unmatched.log"), JSON.stringify({ at: now.toISOString(), why, event: payload.hook_event_name, keys: Object.keys(payload), session: payload.session_id, agent_id: payload.agent_id, agent_type: payload.agent_type }) + "\n");
  } catch {
    /* not writable: nothing to do */
  }
};
const event = payload.hook_event_name;
mkdirSync(pendingDir, { recursive: true });
mkdirSync(runningDir, { recursive: true });

if (event === "PreToolUse" && /^(Agent|Task)$/.test(payload.tool_name ?? "")) {
  const l = launch(payload, now);
  writeFileSync(join(pendingDir, safe(l.jobId) + ".json"), JSON.stringify(l));
  // Forget launches nobody claimed, and runs whose stop never came (a day is plenty).
  for (const [d, ttl] of [[pendingDir, PENDING_TTL_MS], [runningDir, 24 * 3600 * 1000]])
    for (const f of readdirSync(d)) {
      const x = read(join(d, f));
      if (!x || now.getTime() - (x.at ?? 0) > ttl) rmSync(join(d, f), { force: true });
    }
} else if (event === "SubagentStart") {
  if (!payload.agent_id) unmatched("start without agent_id");
  const pending = readdirSync(pendingDir).map((f) => ({ f, ...read(join(pendingDir, f)) })).filter((x) => x.jobId);
  let placed = !payload.agent_id;
  for (const c of payload.agent_id ? candidates(pending, payload, now.getTime()) : []) {
    const target = join(runningDir, safe(payload.agent_id) + ".json");
    try {
      renameSync(join(pendingDir, c.f), target); // atomic: a parallel start that got here first wins
    } catch {
      continue;
    }
    const { f, ...l } = c;
    writeFileSync(target, JSON.stringify({ ...l, startedAt: now.getTime() }));
    placed = true;
    if (l.research) await Promise.all([send("job", startJob(l, now)), send("event", agentEvent("job.started", l, null, now))]);
    break;
  }
  if (!placed) unmatched("no waiting launch");
} else if (event === "SubagentStop") {
  const p = join(runningDir, safe(payload.agent_id) + ".json");
  const l = payload.agent_id ? read(p) : null;
  if (!l) unmatched(payload.agent_id ? "stop for an agent never started" : "stop without agent_id");
  if (l) {
    rmSync(p, { force: true });
    if (l.research) await Promise.all([send("job", doneJob(l, payload, now)), send("event", agentEvent("job.done", l, l.startedAt, now))]);
  }
}
