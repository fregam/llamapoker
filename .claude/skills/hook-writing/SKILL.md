---
name: hook-writing
description: Write and judge reel hooks (the spoken opening line) for LlamaPoker. Use when writing hooks for a reel topic, running a hook test, or judging hook drafts.
---

# Hook writing

A **hook** is the spoken opening line of a reel: what the voice says in the first 3–10 seconds.
Headline and first frame belong to the motion stage. Spec and its reasons:
`.scratch/hook-writing/spec.md`.

## The ladder

Every hook is built by climbing it. Sky Tan's sleep example shows the rungs:

| Rung | What it adds | Sleep example |
|---|---|---|
| 1 topic | the subject | "5 tips to sleep better" (2/10) |
| 2 problem | framed as the viewer's problem | "If you can't fall asleep at night, here's why" (3) |
| 3 vivid | exaggerated, specific, felt | "If you lie in bed for hours every night, wide awake…" (6) |
| 4 villain | the thing they already tried, named as what fails them | "…and melatonin doesn't even work anymore" (8) |
| 5 reframe | an open loop: the real cause is elsewhere, and only the reel's end says where | "…it's not your bedtime that's the problem, it's what you do the first hour after" (10) |

A hook ships at rung 4 or 5.

## Rules every hook keeps

- **Promise early, gap open.** The promise (a number from the fact sheet, or a claim) lands within
  the first 7 words; the whole hook is at most 25. Every clause after the promise climbs a rung.
  The promise may show; the *why* stays open until the reel's last line, which leads back into
  the hook.
- **One gap, one payoff.** One open question per hook, one idea per reel.
- **Proven numbers.** Every number is a fact from the topic's `facts.json`, said with that fact's
  conditions.
- **Honest voice.** LlamaPoker explains; it has no wins to brag about and no confessions to make.
  Voice and banned ground: `brand/README.md`. Luck is named only to be denied.
- **Understanding is the promise.** A hook may name a loss to explain a decision. It never offers
  winning money back, uses a loss as a reason to play more, or pokes at someone who sounds in
  trouble.

## Run order (one topic, one arm)

Paths are under `content/hooks/<run>/<topic>/`; scripts are in `apps/reels/scripts/hooks/`.

1. **Facts:** `npx tsx scripts/hooks/facts.ts <topic> <dir>` from `apps/reels` → `facts.json`.
2. **Evidence** (research arm only): `python -I evidence.py <topic> <dir>` → `evidence.md`.
3. **Write:** dispatch a fresh agent with [writer.md](writer.md), the neutral topic line, and the
   paths. It writes `<arm>/drafts.json`. Done when it holds ~20 drafts, each with a full record.
4. **Code checks:** `python -I check.py <dir>/<arm>` → `checks.json`, failures appended to
   `<arm>/failures.md`.
5. **Critic:** dispatch a fresh agent with [critic.md](critic.md), the facts path and the drafts
   that passed step 4, with `quote_ids` stripped and no arm label. It writes `<arm>/critic.json`
   and appends its failures to `failures.md`. Done when every draft has a verdict on every check.
6. **Best 5:** the critic's top 5 passing drafts → `<arm>/best.json`. Fewer than 5 → one retry of
   step 3 with `failures.md` as extra input, then steps 4–5 on the new drafts; still short, keep
   what passed.

Before the first run of a session, the critic passes [calibration.json](calibration.json): run it
on those cases and compare with the expected verdicts.
