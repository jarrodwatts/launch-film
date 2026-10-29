"""The film's sound: the track from the film's first beat, plus every cue in out/cues.json.

Cues are written by each scene (src/scenes/*.tsx, `sounds`) on the same beats as the picture
and exported with the film's length and the music's fade-in by scripts/cues.ts. Each effect is placed so its loudest point (public/sfx/stats.json) lands on its
moment; the music dips a little under loud effects, and the whole mix lands near -14 LUFS for X.
Usage: npm run mix
"""
import json, os

import librosa, numpy as np, pyloudnorm, soundfile

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLAN = json.load(open(f"{HERE}/out/sound.json"))
M = json.load(open(f"{HERE}/src/music.json"))
STATS = json.load(open(f"{HERE}/public/sfx/stats.json"))
TRACK = os.path.join(os.environ.get("TRACKS", f"{HERE}/public"), M["file"])  # songs live outside the repo; set TRACKS
SR = 48000
END = PLAN["length_s"]
N = int(SR * END)

# The song, in the parts PLAN["song"] lists: each plays from its moment in the film until the next.
track, _ = librosa.load(TRACK, sr=SR, mono=False)
music = np.zeros((2, N))
parts = PLAN["song"]
XF = int(0.012 * SR)  # a 12ms crossfade at each jump, so it doesn't click
for i, part in enumerate(parts):
    a = int(part["at_s"] * SR)
    b = int(parts[i + 1]["at_s"] * SR) if i + 1 < len(parts) else N
    t0 = int(part["track_s"] * SR)
    seg = track[:, t0: t0 + (b - a) + XF]
    if i + 1 < len(parts):
        seg = seg.copy(); seg[:, b - a: b - a + XF] *= np.linspace(1, 0, XF)
    if i:
        seg = seg.copy(); seg[:, :XF] *= np.linspace(0, 1, XF)
    music[:, a: a + seg.shape[1]] += seg[:, : N - a]
fx = np.zeros((2, N))


def place(name, at, db, pan=0.0, keep=None):
    """Lays an effect so its peak lands on `at` seconds, `db` relative to full scale.

    `keep` cuts it to its first seconds, with a 25ms fade so the cut doesn't click."""
    y, _ = librosa.load(f"{HERE}/public/sfx/{name}.mp3", sr=SR, mono=True)
    peak = STATS[name]["peak"]
    if keep:
        y = y[: int(keep * SR)] * np.minimum(1, np.linspace(keep / 0.025, 0, int(keep * SR)))
        peak = float(np.argmax(np.abs(y))) / SR
    start = int((at - peak) * SR)
    y = y / (np.abs(y).max() + 1e-9) * 10 ** (db / 20)
    left, right = np.sqrt(0.5 * (1 - pan)), np.sqrt(0.5 * (1 + pan))
    a, b = max(0, start), min(N, start + len(y))
    if b > a:
        seg = y[a - start: b - start]
        fx[0, a:b] += seg * left * 1.41
        fx[1, a:b] += seg * right * 1.41


# Every cue, placed on the picture's own beats.
for c in PLAN["cues"]:
    place(c["sfx"], c["at"], c["db"], pan=c.get("pan", 0.0), keep=c.get("keep"))

# The music fades in under the typed opening, reaching full level as the first take posts.
fade_from, fade_to = PLAN["fade_in_s"]
n0, n1 = int(fade_from * SR), max(int(fade_from * SR) + 1, int(fade_to * SR))
ramp_in = np.ones(N)
ramp_in[:n1] = np.concatenate([np.zeros(n0), np.linspace(0, 1, n1 - n0) ** 2])
music *= ramp_in

# Effects sit under the music: the music dips a little wherever an effect is loud.
env = np.abs(fx).max(0)
k = int(0.03 * SR)
env = np.convolve(env, np.ones(k) / k, mode="same")
duck = 1 - 0.25 * np.clip(env / (env.max() + 1e-9), 0, 1)
mix = music * duck * 0.8 + fx
mix[:, : int(0.04 * SR)] *= np.linspace(0, 1, int(0.04 * SR))
mix[:, -int(0.6 * SR):] *= np.linspace(1, 0, int(0.6 * SR))
meter = pyloudnorm.Meter(SR)
mix = pyloudnorm.normalize.loudness(mix.T, meter.integrated_loudness(mix.T), -13.0).T
CEIL = 10 ** (-1 / 20)  # -1 dBFS, so X's encoder doesn't clip it
mix = CEIL * np.tanh(mix / CEIL)  # a soft limiter on the few peaks above the ceiling
soundfile.write(f"{HERE}/public/mix.wav", mix.T, SR)
print("mix.wav", round(END, 2), "s, LUFS", round(meter.integrated_loudness(mix.T), 1), "peak dB", round(20 * np.log10(np.abs(mix).max()), 2))
