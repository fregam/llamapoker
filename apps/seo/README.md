# apps/seo — the SEO agent's instruments

The agent's goal: llamapoker.com on Google's first page for the searches in `targets.json`, as
fast as honest work allows, and kept there. Spec and tickets: `.scratch/seo-agent/`. Why each
practice is in or out: `docs/research/2026-11-17-seo-reference-reels.md`.

This folder holds what the agent measures with. No dependencies; Node 20 or later.

| File | What it does |
|---|---|
| `targets.json` | The searches the agent is scored on and the page meant to win each. Changes only with the founder's yes. |
| `src/google.mjs` | Search Console API with a service-account key: `sites()`, `queries()`, `inspect(url)`. |
| `src/scoreboard.mjs` | The score, pure: target searches on page one, pages indexed, long questions shown but not clicked. |
| `src/credentials.mjs` | Finds `credentials.json` (a worktree reads the main checkout's). |
| `scripts/scoreboard.mjs` | The weekly reading: writes `content/seo/scoreboard/<date>.json`. Read-only against Google. |
| `scripts/run.mjs` | The weekly run: key check, reading, the agent step (the `seo-agent` skill, no network, no key), checks, pull request, and its reports to the wall. `--dry` prints the steps. |
| `scripts/weekly.mjs` | What the scheduled task starts: brings the checkout to `origin/main`, then starts `run.mjs` through the wall's `job` wrapper. |
| `src/wall.mjs` | What a run tells the wall, pure: the station, the `run` event, the pull request's card, the next run. |
| `scripts/wall-report.mjs` | Puts a reading already in the repo on the wall (the first one to compare against). |
| `scripts/gsc-check.mjs` | Proves the key works. Exit 0 means the agent can run unattended. |
| `scripts/gsc-store-key.mjs` | Puts a downloaded key into `credentials.json` (used by the wizard). |

```bash
npm test             # node --test, no network: the score, the wall reports, the whole run with pretend commands
npm run check        # does the key read sc-domain:llamapoker.com?
npm run scoreboard   # today's reading (add -- --dry to print only)
```

Access is set up once by the founder: `bash scripts/wizards/search-console-access.sh` (Git Bash).
The key lives only in `credentials.json` under `google_search_console`.

## Running it every week

The run needs a checkout of its own that nobody works in: the `seo-agent` worktree
(`E:\Projects\poker-trainer\.claude\worktrees\seo-agent`). Register it once, in PowerShell
(Mondays 07:00; if the PC was off, it runs at the next start):

```powershell
$a = New-ScheduledTaskAction -Execute "node" -Argument "apps/seo/scripts/weekly.mjs" -WorkingDirectory "E:\Projects\poker-trainer\.claude\worktrees\seo-agent"
$t = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 7am
$s = New-ScheduledTaskSettingsSet -StartWhenAvailable
Register-ScheduledTask -TaskName "LlamaPoker SEO agent" -Action $a -Trigger $t -Settings $s
```

A task registered before 2026-11-17 starts `run.mjs` directly: replace it (run
`Unregister-ScheduledTask "LlamaPoker SEO agent"` first, then the four lines above).
`Get-ScheduledTask "LlamaPoker SEO agent"` shows whether it is registered.

Each run leaves a reading, a report (`content/seo/reports/<date>.md`) and one pull request for
the founder to merge. Nothing merges itself. `Unregister-ScheduledTask "LlamaPoker SEO agent"`
stops it; the wall's `pause now` makes a run do nothing, while the wall is open (a closed wall
cannot be asked, so the run goes on).

`weekly.mjs` first brings the checkout to `origin/main`, so a fix to the runner merged this week
runs this week (Node reads `run.mjs` once, at start; before, a fix took effect a week late). It
skips that, and says so, when the checkout has uncommitted changes. It takes `run.mjs`'s
arguments: `node apps/seo/scripts/weekly.mjs --no-agent`.

## On the wall

Station **seo** under DEVELOPMENT (`apps/wall/README.md`, "The SEO agent"):

- While it runs: a `weekly-run` trace (the run goes through `job`; full output in
  `logs/jobs/<day>/` of this checkout). The agent step prints nothing until it ends, so the run
  may be silent for an hour before it reads as stuck; after two it is stopped and reported.
- When it ends: the station is ok with "page one 2/18, indexed 9/13" and its next run, or red with
  the reason. A Search Console key that stopped working is named as that, before any reading.
- One `run` event per run, with the reading in `meta`. From these the wall raises, on its own
  side: no run for 9 days, a page that left Google's index, a target search that left page one.
- The pull request as a card in Needs you; it clears itself when the pull request is merged or
  closed on GitHub.

The wall is usually closed at 07:00 on a Monday. Nothing is lost: the reports wait in
`logs/wall-outbox.jsonl` in the main checkout and arrive when the wall is next opened.

Rules the agent works inside: study-tool positioning; no page whose only purpose is a keyword;
every number from `apps/web/src/poker/`; no fabricated author; it never creates accounts or
posts links anywhere; site changes go through a pull request.
