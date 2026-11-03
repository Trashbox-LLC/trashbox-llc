"""Turn the Blender passes into Figma layers and a preview.

Run:
  python3 compose.py [--finish dark|silver] [--preview] [--laptop path] [--phone path]
  python3 compose.py --src renders/catalog/laptop/silver/three-quarter-left --laptop path

Reads renders/<finish>/ (or renders/<finish>/preview/) and writes:
  template.png        scene with the screens cut out (put screenshots underneath)
  screen-glare.png    glass reflections, clipped to the screens (Screen blend, on top)
  mask-laptop.png     white where the laptop screen shows
  mask-phone.png      white where the phone screen shows
  reflection-mask-laptop.png, reflection-mask-phone.png
                      how strongly each screen shows in the floor (mask the mirrored screenshot with it)
  preview.png         template with sample screenshots and their reflections placed, to check the fit

A catalog render (renders/catalog/<device>/<color>/<pose>/, no floor reflection) uses the same
command. Pass --laptop or --phone for the one device that folder contains. The other shot is ignored.
"""

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[1]

parser = argparse.ArgumentParser()
parser.add_argument("--finish", choices=["dark", "silver"], default="dark")
parser.add_argument("--preview", action="store_true")
parser.add_argument("--laptop", default=str(ROOT / "shots/texas-covenant-laptop.png"))
parser.add_argument(
    "--phone",
    default=str(
        Path.home()
        / ".cursor/projects/Users-ezekielmohr-Coding-Projects-Trashbox-Projects-Websites-trashbox-llc/assets/01-today-3e382d0f-cb43-4b35-bb74-452cbf853472.jpg"
    ),
)
parser.add_argument("--src", default="", help="Render folder to compose. Defaults to renders/<finish>/.")
args = parser.parse_args()

SRC = Path(args.src) if args.src else ROOT / "renders" / args.finish / ("preview" if args.preview else "")
if not SRC.is_absolute():
    SRC = (ROOT / SRC).resolve()
OUT = SRC
# Softening for the mirrored screenshot, as a fraction of its width, to match the slightly rough floor.
REFLECTION_BLUR = 0.006
REFLECTION_STRENGTH = 0.55
REFLECTION_FADE = 1.6


def load(name: str) -> np.ndarray:
    im = Image.open(SRC / name)
    if im.mode not in ("RGBA", "RGBA;16"):
        im = im.convert("RGBA")
    arr = np.asarray(im)
    if arr.dtype == np.uint16:
        return arr.astype(np.float64) / 65535.0
    return arr.astype(np.float64) / 255.0


def save(arr: np.ndarray, name: str) -> None:
    Image.fromarray(np.clip(arr * 255.0 + 0.5, 0, 255).astype(np.uint8), "RGBA").save(OUT / name)


def cover(image: Image.Image, aspect: float) -> Image.Image:
    """Crop to the screen aspect, anchored to the top like object-cover object-top."""
    w, h = image.size
    if w / h > aspect:
        nw = round(h * aspect)
        left = (w - nw) // 2
        return image.crop((left, 0, left + nw, h))
    nh = round(w / aspect)
    return image.crop((0, 0, w, nh))


def perspective_coeffs(src_pts, dst_pts):
    """Coefficients for PIL's PERSPECTIVE transform, which maps output pixels back to input."""
    rows, rhs = [], []
    for (x, y), (u, v) in zip(dst_pts, src_pts):
        rows.append([x, y, 1, 0, 0, 0, -u * x, -u * y])
        rows.append([0, 0, 0, x, y, 1, -v * x, -v * y])
        rhs.extend([u, v])
    return np.linalg.solve(np.array(rows, dtype=np.float64), np.array(rhs, dtype=np.float64))


def warp(image: Image.Image, corners: dict, size) -> Image.Image:
    w, h = image.size
    src = [(0, 0), (w, 0), (w, h), (0, h)]
    dst = [corners["topLeft"], corners["topRight"], corners["bottomRight"], corners["bottomLeft"]]
    coeffs = perspective_coeffs(src, dst)
    return image.convert("RGBA").transform(size, Image.Transform.PERSPECTIVE, coeffs, Image.Resampling.BICUBIC)


def compose_solo(scene, masks, glare, info):
    """One device, no floor. The screenshot replaces the screen; the background stays empty."""
    device = info["device"]
    channel = 0 if device == "laptop" else 1
    mask = masks[..., channel] * masks[..., 3]
    cover_mask = (mask > 0.02).astype(np.float64)
    shot_path = args.laptop if device == "laptop" else args.phone
    shot = cover(Image.open(shot_path).convert("RGB"), info[device]["aspect"])
    size = (scene.shape[1], scene.shape[0])

    def screen_layer(image, opening):
        layer = np.asarray(warp(image, info[device]["corners"], size)).astype(np.float64) / 255.0
        layer[..., 3] *= opening
        return layer

    layer = screen_layer(shot, cover_mask)
    template = scene.copy()
    template[..., 3] = np.where(layer[..., 3] > 0.5, 0.0, scene[..., 3])
    save(template, "template.png")

    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    canvas.alpha_composite(Image.fromarray(np.clip(layer * 255.0 + 0.5, 0, 255).astype(np.uint8), "RGBA"))
    canvas.alpha_composite(Image.open(OUT / "template.png"))
    base = np.asarray(canvas).astype(np.float64) / 255.0
    glare_rgb = glare[..., :3] * (glare[..., 3] * cover_mask)[..., None]
    base[..., :3] = 1.0 - (1.0 - base[..., :3]) * (1.0 - glare_rgb)
    save(base, "preview.png")
    print("wrote template.png, preview.png")


scene = load("scene.png")
masks = load("masks.png")
glare = load("glare.png")
info = json.loads((SRC / "corners.json").read_text())
if info.get("reflections", True) is False:
    compose_solo(scene, masks, glare, info)
    raise SystemExit(0)

laptop_mask = masks[..., 0] * masks[..., 3]
# The rendered screen is already the rounded panel inside the bezel. Its edge is
# only partly opaque, and that fringe was letting the laptop show through. Cover
# the whole panel, including the fringe, so the screenshot meets the bezel.
phone_mask = masks[..., 1] * masks[..., 3]
phone_cover = (phone_mask > 0.02).astype(np.float64)
screen_mask = np.clip(laptop_mask + phone_mask, 0, 1)

template = scene.copy()
# Alpha is set after the phone screenshot is warped, so the cutout matches
# pixels the screenshot actually covers.

glare_out = glare.copy()
glare_out[..., 3] = glare[..., 3] * screen_mask
save(glare_out, "screen-glare.png")

def white_with_alpha(alpha: np.ndarray) -> np.ndarray:
    m = np.zeros(scene.shape)
    m[..., :3] = 1.0
    m[..., 3] = alpha
    return m


def screen_blend(base: np.ndarray, layer_rgb: np.ndarray) -> None:
    base[..., :3] = 1.0 - (1.0 - base[..., :3]) * (1.0 - layer_rgb)


save(white_with_alpha(laptop_mask), "mask-laptop.png")
save(white_with_alpha(phone_mask), "mask-phone.png")

# Reflection passes are linear light; the 1/2.2 power turns them into a display-space opacity, which is
# what a Figma mask applies to an sRGB screenshot.
def screen_v(corners: dict, shape) -> np.ndarray:
    """Vertical position on the screen (0 = top edge, 1 = bottom edge) for every output pixel."""
    unit = [(0, 0), (1, 0), (1, 1), (0, 1)]
    dst = [corners["topLeft"], corners["topRight"], corners["bottomRight"], corners["bottomLeft"]]
    a, b, c, d, e, f, g, h = perspective_coeffs(unit, dst)
    y, x = np.mgrid[0 : shape[0], 0 : shape[1]].astype(np.float64)
    return np.clip((d * x + e * y + f) / (g * x + h * y + 1), 0, 1)


reflection_masks = {}
for device in ("laptop", "phone"):
    r = load(f"reflect-{device}.png")
    physical = np.clip(r[..., 0] * r[..., 3], 0, 1) ** (1 / 2.2)
    # The mirrored screen's bottom edge touches the device; fade toward its far (top) edge like a glass table.
    fade = screen_v(info[device]["reflectionCorners"], physical.shape) ** REFLECTION_FADE
    reflection_masks[device] = physical * fade * REFLECTION_STRENGTH
    save(white_with_alpha(reflection_masks[device]), f"reflection-mask-{device}.png")

size = (scene.shape[1], scene.shape[0])
shots = {
    "laptop": cover(Image.open(args.laptop).convert("RGB"), info["laptop"]["aspect"]),
    "phone": cover(Image.open(args.phone).convert("RGB"), info["phone"]["aspect"]),
}

def screen_layer(shot, device, opening):
    layer = np.asarray(warp(shot, info[device]["corners"], size)).astype(np.float64) / 255.0
    if opening is not None:
        layer[..., 3] *= opening
    return layer


def to_image(layer):
    return Image.fromarray(np.clip(layer * 255.0 + 0.5, 0, 255).astype(np.uint8), "RGBA")


phone_layer = screen_layer(shots["phone"], "phone", phone_cover)
template[..., 3] = np.where(phone_layer[..., 3] > 0.5, 0.0, 1.0 - laptop_mask)
save(template, "template.png")

canvas = Image.new("RGBA", size, (0, 0, 0, 255))
canvas.alpha_composite(to_image(screen_layer(shots["laptop"], "laptop", None)))
canvas.alpha_composite(to_image(phone_layer))
canvas.alpha_composite(to_image(template))
base = np.asarray(canvas).astype(np.float64) / 255.0

for device, shot in shots.items():
    blurred = shot.filter(ImageFilter.GaussianBlur(REFLECTION_BLUR * shot.width))
    mirrored = np.asarray(warp(blurred, info[device]["reflectionCorners"], size)).astype(np.float64) / 255.0
    screen_blend(base, mirrored[..., :3] * reflection_masks[device][..., None])

screen_blend(base, glare_out[..., :3] * glare_out[..., 3:4])
base[..., 3] = 1.0
save(base, "preview.png")

print(
    "wrote",
    ", ".join(
        [
            "template.png",
            "screen-glare.png",
            "mask-laptop.png",
            "mask-phone.png",
            "reflection-mask-laptop.png",
            "reflection-mask-phone.png",
            "preview.png",
        ]
    ),
)
