---
name: hook-writing
description: Write and judge reel hooks (the spoken opening line) for LlamaPoker. Use when writing hooks for a reel topic, running a hook test, or judging hook drafts.
---

# Hook writing

A **hook** is the spoken opening line of a reel: what the voice says in the first 3–10 seconds.
Headline and first frame belong to the motion stage. Spec and its reasons:
`.scratch/hook-writing/spec.md`.

## The goal

**A hook that makes a poker player who doesn't follow us stop scrolling and stay.** Everything
below serves that goal; when a craft note makes a hook worse, break the note, not the hook.

Read [content/research/hooks/playbook.md](../../../content/research/hooks/playbook.md) first: what
911 real reels showed. In short, the opening is aimed at a stranger, built as a scene or a stake
rather than a fact, and names something the viewer has lived. No single move (a number, a question,
a claim) makes a hook on its own.

## Hard limits (never broken)

- **True.** Every number is a fact from the topic's `facts.json`, with that fact's conditions.
  Numbers are optional.
- **Honest voice.** LlamaPoker explains; it has no wins to brag about and no confessions to make.
  Voice and banned ground: `brand/README.md`. Luck is named only to be denied.
- **Understanding is the promise.** A hook may name a loss to explain a decision. It never offers
  winning money back, uses a loss as a reason to play more, or pokes at someone who sounds in
  trouble.

## Craft notes (breakable)

- One open question per hook, closed by one idea in a reel of about a minute.
- Sky Tan's ladder is a useful way to sharpen a line: topic → problem → vivid → the thing they
  already tried (villain) → reframe. A hook can be great without climbing it.
- Spoken English, read aloud at about 2.4 words a second.

## Run order (one topic, one arm)

Paths are under `content/hooks/<run>/<topic>/`; scripts are in `apps/reels/scripts/hooks/`.

1. **Facts:** `npx tsx scripts/hooks/facts.ts <topic> <dir>` from `apps/reels` → `facts.json`.
2. **Evidence** (research arm only): `python -I evidence.py <topic> <dir>` → `evidence.md`.
3. **Write:** dispatch a fresh agent with [writer.md](writer.md), the neutral topic line, and the
   paths. It writes `<arm>/drafts.json`. Done when it holds ~20 drafts, each with a full record.
4. **Code checks (truth and brand only):** `python -I check.py <dir>/<arm>` → `checks.json`,
   failures in `<arm>/failures.md`.
5. **Critic:** dispatch a fresh agent with [critic.md](critic.md), the facts path and the drafts
   that passed step 4, with `quote_ids` stripped and no arm label. It writes `<arm>/critic.json`
   and appends its failures to `failures.md`. Done when every draft has a verdict and the passing ones are ranked.
6. **Best 5:** the critic's top 5 passing drafts → `<arm>/best.json`. Fewer than 5 → one retry of
   step 3 with `failures.md` as extra input, then steps 4–5 on the new drafts; still short, keep
   what passed.

Before the first run of a session, the critic passes [calibration.json](calibration.json): run it
on those cases and compare with the expected verdicts.
