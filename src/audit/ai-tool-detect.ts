// Cursor is an IDE, not a hosting platform — sites built with Cursor deploy
// to Vercel/Netlify/etc., so we don't detect "cursor" from a fetched page.
// It stays in the union because downstream code (decorate-fixes.ts, skill)
// references it as a target tool category.
export type AiTool = "lovable" | "bolt" | "v0" | "replit" | "cursor";

const URL_PATTERNS: Array<[RegExp, AiTool]> = [
  [/\.lovable\.app(?::\d+)?(\/|$)/i, "lovable"],
  [/lovable-preview-[a-z0-9-]+\./i, "lovable"],
  [/\.bolt\.host(?::\d+)?(\/|$)/i, "bolt"],
  [/\bbolt\.new(?::\d+)?(\/|$)/i, "bolt"],
  [/\.bolt\.new(?::\d+)?(\/|$)/i, "bolt"],
  [/\.replit\.(app|dev|co)(?::\d+)?(\/|$)/i, "replit"],
];

const HTML_PATTERNS: Array<[RegExp, AiTool]> = [
  [/<title>\s*v0 by Vercel\s*<\/title>/i, "v0"],
  [/<meta\s+name=["']generator["']\s+content=["']Bolt["']/i, "bolt"],
  [/<meta\s+name=["']generator["']\s+content=["']Lovable["']/i, "lovable"],
];

export function detectAiTool(url: string, html: string): AiTool | null {
  // 1. Page URL match
  for (const [pattern, tool] of URL_PATTERNS) {
    if (pattern.test(url)) return tool;
  }
  // 2. HTML signal match (title, generator meta, etc.)
  for (const [pattern, tool] of HTML_PATTERNS) {
    if (pattern.test(html)) return tool;
  }
  // 3. URL patterns embedded inside HTML — canonical, og:url, or any href.
  //    Catches the common case: page served from localhost during dev, canonical
  //    pointing at the AI-tool preview domain.
  for (const [pattern, tool] of URL_PATTERNS) {
    if (pattern.test(html)) return tool;
  }
  return null;
}
