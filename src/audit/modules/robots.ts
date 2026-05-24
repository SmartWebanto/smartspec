import { finding } from "../finding";
import type { ParsedHtml } from "../../crawl/parse-html";
import type { Finding } from "../../legacy-types";

export type RobotsCtx = { url: string; parsed: ParsedHtml; robotsTxt: string | null };

export async function robotsModule(ctx: RobotsCtx): Promise<Finding[]> {
  const out: Finding[] = [];
  const origin = new URL(ctx.url).origin;

  if (ctx.robotsTxt === null) {
    out.push(
      finding(
        "robots-txt-missing",
        "robots",
        "warning",
        "No robots.txt at /robots.txt",
        "Robots file is missing or returned non-200.",
        "Add a /robots.txt — at minimum: \"User-agent: *\\nAllow: /\\nSitemap: https://your-domain/sitemap.xml\".",
        `${origin}/robots.txt`,
        {
          docKey: "robotsTxt",
          impact:
            "Without robots.txt Google may waste crawl budget and you can't point crawlers at your sitemap.",
          businessImpact: "crawl",
          framework: "SEO",
        },
      ),
    );
    return out;
  }

  if (/User-agent:\s*\*[\s\S]*?Disallow:\s*\/\s*$/im.test(ctx.robotsTxt)) {
    out.push(
      finding(
        "robots-disallow-all",
        "robots",
        "critical",
        "robots.txt blocks all crawlers",
        "Found `User-agent: *` followed by `Disallow: /`.",
        "Replace `Disallow: /` with `Allow: /` (or remove the line) so search engines can crawl your site.",
        `${origin}/robots.txt`,
        {
          docKey: "robotsTxt",
          impact: "Total crawl block. Google cannot index any URL on this domain.",
          businessImpact: "crawl",
          framework: "SEO",
        },
      ),
    );
  }

  return out;
}
