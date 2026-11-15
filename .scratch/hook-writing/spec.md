# Spec: hook writing (the first slice of the script stage)

Status: ready-for-agent
Grilled with the founder 2026-11-15. The script stage that `.scratch/audience-research/spec.md`
left out of scope starts here, with the hook alone.

## Problem

Reel 002 failed the loop, open-question and one-payoff checks in its hook, and every hook so far
was written from our own idea of the viewer. The founder wants to see what kind of hooks the
system will write before the research finishes, and to be sure they're better than the generic
tools: Sky Tan's "How to write a 10/10 hook" reel (2026-11-07) and the
[viral-hooks-skill](https://github.com/rediumvex/viral-hooks-skill) repo (100 templates).

## What we take from them, and where we go past them

- **Sky Tan's ladder** (the method): topic (2/10) → framed as a problem (3) → exaggerated and made
  vivid (6) → names the thing they already tried, as the villain (8) → an open loop with a
  reframe (10). Example: "If you lie in bed for hours every night wide awake and melatonin doesn't
  even work anymore, it's not your bedtime that's the problem…"
- **The repo's ten categories** (curiosity, contrarian, negation, specificity…) are vocabulary for
  variety only, never fill-in templates. Its fake authority, invented stats and confessions are out.
- **Past both:** the villain rung comes from real viewer words (the research store), every number
  is computed by our engine, and a hook passes written checks before anyone reads it.

## Decisions

1. **Scope:** hooks only. The body, outro and loop are the next slice, and must close the hook's
   open question. The parked question "is the brief approved before the full script?" goes there.
2. **Method:** build up the ladder. A hook below the villain rung is out.
3. **A hook is its spoken line.** The founder reads lines only; headline and first frame belong to
   the motion stage. The writer still records, per hook, its **promise** (the number or claim),
   the **fact ids** each number comes from, its **open question** and its **rung**, for the checks.
4. **Inputs per topic:**
   - a **fact sheet** computed by the engine (`apps/web/src/poker/`): every number a hook may use;
   - an **evidence file** of real quotes pulled from the research store (no handles, no
     problem-gambling quotes);
   - a **control run** gets the same fact sheet and no evidence file.
5. **Length:** the promise lands within the first 7 words (~3 s at 2.4 words/s); the whole hook is
   at most 25 words (~10 s), and every clause after the promise adds a rung.
6. **Where helping ends:** a hook may name a loss to explain a decision; the promise is always
   understanding. Never winning money back, a loss as a reason to play more, or poking someone who
   sounds in trouble. Quotes that read as problem gambling (chasing, escape, "can't stop") are kept
   out of the evidence file, not just avoided.
7. **Home (for now):** the method is a project skill, `.claude/skills/hook-writing/`; the code is
   `apps/reels/scripts/hooks/`; results go to `content/hooks/`. It moves out of `apps/reels` when
   the content factory needs hooks for letters and posts. Keep that in mind when naming things.
8. **Validation has two levels.** The founder's blind read picks the method (research or not, raw
   quotes or pack). Only retention on posted reels can promote a hook rule into the reels README,
   the bar `apps/reels/CLAUDE.md` sets for every rule.

## The checks (a hook must pass all of them to reach the founder)

| # | Check | By |
|---|---|---|
| 1 | Every number in the line equals the value of the fact it cites (`fact_ids`); a number with no cited fact fails | code |
| 1b | The line's claim is that fact's claim, conditions included ("85 % to win heads-up", not "you lose 85 %"; "four random hands", not "four callers") | critic |
| 2 | Brand and positioning: no luck talk, gambling glamour or cash, nothing implying use during real-money play, no handles | code |
| 3 | Length: promise within 7 words, at most 25 words | code (promise position from the writer's record) |
| 4 | One gap: exactly one open question | critic |
| 5 | The gap is not answered in the hook (the promise may show; the *why* may not) | critic |
| 6 | One payoff a single reel can close, and the last line can lead back into the hook | critic |
| 7 | Ladder height: villain rung or higher | critic |
| 8 | Honest voice: nothing LlamaPoker can't truthfully say (no "I grew to 100K", fake confessions, "I cried writing this") | critic |
| 9 | Where helping ends (decision 6) | critic |

The critic is a separate agent from the writer. Every failure is logged with the hook, the check
and the reason, so we can see what the writer keeps getting wrong.

**The critic is calibrated before it judges anything.** Known cases, each with its expected
verdict: reel 002's real hook must fail checks 5 and 6; Sky Tan's 2/10 line must sit at the topic
rung and his 10/10 line at the reframe rung; the grill's own example ("Pocket aces. 85% to win. So
why do they keep cracking on you? It's not the deck. It's how many players you let in.") must fail
check 5, because its last clause gives the answer away. A critic that misses any of them is fixed
before the run.

## The test

- **Topics, stated neutrally** (both arms get the same one-line statement; the viewer's belief and
  villain must come from evidence or the writer's own idea, never from the topic line):
  (a) "only playing premium hands" (reel 002's idea; facts: one premium every ~39 hands, the blinds
  paid while waiting, ~10 bb);
  (b) "how often pocket aces win" (facts: AA vs 1 to 4 random hands, ~85 % heads-up down to ~56 %
  against four; random hands, not callers);
  (c) "how often a draw comes in" (facts: a flop flush draw hits ~35 % by the river).
- **Per topic, two runs** (research and control). Each run: the writer drafts ~20 hooks up the
  ladder → code checks → critic → the best 5 go forward. If fewer than 5 pass, the writer gets one
  retry with the failure reasons, the same for both arms; still short, the run shows what passed.
- **No leaks between the arms.** Writers are fresh agents (never forks of a session that has read
  the research), with identical briefs except the evidence path. The critic ranks blind: drafts
  reach it with `quote_ids` stripped and no arm label, and it never sees the evidence file.
- **The read:** a private review page, one topic at a time, 10 spoken lines shuffled and
  unlabelled. The founder picks a top 3 and strikes any they'd never post. The page reveals the
  labels only after the picks are saved, and it stores the picks so Claude can read them.
- **Rule, fixed before the results:** research wins if its hooks take at least 2 of the top 3 in at
  least 2 of the 3 topics, and it gets no more strikes than the control.
  - Win → evidence is required on every hook run, and the three topics are rerun on
    `content/research/audience/pack.md` once synthesis lands (does the tagged pack beat raw quotes?).
  - Lose or tie → read the picks and strikes before building further: is the evidence pull weak,
    or does the ladder alone carry the hooks?
- Thirty lines is a signal, not proof. With 5 against 5, the rule passes by chance about half the
  time, so the verdict is written as a direction; the strikes and the failure log carry as much
  weight as the count.

## Later (not this feature)

- Every posted reel records the hook it used (line, rung, evidence ids). When the Instagram fetcher
  brings retention in, read the 0–3 s drop per hook (`docs/research/2026-11-14-iart-video-skills.md`,
  item 6). Needs the fetcher.
- The body, outro and loop slice; the brief and its approval gate.

## Privacy (the repo is public)

Committed files (evidence, hooks, logs) quote viewers verbatim but never with usernames, handles or
comment permalinks, following `.scratch/audience-research/spec.md` "Privacy". A quote that could
identify a person is paraphrased and marked so. The research store stays git-ignored, and the
scripts open it read-only (collectors write to it while they run). Before the first push that
carries an `evidence.md`, the founder confirms committing verbatim quotes is fine.

## Done when

- The three scripts and the skill exist, scripts tested.
- The test has run: `content/hooks/2026-11-<dd>-test/` holds per topic the fact sheet, the evidence
  file, every draft with its record, the failure log and the 10 hooks shown.
- The founder has read and picked; the verdict against the rule is written in the same folder and
  in `docs/decisions.md`.
