import { describe, expect, it } from "vitest";
import { AGENT_LOST_SEC, PENDING_TTL_MS, agentEvent, candidates, doneJob, isResearch, labelOf, launch, startJob } from "./claude-agents-lib.mjs";

const now = new Date("2026-11-15T18:00:00Z");
const t = now.getTime();

// The shape of a PreToolUse payload on the Agent tool (trimmed).
const pre = {
  hook_event_name: "PreToolUse",
  session_id: "s1",
  tool_use_id: "toolu_01AbC",
  cwd: "E:\\Projects\\poker-trainer\\.claude\\worktrees\\audience-research",
  tool_name: "Agent",
  tool_input: { description: "Discover Reddit sources", prompt: "Find every poker community on Reddit...\nWrite rows to raw-reddit.jsonl", subagent_type: "general-purpose" },
};

describe("isResearch", () => {
  it("knows research by its words, its type, or where it works", () => {
    expect(isResearch({ description: "Discover Reddit sources" })).toBe(true);
    expect(isResearch({ description: "Judge 25 sources", prompt: "Read .scratch/audience-research/sources/judge.json" })).toBe(true);
    expect(isResearch({ description: "x", subagent_type: "deep-research" })).toBe(true);
    expect(isResearch({ description: "Score batch 3" }, "E:\\Projects\\poker-trainer\\.claude\\worktrees\\audience-research")).toBe(true);
    expect(isResearch({ description: "Research Remotion transitions" })).toBe(true);
  });
  it("leaves ordinary code work off the research station", () => {
    expect(isResearch({ description: "Fix the hero layout", prompt: "Edit apps/web/src/components/Hero.astro" }, "E:\\Projects\\poker-trainer")).toBe(false);
    expect(isResearch({ description: "Review PR #36", subagent_type: "Explore" })).toBe(false);
    expect(isResearch(undefined)).toBe(false);
  });
});

describe("labelOf", () => {
  it("uses the description, else the prompt's first line, on one clipped line", () => {
    expect(labelOf(pre.tool_input)).toBe("Discover Reddit sources");
    expect(labelOf({ prompt: "\n  Find YouTube channels\nmore" })).toBe("Find YouTube channels");
    expect(labelOf({ description: "a".repeat(200) })).toHaveLength(120);
    expect(labelOf({})).toBe("research agent");
  });
});

describe("launch and candidates", () => {
  it("remembers the launch under a job id from the tool call", () => {
    expect(launch(pre, now)).toEqual({ jobId: "agent-toolu_01AbC", session: "s1", type: "general-purpose", label: "Discover Reddit sources", research: true, at: t });
  });
  it("gives a starting agent the oldest waiting launch of its session and type", () => {
    const pending = [
      { jobId: "agent-b", session: "s1", type: "general-purpose", at: t - 2000 },
      { jobId: "agent-a", session: "s1", type: "general-purpose", at: t - 5000 },
      { jobId: "agent-other", session: "s2", type: "general-purpose", at: t - 9000 },
      { jobId: "agent-explore", session: "s1", type: "Explore", at: t - 9000 },
      { jobId: "agent-default", session: "s1", type: null, at: t - 1000 },
    ];
    expect(candidates(pending, { session_id: "s1", agent_type: "general-purpose" }, t).map((p) => p.jobId)).toEqual(["agent-a", "agent-b", "agent-default"]);
    expect(candidates(pending, { session_id: "s1", agent_type: "Explore" }, t).map((p) => p.jobId)).toEqual(["agent-explore"]);
  });
  it("forgets a launch no agent claimed in time", () => {
    expect(candidates([{ jobId: "agent-old", session: "s1", type: null, at: t - PENDING_TTL_MS }], { session_id: "s1" }, t)).toEqual([]);
  });
});

describe("what the wall is told", () => {
  const l = launch(pre, new Date(t - 30 * 60000));
  it("starts a running trace under research, in CONTENT, with the agent's long lost limit", () => {
    expect(startJob(l)).toEqual({ id: "agent-toolu_01AbC", station: "research", label: "Discover Reddit sources", state: "running", department: "content", lostAfterSec: AGENT_LOST_SEC, startedAt: "2026-11-15T17:30:00.000Z" });
  });
  it("finishes it with the agent's last words as the tail, when the build sends them", () => {
    expect(doneJob(l, { last_assistant_message: "Wrote 212 rows.\nDone." }, now)).toEqual({ id: "agent-toolu_01AbC", station: "research", label: "Discover Reddit sources", state: "done", department: "content", endedAt: "2026-11-15T18:00:00.000Z", tail: "Wrote 212 rows. Done." });
    expect(doneJob(l, {}, now)).not.toHaveProperty("tail");
  });
  it("writes a feed line at each end, with the run's length at the finish", () => {
    expect(agentEvent("job.started", l, null, now).text).toBe("Research agent started: Discover Reddit sources");
    expect(agentEvent("job.done", l, t - 30 * 60000, now)).toEqual({ kind: "job.done", station: "research", subject: "Discover Reddit sources", text: "Research agent done: Discover Reddit sources (30 min)", ts: "2026-11-15T18:00:00.000Z" });
  });
});
