import { finding } from "../finding";
import type { ParsedHtml } from "../../crawl/parse-html";
import type { Finding } from "../../legacy-types";

const DEFAULT_TITLES = new Set([
  "v0 by vercel",
  "vite app",
  "vite + react",
  "vite + vue",
  "next.js",
  "create next app",
  "react app",
  "lovable",
  "bolt",
  "untitled",
  "document",
]);

export type PageCtx = { url: string; parsed: ParsedHtml };

export async function pageModule(ctx: PageCtx): Promise<Finding[]> {
  const out: Finding[] = [];
  const p = ctx.parsed;

  if (!p.title) {
    out.push(
      finding(
        "page-title-missing",
        "page",
        "critical",
        "Page has no <title> tag",
        "The <title> element is empty or missing in the document head.",
        "Add a <title> in <head> that summarizes the page (50-60 characters, primary keyword first).",
        ctx.url,
        {
          docKey: "titleLink",
          impact:
            "Browsers and search engines fall back to the URL as the SERP title — drastically hurts click-through.",
          businessImpact: "ctr",
          framework: "SEO",
        },
      ),
    );
  } else if (p.title.length > 70) {
    out.push(
      finding(
        "page-title-too-long",
        "page",
        "warning",
        "Title is longer than 70 characters",
        `Current title (${p.title.length} chars): "${p.title}"`,
        "Shorten the title to 50-60 characters so Google does not truncate it in search results.",
        ctx.url,
        {
          docKey: "titleLink",
          impact:
            "Truncated titles look unprofessional and lose keyword visibility in the SERP.",
          businessImpact: "ctr",
          framework: "SEO",
        },
      ),
    );
  }

  if (!p.metaDescription) {
    out.push(
      finding(
        "page-meta-desc-missing",
        "page",
        "warning",
        "No meta description",
        'The <meta name="description"> tag is empty or missing.',
        'Add a <meta name="description"> of 140-160 characters describing the page value proposition.',
        ctx.url,
        {
          docKey: "metaDesc",
          impact:
            "Google auto-generates a snippet from page text, often poorly chosen and not optimized for CTR.",
          businessImpact: "ctr",
          framework: "SEO",
        },
      ),
    );
  }

  if (!p.canonical) {
    out.push(
      finding(
        "page-canonical-missing",
        "page",
        "warning",
        "No canonical URL",
        'The <link rel="canonical"> tag is not present.',
        'Add <link rel="canonical" href="<absolute-page-url>"> in <head> to consolidate signals across duplicate URLs.',
        ctx.url,
        {
          docKey: "canonical",
          impact:
            "Duplicate URL variants (query strings, trailing slashes) may compete and dilute ranking signals.",
          businessImpact: "ranking",
          framework: "SEO",
        },
      ),
    );
  }

  if (p.robotsMeta.toLowerCase().includes("noindex")) {
    out.push(
      finding(
        "page-noindex",
        "page",
        "critical",
        "Page is marked noindex",
        `meta robots = "${p.robotsMeta}"`,
        "Remove the noindex directive unless you intentionally want this page hidden from search engines.",
        ctx.url,
        {
          docKey: "robotsMeta",
          impact:
            "Google will not index this page. Total visibility loss in search results.",
          businessImpact: "crawl",
          framework: "SEO",
        },
      ),
    );
  }

  if (!p.htmlLang) {
    out.push(
      finding(
        "page-html-lang-missing",
        "page",
        "warning",
        "<html> tag has no lang attribute",
        "Document does not declare a primary language.",
        'Add lang attribute to <html>, e.g. <html lang="en"> or <html lang="it">.',
        ctx.url,
        {
          docKey: "htmlLang",
          impact:
            "Affects assistive tech, browser translation, and Google's language detection.",
          businessImpact: "ux",
          framework: "SEO",
        },
      ),
    );
  }

  // page-title-default — vibecoder-pattern detection
  if (p.title && DEFAULT_TITLES.has(p.title.trim().toLowerCase())) {
    out.push(
      finding(
        "page-title-default",
        "page",
        "critical",
        "Title is a default AI-tool placeholder",
        `Current title: "${p.title}". This is the default emitted by an AI site builder.`,
        "Replace with a title that summarizes your page (50-60 chars, primary keyword first).",
        ctx.url,
        {
          docKey: "titleLink",
          impact:
            "Default titles like 'v0 by Vercel' or 'Vite App' rank for nothing and signal abandonment to Google.",
          businessImpact: "ctr",
          framework: "SEO",
        },
      ),
    );
  }

  // page-canonical-localhost — leftover from AI preview env
  if (
    p.canonical &&
    /(^https?:\/\/(localhost|127\.0\.0\.1)|\.lovable\.app|-git-[a-z0-9-]+\.vercel\.app|\.bolt\.host|\.replit\.(app|dev))/i.test(
      p.canonical,
    )
  ) {
    out.push(
      finding(
        "page-canonical-localhost",
        "page",
        "critical",
        "Canonical URL points at a development or preview environment",
        `Canonical = "${p.canonical}"`,
        "Update <link rel=\"canonical\"> to point at the production URL of this page.",
        ctx.url,
        {
          docKey: "canonical",
          impact:
            "Google de-duplicates against the canonical. Pointing it at localhost or a preview URL tells Google the production page is the duplicate — it will not be indexed.",
          businessImpact: "crawl",
          framework: "SEO",
        },
      ),
    );
  }

  // page-empty-source-html — JS-only rendering, no server-side content
  if (p.bodyText.length < 100) {
    out.push(
      finding(
        "page-empty-source-html",
        "page",
        "critical",
        "Source HTML body is empty (JS-only rendering)",
        `Body contains ${p.bodyText.length} chars of text. Most content is JS-rendered.`,
        "Enable server-side rendering (SSR) or pre-rendering. Googlebot can crawl JS but indexes pages with server-rendered content faster and more reliably.",
        ctx.url,
        {
          docKey: "robotsMeta",
          impact:
            "JS-only sites suffer from delayed indexing and missed content. AI-tool defaults (Vite, CRA) ship empty-shell HTML.",
          businessImpact: "crawl",
          framework: "SEO",
        },
      ),
    );
  }

  return out;
}
