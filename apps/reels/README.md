# LlamaPoker reels

Short vertical videos (Instagram Reels, TikTok, YouTube Shorts) rendered **from code** with
[Remotion](https://www.remotion.dev). No AI video: every frame is drawn by React in the brand
world, with the library engravings as art and every number from the website's own poker maths
(`../web/src/poker/`). Cheap, exact, repeatable, always on brand. Topic plan and the reasoning:
`../../content/research/2026-11-06-ziramium_poker.md` (the teardown of the reference account and
its editing grammar, section "How their hits are cut").

```bash
cd apps/reels
npm install
npm run studio                                   # preview and scrub in the browser
CH="C:/Program Files/Google/Chrome/Application/chrome.exe"
npx remotion render src/index.ts only-aces out/only-aces.mp4 --browser-executable="$CH"
npx remotion still  src/index.ts cover-only-aces out/cover-only-aces.png --browser-executable="$CH"
```

`out/` is git-ignored. Finished renders are copied to `media/reels/<date>_<slug>/renders/` and
the reel's recipe lives in `content/reels/<nnn>-<slug>.md`.

## How a reel is built (narration first)

The voice-over is the spine. Everything on screen happens because a word was just spoken.

1. **Script** — `src/scripts/<id>.json`: one object per spoken line, grouped into **takes** (one
   continuous recording per scene, so the voice flows through the scene instead of restarting cold
   at every sentence; the first line of a take names it: `"take": "hook"`). Markup:
   `|` splits a line into caption chunks (2–6 words, one on screen at a time), `*word*` marks the
   chunk's key word (Bodoni italic in the line's accent colour: `c` = brass | sage | vermilion),
   `[cue]` names the moment a word is spoken so the stage can react to it. `gap` on a take's last
   line adds silence after the take (frames). `node ../../scripts/vo-lines.mjs <id>` prints the takes
   with the markup removed: that exact text is what the voice model reads, so audio and captions
   cannot drift. Write for flow: every line hands off to the next ("so", "but", "which means", a
   question the next line answers), and numbers come back as callbacks.
2. **Voice** — one wav per take, `public/vo/<id>/<take>.wav`, generated for free on the local GPU
   by VibeVoice-Large in ComfyUI: the whole reel in one generation, then cut into takes at the
   aligned word boundaries (the four commands under "Voice" below). `vo-align.py` also writes when
   every word is spoken (`src/vo/<id>.words.json`) and `vo-manifest.mjs` writes `src/vo/<id>.json`
   (take lengths, voiced span, word times).
3. **Timeline** — `src/narration.ts` places every take at its real length, puts each word at its
   measured moment (or estimates it by letters and punctuation when the words file is missing) and
   derives the caption chunks and the cue frames. Before the audio exists it assumes 2.4 words a
   second plus a pause per sentence, so the studio preview works.
4. **Stage** — `src/stage.tsx`. `<Narration>` wraps the reel (audio + captions + cues);
   `<Enter cue="grid" exit="wait">` shows a graphic from one spoken cue until another, with a quiet
   rise-in and fade-out; `useNarration().since("cue")` drives counters and lights. `Stat`, `Tag`,
   `SeatRing`, `Ledger` are the HUD pieces; `src/teaching.tsx` has the grid, cards, dots, seats.
5. **Reel** — `src/reels/<Id>.tsx`: scenes as small components, each element bound to a cue.
   Register in `src/Root.tsx`; the length is `timelineFor(script, vo).total`.

### The editing rules (from the reference account's hits, 50–112 s each)

- **One change per phrase.** Every caption chunk gets exactly one new thing on screen, or one
  change to what is there. Nothing arrives unannounced by the voice.
- **One focal object, centred, big.** Cards ~40% of the width, the grid full width. Stats sit in a
  HUD row above the object. Never stack a third element; exit the old one first (`exit=` cue).
- **A scene evolves, it isn't replaced.** The grid lights up, ghosts, gains a number, widens;
  the aces stay while the seats fold around them. Cuts happen only between ideas, on a long `gap`.
- **The Gentleman is a bookend.** Hook and outro only, full width, composited with the fade mask,
  with the headline above him. Never behind text, never mid-video as a reaction shot.
- **The headline is only in the hook.** After it, no titles: the caption carries the words and
  the stage carries the proof. Zero text overlaps: the caption zone (y ≥ 1320) is empty of graphics.
- **Captions** are typeset, not boxed: Inter 56 centred, key word Bodoni italic ×1.5 in the accent
  colour, a 54 px accent hairline above. 2–6 words, synced to the voice.
- **End on a save-worthy table, then comment bait, then the URL,** and the last picture is the hook's
  picture so the loop doesn't jump. A brass reading line fills along the bottom for the whole reel.
- **Flow.** The voice is one continuous take per scene, never a sentence at a time, and the script
  is written so each line leans on the one before (connectives, callbacks, a question answered next).
- **Length follows the script**, typically 70–95 s. The hits in the niche run 50–112 s; what matters
  is that something moves every two seconds, not that it's short.

## Instagram safe area

The app covers ~270 px at the top, ~440 px at the bottom and ~120 px on the right of a 1080×1920
reel. `SAFE` in `src/theme.ts` holds those numbers; the kicker, captions and reading line are
placed from it, and graphics live between y 380 and 1290. Check a frame with the zones overlaid
before shipping a new layout (sharp one-liner in git history: `contact-safe`).

## Voice

Generated locally, for free: Microsoft **VibeVoice-Large** (7B, LLM in 4-bit, ~6.7 GB VRAM) in the
ComfyUI Desktop install at `C:/Users/matia/Documents/ComfyUI` with the ComfyUI-VibeVoice node.
Start the server headless (models pinned to the GPU, UTF-8 console) before generating:

```bash
cd /c/Users/matia/Documents/ComfyUI && PYTHONUTF8=1 ./.venv/Scripts/python.exe \
  "C:/Users/matia/AppData/Local/Programs/@comfyorgcomfyui-electron/resources/ComfyUI/main.py" \
  --base-directory "C:/Users/matia/Documents/ComfyUI" --listen 127.0.0.1 --port 8188 --disable-auto-launch --gpu-only
```

The voice is **not a real person**. VibeVoice invents a voice from a seed when it gets no reference;
twelve seeds were generated on the same paragraph and measured (pitch, spread, pace, word error
rate; we can't listen in the terminal), see `docs/research/2026-11-11-vibevoice-voice-board.md`.
The pick is seed **3** (`.../outputs/seed-3.wav`: 121 Hz median, IQR 28, 2.42 words/s: calm, low,
steady); seed-11 is the alternate. The voice is locked by **cloning from a 9 s cut of that take**
(`.../outputs/seed-3_ref.wav`, seconds 3.2–12.2: a seed alone only fixes the voice inside one
generation, and a reference that opens with the same words as the script makes the model recite
it, so the cut starts mid-paragraph). The **whole reel is generated in one go** (one speaker, one
breath) and cut into takes afterwards:

```bash
node ../../scripts/vo-comfy.mjs <id> --ref ../../media/tests/2026-11-11_vibevoice-voice-board/outputs/seed-3_ref.wav --whole
<comfyui-venv>/python.exe ../../scripts/vo-align.py <id> --split         # cuts <take>.wav, writes word times
<comfyui-venv>/python.exe ../../scripts/vo-check.py <id>                 # same voice on every take? said the words?
node ../../scripts/vo-manifest.mjs <id> "VibeVoice-Large seed-3 clone"
```

A new voice = a new board (`vo-comfy.mjs --board`), pick by the numbers, cut a mid-paragraph
reference, regenerate; nothing else changes. To use a human voice, record 60 s with consent and
pass a 10 s cut of it as `--ref` (then check the transcript with `vo-check.py`). Earlier boards
(ElevenLabs presets via Higgsfield, `media/reels/_voice-test/`) are kept for comparison: Mark
measured 138 Hz / IQR 41 / 2.45 words/s.

## Files

```
src/index.ts            Entry: registers Root
src/Root.tsx            Every reel as a <Composition>, every cover as a <Still>. Add new ones here.
src/theme.ts            Brand colours (brand/tokens.json), Bodoni Moda + Inter, canvas 1080×1920 @ 30fps, SAFE
src/narration.ts        Script markup → timeline (line starts, word moments, caption chunks, cues)
src/stage.tsx           Narration, Captions, Enter, Stat, Tag, SeatRing, Ledger, useNarration
src/components.tsx      Frame (kicker, hairline border, reading line), PlayingCard, legacy Caption/BigNumber
src/teaching.tsx        Engraving (screen blend + fade), RangeGrid (ghost/hot), Counter, ChipStack, Seat, DotRow
src/scripts/<id>.json   The spoken script with caption/cue markup (source of truth for the voice lines)
src/vo/<id>.json        Measured takes: length, voiced span, word times (scripts/vo-manifest.mjs)
src/vo/<id>.words.json  Word times from forced alignment (scripts/vo-align.py)
src/vo.ts               VoManifest type
src/covers/Cover.tsx    Instagram cover (1080×1350): Bodoni question over a library engraving
src/reels/*.tsx         One file per reel
public/vo/<id>/<take>.wav One voice recording per take (scene), 48 kHz mono, -16 LUFS
public/library/         Cut-outs of the on-brand library (content/library): expr-1..6, pose-1..6,
                        turnaround-front, loft, table-edge, props, gentleman-portrait, the-read.
                        Blacks crushed so screen blending drops them onto ink.
```

## Reels

| id | Topic | Length | Recipe |
|---|---|---|---|
| `should-you-call` | Pot odds with one formula (A♥5♥ on K♥9♥2♣, 50 into 100) | 38 s | first reel, pre-library, beat-based (to be rebuilt) |
| `only-aces` | Waiting for premiums costs 10 bb a wait, and nobody pays | 105 s | `content/reels/002-only-aces.md` |
| `will-it-get-there` | Outs in two seconds: the rule of 4 and 2 vs the exact numbers | 75 s | `content/reels/003-will-it-get-there.md` |

Covers: `cover-only-aces`, `cover-will-it-get-there`, `cover-should-you-call`.

No music baked in; add a quiet track in the app when posting. Remotion is free for individuals and
companies of up to three people; check its licence if the team grows.
