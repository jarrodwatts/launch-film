"""Locks a song's beat grid and writes src/music.json, the clock the whole film runs on.

librosa's beat tracker alone was 162 ms off on a syncopated track: useless for cuts. What works:
1. Fix the tempo (--bpm, or a straight-line fit through the tracked beats after the drop).
2. Find the drop from the BASS: the first moment the 30-120 Hz level comes within 6 dB of its
   level after the drop (the generic "strongest onset" was 226 ms late).
3. Fit the phase to the kicks: low-band onsets, phase shifts of +-200 ms in 401 steps, keep the
   one with the smallest median distance to the half-beat grid. Under 30 ms is fine at 30 fps
   (a frame is 33 ms); above that this script fails.
Then it prints a bar table (bass / all / air dB per 4 beats around the drop) and proposed sections.

Usage:
  scripts/py scripts/music_grid.py <song> --drops                    every drop in the song
  scripts/py scripts/music_grid.py <song> [--bpm N] [--drop S] [--phrase 16]   lock it, write src/music.json
  scripts/py scripts/music_grid.py <song> --check                    compare with src/music.json, write nothing
"""
import argparse, json, os, sys

import librosa, numpy as np
from scipy.signal import butter, find_peaks, sosfiltfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser()
ap.add_argument("song"); ap.add_argument("--bpm", type=float); ap.add_argument("--drop", type=float)
ap.add_argument("--phrase", type=int); ap.add_argument("--drops", action="store_true"); ap.add_argument("--check", action="store_true")
a = ap.parse_args()

SR, HOP = 22050, 512
y, _ = librosa.load(a.song, sr=SR, mono=True)
S = np.abs(librosa.stft(y, n_fft=2048, hop_length=HOP)) ** 2
fr = librosa.fft_frequencies(sr=SR, n_fft=2048)
t = librosa.frames_to_time(np.arange(S.shape[1]), sr=SR, hop_length=HOP)
db = lambda m: 10 * np.log10(S[m].sum(0) + 1e-10)
bass, full, air = db((fr > 30) & (fr < 120)), db(fr > 0), db(fr > 8000)
med = lambda x, lo, hi: float(np.median(x[(t >= lo) & (t < hi)])) if ((t >= lo) & (t < hi)).any() else -120.0


def drops():
    """Every moment the bass jumps 8 dB and the level 3 dB, and the energy holds for 12 s. Silence at
    the very start of a file is not a build: music must have been playing in the 8 s before."""
    floor, ref, found = float(np.median(full)) - 18, float(np.percentile(full, 90)), []
    for d in np.arange(4, t[-1] - 4, 0.05):
        jl, jf = med(bass, d, d + 2) - med(bass, d - 2, d - 0.1), med(full, d, d + 2) - med(full, d - 2, d - 0.1)
        played = ((t >= d - 8) & (t < d - 0.3) & (full > floor)).any()
        if jl >= 8 and jf >= 3 and played and med(full, d, d + 12) >= ref - 6:
            found.append((jl + 2 * jf, d, jl, jf, med(full, d - 0.6, d - 0.05) < med(full, d - 3, d - 0.6) - 6))
    kept = []
    for c in sorted(found, reverse=True):
        if all(abs(c[1] - k[1]) > 6 for k in kept):
            kept.append(c)
    return kept


if a.drops:
    for score, d, jl, jf, gap in sorted(drops(), key=lambda c: c[1]):
        print(f"drop {d:7.2f}s  bass +{jl:4.1f} dB  level +{jf:4.1f} dB  score {score:5.1f}{'  silence before' if gap else ''}")
    sys.exit()

# The low band at full time resolution, zero-phase filtered so nothing is delayed.
lowband = sosfiltfilt(butter(4, [30, 120], "bandpass", fs=SR, output="sos"), y)
k = int(0.01 * SR)
env = 10 * np.log10(np.convolve(lowband ** 2, np.ones(k) / k, mode="same") + 1e-10)
ts = np.arange(len(y)) / SR
rough = a.drop if a.drop is not None else (drops() or [(0, 0.0)])[0][1]
after = float(np.median(env[(ts > rough + 0.5) & (ts < rough + 8)]))
near = np.where((ts > rough - 2) & (ts < rough + 1) & (env >= after - 6))[0]
drop0 = float(ts[near[0]]) if len(near) else rough

if a.bpm:
    beat_s = 60 / a.bpm
else:
    # Only the steady stretch after the drop: builds and breaks fool the tempo estimate.
    part = y[int(drop0 * SR): int((drop0 + 30) * SR)]
    onset = librosa.onset.onset_strength(y=part, sr=SR, hop_length=HOP)
    tempo = float(np.atleast_1d(librosa.feature.tempo(onset_envelope=onset, sr=SR, hop_length=HOP))[0])
    _, beats = librosa.beat.beat_track(onset_envelope=onset, sr=SR, hop_length=HOP, start_bpm=tempo, tightness=400)
    bt = librosa.frames_to_time(beats, sr=SR, hop_length=HOP)
    beat_s = float(np.polyfit(np.arange(len(bt)), bt, 1)[0]) if len(bt) > 8 else 60 / tempo
    while 60 / beat_s < 70: beat_s /= 2
    while 60 / beat_s > 200: beat_s *= 2

# Kicks: where the low band's level rises fastest, after the drop.
rise = np.maximum(0, np.diff(env, prepend=env[0]))
peaks, _ = find_peaks(rise, height=rise.max() * 0.2, distance=int(beat_s / 4 * SR))
kicks = ts[peaks]
kicks = kicks[(kicks >= drop0 - 0.25) & (kicks < drop0 + 64 * beat_s)]
half = beat_s / 2
shifts = np.linspace(-0.2, 0.2, 401)
errs = [float(np.median(np.abs((kicks - drop0 - p) / half - np.round((kicks - drop0 - p) / half)))) * half for p in shifts] if len(kicks) else [1.0]
# The half-beat grid repeats every half beat, so several shifts fit: take the nearest good one.
best = min((i for i, e in enumerate(errs) if e <= min(errs) + 0.002), key=lambda i: abs(shifts[i]))
drop, fit_ms = drop0 + float(shifts[best]) if len(kicks) else drop0, errs[best] * 1000
bpm = 60 / beat_s
print(f"{os.path.basename(a.song)}: {bpm:.2f} BPM (beat {beat_s:.5f} s), drop at {drop:.3f} s, kick fit error {fit_ms:.1f} ms over {len(kicks)} kicks")

# The bar table: median level per 4 beats around the drop.
print("\n beats  song s   bass    all    air")
bars = []
for b in range(-16, 76, 4):
    lo, hi = drop + b * beat_s, drop + (b + 4) * beat_s
    if lo < 0 or hi > t[-1]:
        continue
    bars.append((b, med(bass, lo, hi), med(full, lo, hi)))
    print(f"{b:6d} {lo:7.2f} {bars[-1][1]:6.1f} {bars[-1][2]:6.1f} {med(air, lo, hi):6.1f}")

# Proposed sections: the quiet bars just before the drop, the energy before them, then the drop
# until the bass falls away (the break), and the re-drop when it comes back.
lvl = {b: (bs, al) for b, bs, al in bars}
bref, aref = med(bass, drop, drop + 16 * beat_s), med(full, drop, drop + 16 * beat_s)
sec, b = {}, -4
while b in lvl and lvl[b][1] < aref - 15: b -= 4
if b < -4: sec["quiet"] = [b + 4, 0]
e = b
while e in lvl and lvl[e][1] >= aref - 15 and e > b - 16: e -= 4
if e < b: sec["energy"] = [e + 4, b + 4]
b = 0
while b in lvl and lvl[b][0] >= bref - 10: b += 4
sec["drop"] = [0, b]
if b in lvl:
    r = b
    while r in lvl and lvl[r][0] < bref - 10: r += 4
    sec["break"] = [b, r]
    end = r
    while end in lvl and lvl[end][0] >= bref - 10: end += 4
    if end > r: sec["redrop"] = [r, end]
print("\nproposed sections (beats from the drop):", json.dumps(sec))

path = os.path.join(ROOT, "src/music.json")
old = json.load(open(path)) if os.path.exists(path) else {}
if a.check:
    ok = abs(drop - old.get("drop_file_s", -99)) <= 0.03 and abs(bpm - old.get("bpm", -99)) <= 0.5 and fit_ms <= 30
    print(f"\ncheck against src/music.json: drop {old.get('drop_file_s')} s, {old.get('bpm')} BPM -> {'OK' if ok else 'MISMATCH'}")
    sys.exit(0 if ok else 1)
if fit_ms > 30:
    sys.exit(f"\nFit error {fit_ms:.1f} ms is over 30 ms: pass the true tempo with --bpm and a rough drop with --drop.")
if "break" not in sec:
    print("warning: no break found; add sections_beats.break by hand (the splice guard needs it).")
music = {"track": old.get("track", os.path.basename(a.song)), "licence": old.get("licence", "unknown"),
         "file": os.path.relpath(os.path.abspath(a.song), ROOT), "bpm": round(bpm, 2), "beat_s": round(beat_s, 5),
         "drop_file_s": round(drop, 3), "phrase_beats": a.phrase or old.get("phrase_beats", 16), "fit_error_ms": round(fit_ms, 1),
         "sections_beats": sec}
json.dump(music, open(path, "w"), indent=1)
print(f"\nwrote src/music.json. Set its track and licence, then npm run check.")
