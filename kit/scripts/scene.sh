#!/usr/bin/env bash
# Renders one scene, fast: only its frames, half size, muted, no blur. Then contact sheets at 8
# frames a second, labelled in FILM time, so they line up with the user's notes. About 10 to 50 s.
# Usage: npm run scene -- <scene> [name]  ->  out/scenes/<name>.mp4 and out/scenes/<name>/sheet_NN.jpg
set -euo pipefail
cd "$(dirname "$0")/.."
. scripts/env.sh
scene=${1:?usage: npm run scene -- <scene> [name]}; name=${2:-$1}
frames=$(npx tsx scripts/frames.ts "$scene")
cores=$(nproc 2>/dev/null || sysctl -n hw.ncpu); conc=$(( cores / 2 )); (( conc > 8 )) && conc=8; (( conc < 1 )) && conc=1
mkdir -p "out/scenes/$name"
start=$(date +%s)
npx remotion render Film "out/scenes/$name.mp4" --frames="$frames" --scale=0.5 --muted --concurrency="$conc" --log=error
scripts/py scripts/sheet.py video "out/scenes/$name.mp4" "out/scenes/$name" 8 "${frames%-*}" >/dev/null
echo "out/scenes/$name.mp4 (film frames $frames, $(( $(date +%s) - start ))s), sheets in out/scenes/$name/"
