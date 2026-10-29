#!/usr/bin/env bash
# Says whether this machine can make the film, and what to fix if not. Usage: npm run doctor
cd "$(dirname "$0")/.."
. scripts/env.sh
bad=0
ok() { printf '  ok    %s\n' "$1"; }
no() { printf '  FIX   %s\n' "$1"; bad=1; }
note() { printf '  note  %s\n' "$1"; }

v=$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)
(( v >= 20 )) && ok "node $(node -v)" || no "node 20 or newer is needed (found $(node -v 2>/dev/null || echo none))"
[ -d node_modules/remotion ] && ok "remotion $(node -p 'require("remotion/package.json").version')" || no "node packages missing: npm run setup"
if [ -x "$PY" ]; then
  ok "python $("$PY" -c 'import sys; print(sys.version.split()[0])') in .tools/venv"
  "$PY" -I -c 'import librosa, numpy, scipy, pyloudnorm, soundfile, PIL' 2>/dev/null && ok "python packages import" || no "python packages: npm run setup"
else
  no "no Python venv: npm run setup"
fi
if [ -x "$FFMPEG" ] && has_filters "$FFMPEG"; then ok "ffmpeg $FFMPEG (has mix, ebur128)"; else no "no ffmpeg with the mix and ebur128 filters: npm run setup"; fi
[ -x "$FFPROBE" ] && ok "ffprobe $FFPROBE" || no "no ffprobe: npm run setup"
cores=$(nproc 2>/dev/null || sysctl -n hw.ncpu)
ram=$(awk '/MemTotal/ { printf "%d", $2 / 1048576 }' /proc/meminfo 2>/dev/null || echo "?")
free=$(df -Pk . | awk 'NR == 2 { printf "%d", $4 / 1048576 }')
ok "$cores cores, ${ram} GB RAM (a final runs about one 12 GB pass job per 12 GB free, up to 4)"
total=$(npx tsx scripts/frames.ts --total 2>/dev/null || echo 1200)
need=$(awk "BEGIN { printf \"%d\", 16 * 1.1 * ($total / 30) / 40 * 1.2 + 1 }")
(( free >= need )) && ok "$free GB free disk (a final of this film needs about $need GB while it runs)" || no "$free GB free disk: a final of this film needs about $need GB while it runs"
[ -n "$BLENDER" ] && ok "blender $BLENDER" || note "no Blender (only needed for 3D shots: npm run blender:install)"
song=$(node -e 'console.log(require("./src/music.json").file)' 2>/dev/null)
[ -f "$song" ] && ok "song $song" || no "song $song is missing (public/music/README.md)"
[ -f public/sfx/stats.json ] && ok "SFX measured (public/sfx/stats.json)" || no "SFX not measured: npm run sfx:stats"
[ -f public/mix.wav ] && ok "mix.wav present" || note "no mix yet: npm run mix"
note "renders need network for Google Fonts, and the first render downloads Chrome Headless Shell"
(( bad == 0 )) && echo "doctor: all green" || { echo "doctor: fix the lines marked FIX"; exit 1; }
