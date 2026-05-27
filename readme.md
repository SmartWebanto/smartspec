# technical-seo

Standalone technical SEO tool workspace. It can be used through its CLI or as a
Claude operator workspace.

## What this is

A self-contained operator workspace that performs only:

- Crawlability, indexability, redirects, hreflang
- Site structure and internal linking
- Schema markup validation
- Core Web Vitals and PageSpeed
- Security headers, mobile-first, image tech
- `llms.txt` and AI-crawler readiness
- Single-page and full-site technical audits

## What you get

The workspace ships one granular `/smartspec:*` slash command for every audit
module smartspec supports — 21 commands total.

**Composite & system**
`/smartspec:status`, `/smartspec:audit`, `/smartspec:page`, `/smartspec:health`, `/smartspec:daily`,
`/smartspec:weekly`

**Per-category (one per smartspec audit module)**
`/smartspec:a11y`, `/smartspec:analytics`, `/smartspec:content-quality`, `/smartspec:hreflang`,
`/smartspec:images`, `/smartspec:links`, `/smartspec:llms-txt`, `/smartspec:mobile`,
`/smartspec:performance`, `/smartspec:redirects`, `/smartspec:robots`, `/smartspec:schema`,
`/smartspec:security`, `/smartspec:sitemap`, `/smartspec:social`

Each granular skill:

1. Calls `smartspec audit <url> --categories=<name> --format=json` as the
   primary detection engine.
2. Enriches with a matching Python helper in
   `.claude/skills/tech/_scripts/`.
3. Writes `findings/tech-<name>-YYYY-MM-DD.json` + a Markdown report.

See `AGENTS.md` §Slash commands and
`.claude/skills/tech/_resources/references/skill-map.md` for the full
inventory.

## Quick start

```bash
cd /Users/antonio/Desktop/smartweb_media/technical-seo
cp .env.example .env             # then fill in real vault refs
npm install                      # nothing to install — present for cross-tool parity
npm run doctor                   # verify wiring
npm run seo -- status            # compact tool status
npm run web                      # open the frontend app
```

Frontend app:

```text
http://localhost:3000
```

Create a client and run checks:

```bash
npm run seo -- init acme --name "Acme" --domain acme.example --language it --country IT
npm run seo -- crawl acme --max-pages 25
npm run seo -- health acme
```

Available CLI commands:

```bash
npm run seo -- doctor
npm run seo -- status
npm run seo -- init <slug> --name <name> --domain <domain>
npm run seo -- crawl <client>
npm run seo -- health <client>
npm run seo -- audit <client>
npm run seo -- page <client> --url https://example.com/page
npm run seo -- schema <client>
npm run seo -- links <client>
npm run seo -- images <client>
npm run seo -- security <client>
npm run seo -- performance <client>
npm run seo -- llms <client>
```

The frontend exposes the same audit modules and writes machine-readable
findings to `findings/`, Markdown reports to `reports/`, and snapshots to
`history/`.

To use the Claude workspace directly:

```
./.claude/bin/claude-wrap
/smartspec:status              # overview
/smartspec:audit <client>      # full-site audit
/smartspec:page <client> <url> # single-page deep audit
```

## Layout

See `CLAUDE.md` §Project structure.

## Boundaries

This workspace performs only the technical-SEO checks listed above. Anything
outside that list belongs in a different workspace (e.g. `studio/`).

## Tests

```bash
npm test                   # leakage gate + pytest
npm run test:leakage       # only the grep gate
npm run test:scaffold      # only the structure tests
npm run test:scripts       # only the script-import smoke tests
```

## CLI (in development, Phase 1)

A standalone single-binary CLI is being built under `src/` as a pivot toward a public product.
See [[2026-05-23-squirrelscan-style-cli-pivot-design]] for the design and
[[2026-05-23-cli-pivot-phase1-foundation]] for the Phase 1 implementation plan.

Binary name: `smartspec`.

Build locally:

```bash
bash scripts/build.sh         # host target → dist/smartspec
bash scripts/build-all.sh     # all 6 supported OS targets
bash tests/smoke.sh           # exercise all commands
```

Try it (after `build.sh`):

```bash
./dist/smartspec audit https://example.com -f json -m 1 -q
./dist/smartspec doctor
./dist/smartspec version
```

The CLI currently reuses the existing audit engine in `src/audit/` (copied from
`web/lib/audit/` in Phase 1; will be refactored to the new `AuditModule` interface
in Phase 3). The web app under `web/` remains independently functional.

## Use with AI agents

smartspec ships an `audit-website` skill for AI coding assistants. They invoke `smartspec audit <url>` and walk users through fixes for them.

**Claude Code:** the skill is auto-discovered from `.claude/skills/audit-website/SKILL.md`. No setup needed.

**Cursor:** copy `.cursor/rules/audit-website.md` from this repo into your project's `.cursor/rules/` directory.

**Other agents:** point the agent at `smartspec audit <url> -f llm` and it will parse the LLM-optimized output natively.

Designed for vibecoders — users of Lovable, Bolt, v0, Replit, Cursor — whose sites typically fail Google indexing for predictable reasons (noindex residuals from preview envs, missing viewport tags, placeholder analytics IDs, default titles like "v0 by Vercel"). smartspec recognizes those patterns and names the tool in the fix message.
