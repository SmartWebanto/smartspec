import { XMLParser } from "fast-xml-parser";
import { finding } from "../finding";
import type { ParsedHtml } from "../../crawl/parse-html";
import type { Finding } from "../../legacy-types";

export type SitemapCtx = { url: string; parsed: ParsedHtml; sitemapXml: string | null };

const PHANTOM_PATTERNS = /(localhost|127\.0\.0\.1|your-page-here|<your-|\/example\/)/i;

function asArray<T>(v: T | T[] | undefined): T[] {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

function extractLocs(parsed: unknown): string[] {
  const root = parsed as { urlset?: unknown; sitemapindex?: unknown };
  if (root && typeof root.urlset === "object" && root.urlset !== null) {
    const urls = asArray<{ loc?: string }>((root.urlset as { url?: unknown }).url as never);
    return urls.map((u) => (typeof u?.loc === "string" ? u.loc.trim() : "")).filter(Boolean);
  }
  if (root && typeof root.sitemapindex === "object" && root.sitemapindex !== null) {
    const sitemaps = asArray<{ loc?: string }>(
      (root.sitemapindex as { sitemap?: unknown }).sitemap as never,
    );
    return sitemaps.map((u) => (typeof u?.loc === "string" ? u.loc.trim() : "")).filter(Boolean);
  }
  return [];
}

export async function sitemapModule(ctx: SitemapCtx): Promise<Finding[]> {
  const out: Finding[] = [];
  const origin = new URL(ctx.url).origin;
  const sitemapUrl = `${origin}/sitemap.xml`;

  if (ctx.sitemapXml === null) {
    out.push(
      finding(
        "sitemap-missing",
        "sitemap",
        "warning",
        "No sitemap.xml at /sitemap.xml",
        "Sitemap file is missing or returned non-200.",
        "Generate a sitemap.xml and reference it from robots.txt. Most static-site generators have a sitemap plugin.",
        sitemapUrl,
        {
          docKey: "sitemap",
          impact:
            "Sitemap is the most efficient way to tell Google about all your URLs, especially new content.",
          businessImpact: "crawl",
          framework: "SEO",
        },
      ),
    );
    return out;
  }

  let locs: string[] = [];
  let hasValidRoot = false;

  try {
    const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true });
    const parsed = parser.parse(ctx.sitemapXml);
    hasValidRoot =
      Object.prototype.hasOwnProperty.call(parsed, "urlset") ||
      Object.prototype.hasOwnProperty.call(parsed, "sitemapindex");
    if (!hasValidRoot) {
      out.push(
        finding(
          "sitemap-malformed",
          "sitemap",
          "warning",
          "sitemap.xml has no <urlset> or <sitemapindex> root",
          "Root element is missing — Google rejects this format.",
          "Conform to sitemaps.org protocol: root should be <urlset> for a regular sitemap.",
          sitemapUrl,
          {
            docKey: "sitemapsXmlSpec",
            impact: "Google ignores invalid sitemaps.",
            businessImpact: "crawl",
            framework: "SEO",
          },
        ),
      );
    } else {
      locs = extractLocs(parsed);
    }
  } catch {
    out.push(
      finding(
        "sitemap-malformed",
        "sitemap",
        "warning",
        "sitemap.xml is not well-formed XML",
        "Parser threw an exception.",
        "Validate against the sitemaps.org schema; check for unclosed tags or invalid characters.",
        sitemapUrl,
        {
          docKey: "sitemapsXmlSpec",
          impact: "Google ignores invalid sitemaps.",
          businessImpact: "crawl",
          framework: "SEO",
        },
      ),
    );
    return out;
  }

  if (hasValidRoot && locs.length === 0) {
    out.push(
      finding(
        "sitemap-empty",
        "sitemap",
        "critical",
        "sitemap.xml exists but lists 0 URLs",
        "The sitemap is well-formed but contains no <url> entries.",
        "Regenerate sitemap.xml so it lists every public URL on your site, or remove the empty sitemap if you don't have one yet.",
        sitemapUrl,
        {
          docKey: "sitemap",
          impact:
            "An empty sitemap tells Google there is nothing to crawl. Worse than no sitemap.",
          businessImpact: "crawl",
          framework: "SEO",
        },
      ),
    );
  }

  const phantomLocs = locs.filter((u) => PHANTOM_PATTERNS.test(u));
  if (phantomLocs.length > 0) {
    out.push(
      finding(
        "sitemap-phantom",
        "sitemap",
        "critical",
        "sitemap.xml lists placeholder URLs",
        `Found ${phantomLocs.length} placeholder URL(s): ${phantomLocs.slice(0, 3).join(", ")}`,
        "Replace placeholder entries with your real production URLs. AI-built sitemaps often ship with localhost or template-string entries.",
        sitemapUrl,
        {
          docKey: "sitemap",
          impact:
            "Google de-prioritizes the entire sitemap when it contains bogus URLs. Real pages compete with placeholder noise.",
          businessImpact: "crawl",
          framework: "SEO",
        },
      ),
    );
  }

  return out;
}
