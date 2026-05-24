#!/usr/bin/env bash
# Build the smartspec binary for the host platform.
# Usage: bash scripts/build.sh [output-name]
set -euo pipefail

cd "$(dirname "$0")/.."

OUTNAME="${1:-smartspec}"
VERSION="$(git describe --tags --always --dirty 2>/dev/null || echo "0.0.0-dev")"
COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")"

mkdir -p dist

echo "Building dist/${OUTNAME} (version=${VERSION}, commit=${COMMIT})..."

bun build src/cli.ts \
  --compile \
  --minify \
  --sourcemap \
  --define "process.env.SMARTSPEC_VERSION='${VERSION}'" \
  --define "process.env.SMARTSPEC_COMMIT='${COMMIT}'" \
  --outfile "dist/${OUTNAME}"

chmod +x "dist/${OUTNAME}"
echo "✓ dist/${OUTNAME}"
ls -lh "dist/${OUTNAME}"
