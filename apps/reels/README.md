# LlamaPoker reels

Short vertical videos (Instagram Reels, TikTok, YouTube Shorts) rendered **from code** with
[Remotion](https://www.remotion.dev). No AI video: every frame is drawn by React in the brand
world, with the library engravings as art and every number from the website's own poker maths
(`../web/src/poker/`). Cheap, exact, repeatable, always on brand. Topic plan and the reasoning:
`../../content/research/2026-11-06-ziramium_poker.md`.

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

## Files

```
src/index.ts            Entry: registers Root
src/Root.tsx            Every reel as a <Composition>, every cover as a <Still>. Add new ones here.
src/theme.ts            Brand colours (brand/tokens.json), Bodoni Moda + Inter, canvas 1080×1920 @ 30fps
src/components.tsx      Frame, PlayingCard, Caption (word by word, highlighted words), BigNumber, Bar, pop/fadeUp
src/teaching.tsx        The teaching layer: Engraving, RangeGrid (13×13), Counter, ChipStack, Seat (fold flip), DotRow
src/covers/Cover.tsx    Instagram cover (1080×1350): Bodoni question over a library engraving
src/reels/*.tsx         One file per reel, built from "beats" in <Sequence>s
public/library/         Cut-outs of the on-brand library (content/library): expr-1..6, pose-1..6,
                        turnaround-front, loft, table-edge, props, gentleman-portrait, the-read.
                        Blacks crushed so screen blending drops them onto ink. Regenerate with the
                        sharp one-liner in git history when the library changes.
```

## The format (what every reel does)

1. **Hook in the first 3 seconds:** one question in Bodoni, the Gentleman reacting.
2. **One idea,** proved with **numbers on screen** (grid, counter, bars, chips).
3. **Typeset captions** (no box): Inter on the ink, the key word in Bodoni italic with a hairline
   drawing itself under it, in sage (good), brass (neutral) or vermilion (danger). Must work on mute.
   Growth mechanics on every reel: a reading line along the bottom, a "send this to the friend who…"
   line, comment bait at the end, and a last frame that matches the hook so it loops.
4. **Save-worthy ending:** a one-screen cheat sheet ("Save this.").
5. **Outro:** the Read, "The llama is reading you.", llamapoker.com, link in bio.

40–45 seconds. No music baked in; add a track in the app when posting.

## Reels

| id | Topic | Length | Recipe |
|---|---|---|---|
| `should-you-call` | Pot odds with one formula (A♥5♥ on K♥9♥2♣, 50 into 100) | 38 s | first reel, pre-library |
| `only-aces` | Waiting for premiums costs 10 bb a wait, and nobody pays | 42 s | `content/reels/002-only-aces.md` |
| `will-it-get-there` | Outs in two seconds: the rule of 2 and 4 vs the exact numbers | 40 s | `content/reels/003-will-it-get-there.md` |

Covers: `cover-only-aces`, `cover-will-it-get-there`, `cover-should-you-call`.

Remotion is free for individuals and companies of up to three people; check its licence if
the team grows.
