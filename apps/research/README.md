# apps/research

Internal app, not a product: it studies the people LlamaPoker's content is for. v1 ran the audience
study of November 2026 (spec and tickets: `.scratch/audience-research/`). The same steps will run
weekly later as the research agent.

What it produces is in `content/research/audience/`: `pack.md` (read by every script agent),
`topics.md` (reel ideas), `quotes.md`, `study.md` (the report), `findings.json` (the evidence).

## One store under everything

`data/research.sqlite` (git-ignored, like all of `data/`): **items** are what people wrote (posts,
comments, reviews), **runs** log every step. No usernames ever reach the store: only `author_key`, a
hash, so distinct voices can be counted. Different people saying the same thing are never merged.

## The steps

| Step | Command (from `apps/research`) | Does |
|---|---|---|
| Rank sources | `npm run score` | Ranks candidate sources in code (`src/score.mjs`) |
| Collect | `node src/collect/<route>.mjs …` or `py -3.11 src/collect/gplay_reviews.py` | One collector per route, into `data/raw/<source>.jsonl`; re-runnable |
| Load | `py -3.11 pipeline/run.py import noise lang embed` | Store, noise marking, language, vectors (GPU) |
| Topics | `py -3.11 pipeline/topics.py` | BERTopic on a balanced sample; every item gets a topic |
| Read | `py -3.11 pipeline/batch.py <KEY> <n>` | Deals a reader agent its next batch (brief: `sources/READ-BRIEF.md`) |
| Group | `py -3.11 pipeline/group_claims.py` | Groups the readers' claims across readers |
| Synthesise | `py -3.11 pipeline/synth.py` | `findings.json` (hand-written) → verified quotes and evidence |
| Check | `npm run check` | Pack size, quote ids, leads marked, no handles or permalinks |

Collectors: `appstore-rss.mjs`, `gplay_reviews.py`, `reddit.mjs` (Arctic Shift), `discourse.mjs`,
`forum-html.mjs`, `youtube-api.mjs` (official Data API; key in the root `credentials.json`),
`chiebukuro-websearch.mjs`. `youtube.mjs` (yt-dlp) is the no-key fallback and gets bot-walled.

## Rules

- `codebook.md` is how items are read: themes, tags, source caveats, and the change log.
- A finding needs two source types; CardsChat never counts as one (its posts are rewarded).
- Responsible-gambling items are recorded and never quoted or used as hooks.
- `npm test` runs the Node and Python tests. Python 3.11 with `bertopic`, `sentence-transformers`,
  `lingua-language-detector` and a CUDA build of `torch`.

Not built yet: wall `job` logging for each step, and phase 2 (TikTok, Instagram and other
login-walled platforms through the research browser profile).

## Where the data is

`apps/research/data/` is git-ignored and exists only in the checkout that ran the study (the
`audience-research` worktree): raw collector files (672,000 items), the store, the vectors, the
readers' batches and findings. Deleting that worktree deletes it. Everything a script needs is in
`content/research/audience/`; `claims.md` there keeps what two or more readers said. Collecting
again takes a few hours (r/poker comments are the slow part).
