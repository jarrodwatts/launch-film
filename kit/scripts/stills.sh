#!/usr/bin/env bash
# Full-size stills of chosen film frames, plus one labelled sheet of them. Bundles ONCE and renders
# every still from that bundle, at most 4 at a time: a dozen separate `remotion still` calls each
# bundle the project themselves, race on webpack's cache and hang.
# Usage: npm run stills -- <frame> [frame...]  ->  out/stills/f<frame>.png and out/stills/sheet.jpg
#   (more than 16 frames make more sheets: sheet_01.jpg and on; all are printed)
set -euo pipefail
cd "$(dirname "$0")/.."
. scripts/env.sh
(( $# )) || { echo "usage: npm run stills -- <frame> [frame...]" >&2; exit 1; }
mkdir -p out/stills
npx remotion bundle --out-dir=out/bundle --log=error >/dev/null
pngs=()
for f in "$@"; do
  npx remotion still out/bundle Film "out/stills/f$f.png" --frame="$f" --image-format=png --log=error >/dev/null &
  pngs+=("out/stills/f$f.png")
  while (( $(jobs -rp | wc -l) >= 4 )); do wait -n; done
done
wait
rm -f out/stills/sheet*.jpg
printf '%s\n' "${pngs[@]}"
scripts/py scripts/sheet.py images out/stills/sheet.jpg "${pngs[@]}"   # prints every sheet: 16 tiles each
