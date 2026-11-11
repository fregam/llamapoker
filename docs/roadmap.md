# Roadmap

> 2026-11-11: the phased plan in `docs/plan-2026-11-11.md` is approved; Phase 0 is in progress (CI and
> signup-path branches pushed, welcome email drafted, interface mockups made).
> Session state lives in `docs/state.md`, decisions in `docs/decisions.md`.

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

0. **The wall** (`apps/wall`): built 2026-11-11 night on branch `interface/wall`; deploy needs the
   founder (second Pages project, D1, variables). Then: a Workers cron that fetches `/api/state`
   daily (snapshots without opening it), the map once Cloudflare analytics data flows, view events
   from a first-party beacon, the local jobs reporting (`scripts/wall-event.mjs`).

1. **Social accounts:** create them (Instagram, TikTok, X, YouTube) with the kit in `brand/social/`;
   set the Beehiiv logo and email header. First posts from the Learn guides.
2. **Launch teaser video**, vertical, for TikTok and Reels, cut on the reels system (`apps/reels`).
3. **Instagram Reels:** first one built (`apps/reels`, "should-you-call"). Then 3/week.
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
   - 2026-11-11 (evening): v5 in progress. Sound layer (apps/reels/src/sound.tsx: ducked music bed,
     cue-driven effects, counter ticks) built on provisional synthesised sounds; hooks rewritten to
     show the payoff in the first seconds; voice cleaned with DeepFilterNet. Local generators chosen
     and downloaded: ACE-Step 1.5 Turbo (music bed, needs the ComfyUI Desktop core update) and
     MOSS-SoundEffect v2.0 (effects, needs its install run by the user).
   - v5 rendered (002: 100 s, 003: 67 s) with the MOSS-generated effects; the bed is still the
     synthesised placeholder.
   - v6 (same night): continuity with `<Move>` (objects travel between scenes instead of cutting),
     Hit sound layer, twelve generated effects. v7: pauses restored to 0.55 s (the 0.3 s + tempo cut
     broke the narration feel), sound audit (no caption sounds, a sound per visual event), hook with
     motion from frame 0 and a shake, outro portrait centred; second voice board for the user's pick.
   - v8: motion eases and frame depth. v9 (2026-11-11): the founder picked the livelier read B
     (seed-3 ref, sampling 0.9, seed 4) from a hook A/B round; both reels re-cut on it, chain now
     clean → tighten → split (docs/research/2026-11-11-voice-b-rollout.md); two spots the transcript
     models doubt are listed there for the review-sheet round. Not approved for posting yet.
   - Next: ComfyUI Desktop update → ACE-Step bed (`scripts/music-comfy.mjs --batch 4`), swap, re-render;
     user listens to 002/003 v5; rebuild 001 "Should you call?" on this system; post 002–003; then
     "Stop limping", "The button is the best seat".

## Later

- Email: tighten DMARC to p=quarantine once reports are clean; Beehiiv custom sending domain (letter@llamapoker.com).

- Research agent (Reddit, X, tournament results) → weekly brief in `content/`.
- Writing and SEO agents → draft articles for review.
- Move hosting to a Hetzner VPS (see `docs/hosting.md`) when the backend and agents need a server.
- Tournament press, merch.
