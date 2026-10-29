#!/usr/bin/env bash
# Makes a lane: a separate git clone of the film where one agent reworks one area without breaking anyone else.
#
#   npm run lane -- <name> <owned path>...      e.g. npm run lane -- hook src/scenes/hook.tsx src/beats/hook.json
#
# Creates ../<film>-lanes/<name> on branch <name>. Why a clone and not a shared folder: Remotion
# bundles the whole film, so one agent's half-written file breaks every other agent's renders.
# In the lane:
#   - node_modules and .tools are symlinks to the film's (saves ~1 GB per lane);
#   - every ignored file under public/ (songs, SFX, mix.wav, 3D frames) is copied, so renders and
#     the mix work at once (a lane without mix.wav once failed every render with a 404);
#   - .lane-owned lists the owned paths, and a pre-commit hook refuses to commit anything else.
#     (A lane once committed its node_modules symlink, and merging it deleted the real folder.)
# Owned paths are files, folders or globs. Shared files owned per named export can't be checked by
# a script: list those exports in the lane's brief.
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"
NAME="${1:?usage: lane.sh <name> <owned path>...}"
shift
[ $# -gt 0 ] || { echo "List the paths this lane owns." >&2; exit 2; }
if [ -n "$(git status --porcelain)" ]; then
  echo "The film has uncommitted changes; a lane clones only commits. Commit first:" >&2
  git status --short >&2
  exit 1
fi
LANES="$(dirname "$ROOT")/$(basename "$ROOT")-lanes"
LANE="$LANES/$NAME"
[ -e "$LANE" ] && { echo "$LANE already exists" >&2; exit 1; }
mkdir -p "$LANES"
git clone -q "$ROOT" "$LANE"
git -C "$LANE" checkout -qb "$NAME"
for d in node_modules .tools; do [ -e "$d" ] && ln -s "$ROOT/$d" "$LANE/$d"; done
git ls-files --others --ignored --exclude-standard public | while read -r f; do
  mkdir -p "$LANE/$(dirname "$f")" && cp -p "$f" "$LANE/$f"
done
printf '%s\n' "$@" > "$LANE/.lane-owned"

cat > "$LANE/.git/hooks/pre-commit" <<'HOOK'
#!/usr/bin/env bash
# Refuses commits that touch files this lane doesn't own (see .lane-owned).
bad=0
while read -r f; do
  ok=0
  while read -r p; do
    [ -z "$p" ] && continue
    case "$f" in $p|$p/*) ok=1; break ;; esac
  done < .lane-owned
  [ $ok = 1 ] || { echo "not owned by this lane: $f" >&2; bad=1; }
done < <(git diff --cached --name-only)
[ $bad = 0 ] || { echo "Unstage those files (git restore --staged <file>). Commit with git add <file>, never git add -A." >&2; exit 1; }
HOOK
chmod +x "$LANE/.git/hooks/pre-commit"

echo "lane $NAME: $LANE (branch $NAME)"
echo "owns: $*"
echo "Smoke-test it before starting an agent: (cd $LANE && npm run scene -- <scene>)"
echo "Merge it back from the film root: npm run merge-lane -- $NAME"
