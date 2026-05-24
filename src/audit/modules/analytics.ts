import { finding } from "../finding";
import type { ParsedHtml } from "../../crawl/parse-html";
import type { Finding } from "../../legacy-types";

export type AnalyticsCtx = { url: string; parsed: ParsedHtml };

const PLACEHOLDER_PATTERNS: RegExp[] = [
  /G-X{4,}\b/i, // G-XXXX, G-XXXXXXXXXX, etc.
  /GTM-X{2,}\b/i, // GTM-XXXX
  /UA-XXXXXXXX/i, // legacy UA
  /G-PLACEHOLDER/i,
  /YOUR[_-]?GA[_-]?ID/i,
];

export async function analyticsModule(ctx: AnalyticsCtx): Promise<Finding[]> {
  const out: Finding[] = [];
  const html = ctx.parsed.raw;
  const match = PLACEHOLDER_PATTERNS.find((re) => re.test(html));
  if (match) {
    const sample = html.match(match)?.[0] ?? "";
    out.push(
      finding(
        "analytics-measurement-id-placeholder",
        "analytics",
        "warning",
        "Analytics scaffold contains a placeholder measurement ID",
        `Found "${sample}" in page source — analytics is not actually configured.`,
        "Replace the placeholder with your real GA4 measurement ID (format: G-XXXXXXXXXX with real characters) or remove the analytics scaffold entirely until you're ready to track.",
        ctx.url,
        {
          docKey: "analytics",
          impact:
            "Analytics is silently broken — no data is collected. AI tools often scaffold gtag with a placeholder and developers forget to replace it.",
          businessImpact: "ranking",
          framework: "SEO",
        },
      ),
    );
  }
  return out;
}
