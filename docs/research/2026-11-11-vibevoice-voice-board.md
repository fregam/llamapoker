# Voice board: VibeVoice-Large, local, zero-shot (2026-11-11)

**Why.** The reel voice moved off Higgsfield/ElevenLabs (0.45 credits a line) to the user's own
machine: Microsoft **VibeVoice-Large** (7B) in the local ComfyUI Desktop install
(`C:\Users\matia\Documents\ComfyUI`, custom node ComfyUI-VibeVoice 1.5.1), LLM quantised to 4-bit so
it fits the RTX 4060's 8 GB (about 6.7 GB in use). A 44-word paragraph takes 35–60 s to generate.
Cost: zero, so candidates can be generated until one is right.

A real person's voice is **not** cloned (the request to clone a YouTube creator was declined:
no consent, impersonation). Instead VibeVoice *generates* a voice from a seed when no reference is
given; the chosen board take is then the voice, and a short cut of it is the reference the reels
are cloned from (greedy decoding).

**Cloning from the board take failed.** The first plan was to use the chosen take as the `--ref`
clip for every scene. With that reference (18 s, VibeVoice's own output, opening with the same
words as the hook) the model recited the reference clip's paragraph and *then* read the take: a
22-word hook came out 31 s long (transcript checked with wav2vec2 ASR). Sampling vs greedy made no
difference. Zero-shot from seed 3 with greedy decoding read the same hook correctly in 11.7 s at
120 Hz / IQR 22, the register of the board take. The 1.5B model and cfg 2.0 with the same reference
recited it too. But zero-shot has its own flaw (next section), so cloning had to work.

**What fixed cloning:** the reference, not the model. Two tests on the hook text: an ElevenLabs
sample (Mark, 32 words, unrelated content) cloned cleanly (9.2 s, every word right, 132 Hz); and a
**9 s cut from the middle of the seed-3 take** (seconds 3.2–12.2, so it does not open with "Only
playing the big hands", the hook's first words) also cloned cleanly (13.7 s, every word right,
123 Hz / IQR 43). The recitation happens when the reference is long and starts with the words the
script starts with: the model continues the reference instead of reading the text. The reference in
use is `outputs/seed-3_ref.wav` (that cut). A recorded human reference should follow the same rule:
10 s, mid-sentence start, content unrelated to the script.

**Test paragraph (44 words, from reel 002):** "Only playing the big hands? It feels like discipline.
But a premium comes round about once every thirty-nine hands, and while you wait, the blinds don't.
So by the time the aces show up, you've already paid about ten blinds just to see them."

**Files:** `media/tests/2026-11-11_vibevoice-voice-board/outputs/seed-<n>.wav` (48 kHz mono, -16 LUFS).
Generated with `node scripts/vo-comfy.mjs --board <dir> --text "..." --seeds 1,...,12`
(cfg 1.3, 10 diffusion steps, sampling at temperature 0.95 / top-p 0.95; `--sample` in the
current driver, whose default is greedy).

## Measurements

`scripts/voice_measure.py` (pitch by autocorrelation, pace over the voiced span) and a word error
rate from wav2vec2 ASR against the paragraph (intelligibility; lower is cleaner). For a reel's
takes, `scripts/vo-check.py <id>` does both per take and flags any that wandered.

| seed | words/s | pause % | F0 median (Hz) | F0 IQR (Hz) | dynamics (dB) | WER | read |
|---|---|---|---|---|---|---|---|
| **3** | 2.42 | 35 | 121 | 28 | 13.0 | 4.4% | **chosen**: calm, low, steady, narrator pace |
| **11** | 2.44 | 40 | 127 | 22 | 14.0 | 2.2% | alternate: flattest delivery, cleanest diction |
| 1 | 3.51 | 31 | 121 | 24 | 12.5 | 17.8% | low and calm but rushed, mumbles |
| 2 | 3.53 | 29 | 115 | 34 | 12.4 | 4.4% | lowest voice, too fast |
| 4 | 3.13 | 14 | 142 | 31 | 13.5 | 8.9% | brisk, few pauses |
| 5 | 2.89 | 39 | 150 | 73 | 13.1 | 8.9% | expressive, swings |
| 6 | 2.44 | 31 | 230 | 59 | 13.5 | 8.9% | high voice (female register) |
| 7 | 3.29 | 34 | 211 | 46 | 12.2 | 2.2% | high, fast |
| 8 | 3.34 | 33 | 166 | 60 | 14.3 | 8.9% | mid, fast, swings |
| 9 | 3.05 | 14 | 189 | 46 | 15.2 | 2.2% | high, no pauses |
| 10 | 2.86 | 18 | 202 | 56 | 15.1 | 13.3% | high, slurs |
| 12 | 2.67 | 35 | 242 | 97 | 13.7 | 2.2% | highest, theatrical |

Target register (the calm coach of `brand/README.md`, and the delivery of the reference account's
narrators): F0 median 100–140 Hz, IQR under 35, 2.2–2.6 words/s, pauses at sentence ends. For
comparison the previous ElevenLabs preset (Mark) measured 138 Hz / IQR 41 / 2.45 words/s.

## Second board: "the voice lacks natural feel" (2026-11-11, late)

Same reference clip, the 40-word hook+plan paragraph, variations in how it is read
(`outputs/natural-*.wav`), plus both reels whole in the current read (A) and the livelier one (B),
`outputs/whole-00{2,3}-{A-current,B-lively}.wav`, for the user to pick by ear.

| take | how | words/s | F0 median | F0 IQR | WER | read |
|---|---|---|---|---|---|---|
| natural-greedy3 | seed-3 ref, greedy (current) | 2.22 | 115 | 38 | 9.8% | steady, a little flat |
| **natural-sample3-4** | seed-3 ref, sampling 0.9, seed 4 | 2.25 | 146 | 56 | 9.8% | **livelier: wider pitch movement, same pace** |
| natural-greedy11 | seed-11 ref, greedy | 1.91 | 121 | 22 | 7.3% | flattest, slowest |
| natural-cfg16 | seed-3 ref, cfg 1.6 | 2.19 | 134 | 39 | 7.3% | crisper diction, same shape |

Sampling with seed 3 reproduced the greedy take exactly (the node's sampling path and the
greedy path converge for that seed); another seed does differ. Whole reels in B: 002 at 141 Hz /
IQR 50 / 2.39 words/s, 003 at 142 Hz / IQR 60 / 2.57 words/s, against A at IQR 38 / 43.
"Natural" in the numbers is pitch movement (IQR 50–60) at narration pace; B is the pick on paper,
the user's ear decides. A recorded human voice (10 s mid-sentence cut as `--ref`) remains the
surest route to natural.

Pauses: cutting silences to 0.30 s with a 6 % tempo lift made the read "not feel like a narration";
0.55 s with no tempo change is the rule now (`vo-tighten.py --max-gap 0.55 --tempo 1.0`).

## Pipeline that came out of it

1. `node scripts/vo-lines.mjs <id>` prints the takes (one continuous paragraph per scene).
2. `node scripts/vo-comfy.mjs <id> --ref .../outputs/seed-3_ref.wav --whole` generates the whole
   reel as one recording cloned from the reference cut, `apps/reels/public/vo/<id>/_whole.wav`,
   through the local ComfyUI server (start it headless: see `apps/reels/README.md`, "Voice").
   **Why whole:** generating the seven scenes as seven separate zero-shot jobs with the same seed
   gave seven different voices (pitch medians from 101 to 216 Hz, two takes unintelligible); a seed
   fixes the voice only inside one generation, and a different text gives a different voice (reel
   003 zero-shot from seed 3 came out at 220 Hz with a 100 Hz spread). The whole-reel run also
   stops short of the last sentence, so the driver appends a throwaway line that the split discards.
   `scripts/vo-align.py <id> --split` cuts the recording into takes between the last word of one
   scene and the first of the next, and `scripts/vo-check.py <id>` measures and transcribes each
   take (same voice? the right words?) before it goes into the reel.
3. `<comfyui-venv>/python.exe scripts/vo-align.py <id>` writes every word's spoken time
   (wav2vec2 CTC forced alignment, `apps/reels/src/vo/<id>.words.json`).
4. `node scripts/vo-manifest.mjs <id> "VibeVoice-Large seed-3"` writes the manifest the timeline reads.

Gotchas: ComfyUI must run with `--gpu-only`, otherwise it offloads the 4-bit model to the CPU after
the first job and the next one fails ("tensors on different devices"); the console needs
`PYTHONUTF8=1` or it crashes on an emoji in a node's log line; the cached `aoi-ot/VibeVoice-Large`
snapshot is exposed to the node through a directory junction at `models/tts/VibeVoice/VibeVoice-Large`.
