"""Renders the character's still and puts it side by side with the brand's own art, same size, same background.

  npm run shot:compare -- <reference.png> [--tier preview|cpu-final] [--bg #ffffff]

Writes out/3d/compare.png. This is the loop that makes a 3D character match its brand: change
3d/character.json (lights, exposure, gradient stops, roughness), compare, repeat. On a real film the
first render was washed out and glassy; it only matched after side-by-sides like this one.
"""
import os, shutil, subprocess, sys
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
args = sys.argv[1:]
if not args or args[0].startswith("--"):
    sys.exit(__doc__)
ref_path = args[0]
opt = lambda k, d: args[args.index(k) + 1] if k in args else d
tier, bg = opt("--tier", "preview"), opt("--bg", "#ffffff")

blender = os.environ.get("BLENDER") or next(
    (b for b in [os.path.expanduser("~/opt/blender.sh"), os.path.join(ROOT, ".tools", "blender", "blender.sh"),
                 shutil.which("blender")] if b and os.access(b, os.X_OK)), None)
if not blender:
    sys.exit("Blender not found. Run: npm run blender:install")
out = os.path.join(ROOT, "out", "3d", "compare-still")
shutil.rmtree(out, ignore_errors=True)
subprocess.run([blender, "-b", "-t", str(os.cpu_count()), "--python-exit-code", "1", "-P",
                os.path.join(ROOT, "3d", "character.py"), "--", out, "still", f"--{tier}"],
               check=True, stdout=subprocess.DEVNULL)

H = 600
def flat(im):
    """Scale to the common height and lay it on the same background, so only the art differs."""
    im = im.convert("RGBA")
    im = im.resize((round(im.width * H / im.height), H), Image.LANCZOS)
    base = Image.new("RGBA", im.size, bg)
    return Image.alpha_composite(base, im).convert("RGB")

render, ref = flat(Image.open(os.path.join(out, "0001.png"))), flat(Image.open(ref_path))
sheet = Image.new("RGB", (render.width + ref.width + 20, H), bg)
sheet.paste(render, (0, 0))
sheet.paste(ref, (render.width + 20, 0))
dest = os.path.join(ROOT, "out", "3d", "compare.png")
sheet.save(dest)
print(f"{dest}  left: render ({tier}), right: {ref_path}")
