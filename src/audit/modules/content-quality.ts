import { finding } from "../finding";
import type { ParsedHtml } from "../../crawl/parse-html";
import type { Finding } from "../../legacy-types";

export type ContentQualityCtx = { url: string; parsed: ParsedHtml };

const BOILERPLATE_HERO_PATTERNS: RegExp[] = [
  /^welcome to my (website|site|app|page)$/i,
  /^my (awesome|amazing|cool) (website|site|app|project)$/i,
  /^hello world$/i,
  /^vite \+ (react|vue|svelte)$/i,
  /^create next app$/i,
  /^lorem ipsum/i, // intentionally not end-anchored — catches "Lorem ipsum dolor sit amet…" openers
  /^untitled$/i,
];

export async function contentQualityModule(ctx: ContentQualityCtx): Promise<Finding[]> {
  const out: Finding[] = [];
  const bodyText = ctx.parsed.bodyText;
  const path = (() => {
    try {
      return new URL(ctx.url).pathname;
    } catch {
      return "/";
    }
  })();

  // content-thin: skip the bare root, where landing pages often legitimately use mostly images
  const isHome = path === "/" || /^\/index\.(html?|php)$/i.test(path);
  if (!isHome && bodyText.length > 0 && bodyText.length < 300) {
    out.push(
      finding(
        "content-thin",
        "content",
        "warning",
        "Thin content (under 300 characters)",
        `Body has ${bodyText.length} chars of text.`,
        "Expand the page to at least 300-600 words of unique, useful content. AI-built scaffolds often ship near-empty inner pages.",
        ctx.url,
        {
          docKey: "thinContent",
          impact:
            "Thin pages get demoted in search and risk Google's 'low quality' classification, dragging the whole domain.",
          businessImpact: "ranking",
          framework: "SEO",
        },
      ),
    );
  }

  // content-boilerplate-hero: first <h1> matches AI-template phrase
  const firstH1 = ctx.parsed.headings.find((h) => h.level === 1)?.text?.trim() ?? "";
  if (firstH1 && BOILERPLATE_HERO_PATTERNS.some((re) => re.test(firstH1))) {
    out.push(
      finding(
        "content-boilerplate-hero",
        "content",
        "info",
        "Page H1 looks like an AI-tool placeholder",
        `H1 = "${firstH1}". This matches a common AI-template default.`,
        "Replace with a specific value-proposition headline that names what your product does and who it's for.",
        ctx.url,
        {
          docKey: "thinContent",
          impact:
            "Boilerplate headlines miss search intent. The H1 is the page's strongest on-page signal — wasting it on placeholder text hurts ranking.",
          businessImpact: "ranking",
          framework: "SEO",
        },
      ),
    );
  }

  return out;
}
