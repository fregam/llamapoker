---
title: Only playing aces?
status: draft (rendered, not posted)
channel: Instagram Reels (9:16, 40s, burned subtitles)
date: 2026-11-08
made_with: Higgsfield faceless-video workflow (Explainer, animated)
file: apps/reels/out/only-aces-higgsfield.mp4 (git-ignored); Higgsfield media 43daf499-7e0b-43a8-a0dc-ab87a5573e89
cost: about 99 credits (600 → 500.7)
---

# Reel 001 — Only playing aces?

Original script, characters and art. The topic (waiting for premium hands) is a standard
beginner leak that many poker teachers cover; nothing here is copied from another creator.

## Script (narrated by the Gentleman, voice: Arthur)

1. **Hook:** He folds forty-nine hands out of fifty. It feels disciplined, but it's actually the
   slowest way to lose at poker.
2. **Build:** Premium hands show up once in thirty-nine deals, and every single wait costs him
   about ten big blinds.
3. **Turn:** The aces finally come, he raises, and everyone folds instantly, because after an hour
   of waiting nobody pays him off.
4. **Payoff:** Play more hands from late seats, because tight is fine but predictable is broke,
   and the llama is reading you.

Numbers: AA/KK/QQ/AK = 34 of 1,326 combos ≈ 1 in 39. Six-max blinds = 1.5 bb per 6 hands, so
≈ 10 bb over 39 hands.

## Recipe (reuse for every reel)

- **Voice:** Arthur, `text2speech_v2` / `elevenlabs`, voice_id `30fc8796-ceb6-4a66-b3a7-4a145ef7f346`
  (preset). Delivery line, verbatim on every take:
  `[ calm low unhurried storyteller, dry and quietly amused, neutral accent, warm timbre, steady pace, starts speaking immediately]`.
  Arthur reads slowly (~2.0–2.3 words/s): aim for **18–20 words per 10s block**, one flowing
  sentence, to land in the 7.8–9.5s window.
- **Style key:** `a565a1f7-a2c1-47a7-82df-e70e1038c013` (built on the brand art: Gentleman
  `e190b152…`, the Read `ad8aa78f…`, mark `3c63e327…`).
- **Assets (reusable):** Gentleman full body `b415de7f-c454-4a54-a91c-09f0a0739067` ·
  Rivals (walrus + heron) `bd0ed470-9439-4d00-add3-6af16497928c` · card table `21bc76c0-2c3c-488f-a786-e91f0d6b1990` ·
  clock corner `6688e327-ed86-44e7-a5d2-59d3b5da7fad` · window seat `65f1048d-7b5c-4c25-bc0a-1fd1ce97ab83` ·
  chip stack `ba8baf43-0c5c-432e-bf4c-07b173f1e4be` · pocket aces `a1379fc2-eadd-4b9d-9116-f3362d47589f`.
- **Blocks:** `minimax_h3`, 10s, 2K, 9:16, five hard-cut shots per block, ≤7 references
  (location → characters → props). 20 credits each.
- **Assembly + subtitles:** `finish_video.sh` → `audio_to_captions.py --mixed --script` →
  `subtitle_paper_burn.py --style bold --no-caps --font-key montserrat --profile faceless`.

## Notes for next time

- The clips drift from the etched engraving towards a smoother, painterly look (most visible on
  chip close-ups). Ask for "visible engraved line hatching on every surface" in each shot line.
- No on-screen numbers: the video model can't render text reliably, so the stats live in the
  narration and subtitles only.
