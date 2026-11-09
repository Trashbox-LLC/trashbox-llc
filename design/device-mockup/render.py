"""Render the laptop + phone glass-floor mockup.

Run:
  Blender -b --factory-startup -P render.py -- [--finish dark|silver] [--preview]

Writes to renders/<finish>/ (or renders/<finish>/preview/):
  scene.png     full scene, screens rendered black
  masks.png     red = laptop screen, green = phone screen (visible pixels only)
  glare.png     reflections on the screen glass only
  reflect-laptop.png, reflect-phone.png
                each screen's floor reflection as a white-screen intensity (linear)
  corners.json  screen and floor-reflection corners in output pixels, plus screen aspect ratios
  mockup.blend  the lit scene, to open in Blender and look around in rendered view

A screen-swappable catalog, one device at a time and without a floor reflection:
  Blender -b --factory-startup -P render.py -- --catalog [--preview] [--device laptop|phone] [--color name] [--pose name]

Writes renders/catalog/<device>/<color>/<pose>/ with scene.png, masks.png, glare.png, and corners.json.
"""

import json
import math
import os
import sys
from pathlib import Path

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parent
MODELS = ROOT / "models"
ARGS = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
PREVIEW = "--preview" in ARGS
CATALOG = "--catalog" in ARGS


def arg_value(flag, default=None):
    if flag not in ARGS:
        return default
    index = ARGS.index(flag) + 1
    if index >= len(ARGS):
        raise SystemExit(f"{flag} needs a value")
    return ARGS[index]


if not CATALOG:
    FINISH = arg_value("--finish", "dark")
    if FINISH not in ("dark", "silver"):
        raise SystemExit(f"unknown finish: {FINISH}")
    FINISH_DIR = ROOT / "renders" / FINISH
    OUT = FINISH_DIR / ("preview" if PREVIEW else "")
    OUT.mkdir(parents=True, exist_ok=True)
else:
    # Catalog variants set these per render. The hero path is the only caller of EXPOSURE[FINISH].
    FINISH = "silver"
    FINISH_DIR = ROOT / "renders" / "catalog"
    OUT = FINISH_DIR

# 4:3 so the frame runs past the devices far enough to hold their floor reflections.
WIDTH, HEIGHT = (960, 720) if PREVIEW else (3840, 2880)
SAMPLES = 48 if PREVIEW else 256

# Scene layout, in centimetres. Front of each device faces -Y (toward camera).
LAPTOP = {"location": (6.0, 6.0, 0.0), "yaw": 15.0}
PHONE = {"location": (-12.5, -24.0, 0.0), "yaw": 22.0, "lean": 5.0}
CAMERA = {"target": (2.0, 0.0, 10.5), "distance": 150.0, "elevation": 4.0, "azimuth": -1.0, "lens": 70.0}
# Keeps the 16:9 framing above the devices and spends all the extra height below them.
CAMERA_SHIFT_Y = -(HEIGHT / WIDTH - 9 / 16) / 2
BACKGROUND_SRGB = 0x05 / 255
# Radiance of the overhead softbox that metal surfaces reflect.
STUDIO_DOME = {"dark": 0.4, "silver": 3.0}
EXPOSURE = {"dark": 0.2, "silver": 0.45}


def srgb_to_linear(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def world_bounds(objs):
    pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return lo, hi


def import_model(filename: str, collection_name: str):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(MODELS / filename))
    new = [o for o in bpy.data.objects if o not in before]

    coll = bpy.data.collections.new(collection_name)
    bpy.context.scene.collection.children.link(coll)
    for o in new:
        for c in list(o.users_collection):
            c.objects.unlink(o)
        coll.objects.link(o)

    rig = bpy.data.objects.new(f"{collection_name}_rig", None)
    coll.objects.link(rig)
    for o in new:
        if o.parent is None:
            o.parent = rig
    return rig, coll, [o for o in new if o.type == "MESH"]


def mean_normal(obj) -> Vector:
    mw = obj.matrix_world
    nmat = mw.to_3x3().inverted().transposed()
    total = Vector((0, 0, 0))
    for p in obj.data.polygons:
        total += (nmat @ p.normal) * p.area
    return total.normalized()


def front_direction(screen, meshes, front_from):
    if front_from == "normal":
        return mean_normal(screen)
    # Screen sits on the front face, so its centre is offset from the body centre toward the front.
    lo, hi = world_bounds(meshes)
    body = (lo + hi) / 2
    verts = [screen.matrix_world @ v.co for v in screen.data.vertices]
    centroid = sum(verts, Vector((0, 0, 0))) / len(verts)
    return centroid - body


def clip_to_bezel(mesh, body, margin=0.0008):
    """Pull front-face vertices inside the metal body's rounded outline.

    The display frame's corner is sharper than the chassis, so it pokes out over the laptop.
    """
    import numpy as np

    rim = []
    for v in body.data.vertices:
        p = body.matrix_world @ v.co
        if p.y > 0.0032:
            rim.append((p.x, p.z))
    rim = np.array(rim)
    bins = 720
    ang = np.arctan2(rim[:, 1], rim[:, 0])
    rad = np.hypot(rim[:, 0], rim[:, 1])
    slot = np.floor((ang + math.pi) / (2 * math.pi) * bins).astype(int) % bins
    edge = np.full(bins, np.nan)
    for i, r in zip(slot, rad):
        if not np.isfinite(edge[i]) or r > edge[i]:
            edge[i] = r
    known = np.flatnonzero(np.isfinite(edge))
    missing = np.flatnonzero(~np.isfinite(edge))
    if len(missing):
        dist = np.minimum(
            np.abs(missing[:, None] - known[None, :]),
            bins - np.abs(missing[:, None] - known[None, :]),
        )
        edge[missing] = edge[known[dist.argmin(axis=1)]]

    mw = mesh.matrix_world.copy()
    inv = mw.inverted()
    moved = 0
    for v in mesh.data.vertices:
        p = mw @ v.co
        r = math.hypot(p.x, p.z)
        if r < 1e-8:
            continue
        limit = edge[int((math.atan2(p.z, p.x) + math.pi) / (2 * math.pi) * bins) % bins] - margin
        if r > limit:
            p.x *= limit / r
            p.z *= limit / r
            v.co = inv @ p
            moved += 1
    mesh.data.update()
    print(f"clipped {moved} {mesh.name} vertices inside the bezel")


def place(rig, meshes, screen, location, yaw, lean=0.0, scale=1.0, front_from="normal"):
    rig.scale = (scale, scale, scale)
    bpy.context.view_layer.update()

    # Turn the model so its screen faces -Y, lean it back, then apply the scene yaw.
    n = front_direction(screen, meshes, front_from)
    face = math.atan2(n.x, -n.y)
    rotation = (
        Matrix.Rotation(math.radians(yaw), 4, "Z")
        @ Matrix.Rotation(math.radians(-lean), 4, "X")
        @ Matrix.Rotation(-face, 4, "Z")
    )
    rig.rotation_euler = rotation.to_euler()
    bpy.context.view_layer.update()

    lo, hi = world_bounds(meshes)
    cx = (lo.x + hi.x) / 2
    cy = (lo.y + hi.y) / 2
    rig.location = (location[0] - cx, location[1] - cy, location[2] - lo.z)
    bpy.context.view_layer.update()


def make_material(name, *, color=(0, 0, 0), roughness=0.5, metallic=0.0, emission=None, holdout=False):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    if holdout:
        node = nt.nodes.new("ShaderNodeHoldout")
        nt.links.new(node.outputs[0], out.inputs["Surface"])
        return mat
    if emission is not None:
        node = nt.nodes.new("ShaderNodeEmission")
        node.inputs["Color"].default_value = (*emission, 1)
        node.inputs["Strength"].default_value = 1.0
        nt.links.new(node.outputs[0], out.inputs["Surface"])
        return mat
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    nt.links.new(bsdf.outputs[0], out.inputs["Surface"])
    return mat


def camera_holdout(name, emission):
    """Emits `emission` to reflections but is cut out where the camera sees it directly."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    glow = nt.nodes.new("ShaderNodeEmission")
    glow.inputs["Color"].default_value = (*emission, 1)
    glow.inputs["Strength"].default_value = 1.0
    holdout = nt.nodes.new("ShaderNodeHoldout")
    path = nt.nodes.new("ShaderNodeLightPath")
    mix = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(path.outputs["Is Camera Ray"], mix.inputs["Fac"])
    nt.links.new(glow.outputs[0], mix.inputs[1])
    nt.links.new(holdout.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs["Surface"])
    return mat


def set_material(obj, mat):
    for slot in obj.material_slots:
        slot.material = mat


def add_area_light(name, location, target, size, energy, color=(1, 1, 1), glossy=True):
    data = bpy.data.lights.new(name, "AREA")
    data.shape = "RECTANGLE"
    data.size, data.size_y = size
    data.energy = energy
    data.color = color
    light = bpy.data.objects.new(name, data)
    light.visible_glossy = glossy
    bpy.context.scene.collection.objects.link(light)
    light.location = location
    direction = Vector(target) - Vector(location)
    light.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    return light


def screen_corners(scene, cam, obj):
    """Fit the screen surface as P = A + u*B + v*C over its UVs, then project the UV box corners."""
    import numpy as np

    mesh = obj.data
    uv = mesh.uv_layers.active.data
    mw = obj.matrix_world
    rows, pts = [], []
    for loop in mesh.loops:
        u, v = uv[loop.index].uv
        rows.append((1.0, u, v))
        pts.append(tuple(mw @ mesh.vertices[loop.vertex_index].co))
    a = np.array(rows)
    p = np.array(pts)
    coeff, *_ = np.linalg.lstsq(a, p, rcond=None)
    origin, du, dv = (Vector(coeff[i]) for i in range(3))

    us = a[:, 1]
    vs = a[:, 2]
    umin, umax, vmin, vmax = us.min(), us.max(), vs.min(), vs.max()

    def world_at(u, v):
        return origin + du * u + dv * v

    def cam_x(p):
        return world_to_camera_view(scene, cam, p).x

    # UV orientation differs per model, so take "up" from world Z and "left" from the camera.
    v_top, v_bottom = (vmax, vmin) if world_at(umin, vmax).z > world_at(umin, vmin).z else (vmin, vmax)
    u_left, u_right = (umin, umax) if cam_x(world_at(umin, v_top)) < cam_x(world_at(umax, v_top)) else (umax, umin)
    named = {
        "topLeft": (u_left, v_top),
        "topRight": (u_right, v_top),
        "bottomRight": (u_right, v_bottom),
        "bottomLeft": (u_left, v_bottom),
    }
    def to_pixels(p):
        ndc = world_to_camera_view(scene, cam, p)
        return [round(ndc.x * WIDTH, 2), round((1 - ndc.y) * HEIGHT, 2)]

    out, mirrored = {}, {}
    for key, (u, v) in named.items():
        p = world_at(u, v)
        out[key] = to_pixels(p)
        # The floor is the z = 0 plane, so the mirror image of a point just flips its height.
        mirrored[key] = to_pixels(Vector((p.x, p.y, -p.z)))
    width_cm = (du * (umax - umin)).length
    height_cm = (dv * (vmax - vmin)).length
    return out, mirrored, width_cm / height_cm


def configure_render(scene, *, samples, transparent, view="AgX", denoise=True, exposure=None, color_depth="16"):
    scene.render.engine = "CYCLES"
    scene.cycles.samples = samples
    scene.cycles.use_denoising = denoise
    scene.render.film_transparent = transparent
    scene.render.resolution_x = WIDTH
    scene.render.resolution_y = HEIGHT
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = color_depth
    scene.view_settings.view_transform = view
    scene.view_settings.look = "None"
    if exposure is None:
        exposure = EXPOSURE[FINISH] if view == "AgX" else 0.0
    elif view != "AgX":
        exposure = 0.0
    scene.view_settings.exposure = exposure
    scene.cycles.filter_width = 1.5


def use_gpu(scene):
    prefs = bpy.context.preferences.addons["cycles"].preferences
    try:
        prefs.compute_device_type = "METAL"
        prefs.get_devices()
        for d in prefs.devices:
            d.use = True
        scene.cycles.device = "GPU"
    except Exception as exc:  # noqa: BLE001
        print("GPU unavailable, using CPU:", exc)
        scene.cycles.device = "CPU"


def save_blend(scene):
    scene.cycles.preview_samples = 64
    scene.cycles.use_preview_denoising = True
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(FINISH_DIR / "mockup.blend"), copy=True)


def principled(mat):
    if not mat or not mat.use_nodes:
        return None
    return next((n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)


def chassis_materials(meshes, screen):
    seen = set()
    for o in meshes:
        if o is screen:
            continue
        for slot in o.material_slots:
            bsdf = principled(slot.material)
            if bsdf and slot.material.name not in seen:
                seen.add(slot.material.name)
                yield slot.material, bsdf


def original_laptop_colors():
    """Flat base colours from the unrigged MacBook, which still has Apple's silver finish."""
    before = set(bpy.data.objects)
    before_mats = set(bpy.data.materials)
    bpy.ops.import_scene.gltf(filepath=str(MODELS / "macbook-pro-16.decoded.glb"))
    colors = {}
    for mat in set(bpy.data.materials) - before_mats:
        bsdf = principled(mat)
        if bsdf and not bsdf.inputs["Base Color"].is_linked:
            colors[mat.name] = tuple(bsdf.inputs["Base Color"].default_value)
    bpy.data.batch_remove([o for o in bpy.data.objects if o not in before])
    bpy.data.batch_remove(list(set(bpy.data.materials) - before_mats))
    bpy.data.orphans_purge(do_recursive=True)
    return colors


def apply_silver(meshes, screen, colors):
    # The rig's author repainted the chassis space black; restore the original colours by material name.
    # PaletteMaterial002 is the merged deck and lid shell, all sampling one black mirror swatch, so it
    # takes the bottom case's silver with a satin, bead-blasted finish.
    for mat, bsdf in chassis_materials(meshes, screen):
        base = bsdf.inputs["Base Color"]
        if mat.name == "PaletteMaterial002":
            for name in ("Base Color", "Metallic", "Roughness"):
                for link in list(bsdf.inputs[name].links):
                    mat.node_tree.links.remove(link)
            base.default_value = colors["CRQixVLpahJzhJc"]
            bsdf.inputs["Metallic"].default_value = 1.0
            bsdf.inputs["Roughness"].default_value = 0.5
        elif not base.is_linked and mat.name in colors:
            base.default_value = colors[mat.name]


def apply_dark(meshes, screen):
    # Space-gray chassis; the rigged model ships as near-black and disappears on a dark floor.
    # Flat dark-gray parts get a lighter gray; true blacks (keys, vents) stay black.
    for mat, bsdf in chassis_materials(meshes, screen):
        nt = mat.node_tree
        base = bsdf.inputs["Base Color"]
        if base.is_linked:
            if mat.name.startswith("PaletteMaterial"):
                source = base.links[0].from_socket
                hsv = nt.nodes.new("ShaderNodeHueSaturation")
                hsv.inputs["Value"].default_value = 3.2
                nt.links.new(source, hsv.inputs["Color"])
                nt.links.new(hsv.outputs["Color"], base)
            continue
        r, g, b, _ = base.default_value
        if 0.02 < max(r, g, b) < 0.12:
            base.default_value = (0.19, 0.195, 0.205, 1)

    # Graphite phone to match the concept; the model ships in silver.
    bsdf = principled(bpy.data.materials.get("Anodized_aluminum"))
    if bsdf:
        links = bsdf.id_data.links
        for link in list(bsdf.inputs["Base Color"].links):
            links.remove(link)
        bsdf.inputs["Base Color"].default_value = (0.045, 0.045, 0.048, 1)
        bsdf.inputs["Metallic"].default_value = 1.0
        bsdf.inputs["Roughness"].default_value = 0.32


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    use_gpu(scene)

    silver_colors = original_laptop_colors() if FINISH == "silver" else {}
    laptop_rig, laptop_coll, laptop_meshes = import_model("macbook-rigged.decoded.glb", "laptop")
    phone_rig, phone_coll, phone_meshes = import_model("iphone-17-pro.decoded.glb", "phone")

    laptop_screen = bpy.data.objects["Screen"]
    phone_screen = bpy.data.objects["Object_23"]
    phone_glass = bpy.data.objects["Object_21"]
    bezel = bpy.data.objects["Object_4"]
    # The chassis side wall is square and shows past the rounded front, over the laptop.
    for name in ("Object_23", "Object_20", "Object_21", "Object_7", "Object_4"):
        clip_to_bezel(bpy.data.objects[name], bezel, margin=0.0005)

    place(laptop_rig, laptop_meshes, laptop_screen, LAPTOP["location"], LAPTOP["yaw"])
    place(
        phone_rig,
        phone_meshes,
        phone_screen,
        PHONE["location"],
        PHONE["yaw"],
        PHONE["lean"],
        scale=100.0,
        front_from="offset",
    )

    if FINISH == "silver":
        apply_silver(laptop_meshes, laptop_screen, silver_colors)
    else:
        apply_dark(laptop_meshes, laptop_screen)

    # Glossy black floor, the "glass table".
    bpy.ops.mesh.primitive_plane_add(size=4000, location=(0, 0, 0))
    floor = bpy.context.active_object
    floor.name = "Floor"
    floor_mat = bpy.data.materials.new("Floor")
    floor_mat.use_nodes = True
    fb = floor_mat.node_tree.nodes["Principled BSDF"]
    fb.inputs["Base Color"].default_value = (0.0035, 0.0035, 0.0037, 1)
    fb.inputs["Roughness"].default_value = 0.1
    fb.inputs["Specular IOR Level"].default_value = 0.9
    floor.data.materials.append(floor_mat)

    bg = srgb_to_linear(BACKGROUND_SRGB)
    world = bpy.data.worlds.new("World")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (bg, bg, bg, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.0
    scene.world = world

    # Broad overhead softbox for metal to reflect; Blender area lights emit power / (pi * area) radiance.
    dome_size = 500
    dome = add_area_light(
        "Dome", (0, 0, 200), (0, 0, 0), (dome_size, dome_size), STUDIO_DOME[FINISH] * math.pi * dome_size**2
    )
    dome.visible_camera = False

    lights = [
        dome,
        add_area_light("Key", (-70, -80, 100), (0, 0, 8), (100, 70), 150000),
        add_area_light("Rim", (80, 80, 55), (0, 0, 10), (60, 40), 70000, color=(0.92, 0.95, 1.0)),
        add_area_light("RimLeft", (-90, 60, 45), (0, 0, 10), (50, 40), 45000, color=(0.95, 0.97, 1.0)),
        add_area_light("Fill", (50, -120, 35), (0, 0, 10), (90, 50), 22000, glossy=False),
        add_area_light("Top", (0, 15, 150), (0, 0, 0), (130, 130), 40000),
    ]

    # Lights only hit the devices, so the floor stays a clean black mirror with no hot spots.
    receivers = bpy.data.collections.new("LightReceivers")
    for o in laptop_meshes + phone_meshes:
        receivers.objects.link(o)
    for light in lights:
        light.light_linking.receiver_collection = receivers

    cam_data = bpy.data.cameras.new("Camera")
    cam_data.lens = CAMERA["lens"]
    cam_data.sensor_width = 36
    cam_data.sensor_fit = "HORIZONTAL"
    cam_data.shift_y = CAMERA_SHIFT_Y
    cam = bpy.data.objects.new("Camera", cam_data)
    scene.collection.objects.link(cam)
    target = Vector(CAMERA["target"])
    el = math.radians(CAMERA["elevation"])
    az = math.radians(CAMERA["azimuth"])
    d = CAMERA["distance"]
    cam.location = target + Vector((math.sin(az) * math.cos(el) * d, -math.cos(az) * math.cos(el) * d, math.sin(el) * d))
    cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
    scene.camera = cam
    bpy.context.view_layer.update()

    # Corner projection reads the frame aspect from the render resolution, so set it first.
    configure_render(scene, samples=SAMPLES, transparent=False)
    laptop_corners, laptop_reflection, laptop_aspect = screen_corners(scene, cam, laptop_screen)
    phone_corners, phone_reflection, phone_aspect = screen_corners(scene, cam, phone_screen)

    originals = {o.name: [s.material for s in o.material_slots] for o in bpy.data.objects if o.type == "MESH"}

    def restore():
        for o in bpy.data.objects:
            if o.type == "MESH":
                o.hide_render = False
                for slot, mat in zip(o.material_slots, originals[o.name]):
                    slot.material = mat

    screen_black = make_material("ScreenBlack", color=(0.0, 0.0, 0.0), roughness=0.08)

    # Pass 1: full scene with black screens.
    set_material(laptop_screen, screen_black)
    set_material(phone_screen, screen_black)
    configure_render(scene, samples=SAMPLES, transparent=False)
    scene.render.filepath = str(OUT / "scene.png")
    save_blend(scene)
    bpy.ops.render.render(write_still=True)
    restore()

    # Pass 2: screen masks. Everything else is a holdout so it still occludes.
    holdout = make_material("Holdout", holdout=True)
    for o in bpy.data.objects:
        if o.type == "MESH":
            set_material(o, holdout)
    floor.hide_render = True
    phone_glass.hide_render = True
    set_material(laptop_screen, make_material("MaskLaptop", emission=(1.0, 0.0, 0.0)))
    set_material(phone_screen, make_material("MaskPhone", emission=(0.0, 1.0, 0.0)))
    configure_render(scene, samples=max(64, SAMPLES // 4), transparent=True, view="Standard", denoise=False)
    scene.render.filepath = str(OUT / "masks.png")
    bpy.ops.render.render(write_still=True)
    restore()

    # Pass 3: reflections on the screen glass only.
    for o in bpy.data.objects:
        if o.type == "MESH":
            set_material(o, holdout)
    floor.hide_render = True
    phone_glass.hide_render = True
    glass = make_material("ScreenGlass", color=(0.0, 0.0, 0.0), roughness=0.04)
    set_material(laptop_screen, glass)
    set_material(phone_screen, glass)
    # The overhead softbox would wash the screenshots out; it's only there for the metal.
    dome.hide_render = True
    configure_render(scene, samples=SAMPLES, transparent=True)
    scene.render.filepath = str(OUT / "glare.png")
    bpy.ops.render.render(write_still=True)
    dome.hide_render = False
    restore()

    # Pass 4: how each screen shows up in the floor. The screen glows white and everything else is an
    # unlit occluder, so the floor's blur, falloff and the device bodies hiding it are all baked in.
    # Device pixels seen directly are held out so only the floor remains.
    occluder = camera_holdout("ReflectOccluder", (0.0, 0.0, 0.0))
    emitter = camera_holdout("ReflectEmitter", (1.0, 1.0, 1.0))
    black_world = bpy.data.worlds.new("Black")
    black_world.use_nodes = True
    black_world.node_tree.nodes["Background"].inputs["Color"].default_value = (0, 0, 0, 1)
    scene.world = black_world
    for light in lights:
        light.hide_render = True
    for name, screen in (("laptop", laptop_screen), ("phone", phone_screen)):
        for o in bpy.data.objects:
            if o.type == "MESH" and o is not floor:
                set_material(o, emitter if o is screen else occluder)
        phone_glass.hide_render = True
        configure_render(scene, samples=SAMPLES, transparent=True, view="Raw")
        scene.render.filepath = str(OUT / f"reflect-{name}.png")
        bpy.ops.render.render(write_still=True)
        restore()
    for light in lights:
        light.hide_render = False
    scene.world = world

    corners = {
        "canvas": {"width": WIDTH, "height": HEIGHT},
        "laptop": {
            "aspect": round(laptop_aspect, 4),
            "corners": laptop_corners,
            "reflectionCorners": laptop_reflection,
        },
        "phone": {
            "aspect": round(phone_aspect, 4),
            "corners": phone_corners,
            "reflectionCorners": phone_reflection,
        },
    }
    (OUT / "corners.json").write_text(json.dumps(corners, indent=2))
    print("CORNERS", json.dumps(corners))


# Screen-swappable singles. No floor, so there is nothing for a screen to reflect in.
CATALOG_POSES = {
    "laptop": [
        {"name": "three-quarter-left", "yaw": 32.0, "lean": 0.0, "elevation": 16.0, "azimuth": 0.0},
        {"name": "three-quarter-right", "yaw": -32.0, "lean": 0.0, "elevation": 16.0, "azimuth": 0.0},
        {"name": "front", "yaw": 0.0, "lean": 0.0, "elevation": 24.0, "azimuth": 0.0},
    ],
    "phone": [
        {"name": "three-quarter-left", "yaw": 26.0, "lean": 8.0, "elevation": 10.0, "azimuth": 0.0},
        {"name": "three-quarter-right", "yaw": -26.0, "lean": 8.0, "elevation": 10.0, "azimuth": 0.0},
        {"name": "front", "yaw": 0.0, "lean": 2.0, "elevation": 2.0, "azimuth": 0.0},
    ],
}
CATALOG_COLORS = {
    "silver": None,
    "graphite": (0.045, 0.045, 0.048),
    "blue": tuple(srgb_to_linear(c) for c in (0.227, 0.361, 0.541)),
    "gold": tuple(srgb_to_linear(c) for c in (0.769, 0.627, 0.408)),
}
CATALOG_LOOK = {
    "silver": {"dome": 3.0, "exposure": 0.45},
    "graphite": {"dome": 1.4, "exposure": 0.38},
    "blue": {"dome": 3.0, "exposure": 0.45},
    "gold": {"dome": 2.6, "exposure": 0.42},
}


def tint_shell(meshes, screen, color):
    """Recolor the metallic chassis. Keys, vents, and dark plastic stay as they are."""
    for mat, bsdf in chassis_materials(meshes, screen):
        base = bsdf.inputs["Base Color"]
        metallic = bsdf.inputs.get("Metallic")
        if metallic is None or base.is_linked:
            continue
        light = max(base.default_value[:3]) > 0.2
        if metallic.is_linked:
            if not light:
                continue
        elif float(metallic.default_value) < 0.5 or not light:
            continue
        base.default_value = (color[0], color[1], color[2], 1.0)
        if not metallic.is_linked:
            metallic.default_value = 1.0
        roughness = bsdf.inputs.get("Roughness")
        if roughness is not None and not roughness.is_linked:
            roughness.default_value = 0.42


def tint_phone(color, roughness=0.32):
    bsdf = principled(bpy.data.materials.get("Anodized_aluminum"))
    if not bsdf:
        return
    links = bsdf.id_data.links
    for link in list(bsdf.inputs["Base Color"].links):
        links.remove(link)
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Metallic"].default_value = 1.0
    bsdf.inputs["Roughness"].default_value = roughness


def fit_camera(scene, cam, meshes, elevation, azimuth, fill=0.86):
    """Orbit the camera so the device fills the frame, with even padding."""
    bpy.context.view_layer.update()
    lo, hi = world_bounds(meshes)
    center = (lo + hi) / 2
    radius = max((hi - lo).length / 2, 0.001)
    lens = cam.data.lens
    hfov = 2 * math.atan(cam.data.sensor_width / (2 * lens))
    dist = radius / math.sin(hfov / 2)

    def move(distance):
        el = math.radians(elevation)
        az = math.radians(azimuth)
        cam.location = center + Vector(
            (
                math.sin(az) * math.cos(el) * distance,
                -math.cos(az) * math.cos(el) * distance,
                math.sin(el) * distance,
            )
        )
        cam.rotation_euler = (center - cam.location).to_track_quat("-Z", "Y").to_euler()
        bpy.context.view_layer.update()

    def projected_span():
        xs, ys = [], []
        for obj in meshes:
            mw = obj.matrix_world
            for vertex in obj.data.vertices:
                p = world_to_camera_view(scene, cam, mw @ vertex.co)
                xs.append(p.x)
                ys.append(p.y)
        return max(max(xs) - min(xs), max(ys) - min(ys))

    move(dist)
    span = projected_span()
    if span > 1e-4:
        move(dist * span / fill)


def render_catalog_variant(device, color_name, pose):
    global WIDTH, HEIGHT, SAMPLES, CAMERA_SHIFT_Y, OUT
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    use_gpu(scene)

    WIDTH, HEIGHT = (960, 720) if PREVIEW else (1920, 1440)
    SAMPLES = 24 if PREVIEW else 64
    CAMERA_SHIFT_Y = 0.0
    OUT = ROOT / "renders" / "catalog" / device / color_name / pose["name"]
    OUT.mkdir(parents=True, exist_ok=True)

    if device == "laptop":
        silver_colors = {} if color_name == "graphite" else original_laptop_colors()
        rig, _coll, meshes = import_model("macbook-rigged.decoded.glb", "laptop")
        screen = bpy.data.objects["Screen"]
        place(rig, meshes, screen, (0.0, 0.0, 0.0), pose["yaw"], pose["lean"])
        if color_name == "graphite":
            apply_dark(meshes, screen)
        else:
            apply_silver(meshes, screen, silver_colors)
        if color_name != "silver":
            tint_shell(meshes, screen, CATALOG_COLORS[color_name])
    else:
        rig, _coll, meshes = import_model("iphone-17-pro.decoded.glb", "phone")
        screen = bpy.data.objects["Object_23"]
        bezel = bpy.data.objects["Object_4"]
        for name in ("Object_23", "Object_20", "Object_21", "Object_7", "Object_4"):
            clip_to_bezel(bpy.data.objects[name], bezel, margin=0.0005)
        place(
            rig,
            meshes,
            screen,
            (0.0, 0.0, 0.0),
            pose["yaw"],
            pose["lean"],
            scale=100.0,
            front_from="offset",
        )
        if color_name != "silver":
            tint_phone(CATALOG_COLORS[color_name])

    world = bpy.data.worlds.new("World")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0, 0, 0, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.0
    scene.world = world

    look = CATALOG_LOOK[color_name]
    dome_size = 500
    dome = add_area_light(
        "Dome", (0, 0, 200), (0, 0, 0), (dome_size, dome_size), look["dome"] * math.pi * dome_size**2
    )
    dome.visible_camera = False
    add_area_light("Key", (-70, -80, 100), (0, 0, 8), (100, 70), 150000)
    add_area_light("Rim", (80, 80, 55), (0, 0, 10), (60, 40), 70000, color=(0.92, 0.95, 1.0))
    add_area_light("RimLeft", (-90, 60, 45), (0, 0, 10), (50, 40), 45000, color=(0.95, 0.97, 1.0))
    add_area_light("Fill", (50, -120, 35), (0, 0, 10), (90, 50), 22000, glossy=False)
    add_area_light("Top", (0, 15, 150), (0, 0, 0), (130, 130), 40000)

    cam_data = bpy.data.cameras.new("Camera")
    cam_data.lens = 70.0
    cam_data.sensor_width = 36
    cam_data.sensor_fit = "HORIZONTAL"
    cam_data.shift_y = 0.0
    cam = bpy.data.objects.new("Camera", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    fit_camera(scene, cam, meshes, pose["elevation"], pose["azimuth"])

    configure_render(scene, samples=SAMPLES, transparent=True, exposure=look["exposure"], color_depth="8")
    corners, _mirrored, aspect = screen_corners(scene, cam, screen)
    originals = {o.name: [s.material for s in o.material_slots] for o in bpy.data.objects if o.type == "MESH"}

    def restore():
        for o in bpy.data.objects:
            if o.type == "MESH":
                o.hide_render = False
                for slot, mat in zip(o.material_slots, originals[o.name]):
                    slot.material = mat

    set_material(screen, make_material("ScreenBlack", color=(0.0, 0.0, 0.0), roughness=0.08))
    configure_render(scene, samples=SAMPLES, transparent=True, exposure=look["exposure"], color_depth="8")
    scene.render.filepath = str(OUT / "scene.png")
    bpy.ops.render.render(write_still=True)
    restore()

    holdout = make_material("Holdout", holdout=True)
    for o in bpy.data.objects:
        if o.type == "MESH":
            set_material(o, holdout)
    glass_obj = bpy.data.objects.get("Object_21")
    if glass_obj:
        glass_obj.hide_render = True
    channel = (1.0, 0.0, 0.0) if device == "laptop" else (0.0, 1.0, 0.0)
    set_material(screen, make_material("Mask", emission=channel))
    configure_render(
        scene, samples=max(16, SAMPLES // 2), transparent=True, view="Standard", denoise=False, color_depth="8"
    )
    scene.render.filepath = str(OUT / "masks.png")
    bpy.ops.render.render(write_still=True)
    restore()

    for o in bpy.data.objects:
        if o.type == "MESH":
            set_material(o, holdout)
    if glass_obj:
        glass_obj.hide_render = True
    set_material(screen, make_material("ScreenGlass", color=(0.0, 0.0, 0.0), roughness=0.04))
    dome.hide_render = True
    configure_render(scene, samples=SAMPLES, transparent=True, exposure=look["exposure"], color_depth="8")
    scene.render.filepath = str(OUT / "glare.png")
    bpy.ops.render.render(write_still=True)
    dome.hide_render = False
    restore()

    payload = {
        "canvas": {"width": WIDTH, "height": HEIGHT},
        "reflections": False,
        "device": device,
        "color": color_name,
        "pose": pose["name"],
        device: {"aspect": round(aspect, 4), "corners": corners},
    }
    (OUT / "corners.json").write_text(json.dumps(payload, indent=2))
    print("CATALOG", device, color_name, pose["name"])


def catalog_main():
    device_filter = arg_value("--device")
    color_filter = arg_value("--color")
    pose_filter = arg_value("--pose")
    devices = [device_filter] if device_filter else ["laptop", "phone"]
    colors = [color_filter] if color_filter else list(CATALOG_COLORS)
    for device in devices:
        if device not in CATALOG_POSES:
            raise SystemExit(f"unknown device: {device}")
        poses = [p for p in CATALOG_POSES[device] if pose_filter in (None, p["name"])]
        if pose_filter and not poses:
            raise SystemExit(f"unknown pose: {pose_filter}")
        for color_name in colors:
            if color_name not in CATALOG_COLORS:
                raise SystemExit(f"unknown color: {color_name}")
            for pose in poses:
                render_catalog_variant(device, color_name, pose)
    print("catalog done", FINISH_DIR)


if os.environ.get("MOCKUP_IMPORT_ONLY") != "1":
    if CATALOG:
        catalog_main()
    else:
        main()
