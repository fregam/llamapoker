# Spec: audience research (`apps/research`, v1 = the audience study and the script pack)

Status: ready-for-agent
Grilled with the founder 2026-11-14. Comes before the factory's script stage: reel 002's script
failed the loop / open-question / one-payoff checks, and no script so far was written from what
viewers actually say.

## Problem

Scripts are written from our own idea of the viewer. We don't know how our viewers talk, what they
believe, what hurts, why they want to understand, how and why they play, who they follow, or how
they feel at the table. A hook that doesn't speak the viewer's language flops, however good the
motion.

## Goal

A quote-backed picture of our viewers that the script stage reads cheaply. Every claim traces to
real public words, and a script agent loads a ~2,500-token pack instead of the research.

## Decisions

- **Not a product.** It's an internal app, `apps/research`, like `apps/wall`: own README, store,
  one module per source, tests. v1 runs the study once. The same app later becomes the weekly
  research agent (`docs/operating-brief.md` item 3) without a rewrite. Selling it stays an idea in
  `docs/vision.md`.
- **Assemble, don't build.** Collectors and topic modelling come from existing tools. We write
  only what is ours: the store, the shared tag list (codebook), the viewer filter, the rules, and
  the pack and topics generator.
- **Claude approves the sources** against a written scale, with a one-line reason per source. The
  founder gets the ranked list to read and may veto any source, but doesn't have to sign it off.
- **Who:** recreational players who already play (home games, low-stakes apps, the odd casino
  night), know the rules but not the maths, and want to stop losing. **Edge:** where they start
  turning serious (watching strategy content, hearing "GTO" without getting it, bouncing off a
  solver). Full regulars (multi-tabling, coaching clients) are out.
- **Sources are found in any language.** Findings are tagged by market (US its own section, UK/EU,
  Canada, Australia, India, Spain, Latin America, plus whatever the source map turns up). Reels
  stay English; the other markets show whether a second language would pay.

## Questions the research answers

From the founder:
- how they talk and which terms they use
- what problems they have
- what they want to understand, and why
- how they play, and why they play like that
- who they follow, and what they see there
- how they feel when they play, in every situation of play

Added:
- myths they believe
- where they play, at what stakes, in which format
- what they tried before to learn, and why they quit
- the trigger moments that send them searching
- questions too embarrassing to ask
- who they trust, and who they mock
- which hooks and formats stop them in a feed
- responsible-gambling signals (tilt, chasing losses, escape), so we know where helping ends

## The split

| Plain code (cheap, exact, repeatable) | AI: Claude agents (judgement) |
|---|---|
| Fetching: YouTube Data API, Reddit API, yt-dlp transcripts, Agent-Reach (phase 2), MediaCrawler only if the source map ranks Chinese platforms high | Finding and scoring sources in any language |
| Storage: SQLite. Duplicates and themes: local multilingual embeddings. Language detection | Viewer or regular? A keyword pre-filter in code first ("HUD", "solver", multi-tabling, stake sizes); AI judges only the unclear cases |
| Engagement weighting, search-demand numbers (Trends, autocomplete) | Tagging quotes with the shared tag list |
| When to stop: BERTopic counts new themes per batch | Translating while keeping the original |
| Rules: a finding needs two types of source; pack size limit; privacy check (`check` script) | Writing the study, profiles, glossary and topics |
| Every step logs to the wall (`job`); the weekly schedule comes later | |

## Method

0. **Tool check (hours, not a survey).** Confirm BERTopic, the YouTube and Reddit APIs (free
   quotas, terms), yt-dlp and Agent-Reach do what we need: licence, upkeep, limits. Obsei gets a
   look as an optional collector. Out: last30days (30-day window, paid keys; maybe for the weekly
   scan) and the social-listening apps (built for brand mentions). Output: one note in
   `docs/research/`.
1. **Source map, three tiers.** The unit is one community or comment section (a subreddit, a forum
   section, a channel, an app's reviews), and the universe is ~1,000–2,000 candidates across
   languages.
   - **Find everything** (6–8 parallel agents, one per platform family × language group, plus API
     searches and directories): every candidate with its numbers (followers, posts a week, comments
     a post, last activity, language, access, tool route).
   - **Score in code:** a formula ranks all candidates on activity, recency, comment density and
     reachability. No Claude usage.
   - **AI judges the top ~200** (~8 parallel agents, ~25 sources each): sample each and score the
     share of recreational players, own-voice density and tone, with a one-line reason.
   Output: ranked `sources.json`. Deep runs then cover 30–60 communities.
2. **Pilot.** One agent reads the 2–3 top sources and drafts the codebook (theme tags). Later agents
   use it. New tags are allowed but logged.
3. **Deep runs.** One agent per source, in batches, original text plus English translation. Each
   run stops when three batches in a row add almost no new themes. Big sources go deep, thin ones
   stop early.
4. **Synthesis.** Remove duplicates, check tags, apply the two-source-types rule, then write the
   four outputs.

**Phase 1** (now) covers everything public and reachable through APIs or page fetches. **Phase 2**
starts after the founder creates the research browser profile (a wizard is provided): TikTok,
Instagram and X comments via Agent-Reach, and creator stats via Osintgram with the cost quoted
first. Both follow brief item 3: read-only, pinned version, install script read first,
research-only profile, no contact/follower/network/location lookups. Phase 1 findings are marked
"no short-video comments yet" until phase 2 lands.

**Our own data**: trainer mistakes, calculator spots, and a "what hand keeps beating you?" question
in the welcome email. These are proposed, not built: the email is outward-facing and needs the
founder's yes.

## Agents

Parallel where the work is independent; code wherever the work is mechanical (fetching, scoring,
counting, de-duplicating, checking). Every agent gets a brief with paths, not pasted content,
writes its output to the store or a file, and reports back in 3–5 lines. Lighter effort for
find-and-list work; higher effort only for the codebook (06) and synthesis (08). Tagging is
cluster-then-sample: embeddings group the quotes, agents tag representative samples per cluster.

Expected scale (saturation decides): 30,000–100,000 raw items, 3,000–8,000 tagged quotes, 200–400
cited, 40–80 ranked reel ideas, a 15–25 page study.

## Privacy (the repo is public)

- The store (`apps/research/data/*.sqlite`) is git-ignored.
- What gets committed (pack, topics, study) quotes verbatim but never usernames or handles. It
  links the thread or video, never the comment permalink, and holds nothing about any individual.
- A quote that could identify a person is paraphrased and marked so.
- The check script fails on `u/`, `@handle` or a comment-permalink pattern.

## Output: optimised for script generation

| Where | Read by | Shape |
|---|---|---|
| `apps/research/data/research.sqlite` (git-ignored) | code, and agents by query | sources, items, quotes (id, verbatim, English, market, source type, segment, tags, engagement, thread url, month) |
| `content/research/audience/pack.md` | **every script agent** | ≤ 2,500 tokens: 3–5 profiles (3 lines each), their words → the term (glossary), top myths, top pains, tone notes, words to avoid; each line cites quote ids |
| `content/research/audience/topics.md` | the script agent, one entry at a time | ranked reel ideas, one line each: id, the viewer's problem, profile, the belief to correct, quote ids |
| `content/research/audience/quotes.md` | agents, grep by id | the quotes cited in the pack and topics, verbatim + English (the committed subset of the store) |
| `content/research/audience/study.md` | the founder | the full report per question and market, with evidence |

A script agent gets `pack.md` plus one `topics.md` entry, and greps `quotes.md` for the cited ids
when it needs the exact words. Pass paths, never copies.

## Done when

- Phase 1: every question has evidence from at least two source types; the four content files are
  written; the check passes (pack under budget, every cited id exists, no handles); the founder has
  read `study.md`.
- Phase 2: short-video comment quotes added, the files regenerated, and a before/after note on what
  changed.

## Out of scope

- The script stage itself: the brief, the approval gate, the script checks. That's the next
  feature, and it picks up the parked question "is the brief approved before the script?".
- The weekly scheduler. Posting.

## Risks

- Some sites block automated fetches. When one refuses, move on; never work around it.
- Forum voices skew older and more serious. The two-source-types rule and phase 2 correct this.
- API quotas: YouTube gives 10,000 units a day. Runs are spread over days if needed.
