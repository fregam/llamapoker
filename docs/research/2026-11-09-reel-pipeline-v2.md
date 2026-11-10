---
title: Reel pipeline v2 — previz first, render once
date: 2026-11-09
status: design, to build in ComfyUI (Comfy Cloud MCP) + Remotion
---

# Reel pipeline v2: previz first, render once

**Principle:** spend almost nothing until the story, timing and motion are approved, then render
each shot once on a big GPU. Every expensive step gets a cheap preview step in front of it,
the way film studios do previz before shooting.

```
0 Brief → 1 Script → 2 Voice → 3 Animatic → 4 Motion → 5 Keyframes → 6 Render → 7 Finish → 8 Sound → 9 Edit
   free      free      free      free         free/cheap   cheap          GPU         GPU        free      free
```

| # | Stage | What happens | Tool | Cost | Gate (approve before moving on) |
|---|---|---|---|---|---|
| 0 | Brief | Topic, hook, the one idea, target viewer, site page it promotes | `content/_templates/brief.md` | free | Topic and angle |
| 1 | Script + shot list | Narration written for the ear; shot list per sentence: story shot or teaching graphic, framing, action, camera, light, sound | Claude | free | Script reads right out loud |
| 2 | Voice | The Gentleman's voice, line by line, with duration control so each line fits its shot | IndexTTS-2 / Fish S2 / Chatterbox (local, our 4060) | free | Delivery and pronunciation |
| 3 | Animatic | Rough storyboard frames (grey sketches) + the voice + the teaching graphics, cut together | Remotion + quick sketches | free | Pacing, clarity: can a beginner follow it? |
| 4 | **Motion blocking** | Motion is made and approved as a cheap preview, never as final video (see below) | Blender / phone video / low-res draft model | free–cheap | Every gesture and camera move |
| 5 | Keyframes | Start (and end) frame of every story shot, in brand style, the Gentleman exactly on model | Qwen-Image-Edit / FLUX Kontext + **Gentleman LoRA** | cents | Each frame looks like a poster |
| 6 | Render | Animate each keyframe following the approved motion (pose/depth/camera control), 720p, 3–5 s | **Wan 2.2 VACE / Wan Animate** (control video) or Wan 2.2 14B first-last-frame; LTX-2.5 to compare | GPU minutes | Matches the previz |
| 7 | Finish | Upscale to 1080×1920, interpolate 16→24/30 fps | SeedVR2 + RIFE/GIMM | GPU minutes | Sharp, smooth |
| 8 | Sound | Foley generated from each finished clip (synced), music bed, room tone | MMAudio, MOSS-SoundEffect, ACE-Step (local) | free | Every hit lands on its motion |
| 9 | Edit | Voice-first cut, teaching layer, captions, end card, mix | Remotion (+ our poker engine) | free | Final |

Hero-shot fallback: if one shot (e.g. a hoof handling cards) won't come out right, render
just that shot on a paid API (Kling 3.0 / Veo 3.1 Fast, ≈ $0.10–0.20 / s).

> **Update (2026-11-09, after bake-off 02):** motion is generated, never filmed. Stage 4 is
> Blender with a 3D proxy of the Gentleman (`2026-11-09-blender-motion.md`). Seedance is dropped
> for cost. The options below are kept for history.

## Stage 4: motion blocking, three ways (pick per shot)

1. **Act it yourself (best for acting).** Film the gesture on your phone: lean back, adjust the bow
   tie, slide chips, look into the lens. Pose estimation (DWPose / OpenPose) turns it into a
   stick-figure skeleton video. That skeleton drives the Gentleman in stage 6. You become the
   motion actor, for free.
2. **3D blocking in Blender (best for camera).** A simple mannequin at a table, a library of free
   motions (e.g. Mixamo), and the exact camera move: push-in, tilt, orbit. Export depth and
   pose passes. Deterministic, editable and free. This is how the camera language from
   `2026-11-09-production-stack.md` §2 gets executed precisely.
3. **Cheap draft render.** Generate a 480p draft with a small model (Wan 2.2 5B / LTX distilled,
   locally on the 4060), approve the motion, extract pose/depth from it, then do the real render
   from those controls.

Previews are watched as silhouettes or skeletons over the animatic: if the motion reads well
as a stick figure, it will read well as the Gentleman.

## The teaching layer (runs through stages 3 and 9)

Code-drawn in Remotion with our poker engine: cards dealt as named, range grid lighting up,
chips and pot, bars, counters, formulas. Exact numbers, native 1080p/4K, synced word by word
to the narration. Story shots set the mood; the teaching layer makes it followable.

## One-time setup (first GPU session)

- Train the **Gentleman LoRA** (character + engraving style) from our brand art and the sheets
  in `content/reels/001-only-aces.md`. About 1 hour on an RTX PRO 6000.
- Optional: an **engraving style LoRA** for sets and props.
- Save every working ComfyUI graph as JSON in `apps/comfy/workflows/` (keyframe, render-pose,
  render-depth, flf2v, upscale-interp, mmaudio, ace-step, tts), with a README per workflow:
  inputs, outputs, models, settings, typical cost.

## Costs (40 s reel, after setup)

| Item | Estimate |
|---|---|
| Voice, music, SFX, animatic, motion blocking, edit | free (local) |
| Keyframes (~12) | cents |
| Render 12 shots × 4 s at 720p + upscale/interp on RTX PRO 6000 ($3.49/h), batched in one session | ~$2–4 |
| Optional hero shot on a paid API | ~$1 |
| **Total** | **≈ $3–5**, with far more control than Reel 001 (~$5 on Higgsfield) |

The saving isn't the point; control and quality are. And once the workflows are fixed, the
agent workforce on the server can run them unattended.

## Sources

- Comfy Cloud MCP: [docs.comfy.org/agent-tools/cloud](https://docs.comfy.org/agent-tools/cloud), [docs.comfy.org/agent-tools/mcp](https://docs.comfy.org/agent-tools/mcp), [Comfy support](https://support.comfy.org/articles/4321955727-agent-tools-mcp-comfy-cloud-mcp), [comfyui-wiki announcement](https://comfyui-wiki.com/en/news/2026-06-30-comfy-mcp-agent-integration)
- Models and costs: see `2026-11-09-production-stack.md`.
