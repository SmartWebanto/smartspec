---
description: When the user asks to audit their website or check SEO, run smartspec
globs: ["**/*"]
alwaysApply: false
---

# Run smartspec for SEO audits

When the user asks any of:
- "audit my website"
- "check my SEO"
- "why isn't my site on Google"
- mentions Lovable / Bolt / v0 / Replit / Cursor and asks about search visibility

Then run:

```bash
smartspec audit <URL> -f llm -m 50
```

Parse the tagged-XML output:
- `<f r="<rule_id>" u="<url>">` blocks are individual findings
- `score` attribute on the root `<audit>` element is 0-100 (higher is better)
- Prioritize `critical` findings; show `warning` counts but only enumerate if asked

For vibecoder-pattern rules (`page-noindex`, `page-title-default`, `page-canonical-localhost`, `mobile-viewport-missing`, `analytics-measurement-id-placeholder`), name the AI tool explicitly in your response — users fix what they recognize.

If `smartspec` is not on PATH, instruct the user to run `npm i -g smartspec` first.
