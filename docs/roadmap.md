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
   - Reel 002 "Only playing aces?" rendered (content/reels/002-only-aces.md) with a cover; the
     teaching layer (range grid, counters, chips, fold seats) lives in apps/reels/src/teaching.tsx.
   - Next: voice-over (local TTS), post reels 001–002, then "Stop limping" and "Outs in 2 seconds".

## Later

- Email: tighten DMARC to p=quarantine once reports are clean; Beehiiv custom sending domain (letter@llamapoker.com).

- Research agent (Reddit, X, tournament results) → weekly brief in `content/`.
- Writing and SEO agents → draft articles for review.
- Move hosting to a Hetzner VPS (see `docs/hosting.md`) when the backend and agents need a server.
- Tournament press, merch.
