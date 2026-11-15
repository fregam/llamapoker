# Claude plan limits on the wall

Status: done (shipped in PR #36, 2026-11-15)

## Question

"Can I start a big Claude session now?" The founder asked for "my Claude usage on the wall" and
chose plan limits (5-hour and weekly windows, with reset times) over token counts or an API-price
cost-equivalent.

## Source

Claude Code's status line input (`rate_limits.five_hour` / `seven_day`: `used_percentage`,
`resets_at` in epoch seconds). Present only for subscribers, after the session's first API
response, and per window only until its reset passes. Confirmed on a captured payload
(Claude Code 2.1.325). Not used: the private `/api/oauth/usage` endpoint, local transcript tokens.

## Shape

- Reporter `apps/wall/scripts/claude-statusline.mjs` (pure half `claude-statusline-lib.mjs`):
  prints the line, posts `usage` events on change or every 10 min, 1.5 s timeout, 5 min backoff.
  A missing window is never sent as zero.
- Store: newest `usage` event per window; `usage` kept out of the feed.
- Derive: `claudeLimits` (a dash once a window has reset), `claudeStation` (ok / idle after 1 h /
  nodata), threats (amber 90% 5-hour, 80% weekly; red at 100%).
- Panel: Experiments and budget, two meters with reset times in UTC; older snapshots say "not
  recorded on this day".
