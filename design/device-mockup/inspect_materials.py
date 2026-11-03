"""Print each mesh's materials with area, base colour, metallic and roughness.

Run:
  Blender -b --factory-startup -P inspect_materials.py -- [model.glb]
"""

import sys
from pathlib import Path

import bpy

MODELS = Path(__file__).resolve().parent / "models"
ARGS = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
MODEL = ARGS[0] if ARGS else "macbook-rigged.decoded.glb"

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(MODELS / MODEL))


def texture_mean(node):
    px = node.image.pixels[:]
    n = len(px) // 4
    step = max(1, n // 4096)
    samples = [px[i * 4 : i * 4 + 3] for i in range(0, n, step)]
    return tuple(round(sum(s[c] for s in samples) / len(samples), 3) for c in range(3))


for obj in bpy.context.scene.objects:
    if obj.type != "MESH":
        continue
    counts = {}
    for poly in obj.data.polygons:
        counts[poly.material_index] = counts.get(poly.material_index, 0) + poly.area
    for index, slot in enumerate(obj.material_slots):
        mat = slot.material
        bsdf = next((n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None) if mat else None
        if not bsdf:
            print(obj.name, mat.name if mat else None, "no principled")
            continue
        base = bsdf.inputs["Base Color"]
        if base.is_linked:
            node = base.links[0].from_node
            source = f"TEX mean={texture_mean(node)}" if node.type == "TEX_IMAGE" else node.type
        else:
            source = tuple(round(c, 3) for c in base.default_value[:3])
        metal = bsdf.inputs["Metallic"]
        metal_v = "linked" if metal.is_linked else round(metal.default_value, 2)
        rough = bsdf.inputs["Roughness"]
        rough_v = "linked" if rough.is_linked else round(rough.default_value, 2)
        print(
            f"{obj.name:12} {mat.name:20} area={counts.get(index, 0):9.1f} base={source} metal={metal_v} rough={rough_v}"
        )
