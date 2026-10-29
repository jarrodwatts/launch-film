#!/usr/bin/env bash
# Run before any render and after every merge. Fails on: a type error (a misspelled beat, a scene
# missing from the registry, an export another scene imports gone), a song splice that can't be
# seamless (the message says how many beats to add or cut), a cue whose sound isn't in
# public/sfx/stats.json, and things that break renders: @remotion/motion-blur (bands every
# gradient), Math.random (frames must render the same every time). Then prints the clearance.
# Usage: npm run check
set -euo pipefail
cd "$(dirname "$0")/.."
npx tsc --noEmit -p .
npx tsx scripts/cues.ts
if grep -rnE "from [\"']@remotion/motion-blur|<CameraMotionBlur|Math\.random\(" src; then
  echo "check: remove the lines above. Blur comes from npm run final's shutter passes; randomness must be seeded by the frame." >&2
  exit 1
fi
npx tsx scripts/clearance.ts
echo "check: OK"
