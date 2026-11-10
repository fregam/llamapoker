"""Import a character model and put it in the canonical frame every script assumes.

Canonical frame: faces +Y, his right = +X, up = +Z, bounding box centred on the origin, height
HEIGHT metres, all transforms applied (object space = world space), one mesh object.
"""
import math

import bpy
from mathutils import Matrix, Vector

HEIGHT = 0.990
# Rotation about Z that turns a model facing <axis> to face +Y.
TURN = {"+Y": 0, "+X": 90, "-Y": 180, "-X": -90}


def import_normalized(path, facing="+Y", name="gentleman"):
    bpy.ops.import_scene.gltf(filepath=path)
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    bpy.ops.object.select_all(action="DESELECT")
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    if len(meshes) > 1:
        bpy.ops.object.join()
    mesh = bpy.context.view_layer.objects.active
    for o in list(bpy.context.scene.objects):  # drop importer empties
        if o.type == "EMPTY":
            bpy.data.objects.remove(o, do_unlink=True)

    me = mesh.data
    me.transform(Matrix.Rotation(math.radians(TURN[facing]), 4, "Z"))
    lo = Vector([min(v.co[i] for v in me.vertices) for i in range(3)])
    hi = Vector([max(v.co[i] for v in me.vertices) for i in range(3)])
    me.transform(Matrix.Translation(-(lo + hi) / 2))
    me.transform(Matrix.Scale(HEIGHT / (hi.z - lo.z), 4))
    me.update()
    mesh.name = name
    return mesh
