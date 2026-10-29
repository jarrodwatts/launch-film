"""Averages shutter passes (PNG stills of one frame at different shifts) at float precision, so the
blur preview has no banding of its own. Usage: blur_average.py <out.png> <pass.png>...
"""
import sys

import numpy as np
from PIL import Image

out, passes = sys.argv[1], sys.argv[2:]
acc = sum(np.asarray(Image.open(p).convert("RGB"), dtype=np.float64) for p in passes) / len(passes)
Image.fromarray(np.clip(np.round(acc), 0, 255).astype(np.uint8)).save(out)
print(f"{out} ({len(passes)} passes)")
