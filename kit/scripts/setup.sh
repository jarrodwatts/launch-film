#!/usr/bin/env bash
# Sets the project up so every command works: node packages, the Python venv, a full ffmpeg, the
# demo's stand-in audio and 3D shot (only where yours are missing), SFX measurements, a self-test
# of the beat-grid tool, and a first mix. Safe to run again at any time.
# Usage: npm run setup [-- --extras]   (--extras adds the music-hunt tools: shazamio, whisper, yt-dlp)
set -euo pipefail
cd "$(dirname "$0")/.."
. scripts/env.sh
extras=${1:-}

echo "== node packages"
if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi

echo "== python venv (.tools/venv)"
py=$(command -v python3 || true)
[ -n "$py" ] || { echo "python3 not found: install Python 3.11 or newer." >&2; exit 1; }
"$py" -c 'import sys; sys.exit(sys.version_info < (3, 11))' || { echo "Python 3.11 or newer is needed ($("$py" --version))." >&2; exit 1; }
[ -x .tools/venv/bin/python ] || "$py" -m venv .tools/venv
.tools/venv/bin/python -m pip install -q --upgrade pip
.tools/venv/bin/python -m pip install -q -r requirements.txt
if [ "$extras" = "--extras" ]; then .tools/venv/bin/python -m pip install -q -r requirements-extra.txt; fi

echo "== ffmpeg with the mix and ebur128 filters"
if [ ! -x "$FFMPEG" ]; then
  case "$(uname -s)-$(uname -m)" in
    Linux-x86_64) arch=amd64 ;;
    Linux-aarch64) arch=arm64 ;;
    Darwin-*) echo "Install ffmpeg with Homebrew (brew install ffmpeg), then run setup again." >&2; exit 1 ;;
    *) echo "Install a full ffmpeg (with the mix and ebur128 filters) on your PATH, then run setup again." >&2; exit 1 ;;
  esac
  mkdir -p .tools/ffmpeg
  curl -fL --retry 3 "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-$arch-static.tar.xz" -o .tools/ffmpeg.tar.xz
  tar -xJf .tools/ffmpeg.tar.xz -C .tools/ffmpeg --strip-components=1
  rm .tools/ffmpeg.tar.xz
  . scripts/env.sh
fi
echo "ffmpeg: $FFMPEG"

echo "== demo stand-ins (only what is missing)"
scripts/py scripts/make_demo_audio.py
if find public/sfx -maxdepth 1 -type f \( -name '*.wav' -o -name '*.mp3' -o -name '*.flac' -o -name '*.ogg' -o -name '*.m4a' \) | grep -q .; then
  scripts/py scripts/sfx_stats.py public/sfx >/dev/null && echo "measured public/sfx -> stats.json"
else
  echo "public/sfx has no sound files: copy your SFX pack in, then npm run sfx:stats (see public/sfx/README.md)." >&2
fi
[ -f public/3d/manifest.json ] || scripts/py scripts/make_demo_shot.py

song=$(node -e 'console.log(require("./src/music.json").file)')
if [ -f "$song" ]; then
  echo "== beat-grid self-test"
  scripts/py scripts/music_grid.py "$song" --check || echo "warning: the measured grid disagrees with src/music.json (see above)." >&2
  echo "== first mix"
  npm run --silent mix
else
  echo "warning: $song is missing, so there is no mix yet: put your song there (see public/music/README.md)." >&2
fi
echo "Set up. Next: npm run doctor, then npm run studio."
