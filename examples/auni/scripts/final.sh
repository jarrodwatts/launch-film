#!/usr/bin/env bash
# The final cut, with shutter blur: renders the film at 16 shifts across half a frame (a 180 degree
# shutter), 4 at a time, and averages them in ffmpeg at 10 bits, then lays the mix under it.
# Usage: scripts/final.sh <out.mp4>   (run npm run mix first)
set -euo pipefail
cd "$(dirname "$0")/.."
out=$1; n=16; dir=out/passes
FF=${FFMPEG:-ffmpeg}  # a static ffmpeg 7 build; set FFMPEG to its path
mkdir -p "$dir"
npx remotion bundle --out-dir="$dir/bundle" --log=error >/dev/null
for k in $(seq 0 $((n - 1))); do
  shift=$(python3 -c "print($k * 0.5 / $n)")
  npx remotion render "$dir/bundle" Film "$dir/p$k.mov" --props="{\"shift\":$shift}" --codec=prores --prores-profile=hq --muted --concurrency=3 --log=error &
  if (( (k + 1) % 4 == 0 )); then wait; fi
done
wait
inputs=(); for k in $(seq 0 $((n - 1))); do inputs+=(-i "$dir/p$k.mov"); done
$FF -loglevel error -y "${inputs[@]}" -i public/mix.wav -filter_complex "mix=inputs=$n,format=yuv420p" -map $n:a -c:v libx264 -crf 16 -preset slow -c:a aac -b:a 256k -movflags +faststart "$out"
rm -rf "$dir"
echo "$out"
