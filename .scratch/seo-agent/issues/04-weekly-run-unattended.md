# 04 The weekly run, unattended

Status: ready-for-agent
Blocked by: 01

Once a week, with nobody at the keyboard: the reading is taken, the agent picks and makes one
move, a report is written, and a pull request exists.

## Work

- [ ] Project skill `.claude/skills/seo-agent/SKILL.md`: the goal, the score, the autonomy tiers
      and the never-list from the spec, the instruments, where reports go. An objective, not a
      checklist (write it with the writing-for-agents skill).
- [ ] `apps/seo/scripts/run.mjs`: take the reading, then start headless Claude Code with the
      skill in the `seo-agent` worktree on a fresh branch from `main`; one log per run under
      `logs/`. The reading is taken even when the agent step fails.
- [ ] Report `content/seo/reports/<date>.md`: the two numbers and their change, last moves and
      what they did, this week's move and what it expects, what needs the founder.
- [ ] Do-then-tell changes: the pull request merges itself when CI is green (`gh pr merge
      --auto`). Ask-first changes: left open, named in the report.
- [ ] A Windows scheduled task, weekly, "run as soon as possible after a missed start". The
      founder registers it (one command, given in the README); the agent does not change system
      settings.
- [ ] Check the wall's `paused` flag before anything outbound.

## Done when

Two consecutive weekly runs happened without anyone starting them, each leaving a reading, a
report and a pull request.
