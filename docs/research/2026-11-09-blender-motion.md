---
title: Motion authored in Blender, rendered through our workflow
date: 2026-11-09
status: plan, to test as bake-off 03
---

> **Archived 2026-11-12.** The AI-video and Blender work was shelved on 2026-11-10. This
> write-up is kept; the media it names was deleted and `apps/blender/` lives only in git history
> (`git show 4b6cf69:apps/blender/README.md`).

# Motion from Blender

> **Update (same day, after building it):** the guide character is a **simple-shape mannequin**
> (primitives parented to bones, `media/library/3d/gentleman/gentleman_mannequin_v01.blend`),
> not a scanned 3D model. Image-to-3D scans came out two-faced (Pixal3D) or impossible to skin
> automatically (Tripo), and detail in a guide only leaks artefacts into the passes. The video
> model draws the real Gentleman from the library references. Current state: `apps/blender/README.md`.

**Why Blender:** it's the only route where motion is *authored*, not hoped for. Timing is exact to
the frame, camera moves are exact to the millimetre, every take is repeatable and editable, and
it costs nothing. Video models are good at turning structure into an image and bad at inventing
precise structure. So Blender supplies the structure and the models supply the look.

**What bake-off 02 taught us:** a driving video transfers its limbs literally (Wan Animate copied
hands from the draft). So the driver must be **the Gentleman's own body**, never a human
mannequin or a human pose skeleton.

## Pipeline

```
library turnaround ─► 3D proxy of the Gentleman ─► rig ─┐
library plates     ─► 3D proxy of the card room ─────────┼─► Blender shot (bpy script, timed to the VO)
voice track (.wav) ─► beat markers ──────────────────────┘        │
                                                                   ▼
                                   control passes: depth · line art · normals · clay render
                                                                   │
                     library keyframe (first frame, on model) ─────┤
                                                                   ▼
                       Wan Animate 2 (clay as driver) / LTX-2.3 IC-LoRA (depth + edges)
                                                                   ▼
                                              SeedVR2 → 1080×1920 → Remotion edit
```

1. **3D proxy (once).** Rebuild the Gentleman in 3D from `gentleman_turnaround_v01.png`:
   - First: Pixal3D Multi-Views (open model, GPU cents). It takes a mixed turnaround sheet.
   - Fallback: Tripo P2 Multiview (≈232 credits ≈ $1.09), which gives clean quad topology for rigging.

   The proxy only needs correct proportions: long neck, ears, the jacket's silhouette and two-toed
   hooves. The look comes from the keyframe later. Same for the card room (table, chairs, lamp),
   blocked in from the plate.
2. **Rig (once).** Armature for spine, neck, head, ears, jaw, arms and hooves, with automatic weights. Saved as
   `apps/blender/assets/gentleman_rig.blend`.
3. **Shots as code.** Each shot is a Python script (`apps/blender/shots/<reel>/<shot>.py`) generated
   from the shot list: poses as keyframes on named frames, the camera move, and the lens. The VO
   `.wav` sets the timeline, so every gesture lands on its word. Same idea as Remotion: shots are
   versioned, diffable, re-renderable.
4. **Passes.** Rendered headless (`blender -b … -P shot.py`) with Eevee in seconds: depth (Z),
   Freestyle line art, normals, and a flat clay render. The clay render with line art doubles as the
   **animatic**: approve the motion on it before any GPU spend.
5. **Render.** Bake-off 03 compares two open routes on the same shot:
   - **Wan Animate 2** with the clay render as the driver and the library keyframe as the reference
     (the driver now has hooves, which fixes bake-off 02's hand problem);
   - **LTX-2.3 IC-LoRA Union** with depth + edges as control and the library keyframe as the first frame.

   Kling 4.0 i2v stays as the reference for quality.
6. **Finish.** SeedVR2 upscale to 1080×1920, then the Remotion edit with the teaching layer.

## File layout

```
apps/blender/
  README.md            how to run, Blender version, conventions
  lib/                 shared bpy helpers (load rig, set camera, beat markers, render passes)
  assets/              gentleman_rig.blend, card-room_blockout.blend (small; tracked)
  shots/<reel>/<shot>.py
media/reels/<reel>/motion/<shot>/{depth,lineart,normal,clay}/0001.png …
```

## Cost (per 5 s shot, after the one-time setup)

Blender: free. Render on Comfy (Wan Animate / LTX, open models): GPU minutes, cents. Setup: proxy
≈ $0–1.09, rigging is my time. This route is **cheaper than Kling 4.0 ($1.11/shot) and more
precise**. Kling stays for shots where invented acting beats exactness.

## Needed

- Blender 4.x on this machine (`winget install BlenderFoundation.Blender`), run headless by Claude.
