# Deep runs, collection: pull everything our sources say

You are one of 5 parallel collectors for LlamaPoker's audience research (spec: `../spec.md`,
sources: `sources.json`, verdict `deep`). Your sources are listed in your prompt. The job is **collection in
code, wide and complete**: every item reachable for the last 12 months (2025-11-15 → today), not
a sample. Reading, tagging and saturation come later, in code, on what you collect.

**Viewer we study:** recreational players who already play and want to stop losing, plus the edge
where they start turning serious. Collect everything anyway; filtering happens later.

## How

- Write one small collector per route in `apps/research/src/collect/<route>.mjs` (Node 23, no deps
  unless needed) or `.py` (run with `py -3.11 -I`). Name no file after a Python module. Re-runnable:
  it skips ids already in the output file, so a crash resumes.
- Output: `apps/research/data/raw/<source-slug>.jsonl` (git-ignored), one item per line:

```json
{"id":"<platform-native id>","source":"<source-slug>","platform":"youtube|reddit|appstore|gplay|forum|qa",
 "kind":"post|comment|review|reply","thread_url":"<url of the video/thread/app page>","parent_id":null,
 "title":"<thread/video title or null>","text":"<verbatim, original language>","lang":null,
 "created":"YYYY-MM-DD","likes":0,"replies":0,"rating":null,"author_key":"<sha1 of username, first 12 chars>"}
```

  Never store usernames, handles or profile links: only `author_key` (hash), so we can count distinct
  voices. Keep text verbatim; no translation (that's later).
- Throttle: ≥1–2 s between requests per host, back off on 429/403, resume later. YouTube via
  `py -3.11 -m yt_dlp --skip-download --write-comments --sleep-requests 2` (it bot-walls after ~14
  videos: pause several minutes and resume; keep going).
- **Never use the Chrome browser tools** (`mcp__claude-in-chrome__*`): that is the founder's real
  profile. Never kill processes you didn't start. Temp files only in your scratch folder
  `C:\Users\matia\AppData\Local\Temp\claude\67d8e6b53b0a42bb\78ec20b6-c72c-414f-b648-d8baade484e7\scratchpad\deep-<n>\`.
- If the permission check denies a route, don't work around it: note it and move on to the next
  route or source.
- Don't commit. Don't touch other collectors' files.

## Report back (5–8 lines)

Per source: items collected, date span, distinct authors, route used, and what was blocked or
capped. List the collector files you wrote.
