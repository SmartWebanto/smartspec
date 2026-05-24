import * as cheerio from "cheerio";

export type ParsedImage = {
  src: string;
  alt: string;
  loading?: string;
  width?: string;
  height?: string;
};
export type ParsedLink = { href: string; text: string; rel?: string };
export type ParsedHeading = { level: number; text: string };
export type ParsedHreflang = { lang: string; href: string };

export type ParsedHtml = {
  title: string;
  metaDescription: string;
  robotsMeta: string;
  canonical: string;
  htmlLang: string;
  viewport: string;
  hreflang: ParsedHreflang[];
  jsonLd: Record<string, unknown>[];
  images: ParsedImage[];
  links: { internal: ParsedLink[]; external: ParsedLink[] };
  headings: ParsedHeading[];
  og: Record<string, string>;
  twitter: Record<string, string>;
  bodyText: string;
  raw: string;
};

function abs(base: string, href: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

export function parseHtml(html: string, baseUrl: string): ParsedHtml {
  const $ = cheerio.load(html);

  let baseHost = "";
  try {
    baseHost = new URL(baseUrl).host;
  } catch {
    baseHost = "";
  }

  const og: Record<string, string> = {};
  const twitter: Record<string, string> = {};
  $('meta[property^="og:"]').each((_, el) => {
    const k = $(el).attr("property");
    const v = $(el).attr("content");
    if (k && v != null) og[k] = v;
  });
  $('meta[name^="twitter:"]').each((_, el) => {
    const k = $(el).attr("name");
    const v = $(el).attr("content");
    if (k && v != null) twitter[k] = v;
  });

  const hreflang: ParsedHreflang[] = [];
  $('link[rel="alternate"][hreflang]').each((_, el) => {
    const lang = $(el).attr("hreflang");
    const href = $(el).attr("href");
    if (lang && href) hreflang.push({ lang, href });
  });

  const jsonLd: Record<string, unknown>[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text();
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) jsonLd.push(...parsed);
      else jsonLd.push(parsed);
    } catch {
      /* skip malformed */
    }
  });

  const images: ParsedImage[] = [];
  $("img").each((_, el) => {
    const $el = $(el);
    const src = $el.attr("src");
    if (!src) return;
    images.push({
      src: abs(baseUrl, src),
      alt: $el.attr("alt") ?? "",
      loading: $el.attr("loading"),
      width: $el.attr("width"),
      height: $el.attr("height"),
    });
  });

  const internal: ParsedLink[] = [];
  const external: ParsedLink[] = [];
  $("a[href]").each((_, el) => {
    const $el = $(el);
    const href = $el.attr("href") ?? "";
    const text = $el.text().trim();
    const rel = $el.attr("rel");
    const absHref = abs(baseUrl, href);
    let host = "";
    try {
      host = new URL(absHref).host;
    } catch {
      host = "";
    }
    const link: ParsedLink = { href: absHref, text, rel };
    if (host === baseHost || host === "") internal.push(link);
    else external.push(link);
  });

  const headings: ParsedHeading[] = [];
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    const tag = (el as { tagName?: string }).tagName ?? "";
    const m = tag.match(/h([1-6])/i);
    if (m) headings.push({ level: Number(m[1]), text: $(el).text().trim() });
  });

  const $body = $("body").clone();
  $body.find("script, style, noscript, template").remove();
  const bodyText = $body.text().replace(/\s+/g, " ").trim();

  return {
    title: $("head > title").first().text().trim(),
    metaDescription: $('meta[name="description"]').attr("content")?.trim() ?? "",
    robotsMeta: $('meta[name="robots"]').attr("content")?.trim() ?? "",
    canonical: $('link[rel="canonical"]').attr("href")?.trim() ?? "",
    htmlLang: $("html").attr("lang")?.trim() ?? "",
    viewport: $('meta[name="viewport"]').attr("content")?.trim() ?? "",
    hreflang,
    jsonLd,
    images,
    links: { internal, external },
    headings,
    og,
    twitter,
    bodyText,
    raw: html,
  };
}
