#!/usr/bin/env bash
# Downloads a song's own audio for timing work, then proves with Shazam it is the right song.
#
#   npm run music:fetch -- "<artist> <title> [instrumental]"
#
# Saves public/music/<slug>.mp3, <slug>.info.json (the source page, used by music:audition for
# timestamped links) and <slug>.shazam.json. Refuses (and deletes the file) when Shazam names a
# different song: on a real film a search for one song returned another artist's track.
# Shazam confirms the song, not the version: on a real film one download came back as a "(feat. ...)"
# vocal version. Ask for "instrumental" when one exists (vocals fight on-screen text); a vocal result is refused.
# Never take audio from a reference film: its sound effects are baked in.
# Downloaded audio is for timing only. It is not a licence; check one before anyone falls in love with it.
# Needs the extras: npm run setup -- --extras
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
[ -f scripts/env.sh ] && source scripts/env.sh
QUERY="${*:?usage: fetch.sh \"<artist> <title> [instrumental]\"}"
YTDLP="$ROOT/.tools/venv/bin/yt-dlp"
[ -x "$YTDLP" ] || YTDLP="$(command -v yt-dlp || true)"
[ -n "$YTDLP" ] || { echo "yt-dlp missing. Run: npm run setup -- --extras" >&2; exit 1; }
FF="${FFMPEG:-$(command -v ffmpeg || echo "$ROOT/.tools/ffmpeg/ffmpeg")}"

SLUG="$(echo "$QUERY" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-' | sed 's/^-//; s/-$//')"
mkdir -p public/music
SEARCH="$QUERY"
case "$QUERY" in *[Ii]nstrumental*) ;; *) SEARCH="$QUERY official audio" ;; esac
echo "searching: $SEARCH"
"$YTDLP" -q --no-playlist -x --audio-format mp3 --audio-quality 0 --write-info-json --no-write-playlist-metafiles \
  --ffmpeg-location "$(dirname "$FF")" -o "public/music/$SLUG.%(ext)s" "ytsearch1:$SEARCH"

# Shazam a 12 s clip from about 45 s in (past any intro), then compare names.
scripts/py - "public/music/$SLUG.mp3" "$QUERY" "$FF" <<'PY'
import asyncio, json, os, re, subprocess, sys
from shazamio import Shazam
mp3, query, ff = sys.argv[1:4]
base = mp3[:-4]
clip = base + ".clip.wav"
subprocess.run([ff, "-v", "error", "-y", "-ss", "45", "-t", "12", "-i", mp3, clip], check=True)
track = asyncio.run(Shazam().recognize(clip)).get("track") or {}
os.remove(clip)
title, artist = track.get("title", ""), track.get("subtitle", "")
json.dump({"title": title, "artist": artist, "url": track.get("url")}, open(base + ".shazam.json", "w"), indent=1)
words = lambda s: set(re.findall(r"[a-z0-9]+", s.lower()))
want = words(query) - {"instrumental", "official", "audio", "feat", "ft", "the", "a"}
got = words(f"{artist} {title}")
missing = want - got
src = json.load(open(base + ".info.json")).get("webpage_url", "")
print(f"Shazam: {title} by {artist}   (source {src})")
reject = None
if not title:
    reject = "Shazam did not recognise it"
elif missing:
    reject = f"Shazam's name lacks: {', '.join(sorted(missing))}"
elif "instrumental" in query.lower() and re.search(r"\b(feat|ft|vocal)", title.lower()):
    reject = "asked for the instrumental, got a vocal version"
if reject:
    for ext in (".mp3", ".info.json", ".shazam.json"):
        if os.path.exists(base + ext):
            os.remove(base + ext)
    print(f"REFUSED: {reject}. Try a more exact query, e.g. add the remix or version name.", file=sys.stderr, flush=True)
    os._exit(1)  # os._exit skips shazamio's noisy "unclosed session" warnings at shutdown
if "instrumental" in query.lower() and "instrumental" not in title.lower():
    print("note: Shazam can't confirm the version. Listen, or check for vocals with Whisper (npm run refs on the file).")
print(f"OK: {mp3}\nNext: npm run music:grid -- {mp3} --drops, then set 'licence' in src/music.json.", flush=True)
os._exit(0)
PY
