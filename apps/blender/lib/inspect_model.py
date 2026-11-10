"""Render a model from four angles, textured and as clay, for review.

    blender -b --factory-startup -P apps/blender/lib/inspect_model.py -- <model.glb> <out_dir>

Writes <out_dir>/<name>_{textured,clay}_{front,side,back,three-quarter}.png and prints the model's
size, vertex count and face count.
"""
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
model, out_dir = (str(Path(p).resolve()) for p in argv[:2])
# Optional 3rd arg: the axis the model faces (+Y default; Pixal3D faces +Y or -Y, Tripo +X).
FACING_OFFSET = {"+Y": 0, "+X": 90, "-Y": 180, "-X": 270}[argv[2] if len(argv) > 2 else "+Y"]
out = Path(out_dir)  # absolute: Blender drops renders silently on relative paths
out.mkdir(parents=True, exist_ok=True)
name = Path(model).stem

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=model)
meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]

# Bounding box in world space.
pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
size = hi - lo
center = (lo + hi) / 2
verts = sum(len(o.data.vertices) for o in meshes)
faces = sum(len(o.data.polygons) for o in meshes)
print(f"MODEL {name}: size x={size.x:.3f} y={size.y:.3f} z={size.z:.3f}  verts={verts}  faces={faces}")

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x, scene.render.resolution_y = 768, 1024
scene.render.film_transparent = False
world = bpy.data.worlds.new("w")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.93, 0.91, 0.86, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 1.0
scene.world = world

sun = bpy.data.objects.new("key", bpy.data.lights.new("key", "SUN"))
sun.data.energy = 3.0
sun.rotation_euler = (math.radians(50), 0, math.radians(30))
scene.collection.objects.link(sun)

cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
cam.data.type = "ORTHO"
cam.data.ortho_scale = max(size.z, size.x, size.y) * 1.15
scene.collection.objects.link(cam)
scene.camera = cam

# Height axis: glTF imports Y-up as Blender Z-up, so Z is height.
dist = max(size) * 3
views = {"front": 0, "three-quarter": 45, "side": 90, "back": 180}

clay = bpy.data.materials.new("clay")
clay.use_nodes = True
clay.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.7, 0.7, 0.7, 1)
originals = {o.name: [s.material for s in o.material_slots] for o in meshes}


def shoot(tag):
    for view, deg in views.items():
        a = math.radians(deg + FACING_OFFSET)
        # Pixal3D models face +Y (verified: snout tip at y=+0.125), so the front camera sits on +Y.
        cam.location = center + Vector((math.sin(a) * dist, math.cos(a) * dist, 0))
        direction = center - cam.location
        cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
        scene.render.filepath = str(out / f"{name}_{tag}_{view}.png")
        bpy.ops.render.render(write_still=True)


shoot("textured")
for o in meshes:
    for s in o.material_slots:
        s.material = clay
shoot("clay")
print("DONE")
