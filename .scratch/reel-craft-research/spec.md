# Spec: reel craft research (motion, sound, assets)

Status: ready-for-agent
Grilled with the founder 2026-11-12. Supersedes "content factory v0" as the next reels feature; the
factory is built afterwards, on the upgraded system.

## Problem

Reels 002 and 003 are decent, and `reel-check.py` stops them from getting worse, but nothing makes
them better. The motion, sound and assets come from our own stack and taste, never from a study of
the best short-form explainers. The founder wants a qualitative jump, found by research and proven
by A/B, not guessed.

## Goal

A ranked list of craft upgrades, each tested blind against the approved reel 002, with the winners
written into `apps/reels/README.md` (rules) and `scripts/reel-check.py` (checks, where they can be
measured).

## Scope

- **In:** motion (easing, transitions, carry-overs, pacing, layout), sound (effects, music bed,
  mix), assets (sources of images and sounds, e.g. Openverse and free SFX libraries).
- **Out:** brand changes (see Constraints), the content factory, posting, new reels.

## Constraints

- **Free only.** Cloud services and free tiers are fine. No paid tools or subscriptions.
- **Licences:** NC is fine. Tag each asset's licence in its manifest for traceability; never filter on it.
- **Brand fixed** (`brand/README.md`: cream engraving on flat black, Bodoni + Inter, the Gentleman
  as bookend, no period/paper slop). Anything strong that breaks it goes into a separate
  "Brand proposals" section of the research doc for the founder, never into an A/B round.
- Media stays in the repo: `media/tests/…` with manifests (`node scripts/media-manifest.mjs --check`).

## Plan

### 1. Research (complete before any A/B)

- **Benchmark:** 8–12 of the best explainer shorts from any niche (finance, science, chess,
  design…) known for motion and sound, plus the poker reference account. Claude picks; the
  founder may veto from the list.
- **Teardown:** download for study only (yt-dlp) into `media/tests/2026-11-12_motion-refs/` with a
  manifest; never republished or reused. Per reel: cut timing, motion curves, sound onsets vs
  visual events, mix levels, contact sheets (reuse the `reel-check.py` tooling).
- **Tool and library survey:** free sources of sound and art (Openverse, free SFX libraries, free
  generators), each judged by fit to the brand and to our pipeline.
- **Output:** `docs/research/2026-11-12-reel-craft-research.md` with the teardowns, a gap analysis
  of 002/003 against the benchmark scored separately for motion, sound and assets, a **ranked
  upgrade list** (each item: what, evidence, expected effect, cost to build), and "Brand proposals".

### 2. A/B rounds

- **Bench:** two scenes of reel 002 ("Only playing aces?", v9, the approved reference): the
  **hook** take (cues `hook`, `cost`) and the **plan** take (grid lighting: `grid`, `qq`, `kk`,
  `aa`, `ak`, `dim`, `pct`).
- **Variants:** 3–4 per round, each changing **exactly one** upgrade from the current baseline,
  everything else identical. Taken from the top of the ranked list.
- **Review page:** a private claude.ai artifact, variants labelled A/B/C/D blind, plus the baseline;
  a pick and a note per round, stored in the artifact database so Claude reads them directly.
  Sources in `media/tests/2026-11-12_motion-ab/round-NN/` with a manifest.
- **Listening:** the founder judges on studio monitors. `reel-check.py` gains an info-only
  phone-speaker pass (small-speaker filter) that flags effects that vanish on a phone.
- **Baseline moves:** a round's winner becomes the new baseline for the next round.
- **Stop** when every variant in a round loses to the baseline, or the list runs out.
- **Confirmation round:** all winners stacked vs the old 002 baseline, to catch clashes.

### 3. Adopt

- Winners become rules in `apps/reels/README.md` and, where measurable, checks in `reel-check.py`.
- Log in `docs/decisions.md`, update `docs/roadmap.md`.
- Then: content factory v0 on the upgraded system (its own grill).

## Done when

The confirmation round is picked, the winners are written into the README and reel-check, and
reel-check still passes on the re-cut 002.
