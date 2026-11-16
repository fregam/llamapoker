# 01 Corpus store and fetcher

Status: ready-for-agent
Type: task

`apps/reels/scripts/hooks/corpus.py`: a git-ignored SQLite store (`apps/reels/scripts/hooks/data/corpus.sqlite`)
with `accounts` (username, followers, media_count, checked, source, note) and `reels` (shortcode,
username, timestamp, views, likes, comments, caption, permalink, outlier, funnel, sampled).
`corpus.py fetch <username>...` pages Business Discovery (token from `credentials.json`), stores
reels, computes the account median over its last ≤ 60 reels, flags outliers (≥ 100k and ≥ 5×) and
funnels. Throttled under ~200 calls/hour. Tests first on the pure parts: median, outlier, funnel,
pagination merge.
