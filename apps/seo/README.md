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
| `scripts/gsc-check.mjs` | Proves the key works. Exit 0 means the agent can run unattended. |
| `scripts/gsc-store-key.mjs` | Puts a downloaded key into `credentials.json` (used by the wizard). |

```bash
npm test             # node --test, no network
npm run check        # does the key read sc-domain:llamapoker.com?
npm run scoreboard   # today's reading (add -- --dry to print only)
```

Access is set up once by the founder: `bash scripts/wizards/search-console-access.sh` (Git Bash).
The key lives only in `credentials.json` under `google_search_console`.

Rules the agent works inside: study-tool positioning; no page whose only purpose is a keyword;
every number from `apps/web/src/poker/`; no fabricated author; it never creates accounts or
posts links anywhere; site changes go through a pull request.
