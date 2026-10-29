#!/usr/bin/env bash
# Renders one scene (no motion blur, half size, no sound) and makes contact sheets of it, 8 frames a second.
# Usage: scripts/scene.sh <scene> [name]   ->  out/scenes/<name>.mp4 and out/scenes/<name>/sheet_*.jpg
# Scenes: build question reveal flip offerings social close.  A still: npx remotion still Film out/x.png --frame=N
set -euo pipefail
cd "$(dirname "$0")/.."
scene=$1; name=${2:-$1}
frames=$(npx tsx scripts/frames.ts "$scene")
mkdir -p "out/scenes/$name"
npx remotion render Film "out/scenes/$name.mp4" --frames="$frames" --scale=0.5 --muted --concurrency=4 --log=error
"${PYTHON:-python3}" -I "${SHEETS:?set SHEETS to the contact-sheet script}" "out/scenes/$name.mp4" "out/scenes/$name" 8 >/dev/null
echo "out/scenes/$name.mp4 (frames $frames), sheets in out/scenes/$name/"
