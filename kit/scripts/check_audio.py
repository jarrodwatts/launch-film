"""The sound bar an agent can run without ears. Fails on: a delivered mp4 off the loudness target
(-14 LUFS +-0.5, true peak at most -1 dBTP), a cue whose file is missing, a cue outside the film, and a
song jump that is not a whole number of phrases on a scene cut, or whose seam jumps 3 dB or more.
Lists, without failing: named moments with no cue within 2 frames (every motion makes a sound),
masked cues (within 40 ms of a louder cue on the same side), multi-event files placed whole by
accident, and cues per second. Draws out/cue-sheet.png: the mix's spectrogram with the beat grid,
scene cuts and every cue labelled, for a judge to look at instead of guessing.

  npm run audio:check [-- --mp4 out/film.mp4]
  scripts/py scripts/check_audio.py --loudness out/film.mp4     (just measure a delivered file)
"""
import argparse, json, os, re, subprocess, sys

import librosa, numpy as np
from PIL import Image, ImageDraw

TARGET, TOLERANCE, MAX_TP = -14.0, 0.5, -1.0  # the same target as scripts/mix.py
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser()
ap.add_argument("--mp4"); ap.add_argument("--loudness")
a = ap.parse_args()


def loudness(path):
    """Integrated LUFS and true peak of a delivered file, measured by ffmpeg's ebur128."""
    log = subprocess.run([os.environ.get("FFMPEG", "ffmpeg"), "-hide_banner", "-nostats", "-i", path, "-map", "0:a", "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    summary = log[log.rfind("Summary:"):]
    lufs = float(re.search(r"I:\s+(-?[\d.]+) LUFS", summary).group(1))
    tp = float(re.search(r"Peak:\s+(-?[\d.inf]+) dBFS", summary).group(1))
    ok = abs(lufs - TARGET) <= TOLERANCE and tp <= MAX_TP
    print(f"{os.path.basename(path)}: {lufs:.1f} LUFS (target {TARGET}), true peak {tp:.1f} dBTP (max {MAX_TP}) -> {'OK' if ok else 'OFF TARGET'}")
    return ok


if a.loudness:
    loudness(a.loudness)
    sys.exit()

plan = json.load(open(f"{ROOT}/out/sound.json"))
tl = json.load(open(f"{ROOT}/out/timeline.json"))
music = json.load(open(f"{ROOT}/src/music.json"))
stats = json.load(open(f"{ROOT}/public/sfx/stats.json"))
cues, length, fps, beat_s = plan["cues"], plan["length_s"], tl["fps"], music["beat_s"]
fails, notes = [], []
exists = lambda n: any(os.path.exists(f"{ROOT}/public/sfx/{n}{e}") for e in (".wav", ".mp3", ".flac", ".ogg", ".m4a"))

for c in cues:
    st = stats.get(c["sfx"], {})
    if not exists(c["sfx"]):
        fails.append(f"cue {c['sfx']} at {c['at']:.2f}s: no file in public/sfx")
    if c["at"] < 0 or c["at"] > length:
        fails.append(f"cue {c['sfx']} peaks at {c['at']:.2f}s, outside the film (0 to {length:.2f}s)")
    elif c["at"] - (0 if c.get("keep") else st.get("peak", 0)) < -0.02:
        notes.append(f"cue {c['sfx']} at {c['at']:.2f}s starts before the film; its head is cut")
    if len(st.get("events", [])) > 1 and not c.get("keep") and not c.get("whole"):
        notes.append(f"cue {c['sfx']} at {c['at']:.2f}s: {len(st['events'])}-event file without keep/whole (the mix keeps only the peak's event)")

# Coverage: every named moment should have a sound within 2 frames.
times = np.array([c["at"] for c in cues])
for sc in tl["scenes"]:
    for name, moments in sc["moments"].items():
        for m in moments:
            if not len(times) or np.min(np.abs(times - m)) > 2 / fps + 1e-6:
                notes.append(f"silent moment: {sc['key']}.{name} at {m:.2f}s has no cue within 2 frames")

# Masking: a cue within 40 ms of a louder one on the same side of the stereo field.
side = lambda c: 0 if abs(c.get("pan", 0)) < 0.1 else np.sign(c["pan"])
for i, c in enumerate(cues):
    for d in cues:
        if d is not c and abs(d["at"] - c["at"]) < 0.04 and d["db"] > c["db"] and side(d) == side(c):
            notes.append(f"masked: {c['sfx']} ({c['db']} dB) at {c['at']:.2f}s under {d['sfx']} ({d['db']} dB); lead it by 30 to 60 ms or raise it 1 to 2 dB")
            break

# The song's jumps: on a scene cut, a whole number of phrases, and a seam that matches.
track, sr = librosa.load(f"{ROOT}/{music['file']}", sr=22050, mono=True)
rms = lambda t0: float(20 * np.log10(np.sqrt(np.mean(track[max(0, int((t0 - 0.2) * sr)): max(1, int(t0 * sr))] ** 2)) + 1e-9))
cuts = [sc["start_s"] for sc in tl["scenes"]]
song = plan["song"]
for prev, part in zip(song, song[1:]):
    old = prev["track_s"] + part["at_s"] - prev["at_s"]
    jump = (part["track_s"] - old) / beat_s
    if min(abs(part["at_s"] - c) for c in cuts) > 1 / fps:
        fails.append(f"song jump at {part['at_s']:.2f}s is not on a scene cut")
    if abs(jump / music["phrase_beats"] - round(jump / music["phrase_beats"])) > 0.01:
        fails.append(f"song jump at {part['at_s']:.2f}s is {jump:.2f} beats, not whole {music['phrase_beats']}-beat phrases")
    # What leads into the jump's target should sound like what actually played before the cut.
    if abs(rms(old) - rms(part["track_s"])) >= 3:
        fails.append(f"song seam at {part['at_s']:.2f}s: the level before it jumps {abs(rms(old) - rms(part['track_s'])):.1f} dB (3 dB max)")

if a.mp4 and not loudness(a.mp4):
    fails.append(f"{a.mp4} is off the loudness target")

per_s = np.bincount(np.clip(times.astype(int), 0, int(length)), minlength=int(np.ceil(length)))
print(f"{len(cues)} cues in {length:.2f}s ({len(cues) / length:.1f} a second). Per second: {' '.join(map(str, per_s))}")

# The cue sheet.
PX, SPEC_H, LABEL_H, ROWS = 120, 360, 300, 12
width = int(length * PX) + 1
sheet = Image.new("RGB", (width, SPEC_H + LABEL_H), (12, 12, 16))
mix_path = f"{ROOT}/public/mix.wav"
if os.path.exists(mix_path):
    y, msr = librosa.load(mix_path, sr=22050, mono=True)
    S = librosa.power_to_db(librosa.feature.melspectrogram(y=y, sr=msr, n_mels=128, hop_length=256), ref=np.max)
    v = np.clip((S + 80) / 80, 0, 1)[::-1]
    rgb = np.stack([np.clip(v * 2, 0, 1), np.clip(v * 2 - 0.7, 0, 1), np.clip(0.4 + v - 2 * v ** 2, 0, 1)], -1)
    sheet.paste(Image.fromarray((rgb * 255).astype(np.uint8)).resize((width, SPEC_H)), (0, 0))
d = ImageDraw.Draw(sheet)
x = lambda t: int(t * PX)
first = tl["first_beat"]
for k in range(int(np.ceil(length / beat_s)) + 1):
    phrase = (first + k) % music["phrase_beats"] == 0
    d.line([x(k * beat_s), 0, x(k * beat_s), SPEC_H], fill=(150, 150, 150) if phrase else (60, 60, 70), width=2 if phrase else 1)
for sc in tl["scenes"]:
    d.line([x(sc["start_s"]), 0, x(sc["start_s"]), SPEC_H + LABEL_H], fill="white", width=3)
    d.text((x(sc["start_s"]) + 6, 4), sc["key"], fill="white")
for p in song[1:]:
    d.text((x(p["at_s"]) + 6, 18), "song jump", fill=(255, 120, 120))
for i, c in enumerate(cues):
    row = i % ROWS
    d.line([x(c["at"]), SPEC_H - 30, x(c["at"]), SPEC_H + 8 + row * 24], fill=(255, 210, 90), width=1)
    d.text((x(c["at"]) + 3, SPEC_H + 6 + row * 24), f"{c['sfx']} {c['db']:g}", fill=(255, 210, 90))
os.makedirs(f"{ROOT}/out", exist_ok=True)
sheet.save(f"{ROOT}/out/cue-sheet.png")

for n in notes:
    print("note:", n)
for f in fails:
    print("FAIL:", f)
print(f"audio check: {'FAIL' if fails else 'PASS'} ({len(fails)} failures, {len(notes)} notes); cue sheet in out/cue-sheet.png")
sys.exit(1 if fails else 0)
