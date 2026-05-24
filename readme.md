# smartspec

> The technical-SEO scanner that speaks fluent AI-built site.

`smartspec` audits AI-generated websites — Lovable, Bolt, v0, Replit, Cursor — and tells you exactly how to fix what's broken. Open source, MIT, ~60MB single-file binary.

```bash
npm i -g smartspec
smartspec audit https://my-app.lovable.app
```

## What it catches

Twelve+ rules tuned for the way AI builders generate sites today. The fix message names the tool when detectable, so you fix it in the right place.

| AI builder | Representative rules |
|---|---|
| **Lovable** | `page-noindex` (preview default), `page-canonical-localhost` |
| **v0 by Vercel** | `page-title-default` ("v0 by Vercel" boilerplate), `page-empty-source-html` (JS-only shell) |
| **Bolt** | `analytics-measurement-id-placeholder` (`G-XXXXXXXXXX`), `schema-missing-organization` |
| **Generic AI scaffolds** | `mobile-viewport-missing`, `content-thin`, `sitemap-phantom`, `content-boilerplate-hero` |

Plus the usual technical-SEO foundation: crawlability, redirects, hreflang, schema, Core Web Vitals signals, security headers, llms.txt, image tech.

## Install

### npm (recommended)

```bash
npm i -g smartspec
```

### One-line installer (no Node required)

```bash
curl -fsSL smartspec.dev/install | bash
```

Detects your OS/arch, downloads the matching binary, drops it in `~/.smartspec/bin/`.

### Build from source

```bash
git clone https://github.com/smartwebanto/smartspec
cd smartspec
bun install
bun run src/cli.ts audit https://example.com
```

Requires [Bun](https://bun.sh) 1.3+.

## Usage

```bash
smartspec audit <url>                              # console report
smartspec audit <url> -f json                      # machine-readable
smartspec audit <url> -f json | jq '.findings[] | select(.severity=="critical")'
smartspec doctor                                   # verify install
smartspec --version
```

Available output formats: `console`, `json`. Coming in v0.2: `html`, `markdown`, `text`, `llm`, `xml`.

## Use it from your AI agent

Already coding with Claude Code or Cursor? Install the `audit-website` skill once and ask your agent to audit any URL:

```bash
git clone https://github.com/smartwebanto/smartspec
cp -r smartspec/.claude/skills/audit-website ~/.claude/skills/
```

Then in Claude Code or Cursor: *"Audit my Lovable app at https://my-app.lovable.app"*. The agent runs smartspec and walks you through fixes, naming the tool that built the site.

## Project layout

```
src/
├── cli.ts              # CLI entry point
├── audit/              # rule engine + vibecoder rules
│   ├── modules/        # one file per audit module (schema, sitemap, mobile, ...)
│   ├── ai-tool-detect.ts
│   └── decorate-fixes.ts
├── crawl/              # fetch, parse, robots, rate-limit
└── score.ts            # severity-weighted scoring
scripts/
├── build.sh            # single-platform binary (current OS/arch)
├── build-all.sh        # 6-target cross-build
├── build-npm.sh        # tsup ESM bundle for npm
├── install.sh          # one-line installer (used by smartspec.dev/install)
└── INSTALL.md          # deployment guide for the install path
tests/                  # vitest suites — cli, audit, e2e, parity
.claude/skills/audit-website/   # Claude Code skill
.cursor/rules/audit-website.md  # Cursor variant
```

## Development

```bash
bun install                                    # install deps
bun run src/cli.ts audit https://example.com   # run from source
bun x vitest run                               # run all tests
bash scripts/build.sh                          # build local binary -> dist/smartspec
bash scripts/build-all.sh                      # build 6 binaries -> dist/bun-<target>/smartspec
bash scripts/build-npm.sh                      # build npm bundle -> dist/npm/cli.mjs
```

## License

MIT. See [LICENSE](LICENSE).

## Not affiliated

`smartspec` is not affiliated with Lovable, Bolt, v0 (Vercel), Replit, or Cursor. We just like what you build.
