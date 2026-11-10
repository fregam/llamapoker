"""Pose test for the Gentleman rig: rest pose, lean back + hoof to bow tie, + look into the lens.

    blender -b <rig.blend> -P apps/blender/lib/pose_test.py -- <out_dir>

Uses the same controls a shot script will use: an IK target for the hoof, a look target for the
head, and rotations for the torso. Renders clay frames from a three-quarter front camera.
"""
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

out = Path(sys.argv[sys.argv.index("--") + 1]).resolve()
out.mkdir(parents=True, exist_ok=True)
scene = bpy.context.scene
rig = bpy.data.objects["gentleman_rig"]
mesh = bpy.data.objects["gentleman"]

# Clay look, lit like a studio: key from front-right, fill from left.
clay = bpy.data.materials.new("clay")
bsdf = clay.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.55, 0.55, 0.55, 1)
bsdf.inputs["Roughness"].default_value = 0.8
mesh.data.materials.clear()
mesh.data.materials.append(clay)
world = bpy.data.worlds.new("w")
scene.world = world
world.node_tree.nodes["Background"].inputs[0].default_value = (0.05, 0.05, 0.05, 1)
for name, energy, rot in (("key", 4.0, (55, 0, 35)), ("fill", 1.2, (60, 0, -60)), ("rim", 2.0, (70, 0, 180))):
    light = bpy.data.objects.new(name, bpy.data.lights.new(name, "SUN"))
    light.data.energy = energy
    light.rotation_euler = tuple(math.radians(a) for a in rot)
    scene.collection.objects.link(light)

cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
cam.data.lens = 50
scene.collection.objects.link(cam)
scene.camera = cam
cam.location = Vector((0.9, 1.8, 0.15))  # three-quarter front (he faces +Y, his right = +X)
cam.rotation_euler = (Vector((0, 0, 0.05)) - cam.location).to_track_quat("-Z", "Y").to_euler()
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x, scene.render.resolution_y = 720, 1280

# Controls.
def empty(name, loc):
    e = bpy.data.objects.new(name, None)
    e.location = loc
    scene.collection.objects.link(e)
    return e

hoof_target = empty("hoof.R_target", rig.matrix_world @ rig.data.bones["forearm.R"].tail_local)  # rest wrist
ik = rig.pose.bones["forearm.R"].constraints.new("IK")
ik.target, ik.chain_count = hoof_target, 2
pole = empty("elbow.R_pole", (0.35, -0.10, 0.0))
ik.pole_target, ik.pole_angle = pole, math.radians(-90)

def render(tag):
    bpy.context.view_layer.update()
    scene.render.filepath = str(out / f"pose-test_{tag}.png")
    bpy.ops.render.render(write_still=True)

render("01_rest")

# Lean back into the chair: hips and chest tilt backwards (rotation about X, he faces +Y).
rig.pose.bones["hips"].rotation_mode = "XYZ"
rig.pose.bones["chest"].rotation_mode = "XYZ"
rig.pose.bones["hips"].rotation_euler.x = math.radians(-8)
rig.pose.bones["chest"].rotation_euler.x = math.radians(-6)
bpy.context.view_layer.update()
# Hoof to the bow tie: target just in front of the collar, measured on the posed chest.
chest = rig.pose.bones["chest"]
collar = rig.matrix_world @ chest.tail
hoof_target.location = collar + Vector((0.01, 0.075, 0.0))
render("02_lean-back_bow-tie")

# Turn to the lens: yaw split across neck_2 (40%) and head (60%) about each bone's own long axis
# (bone Y points up the neck), so the head turns instead of pitching.
yaw = math.atan2(cam.location.x, cam.location.y)  # angle from his forward (+Y) to the camera
for bone, share in (("neck_2", 0.4), ("head", 0.6)):
    pb = rig.pose.bones[bone]
    pb.rotation_mode = "XYZ"
    pb.rotation_euler.y = -yaw * share
render("03_look-to-lens")
print("DONE")
