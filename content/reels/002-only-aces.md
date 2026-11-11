---
title: Only playing aces?
status: rendered (v3), not posted
channel: Instagram Reels (9:16, ~88 s, narration-first, voice Mark)
date: 2026-11-11
made_with: apps/reels (Remotion), composition `only-aces`; script `apps/reels/src/scripts/only-aces.json`; cover `cover-only-aces`
files: media/reels/2026-11-10_only-aces/renders/only-aces.mp4, cover-only-aces.png
cost: 15.3 Higgsfield credits (34 ElevenLabs lines at 0.45) + 3.6 for the voice board
---

# Reel 002 — Only playing aces?

The most-watched beginner topic in the niche (322K views on the reference account:
`content/research/2026-11-06-ziramium_poker.md`), rebuilt in our world and, in v3, cut the way
their hits are cut: the voice leads, one change per phrase, one focal object, scenes that evolve.

## v3 (2026-11-11): what changed and why

v2 had three faults the user caught: the aces popped on top of the "−10 bb" label (two things
fighting for the same spot), the Gentleman appeared mid-video behind the caption like a pasted
cut-out, and the captions were whole sentences revealing on their own clock while the voice said
something else, so nothing guided the eye. The voice (Miles, seed_audio) was theatrical.

- Script is the source of truth (`src/scripts/only-aces.json`): 34 short lines, each one audio
  file, with caption chunks and `[cues]` per word. Captions are 2–6 words synced to the voice.
- Every graphic is bound to a spoken cue and exits before the next idea; the caption zone is
  never covered. The Gentleman is a bookend (hook + outro) with the headline above him.
- Voice: Mark (ElevenLabs via Higgsfield), chosen by measurement (138 Hz median, 2.45 words/s).

## Scenes (cues in brackets, see the script for the exact words)

| Scene | Voice says | On screen |
|---|---|---|
| Hook | "Only playing the big hands? Fold. Fold. Fold. It feels disciplined. Here's what it costs you." | Headline *Only playing aces?*, the Gentleman's deadpan stare |
| The plan | "Your plan is simple. Queens, kings, aces, and ace-king. Everything else goes in the muck. 34 of 1,326. Under three percent." | [grid] 13×13 labelled grid → [qq][kk][aa][ak] light brass → [dim] the rest ghosts → [n34] **34 OF 1,326** → [pct] **2.6%** |
| The wait | "So you fold. And fold. One premium every 39 hands. Meanwhile the blinds come round. Every six hands, 1.5 bb. By the time the aces arrive, you've already paid ten." | [wait] counter rolls to **39** with one dot per hand → [blinds] a chip pair per orbit → [aces] A♠A♥ replace the counter → [paid] **−10 bb** |
| Nobody pays | "Now you raise. The table has been watching. You've played two hands in an hour. Fold. Fold. Fold. You win 1.5 blinds, after paying ten." | [raise] RAISE tag → [watch] three seats → [s1–s3] flip to Fold → [win] **+1.5 bb** → [net] **−10 bb** ledger |
| The fix | "Tight isn't the problem. Predictable is. From the button, last to act, a solid player opens about 38%. Suited connectors. Small pairs. Weak aces. Nobody knows what you have." | [btn] seat ring, BTN lit → [widen] grid widens to the BTN range in sage, **38%** → [sc][pp][ax] groups flash paper |
| Save this | "Later seat, more hands. Premiums are the floor, never the whole plan." | [sheet] UTG 13 · MP 17 · CO 26 · BTN 38 · SB 29 (% opened, `rangeFor`) |
| Outro | "How long is your wait? Honest answers in the comments. Run any spot free at llamapoker.com." | [outro] Gentleman + question → [cta] llamapoker.com (loops to the hook) |

Numbers: `expandRange(["QQ+","AKs","AKo"])` = 34 combos = 2.56%; 1326/34 ≈ 39 hands; 6-max blinds
1.5 bb per 6 hands → 39 × 0.25 ≈ 10 bb. Opening ranges: `RFI_TOKENS` in `ranges.ts`.

## Post

**Caption:** Waiting for aces feels disciplined. It costs you 10 big blinds every time, and when
they come, nobody pays. For players who fold for an hour and wonder why their big hands never
get paid. Run any spot free: link in bio.

**Cover:** `cover-only-aces.png` (1080×1350). **Hashtags:** none or two at most. Add a quiet music
bed in the app when posting.

## Voice-over

Voice: Mark, ElevenLabs via Higgsfield `text2speech_v2` (preset `27c04473-84a9-4b60-a41f-c8e8458bd4f1`).
Files `apps/reels/public/vo/only-aces/<n>.mp3`, one per script line; 74.1 s of speech in 34 lines.
Regenerate: `node scripts/vo-lines.mjs only-aces --json` gives the exact texts.
