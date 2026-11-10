"""Build the Gentleman blocking mannequin: simple primitives rigidly attached to the bones.

    blender -b --factory-startup -P apps/blender/lib/build_mannequin.py -- <out.blend>

Guide videos only need proportions, staging and silhouette; the video model draws the real
character from the library references. Primitives parented to bones need no skinning and carry
no stray scan detail into the depth/clay passes. Proportions come from gentleman_joints.py.
Saves objects `gentleman_rig` (armature) and `gentleman_*` parts (meshes, collection `gentleman`).
"""
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, str(Path(__file__).parent))
from gentleman_joints import JOINTS  # noqa: E402

dst = str(Path(sys.argv[sys.argv.index("--") + 1]).resolve())
bpy.ops.wm.read_factory_settings(use_empty=True)
coll = bpy.data.collections.new("gentleman")
bpy.context.scene.collection.children.link(coll)

arm = bpy.data.armatures.new("gentleman_rig")
rig = bpy.data.objects.new("gentleman_rig", arm)
coll.objects.link(rig)
bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode="EDIT")
for name, (h, t, _, deform) in JOINTS.items():
    b = arm.edit_bones.new(name)
    b.head, b.tail, b.use_deform = Vector(h), Vector(t), deform
for name, (_, _, parent, _) in JOINTS.items():
    if parent:
        arm.edit_bones[name].parent = arm.edit_bones[parent]
bpy.ops.object.mode_set(mode="OBJECT")


def part(name, bone, prim, size, center=None, axis=None):
    """prim: 'capsule' (radius, length taken from the bone), 'ellipsoid' or 'box' (size xyz)."""
    h, t = Vector(JOINTS[bone][0]), Vector(JOINTS[bone][1])
    axis = (t - h).normalized() if axis is None else Vector(axis).normalized()
    center = (h + t) / 2 if center is None else Vector(center)
    if prim == "capsule":
        r = size
        bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=(t - h).length, vertices=24)
        o = bpy.context.active_object
        for end in (-1, 1):  # round the ends with spheres, joined in
            bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=24, ring_count=12,
                                                 location=(0, 0, end * (t - h).length / 2))
        bpy.ops.object.select_all(action="DESELECT")
        for x in bpy.context.scene.objects:
            if x.type == "MESH" and x.parent is None and x.name.startswith(("Cylinder", "Sphere")):
                x.select_set(True)
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.join()
    elif prim == "ellipsoid":
        bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=32, ring_count=16)
        o = bpy.context.active_object
        o.scale = size
    else:
        bpy.ops.mesh.primitive_cube_add(size=1)
        o = bpy.context.active_object
        o.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.name = f"gentleman_{name}"
    for c in o.users_collection:
        c.objects.unlink(o)
    coll.objects.link(o)
    world = Matrix.Translation(center) @ axis.to_track_quat("Z", "Y").to_matrix().to_4x4()
    o.parent, o.parent_type, o.parent_bone = rig, "BONE", bone
    bpy.context.view_layer.update()
    o.matrix_world = world
    return o


# Body (radii from the measured profile in gentleman_joints.py).
part("hips", "hips", "ellipsoid", (0.075, 0.06, 0.07))
part("chest", "chest", "ellipsoid", (0.08, 0.06, 0.14), center=(0, 0.015, 0.06))
part("neck_1", "neck_1", "capsule", 0.035)
part("neck_2", "neck_2", "capsule", 0.032)
part("skull", "head", "ellipsoid", (0.055, 0.07, 0.065), center=(0, 0.03, 0.37))
part("snout", "snout", "capsule", 0.032)
for s, sx in (("R", 1), ("L", -1)):
    part(f"ear_{s}", f"ear.{s}", "ellipsoid", (0.012, 0.02, 0.045), center=(sx * 0.035, 0.02, 0.455))
    part(f"shoulder_{s}", f"shoulder.{s}", "capsule", 0.035)
    part(f"upper_arm_{s}", f"upper_arm.{s}", "capsule", 0.03)
    part(f"forearm_{s}", f"forearm.{s}", "capsule", 0.026)
    part(f"hoof_{s}", f"hoof.{s}", "capsule", 0.02)
    part(f"thigh_{s}", f"thigh.{s}", "capsule", 0.04)
    part(f"shin_{s}", f"shin.{s}", "capsule", 0.022)
    part(f"foot_{s}", f"foot.{s}", "capsule", 0.02)
part("tail", "tail", "ellipsoid", (0.03, 0.04, 0.035), center=(0, -0.12, -0.13))

bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=dst, compress=True)
print(f"PARTS {len([o for o in coll.objects if o.type == 'MESH'])}  SAVED {dst}")
