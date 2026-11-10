"""Bake-off 03, shot 01: guide video for the bow-tie beat. 5 s at 24 fps, 9:16.

    blender -b media/library/3d/gentleman/gentleman_mannequin_v01.blend -P apps/blender/shots/bakeoff-03/s01_bow-tie.py -- <out_dir> [still]

Rough blocking only: the video model draws the real Gentleman and the loft from the library
plates; this file fixes staging, timing and camera. Beats (frames):
  1-24   seated at the table, forelegs on the felt, looking off-frame left at an opponent
  24-48  leans back into the chair
  48-84  right hoof up to the bow tie, small adjustment, holds
  84-108 hoof back down; head turns to the lens
  84-120 camera eases into a slow push-in
Writes <out_dir>/clay/####.png and <out_dir>/depth/####.png (near = white). With `still`,
renders only frames 1, 40, 70, 110 for review.
"""
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
out = Path(argv[0]).resolve()
still = "still" in argv
scene = bpy.context.scene
rig = bpy.data.objects["gentleman_rig"]
parts = [o for o in bpy.data.collections["gentleman"].objects if o.type == "MESH"]
pb = rig.pose.bones
FPS, END = 24, 120
scene.render.fps, scene.frame_start, scene.frame_end = FPS, 1, END


def rot(bone, frame, **xyz):
    b = pb[bone]
    b.rotation_mode = "XYZ"
    for axis, deg in xyz.items():
        setattr(b.rotation_euler, axis, math.radians(deg))
    b.keyframe_insert("rotation_euler", frame=frame)


def empty(name, loc):
    e = bpy.data.objects.new(name, None)
    e.location = loc
    scene.collection.objects.link(e)
    return e


def box(name, size, loc, mat):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object
    o.name, o.scale = name, size
    o.data.materials.append(mat)
    return o


def cylinder(name, r, depth, loc, mat):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=loc, vertices=64)
    o = bpy.context.active_object
    o.name = name
    o.data.materials.append(mat)
    return o


# Seated pose (held for the whole shot): thighs forward, shins down.
for f in (1, END):
    rot("thigh.R", f, x=85); rot("thigh.L", f, x=85)
    rot("shin.R", f, x=-85); rot("shin.L", f, x=-85)
bpy.context.view_layer.update()
hip = rig.matrix_world @ pb["hips"].head
knee = rig.matrix_world @ pb["shin.R"].head
foot = rig.matrix_world @ pb["foot.R"].tail
floor_z = foot.z
seat_z = hip.z - 0.03

clay = bpy.data.materials.new("clay")
clay.diffuse_color = (0.32, 0.32, 0.32, 1)
for o in parts:
    o.data.materials.clear()
    o.data.materials.append(clay)

# Set blockout, matching loft-table_plate_v01: round table, chair, pendant lamp, window wall.
table_top = hip.z + 0.17
table_y = knee.y + 0.20
box("floor", (6, 6, 0.01), (0, 0, floor_z - 0.005), clay)
cylinder("table_top", 0.42, 0.03, (0, table_y, table_top), clay)
cylinder("table_post", 0.03, table_top - floor_z, (0, table_y, (table_top + floor_z) / 2), clay)
box("seat", (0.26, 0.24, 0.03), (0, hip.y - 0.02, seat_z), clay)
box("backrest", (0.26, 0.03, 0.30), (0, hip.y - 0.15, seat_z + 0.17), clay)
lamp_z = table_top + 0.55
cylinder("lamp", 0.09, 0.07, (0, table_y, lamp_z), clay)
cylinder("lamp_cord", 0.004, 2.0, (0, table_y, lamp_z + 1.0), clay)
box("window_wall", (3.0, 0.02, 2.5), (-0.4, table_y + 1.6, floor_z + 1.25), clay)
for i, x in enumerate((-1.2, -0.4, 0.4)):
    box(f"mullion_{i}", (0.03, 0.04, 2.5), (x, table_y + 1.58, floor_z + 1.25), clay)

# Hooves: IK targets keyed through the beats.
chest = rig.matrix_world @ pb["chest"].tail
targets = {}
for side, sx in (("R", 1), ("L", -1)):
    t = empty(f"hoof.{side}_target", (0, 0, 0))
    ik = pb[f"forearm.{side}"].constraints.new("IK")
    ik.target, ik.chain_count = t, 2
    ik.pole_target = empty(f"elbow.{side}_pole", (sx * 0.22, -0.30, -0.35))
    ik.pole_angle = math.radians(-90 if side == "R" else -90)
    targets[side] = t
on_table = {s: Vector((sx * 0.11, table_y - 0.30, table_top + 0.03)) for s, sx in (("R", 1), ("L", -1))}
bow_tie = Vector((0.01, chest.y + 0.045, chest.z + 0.005))  # chest after the lean-back


def key_target(side, frame, loc):
    targets[side].location = loc
    targets[side].keyframe_insert("location", frame=frame)


for f in (1, END):
    key_target("L", f, on_table["L"])
key_target("R", 1, on_table["R"]); key_target("R", 48, on_table["R"])
key_target("R", 62, bow_tie + Vector((0.02, 0.02, -0.02)))
key_target("R", 70, bow_tie); key_target("R", 76, bow_tie + Vector((-0.01, 0, 0.005)))
key_target("R", 84, bow_tie)
key_target("R", 100, on_table["R"]); key_target("R", END, on_table["R"])

# Lean back (24-48), held.
for f in (1, 24):
    rot("hips", f, x=0); rot("chest", f, x=0)
for f in (48, END):
    rot("hips", f, x=7); rot("chest", f, x=6)

# Head: looking off-frame left (his left = -X), then to the lens (84-108).
for f in (1, 84):
    rot("neck_2", f, y=16); rot("head", f, y=24)
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
scene.collection.objects.link(cam)
scene.camera = cam
cam.data.lens = 45
look_at = Vector((0, hip.y + 0.02, hip.z + 0.30))
start = Vector((0.18, table_y + 1.35, hip.z + 0.32))
end = start.lerp(look_at, 0.28)
yaw = math.atan2(start.x, start.y - hip.y)
for f in (108, END):
    rot("neck_2", f, y=-math.degrees(yaw) * 0.4); rot("head", f, y=-math.degrees(yaw) * 0.6)
for f, loc in ((1, start), (84, start), (END, end)):
    cam.location = loc
    cam.rotation_euler = (look_at - loc).to_track_quat("-Z", "Y").to_euler()
    cam.keyframe_insert("location", frame=f)
    cam.keyframe_insert("rotation_euler", frame=f)

# Ease every curve (Blender's default Bezier keys are already ease-in/out).
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x, scene.render.resolution_y = 576, 1024
world = bpy.data.worlds.new("w")
scene.world = world
world.node_tree.nodes["Background"].inputs[0].default_value = (0.02, 0.02, 0.02, 1)
key = bpy.data.objects.new("key", bpy.data.lights.new("key", "AREA"))
key.data.energy, key.data.size = 5, 0.6
key.location = (0, table_y, lamp_z - 0.05)
scene.collection.objects.link(key)
fill = bpy.data.objects.new("fill", bpy.data.lights.new("fill", "SUN"))
fill.data.energy = 0.6
fill.rotation_euler = (math.radians(60), 0, math.radians(150))
scene.collection.objects.link(fill)

# Depth material: camera distance mapped to white (near) → black (far), applied as an override.
depth = bpy.data.materials.new("depth")
nt = depth.node_tree
nt.nodes.clear()
cam_data = nt.nodes.new("ShaderNodeCameraData")
mr = nt.nodes.new("ShaderNodeMapRange")
mr.inputs["From Min"].default_value, mr.inputs["From Max"].default_value = 0.6, 3.0
mr.inputs["To Min"].default_value, mr.inputs["To Max"].default_value = 1.0, 0.0
emit = nt.nodes.new("ShaderNodeEmission")
outn = nt.nodes.new("ShaderNodeOutputMaterial")
nt.links.new(cam_data.outputs["View Distance"], mr.inputs["Value"])
nt.links.new(mr.outputs["Result"], emit.inputs["Color"])
nt.links.new(emit.outputs["Emission"], outn.inputs["Surface"])

frames = (1, 40, 70, 110) if still else range(1, END + 1)
for pass_name, override in (("clay", None), ("depth", depth)):
    scene.view_settings.view_transform = "Standard"
    bpy.context.view_layer.material_override = override
    (out / pass_name).mkdir(parents=True, exist_ok=True)
    for f in frames:
        scene.frame_set(f)
        scene.render.filepath = str(out / pass_name / f"{f:04d}.png")
        bpy.ops.render.render(write_still=True)
print("DONE")
