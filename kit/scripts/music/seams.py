"""Measures where the song can jump by a whole phrase without anyone hearing it.

  npm run music:seams [-- --jump <beats>]     (default: one phrase back; --jump -8 checks a forward jump)

Why: scenes grow during notes rounds, and the close then misses the song's break. The engine fixes
that by jumping the track back (or forward) whole phrases on a picture cut (song() in
src/engine/cues.ts). A jump only sounds seamless where the music right after the jump point
matches the music a phrase earlier. This prints, for every even beat X, how alike the 4 beats from
track beat X and from track beat X - jump are:
  chroma   harmony and melody (12 pitch classes), frame by frame
  mel      timbre and rhythm (the spectrum's shape over time)
  score    the mean of the two; a seam is good at 0.9 or more
  rms      how much louder or quieter the 100 ms after the jump is than what would have played (keep it under 3 dB)
On a real song, good seams scored about 0.99 and bad ones about 0.5. Put the splice on a good
seam that is also a hard picture cut, so the cut hides it.
Reads src/music.json (file, drop_file_s, beat_s, phrase_beats, sections_beats).
"""
import json, os, sys

import librosa
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
GOOD = 0.9


def cosine(a, b):
    a, b = a.ravel(), b.ravel()
    return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-12))


def main():
    args = sys.argv[1:]
    m = json.load(open(os.path.join(ROOT, "src", "music.json")))
    jump = int(args[args.index("--jump") + 1]) if "--jump" in args else int(m["phrase_beats"])
    y, sr = librosa.load(os.path.join(ROOT, m["file"]), sr=22050, mono=True)
    hop = 512
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=hop)
    mel = librosa.power_to_db(librosa.feature.melspectrogram(y=y, sr=sr, hop_length=hop, n_mels=64))
    rms = librosa.feature.rms(y=y, hop_length=hop)[0]
    fr = lambda s: int(round(s * sr / hop))
    at = lambda beat: m["drop_file_s"] + beat * m["beat_s"]  # track seconds of a beat (beat 0 = the drop)
    width = fr(4 * m["beat_s"])

    sections = m["sections_beats"].values()
    lo, hi = min(s[0] for s in sections), max(s[1] for s in sections)
    first = int(lo) + int(lo) % 2
    print(f"jump {jump} beats; 1.00 = identical. A good seam scores {GOOD} or more.\n")
    print(f"{'beat X':>7} {'track':>9} {'chroma':>7} {'mel':>6} {'score':>6} {'rms dB':>7}")
    good = []
    for x in range(first, int(hi) - 3, 2):
        a, b = fr(at(x)), fr(at(x - jump))
        if min(a, b) < fr(0.1) or max(a, b) + width > chroma.shape[1]:
            continue
        c = cosine(chroma[:, a:a + width], chroma[:, b:b + width])
        mm = mel[:, a:a + width] - mel[:, a:a + width].mean()
        mb = mel[:, b:b + width] - mel[:, b:b + width].mean()
        k = cosine(mm, mb)
        # Loudness step: what plays after the jump vs what would have played without it.
        step = 20 * np.log10((rms[b:b + fr(0.1)].mean() + 1e-9) / (rms[a:a + fr(0.1)].mean() + 1e-9))
        score = (c + k) / 2
        ok = score >= GOOD and abs(step) < 3
        good += [x] if ok else []
        print(f"{x:7d} {x - jump:9d} {c:7.2f} {k:6.2f} {score:6.2f} {step:+7.1f}  {'good' if ok else ''}")
    print(f"\nGood seams at beats: {good or 'none'}")
    print("A splice at film beat X plays track beat X - late from there on. Choose a scene cut on a good seam.")


if __name__ == "__main__":
    main()
