#!/usr/bin/env bash
# Renders one 3D shot of the character and installs it at public/3d/<shot>/ with its manifest entry.
#
#   npm run shot -- <still|spin|idle|hop|fly> [--tier preview|cpu-final|gpu] [--host <ssh host>]
#
# Without --host it renders here (default tier cpu-final). With --host it renders on a GPU box
# (default tier gpu) and falls back to a local cpu-final render if the box is asleep.
#
# What it prevents (each one happened on a real film):
#   - Sending work to a sleeping box: it checks the host answers first.
#   - Copying frames while they are still being written: it pulls only after the job exits.
#   - Two jobs writing one folder: every job renders into its own out/3d/<shot>-<host>-<time>/.
#   - Broken or missing PNGs reaching the film: every frame is opened and decoded before install.
#   - Half-installed shots: the finished folder replaces public/3d/<shot>/ in one rename.
#   - Stand-ins or CPU renders shipping unnoticed: the manifest records the quality tier.
#
# Windows GPU hosts: ssh lands in PowerShell. That is why every remote command here is a single
# command with no '&&', '&' or '%VAR%' ('&&' fails in Windows PowerShell 5; use ';'). To filter a log
# there use Select-String, not grep. To install portable Blender there:
#   curl.exe -sL <blender zip url> -o b.zip ; tar -xf b.zip
# then set REMOTE_BLENDER to its blender.exe path (forward slashes work).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ -f scripts/env.sh ] && source scripts/env.sh
if [ -z "${BLENDER:-}" ]; then
  for b in "$HOME/opt/blender.sh" "$ROOT/.tools/blender/blender.sh" "$(command -v blender || true)"; do
    [ -n "$b" ] && [ -x "$b" ] && BLENDER="$b" && break
  done
fi

SHOT="${1:?usage: render-shot.sh <still|spin|idle|hop|fly> [--tier preview|cpu-final|gpu] [--host <ssh host>]}"
shift
TIER="" HOST=""
while [ $# -gt 0 ]; do
  case "$1" in
    --tier) TIER="$2"; shift 2 ;;
    --host) HOST="$2"; shift 2 ;;
    *) echo "unknown option $1" >&2; exit 2 ;;
  esac
done

if [ -n "$HOST" ] && ! ssh -o BatchMode=yes -o ConnectTimeout=8 "$HOST" echo up 2>/dev/null | grep -q up; then
  echo "$HOST is not answering (asleep?). Rendering here at cpu-final instead; re-render on the GPU later." >&2
  HOST="" TIER="cpu-final"
fi
TIER="${TIER:-$([ -n "$HOST" ] && echo gpu || echo cpu-final)}"
case "$TIER" in preview|cpu-final|gpu) ;; *) echo "tier must be preview, cpu-final or gpu" >&2; exit 2 ;; esac

STAMP="$(date +%Y%m%d-%H%M%S)"
JOB="out/3d/$SHOT-${HOST:-local}-$STAMP"
SHA="$(git rev-parse --short HEAD 2>/dev/null || echo nogit)"
[ -n "$(git status --porcelain 3d 2>/dev/null)" ] && SHA="$SHA-dirty"
SOURCE="3d/character.py@$SHA"
mkdir -p out/3d

if [ -n "$HOST" ]; then
  RB="${REMOTE_BLENDER:-blender}"
  RJOB="lf-$SHOT-$STAMP"   # one folder per job in the remote home; plain mkdir works in bash and PowerShell
  echo "rendering $SHOT ($TIER) on $HOST in ~/$RJOB"
  ssh "$HOST" mkdir "$RJOB"
  scp -q 3d/character.py 3d/character.json "$HOST:$RJOB/"
  # Long jobs: generous timeout, and the pull happens only after Blender has exited.
  timeout 3000 ssh "$HOST" "$RB -b --python-exit-code 1 -P $RJOB/character.py -- $RJOB/frames $SHOT --$TIER --config $RJOB/character.json --source $SOURCE"
  scp -q -r "$HOST:$RJOB/frames" "$JOB"
else
  [ -n "${BLENDER:-}" ] || { echo "Blender not found. Run: npm run blender:install" >&2; exit 1; }
  echo "rendering $SHOT ($TIER) here into $JOB"
  "$BLENDER" -b -t "$(nproc)" --python-exit-code 1 -P 3d/character.py -- "$JOB" "$SHOT" "--$TIER" \
    --config 3d/character.json --source "$SOURCE" > "$JOB.log" 2>&1 || { tail -20 "$JOB.log"; exit 1; }
fi

# Check every frame decodes and the count matches, then swap the folder in and merge the manifest.
scripts/py - "$JOB" <<'PY'
import json, os, shutil, sys
from PIL import Image
job = sys.argv[1]
(shot, info), = json.load(open(os.path.join(job, "shot.json"))).items()
for n in range(1, info["frames"] + 1):
    f = os.path.join(job, f"{n:04d}.png")
    if not os.path.exists(f):
        sys.exit(f"missing frame {f}; nothing installed")
    Image.open(f).load()  # raises on a truncated or corrupt PNG
os.remove(os.path.join(job, "shot.json"))
dest = f"public/3d/{shot}"
os.makedirs("public/3d", exist_ok=True)
if os.path.isdir(dest):
    os.replace(dest, dest + ".old")
os.replace(job, dest)
shutil.rmtree(dest + ".old", ignore_errors=True)
path = "public/3d/manifest.json"
manifest = json.load(open(path)) if os.path.exists(path) else {}
manifest[shot] = info
json.dump(manifest, open(path + ".tmp", "w"), indent=1)
os.replace(path + ".tmp", path)
print(f"installed {dest}: {info['frames']} frames verified, quality {info['quality']}, "
      f"anchorY {info['anchorY']}, lastFrameFill {info['lastFrameFill']}")
PY
