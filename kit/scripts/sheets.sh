#!/usr/bin/env bash
# Contact sheets of any rendered cut (a draft, a final, a lane's render), labelled in film time,
# so a whole cut can be read at a glance and compared with the last version at the same seconds.
# Usage: npm run sheets -- <video.mp4> [frames_per_second=3]  ->  out/sheets/<name>/sheet_NN.jpg
set -euo pipefail
cd "$(dirname "$0")/.."
video=${1:?usage: npm run sheets -- <video.mp4> [frames_per_second=3]}; rate=${2:-3}
name=$(basename "${video%.*}")
scripts/py scripts/sheet.py video "$video" "out/sheets/$name" "$rate" 0
