"""Print a height profile of a model, used to place rig joints from measurements, not guesses.

    blender -b --factory-startup -P apps/blender/lib/measure_model.py -- <model.glb>

For each 2.5% height band (top to bottom): the left/right extent (x), front/back extent (y),
and how many separate x-runs the band has (2 or more below the jacket means two legs,
3 at arm height means arm + torso + arm).
"""
import sys
from pathlib import Path

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
model = str(Path(argv[0]).resolve())
facing = argv[1] if len(argv) > 1 else "+Y"
sys.path.insert(0, str(Path(__file__).parent))
from normalize import import_normalized
bpy.ops.wm.read_factory_settings(use_empty=True)
mesh = import_normalized(model, facing)
pts = [v.co for v in mesh.data.vertices]
zmin, zmax = min(p.z for p in pts), max(p.z for p in pts)
H = zmax - zmin
bands = 40
rows = [[] for _ in range(bands)]
for p in pts:
    i = min(bands - 1, int((zmax - p.z) / H * bands))
    rows[i].append(p)

def runs(xs, gap):
    xs = sorted(xs)
    out, start = [], xs[0]
    for a, b in zip(xs, xs[1:]):
        if b - a > gap:
            out.append((start, a)); start = b
    out.append((start, xs[-1]))
    return out

print(f"HEIGHT {H:.4f} zmin {zmin:.4f}")
for i, r in enumerate(rows):
    if not r:
        continue
    xs = [p.x for p in r]; ys = [p.y for p in r]
    rs = runs(xs, H * 0.006)
    print(f"{i*2.5:5.1f}% z={zmax - (i + .5) * H / bands:.3f}  x[{min(xs):+.3f},{max(xs):+.3f}]  y[{min(ys):+.3f},{max(ys):+.3f}]  "
          + " ".join(f"({a:+.3f},{b:+.3f})" for a, b in rs))
