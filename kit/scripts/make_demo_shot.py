"""Renders the demo's stand-in 3D shot: a shaded coin carrying the brand mark, turning once in 24
frames (a seamless loop), 600 px RGBA, into public/3d/spin/0001.png onward, and adds its entry to
public/3d/manifest.json with quality "generated".

The coin takes its colour (BRAND.accent) and its mark (BRAND.markPath in a BRAND.markBox square)
from src/brand.ts, so after you change the brand, run it again to re-skin the coin:
  scripts/py scripts/make_demo_shot.py
It stands in for a real Blender render (3d/, `npm run shot`) so the demo exercises the same path:
an image sequence the film plays, floors, loops and retimes. If your film doesn't use the coin,
delete public/3d/spin/, its "spin" key in public/3d/manifest.json and the <Shot shot="spin"> uses.
"""
import json, math, os, re, sys

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageEnhance

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "3d"))
from character import parse_path  # noqa: E402  (plain Python; Blender is only needed to render)

OUT, FRAMES, SIZE, X = os.path.join(ROOT, "public/3d"), 24, 600, 2  # drawn at 2x, then downsampled for clean edges
S = SIZE * X
R, TH = int(S * 0.4), S * 0.07


def brand():
    """BRAND.accent, BRAND.markPath and BRAND.markBox, read from src/brand.ts."""
    ts = open(os.path.join(ROOT, "src/brand.ts")).read()
    found = [re.search(rx, ts) for rx in (r'accent:\s*"#([0-9a-fA-F]{6})"', r'markPath:\s*"([^"]+)"', r"markBox:\s*([\d.]+)")]
    if not all(found):
        sys.exit("src/brand.ts needs accent: \"#rrggbb\", markPath: \"<svg path>\" and markBox: <number> as plain literals.")
    hexc, path, box = (m.group(1) for m in found)
    return tuple(int(hexc[i:i + 2], 16) for i in (0, 2, 4)), path, float(box)


ACCENT, MARK, BOX = brand()
mix = lambda a, b, t: tuple(int(x + (y - x) * t) for x, y in zip(a, b))
LIGHT, DARK, EDGE, RIM = mix(ACCENT, (255, 255, 255), 0.35), mix(ACCENT, (0, 0, 0), 0.16), mix(ACCENT, (0, 0, 0), 0.31), mix(ACCENT, (255, 255, 255), 0.6)


def mark(n):
    """The mark as a white mask, filled even-odd (holes stay holes), in the middle 54% of the face."""
    out = Image.new("L", (n, n), 0)
    for sub in parse_path(MARK):
        layer = Image.new("L", (n, n), 0)
        ImageDraw.Draw(layer).polygon([(n * (0.23 + 0.54 * x / BOX), n * (0.23 + 0.54 * y / BOX)) for x, y in sub], fill=255)
        out = ImageChops.logical_xor(out.convert("1"), layer.convert("1")).convert("L")
    return out


def face():
    """The coin's face: a lit radial gradient, a bevelled rim, and the mark in white."""
    n = 2 * R
    yy, xx = np.mgrid[0:n, 0:n] / n
    d = np.clip(np.hypot(xx - 0.35, yy - 0.3) / 0.9, 0, 1)[..., None]
    rgb = (np.array(LIGHT) * (1 - d) + np.array(DARK) * d).astype(np.uint8)
    img = Image.fromarray(rgb).convert("RGBA")
    draw = ImageDraw.Draw(img)
    draw.ellipse([n * 0.06, n * 0.06, n * 0.94, n * 0.94], outline=RIM, width=int(n * 0.015))
    img.paste((255, 255, 255, 255), (0, 0), mark(n))
    disc = Image.new("L", (n, n), 0)
    ImageDraw.Draw(disc).ellipse([0, 0, n - 1, n - 1], fill=255)
    img.putalpha(disc)
    return img


def frame(k, front):
    a = 2 * math.pi * k / FRAMES
    c, s = math.cos(a), math.sin(a)
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    w, cx, cy = max(2.0, R * abs(c)), S / 2, S / 2
    dx = TH * s
    # The edge: the coin's thickness, swept from its back face to its front.
    steps = max(24, int(abs(dx)))
    for j in range(steps + 1):
        x = cx - dx / 2 + dx * j / steps
        shade = 0.7 + 0.3 * j / steps
        draw.ellipse([x - w, cy - R, x + w, cy + R], fill=tuple(int(v * shade) for v in EDGE) + (255,))
    f = (front if c >= 0 else front.transpose(Image.Transpose.FLIP_LEFT_RIGHT)).resize((max(2, int(2 * w)), 2 * R), Image.Resampling.LANCZOS)
    f = ImageEnhance.Brightness(f).enhance(0.75 + 0.3 * abs(c))
    img.alpha_composite(f, (int(cx + dx / 2 - f.width / 2), int(cy - R)))
    return img.resize((SIZE, SIZE), Image.Resampling.LANCZOS)


os.makedirs(os.path.join(OUT, "spin"), exist_ok=True)
front = face()
for k in range(FRAMES):
    img = frame(k, front)
    img.save(os.path.join(OUT, "spin", f"{k + 1:04d}.png"))
centre = img.getpixel((SIZE // 2, SIZE // 2))
path = os.path.join(OUT, "manifest.json")
manifest = json.load(open(path)) if os.path.exists(path) else {}
manifest["spin"] = {"frames": FRAMES, "size": SIZE, "camera": 1.0, "base": 1.0, "anchorY": 0.5, "loop": True, "quality": "generated",
                    "lastFrameFill": "#{:02x}{:02x}{:02x}".format(*centre[:3]), "source": "scripts/make_demo_shot.py"}
json.dump(manifest, open(path, "w"), indent=1)
print(f"wrote public/3d/spin/0001-{FRAMES:04d}.png and its manifest entry")
