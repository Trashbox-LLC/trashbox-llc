"""Turn the Blender passes into Figma layers and a preview.

Run:
  python3 compose.py [--finish dark|silver] [--preview] [--laptop path] [--phone path]

Reads renders/<finish>/ (or renders/<finish>/preview/) and writes:
  template.png        scene with the screens cut out (put screenshots underneath)
  screen-glare.png    glass reflections, clipped to the screens (Screen blend, on top)
  mask-laptop.png     white where the laptop screen shows
  mask-phone.png      white where the phone screen shows
  reflection-mask-laptop.png, reflection-mask-phone.png
                      how strongly each screen shows in the floor (mask the mirrored screenshot with it)
  preview.png         template with sample screenshots and their reflections placed, to check the fit
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
parser.add_argument("--laptop", default=str(REPO / "public/images/work/wide/texas-covenant.webp"))
parser.add_argument(
    "--phone",
    default=str(
        Path.home()
        / ".cursor/projects/Users-ezekielmohr-Coding-Projects-Trashbox-Projects-Websites-trashbox-llc/assets/01-today-3e382d0f-cb43-4b35-bb74-452cbf853472.jpg"
    ),
)
args = parser.parse_args()

SRC = ROOT / "renders" / args.finish / ("preview" if args.preview else "")
OUT = SRC
# Softening for the mirrored screenshot, as a fraction of its width, to match the slightly rough floor.
REFLECTION_BLUR = 0.006
# The phone's display panel is a sharper corner than the metal bezel, so the screenshot
# gets clipped to the bezel's rounded opening. Radii are fractions of the screen width and height.
# Just past the panel's own corner, so only the tip that clears the bezel is removed.
PHONE_CORNER = (0.19, 0.092)
PHONE_INSET = (0.0, 0.0)
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


def screen_uv(corners, shape):
    """Map every output pixel back to the screen's 0–1 surface coordinates."""
    unit = [(0, 0), (1, 0), (1, 1), (0, 1)]
    dst = [corners["topLeft"], corners["topRight"], corners["bottomRight"], corners["bottomLeft"]]
    a, b, c, d, e, f, g, h = perspective_coeffs(unit, dst)
    y, x = np.mgrid[0 : shape[0], 0 : shape[1]].astype(np.float64)
    denom = g * x + h * y + 1
    return (a * x + b * y + c) / denom, (d * x + e * y + f) / denom


def rounded_opening(u, v, radius, inset):
    """True where a screen pixel sits inside the bezel's rounded rectangle."""
    ru, rv = radius
    iu, iv = inset
    u = (u - iu) / (1 - 2 * iu)
    v = (v - iv) / (1 - 2 * iv)
    ax = np.abs(u - 0.5)
    ay = np.abs(v - 0.5)
    dx = ax - (0.5 - ru)
    dy = ay - (0.5 - rv)
    corner = (dx > 0) & (dy > 0)
    inside_corner = (dx / ru) ** 2 + (dy / rv) ** 2 <= 1
    return (u >= 0) & (u <= 1) & (v >= 0) & (v <= 1) & (~corner | inside_corner)


def warp(image: Image.Image, corners: dict, size) -> Image.Image:
    w, h = image.size
    src = [(0, 0), (w, 0), (w, h), (0, h)]
    dst = [corners["topLeft"], corners["topRight"], corners["bottomRight"], corners["bottomLeft"]]
    coeffs = perspective_coeffs(src, dst)
    return image.convert("RGBA").transform(size, Image.Transform.PERSPECTIVE, coeffs, Image.Resampling.BICUBIC)


scene = load("scene.png")
masks = load("masks.png")
glare = load("glare.png")
info = json.loads((SRC / "corners.json").read_text())

laptop_mask = masks[..., 0] * masks[..., 3]
phone_panel = masks[..., 1] * masks[..., 3]
phone_u, phone_v = screen_uv(info["phone"]["corners"], phone_panel.shape)
phone_mask = phone_panel * rounded_opening(phone_u, phone_v, PHONE_CORNER, PHONE_INSET)
screen_mask = np.clip(laptop_mask + phone_mask, 0, 1)

def dilate(mask: np.ndarray, radius: int) -> np.ndarray:
    image = Image.fromarray((mask > 0.02).astype(np.uint8) * 255)
    image = image.filter(ImageFilter.MaxFilter(radius * 2 + 1))
    return np.asarray(image) > 0


template = scene.copy()
# The panel's square corner is black geometry that draws past the bezel, over the laptop.
# Drop it, and the whole panel, so the laptop screenshot behind shows through.
lu, lv = screen_uv(info["laptop"]["corners"], phone_panel.shape)
on_laptop = (lu > 0) & (lu < 1) & (lv > 0) & (lv < 1)
dark = scene[..., :3].max(axis=-1) < 0.12
notch = dilate(phone_panel, 3) & (phone_panel <= 0.02) & on_laptop & dark
template[..., 3] = np.where((phone_panel > 0.02) | notch, 0.0, 1.0 - laptop_mask)
save(template, "template.png")

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
    if device == "phone":
        ru, rv = screen_uv(info["phone"]["reflectionCorners"], physical.shape)
        physical = physical * rounded_opening(ru, rv, PHONE_CORNER, PHONE_INSET)
    reflection_masks[device] = physical * fade * REFLECTION_STRENGTH
    save(white_with_alpha(reflection_masks[device]), f"reflection-mask-{device}.png")

size = (scene.shape[1], scene.shape[0])
shots = {
    "laptop": cover(Image.open(args.laptop).convert("RGB"), info["laptop"]["aspect"]),
    "phone": cover(Image.open(args.phone).convert("RGB"), info["phone"]["aspect"]),
}

def place_screen(shot, device, opening):
    layer = np.asarray(warp(shot, info[device]["corners"], size)).astype(np.float64) / 255.0
    if opening is not None:
        layer[..., 3] *= opening
    return Image.fromarray(np.clip(layer * 255.0 + 0.5, 0, 255).astype(np.uint8), "RGBA")


canvas = Image.new("RGBA", size, (0, 0, 0, 255))
canvas.alpha_composite(place_screen(shots["laptop"], "laptop", None))
canvas.alpha_composite(place_screen(shots["phone"], "phone", phone_mask))
canvas.alpha_composite(Image.open(OUT / "template.png"))
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
