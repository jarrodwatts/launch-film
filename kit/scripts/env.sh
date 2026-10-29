# Finds the project's tools. Source it: `. scripts/env.sh`. Everything lives inside the project
# (.tools/, gitignored), never in /tmp, so a reboot or a deleted worktree can't break a render.
#   PY       the project's Python venv, run isolated (-I) so stray PYTHON* settings and files in
#            the current folder can't change what it imports
#   FFMPEG   an ffmpeg with the `mix` (shutter averaging) and `ebur128` (loudness) filters.
#            Remotion's bundled ffmpeg has neither.
#   BLENDER  $BLENDER, ~/opt/blender.sh, or .tools/blender/blender.sh (optional: only for 3D shots)
ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
PY="$ROOT/.tools/venv/bin/python"

has_filters() { "$1" -hide_banner -filters 2>/dev/null | grep -qE '^ ... mix ' && "$1" -hide_banner -filters 2>/dev/null | grep -qE '^ ... ebur128 '; }
if command -v ffmpeg >/dev/null && has_filters "$(command -v ffmpeg)"; then
  FFMPEG=$(command -v ffmpeg); FFPROBE=$(command -v ffprobe || echo "$ROOT/.tools/ffmpeg/ffprobe")
else
  FFMPEG="$ROOT/.tools/ffmpeg/ffmpeg"; FFPROBE="$ROOT/.tools/ffmpeg/ffprobe"
fi

if [ -n "${BLENDER:-}" ]; then :
elif [ -x "$HOME/opt/blender.sh" ]; then BLENDER="$HOME/opt/blender.sh"
elif [ -x "$ROOT/.tools/blender/blender.sh" ]; then BLENDER="$ROOT/.tools/blender/blender.sh"
else BLENDER=""
fi

export ROOT PY FFMPEG FFPROBE BLENDER
