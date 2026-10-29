"""Scans a folder of songs for real drops and ranks them, so a human only listens to the best few.

  npm run music:scan -- <dir> [--bpm 140-180] [--top 40]

A drop here means: music is already playing, the bass (30-150 Hz) jumps, and the energy holds after.
For each track it finds the best drop and measures:
  jump_db   bass 4 s after vs 4 s before the drop (bigger hits harder)
  hold_db   whole-band energy 4-40 s after vs the first 4 s (near 0 or above: the energy stays up)
  lift_db   whole-band loudness just after vs just before (the build really gives way)
Ranking sums each track's rank on all three, so no single capped number decides. (A single score
capped at 30 tied 91 of 465 tracks at the top on a real scan.)
The silence fix: a candidate counts only if its "before" window is louder than the track's median
minus 18 dB. Without it, tracks that start from digital silence topped the list with +130 dB "drops".
Writes <dir>/scan.json. Titles and artists come from the files' tags; bare numeric file names
can't be shown to a person. Measures shortlist, ears choose: the measured best track of a real
scan (+71 dB bass jump) was "not hype enough". Tempos under 90 BPM may be half-time readings (x2).
"""
import json, os, shutil, subprocess, sys
from concurrent.futures import ProcessPoolExecutor

import librosa
import numpy as np

AUDIO = (".mp3", ".wav", ".m4a", ".flac", ".ogg", ".opus")
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
FFPROBE = os.environ.get("FFPROBE") or shutil.which("ffprobe") or os.path.join(ROOT, ".tools", "ffmpeg", "ffprobe")


def tags(path):
    try:
        out = subprocess.run([FFPROBE, "-v", "error", "-show_entries", "format_tags=title,artist,genre", "-of", "json", path],
                             capture_output=True, text=True).stdout
        t = {k.lower(): v for k, v in json.loads(out).get("format", {}).get("tags", {}).items()}
        return {k: t.get(k, "") for k in ("title", "artist", "genre")}
    except Exception:
        return {"title": "", "artist": "", "genre": ""}


def scan(path):
    try:
        y, sr = librosa.load(path, sr=22050, mono=True)
    except Exception as e:
        print(f"skip {os.path.basename(path)}: {e}", file=sys.stderr)
        return None
    dur = len(y) / sr
    S = np.abs(librosa.stft(y, n_fft=2048, hop_length=512)) ** 2
    f = librosa.fft_frequencies(sr=sr, n_fft=2048)
    t = librosa.frames_to_time(np.arange(S.shape[1]), sr=sr, hop_length=512)
    low = 10 * np.log10(S[(f > 30) & (f < 150)].sum(0) + 1e-9)
    full = 10 * np.log10(S.sum(0) + 1e-9)

    def win(x, a, b):
        m = (t >= a) & (t < b)
        return float(np.median(x[m])) if m.any() else -120.0

    floor = float(np.median(full)) - 18
    best = None
    for d in np.arange(5.0, max(5.0, dur - 10), 0.25):
        before = win(full, d - 4, d - 0.3)
        if before < floor:  # silence is not a build
            continue
        jump = win(low, d + 0.1, d + 4) - win(low, d - 4, d - 0.3)
        hold = win(full, d + 4, min(dur, d + 40)) - win(full, d + 0.1, d + 4)
        lift = win(full, d + 0.1, d + 4) - before
        key = jump + min(0.0, hold) * 1.5  # picks this track's best candidate; ranking across tracks is below
        if best is None or key > best["_key"]:
            best = {"_key": key, "drop_s": round(float(d), 2), "jump_db": round(jump, 1), "hold_db": round(hold, 1),
                    "lift_db": round(lift, 1)}
    if not best:
        return None
    best.pop("_key")
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    return {"file": os.path.basename(path), **tags(path), "dur": round(dur, 1),
            "bpm": round(float(np.atleast_1d(tempo)[0]), 1), **best}


def main():
    args = sys.argv[1:]
    if not args or args[0].startswith("--"):
        sys.exit(__doc__)
    folder = args[0]
    opt = lambda k, d: args[args.index(k) + 1] if k in args else d
    lo, hi = (float(x) for x in opt("--bpm", "0-999").split("-"))
    top = int(opt("--top", "40"))
    files = [os.path.join(folder, f) for f in sorted(os.listdir(folder)) if f.lower().endswith(AUDIO)]
    with ProcessPoolExecutor(max(1, (os.cpu_count() or 2) - 2)) as ex:
        rows = [r for r in ex.map(scan, files, chunksize=2) if r]
    # Half-time readings count in the band too (an 80 BPM reading of a 160 BPM track).
    rows = [r for r in rows if lo <= r["bpm"] <= hi or lo <= r["bpm"] * 2 <= hi]
    for key in ("jump_db", "hold_db", "lift_db"):
        for i, r in enumerate(sorted(rows, key=lambda r: -r[key])):
            r["rank"] = r.get("rank", 0) + i
    rows.sort(key=lambda r: r["rank"])
    json.dump(rows, open(os.path.join(folder, "scan.json"), "w"), indent=1)
    print(f"{len(rows)} of {len(files)} tracks have a drop{'' if hi > 900 else f' in {lo:.0f}-{hi:.0f} BPM'}; "
          f"wrote {os.path.join(folder, 'scan.json')}\n")
    print(f"{'#':>3}  {'drop':>6} {'jump':>5} {'hold':>5} {'lift':>5} {'bpm':>6}  track")
    for i, r in enumerate(rows[:top], 1):
        name = " - ".join(x for x in (r["artist"], r["title"]) if x) or r["file"]
        half = " (x2?)" if r["bpm"] < 90 else ""
        print(f"{i:3d}  {r['drop_s']:6.2f} {r['jump_db']:+5.1f} {r['hold_db']:+5.1f} {r['lift_db']:+5.1f} "
              f"{r['bpm']:6.1f}{half}  {name}  [{r['genre'] or '-'}]")
    print("\nNext: npm run music:audition -- <file> <drop_s>   (then the user listens and picks)")


if __name__ == "__main__":
    main()
