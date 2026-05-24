#!/usr/bin/env bash
# Compare findings from Bun-compiled binary vs npm-bundled output.
# Fails if they differ.
set -euo pipefail
cd "$(dirname "$0")/../.."

URLS=(
  "https://example.com"
  "https://example.org"
)

# Build both
bash scripts/build.sh
bash scripts/build-npm.sh

PASS=true
for URL in "${URLS[@]}"; do
  echo "==> Parity check: ${URL}"
  ./dist/smartspec audit "${URL}" -m 3 -f json > /tmp/parity-bin.json
  node dist/npm/cli.mjs audit "${URL}" -m 3 -f json > /tmp/parity-npm.json

  # Compare the sorted set of (id, severity, refs) tuples.
  # We strip timestamps and finding ids (which are content-hashed) before diffing.
  jq -S '[.findings[] | {id, severity, refs}] | sort_by(.id)' /tmp/parity-bin.json > /tmp/parity-bin.sorted
  jq -S '[.findings[] | {id, severity, refs}] | sort_by(.id)' /tmp/parity-npm.json > /tmp/parity-npm.sorted

  if ! diff -u /tmp/parity-bin.sorted /tmp/parity-npm.sorted; then
    echo "FAIL: parity diverged for ${URL}"
    PASS=false
  else
    echo "OK: parity matches for ${URL}"
  fi
done

if [ "$PASS" = "true" ]; then
  echo "✓ all parity checks pass"
  exit 0
else
  echo "✗ parity failed"
  exit 1
fi
