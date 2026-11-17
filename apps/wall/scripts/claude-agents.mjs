#!/usr/bin/env node
// Claude Code hook: shows research subagents on the wall, one trace each under the `research`
// station (CONTENT), from launch to finish; and the hook writer's writer and critic agents the
// same way under `hooks`. Below, "research" means "shown on the wall". Pure logic in
// claude-agents-lib.mjs.
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
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PENDING_TTL_MS, agentEvent, candidates, doneJob, launch, startJob } from "./claude-agents-lib.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", "..", "..");
const dir = resolve(here, "..", "logs", "agents");
const pendingDir = join(dir, "pending");
const runningDir = join(dir, "running");
const stoppedDir = join(dir, "stopped");

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
mkdirSync(stoppedDir, { recursive: true });
/** One line per hook call (event, agent, what happened), to see the order things really fire in. */
const trace = (what) => {
  try {
    const log = join(dir, "trace.log");
    if (existsSync(log) && statSync(log).size > 1e6) rmSync(log, { force: true });
    appendFileSync(log, `${now.toISOString()} ${event} ${payload.agent_id ?? payload.tool_use_id ?? "-"} ${what}\n`);
  } catch {
    /* not writable: nothing to do */
  }
};

if (event === "PreToolUse" && /^(Agent|Task)$/.test(payload.tool_name ?? "")) {
  const l = launch(payload, now);
  writeFileSync(join(pendingDir, safe(l.jobId) + ".json"), JSON.stringify(l));
  trace(`launch ${l.jobId}${l.research ? " (research)" : ""}`);
  // Forget launches nobody claimed, stop notes nobody picked up, and runs whose stop never came.
  for (const [d, ttl] of [[pendingDir, PENDING_TTL_MS], [stoppedDir, PENDING_TTL_MS], [runningDir, 24 * 3600 * 1000]])
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
      renameSync(join(pendingDir, c.f), target); // atomic: a parallel start that got here first wins; never rewritten after
    } catch {
      continue;
    }
    const { f, ...l } = c;
    placed = true;
    trace(`claimed ${l.jobId}${l.research ? " (research)" : ""}`);
    if (l.research) await Promise.all([send("job", startJob(l, now)), send("event", agentEvent("job.started", l, null, now))]);
    // A very short agent's stop can land before this start finished: it left a note, finish now.
    const note = join(stoppedDir, safe(payload.agent_id) + ".json");
    const stop = read(note);
    if (stop) {
      rmSync(note, { force: true });
      rmSync(target, { force: true });
      trace(`finished ${l.jobId} from the stop note`);
      if (l.research) await Promise.all([send("job", doneJob(l, stop, new Date(stop.at))), send("event", agentEvent("job.done", l, l.at, new Date(stop.at)))]);
    }
    break;
  }
  if (!placed) unmatched("no waiting launch");
} else if (event === "SubagentStop" && payload.agent_id) {
  const p = join(runningDir, safe(payload.agent_id) + ".json");
  const l = read(p);
  if (l) {
    rmSync(p, { force: true });
    trace(`finished ${l.jobId}`);
    if (l.research) await Promise.all([send("job", doneJob(l, payload, now)), send("event", agentEvent("job.done", l, l.at, now))]);
  } else {
    // Its start hasn't been placed yet (or never will be): leave a note the start picks up.
    writeFileSync(join(stoppedDir, safe(payload.agent_id) + ".json"), JSON.stringify({ at: now.getTime(), last_assistant_message: payload.last_assistant_message ?? null }));
    trace("stop before its start: note left");
  }
} else if (event === "SubagentStop") {
  unmatched("stop without agent_id");
}
