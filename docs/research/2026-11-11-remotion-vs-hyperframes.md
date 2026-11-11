# Remotion vs HyperFrames for the reels (2026-11-11)

Question from the user: what is each good at, and is combining HyperFrames with what we have the
best way forward?

## What we actually have

The value is not in the renderer. It is in the grammar and the pipeline around it, almost all of
which is renderer-agnostic:

- the script format (takes, caption chunks, key words, per-word cues) and the timeline built from
  measured word times (`narration.ts`, `vo-align.py`, `vo-manifest.mjs`);
- the voice pipeline (VibeVoice locally, cloned from a chosen seed, tightened, denoised);
- the sound layer as data (one sound per visual event, a ducked bed, generated effects);
- the editing rules (one change per phrase, one focal object, carried objects live in slots,
  the Gentleman is the outro, motion from frame 0).

The Remotion-specific part is `stage.tsx` + `sound.tsx` + the two reel files: about 1,200 lines
of React whose primitives are `Enter`, `Move`, `Shake`, `Captions`, `Music`, `Sfx`, `Ticks`.

## Remotion (what we use)

Good at: React composition, deterministic per-frame rendering, `<Audio volume={frame => …}>`
(our ducking), `<Sequence>` timing, a mature renderer and Lambda, a Studio for scrubbing. Five
years old, known behaviour, we have a working QA loop (contact sheets, frame grabs, mix profile).
Cost: source-available licence, free for individuals and companies up to three people, paid
beyond; a React bundler; our motion primitives are hand-rolled and basic (rise/fade/stamp,
linear interpolation between poses).

## HyperFrames (HeyGen, Apache 2.0, 2026)

Good at: plain HTML + CSS + data attributes (`data-start`, `data-duration`, `data-track-index`,
nested compositions via `data-composition-src`), **GSAP timelines seeked per frame** (staggers,
eases, motion paths, per-letter text animation, all deterministic), no build step, agent-first
tooling (`lint`, `check`, `snapshot --at t1,t2`, a block registry of ~450 pieces, a
`remotion-to-hyperframes` skill), audio elements placed on tracks with a volume attribute, local
or Lambda rendering, Apache 2.0 with no commercial threshold. Backed by HeyGen; very large star
count; docs still thin.
Not established from the docs read: volume automation over time (our ducking), caption word
timing formats, fps/resolution flags, render speed. Sources:
[repo](https://github.com/heygen-com/hyperframes), [GSAP guide](https://hyperframes.heygen.com/guides/gsap-animation),
[core package](https://hyperframes.heygen.com/packages/core), [overview](https://www.mindstudio.ai/blog/what-is-hyperframes-html-video-renderer-ai-agents).

## Assessment

- **Combining them scene by scene is the worst option.** Two toolchains, two QA loops, two sets
  of primitives for the same look. Pick one renderer per reel.
- **The renderer is swappable; the grammar is the asset.** Whichever renderer, the script, the
  cues, the word times, the sound map and the rules stay. The port is `stage.tsx` and two reels.
- **What HyperFrames would buy us:** GSAP motion (richer, cheaper to write than hand-rolled
  interpolation: a stagger of thirteen hearts is one line), a built-in agent QA loop (we built
  ours by hand), a licence with no ceiling as the team grows, and no bundler.
- **What it would cost:** a new, young tool with documentation gaps exactly where we are
  particular (ducked bed, word-timed captions), a port of ~1,200 lines, and a week of re-learning
  its quirks (every tool this year has had four).
- **The one change worth making regardless:** move the audio mix out of the renderer. A single
  pre-mixed soundtrack (voice + ducked bed + effects, built in Python from the timeline we already
  compute) makes the renderer a picture engine and the soundtrack checkable on its own. It also
  removes the main unknown in a HyperFrames port.

## Recommendation

Stay on Remotion for the current run (finish 001, post 002–003, the next two topics). In
parallel, one bounded experiment: port reel 002's "wait" scene (counter, dots, chips, aces) to
HyperFrames with a GSAP timeline driven by our cue frames, render it, and compare motion quality
and the QA loop side by side. Decide on the renderer for reel 006 onward from that. Adopt
GSAP-style sequencing ideas (staggers, eases) in `Enter`/`Move` now either way.
