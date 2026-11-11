# Voice round 1: the hook of reel 002, read A vs read B (2026-11-11)

**Why.** The founder's one note on the rendered reels: the voice "lacks natural feel". This round is
judged by the founder's ear, on the 15-second hook of reel 002 ("Only playing aces?") only, with the
same words and the same picture in every candidate, so the only thing that differs is the read.
Nobody in the terminal could listen: everything below is measured, aligned or transcribed, never
heard. A and B are ready; C (a clone of the founder's own voice) is set up and waits for the
recording.

## Files (all under `apps/reels/out/voice-round/`, git-ignored; nothing tracked was changed)

| file | what it is |
|---|---|
| `hook-A.mp4` (11.2 s) | the hook as it is in the reel today: composition `only-aces`, frames 0–336 (hook take + gap + 1 s), voice A, bed and effects |
| `hook-B.mp4` (10.0 s) | the same composition, same script, same picture, voice B; frames 0–298 (B's hook is 1.3 s shorter); captions and cues sit on B's own measured word times |
| `hook-A.wav` | voice A alone, the take already in the reel (`apps/reels/public/vo/only-aces/hook.wav`, untouched) |
| `hook-B.wav` | voice B alone, cut from `media/tests/2026-11-11_vibevoice-voice-board/outputs/whole-002-B-lively.wav` through the same chain as A |
| `A/`, `B/` | per read: word times (`hook.words.json`), measurements (`hook.measure.json`), the uncleaned cut (`hook.raw.wav`), the cleaned-but-untightened take |
| `make-hook.sh`, `vo-round.py`, `vo-manifest-round.mjs` | the chain as one command (below); untracked helpers that call the repo scripts' own functions |
| `OnlyAcesB.tsx`, `indexB.tsx`, `only-aces-B.vo.json`, `public/` | an untracked copy of the reel bound to the B manifest, rendered with `--public-dir` so no file was added to `apps/reels/public/` |
| `frame-*.png` | one frame per read at the −10 bb stamp and at "nobody pays", to confirm the pictures match |

Both voices: 48 kHz mono, −16 LUFS integrated (A −16.3, B −16.5), true peak −1.5 dBTP.

**How B was made** (A is the baseline exactly as in the reel): `vo-tighten.py`'s rule (silences over
0.55 s cut to 0.55 s, tempo 1.0) on the whole B recording, `vo-align.py`'s split at the aligned word
boundaries, DeepFilterNet 3 and re-levelling (`vo-enhance.py --file`), then the 0.55 s rule once
more on the cleaned take. The last step is the one departure from the baseline order, and it was
necessary: the raw B recording (sampling decode) has a noise floor around −32 dBFS in the hook
(A: −58 dBFS), so the −42 dBFS gate in `vo-tighten.py` saw no silence at all in B and cut nothing
(A lost 4.8 s at the same settings). After cleaning, the floor is −81 dBFS and the rule works:
0.77 s came out of B's hook ("pays. → Here's" went from 1.3 s to 0.64 s, "come, → nobody" from
0.88 s to 0.76 s). Word-boundary gaps are now comparable: A 0.58–0.70 s at the four sentence ends,
B 0.42–0.76 s. If B is ever chosen for a whole reel, run DeepFilterNet before the tightening, or
the pauses stay long.

ComfyUI was running but nothing new was generated: B is the second board's existing whole-reel
take, hook only.

## Measurements (`scripts/voice_measure.py` on the 23-word hook; words/s over the voiced span)

| read | file length | words/s | pause % | F0 median | F0 IQR | dynamics | wav2vec2 greedy transcript | Whisper large-v3 |
|---|---|---|---|---|---|---|---|---|
| **A** (current, greedy) | 9.62 s | 2.49 | 28 | 130 Hz | 41 | 13.5 dB | 1 slip of 23 ("big linds"), WER 4.3 % | every word right |
| **B** (lively, sampled) | 8.34 s | 2.92 | 33 | 138 Hz | 43 | 12.9 dB | 3 slips ("cost", "an", "mats"), WER 13.0 % | every word right |
| B before the second tightening | 9.14 s | 2.66 | 39 | 138 Hz | 43 | 13.0 dB | 2 slips ("cost", "mauts") | every word right |

On these 23 words the two reads are close in pitch (138 vs 130 Hz, spread 43 vs 41; the whole-reel
figures in the second board were 141 Hz / IQR 50 for B against IQR 38 for A). What separates them on
paper is pace: B says the hook 17 % faster and lands "ten" at 2.3 s instead of 3.0 s.

**Two words to listen for in B.** Forced alignment (same wav2vec2 model, per-letter confidence) is
consistent across the raw, cleaned and tightened B: the final *s* of "costs" scores 0.11–0.18 (A:
0.80) and the *th* of "maths" 0.01–0.09 (A: 0.91). Whisper, which leans on a language model,
hears both words correctly in every version; the letter-level model does not. So B may say
"cost you" and swallow the *th* of "maths". Only an ear can settle it; if it does, B's hook is not
usable as is (the hook could be regenerated with another sampling seed, free).

## C: the founder's own voice, ready to run

Needs a 60 s recording of the founder (consented, their own voice), reading anything *except* the
reel's words, saved as `media/tests/2026-11-11_founder-voice/founder-60s.wav` (any format ffmpeg
reads is fine; a quiet room matters more than the microphone). The reference cut must start
mid-sentence (the README's rule: a reference that opens like the script makes the model recite it),
so pick `-ss` inside a sentence. From the repo root, with ComfyUI running (`apps/reels/README.md`,
"Voice"; check with `curl -s 127.0.0.1:8188/system_stats`):

```bash
FF=apps/reels/node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe
$FF -y -i media/tests/2026-11-11_founder-voice/founder-60s.wav -ss 20 -t 10 -ar 48000 -ac 1 -c:a pcm_s16le \
    media/tests/2026-11-11_founder-voice/founder_ref.wav
node scripts/vo-comfy.mjs only-aces --ref media/tests/2026-11-11_founder-voice/founder_ref.wav --whole \
    --whole-out media/tests/2026-11-11_vibevoice-voice-board/outputs/whole-002-C-founder-clone.wav
bash apps/reels/out/voice-round/make-hook.sh C media/tests/2026-11-11_vibevoice-voice-board/outputs/whole-002-C-founder-clone.wav
```

The one command that matters is the last: it produces `hook-C.wav`, `hook-C.mp4`, the transcript
check (wav2vec2 and Whisper) and the measurements, the same way B was produced (it was tested by
regenerating B with it: byte-identical output). `--whole-out` keeps the current voice files of the
reel untouched. Not `whole-002-C-lively-t07.wav`: that older file is a temperature-0.7 variant from
the second board, not this C. Add the new media files to the manifest afterwards
(`node scripts/media-manifest.mjs --check`).

## Listening instruction (for the founder)

1. Play `hook-A.mp4` then `hook-B.mp4` with headphones, twice each; same words, same picture, only the
   voice differs (B is a second shorter because it talks faster).
2. Listen for whether the voice sounds like a person talking to you or like a machine reading: the
   rise and fall across "Only playing aces?", whether "nobody pays" lands, and whether the pauses
   breathe or just stop.
3. In B, check "costs" (is the *s* there?) and "maths" (is the *th* there?); then say which of A or B
   is closer to natural, or whether neither is and C is worth the recording.
