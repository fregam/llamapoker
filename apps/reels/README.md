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

1. **Script** — `src/scripts/<id>.json`: one object per spoken line, with markup:
   `|` splits a line into caption chunks (2–6 words, one on screen at a time), `*word*` marks the
   chunk's key word (Bodoni italic in the line's accent colour: `c` = brass | sage | vermilion),
   `[cue]` names the moment a word is spoken so the stage can react to it. `gap` adds silence after
   the line (frames). `node ../../scripts/vo-lines.mjs <id>` prints the lines with the markup removed:
   that exact text is what the voice model reads, so audio and captions cannot drift.
2. **Voice** — one audio file per line, `public/vo/<id>/<n>.mp3`, from Higgsfield
   `text2speech_v2` with `variant: elevenlabs`, preset voice **Mark**
   (`27c04473-84a9-4b60-a41f-c8e8458bd4f1`), 0.45 credits a line. The engine rate-limits: send
   batches of about 10 and resubmit the 429s. Then `node ../../scripts/vo-manifest.mjs <id> "Mark"`
   measures the files into `src/vo/<id>.json`.
3. **Timeline** — `src/narration.ts` places every line at its real length, estimates each word's
   moment inside the line (by letters, with pauses at punctuation) and derives the caption chunks and
   the cue frames. Before the audio exists it assumes 2.4 words a second, so the studio preview works.
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
- **Length follows the script**, typically 70–95 s. The hits in the niche run 50–112 s; what matters
  is that something moves every two seconds, not that it's short.

## Instagram safe area

The app covers ~270 px at the top, ~440 px at the bottom and ~120 px on the right of a 1080×1920
reel. `SAFE` in `src/theme.ts` holds those numbers; the kicker, captions and reading line are
placed from it, and graphics live between y 380 and 1290. Check a frame with the zones overlaid
before shipping a new layout (sharp one-liner in git history: `contact-safe`).

## Voice

Picked by measurement, not by name (we can't listen in the terminal). `media/reels/_voice-test/v2/`
has the same 32-word paragraph in eight ElevenLabs presets; a numpy script measured pitch, pitch
spread, pace and pauses. Mark: median 138 Hz, 2.45 words/s, moderate spread — the calm coach in
`brand/README.md`. Alternatives on the board: Julian (a touch warmer), Harrison (brisker). The
earlier seed_audio voice Miles measured 229 Hz median with a 108 Hz spread, i.e. theatrical, which
is why it sounded wrong. Swapping voice = regenerate the lines with another `voice_id`; nothing
else changes.

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
src/vo/<id>.json        Measured line lengths (scripts/vo-manifest.mjs)
src/vo.ts               VoManifest type (and the older beat-based helpers used by should-you-call)
src/covers/Cover.tsx    Instagram cover (1080×1350): Bodoni question over a library engraving
src/reels/*.tsx         One file per reel
public/vo/<id>/<n>.mp3  One voice line per script line
public/library/         Cut-outs of the on-brand library (content/library): expr-1..6, pose-1..6,
                        turnaround-front, loft, table-edge, props, gentleman-portrait, the-read.
                        Blacks crushed so screen blending drops them onto ink.
```

## Reels

| id | Topic | Length | Recipe |
|---|---|---|---|
| `should-you-call` | Pot odds with one formula (A♥5♥ on K♥9♥2♣, 50 into 100) | 38 s | first reel, pre-library, beat-based (to be rebuilt) |
| `only-aces` | Waiting for premiums costs 10 bb a wait, and nobody pays | ~88 s | `content/reels/002-only-aces.md` |
| `will-it-get-there` | Outs in two seconds: the rule of 4 and 2 vs the exact numbers | ~66 s | `content/reels/003-will-it-get-there.md` |

Covers: `cover-only-aces`, `cover-will-it-get-there`, `cover-should-you-call`.

No music baked in; add a quiet track in the app when posting. Remotion is free for individuals and
companies of up to three people; check its licence if the team grows.
