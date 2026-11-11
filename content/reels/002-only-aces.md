---
title: Only playing aces?
status: rendered (v4), not posted
channel: Instagram Reels (9:16, 105 s, narration-first, one voice take per scene, local VibeVoice voice)
date: 2026-11-11
made_with: apps/reels (Remotion), composition `only-aces`; script `apps/reels/src/scripts/only-aces.json`; cover `cover-only-aces`
files: media/reels/2026-11-10_only-aces/renders/only-aces.mp4, cover-only-aces.png; audio/vo/only-aces_vo-whole_v04.wav (the one-take narration the scene wavs are cut from)
cost: v4 voice free (local GPU); earlier v3 voice 15.3 Higgsfield credits + 3.6 for its board
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

- Script is the source of truth (`src/scripts/only-aces.json`): 34 short lines with caption
  chunks and `[cues]` per word. Captions are 2–6 words synced to the voice.
- Every graphic is bound to a spoken cue and exits before the next idea; the caption zone is
  never covered. The Gentleman is a bookend (hook + outro) with the headline above him.

## v4 (2026-11-11): flow

The user's note on v3: "every sentence feels disconnected from each other instead of flowing".
Two causes, both fixed. The lines were generated one audio file each, so the voice restarted
cold at every sentence; now the 34 lines are grouped into **seven takes** (hook, plan, wait, raise,
fix, sheet, outro), one continuous recording per scene, and the words are placed by forced
alignment, not estimated. And the writing was a list of facts; it is now one argument, each line
leaning on the last ("Trouble is…", "And while you wait, the blinds don't", "So by the time…",
"So what happens?", "So tight isn't the problem"), with the ten blinds coming back as a callback.
Voice: VibeVoice-Large, locally, the seed-3 board voice cloned (see below).

## v5 (2026-11-11, later): hook, sound, clean voice

- **Hook.** v4 opened with the question, "Fold. Fold. Fold." and a promise: twelve seconds before
  anything changed. Now: "Only playing aces? That costs you ten big blinds every time you wait. And
  when they finally come, nobody pays. Here's the maths." The −10 bb stamps in under the headline
  on "ten" (second two, the Gentleman leaves), three FOLD tags land on "nobody" (second five).
- **Sound** (`apps/reels/src/sound.tsx`, `SoundDesign()` in the reel): a ducked bed under the whole
  reel; a pluck per hand lighting up, a whoosh when the grid ghosts, a stamp on 34 and on every
  −10 bb, ticks while the counter runs to 39, chips on the blinds, two card deals for the aces, a
  fold per seat, a bell on +1.5 bb and on the button range, a tick per cheat-sheet row.
  Provisional synthesised set until the generated one lands (see `apps/reels/README.md`, "Sound").
- **Voice cleaned** with DeepFilterNet 3 (`scripts/vo-enhance.py`): floor between words down
  about 8 dB, speech untouched.

## v6 (2026-11-11, night): pace and continuity

- **Pace.** Silences inside the narration cut to 0.3 s and the tempo lifted 6 % (pitch kept):
  91 s of speech became 81 s; take gaps 8–9 frames. The whole reel is about 86 s.
- **Continuity** (`<Move>`): the −10 bb stamped in the hook docks into the top-right HUD while the
  grid lights, and leaves only when the 2.6 % needs the slot; the grid sinks to a faint backdrop
  under the counter instead of cutting away; the aces, after the seats fold around them, shrink
  into the top-right corner and stay there through the button scene; the 38 % and its grid fly
  into the BTN row of the final table, which lands with a stamp.
- **Sound.** Every number landing is a riser + stamp + sub boom (`<Hit>`); a shuffle when the grid
  appears and when it widens; a faint blip on every caption change; whooshes start early so they
  peak on the cue.

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

Voice: VibeVoice-Large in the local ComfyUI, the board's seed-3 voice (not a real person: about
120 Hz median, calm and low), cloned from a 9 s cut of that take, greedy decoding. Board and
measurements: `docs/research/2026-11-11-vibevoice-voice-board.md`. Files
`apps/reels/public/vo/only-aces/<take>.wav`, one per scene, cut from one continuous generation of
the whole reel. Regenerate: start ComfyUI (see `apps/reels/README.md`, "Voice"), then
`node scripts/vo-comfy.mjs only-aces --ref media/tests/2026-11-11_vibevoice-voice-board/outputs/seed-3_ref.wav --whole`,
`scripts/vo-align.py only-aces --split`, `scripts/vo-check.py only-aces`,
`node scripts/vo-manifest.mjs only-aces "VibeVoice-Large seed-3 clone"`.
