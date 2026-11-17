// The pure half of scripts/claude-agents.mjs: which Claude subagents belong on the wall (research
// agents, and the hook writer's writer and critic), what the wall is told when one starts and
// finishes, and which launch a starting agent belongs to.
// Tested in claude-agents.test.mjs.
//
// Claude Code hooks pipe a JSON object on stdin. Three events are used:
// - PreToolUse on the Agent tool (older builds call it Task): `session_id`, `tool_use_id`,
//   `cwd`, `tool_input: { description, prompt, subagent_type, run_in_background }`. The only
//   event that carries what the agent was asked to do.
// - SubagentStart: `session_id`, `agent_id`, `agent_type`. The agent really began.
// - SubagentStop: `session_id`, `agent_id`, `agent_type`, and on newer builds
//   `last_assistant_message`. Fires when the agent finishes, also for a background agent.
// SubagentStart carries no prompt, so a launch is matched to its agent: the oldest unclaimed
// launch in the same session, its own agent type first. These field names are what the hook
// docs give; the script logs every start or stop it can't place to logs/agents/unmatched.log.

/** Silence allowed before a running agent reads as lost: an agent reports only start and end. */
export const AGENT_LOST_SEC = 90 * 60;
/** A launch never claimed by an agent (denied, failed to start) is forgotten after this long. */
export const PENDING_TTL_MS = 10 * 60 * 1000;

export const STATION = "research";

// Words a research brief uses. Over-including is cheap (an extra trace); missing one hides work.
const RESEARCH = /\b(research\w*|discover\w*|scrap\w*|audience|codebook|deep[- ]?dive|bake-?off|literature|competitor\w*|tool check)\b/i;
const RESEARCH_PATH = /(apps[\\/]research|docs[\\/]research|content[\\/]research|\.scratch[\\/]audience-research|worktrees[\\/]audience-research)/i;

/** The hook writer's station: its writer and critic agents (.claude/skills/hook-writing). */
export const HOOKS_STATION = "hooks";

// A hook-writing agent is known by what its brief points at: the skill's writer.md or critic.md,
// or a run folder under content/hooks/. The bare word "hook" is not enough: it also names Claude
// Code's hooks. Agents that study hooks (the corpus, the tagging) are research, by their paths.
const HOOKS = /(skills[\\/]hook-writing|content[\\/]hooks[\\/]|\bhook[- ]writ\w+|\bhook (writer|critic)\b)/i;

/**
 * Which station a launched subagent shows under, or null to stay off the wall. Hook writing is
 * asked first: its research arm says "research" in every brief.
 */
export function stationOf(toolInput, cwd = "") {
  const t = toolInput ?? {};
  if (HOOKS.test(`${t.description ?? ""}\n${t.prompt ?? ""}`)) return HOOKS_STATION;
  return isResearch(t, cwd) ? STATION : null;
}

/** Whether a launched subagent is research: by its type, its words, or where it works. */
export function isResearch(toolInput, cwd = "") {
  const t = toolInput ?? {};
  if (/research/i.test(String(t.subagent_type ?? ""))) return true;
  const text = `${t.description ?? ""}\n${t.prompt ?? ""}`;
  return RESEARCH.test(text) || RESEARCH_PATH.test(text) || RESEARCH_PATH.test(String(cwd ?? ""));
}

const clip = (s, n) => {
  const one = String(s ?? "").replace(/\s+/g, " ").trim();
  return one.length > n ? one.slice(0, n - 1) + "…" : one;
};

/** The trace's name: the launch's short description, else the prompt's first line. */
export function labelOf(toolInput) {
  const t = toolInput ?? {};
  return clip(t.description, 120) || clip(String(t.prompt ?? "").split("\n").find((l) => l.trim()), 120) || "research agent";
}

/** What PreToolUse remembers about a launch, until an agent claims it. */
export function launch(payload, now = new Date()) {
  const t = payload?.tool_input ?? {};
  const id = String(payload?.tool_use_id ?? `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`).replace(/[^\w-]/g, "").slice(0, 60);
  return {
    jobId: "agent-" + id,
    session: payload?.session_id ?? null,
    type: t.subagent_type ?? null,
    label: labelOf(t),
    station: stationOf(t, payload?.cwd),
    research: stationOf(t, payload?.cwd) !== null, // shown on the wall (the name is from when research was the only kind)
    at: now.getTime(),
  };
}

/** The launches still waiting for their agent, oldest first. */
export function fresh(pending, nowMs = Date.now()) {
  return pending.filter((p) => nowMs - p.at < PENDING_TTL_MS).sort((a, b) => a.at - b.at);
}

/**
 * Which waiting launches a starting agent may be, best first: same session, oldest first, the
 * ones of its own type ahead of the rest (general-purpose is the type of a launch naming none).
 * Type only orders, never excludes: a type spelled differently by the hook must not hide an agent.
 */
export function candidates(pending, start, nowMs = Date.now()) {
  const type = (x) => x ?? "general-purpose";
  const mine = fresh(pending, nowMs).filter((p) => !p.session || !start?.session_id || p.session === start.session_id);
  const same = (p) => !start?.agent_type || type(p.type) === start.agent_type;
  return [...mine.filter(same), ...mine.filter((p) => !same(p))];
}

// A launch remembered by an older copy of this script has no `station`: it was research.
const stationFor = (l) => l.station ?? STATION;

/** The wall's job report when a shown agent starts. */
export function startJob(l, now = new Date()) {
  return { id: l.jobId, station: stationFor(l), label: l.label, state: "running", department: "content", lostAfterSec: AGENT_LOST_SEC, startedAt: new Date(l.at || now.getTime()).toISOString() };
}

/** The wall's job report when it finishes; the agent's last words, clipped, are its tail. */
export function doneJob(l, stop, now = new Date()) {
  const last = clip(stop?.last_assistant_message, 600);
  return { id: l.jobId, station: stationFor(l), label: l.label, state: "done", department: "content", endedAt: now.toISOString(), ...(last ? { tail: last } : {}) };
}

/** The feed line for each end of a run, in the common event format (as `job` writes them). */
export function agentEvent(kind, l, startedAt, now = new Date()) {
  const mins = startedAt ? Math.max(0, Math.round((now.getTime() - startedAt) / 60000)) : null;
  const who = stationFor(l) === HOOKS_STATION ? "Hook agent" : "Research agent";
  const text = kind === "job.started" ? `${who} started: ${l.label}` : `${who} done: ${l.label}${mins !== null ? ` (${mins} min)` : ""}`;
  return { kind, station: stationFor(l), subject: l.label, text, ts: now.toISOString() };
}
