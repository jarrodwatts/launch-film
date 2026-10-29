"""Cuts an audition clip of a song with its drop placed where the film's drop is, and checks the drop is real.

  npm run music:audition -- <file> <drop_s> [--film-drop 9] [--len 20]

The person choosing hears every option in the film's own shape: build, then the drop at the same
second the product appears. The clip is --len seconds, fades in for 0.3 s and out for 1.5 s, and
goes to out/auditions/<name>-drop<film-drop>s.mp3.
It measures the bass (30-120 Hz) for 3 s before and after the clip's drop and refuses the clip if
the jump is under 10 dB: on a real film, 2 of 10 shortlisted clips had no drop where the scan said
(+3.8 dB and +10.5 dB) and were cut before anyone listened.
If the file came from npm run music:fetch, it also prints the YouTube link timed about 9 s before
the drop. Put these links in your FINAL message, never above a question box: users don't see them there.
"""
import json, os, shutil, subprocess, sys

import librosa
import numpy as np
import soundfile as sf

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
FFMPEG = os.environ.get("FFMPEG") or shutil.which("ffmpeg") or os.path.join(ROOT, ".tools", "ffmpeg", "ffmpeg")
MIN_JUMP_DB = 10


def bass_db(y, sr, a, b):
    seg = y[max(0, int(a * sr)):max(0, int(b * sr))]
    if len(seg) < 2048:
        return -120.0
    S = np.abs(librosa.stft(seg, n_fft=4096, hop_length=1024)) ** 2
    f = librosa.fft_frequencies(sr=sr, n_fft=4096)
    return float(np.median(10 * np.log10(S[(f >= 30) & (f <= 120)].sum(0) + 1e-12)))


def main():
    args = sys.argv[1:]
    if len(args) < 2 or args[0].startswith("--"):
        sys.exit(__doc__)
    path, drop = args[0], float(args[1])
    opt = lambda k, d: float(args[args.index(k) + 1]) if k in args else d
    film_drop, length = opt("--film-drop", 9.0), opt("--len", 20.0)

    y, sr = librosa.load(path, sr=44100, mono=False)
    y = np.atleast_2d(y)
    start = drop - film_drop
    a = int(round(start * sr))
    clip = y[:, max(0, a):max(0, a) + int(length * sr)]
    if a < 0:  # the drop comes earlier in the song than in the film: pad the front with silence
        clip = np.concatenate([np.zeros((y.shape[0], -a)), clip], axis=1)[:, :int(length * sr)]
    n = clip.shape[1]
    fade_in, fade_out = int(0.3 * sr), int(1.5 * sr)
    env = np.ones(n)
    env[:fade_in] = np.linspace(0, 1, min(fade_in, n))[:min(fade_in, n)]
    env[-fade_out:] *= np.linspace(1, 0, min(fade_out, n))
    clip = clip * env

    mono = clip.mean(0)
    jump = bass_db(mono, sr, film_drop + 0.1, film_drop + 3) - bass_db(mono, sr, film_drop - 3, film_drop - 0.2)
    name = os.path.splitext(os.path.basename(path))[0]
    print(f"{name}: bass {jump:+.1f} dB across the drop at {film_drop:g}s (song {drop:g}s)")
    if jump < MIN_JUMP_DB:
        sys.exit(f"REFUSED: under {MIN_JUMP_DB} dB, so there is no real drop at {drop:g}s. "
                 f"Check the drop time with npm run music:grid -- {path} --drops")

    out = os.path.join(ROOT, "out", "auditions")
    os.makedirs(out, exist_ok=True)
    wav = os.path.join(out, f"{name}-drop{film_drop:g}s.wav")
    sf.write(wav, clip.T, sr)
    dest = wav[:-4] + ".mp3"
    if subprocess.run([FFMPEG, "-v", "error", "-y", "-i", wav, "-b:a", "192k", dest]).returncode == 0:
        os.remove(wav)
    else:
        dest = wav
    print(f"wrote {dest}")

    info = os.path.splitext(path)[0] + ".info.json"
    if os.path.exists(info):
        url = json.load(open(info)).get("webpage_url", "")
        if url:
            print(f"listen: {url}{'&' if '?' in url else '?'}t={max(0, int(drop - 9))}s")


if __name__ == "__main__":
    main()
