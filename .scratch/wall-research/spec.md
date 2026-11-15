# Research on the wall

Status: done (2026-11-15)

## Question

"Is research being done right now, and did it finish?" The founder: "the wall needs to say when
research is being done". Research is done by Claude subagents (the audience study's discovery,
judging and deep-run agents, `.scratch/audience-research/spec.md`), which `job` can't wrap, so
the wall never saw it.

## Decision (grilled 2026-11-15)

One trace per research agent under a `research` station in Work (CONTENT): its task, running or
done, how long. Chosen over one summary line and over showing every subagent.

## Source

Claude Code hooks, set once at user level so they fire in every checkout and worktree:
PreToolUse on `Agent|Task` (the only event carrying the description and prompt), SubagentStart
(the agent began, `agent_id`), SubagentStop (it finished, also for background agents).
SubagentStart has no prompt, so it claims the oldest waiting launch of its session and type;
claiming is a file rename under `apps/wall/logs/agents/`, safe for parallel launches.

## Shape

- Reporter `apps/wall/scripts/claude-agents.mjs` (pure half `claude-agents-lib.mjs`, tests in
  `claude-agents.test.mjs`): research by type, words (research, discover, scrape, audience,
  codebook, deep dive, bake-off, literature, competitor, tool check) or paths (`apps/research`,
  `docs/research`, `content/research`, the audience-research worktree). Posts a running job on
  start and done on stop (the agent's last words as the tail), plus `job.started` / `job.done`
  feed lines. Async hooks: never slows a session; wall down = nothing shown.
- Store: jobs get `lost_after` (migration 0006). An agent reports only at start and end, so it may
  be silent 90 minutes before reading as lost, instead of the wrapper's 2-minute heartbeat.
- Derive: `research` is CONTENT; a lost agent is an amber threat ("no finish reported in 90
  min", check the session), not red: a closed session is a question, not a broken job.

## Not done

- No heartbeat while an agent runs (a hook on every tool call costs more than it tells).
- Non-research subagents stay off the wall.
