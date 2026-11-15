# Source map, tier 3: judge the top sources

You are one of 8 parallel judges for LlamaPoker's audience research (spec: `../spec.md`). Tier 2
ranked 2,931 sources by numbers; you judge what numbers can't: **is this where our viewer talks,
in their own voice?** Your batch is `judge-<n>.json` in this folder (~25 sources).

**Our viewer:** recreational players who already play (home games, low-stakes apps, free-chip
apps, casino nights), know the rules but not the maths, want to stop losing; plus the edge where
they start turning serious (watching strategy content, hearing "GTO", trying a solver). Not
pros/regulars.

**For each source:** open it and **read a real sample**: 20–40 recent comments, posts, reviews or
chat lines (for a channel: the comments under 3 recent videos; for app reviews: the newest
reviews; for a forum: the latest threads and replies). Routes: WebFetch, web search, curl, and
`py -3.11 -m yt_dlp --skip-download --write-comments --extractor-args "youtube:max_comments=40"
--dump-json <video>` for YouTube comments (throttled, `--sleep-requests 2`). App Store reviews:
`https://itunes.apple.com/<cc>/rss/customerreviews/id=<appid>/sortby=mostrecent/json`. Google Play:
the store page. **Never use the Chrome browser tools** (`mcp__claude-in-chrome__*`): that is the
founder's real profile. If a source needs a login, say so and judge from what's visible.

**Score, from the sample you read (not from reputation):**

- `rec_share` 0–1: share of the voices that are recreational / beginner / improving players.
- `own_voice` 0–1: share of the sample that is people talking about their own play, feelings,
  questions, beliefs, losses (vs. spam, promo, "gg", news reposts, pure banter).
- `themes`: 3–6 short tags of what they actually talk about (e.g. "bad beats", "is the app rigged",
  "when to fold AA", "tilt", "bankroll").
- `sample_quote`: one short verbatim line typical of the voice (no usernames), with its language.
- `verdict`: `deep` (mine it in the deep runs), `maybe`, or `skip`, plus `reason`: one line.
- `route`: the exact way you got the sample (so collectors can repeat it).

**Output:** append one JSON object per source to `judged-<n>.jsonl` in this folder:

```json
{"url":"...","name":"...","rec_share":0.7,"own_voice":0.6,"themes":["bad beats","rigged?"],
 "sample_quote":{"text":"...","lang":"en"},"verdict":"deep","reason":"...","route":"yt-dlp comments"}
```

Use only your own scratch folder
`C:\Users\matia\AppData\Local\Temp\claude\67d8e6b53b0a42bb\78ec20b6-c72c-414f-b648-d8baade484e7\scratchpad\judge-<n>\`
(create it; name no helper script after a Python module) for temporary files;
never touch other agents' files, never kill processes you didn't start.

**Report back in 3–5 lines:** counts of deep/maybe/skip, the 3 best finds, anything blocked.
