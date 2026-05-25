#!/usr/bin/env bash
# Build smartspec binaries for all 6 supported OS/arch targets.
# Outputs to dist/<target>/smartspec
set -euo pipefail

cd "$(dirname "$0")/.."

VERSION="$(git describe --tags --always --dirty 2>/dev/null || echo "0.0.0-dev")"
COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")"

TARGETS=(
  "bun-darwin-x64"
  "bun-darwin-arm64"
  "bun-linux-x64"
  "bun-linux-x64-musl"
  "bun-linux-arm64"
  "bun-linux-arm64-musl"
)

# set -e: any target failure aborts the whole run. Phase 7 CI will partition
# targets into separate matrix jobs so one platform failure doesn't block others.
for target in "${TARGETS[@]}"; do
  outdir="dist/${target}"
  mkdir -p "${outdir}"
  echo "Building ${target}..."
  bun build packages/core/src/cli.ts \
    --compile \
    --minify \
    --target="${target}" \
    --define "process.env.SMARTSPEC_VERSION='${VERSION}'" \
    --define "process.env.SMARTSPEC_COMMIT='${COMMIT}'" \
    --outfile "${outdir}/smartspec"
  chmod +x "${outdir}/smartspec"
  size=$(ls -lh "${outdir}/smartspec" | awk '{print $5}')
  echo "  ✓ ${outdir}/smartspec (${size})"
done

echo ""
echo "All targets built. Output tree:"
find dist -name smartspec -exec ls -lh {} \;
