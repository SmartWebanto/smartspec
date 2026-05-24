---
name: audit-website
description: Run a technical SEO audit on a URL using smartspec. Use when the user asks "why isn't my site on Google", "audit my website", "is my Lovable/Bolt/v0/Replit site SEO-ready", "check my SEO", or similar. Specialized for AI-built sites.
---

# audit-website

Audits a URL with [smartspec](https://github.com/smartwebanto/smartspec) — a technical SEO scanner that recognizes the failure patterns typical of AI-built sites (Lovable, Bolt, v0, Replit, Cursor).

## When to use

Invoke this skill when the user:

- Asks why their AI-built site isn't on Google / isn't getting traffic
- Asks to "audit" / "scan" / "check the SEO of" a URL
- Mentions Lovable, Bolt, v0, Replit, Cursor, or similar AI site builders and wants an SEO review
- Shares a URL and asks if it's "search-engine ready"

Do NOT invoke this skill when the user is asking for keyword research, content strategy, or backlink analysis — smartspec only covers technical SEO.

## Prerequisites

`smartspec` must be on PATH. To install:

```bash
npm i -g smartspec
# OR
curl -fsSL https://smartspec.dev/install | bash
```

Check it works: `smartspec version`. If not installed, ask the user to install it first.

## How to invoke

Run the audit with the LLM-optimized output format, which is the compactest and easiest to parse:

```bash
smartspec audit <URL> -f llm -m 50
```

Flags:
- `-f llm` — LLM-friendly compact output (use this format, not `console` or `json`)
- `-m 50` — limit to 50 pages (good default for most sites; raise to 250 for large sites)
- `--no-fixes` — omit fix snippets (use only if the user explicitly says they don't want fixes)

## How to interpret the output

The output is a tagged document like:

```
<audit url="..." pages="N" score="0-100">
<critical n="K">
<f r="<rule_id>" u="<page_url>" sel="<optional css selector>">
<finding title text>
fix:<type>: <copy-paste-ready snippet>
</f>
...
</critical>
<warning n="K">...</warning>
<info n="K">...</info>
</audit>
```

The `score` is 0-100 (higher is better; <50 means major SEO problems). Prioritize `critical` findings first; ignore `info` unless the user asks for them.

## How to present findings to the user

For each `critical` finding:
1. Name the page (`u=`) and the rule (`r=`)
2. State the problem in one sentence (from the title text)
3. Show the fix snippet (the `fix:` line)
4. If you have access to the user's code (via tools like Read/Edit), offer to apply the fix directly. Otherwise, give copy-paste instructions.

For `warning` findings, summarize counts by category rather than enumerating each one, unless the user asks for the full list.

## Vibecoder-specific rules to flag prominently

When you see any of these rule IDs in the output, name the AI tool explicitly when presenting the fix (the user is more likely to fix what they recognize):

- `page-noindex` — common Lovable preview default
- `page-title-default` — v0 / Vite scaffold residual
- `page-canonical-localhost` — preview-environment leftover
- `mobile-viewport-missing` — Vite / CRA default missing viewport
- `analytics-measurement-id-placeholder` — Bolt / generic AI scaffold

## When NOT to apply fixes automatically

Even if you have Edit tool access, ask before applying:
- `schema-missing-organization` / `schema-missing-website` — the snippet contains placeholders the user must fill in (real name, URL, logo)
- `page-canonical-localhost` — the correct production URL is something only the user knows

## Examples

**User:** "Why isn't my Lovable app showing up on Google?"

You: invoke `smartspec audit <url> -f llm -m 50`, parse the output, and respond:

> I ran smartspec on your site. **Score: 32/100** — the main blockers:
>
> 1. **Your site is set to `noindex`** (`page-noindex` on `/`). This is Lovable's preview default. Fix: in your Lovable project settings, turn off "Index protection" — or in your code, delete `<meta name="robots" content="noindex">` from your layout.
> 2. **Canonical points at the Lovable preview URL** (`page-canonical-localhost`). Change `<link rel="canonical">` to your production domain.
> 3. **No Organization JSON-LD** on the homepage (`schema-missing-organization`). Add this snippet to your `<head>` to help Google understand your brand: [snippet from output]
>
> Want me to apply these fixes to your code?
