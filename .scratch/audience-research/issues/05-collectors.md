# 05 Phase 1 collectors

Status: ready-for-agent
Type: task
Blocked by: 02, 04

One module per source route chosen in 04 (YouTube API, Reddit API, yt-dlp, page fetch). Store raw
items with engagement and thread url, language detected, duplicates merged by embedding. Respect
quotas and refusals; never work around a block.
