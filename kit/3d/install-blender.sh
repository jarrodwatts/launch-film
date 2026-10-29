#!/usr/bin/env bash
# Installs a portable Blender into .tools/blender/ without root, and writes .tools/blender/blender.sh.
#
#   npm run blender:install [-- --force]
#
# Skips itself when Blender is already set up: $BLENDER is set, or ~/opt/blender.sh exists.
# Why it is more than "download and unpack": on a headless Linux box the official tarball fails with
# "libSM.so.6: cannot open shared object file". This script asks ldd what is missing, fetches those
# libraries with apt-get download (no root needed), unpacks them privately with dpkg-deb -x, and
# the wrapper points LD_LIBRARY_PATH at them. Nothing is installed system-wide.
# macOS: install Blender from blender.org and export BLENDER=/Applications/Blender.app/Contents/MacOS/Blender
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="${BLENDER_VERSION:-5.2.3}"
DIR="$ROOT/.tools/blender"

if [ "${1:-}" != "--force" ]; then
  if [ -n "${BLENDER:-}" ] && [ -x "$BLENDER" ]; then echo "Using BLENDER=$BLENDER"; exit 0; fi
  if [ -x "$HOME/opt/blender.sh" ]; then echo "Using ~/opt/blender.sh"; exit 0; fi
  if [ -x "$DIR/blender.sh" ]; then echo "Already installed: $DIR/blender.sh"; exit 0; fi
fi
[ "$(uname -s)" = Linux ] || { echo "Not Linux: install Blender yourself and set BLENDER (see the top of this script)." >&2; exit 1; }

mkdir -p "$DIR"
NAME="blender-$VERSION-linux-x64"
if [ ! -x "$DIR/$NAME/blender" ]; then
  URL="https://download.blender.org/release/Blender${VERSION%.*}/$NAME.tar.xz"
  echo "Downloading $URL (about 350 MB)"
  curl -fsSL --retry 3 "$URL" | tar -xJ -C "$DIR"
fi

LIBS="$DIR/libs"
missing() { LD_LIBRARY_PATH="$LIBS/root/usr/lib/x86_64-linux-gnu" ldd "$DIR/$NAME/blender" | awk '/not found/ {print $1}'; }
if [ -n "$(missing)" ]; then
  echo "Missing libraries: $(missing | tr '\n' ' ')"
  # The X and GL client libraries Blender links against, even when it never opens a window.
  PKGS="libsm6 libice6 libgl1 libglx0 libglvnd0 libglx-mesa0 libx11-6 libxext6 libxrender1 libxfixes3 libxi6
        libxxf86vm1 libxkbcommon0 libegl1 libwayland-client0 libxcb1 libxau6 libxdmcp6"
  mkdir -p "$LIBS/debs"
  (cd "$LIBS/debs" && for p in $PKGS; do apt-get download "$p" >/dev/null 2>&1 || echo "  (apt has no $p here)"; done)
  for d in "$LIBS"/debs/*.deb; do dpkg-deb -x "$d" "$LIBS/root"; done
fi
if [ -n "$(missing)" ]; then
  echo "Still missing: $(missing | tr '\n' ' ')" >&2
  echo "Find the package with 'apt-file search <lib>', then apt-get download it into $LIBS/debs and re-run." >&2
  exit 1
fi

cat > "$DIR/blender.sh" <<EOF
#!/bin/sh
# Portable Blender with the X/GL libraries it needs, unpacked privately (written by 3d/install-blender.sh).
export LD_LIBRARY_PATH="$LIBS/root/usr/lib/x86_64-linux-gnu\${LD_LIBRARY_PATH:+:\$LD_LIBRARY_PATH}"
exec "$DIR/$NAME/blender" "\$@"
EOF
chmod +x "$DIR/blender.sh"
"$DIR/blender.sh" --version | head -1
echo "Installed: $DIR/blender.sh"
