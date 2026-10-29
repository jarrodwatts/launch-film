#!/usr/bin/env bash
# One frame exactly as the final will show it, shutter blur included: renders the frame at N shifts
# across half a frame (from one bundle) and averages them at float precision. Use it on the fastest
# moves and on cuts before spending 10 to 16 minutes on a final: stamped copies on a whip, doubled digits
# ("5.7KK"), crossfaded labels and a cut frame that still shows the old shot all show up here.
# Usage: npm run blurstill -- <frame> [passes=16]  ->  out/blur/f<frame>.png
set -euo pipefail
cd "$(dirname "$0")/.."
. scripts/env.sh
frame=${1:?usage: npm run blurstill -- <frame> [passes]}; n=${2:-16}
dir=out/blur/f$frame-passes; mkdir -p "$dir"
npx remotion bundle --out-dir=out/bundle --log=error >/dev/null
for k in $(seq 0 $((n - 1))); do
  shift=$(awk "BEGIN { print $k * 0.5 / $n }")
  npx remotion still out/bundle Film "$dir/p$k.png" --frame="$frame" --props="{\"shift\":$shift}" --image-format=png --log=error >/dev/null &
  while (( $(jobs -rp | wc -l) >= 4 )); do wait -n; done
done
wait
scripts/py scripts/blur_average.py "out/blur/f$frame.png" "$dir"/p*.png
rm -rf "$dir"
