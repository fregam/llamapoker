# 04 The weekly run, unattended

Status: ready-for-agent
Blocked by: 01

Once a week, with nobody at the keyboard: the reading is taken, the agent picks and makes one
move, a report is written, and a pull request exists.

## Built on `feat/seo-agent` (dry-run only so far)

- `.claude/skills/seo-agent/SKILL.md`: the goal, the score, how to choose the move, the limits.
- `apps/seo/scripts/run.mjs`: pause check, fresh branch, reading, agent step under a tool
  allowlist (no network, no push, no key), the site's checks, push, pull request, wall station.
- The scheduled-task command, in `apps/seo/README.md`.

## First real run, 2026-11-17

Reading, branch, push and pull request worked. The agent step failed on the Claude plan's 5-hour
limit and the runner still said "done": fixed, a failed agent step now ends the run failed (exit
1, station red) with the reading's pull request kept, and a second run on the same day updates
that day's pull request. The plan limit is a real way for an unattended run to fail: schedule it
for an hour when nobody is using Claude (Monday 07:00 as proposed).

## Left

- [ ] First real run, watched: needs ticket 01's key and this branch merged (the run starts from
      `origin/main`). Check in particular that the allowlist and the two `Read(...)` denials hold
      in headless mode, that the skill loads, and that the pull request opens.
- [ ] The founder registers the scheduled task.
- [x] Run through `job` so it shows as a trace on the wall (ticket 05): `scripts/weekly.mjs`,
      which the scheduled task now starts.

## Original work list

- [ ] Project skill `.claude/skills/seo-agent/SKILL.md`: the goal, the score, the autonomy tiers
      and the never-list from the spec, the instruments, where reports go. An objective, not a
      checklist (write it with the writing-for-agents skill).
- [ ] `apps/seo/scripts/run.mjs`: take the reading, then start headless Claude Code with the
      skill in the `seo-agent` worktree on a fresh branch from `main`; one log per run under
      `logs/`. The reading is taken even when the agent step fails.
- [ ] Report `content/seo/reports/<date>.md`: the two numbers and their change, last moves and
      what they did, this week's move and what it expects, what needs the founder.
- [ ] Every pull request is left open for the founder (spec decision 2). Self-merge for small
      technical changes is a proposal for after four clean runs, not built.
- [ ] A Windows scheduled task, weekly, "run as soon as possible after a missed start". The
      founder registers it (one command, given in the README); the agent does not change system
      settings.
- [ ] Check the wall's `paused` flag before anything outbound.

## Done when

Two consecutive weekly runs happened without anyone starting them, each leaving a reading, a
report and a pull request.
