# LlamaPoker reels

Short vertical videos (Instagram Reels, TikTok, YouTube Shorts) rendered from code with
[Remotion](https://www.remotion.dev). Every number comes from the website's own poker maths
(`../web/src/poker/`), and every colour and font from `../../brand/`, so the videos can never
disagree with the tool or drift off brand. Format and topic plan:
`../../content/research/2026-11-06-ziramium_poker.md`.

```bash
cd apps/reels
npm install
npm run studio                 # preview and scrub in the browser
npx remotion render src/index.ts should-you-call out/should-you-call.mp4 \
  --browser-executable="C:/Program Files/Google/Chrome/Application/chrome.exe"
```

`out/` is git-ignored; rendered videos are uploaded by hand.

## Files

```
src/index.ts            Entry: registers Root
src/Root.tsx            Every reel as a <Composition> (id = render name). Add new reels here.
src/theme.ts            Brand colours (brand/tokens.json), Bodoni Moda + Inter, canvas 1080×1920 @ 30fps
src/components.tsx      Frame, PlayingCard, Caption (word-by-word, highlighted words), BigNumber, Bar, pop/fadeUp
src/reels/*.tsx         One file per reel, built from short "beats" in <Sequence>s
public/gentleman.webp   The Gentleman for outros (copy of apps/web/public/brand/gentleman-1100.webp)
```

## The format (what every reel does)

1. **Hook in the first 3 seconds:** one question in Bodoni, the spot on screen.
2. **One idea,** proved with **numbers on screen** (BigNumber, Bar).
3. **Captions** in the box at the bottom, word by word, key words in sage (good), brass
   (neutral) or vermilion (danger). The reel must make sense on mute.
4. **Save-worthy ending:** a one-screen cheat sheet ("Save this.").
5. **Outro:** the Gentleman, "Run any spot, free", llamapoker.com, link in bio.

About 35–45 seconds. No music baked in; add a track in the app when posting.

## Reels

| id | Topic | Length |
|---|---|---|
| `should-you-call` | Pot odds with one formula (A♥5♥ on K♥9♥2♣, 50 into 100) | 38s |

Remotion is free for individuals and companies of up to three people; check its licence if
the team grows.
