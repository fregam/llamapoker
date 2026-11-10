# apps/blender

Guide videos for the reels: Blender fixes **camera, staging and timing**; the video model draws
the real characters and sets from the image library (`content/library/`). Keep everything in
Blender **simple shapes**: detail in a guide only leaks artefacts into the control passes.
Background: `docs/research/2026-11-09-blender-motion.md`.

- **Blender:** 5.2.3 LTS, `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe`
  (Python 3.13), run headless. Always pass absolute paths: Blender silently drops renders written
  to relative paths.
- **Assets:** `.blend`/`.glb` files live in `media/library/3d/` and are listed in
  `content/library/assets.json`. Only scripts live here.
- **Frame:** metres; the Gentleman is 0.990 tall, centred, faces **+Y**, his right = **+X**,
  up = +Z.

## The mannequin

`media/library/3d/gentleman/gentleman_mannequin_v01.blend`: 23 primitives (capsules and
ellipsoids) rigidly parented to the 25-bone skeleton in `lib/gentleman_joints.py`. There is no
skinning, so nothing can tear. Rebuild:

```
blender -b --factory-startup -P apps/blender/lib/build_mannequin.py -- media/library/3d/gentleman/gentleman_mannequin_v01.blend
```

Controls (signs verified):
- Lean back: `hips` / `chest` rotation X **positive**.
- Seated: `thigh.*` X **+85**, `shin.*` X **−85**.
- Head turn: `neck_2` (40%) + `head` (60%) rotation Y. Positive turns to his left (−X).
- Hooves: IK on `forearm.*` (chain 2) with keyed targets; elbow poles low and behind.

## Shots

`shots/<reel>/<shot>.py`, run with the mannequin `.blend`:

```
blender -b media/library/3d/gentleman/gentleman_mannequin_v01.blend -P apps/blender/shots/bakeoff-03/s01_bow-tie.py -- <abs out dir> [still]
```

Each writes `clay/####.png` and `depth/####.png` (near = white), 576×1024, 24 fps; encode with
Remotion's ffmpeg (`apps/reels/node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe`).
`still` renders 4 review frames only. The set is a blockout matching the library plate (table,
chair, lamp, window wall).

## Tools (`lib/`)

| Script | What it does |
|---|---|
| `inspect_model.py <model> <out> [facing]` | four-side renders, textured and clay |
| `measure_model.py <model> [facing]` | height profile, for placing joints from measurements |
| `normalize.py` | import any model into the canonical frame |
| `build_gentleman_rig.py` | skinned rig on the Tripo scan (superseded by the mannequin; kept) |
| `pose_test.py` | three-pose check for a rig |
