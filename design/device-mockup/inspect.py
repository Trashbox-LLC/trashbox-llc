import sys
from pathlib import Path

import bpy
from mathutils import Vector

MODELS = Path(__file__).resolve().parent / "models"


def bounds(objs):
    pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return lo, hi


for name in sys.argv[sys.argv.index("--") + 1 :]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(MODELS / name))
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    lo, hi = bounds(meshes)
    print(f"\n=== {name}: {len(meshes)} meshes, bounds {tuple(round(v, 4) for v in lo)} -> {tuple(round(v, 4) for v in hi)}")
    for o in meshes:
        mats = [s.material.name if s.material else None for s in o.material_slots]
        olo, ohi = bounds([o])
        size = ohi - olo
        print(
            f"  {o.name!r:40} parent={o.parent.name if o.parent else None!r:28} "
            f"verts={len(o.data.vertices):6} size={tuple(round(v, 4) for v in size)} mats={mats}"
        )
