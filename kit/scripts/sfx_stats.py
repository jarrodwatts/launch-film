"""Measures every sound in an SFX folder and writes <dir>/stats.json, which the mix uses to place each
sound by its LOUDEST point instead of its file start (packs' own peak data was off by more than 50 ms
on 13 of 57 sounds in one real pack, which makes hits feel loose).

Per file: dur, start (first onset), peak (centre of the loudest 10 ms RMS window), tail_end, events
(start of each separate event: runs above -30 dB of the file's peak, split by gaps of 150 ms or more),
bright_hz (spectral centroid: shines should be bright), low_share (energy under 150 Hz: booms should
be mostly bass), peak_db, and warn: a file with several events (one placed by its peak leaks the
others off the beat: a stray ping 6.6 s early, off-grid hits under the opening), or a pack peaks.json
that disagrees with the measurement by more than 50 ms.
Usage: scripts/py scripts/sfx_stats.py public/sfx
"""
import json, os, sys

import librosa, numpy as np

d = sys.argv[1]
EXT = (".wav", ".mp3", ".flac", ".ogg", ".m4a")
files = sorted(f for f in os.listdir(d) if f.lower().endswith(EXT))
if not files:
    sys.exit(f"No sound files in {d}: nothing measured, stats.json left as it was.")
pack = json.load(open(os.path.join(d, "peaks.json"))) if os.path.exists(os.path.join(d, "peaks.json")) else {}
pack = {k.lower(): v for k, v in pack.items()}
SR, HOP, WIN = 44100, 110, 441  # 2.5 ms hops, 10 ms windows

rows = {}
for f in files:
    name = os.path.splitext(f)[0]
    y, _ = librosa.load(os.path.join(d, f), sr=SR, mono=True)
    rms = librosa.feature.rms(y=y, frame_length=WIN, hop_length=HOP, center=True)[0]
    t = lambda i: round(float(i) * HOP / SR, 3)
    on = np.where(rms > rms.max() * 10 ** (-30 / 20))[0]
    events = []
    if len(on):
        starts = [on[0]] + [b for a, b in zip(on, on[1:]) if (b - a) * HOP / SR >= 0.15]
        events = [t(i) for i in starts]
    S = np.abs(librosa.stft(y, n_fft=2048)) ** 2
    freqs = librosa.fft_frequencies(sr=SR, n_fft=2048)
    row = {
        "dur": round(len(y) / SR, 3),
        "start": t(on[0]) if len(on) else 0.0,
        "peak": t(np.argmax(rms)),
        "tail_end": t(on[-1]) if len(on) else 0.0,
        "events": events,
        "bright_hz": int(librosa.feature.spectral_centroid(S=np.sqrt(S), sr=SR).mean()),
        "low_share": round(float(S[freqs < 150].sum() / (S.sum() + 1e-12)), 2),
        "peak_db": round(float(20 * np.log10(np.abs(y).max() + 1e-9)), 1),
    }
    warn = []
    if len(events) > 1:
        warn.append(f"{len(events)} events at {events}: place it with keep or whole, or the mix keeps only the peak's event")
    if name.lower() in pack and abs(pack[name.lower()] / 1000 - row["peak"]) > 0.05:
        warn.append(f"pack says peak {pack[name.lower()] / 1000:.3f}s, measured {row['peak']:.3f}s")
    if warn:
        row["warn"] = "; ".join(warn)
    rows[name] = row

json.dump(rows, open(os.path.join(d, "stats.json"), "w"), indent=1)
for k, v in rows.items():
    print(f"{k:24s} dur {v['dur']:6.2f}  peak {v['peak']:6.3f}  end {v['tail_end']:6.2f}  bright {v['bright_hz']:5d}  low {v['low_share']:.2f}  {v.get('warn', '')}")
print(f"{len(rows)} sounds -> {os.path.join(d, 'stats.json')}")
