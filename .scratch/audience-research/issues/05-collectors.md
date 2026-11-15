# 05 Phase 1 collectors

Status: resolved
Type: task
Blocked by: 02, 04

One module per source route chosen in 04 (YouTube API, Reddit API, yt-dlp, page fetch). Store raw
items with engagement and thread url, language detected, duplicates merged by embedding. Respect
quotas and refusals; never work around a block.

## Answer (2026-11-15)

Collectors in `apps/research/src/collect/`: `appstore-rss.mjs`, `gplay_reviews.py`, `reddit.mjs`
(Arctic Shift), `discourse.mjs`, `forum-html.mjs` (CardsChat, GipsyTeam), `chiebukuro-websearch.mjs`,
`youtube-api.mjs` (official Data API key; yt-dlp bot-walled after one video per channel, `youtube.mjs`
kept only as the no-key fallback). Output `data/raw/<slug>.jsonl`, schema in `sources/DEEP-BRIEF.md`.
Language and duplicates moved to the pipeline (`lang`, `noise` steps).
Known caps: App Store feed stops at 500 reviews per country; WSOP Play English reaches mid-March only;
Chiebukuro is titles and snippets only (pages 403).
