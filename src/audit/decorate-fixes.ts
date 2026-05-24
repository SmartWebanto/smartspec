import type { Finding } from "../legacy-types";
import { detectAiTool, type AiTool } from "./ai-tool-detect";

// Rule IDs that benefit from AI-tool-specific fix prefixes
const VIBECODER_RULES = new Set([
  "page-noindex",
  "page-title-default",
  "page-canonical-localhost",
  "page-empty-source-html",
  "mobile-viewport-missing",
  "analytics-measurement-id-placeholder",
  "sitemap-phantom",
  "sitemap-empty",
  "schema-missing-organization",
  "schema-missing-website",
  "content-boilerplate-hero",
  "content-thin",
]);

const TOOL_TIPS: Record<AiTool, Partial<Record<string, string>>> = {
  lovable: {
    "page-noindex":
      'In Lovable: open project settings → SEO → turn off "Index protection". Or in code, delete the noindex <meta>.',
    "page-canonical-localhost":
      "In Lovable, the preview URL gets injected as canonical during dev. Set the production domain in Project Settings → Custom Domain before publishing.",
    "page-title-default":
      "In Lovable, edit src/app/layout.tsx (or index.html) and replace the default <title> with your real one.",
  },
  v0: {
    "page-title-default":
      "v0's default title is 'v0 by Vercel'. Edit app/layout.tsx and change the metadata.title export.",
    "page-canonical-localhost":
      "v0 ships with localhost canonical during preview. Set NEXT_PUBLIC_SITE_URL and use it in app/layout.tsx metadata.metadataBase.",
    "page-empty-source-html":
      "v0 sites use Next.js client components by default. Move static content into a Server Component or use generateStaticParams.",
  },
  bolt: {
    "page-title-default":
      "Bolt-generated <title> is often a placeholder. Edit index.html or your framework's head/layout file.",
    "analytics-measurement-id-placeholder":
      "Bolt scaffolds gtag with G-XXXXXXXXXX. Replace with your real GA4 ID from analytics.google.com.",
    "schema-missing-organization":
      "Bolt does not add JSON-LD by default. Paste the Organization snippet into index.html <head>.",
  },
  replit: {
    "page-canonical-localhost":
      "Replit's preview URL is .replit.dev / .replit.app. Set the production domain in your deployment config before going live.",
    "page-noindex":
      "Replit deployments sometimes default to noindex. Check your deployment.toml or framework config.",
  },
  cursor: {},
};

export function decorateFindingsWithAiTool(
  findings: Finding[],
  url: string,
  html: string,
): Finding[] {
  const tool = detectAiTool(url, html);
  if (!tool) return findings;
  return findings.map((f) => {
    if (!VIBECODER_RULES.has(f.id)) return f;
    const tip = TOOL_TIPS[tool]?.[f.id];
    if (!tip) return f;
    return { ...f, recommendation: `${tip}\n\n(Generic fix: ${f.recommendation})` };
  });
}
