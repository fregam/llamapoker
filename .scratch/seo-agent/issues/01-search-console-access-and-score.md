# 01 Search Console access and the score

Status: ready-for-human (only the last box is open)

The agent can read Search Console without a browser, and one command gives the score.

Built on `feat/seo-agent`: `apps/seo/` (client, score, reading, check, 5 tests, CI job `seo`) and
the wizard `scripts/wizards/search-console-access.sh`.

## Left

- [x] The founder ran the wizard 2026-11-17; the key reads `sc-domain:llamapoker.com` as a full
      user (a service account was accepted as a Search Console user).
- [x] First reading against the real API: the client needed no changes.
- [x] Baseline committed: `content/seo/scoreboard/2026-11-17.json`. 3 of 13 indexed, 0 of 18 on
      page one, 32 impressions and 0 clicks in 28 days. Closest targets: "pot odds formula" at
      21.3 (4 impressions), "poker outs" at 74.3 (15 impressions).
- [ ] The founder reads `apps/seo/targets.json` and says yes or changes it.

## Done when

`npm run check` in `apps/seo` exits 0 and a baseline reading is in `content/seo/scoreboard/`.
