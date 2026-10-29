"""The film's sound: the song, edited to the film, plus every cue in out/sound.json -> public/mix.wav.

Steps, in order:
1. The song (src/music.json `file`), in the parts sound.json lists, with a 12 ms crossfade at each jump.
2. Each cue normalised to its own peak, set to `db`, and placed so its measured LOUDEST point
   (public/sfx/stats.json) lands on `at`. `keep` cuts it to its first seconds (25 ms fade); a file
   with several events and no `keep`/`whole` is trimmed to the event that holds its peak, so a
   second ping can't play 6 s early. Equal-power pan (x1.41, so centre is unity).
3. The music fades in (squared) between the two fade-in beats.
4. The music dips at most 25% under loud effects (a 30 ms envelope); it sits at x0.8 under them.
5. 40 ms fade in, 0.6 s fade out; loudness to TARGET_LUFS; then, only if the true peak (4x
   oversampled) is over CEILING_DBTP, a look-ahead limiter (5 ms look-ahead, 50 ms release).
   (A tanh "limiter" once coloured a whole mix and never limited. AAC then raised the peak 4 dB,
   so check the delivered mp4 too: npm run final prints it.)
Usage: npm run mix
"""
import json, os, sys

import librosa, numpy as np, pyloudnorm, soundfile
from scipy.ndimage import minimum_filter1d, uniform_filter1d
from scipy.signal import resample_poly

TARGET_LUFS = -14.0
CEILING_DBTP = -1.5

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLAN = json.load(open(f"{ROOT}/out/sound.json"))
MUSIC = json.load(open(f"{ROOT}/src/music.json"))
STATS = json.load(open(f"{ROOT}/public/sfx/stats.json")) if os.path.exists(f"{ROOT}/public/sfx/stats.json") else {}
SR = 48000
N = int(round(SR * PLAN["length_s"]))
db_ = lambda x: 20 * np.log10(x + 1e-12)
true_peak = lambda x: float(np.abs(resample_poly(x, 4, 1, axis=1)).max())


def sfx_path(name):
    for ext in (".wav", ".mp3", ".flac", ".ogg", ".m4a"):
        if os.path.exists(f"{ROOT}/public/sfx/{name}{ext}"):
            return f"{ROOT}/public/sfx/{name}{ext}"
    sys.exit(f"public/sfx has no file for cue '{name}'. Add it, or map its role in public/sfx/roles.json.")


# 1. The song, part by part.
track, _ = librosa.load(f"{ROOT}/{MUSIC['file']}", sr=SR, mono=False)
track = np.atleast_2d(track)
track = np.vstack([track, track]) if track.shape[0] == 1 else track
music = np.zeros((2, N))
parts, XF = PLAN["song"], int(0.012 * SR)
for i, part in enumerate(parts):
    a = int(round(part["at_s"] * SR))
    b = int(round(parts[i + 1]["at_s"] * SR)) if i + 1 < len(parts) else N
    t0 = int(round(part["track_s"] * SR))
    seg = np.zeros((2, b - a + XF))
    lo, hi = max(t0, 0), min(t0 + seg.shape[1], track.shape[1])
    if hi > lo:
        seg[:, lo - t0: hi - t0] = track[:, lo:hi]
    if i + 1 < len(parts):
        seg[:, b - a:] *= np.linspace(1, 0, XF)
    if i:
        seg[:, :XF] *= np.linspace(0, 1, XF)
    end = min(N, a + seg.shape[1])
    music[:, a:end] += seg[:, : end - a]

# 2. Every cue, by its measured peak.
fx = np.zeros((2, N))
missing = set()
for c in PLAN["cues"]:
    y, _ = librosa.load(sfx_path(c["sfx"]), sr=SR, mono=True)
    st = STATS.get(c["sfx"])
    if st is None:
        missing.add(c["sfx"])
    peak = st["peak"] if st else float(np.argmax(np.abs(y))) / SR
    keep = c.get("keep")
    events = st.get("events", []) if st else []
    if not keep and not c.get("whole") and len(events) > 1:
        # Keep only the event that holds the peak: from its start to the next event's start.
        first = max([e for e in events if e <= peak + 1e-3] or [0.0])
        later = [e for e in events if e > first + 1e-3]
        keep = (later[0] - first) if later else None
        y, peak = y[int(first * SR):], peak - first
    if keep:
        n = int(keep * SR)
        y = y[:n] * np.minimum(1, np.linspace(keep / 0.025, 0, len(y[:n])))
        if not (0 <= peak < keep):
            peak = float(np.argmax(np.abs(y))) / SR
    y = y / (np.abs(y).max() + 1e-9) * 10 ** (c["db"] / 20)
    start = int(round((c["at"] - peak) * SR))
    pan = c.get("pan", 0.0)
    a, b = max(0, start), min(N, start + len(y))
    if b > a:
        fx[0, a:b] += y[a - start: b - start] * np.sqrt(0.5 * (1 - pan)) * 1.41
        fx[1, a:b] += y[a - start: b - start] * np.sqrt(0.5 * (1 + pan)) * 1.41
if missing:
    print(f"warning: not in public/sfx/stats.json (placed by their sample peak; run npm run sfx:stats): {sorted(missing)}")

# 3. The music fades in.
f0, f1 = (int(s * SR) for s in PLAN["fade_in_s"])
f1 = max(f1, f0 + 1)
music[:, :f0] = 0
music[:, f0:f1] *= np.linspace(0, 1, f1 - f0) ** 2

# 4. The music dips under loud effects.
env = uniform_filter1d(np.abs(fx).max(0), int(0.03 * SR))
music *= 1 - 0.25 * np.clip(env / (env.max() + 1e-9), 0, 1)
mix = music * 0.8 + fx

# 5. Fades, loudness, and a limiter only if the true peak needs one.
mix[:, : int(0.04 * SR)] *= np.linspace(0, 1, int(0.04 * SR))
mix[:, -int(0.6 * SR):] *= np.linspace(1, 0, int(0.6 * SR))
meter = pyloudnorm.Meter(SR)
ceiling = 10 ** (CEILING_DBTP / 20)


def limit(x):
    """Pulls every true peak over the ceiling down to it: the gain ramps down over 5 ms before a peak
    (look-ahead, so it is never late) and recovers over about 50 ms."""
    over = np.abs(resample_poly(x, 4, 1, axis=1)).max(0).reshape(-1, 4).max(1)[:N]
    gain = np.minimum(1, ceiling / np.maximum(over, 1e-9))
    look = int(0.005 * SR)
    gain = uniform_filter1d(minimum_filter1d(gain, 2 * look + 1), look + 1)
    rel = 1 - np.exp(-1 / (0.05 * SR))
    g, out = 1.0, gain.tolist()
    for i, target in enumerate(out):
        g = target if target < g else min(target, g + (1 - g) * rel)
        out[i] = g
    return x * np.array(out)


# Loudness to target, limited only where needed; repeated, since limiting lowers the loudness a little.
for _ in range(4):
    mix *= 10 ** ((TARGET_LUFS - meter.integrated_loudness(mix.T)) / 20)
    if true_peak(mix) <= ceiling:
        break
    mix = limit(mix)
soundfile.write(f"{ROOT}/public/mix.wav", mix.T, SR, subtype="PCM_24")
print(f"mix.wav: {len(PLAN['cues'])} cues, {PLAN['length_s']:.2f}s, {meter.integrated_loudness(mix.T):.1f} LUFS, true peak {db_(true_peak(mix)):.1f} dBTP")
