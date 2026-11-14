---
title: iart.ai video skill packs (short-form and explainer)
date: 2026-11-14
status: read; six ideas kept for the reel 002 motion rebuild and the content factory
---

# iart.ai video skill packs

Two MIT-licensed agent skill packs that teach an agent to write Remotion code for short videos.
They are the free shop window of iart.ai's paid hosted agent but do not call it. Neither covers
sound design or voice.

- [tiktok-video-skills](https://github.com/iart-ai/tiktok-video-skills) (26 stars, 17 commits):
  `short-form-video`, `caption-animation`, `countdown-video`, `lower-thirds`. Read in full:
  [short-form-video/SKILL.md](https://github.com/iart-ai/tiktok-video-skills/blob/main/skills/short-form-video/SKILL.md)
  and its `references/retention-pacing.md`; `caption-animation/SKILL.md`.
- [explainer-video-skills](https://github.com/iart-ai/explainer-video-skills) (108 stars, 19
  commits): `explainer-video` read; `wrapped-video`, `diagram-animation`,
  `whiteboard-animation`, `isometric-animation` not read.

## Kept

1. **Uneven cut rhythm.** A visual change every ~2–4 s, at uneven intervals ("a metronome reads
   as boredom"; their example cuts: 0, 1.2, 3.0, 5.4, 8.0, 11.2, 14.0 s). Our "something moves
   every ~2 s" can become that metronome.
2. **Loop ending.** The last frame matches the first (composition, position, colour), or the last
   line feeds back into the hook. Re-watches count on Reels; we had nothing for them.
3. **Punch-in as the cheapest interrupt.** `spring()` damping 12, stiffness 200, scale 1 → 1.12
   on the beat, `transformOrigin: "50% 45%"`. A move for our 2D camera (adopted round 1) that gives
   the uneven rhythm something to hit without new art.
4. **Open loop: set in the first ~3 s, closed at the very end, never answered early.** Fits our
   "payoff by second three" rule: the stamped number is the promise ("this hand wins 34 %"), the
   open question is *why*, answered last. With the loop ending, the last line leads back into the
   hook.
5. **Hook grammar for scripts.** Four types: open loop ("the reason your X keeps Y"), direct
   promise ("3 ways to ___ in 30 seconds"), pattern interrupt (snap-zoom or visual mismatch on
   frame 1), negation ("Stop calling here"). Rules: one hook gap only (stacking two closes
   neither); one payoff per video (a second idea is a second video). A lens for the content
   factory's scripts.
6. **Reading the retention curve once we post.**
   - Drop at 0–2 s → the hook or first frame is weak: fix the line, lead with the best frame.
   - Steady gentle decline → normal.
   - Flat, then a drop mid-video → the body has too little energy: more interrupts, tighter cuts.
   - Bump near the end → people are looping.
   - Spike at one moment → a re-watched moment: front-load it or make it the hook.

   Belongs on the wall when an Instagram fetcher brings retention data in.

## Skipped, and why

- **Their captions (pages of 1–4 words, bold sans 56–80 px).** Short captions lost our blind
  round 3 (`2026-11-12-reel-craft-research.md`); our captions follow the brand.
- **Their safe area (120 top / 310 bottom / 84 right for Reels).** Ours, measured on the
  Instagram app, is stricter: 270 / 440 / 120 (`SAFE` in `apps/reels/src/theme.ts`).
- **Retention statistics** ("~87 % decide inside 3 seconds", "70 %+ average view-through"):
  unsourced. The founder agrees with the 3-second point; our hook rule already assumes it.
- **Already ours:** frame-driven Remotion, word-level caption timing (we use forced alignment),
  stills and a contact sheet before review (`reel-check.py`), ~2.3 words/s narration (ours ~2.4),
  one JSON of props per video (our script JSON).
