#!/usr/bin/env bash
# Starts a new film: copies the kit into <dir> as its own project and git repo, sets it up and
# commits it. The film owns its copy of the engine, so nothing depends on where the plugin is
# installed (a film once broke when the folder it borrowed components from was cleaned up).
# Usage: bash <plugin>/kit/scripts/new-film.sh <dir> [name]
set -euo pipefail
kit=$(cd "$(dirname "$0")/.." && pwd)
dir=${1:?usage: new-film.sh <dir> [name]}
name=${2:-$(basename "$dir")}
[ ! -e "$dir" ] || [ -z "$(ls -A "$dir")" ] || { echo "$dir exists and isn't empty." >&2; exit 1; }
mkdir -p "$dir"
# Everything but installs, renders and generated audio, 3D frames and mixes (setup regenerates them).
tar -C "$kit" -cf - \
  --exclude=./node_modules --exclude=./.tools --exclude=./out --exclude=./public/mix.wav \
  --exclude='./public/music/*.wav' --exclude='./public/sfx/*.wav' --exclude=./public/sfx/stats.json \
  --exclude='./public/3d/*/*' --exclude=./public/3d/manifest.json . | tar -C "$dir" -xf -
find "$dir/public/3d" -mindepth 1 -type d -empty -delete
cd "$dir"
node -e 'const fs = require("fs"); const p = JSON.parse(fs.readFileSync("package.json")); p.name = process.argv[1]; fs.writeFileSync("package.json", JSON.stringify(p, null, 2) + "\n");' \
  "$(echo "$name" | tr '[:upper:] ' '[:lower:]-' | tr -cd 'a-z0-9._-')"
# Reuse the plugin's own ffmpeg download if it has one (a copy, so the film still stands alone).
[ ! -x "$kit/.tools/ffmpeg/ffmpeg" ] || { mkdir -p .tools && cp -R "$kit/.tools/ffmpeg" .tools/; }
bash scripts/setup.sh
version=$(node -p 'require(process.argv[1]).version' "$kit/../.claude-plugin/plugin.json" 2>/dev/null || echo "")
git init -q
git add -A
git commit -qm "Start from launch-film kit${version:+ $version}"
echo "New film in $dir: $(git log --oneline -1)"
echo "Next: cd $dir && npm run doctor && npm run studio"
