# Wiring `curl -fsSL smartspec.dev/install | bash`

Three pieces need to exist together for the one-liner on the landing to work.

## 1. The installer script (this folder)

`scripts/install.sh` detects the user's platform and downloads the matching binary from GitHub Releases. It supports six targets:

| OS      | Arch  | libc  | Asset filename                  |
|---------|-------|-------|---------------------------------|
| darwin  | arm64 | —     | `smartspec-darwin-arm64`        |
| darwin  | x64   | —     | `smartspec-darwin-x64`          |
| linux   | arm64 | glibc | `smartspec-linux-arm64`         |
| linux   | arm64 | musl  | `smartspec-linux-arm64-musl`    |
| linux   | x64   | glibc | `smartspec-linux-x64`           |
| linux   | x64   | musl  | `smartspec-linux-x64-musl`      |

Override knobs (env vars):
- `SMARTSPEC_REPO=org/repo` — default `smartwebanto/smartspec`
- `SMARTSPEC_VERSION=v0.1.0` — default `latest`
- `SMARTSPEC_INSTALL=/path` — default `$HOME/.smartspec`

## 2. GitHub Releases with renamed binaries

`scripts/build-all.sh` produces six binaries under `dist/bun-<target>/smartspec`. Before uploading to a Release, rename them to the asset names in the table above:

```bash
bash scripts/build-all.sh
mkdir -p dist/release
cp dist/bun-darwin-arm64/smartspec       dist/release/smartspec-darwin-arm64
cp dist/bun-darwin-x64/smartspec         dist/release/smartspec-darwin-x64
cp dist/bun-linux-arm64/smartspec        dist/release/smartspec-linux-arm64
cp dist/bun-linux-arm64-musl/smartspec   dist/release/smartspec-linux-arm64-musl
cp dist/bun-linux-x64/smartspec          dist/release/smartspec-linux-x64
cp dist/bun-linux-x64-musl/smartspec     dist/release/smartspec-linux-x64-musl

gh release create v0.1.0 dist/release/* \
  --title "smartspec v0.1.0" \
  --notes "First public release."
```

(Requires `gh auth login` and the repo pushed to `github.com/<org>/smartspec`.)

## 3. The `smartspec.dev/install` URL

The landing page calls `curl -fsSL smartspec.dev/install | bash`. That URL must serve the contents of `scripts/install.sh` as `text/plain`. Three viable options, simplest first:

### Option A: Cloudflare Pages redirect (free, easiest)

1. Buy `smartspec.dev` (~$12/yr on Cloudflare Registrar — same vendor avoids a separate DNS step).
2. Create a Cloudflare Pages site for the repo (or any static site).
3. Add a `_redirects` file:
   ```
   /install   https://raw.githubusercontent.com/smartwebanto/smartspec/main/scripts/install.sh   200
   ```
   Status `200` (not `301`) so `curl` follows it transparently and gets the script body, not a redirect.

### Option B: Cloudflare Worker (5 lines, also free)

```js
export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/install") {
      return fetch("https://raw.githubusercontent.com/smartwebanto/smartspec/main/scripts/install.sh");
    }
    return fetch(request);  // pass through to Pages for other routes
  }
};
```

### Option C: Netlify redirect

`netlify.toml`:
```toml
[[redirects]]
  from = "/install"
  to = "https://raw.githubusercontent.com/smartwebanto/smartspec/main/scripts/install.sh"
  status = 200
  force = true
```

## Verification

Once all three are live:

```bash
curl -fsSL smartspec.dev/install | head -1          # should print "#!/usr/bin/env bash"
curl -fsSL smartspec.dev/install | bash              # full install
~/.smartspec/bin/smartspec --version                 # confirms binary works
```

## Test the installer locally before deploying

You can dry-run against a fake repo / a local file:

```bash
SMARTSPEC_REPO=smartwebanto/smartspec bash scripts/install.sh --version v0.1.0
```

Or test the script file end-to-end with `cat`:

```bash
cat scripts/install.sh | bash
```
