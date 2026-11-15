# Deep runs, reading: one theme, read until nothing new

You are one of ~23 parallel readers for LlamaPoker's audience research. Read first:
`apps/research/codebook.md` (themes, tags, the regulars rule, source caveats) and the "Questions the
research answers" section of `.scratch/audience-research/spec.md`. Your KEY is in your prompt.

**Who we study:** recreational poker players who already play (home games, free-chip apps, low
stakes) and want to stop losing, plus the edge where they start studying. The output feeds short
video scripts: we need what they believe, ask, feel and say, in their words.

## Loop

Work from `apps/research` (worktree `E:\Projects\poker-trainer\.claude\worktrees\audience-research`).

1. `py -3.11 pipeline/batch.py <KEY> <N>` deals batch N (150 items, never overlapping) into
   `data/read/<KEY>/batch-NN.txt`. Read the whole file with the Read tool. Lines are
   `[n|source|lang] text`. Read every language yourself; do not skip non-English.
2. Update your list of **claims** (below). Count how many claims were **new** in this batch.
3. Stop when **three batches in a row add at most 2 new claims each**, or after batch 12, or when
   the dealer says no items are left. Read at least 4 batches.

## What a claim is

One distinct thing this audience believes, asks, feels, does or says, stated plainly in English,
specific enough that a script could be built on it. "Players think apps are rigged" is too wide;
"the app deals you bad hands right after you buy chips" is a claim. Kinds: `belief`, `ask`
(a question they ask), `feel`, `problem`, `behaviour` (how they play), `trigger` (the moment that
made them write), `term` (a word or phrase they use; give the phrase), `follow` (who they watch,
trust or mock, and why), `format` (what in a video or post made them react).

For each claim keep: a running count of items that support it, which sources they came from, who says
it (`rec`, `edge`, `reg` by the codebook rule), and up to 3 quotes.

## Output

Write `data/read/<KEY>/findings.json` (rewrite it after every batch, so a crash loses nothing):

```json
{"key":"RIG","batches":6,"items_read":900,"new_per_batch":[14,9,5,2,1,2],
 "claims":[{"id":"RIG-01","kind":"belief","claim":"...","count":41,
   "sources":["gp-zynga","as-wsop","rd-poker"],"who":{"rec":38,"edge":3,"reg":0},
   "quotes":[{"n":12345,"source":"gp-zynga","lang":"es","text":"verbatim, ≤200 chars","en":"English, only if not English"}]}],
 "off_theme":{"share":0.2,"what":"what the rest of the items were about"},
 "notes":"anything that surprised you, contradictions between sources, what a script should not say"}
```

Rules:

- Quotes are verbatim and short. **Never include a username, @handle, real name of a private person
  or a link**: cut them out of the quote. Public poker figures (pros, creators) may be named.
- `rg` items (chasing losses, spending to win back, can't stop): record them as claims of kind
  `problem` with `"rg": true`. They are never hooks.
- Honest counts only: count what you read, never estimate up.
- If you are a `LANG-xx` reader: also give each claim a `"theme"` field with the codebook code it
  belongs to. If you are `NOTOPIC`: say per claim which theme it belongs to, or `NEW` if none fits.
- Read-only on everything except your own `data/read/<KEY>/` folder. No commits. No web access is
  needed. **Never use the Chrome browser tools.** Never kill processes you didn't start.

## Report back (5–8 lines)

Batches and items read, the new-claims-per-batch list, the 5 strongest claims with counts, the best
quote, and anything that contradicts the codebook.
