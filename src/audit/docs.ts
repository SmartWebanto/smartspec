import type { DocLink } from "../legacy-types";

export const DOCS: Record<string, DocLink> = {
  titleLink: {
    label: "Google Search Central — Title links",
    url: "https://developers.google.com/search/docs/appearance/title-link",
  },
  metaDesc: {
    label: "Google Search Central — Meta descriptions",
    url: "https://developers.google.com/search/docs/appearance/snippet",
  },
  canonical: {
    label: "Google Search Central — Canonical URLs",
    url: "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls",
  },
  robotsMeta: {
    label: "Google Search Central — Robots meta tag",
    url: "https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag",
  },
  hreflang: {
    label: "Google Search Central — hreflang",
    url: "https://developers.google.com/search/docs/specialty/international/localized-versions",
  },
  robotsTxt: {
    label: "Google Search Central — robots.txt",
    url: "https://developers.google.com/search/docs/crawling-indexing/robots/intro",
  },
  sitemap: {
    label: "Google Search Central — Sitemaps",
    url: "https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview",
  },
  organization: { label: "Schema.org — Organization", url: "https://schema.org/Organization" },
  website: { label: "Schema.org — WebSite", url: "https://schema.org/WebSite" },
  jsonLd: {
    label: "Google Search Central — Structured data with JSON-LD",
    url: "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data",
  },
  cwv: { label: "web.dev — Core Web Vitals", url: "https://web.dev/articles/vitals" },
  lcp: { label: "web.dev — Largest Contentful Paint", url: "https://web.dev/articles/lcp" },
  cls: { label: "web.dev — Cumulative Layout Shift", url: "https://web.dev/articles/cls" },
  inp: { label: "web.dev — Interaction to Next Paint", url: "https://web.dev/articles/inp" },
  altText: {
    label: "MDN — img alt attribute",
    url: "https://developer.mozilla.org/docs/Web/HTML/Element/img#alt",
  },
  lazyLoading: {
    label: "web.dev — Lazy-load images",
    url: "https://web.dev/articles/browser-level-image-lazy-loading",
  },
  hsts: {
    label: "MDN — Strict-Transport-Security",
    url: "https://developer.mozilla.org/docs/Web/HTTP/Headers/Strict-Transport-Security",
  },
  csp: {
    label: "MDN — Content-Security-Policy",
    url: "https://developer.mozilla.org/docs/Web/HTTP/Headers/Content-Security-Policy",
  },
  xFrame: {
    label: "MDN — X-Frame-Options",
    url: "https://developer.mozilla.org/docs/Web/HTTP/Headers/X-Frame-Options",
  },
  referrerPolicy: {
    label: "MDN — Referrer-Policy",
    url: "https://developer.mozilla.org/docs/Web/HTTP/Headers/Referrer-Policy",
  },
  ogProtocol: { label: "Open Graph protocol", url: "https://ogp.me/" },
  twitterCards: {
    label: "X — Cards documentation",
    url: "https://developer.x.com/en/docs/twitter-for-websites/cards/overview/abouts-cards",
  },
  llmsTxt: { label: "llmstxt.org", url: "https://llmstxt.org/" },
  htmlLang: {
    label: "MDN — html lang attribute",
    url: "https://developer.mozilla.org/docs/Web/HTML/Global_attributes/lang",
  },
  viewport: { label: "web.dev — Viewport meta tag", url: "https://web.dev/articles/viewport" },
  sitemapsXmlSpec: {
    label: "sitemaps.org — XML protocol",
    url: "https://www.sitemaps.org/protocol.html",
  },
  headingHierarchy: {
    label: "web.dev — Headings and landmarks",
    url: "https://web.dev/articles/headings-and-landmarks",
  },
  anchorText: {
    label: "Google Search Central — Anchor text",
    url: "https://developers.google.com/search/docs/crawling-indexing/links-crawlable",
  },
  thinContent: {
    label: "Google Search Central — Creating helpful, reliable, people-first content",
    url: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
  },
  analytics: {
    label: "Google Analytics Help — Set up Analytics for a website",
    url: "https://support.google.com/analytics/answer/9304153",
  },
};
