# Voice B rollout: reels 002 and 003 on the livelier read (2026-11-11)

**Decision.** The founder picked read **B** of the voice round (reel 002's hook, A vs B with
picture, `apps/reels/out/voice-round/`): the seed-3 reference clip
(`media/tests/2026-11-11_vibevoice-voice-board/outputs/seed-3_ref.wav`) sampled at temperature
0.9 with seed 4, instead of greedy decoding (read A, v4–v8). This note makes B the voice of both
reels in the tracked pipeline and records what the checks found. Nothing else in the reels changed.

No new voice was generated: the whole-reel B recordings from the second board
(`outputs/whole-002-B-lively.wav`, 100.4 s; `whole-003-B-lively.wav`, 74.0 s; byte-identical to the
`_whole.B.wav` copies in `apps/reels/public/vo/<id>/`) were used as they are.

## Backups (media/, git-ignored)

- `media/reels/2026-11-10_only-aces/audio/vo/only-aces_A_v08/`: the seven A takes, their
  `.raw.wav`, `_whole.wav`, `_whole.raw.wav`, `_whole.B.wav`, `_whole.C.wav`, plus
  `only-aces.json` and `only-aces.words.json` (the tracked manifest and word times at v8).
- `media/reels/2026-11-10_will-it-get-there/audio/vo/will-it-get-there_A_v08/`: the same for 003.
- Renders: `renders/<id>_v08.mp4` (md5 equal to the previous `renders/<id>.mp4`); `renders/<id>.mp4`
  is now v9.
- The finished B narration (cleaned, tightened, the file the takes are cut from):
  `audio/vo/<id>_vo-whole_v09-B-clean-tight.wav`.

To restore A: copy the `_A_v08/` wavs back to `apps/reels/public/vo/<id>/`, the two json files to
`apps/reels/src/vo/`, and render.

## Steps (per reel)

1. **Clean first.** `vo-enhance.py --file <board B whole> apps/reels/public/vo/<id>/_whole.raw.wav`
   (DeepFilterNet 3 on the system Python 3.11, then loudnorm to −16 LUFS). It goes to
   `_whole.raw.wav` because that is the file `vo-tighten.py` cuts from.
2. **Tighten.** `vo-tighten.py <id> --max-gap 0.55 --tempo 1.0`: 002 100.4 s → 88.1 s (12.3 s of
   silence cut), 003 74.0 s → 65.8 s (8.2 s cut).
   **The noise-floor trap, measured:** the same rule on the *uncleaned* B wholes would have cut
   0.0 s (002) and 0.7 s (003); a sampled read's floor sits above the −42 dBFS gate, so the pauses
   are invisible to it until DeepFilterNet drops the floor. That is why the order is now clean →
   tighten → split (README "Pace" and "Voice" updated). The old per-take `.raw.wav` files from A
   were removed from `public/vo/<id>/` (they are in the backup).
3. **Split and align.** `vo-align.py <id> --split` (wav2vec2 forced alignment on the whole, including
   the throwaway trailer line, cut between takes), writes `src/vo/<id>.words.json`.
4. **Level per take** to −16 LUFS (the same ffmpeg `loudnorm` as `vo-enhance.py`'s `level()`), so
   each take sits where the mix expects it. No second DeepFilterNet pass on the takes.
5. `vo-check.py <id>`, then `vo-manifest.mjs <id> "VibeVoice-Large seed-3 ref, sampling 0.9 seed 4 (read B)"`.
6. Two-model transcript check (below), render, contact sheet.

Takes (manifest seconds): 002 hook 8.30, plan 14.42, wait 18.91, raise 13.25, fix 16.09, sheet
7.12, outro 5.86 (80.3 s of speech); 003 hook 7.93, count 7.24, flop 10.03, turn 6.00, exact 9.10,
sheet 15.76, outro 6.14 (58.6 s of speech).

## vo-check (wav2vec2-base greedy transcript, same method as before)

| reel | take | sec | words | w/s | F0 | IQR | WER |
|---|---|---|---|---|---|---|---|
| 002 | hook | 7.86 | 23 | 2.93 | 138 | 43 | 8.7% |
| 002 | plan | 13.84 | 33 | 2.38 | 140 | 46 | 17.1% (flag) |
| 002 | wait | 18.30 | 59 | 3.22 | 129 | 42 | 3.3% |
| 002 | raise | 12.73 | 40 | 3.14 | 140 | 46 | 20.0% (flag) |
| 002 | fix | 15.58 | 41 | 2.63 | 134 | 46 | 4.8% |
| 002 | sheet | 6.63 | 20 | 3.02 | 138 | 37 | 15.0% |
| 002 | outro | 5.30 | 22 | 4.15 | 162 | 61 | 22.7% (flag) |
| 003 | hook | 7.38 | 22 | 2.98 | 139 | 25 | 4.3% |
| 003 | count | 6.81 | 25 | 3.67 | 143 | 50 | 12.0% |
| 003 | flop | 9.55 | 29 | 3.04 | 133 | 40 | 3.3% |
| 003 | turn | 5.42 | 18 | 3.32 | 134 | 30 | 11.1% |
| 003 | exact | 8.59 | 30 | 3.49 | 127 | 53 | 0.0% |
| 003 | sheet | 15.22 | 43 | 2.83 | 147 | 44 | 18.2% (flag) |
| 003 | outro | 5.67 | 21 | 3.70 | 120 | 28 | 28.6% (flag) |

`vo-check` exits 1 for both reels on the >15 % WER flags. The flags come from the base wav2vec2
greedy decoder, which misspells rather than mishears ("mats" for maths, "lama" for llama, "pear"
for pair, "wanted to happlies" for "one and a half blinds"); Whisper (below) clears most of them.
Same voice on every take: F0 medians 127–147 Hz on every take but 002's outro (162 Hz / IQR 61,
4.15 words/s: the voice lifts and hurries on the closing question). Not regenerated; flagged.

## Two-model transcript check (`apps/reels/out/voice-b/vo-doubt.py`, untracked)

Per take: wav2vec2 forced-alignment confidence per word (mean character posterior along the
forced path; words under 0.50 listed) and whisper-large-v3 (HF cache, GPU fp16, 5 beams) diffed
against the script with numbers spelled out. Audio was not touched; these are the doubts to listen
for in the review round.

**Reel 002**

| take | wav2vec2 doubts (<0.50) | Whisper vs script |
|---|---|---|
| hook | none (min 0.67) | every word |
| plan | none (min 0.52); greedy heard "cets" for the "six" of 1,326 | "1,320 sets" for "1,326" (the "six" of the number) |
| wait | "some" 0.08 (in "fold some more") | "around" for "round" |
| raise | "one and a half blinds" 0.08–0.46 (greedy "wanted to happlies") | "you've paid" for "you paid" (hears the words) |
| fix | none (min 0.74) | every word |
| sheet | "save" 0.49, "later" 0.41 | **"say this" for "save this"** |
| outro | "me" 0.16 (in "tell me") | every word |

**Reel 003**

| take | wav2vec2 doubts (<0.50) | Whisper vs script |
|---|---|---|
| hook | none (min 0.86) | every word |
| count | "You" 0.00, "can" 0.03 (in "You can already see") | "could" for "can" |
| flop | "is" 0.33 (in "nine times four is") | every word |
| turn | **"But say" 0.18 / 0.24** (greedy "a a") | **"I'll tell you the turn is a blank" for "But say the turn is a blank"** |
| exact | none (min 0.90) | every word |
| sheet | none (min 0.55) | "over card" for "overcards" |
| outro | "dot" 0.37 | every word |

Both models doubt the same two spots, so these are the ones to check by ear first:
**002 sheet "So save this"** (both hear "say") and **003 turn "But say the turn is a blank"**
(both hear something else at the opening of the take). One model doubts, the other clears:
002's "1,326" ending, "fold some more", "one and a half blinds", "tell me"; 003's "You can",
"is", "overcards", "dot". Nothing was fixed or regenerated; if the ear agrees with the models,
regenerate the whole reel with another seed and run the chain again (the pipeline is one command
per step), or record a human reference.

## Measurements (`scripts/voice_measure.py`, whole voice track, 238 / 188 script words)

The whole files include the throwaway trailer line (10 words) the driver appends, so words/s is
slightly understated for every row alike; cleaning also drops the floor, so the 8 %-of-peak gate
counts more frames as pause after DeepFilterNet (003's pause % rises from 26 to 36 while the
silences got shorter). Compare like with like: "final" rows are the tightened, cleaned files the
takes were cut from, for A (v8) and B (v9).

| track | voiced span (s) | words/s | pause % | F0 median (Hz) | F0 IQR (Hz) | dynamics (dB) |
|---|---|---|---|---|---|---|
| 002 A raw (board doc: IQR 38) | 103.7 | 2.29 | 38 | 137 | 38 | 12.7 |
| 002 A final (v8) | 99.0 | 2.40 | 35 | 137 | 38 | 12.7 |
| 002 B raw (board doc: 141 / 50 / 2.39) | 100.3 | 2.37 | 34 | 141 | 50 | 13.9 |
| **002 B final (v9)** | **87.2** | **2.73** | **35** | **138** | **45** | **13.1** |
| 003 A raw (board doc: IQR 43) | 65.5 | 2.87 | 25 | 131 | 43 | 14.8 |
| 003 A final (v8) | 65.4 | 2.88 | 25 | 131 | 43 | 14.9 |
| 003 B raw (board doc: 142 / 60 / 2.57) | 73.8 | 2.55 | 26 | 142 | 60 | 13.7 |
| **003 B final (v9)** | **65.0** | **2.89** | **36** | **136** | **42** | **13.9** |

Read: B keeps the register (median ~137 Hz, the same as A) with a wider pitch movement in the raw
read (IQR 50 / 60 vs 38 / 43); after cleaning the autocorrelation pitch tracker sees less of the
spread (45 / 42), because DeepFilterNet removes the breathy frames where the estimate wandered, not
because the read got flatter. Pace after the 0.55 s rule: 002 at 2.73 words/s (A was 2.40; B had
more cuttable silence once cleaned, 12.3 s), 003 at 2.89 (A 2.88).

## Renders

`npx remotion render src/index.ts <id> out/<id>.mp4` (Chrome), copied to
`media/reels/<folder>/renders/<id>.mp4`:

| reel | v8 (voice A) | v9 (voice B) |
|---|---|---|
| 002 only-aces | 95.68 s | **87.25 s** |
| 003 will-it-get-there | 64.64 s | **65.45 s** |

Contact sheets: `apps/reels/out/contact-<id>-v9.png` (the tracked `contact-sheet` still, 6 columns,
22 frames each: every 4 s for 002 (0–84 s), every 3 s for 003 (0–63 s); copies in
`media/reels/<folder>/renders/contact-<id>_v09.png`).

## Doubts and open items

- The `vo-check` 15 % WER threshold is tuned for greedy reads; B's sampled reads trip it on five of
  fourteen takes while Whisper hears the words. Either Whisper becomes the second opinion in
  `vo-check.py`, or the threshold is read with the two-model table above.
- 002 outro: pitch lifts to 162 Hz and 4.15 words/s on "So, honestly: how long is your wait?". It
  is the same generation, so the same voice, but it is the one take that measures unlike the rest.
- Lengths: 002 lost about 8 s against v8 (silence inside B that the cleaned floor made cuttable);
  the script, the gaps and the motion are unchanged, so every cue still lands on its word.
