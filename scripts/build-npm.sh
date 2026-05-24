#!/usr/bin/env bash
# Build the smartspec npm bundle via tsup.
# Usage: bash scripts/build-npm.sh
set -euo pipefail

cd "$(dirname "$0")/.."

VERSION="$(git describe --tags --always --dirty 2>/dev/null || echo "0.1.0-dev")"
COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")"

echo "Building dist/npm/ (version=${VERSION}, commit=${COMMIT})..."

SMARTSPEC_VERSION="${VERSION}" SMARTSPEC_COMMIT="${COMMIT}" bun x tsup

chmod +x dist/npm/cli.cjs dist/npm/cli.js 2>/dev/null || true

echo "✓ dist/npm/ built"
ls -lh dist/npm/
