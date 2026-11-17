# 01 Search Console access and the score

Status: ready-for-human

The agent can read Search Console without a browser, and one command gives the score.

Built on `feat/seo-agent`: `apps/seo/` (client, score, reading, check, 5 tests, CI job `seo`) and
the wizard `scripts/wizards/search-console-access.sh`.

## Left

- [ ] The founder runs `bash scripts/wizards/search-console-access.sh` in Git Bash (six stages:
      Cloud project, enable the API, service account and key, store the key, add the account in
      Search Console with Full permission, check).
- [ ] `node apps/seo/scripts/scoreboard.mjs` writes the first reading against the real API; fix
      whatever the real responses show that the mocked tests did not (field names, quotas).
- [ ] Commit the first `content/seo/scoreboard/<date>.json` as the baseline.
- [ ] The founder reads `apps/seo/targets.json` and says yes or changes it.

## Done when

`npm run check` in `apps/seo` exits 0 and a baseline reading is in `content/seo/scoreboard/`.
