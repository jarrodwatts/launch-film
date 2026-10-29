"""Generates the demo's stand-in audio: a 150 BPM beat with a real drop, and one placeholder per SFX role.

These exist for TIMING only, so the demo renders with sound out of the box. Generated SFX are what
made one real film's first cut sound cheap; a real curated pack is the biggest jump in perceived quality.

It only fills gaps, so it never overwrites your own audio:
- the song, when src/music.json still has licence "generated" and its file is missing;
- each SFX file roles.json names that is a demo stand-in and isn't in public/sfx yet.
Deterministic: the same files every run. Usage: scripts/py scripts/make_demo_audio.py
"""
import json, os

import numpy as np, soundfile
from scipy.signal import butter, istft, sosfilt, stft

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR, BEAT, LEAD = 48000, 0.4, 12  # 150 BPM: one beat is exactly 12 frames at 30 fps; the file starts 12 beats before the drop
rng = np.random.default_rng(7)
T = lambda d: np.arange(int(d * SR)) / SR
noise = lambda d: rng.standard_normal(int(d * SR))
band = lambda x, lo, hi: sosfilt(butter(2, [lo, hi], "bandpass", fs=SR, output="sos"), x)
high = lambda x, f: sosfilt(butter(2, f, "highpass", fs=SR, output="sos"), x)
low = lambda x, f: sosfilt(butter(2, f, "lowpass", fs=SR, output="sos"), x)
mix = lambda a, b: np.pad(a, (0, max(0, len(b) - len(a)))) + np.pad(b, (0, max(0, len(a) - len(b))))


def tone(f0, f1, d, decay, glide=0.06):
    """A sine sliding from f0 to f1 Hz over `glide` s, decaying with time constant `decay`."""
    t = T(d)
    f = f1 + (f0 - f1) * np.exp(-t / glide)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / decay)


def sweep(d, f0, f1, f2, peak, width=0.5):
    """Noise whose band sweeps f0 -> f1 (at `peak` s) -> f2, swelling into `peak`: a whoosh."""
    f, t, Z = stft(noise(d), SR, nperseg=1024)
    centre = np.interp(t, [0, peak, d], [f0, f1, f2])
    mask = np.exp(-0.5 * (np.log2(np.maximum(f[:, None], 1) / centre[None, :]) / width) ** 2)
    n = int(d * SR)
    y = istft(Z * mask, SR, nperseg=1024)[1]
    y = np.pad(y, (0, max(0, n - len(y))))[:n]
    tt = T(d)
    return y * np.where(tt < peak, (tt / peak) ** 2.5, np.exp(-np.maximum(tt - peak, 0) / (0.18 * (d - peak))))


def hits(d, times, make):
    out = np.zeros(int(d * SR))
    for at in times:
        h = make()
        a = int(at * SR)
        out[a: a + len(h)] += h[: len(out) - a]
    return out


def keys():
    t = 0.05
    times = []
    while t < 2.9:
        times.append(t)
        t += rng.uniform(0.07, 0.14)
    return hits(3.0, times, lambda: band(noise(0.03), 1500, rng.uniform(4000, 7000)) * np.exp(-T(0.03) / 0.006))


SFX = {
    "whoosh_1": lambda: sweep(0.6, 400, 2600, 900, 0.3),
    "whoosh_2": lambda: sweep(0.5, 600, 3400, 1200, 0.22, 0.6),
    "whoosh_3": lambda: sweep(0.8, 300, 2000, 600, 0.45),
    "whoosh_4": lambda: sweep(0.45, 800, 4200, 1500, 0.2, 0.7),
    "whoosh_heavy": lambda: sweep(1.0, 120, 700, 160, 0.6, 0.8) + 0.6 * np.sin(2 * np.pi * 52 * T(1.0)) * np.exp(-((T(1.0) - 0.6) / 0.2) ** 2),
    "air": lambda: sweep(1.2, 2500, 6000, 3000, 0.6, 1.2),
    "pop_1": lambda: tone(1100, 520, 0.09, 0.025, 0.012),
    "pop_2": lambda: tone(1350, 640, 0.09, 0.025, 0.012),
    "pop_3": lambda: tone(900, 430, 0.1, 0.03, 0.012),
    "tick": lambda: np.sin(2 * np.pi * 4200 * T(0.05)) * np.exp(-T(0.05) / 0.006),
    "click": lambda: hits(0.08, [0.0, 0.028], lambda: band(noise(0.02), 2000, 7000) * np.exp(-T(0.02) / 0.003)),
    "button": lambda: hits(0.15, [0.0], lambda: band(noise(0.02), 2000, 7000) * np.exp(-T(0.02) / 0.003)) + 0.8 * tone(160, 110, 0.15, 0.04),
    "switch": lambda: hits(0.12, [0.0], lambda: tone(1250, 1250, 0.03, 0.008)) + hits(0.12, [0.04], lambda: tone(1850, 1850, 0.04, 0.01)),
    "typing": keys,
    "shine": lambda: sum(np.sin(2 * np.pi * f * (1 + 0.04 * T(0.9)) * T(0.9)) * np.exp(-T(0.9) / dk) for f, dk in [(2637, 0.3), (3520, 0.22), (4699, 0.16), (5920, 0.1)]) * (1 + 0.3 * np.sin(2 * np.pi * 22 * T(0.9))) * np.minimum(1, T(0.9) / 0.004),
    "impact": lambda: tone(95, 42, 0.6, 0.18, 0.04) + 0.5 * low(noise(0.6), 3000) * np.exp(-T(0.6) / 0.05),
    "boom": lambda: np.tanh(1.6 * tone(70, 32, 1.6, 0.55, 0.3)),
    "riser": lambda: (lambda y: y * np.minimum(1, (T(2.0)[::-1]) / 0.02))(sweep(2.0, 300, 6000, 6000, 1.97, 0.9)),
    "ding": lambda: sum(a * np.sin(2 * np.pi * 1320 * m * T(1.2)) * np.exp(-T(1.2) / dk) for a, m, dk in [(1, 1, 0.45), (0.5, 2.76, 0.2), (0.25, 5.4, 0.08)]),
    "notify": lambda: hits(0.6, [0.0], lambda: tone(880, 880, 0.4, 0.12)) + hits(0.6, [0.09], lambda: tone(1320, 1320, 0.45, 0.15)),
    "cash": lambda: hits(0.8, sorted(rng.uniform(0, 0.22, 9)), lambda: band(noise(0.025), 3000, 9000) * np.exp(-T(0.025) / 0.005)) * 0.5 + hits(0.8, [0.12], lambda: sum(np.sin(2 * np.pi * f * T(0.6)) * np.exp(-T(0.6) / 0.2) for f in (2400, 3100))),
}


def song():
    """Beats -12..40 around the drop: intro hats, energy (hats, claps, a filtered stab), a near-silent
    quiet bar with a riser peaking on 0, the drop (an 8-beat phrase of kick, snare, bass, stab, hats),
    a pad-only break at 24, the re-drop at 28, a tail from 36."""
    d = (LEAD + 40) * BEAT + 1.2
    out = np.zeros(int(d * SR))
    at = lambda b: (b + LEAD) * BEAT

    def put(b, x, gain=1.0):
        a = int(at(b) * SR)
        out[a: a + len(x)] += gain * x[: len(out) - a]

    roots = [55.0, 43.65, 65.41, 49.0]  # A, F, C, G: two beats each, an 8-beat phrase
    kick = lambda: mix(tone(150, 48, 0.45, 0.16, 0.03), 0.3 * band(noise(0.01), 1000, 5000))
    hat = lambda: high(noise(0.05), 7000) * np.exp(-T(0.05) / 0.012)
    stab = lambda r: high(sum(np.sign(np.sin(2 * np.pi * r * 4 * m * T(0.18))) for m in (1, 1.19, 1.5)), 400) * np.exp(-T(0.18) / 0.05)
    pad = lambda r, dur: sum(np.sin(2 * np.pi * r * 4 * m * T(dur)) for m in (1, 1.19, 1.5, 2)) * np.minimum(1, T(dur) / 0.3) * np.minimum(1, (dur - T(dur)) / 0.4)
    for b in np.arange(-12, -8, 0.5):
        put(b, hat(), 0.25)
    for b in np.arange(-8, -4, 0.25):
        put(b, hat(), 0.5 if b % 0.5 else 0.8)
    for b in (-7, -5):
        put(b, band(noise(0.15), 900, 3000) * np.exp(-T(0.15) / 0.04), 2.5)
    for b in np.arange(-7.5, -4, 0.5):
        put(b, stab(roots[(int(b + 8) % 8) // 2]), 1.0)
    put(-4, sweep(4 * BEAT, 300, 5000, 5000, 4 * BEAT - 0.01, 0.9), 0.5)
    for b in list(range(0, 24)) + list(range(28, 36)):
        r = roots[(b % 8) // 2]
        put(b, kick(), 1.0)
        if b % 2:
            put(b, band(noise(0.18), 1200, 6000) * np.exp(-T(0.18) / 0.05) + 0.5 * tone(200, 180, 0.18, 0.06), 0.7)
        put(b, low(np.sign(np.sin(2 * np.pi * r * T(0.38))), 300) * np.exp(-T(0.38) / 0.2) + 0.8 * np.sin(2 * np.pi * r * T(0.38)) * np.exp(-T(0.38) / 0.2), 0.6)
        put(b + 0.5, hat(), 0.25)
        put(b + 0.5, stab(r), 0.2 if b % 8 != 7 else 0.3)  # the phrase's last beat leans in
    for b in (0, 28):
        put(b, high(noise(1.5), 4000) * np.exp(-T(1.5) / 0.35), 0.35)
    put(24, pad(roots[0], 4 * BEAT + 0.05), 0.12)
    put(36, kick(), 1.0)
    put(36, pad(roots[0], 1.6), 0.1)
    return out / np.abs(out).max() * 10 ** (-1 / 20)


def write(path, y):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    soundfile.write(path, (y / (np.abs(y).max() + 1e-9) * 10 ** (-1 / 20)).astype(np.float32), SR, subtype="PCM_24")
    print("wrote", os.path.relpath(path, ROOT))


music_json = os.path.join(ROOT, "src/music.json")
music = json.load(open(music_json))
if music.get("licence") == "generated" and not os.path.exists(os.path.join(ROOT, music["file"])):
    write(os.path.join(ROOT, "public/music/demo.wav"), song())
    music.update({"track": "Acme demo beat, generated by scripts/make_demo_audio.py", "licence": "generated", "file": "public/music/demo.wav",
                  "bpm": 150, "beat_s": BEAT, "drop_file_s": round(LEAD * BEAT, 3), "phrase_beats": 8, "fit_error_ms": 0,
                  "sections_beats": {"energy": [-8, -4], "quiet": [-4, 0], "drop": [0, 24], "break": [24, 28], "redrop": [28, 36]}})
    if music != json.load(open(music_json)):
        json.dump(music, open(music_json, "w"), indent=1)
roles = json.load(open(os.path.join(ROOT, "public/sfx/roles.json")))
for stem in sorted({s for files in roles.values() for s in files} & set(SFX)):
    if not any(os.path.exists(os.path.join(ROOT, "public/sfx", stem + ext)) for ext in (".wav", ".mp3", ".flac", ".ogg", ".m4a")):
        write(os.path.join(ROOT, "public/sfx", stem + ".wav"), SFX[stem]())
