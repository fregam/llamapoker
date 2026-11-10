"""Build the Gentleman's rig from his 3D proxy and save it as a .blend.

    blender -b --factory-startup -P apps/blender/lib/build_gentleman_rig.py -- <proxy.glb> <out.blend> <facing> [faces]

Steps: import into the canonical frame (normalize.py: faces +Y, centred, 0.990 tall) → decimate
to `faces` (default 60000, skipped if already lighter) → armature from measured landmarks →
region-based skin weights (region_weights) → save. JOINTS come from `measure_model.py` on
gentleman_proxy_v02.glb (Tripo P2, facing +X before normalising). Re-measure and update JOINTS
whenever the proxy changes.
"""
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).parent))
from normalize import import_normalized  # noqa: E402

args = sys.argv[sys.argv.index("--") + 1:]
src, dst = (str(Path(p).resolve()) for p in args[:2])
facing = args[2] if len(args) > 2 else "+Y"
target_faces = int(args[3]) if len(args) > 3 else 60000

# name: (head, tail, parent, deform). Coordinates in metres, model space.
from gentleman_joints import JOINTS  # noqa: E402

bpy.ops.wm.read_factory_settings(use_empty=True)
mesh = import_normalized(src, facing)

before = len(mesh.data.polygons)
if before > target_faces:
    dec = mesh.modifiers.new("decimate", "DECIMATE")
    dec.ratio = target_faces / before
    bpy.context.view_layer.objects.active = mesh
    bpy.ops.object.modifier_apply(modifier=dec.name)
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.remove_doubles(threshold=0.0005)
bpy.ops.object.mode_set(mode="OBJECT")
print(f"FACES {before} -> {len(mesh.data.polygons)}")

arm_data = bpy.data.armatures.new("gentleman_rig")
rig = bpy.data.objects.new("gentleman_rig", arm_data)
bpy.context.scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode="EDIT")
for name, (head, tail, parent, deform) in JOINTS.items():
    b = arm_data.edit_bones.new(name)
    b.head, b.tail = Vector(head), Vector(tail)
    b.use_deform = deform
for name, (_, _, parent, _) in JOINTS.items():
    if parent:
        b = arm_data.edit_bones[name]
        b.parent = arm_data.edit_bones[parent]
        b.use_connect = (b.head - b.parent.tail).length < 1e-6
bpy.ops.object.mode_set(mode="OBJECT")

ARM_TOP, ARM_BOTTOM, BAND = 0.14, -0.26, 0.0125


def arm_boundaries(mesh):
    """Per side and per 1.25 cm height band, the |x| where the sleeve starts, measured from the
    mesh: the widest empty gap in |x| (outer half of the body) between torso and sleeve. Bands where
    the arm touches the body (armpit) have no gap and are linearly interpolated from neighbours.
    Returns boundary(side, z) -> |x| threshold, or None outside the arm's height range."""
    n = int(round((ARM_TOP - ARM_BOTTOM) / BAND))
    found = {"R": [None] * n, "L": [None] * n}
    for side, sign in (("R", 1), ("L", -1)):
        bands = [[] for _ in range(n)]
        for v in mesh.data.vertices:
            x, z = v.co.x * sign, v.co.z
            if x > 0.06 and ARM_BOTTOM <= z < ARM_TOP:
                bands[min(n - 1, int((ARM_TOP - z) / BAND))].append(x)
        for i, xs in enumerate(bands):
            xs.sort()
            gaps = [(b - a, (a + b) / 2) for a, b in zip(xs, xs[1:]) if b - a > 0.006]
            if gaps:
                found[side][i] = max(gaps)[1]
        known = [i for i, b in enumerate(found[side]) if b is not None]
        for i in range(n):  # interpolate / extend
            if found[side][i] is None and known:
                lo = max((k for k in known if k < i), default=None)
                hi = min((k for k in known if k > i), default=None)
                if lo is None or hi is None:
                    found[side][i] = found[side][lo if hi is None else hi]
                else:
                    t = (i - lo) / (hi - lo)
                    found[side][i] = found[side][lo] * (1 - t) + found[side][hi] * t
        print(f"ARM BOUNDARY {side}: " + " ".join(f"{b:.3f}" if b else "-" for b in found[side]))

    def boundary(side, z):
        if not (ARM_BOTTOM <= z < ARM_TOP):
            return None
        return found[side][min(n - 1, int((ARM_TOP - z) / BAND))]

    return boundary


def region_weights(mesh):
    """Deterministic skin weights. Blender's heat weighting fails on these generated meshes
    (verified: 0 vertices weighted, even for one bone inside the torso), so each vertex is assigned
    to an anatomical region from the measured landmarks, then weighted by inverse distance
    (power 4) to the bones allowed in that region, keeping the two nearest."""
    bones = {n: (Vector(h), Vector(t)) for n, (h, t, _, d) in JOINTS.items() if d}
    boundary = arm_boundaries(mesh)

    def seg_dist(p, a, b):
        ab = b - a
        t = max(0.0, min(1.0, (p - a).dot(ab) / ab.length_squared))
        return (p - (a + ab * t)).length

    def allowed(p):
        side = "R" if p.x > 0 else "L"
        ax = abs(p.x)
        if p.z > 0.425 and ax > 0.02:
            return [f"ear.{side}", "head"]
        if p.z > 0.285:
            return ["head", "snout", "neck_2"] if p.y > 0.06 else ["head", "neck_2"]
        # Arm = outside the measured torso/sleeve gap at this height (see arm_boundaries).
        b = boundary(side, p.z)
        if b is not None and ax >= b:
            return [f"upper_arm.{side}", f"forearm.{side}", f"hoof.{side}"]
        if p.z < -0.215:
            return [f"thigh.{side}", f"shin.{side}", f"foot.{side}"]
        if p.y < -0.06 and -0.215 < p.z < -0.06 and ax < 0.07:
            return ["tail", "hips"]
        names = ["hips", "spine", "chest", "neck_1", "neck_2"]
        if p.z > 0.09 and ax > 0.05:
            names += [f"shoulder.{side}"]
        if p.z > 0.12 and ax > 0.09:  # top of the shoulder rolls with the arm
            names += [f"upper_arm.{side}"]
        if p.z < -0.12:
            names += [f"thigh.{side}"]
        return names

    groups = {n: mesh.vertex_groups.new(name=n) for n in bones}
    for v in mesh.data.vertices:
        cands = sorted(((seg_dist(v.co, *bones[n]), n) for n in allowed(v.co)))[:2]
        ws = [(1.0 / (d + 0.004) ** 4, n) for d, n in cands]
        total = sum(w for w, _ in ws)
        for w, n in ws:
            groups[n].add([v.index], w / total, "REPLACE")


region_weights(mesh)

mesh.parent = rig
arm_mod = mesh.modifiers.new("rig", "ARMATURE")
arm_mod.object = rig

# Report vertices left without any weight (they would not move).
groups = {g.index for g in mesh.vertex_groups if g.name in JOINTS}
unweighted = sum(1 for v in mesh.data.vertices if not any(g.group in groups and g.weight > 0 for g in v.groups))
print(f"UNWEIGHTED {unweighted} of {len(mesh.data.vertices)}")

bpy.context.preferences.filepaths.save_version = 0  # no .blend1 backups in media/
bpy.ops.wm.save_as_mainfile(filepath=dst, compress=True)
print(f"SAVED {dst}")
