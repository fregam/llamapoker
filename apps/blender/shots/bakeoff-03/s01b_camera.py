"""Bake-off 03, shot 01b: camera-and-layout guide for the bow-tie beat. 5 s at 24 fps, 9:16.

    blender -b --factory-startup -P apps/blender/shots/bakeoff-03/s01b_camera.py -- <abs out_dir> [still]

Blender only fixes the camera and where things are; the video model does all the acting. The
Gentleman is a static stand-in (body block + head block, no limbs) that marks his position and
scale. Camera: locked medium shot, frames 1-84, then a slow push-in to frame 120.
Writes <out_dir>/clay/####.png and <out_dir>/depth/####.png (near = white).
"""
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
out = Path(argv[0]).resolve()
still = "still" in argv
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
END = 120
scene.render.fps, scene.frame_start, scene.frame_end = 24, 1, END

clay = bpy.data.materials.new("clay")
clay.diffuse_color = (0.32, 0.32, 0.32, 1)


def add(prim, name, loc, scale, **kw):
    getattr(bpy.ops.mesh, f"primitive_{prim}_add")(location=loc, **kw)
    o = bpy.context.active_object
    o.name, o.scale = name, scale
    o.data.materials.append(clay)
    return o


# Units: metres in the Gentleman's frame (he is 0.99 tall standing). Seated: seat at z 0.
FLOOR, SEAT, TABLE_TOP, TABLE_Y = -0.26, 0.0, 0.17, 0.36
add("cube", "floor", (0, 0, FLOOR), (6, 6, 0.01))
add("cylinder", "table_top", (0, TABLE_Y, TABLE_TOP), (0.42, 0.42, 0.015), radius=1, depth=2, vertices=64)
add("cylinder", "table_post", (0, TABLE_Y, (TABLE_TOP + FLOOR) / 2), (0.03, 0.03, (TABLE_TOP - FLOOR) / 2),
    radius=1, depth=2, vertices=32)
add("cube", "chair_seat", (0, 0, SEAT - 0.02), (0.13, 0.12, 0.015))
add("cube", "chair_back", (0, -0.14, SEAT + 0.15), (0.13, 0.015, 0.15))
LAMP_Z = TABLE_TOP + 0.62
add("cylinder", "lamp", (0, TABLE_Y, LAMP_Z), (0.10, 0.10, 0.035), radius=1, depth=2, vertices=48)
add("cylinder", "lamp_cord", (0, TABLE_Y, LAMP_Z + 1.0), (0.004, 0.004, 1.0), radius=1, depth=2)
add("cube", "window_wall", (-0.4, TABLE_Y + 1.6, FLOOR + 1.25), (1.5, 0.01, 1.25))
for i, x in enumerate((-1.2, -0.4, 0.4)):
    add("cube", f"mullion_{i}", (x, TABLE_Y + 1.58, FLOOR + 1.25), (0.015, 0.02, 1.25))

# Stand-in for the Gentleman: where he sits and how big he is. No limbs, no animation.
add("cube", "standin_body", (0, 0.0, SEAT + 0.17), (0.10, 0.07, 0.17))
add("cube", "standin_neck", (0, 0.02, SEAT + 0.38), (0.035, 0.035, 0.06))
add("uv_sphere", "standin_head", (0, 0.03, SEAT + 0.47), (0.06, 0.08, 0.07), radius=1, segments=32, ring_count=16)

cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
scene.collection.objects.link(cam)
scene.camera = cam
cam.data.lens = 45
look_at = Vector((0, 0.02, SEAT + 0.30))
start = Vector((0.18, TABLE_Y + 1.35, SEAT + 0.32))
end = start.lerp(look_at, 0.28)
for f, loc in ((1, start), (84, start), (END, end)):
    cam.location = loc
    cam.rotation_euler = (look_at - loc).to_track_quat("-Z", "Y").to_euler()
    cam.keyframe_insert("location", frame=f)
    cam.keyframe_insert("rotation_euler", frame=f)

scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x, scene.render.resolution_y = 576, 1024
scene.view_settings.view_transform = "Standard"
world = bpy.data.worlds.new("w")
scene.world = world
world.node_tree.nodes["Background"].inputs[0].default_value = (0.02, 0.02, 0.02, 1)
key = bpy.data.objects.new("key", bpy.data.lights.new("key", "AREA"))
key.data.energy, key.data.size = 5, 0.6
key.location = (0, TABLE_Y, LAMP_Z - 0.05)
scene.collection.objects.link(key)
fill = bpy.data.objects.new("fill", bpy.data.lights.new("fill", "SUN"))
fill.data.energy = 0.6
fill.rotation_euler = (math.radians(60), 0, math.radians(150))
scene.collection.objects.link(fill)

depth = bpy.data.materials.new("depth")
nt = depth.node_tree
nt.nodes.clear()
cd, mr = nt.nodes.new("ShaderNodeCameraData"), nt.nodes.new("ShaderNodeMapRange")
mr.inputs["From Min"].default_value, mr.inputs["From Max"].default_value = 0.6, 3.0
mr.inputs["To Min"].default_value, mr.inputs["To Max"].default_value = 1.0, 0.0
em, outn = nt.nodes.new("ShaderNodeEmission"), nt.nodes.new("ShaderNodeOutputMaterial")
nt.links.new(cd.outputs["View Distance"], mr.inputs["Value"])
nt.links.new(mr.outputs["Result"], em.inputs["Color"])
nt.links.new(em.outputs["Emission"], outn.inputs["Surface"])

frames = (1, 60, 120) if still else range(1, END + 1)
for pass_name, override in (("clay", None), ("depth", depth)):
    bpy.context.view_layer.material_override = override
    (out / pass_name).mkdir(parents=True, exist_ok=True)
    for f in frames:
        scene.frame_set(f)
        scene.render.filepath = str(out / pass_name / f"{f:04d}.png")
        bpy.ops.render.render(write_still=True)
print("DONE")
