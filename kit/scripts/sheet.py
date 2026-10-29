"""Contact sheets: 4x4 tiles, each labelled with FILM time and frame ("5.20s f156"), so a sheet,
the user's timestamped notes and `npm run where` all speak the same numbers. Sheets find structure;
only full-size stills find cut-offs, 5 px margins and 1 to 3 frame problems.

  sheet.py video <video> <outdir> [sample_fps=8] [first_film_frame=0]   -> <outdir>/sheet_NN.jpg
  sheet.py images <out.jpg> <f123.png>...                               -> one sheet, labelled from the names
"""
import json, math, os, re, subprocess, sys, tempfile

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = os.path.join(ROOT, "out/timeline.json")
FPS = json.load(open(TL))["fps"] if os.path.exists(TL) else 30
TILE = 480


def font():
    for path in ("/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf", "/System/Library/Fonts/Menlo.ttc"):
        if os.path.exists(path):
            return ImageFont.truetype(path, 20)
    return ImageFont.load_default(size=20)


def sheets(tiles, out_for):
    """tiles: [(image, film_frame)] -> 4x4 sheets."""
    f = font()
    for n in range(0, len(tiles), 16):
        batch = tiles[n: n + 16]
        w, h = TILE, int(TILE * batch[0][0].height / batch[0][0].width)
        sheet = Image.new("RGB", (4 * (w + 4), ((len(batch) + 3) // 4) * (h + 4)), "white")
        d = ImageDraw.Draw(sheet)
        for i, (im, frame) in enumerate(batch):
            x, y = (i % 4) * (w + 4), (i // 4) * (h + 4)
            sheet.paste(im.convert("RGB").resize((w, h)), (x, y))
            label = f"{frame / FPS:5.2f}s f{frame}"
            d.rectangle([x, y, x + 12 * len(label) + 10, y + 26], fill="black")
            d.text((x + 5, y + 2), label, fill="yellow", font=f)
        path = out_for(n // 16)
        sheet.save(path, quality=85)
        print(path)


if sys.argv[1] == "video":
    video, outdir = sys.argv[2], sys.argv[3]
    rate = float(sys.argv[4]) if len(sys.argv) > 4 else 8
    first = int(sys.argv[5]) if len(sys.argv) > 5 else 0
    os.makedirs(outdir, exist_ok=True)
    for old in os.listdir(outdir):
        if old.startswith("sheet_"):
            os.remove(os.path.join(outdir, old))
    with tempfile.TemporaryDirectory() as tmp:
        # Keep exactly the frames where n * rate / FPS reaches a new whole number: frame ceil(i * FPS / rate).
        # (ffmpeg's fps filter picks frames about half a sample late, so its tiles were labelled 7 frames early.)
        pick = f"select=eq(n\\,0)+gt(floor(n*{rate}/{FPS})\\,floor((n-1)*{rate}/{FPS}))"
        subprocess.run([os.environ.get("FFMPEG", "ffmpeg"), "-loglevel", "error", "-y", "-i", video, "-vf", f"{pick},scale={TILE}:-2", "-fps_mode", "passthrough", os.path.join(tmp, "f_%05d.png")], check=True)
        names = sorted(os.listdir(tmp))
        tiles = [(Image.open(os.path.join(tmp, nm)).copy(), first + math.ceil(i * FPS / rate - 1e-9)) for i, nm in enumerate(names)]
    sheets(tiles, lambda k: os.path.join(outdir, f"sheet_{k:02d}.jpg"))
elif sys.argv[1] == "images":
    out, files = sys.argv[2], sys.argv[3:]
    tiles = [(Image.open(p), int(re.search(r"f(-?\d+)", os.path.basename(p)).group(1))) for p in files]
    sheets(tiles, lambda k: out if k == 0 else out.replace(".jpg", f"_{k:02d}.jpg"))
else:
    sys.exit(__doc__)
