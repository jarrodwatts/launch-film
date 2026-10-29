"""Turns one reference film (or a song) into an analysis pack an agent can read without eyes or ears.

  npm run refs -- <video-or-audio> <outdir>

Writes into <outdir>:
  analysis.json        length, cuts (hard and soft), shot lengths, cuts per 10 s, tempo and beats,
                       the 25 strongest transients, loudness and brightness per 0.5 s, how many cuts
                       land within 80 ms of a beat vs of a transient, a Whisper transcript, Shazam IDs
  sheets/*.jpg         4x4 contact sheets at 4 fps, each tile labelled with its time
  shots/*.jpg          one larger frame from the middle of every shot, for reading on-screen text
  audio_vs_cuts.png    spectrogram with picture cuts as lines, plus loudness with cuts and beats
Why these: on the reference films that shaped a real launch film, 26 of 28 cuts landed on a sound
transient but only 14 of 28 on a beat. "Cut on the beat" really means "cut on a sound effect".
Shazam runs at the start, middle and end, because one film switched songs under a push-in at 15.3 s
and another used a remix only from 25 s. You can't hear: read the spectrogram (a drop is a sudden
jump in loudness and low end; a riser is rising brightness; a whoosh is a broad sweep).
Hard-cut detection undercounts: count visual beats yourself from the sheets.
Whisper and Shazam need the extras (npm run setup -- --extras); without them those parts are skipped.
"""
import asyncio, json, os, re, shutil, subprocess, sys

import librosa
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
TOOLS = os.path.join(ROOT, ".tools", "ffmpeg")
FF = os.environ.get("FFMPEG") or shutil.which("ffmpeg") or os.path.join(TOOLS, "ffmpeg")
FP = os.environ.get("FFPROBE") or shutil.which("ffprobe") or os.path.join(TOOLS, "ffprobe")
SHEET_FPS, COLS, ROWS = 4, 4, 4


def run(args):
    return subprocess.run(args, capture_output=True, text=True)


def font(size=20):
    try:
        return ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf", size)
    except OSError:
        return ImageFont.load_default(size)


def probe(path):
    d = json.loads(run([FP, "-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height,r_frame_rate",
                        "-of", "json", path]).stdout)
    v = next((s for s in d["streams"] if s["codec_type"] == "video"), None)
    meta = {"duration": float(d["format"]["duration"]), "has_video": v is not None,
            "has_audio": any(s["codec_type"] == "audio" for s in d["streams"])}
    if v:
        num, den = map(int, v["r_frame_rate"].split("/"))
        meta.update(width=v["width"], height=v["height"], fps=round(num / den, 3))
    return meta


def cuts(path, threshold):
    err = run([FF, "-hide_banner", "-i", path, "-vf", f"select='gt(scene,{threshold})',showinfo", "-an", "-f", "null", "-"]).stderr
    return [round(float(t), 3) for t in re.findall(r"pts_time:([\d.]+)", err)]


def sheets(path, out):
    """Frames at SHEET_FPS tiled into labelled grids (labels drawn with PIL: static ffmpeg builds lack drawtext)."""
    tmp = os.path.join(out, "_frames")
    os.makedirs(tmp, exist_ok=True)
    os.makedirs(os.path.join(out, "sheets"), exist_ok=True)
    run([FF, "-hide_banner", "-y", "-i", path, "-vf", f"fps={SHEET_FPS},scale=480:-2", "-q:v", "3", f"{tmp}/f_%05d.jpg"])
    frames, per, f = sorted(os.listdir(tmp)), COLS * ROWS, font()
    for n in range(0, len(frames), per):
        batch = [Image.open(os.path.join(tmp, x)) for x in frames[n:n + per]]
        w, h = batch[0].size
        sheet = Image.new("RGB", (COLS * (w + 4), ROWS * (h + 4)), "white")
        d = ImageDraw.Draw(sheet)
        for i, im in enumerate(batch):
            x, y = (i % COLS) * (w + 4), (i // COLS) * (h + 4)
            sheet.paste(im, (x, y))
            d.rectangle([x, y, x + 84, y + 26], fill="black")
            d.text((x + 4, y + 2), f"{(n + i) / SHEET_FPS:5.2f}s", fill="yellow", font=f)
        sheet.save(os.path.join(out, "sheets", f"sheet_{n // per:02d}_{n / SHEET_FPS:05.1f}s.jpg"), quality=80)
    shutil.rmtree(tmp)


def shot_frames(path, out, cut_times, duration):
    os.makedirs(os.path.join(out, "shots"), exist_ok=True)
    bounds = [0.0] + cut_times + [duration]
    for i in range(len(bounds) - 1):
        mid = (bounds[i] + bounds[i + 1]) / 2
        run([FF, "-hide_banner", "-y", "-ss", f"{mid:.3f}", "-i", path, "-frames:v", "1", "-vf", "scale=1280:-2",
             "-q:v", "3", os.path.join(out, "shots", f"shot_{i:03d}_{mid:06.2f}s.jpg")])


def audio(path, out, cut_times):
    wav = os.path.join(out, "audio.wav")
    run([FF, "-hide_banner", "-y", "-i", path, "-ac", "1", "-ar", "22050", wav])
    y, sr = librosa.load(wav, sr=22050)
    if len(y) == 0 or np.max(np.abs(y)) < 1e-4:
        return {"silent": True}, wav
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
    beat_t = librosa.frames_to_time(beats, sr=sr)
    env = librosa.onset.onset_strength(y=y, sr=sr)
    onsets = librosa.onset.onset_detect(onset_envelope=env, sr=sr, units="time")
    strength = env[librosa.time_to_frames(onsets, sr=sr)]
    top = sorted(zip(onsets, strength), key=lambda p: -p[1])[:25]  # usually SFX hits, risers ending, drops
    half = int(sr * 0.5)
    rms = [round(float(20 * np.log10(np.sqrt(np.mean(y[i:i + half] ** 2)) + 1e-9)), 1) for i in range(0, len(y), half)]
    cent = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
    ct = librosa.frames_to_time(np.arange(len(cent)), sr=sr)
    bright = [round(float(np.mean(cent[(ct >= t) & (ct < t + 0.5)])), 0) for t in np.arange(0, len(y) / sr, 0.5)]
    near = lambda ts, pool: [t for t in ts if len(pool) and np.min(np.abs(np.asarray(pool) - t)) <= 0.08]
    stats = {"silent": False, "tempo_bpm": round(float(np.atleast_1d(tempo)[0]), 1),
             "beat_times": [round(float(t), 2) for t in beat_t],
             "strongest_transients_s": [round(float(t), 2) for t, _ in sorted(top)],
             "loudness_db_per_0.5s": rms, "brightness_hz_per_0.5s": bright}
    if cut_times:
        stats["cuts_on_beat_within_80ms"] = f"{len(near(cut_times, beat_t))}/{len(cut_times)}"
        stats["cuts_on_transient_within_80ms"] = f"{len(near(cut_times, onsets))}/{len(cut_times)}"
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        from librosa import display
    except ImportError:
        print("matplotlib missing (npm run setup -- --extras): no spectrogram", file=sys.stderr)
        return stats, wav
    S = librosa.amplitude_to_db(np.abs(librosa.stft(y)), ref=np.max)
    fig, ax = plt.subplots(2, 1, figsize=(18, 7), sharex=True, gridspec_kw={"height_ratios": [3, 1]})
    display.specshow(S, sr=sr, x_axis="time", y_axis="log", ax=ax[0])
    ax[1].plot(np.arange(len(rms)) * 0.5, rms)
    for c in cut_times:
        ax[0].axvline(c, color="white", lw=0.8, alpha=0.8)
        ax[1].axvline(c, color="red", lw=0.8, alpha=0.6)
    for b in beat_t:
        ax[1].axvline(b, color="green", lw=0.4, alpha=0.4)
    ax[0].set_title("Spectrogram (white lines = picture cuts)")
    ax[1].set_title("Loudness dB per 0.5 s (red = cuts, green = detected beats)")
    ax[1].set_xticks(np.arange(0, len(y) / sr + 1, 1))
    fig.tight_layout()
    fig.savefig(os.path.join(out, "audio_vs_cuts.png"), dpi=80)
    plt.close(fig)
    return stats, wav


def transcript(wav):
    """Marks voiceover vs lyrics, and whether a 'instrumental' really has no vocals. Mishears happen."""
    from faster_whisper import WhisperModel
    pcm, _ = librosa.load(wav, sr=16000)
    segs, info = WhisperModel("small", device="cpu", compute_type="int8").transcribe(pcm, vad_filter=True)
    return {"language": info.language,
            "lines": [f"[{s.start:6.2f}-{s.end:6.2f}] {s.text.strip()}" for s in segs if s.no_speech_prob < 0.6]}


async def music_id(wav, duration):
    from shazamio import Shazam
    sh, found = Shazam(), []
    for start in sorted({0, max(0, duration / 2 - 6), max(0, duration - 13)}):
        clip = f"{wav[:-4]}_clip{int(start)}.wav"
        run([FF, "-hide_banner", "-y", "-ss", str(start), "-t", "12", "-i", wav, clip])
        try:
            t = (await sh.recognize(clip)).get("track")
            found.append({"from_s": round(start, 1), "title": t and t.get("title"), "artist": t and t.get("subtitle")})
        except Exception as e:  # recognition is best effort
            found.append({"from_s": round(start, 1), "error": str(e)[:120]})
        os.remove(clip)
    return found


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    path, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True)
    meta = probe(path)
    hard = []
    if meta["has_video"]:
        hard = cuts(path, 0.30)
        meta.update(cuts_hard_s=hard, cuts_soft_s=cuts(path, 0.15))
        lens = np.diff([0.0] + hard + [meta["duration"]])
        meta.update(shot_count=len(lens), avg_shot_s=round(float(np.mean(lens)), 2), median_shot_s=round(float(np.median(lens)), 2),
                    cuts_per_10s=[sum(1 for c in hard if w <= c < w + 10) for w in range(0, int(meta["duration"]) + 1, 10)])
        sheets(path, out)
        shot_frames(path, out, hard, meta["duration"])
    if meta["has_audio"]:
        meta["audio"], wav = audio(path, out, hard)
        if not meta["audio"].get("silent"):
            for key, job in (("transcript", lambda: transcript(wav)), ("music_id", lambda: asyncio.run(music_id(wav, meta["duration"])))):
                try:
                    meta[key] = job()
                except ImportError:
                    print(f"{key} skipped: install the extras (npm run setup -- --extras)", file=sys.stderr)
    json.dump(meta, open(os.path.join(out, "analysis.json"), "w"), indent=1)
    print(out, f"{meta['duration']:.1f}s", f"{meta.get('shot_count', 0)} shots", meta.get("audio", {}).get("tempo_bpm"), "BPM",
          meta.get("audio", {}).get("cuts_on_transient_within_80ms", ""), "cuts on transients", meta.get("music_id", ""), flush=True)
    os._exit(0)  # skips shazamio's "unclosed session" noise at shutdown


if __name__ == "__main__":
    main()
