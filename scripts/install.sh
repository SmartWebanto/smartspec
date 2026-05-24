#!/usr/bin/env bash
# smartspec installer — detects platform, downloads the matching binary,
# installs to ~/.smartspec/bin/smartspec, prints PATH instructions.
#
# Usage:
#   curl -fsSL smartspec.dev/install | bash
#   curl -fsSL smartspec.dev/install | bash -s -- --version v0.1.0
set -euo pipefail

REPO="${SMARTSPEC_REPO:-smartwebanto/smartspec}"
VERSION="${SMARTSPEC_VERSION:-latest}"
INSTALL_DIR="${SMARTSPEC_INSTALL:-$HOME/.smartspec}"
BIN_DIR="${INSTALL_DIR}/bin"

while [ $# -gt 0 ]; do
  case "$1" in
    --version) VERSION="$2"; shift 2 ;;
    --version=*) VERSION="${1#*=}"; shift ;;
    *) echo "unknown option: $1" >&2; exit 1 ;;
  esac
done

red()   { printf "\033[31m%s\033[0m\n" "$*"; }
green() { printf "\033[32m%s\033[0m\n" "$*"; }
bold()  { printf "\033[1m%s\033[0m\n" "$*"; }

need() { command -v "$1" >/dev/null 2>&1 || { red "missing required command: $1"; exit 1; }; }
need curl
need uname
need mkdir
need chmod

os="$(uname -s | tr '[:upper:]' '[:lower:]')"
arch="$(uname -m)"

case "$os" in
  darwin) ;;
  linux)  ;;
  *) red "unsupported OS: $os (smartspec supports darwin, linux)"; exit 1 ;;
esac

case "$arch" in
  x86_64|amd64) arch="x64" ;;
  arm64|aarch64) arch="arm64" ;;
  *) red "unsupported arch: $arch (smartspec supports x64, arm64)"; exit 1 ;;
esac

libc=""
if [ "$os" = "linux" ]; then
  if ldd /bin/ls 2>&1 | grep -q musl; then
    libc="-musl"
  fi
fi

asset="smartspec-${os}-${arch}${libc}"

if [ "$VERSION" = "latest" ]; then
  url="https://github.com/${REPO}/releases/latest/download/${asset}"
else
  url="https://github.com/${REPO}/releases/download/${VERSION}/${asset}"
fi

bold "installing smartspec (${asset}) from ${url}"

mkdir -p "$BIN_DIR"
tmp="$(mktemp -t smartspec.XXXXXX)"
trap 'rm -f "$tmp"' EXIT

if ! curl -fsSL "$url" -o "$tmp"; then
  red "download failed: $url"
  red "check that release ${VERSION} exists at https://github.com/${REPO}/releases"
  exit 1
fi

chmod +x "$tmp"
mv "$tmp" "${BIN_DIR}/smartspec"
trap - EXIT

green "installed: ${BIN_DIR}/smartspec"

case ":${PATH}:" in
  *":${BIN_DIR}:"*)
    bold "smartspec is on your PATH. run: smartspec --help"
    ;;
  *)
    shell_rc=""
    case "${SHELL:-}" in
      */zsh)  shell_rc="${HOME}/.zshrc" ;;
      */bash) shell_rc="${HOME}/.bashrc" ;;
      */fish) shell_rc="${HOME}/.config/fish/config.fish" ;;
    esac
    echo
    bold "add smartspec to your PATH:"
    if [ "${shell_rc##*/}" = "config.fish" ]; then
      echo "  fish_add_path ${BIN_DIR}"
    elif [ -n "$shell_rc" ]; then
      echo "  echo 'export PATH=\"${BIN_DIR}:\$PATH\"' >> ${shell_rc}"
      echo "  source ${shell_rc}"
    else
      echo "  export PATH=\"${BIN_DIR}:\$PATH\""
    fi
    echo
    bold "then run: smartspec --help"
    ;;
esac
