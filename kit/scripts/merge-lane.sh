#!/usr/bin/env bash
# Merges a finished lane back into the film, but only if it touched nothing outside what it owns.
#
#   npm run merge-lane -- <name>        (run from the film root)
#
# Refuses when the lane's changes include any path not in its .lane-owned, or any node_modules or
# .tools entry. Then merges with a merge commit and runs npm run check, because lanes type-check on
# their own: a lane once dropped an export another lane imported, and only the merged film showed it.
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"
NAME="${1:?usage: merge-lane.sh <name>}"
LANE="$(dirname "$ROOT")/$(basename "$ROOT")-lanes/$NAME"
[ -f "$LANE/.lane-owned" ] || { echo "No lane at $LANE (or it has no .lane-owned)" >&2; exit 1; }
[ -z "$(git status --porcelain)" ] || { echo "Commit or stash the film's own changes first." >&2; exit 1; }
if [ -n "$(git -C "$LANE" status --porcelain --untracked-files=no)" ]; then
  echo "warning: the lane has uncommitted changes; only its commits are merged" >&2
fi

git fetch -q "$LANE" "$NAME:refs/lanes/$NAME" --force
changed="$(git diff --name-only HEAD...refs/lanes/$NAME)"
[ -n "$changed" ] || { echo "lane $NAME has no new commits"; exit 0; }
bad=0
while read -r f; do
  case "$f" in node_modules|node_modules/*|.tools|.tools/*) echo "refused: $f (never commit node_modules or .tools)" >&2; bad=1; continue ;; esac
  ok=0
  while read -r p; do
    [ -z "$p" ] && continue
    case "$f" in $p|$p/*) ok=1; break ;; esac
  done < "$LANE/.lane-owned"
  [ $ok = 1 ] || { echo "refused: $f is outside lane $NAME's owned paths" >&2; bad=1; }
done <<< "$changed"
[ $bad = 0 ] || { echo "Nothing merged. Fix the lane's history, or widen .lane-owned on purpose." >&2; exit 1; }

echo "merging lane $NAME:"; echo "$changed" | sed 's/^/  /'
git merge -q --no-ff "refs/lanes/$NAME" -m "Merge lane $NAME"
if ! npm run -s check; then
  echo "Merged, but npm run check fails: fix it now, or undo the merge with: git reset --hard ORIG_HEAD" >&2
  exit 1
fi
echo "lane $NAME merged and checked"
