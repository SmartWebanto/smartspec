# audit-website

Run a technical SEO audit on any URL via the [smartspec](https://github.com/smartwebanto/smartspec) CLI. Specialized for AI-built sites — recognizes Lovable, Bolt, v0, Replit, and Cursor failure patterns.

## What it does

When you ask "is my site SEO-ready?", this skill runs `smartspec audit <url>` and presents the findings prioritized by severity, with copy-paste-ready fix snippets.

## Install

In Claude Code, this skill is auto-discovered from `.claude/skills/audit-website/`. You also need the `smartspec` CLI on PATH:

```bash
npm i -g smartspec
```

Or via the install script:

```bash
curl -fsSL https://smartspec.dev/install | bash
```

## Usage

Ask the agent any of:

- "Audit my website at https://example.com"
- "Why isn't my Lovable app on Google?"
- "Is https://abc.bolt.host search-engine ready?"
- "Scan my SEO at <url>"

The agent will run smartspec, parse the output, and walk you through the findings.

## Requirements

- smartspec ≥ 0.1.0 on PATH
- Node 20+ (if installed via npm) or any platform Bun supports (if installed via curl script)

## License

MIT
