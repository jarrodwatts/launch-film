#!/usr/bin/env bash
# The review cut shown each round: one pass, full size, no blur, with the fresh mix. A few minutes
# for 40 s. Show it with a seconds-to-scene map (npm run frames).
# Usage: npm run draft -- out/<name>-vN-draft.mp4
set -euo pipefail
cd "$(dirname "$0")/.."
. scripts/env.sh
out=${1:-out/draft.mp4}
npm run --silent mix
cores=$(nproc 2>/dev/null || sysctl -n hw.ncpu); conc=$(( cores / 2 )); (( conc > 8 )) && conc=8; (( conc < 1 )) && conc=1
start=$(date +%s)
npx remotion render Film "$out" --codec=h264 --crf=18 --audio-codec=aac --audio-bitrate=256k --concurrency="$conc" --log=error
echo "$out ($(( $(date +%s) - start ))s)"
