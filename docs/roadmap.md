# Roadmap

## Done

- 2026-11-06: llamapoker.com live on Cloudflare Pages (Namecheap domain, Cloudflare DNS,
  www → apex redirect), Beehiiv signup, Web Analytics, Search Console + sitemap,
  link-preview image.
- Monorepo: `brand/`, `apps/web/`, `content/`, `agents/`, `docs/`.
- Guides: /learn/pot-odds (formula + bet-size chart) and /learn/outs (common draws, rule of 2 and 4, full outs chart).
- Phone pass: no sideways scrolling on any page at 390px; trainer drill tabs scroll; touch screens hide keyboard hints.
- Strategy: the big blind defends about half its hands vs a CO/BTN/SB raise (was graded too tight).
- Brand: engraved llama mark, the Gentleman, the Read, round icon/favicon, social kit,
  new share card, Gentleman plate on the home page.

## Next

1. **Social accounts:** create them (Instagram, TikTok, X, YouTube) with the kit in `brand/social/`;
   set the Beehiiv logo and email header. First posts from the Learn guides.
6. **Launch teaser video** (Higgsfield), vertical, for TikTok and Reels.

1. **Instagram Reels:** first one built (`apps/reels`, "should-you-call"). Then 3/week.
   Original plan: animated 40–60s explainers rendered from code (our poker engine + brand), Gentleman covers
   via Higgsfield, 3/week. Plan and topic list: `content/research/2026-11-06-ziramium_poker.md`.
   - Done: on-brand image library v02, cream engraving on black (`content/library/README.md`);
     bake-offs 01–03 (`docs/research/2026-11-09-bakeoff-0*.md`).
   - 2026-11-10 pivot: reels are rendered from code (Remotion) with the engraving library; AI video,
     Blender guides and LoRA work are shelved (research kept in docs/research/).
   - Reels 002 "Only playing aces?" and 003 "Will it get there?" rendered with covers
     (content/reels/002-*, 003-*); the teaching layer lives in apps/reels/src/teaching.tsx.
   - 2026-11-11: v3 editing system, narration-first (apps/reels/README.md "How a reel is built"):
     script JSON with per-word cues, one ElevenLabs line per script line (voice Mark, via Higgsfield),
     captions and graphics synced to the voice, one change per phrase. From the frame-by-frame
     teardown of the reference account's hits (research file, "How their hits are cut").
   - 2026-11-11 (later): v4. Voice moved to the user's own GPU: VibeVoice-Large in the local ComfyUI
     (free), voice picked from a measured seed board (docs/research/2026-11-11-vibevoice-voice-board.md);
     one continuous take per scene with forced word alignment; scripts rewritten for flow.
     A request to clone a real creator's voice was declined (no consent).
   - Next: user listens to 002/003 v4 and the seed board (seed-3 vs seed-11); rebuild 001 "Should you
     call?" on the v4 system; post 002–003; then "Stop limping", "The button is the best seat".
     Music bed at posting.

## Later

- Email: tighten DMARC to p=quarantine once reports are clean; Beehiiv custom sending domain (letter@llamapoker.com).

- Research agent (Reddit, X, tournament results) → weekly brief in `content/`.
- Writing and SEO agents → draft articles for review.
- Move hosting to a Hetzner VPS (see `docs/hosting.md`) when the backend and agents need a server.
- Tournament press, merch.
