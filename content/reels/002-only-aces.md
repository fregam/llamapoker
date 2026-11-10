---
title: Only playing aces?
status: rendered, not posted
channel: Instagram Reels (9:16, 42 s, burned captions, no voice-over yet)
date: 2026-11-10
made_with: apps/reels (Remotion), composition `only-aces`; cover `cover-only-aces`
files: media/reels/2026-11-10_only-aces/renders/only-aces.mp4, cover-only-aces.png
cost: 0 (rendered locally from code; art from the on-brand library)
---

# Reel 002 — Only playing aces?

The most-watched beginner topic in the niche (314K views on the reference account:
`content/research/2026-11-06-ziramium_poker.md`), rebuilt in our world: cream engraving on ink,
Bodoni questions, code-drawn teaching graphics, numbers from the site's own poker engine.

## Beats (30 fps)

| Frames | Beat | On screen | Caption |
|---|---|---|---|
| 0–120 | Hook | "Only playing *aces?*", the Gentleman's deadpan stare | Fold. Fold. Fold. Waiting for the big hand feels disciplined. |
| 120–300 | The plan | 13×13 grid, QQ+ and AK light up in brass; **2.6%**, 34 of 1,326 | Aces, kings, queens, ace-king. 34 of 1,326 combos. Under 3% of hands. |
| 300–540 | The wait | counter 0→**39**, one dot per hand, chip stack draining **−10 bb**, the aces finally appear | One premium every 39 hands. The blinds come round anyway: 10 big blinds, gone. |
| 540–750 | Nobody pays | three seats flip to *Fold*, A♠A♥, the raised eyebrow | The aces finally come. You raise. Everyone folds. After an hour of folding, nobody pays you off. |
| 750–930 | From the button | grid widens to the BTN opening range, **38%** | Last to act, open about 38% of hands. Tight is fine. Predictable is broke. |
| 930–1140 | Save this | UTG 13 · MP 17 · CO 26 · BTN 38 · SB 29 (% opened, from `rangeFor`) | Later seat, more hands. Early seat, fewer. Premiums are the floor, never the whole plan. |
| 1140–1260 | Outro | the Read, "The llama is *reading you.*", llamapoker.com | |

Numbers: `expandRange(["QQ+","AKs","AKo"])` = 34 combos = 2.56%; 1326/34 ≈ 39 hands; 6-max
blinds 1.5 bb per 6 hands → 39 × 0.25 ≈ 10 bb. Opening ranges: `RFI_TOKENS` in `ranges.ts`.

## Post

**Caption:** Waiting for aces feels disciplined. It costs you 10 big blinds every time, and when
they come, nobody pays. For players who fold for an hour and wonder why their big hands never
get paid. Run any spot free: link in bio.

**Cover:** `cover-only-aces.png` (1080×1350). **Hashtags:** none or two at most.

## Next for this reel

- Voice-over (local TTS shoot-out pending): the captions already carry the script.
- Music bed added in the app when posting.
