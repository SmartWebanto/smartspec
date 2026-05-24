#!/usr/bin/env bash
# Smoke test: build binary, exercise all 4 commands, assert exit codes and output shape.
set -euo pipefail

cd "$(dirname "$0")/.."

BIN="./dist/smartspec"

# Ensure binary exists; build if not
if [[ ! -x "${BIN}" ]]; then
  echo "Binary not found, building..."
  bash scripts/build.sh
fi

fail() { echo "✗ FAIL: $1"; exit 1; }
ok()   { echo "✓ $1"; }

# 1. version
out=$("${BIN}" version)
[[ "${out}" == smartspec* ]] || fail "version: bad output: ${out}"
ok "version prints expected prefix"

# 2. help
out=$("${BIN}" help)
[[ "${out}" == *"usage: smartspec"* ]] || fail "help: missing usage block"
ok "help shows usage"

# 3. doctor
out=$("${BIN}" doctor)
[[ "${out}" == *"network:"* && "${out}" == *"python:"* && "${out}" == *"plugins:"* ]] || fail "doctor: missing sections"
ok "doctor prints 3 sections"

# 4. audit (real network call to example.com)
out=$("${BIN}" audit https://example.com -f json -m 1 -q)
echo "${out}" | bun -e "JSON.parse(require('fs').readFileSync(0, 'utf8'))" > /dev/null || fail "audit: output is not valid JSON"
echo "${out}" | grep -q '"findings"' || fail "audit: JSON missing findings field"
ok "audit returns valid JSON with findings field"

# 5. unknown command
"${BIN}" wat > /tmp/smartspec-wat.out 2>&1 || true
grep -q "usage:" /tmp/smartspec-wat.out || fail "unknown command should print usage"
ok "unknown command falls back to help"

echo ""
echo "All smoke tests passed."
