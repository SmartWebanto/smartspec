import { finding } from "./finding";
import type { Finding } from "../legacy-types";

// Module-level pass synthesis. The workspace score formula
// (_finding-schema/SKILL.md) is pass-based, but individual checks today emit
// only failures. As a pragmatic bridge, this helper emits one `pass` finding
// per category that ran cleanly — so a site with no issues scores 100, and a
// site with one problem in one category degrades proportionally. Fine-grained
// per-check pass emission will replace this aggregator over time.

type CategoryMeta = { title: string; evidence: string };

const CATEGORY_META: Record<string, CategoryMeta> = {
  page: {
    title: "Page meta and head tags are clean",
    evidence: "Title, meta description, canonical, lang and robots all present and well-formed.",
  },
  schema: {
    title: "Schema markup passes basic checks",
    evidence: "JSON-LD parses cleanly with no deprecated types detected.",
  },
  images: {
    title: "Image hygiene baseline met",
    evidence: "Images carry alt attributes and lazy-loading hints where expected.",
  },
  links: {
    title: "Internal links structurally sound",
    evidence: "No empty anchors and a sufficient internal linking footprint detected.",
  },
  a11y: {
    title: "Accessibility baseline met",
    evidence: "No missing labels, headings, or landmark issues from static checks.",
  },
  hreflang: {
    title: "Hreflang configuration consistent",
    evidence: "Reciprocal hreflang annotations parse cleanly when present.",
  },
  social: {
    title: "Open Graph and Twitter Card present",
    evidence: "Social meta tags detected on the page.",
  },
  robots: {
    title: "robots.txt reachable and permissive",
    evidence: "robots.txt fetched OK; no blanket disallow on key paths.",
  },
  sitemap: {
    title: "Sitemap reachable and valid",
    evidence: "sitemap.xml fetched OK and parses as XML.",
  },
  "ai-readiness": {
    title: "AI-crawler signals look reasonable",
    evidence: "llms.txt is present or AI crawlers are not blocked.",
  },
  redirects: {
    title: "No redirect chain on the start URL",
    evidence: "Initial request resolved without redirect hops.",
  },
  security: {
    title: "Core security headers present",
    evidence: "HTTPS, HSTS and key security headers detected.",
  },
  performance: {
    title: "Performance metrics within acceptable range",
    evidence: "PageSpeed Insights returned no critical Core Web Vitals issues.",
  },
  mobile: {
    title: "Mobile viewport configured",
    evidence: "Mobile viewport meta tag present.",
  },
  content: {
    title: "Content depth and quality baseline met",
    evidence: "Page text length and structure pass the static heuristics.",
  },
  analytics: {
    title: "Analytics tagging looks healthy",
    evidence: "No placeholder measurement IDs detected.",
  },
  crawl: {
    title: "All crawled pages fetched successfully",
    evidence: "No fetch failures encountered during crawl.",
  },
};

export function aggregatePassesByCategory(
  findings: Finding[],
  expectedCategories: string[],
  url: string,
): Finding[] {
  const failing = new Set<string>();
  for (const f of findings) {
    if (f.severity === "critical" || f.severity === "warning") failing.add(f.category);
  }
  const out: Finding[] = [];
  for (const cat of expectedCategories) {
    if (failing.has(cat)) continue;
    const meta = CATEGORY_META[cat] ?? {
      title: `${cat} checks passed`,
      evidence: `No issues detected in ${cat}.`,
    };
    out.push(
      finding(
        `${cat}-passed`,
        cat,
        "pass",
        meta.title,
        meta.evidence,
        "No action required.",
        url,
        { businessImpact: "ranking", framework: "both" },
      ),
    );
  }
  return out;
}

export const ALL_AUDIT_CATEGORIES: string[] = [
  "page",
  "schema",
  "images",
  "links",
  "a11y",
  "hreflang",
  "social",
  "robots",
  "sitemap",
  "ai-readiness",
  "redirects",
  "security",
  "performance",
  "mobile",
  "content",
  "analytics",
];

export const AUDIT_CATEGORY_ALIASES: Record<string, string> = {
  llms: "ai-readiness",
  "content-quality": "content",
};

export function normalizeAuditCategory(category: string): string {
  const key = category.trim().toLowerCase();
  return AUDIT_CATEGORY_ALIASES[key] ?? key;
}

export function normalizeAuditCategories(categories: string[] | undefined): string[] | undefined {
  if (!categories || categories.length === 0) return undefined;
  return Array.from(new Set(categories.map(normalizeAuditCategory).filter(Boolean)));
}

export function invalidAuditCategories(categories: string[] | undefined): string[] {
  const normalized = normalizeAuditCategories(categories) ?? [];
  const allowed = new Set(ALL_AUDIT_CATEGORIES);
  return normalized.filter((category) => !allowed.has(category));
}
