#!/usr/bin/env bash
# The final master, with real shutter blur. The film renders N times (16 by default), each pass
# shifted k/2N of a frame (a 180 degree shutter), as ProRes HQ; ffmpeg averages the passes at
# 10 bits (`mix`), so gradients stay smooth; then x264 crf 16 and the mix as AAC 256k.
#   On 16 cores: 7 to 10 min for a 12.8 s film and 16 min for 40 s (each pass has a fixed start-up
#   cost, so short films don't scale down), and about 0.5 GB of temporary disk per second of film.
#   It prints an estimate once the first pass is done. Stopping it (Ctrl-C) kills every pass and
#   deletes the passes.
# Before rendering: check, clearance (blocking with --release), a fresh mix, a disk check.
# After: the frame count must match the film, and the DELIVERED file's loudness and true peak are
# measured (AAC raised one film's peak by 4 dB over its wav).
# Usage: npm run final -- <out.mp4> [--release] [--passes 16] [--jobs J] [--concurrency C] [--image-format png|jpeg]
set -euo pipefail
cd "$(dirname "$0")/.."
. scripts/env.sh
out=""; release=""; n=16; jobs=""; conc=""; fmt=png
while (( $# )); do
  case $1 in
    --release) release=--release ;;
    --passes) n=$2; shift ;;
    --jobs) jobs=$2; shift ;;
    --concurrency) conc=$2; shift ;;
    --image-format) fmt=$2; shift ;;
    *) out=$1 ;;
  esac
  shift
done
[ -n "$out" ] || { echo "usage: npm run final -- <out.mp4> [--release] [--passes 16]" >&2; exit 1; }
[ -x "$FFMPEG" ] || { echo "No ffmpeg with the mix filter: run npm run setup." >&2; exit 1; }

bash scripts/check.sh
[ -z "$release" ] || npx tsx scripts/clearance.ts --release
npm run --silent mix

total=$(npx tsx scripts/frames.ts --total)
mkdir -p out "$(dirname "$out")"
need=$(awk "BEGIN { printf \"%d\", $n * 1.1 * ($total / 30) / 40 * 1.2 + 1 }")
free=$(df -Pk out | awk 'NR == 2 { printf "%d", $4 / 1048576 }')
(( free >= need )) || { echo "About $need GB of free disk is needed for $n passes; out/ has $free GB." >&2; exit 1; }
cores=$(nproc 2>/dev/null || sysctl -n hw.ncpu)
ram=$(awk '/MemAvailable/ { printf "%d", $2 / 1048576 }' /proc/meminfo 2>/dev/null || echo 16)
[ -n "$jobs" ] || { jobs=$(( ram / 12 )); (( jobs > 4 )) && jobs=4; (( jobs < 1 )) && jobs=1; }
[ -n "$conc" ] || { conc=$(( cores / jobs )); (( conc < 1 )) && conc=1; }
echo "final: $n passes of $total frames, $jobs at a time, concurrency $conc, $fmt capture"

dir=out/passes
# On exit, stop every pass still rendering (each is npx -> node -> a browser, and background jobs
# ignore Ctrl-C), then delete the passes.
killtree() { local c; for c in $(pgrep -P "$1"); do killtree "$c"; done; kill "$1" 2>/dev/null || true; }
trap 'for j in $(jobs -p); do killtree "$j"; done; rm -rf "$dir"' EXIT
trap 'exit 130' INT TERM
rm -rf "$dir"; mkdir -p "$dir"
start=$(date +%s)
npx remotion bundle --out-dir="$dir/bundle" --log=error >/dev/null
fail=0; finished=0
reap() {
  wait -n || fail=1
  finished=$((finished + 1))
  if (( finished == 1 )); then
    local took=$(( $(date +%s) - start ))
    echo "first pass done in ${took}s; all $n passes in about $(( took * ((n + jobs - 1) / jobs) / 60 + 1 )) min, then a few minutes to average"
  fi
}
for k in $(seq 0 $((n - 1))); do
  shift=$(awk "BEGIN { print $k * 0.5 / $n }")
  npx remotion render "$dir/bundle" Film "$dir/p$k.mov" --props="{\"shift\":$shift}" --codec=prores --prores-profile=hq \
    --image-format="$fmt" --muted --concurrency="$conc" --log=error &
  while (( $(jobs -rp | wc -l) >= jobs )); do reap; done
done
while (( $(jobs -rp | wc -l) > 0 )); do reap; done
(( fail == 0 )) || { echo "A pass failed to render." >&2; exit 1; }
echo "passes rendered in $(( ($(date +%s) - start) / 60 ))m$(( ($(date +%s) - start) % 60 ))s; averaging"

inputs=(); for k in $(seq 0 $((n - 1))); do inputs+=(-i "$dir/p$k.mov"); done
"$FFMPEG" -loglevel error -y "${inputs[@]}" -i public/mix.wav -filter_complex "mix=inputs=$n,format=yuv420p" -map "$n:a" \
  -c:v libx264 -crf 16 -preset slow -c:a aac -b:a 256k -movflags +faststart "$out"
echo "rendered in $(( ($(date +%s) - start) / 60 ))m$(( ($(date +%s) - start) % 60 ))s: $out"

frames=$("$FFPROBE" -v error -select_streams v:0 -count_packets -show_entries stream=nb_read_packets -of csv=p=0 "$out")
(( frames == total )) || { echo "The master has $frames frames; the film has $total." >&2; exit 1; }
scripts/py scripts/check_audio.py --loudness "$out"
