import { XMLParser } from "fast-xml-parser";
import { fetchHtml, fetchText, fetchTextWith } from "./fetch";
import type { FetchWithOptions } from "./fetch";
import { HostRateLimiter } from "./rate-limit";
import { parseHtml } from "./parse-html";
import { runPageSpeed } from "../audit/pagespeed";
import { finding } from "../audit/finding";
import { score } from "../score";
import {
  aggregatePassesByCategory,
  ALL_AUDIT_CATEGORIES,
  normalizeAuditCategories,
} from "../audit/aggregate-passes";
import { parseRobots, isAllowed } from "./robots-rules";
import { pageModule } from "../audit/modules/page";
import { schemaModule } from "../audit/modules/schema";
import { imagesModule } from "../audit/modules/images";
import { linksModule } from "../audit/modules/links";
import { socialModule } from "../audit/modules/social";
import { a11yModule } from "../audit/modules/a11y";
import { hreflangModule } from "../audit/modules/hreflang";
import { robotsModule } from "../audit/modules/robots";
import { sitemapModule } from "../audit/modules/sitemap";
import { llmsModule } from "../audit/modules/llms";
import { redirectsModule } from "../audit/modules/redirects";
import { securityModule } from "../audit/modules/security";
import { performanceModule } from "../audit/modules/performance";
import { mobileModule } from "../audit/modules/mobile";
import { contentQualityModule } from "../audit/modules/content-quality";
import { analyticsModule } from "../audit/modules/analytics";
import type { Finding } from "../legacy-types";

export type CrawlOptions = {
  maxPages?: number;
  concurrency?: number;
  psiScope?: "homepage" | "all" | "none";
  timeoutMs?: number;
  signal?: AbortSignal;
  userAgent?: string;
  requestsPerSecond?: number;
  categories?: string[];
  includeFixes?: boolean;
};

export type AuditResult = {
  startUrl: string;
  finalUrl: string;
  pagesScanned: number;
  startedAt: string;
  finishedAt: string;
  score: number;
  findings: Finding[];
};

function normalizeUrl(u: string): string {
  try {
    const url = new URL(u);
    url.hash = "";
    let s = url.toString();
    if (s.endsWith("/") && url.pathname !== "/") s = s.slice(0, -1);
    return s;
  } catch {
    return u;
  }
}

function pageKey(url: string): string {
  try {
    const p = new URL(url).pathname.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return p || "home";
  } catch {
    return "home";
  }
}

function prefixIds(findings: Finding[], key: string): Finding[] {
  return findings.map((f) => ({ ...f, id: `${key}::${f.id}` }));
}

export async function discoverFromSitemap(origin: string, max: number, fetchOpts?: FetchWithOptions): Promise<string[] | null> {
  const collected: string[] = [];
  const visited = new Set<string>();
  const parser = new XMLParser({ ignoreAttributes: false });

  async function consume(sitemapUrl: string): Promise<void> {
    if (visited.has(sitemapUrl) || collected.length >= max) return;
    visited.add(sitemapUrl);
    const res = fetchOpts ? await fetchTextWith(sitemapUrl, fetchOpts) : await fetchText(sitemapUrl);
    if (!res || res.status !== 200) return;
    let parsed: { sitemapindex?: { sitemap?: unknown }; urlset?: { url?: unknown } };
    try { parsed = parser.parse(res.body); } catch { return; }

    if (parsed?.sitemapindex?.sitemap) {
      const children = Array.isArray(parsed.sitemapindex.sitemap)
        ? parsed.sitemapindex.sitemap
        : [parsed.sitemapindex.sitemap];
      for (const child of children) {
        if (collected.length >= max) break;
        const loc = (child as { loc?: string }).loc;
        if (typeof loc === "string") await consume(loc);
      }
      return;
    }

    if (parsed?.urlset?.url) {
      const entries = Array.isArray(parsed.urlset.url) ? parsed.urlset.url : [parsed.urlset.url];
      for (const e of entries) {
        if (collected.length >= max) break;
        const loc = (e as { loc?: string }).loc;
        if (typeof loc !== "string") continue;
        try {
          if (new URL(loc).origin !== origin) continue;
        } catch { continue; }
        const norm = normalizeUrl(loc);
        if (!collected.includes(norm)) collected.push(norm);
      }
    }
  }

  await consume(`${origin}/sitemap.xml`);
  return collected.length > 0 ? collected.slice(0, max) : null;
}

const MAX_LINK_CHECKS = 100;

// Verify the HTTP status of every unique internal link target and, if any are
// broken, return a single finding that lists exactly which URLs fail and where
// each was linked from — so the card says *which* links 404, not just a count.
async function checkBrokenLinks(
  sightings: Map<string, { text: string; foundOn: string }>,
  concurrency: number,
  timeoutMs: number,
  fetchOpts: FetchWithOptions,
): Promise<Finding[]> {
  const targets = Array.from(sightings.entries())
    .slice(0, MAX_LINK_CHECKS)
    .map(([href, meta]) => ({ href, ...meta }));
  if (targets.length === 0) return [];

  const broken: { href: string; status: number | null; text: string; foundOn: string }[] = [];
  await runPool(targets, concurrency, async (t) => {
    const res = await fetchTextWith(t.href, fetchOpts);
    const status = res ? res.status : null;
    if (status === null || status >= 400) {
      broken.push({ href: t.href, status, text: t.text, foundOn: t.foundOn });
    }
  });
  if (broken.length === 0) return [];

  broken.sort((a, b) => a.href.localeCompare(b.href));
  const n = broken.length;
  const noun = n === 1 ? "internal link" : "internal links";
  const all404 = broken.every((b) => b.status === 404);
  const verb = all404
    ? n === 1 ? "returns 404" : "return 404"
    : n === 1 ? "is broken" : "are broken";
  const evidence = broken
    .map((b) => {
      const code = b.status === null ? "no response" : `HTTP ${b.status}`;
      const label = b.text ? ` — "${b.text}"` : "";
      return `${code}  ${b.href}${label}  (linked from ${b.foundOn})`;
    })
    .join("\n");

  const f = finding(
    "internal-links-broken",
    "links",
    n >= 5 ? "critical" : "warning",
    `${n} ${noun} ${verb}`,
    evidence,
    "Fix each link listed below: point the href at the correct destination, or remove the link if the target no longer exists. Then re-run the audit to confirm.",
    undefined,
    {
      docKey: "anchorText",
      impact:
        "Broken internal links waste crawl budget, leak link equity into dead ends, and send visitors to error pages — hurting both rankings and conversions.",
      businessImpact: "crawl",
      framework: "SEO",
    },
  );
  f.refs = broken.map((b) => b.href);
  return [f];
}

async function runPool<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>): Promise<void> {
  let i = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx]);
    }
  });
  await Promise.all(workers);
}

export function filterByRobots(
  urls: string[],
  robotsBody: string | null,
  userAgent: string,
): { allowed: string[]; blockedFindings: Finding[] } {
  if (!robotsBody) return { allowed: urls, blockedFindings: [] };
  const rules = parseRobots(robotsBody);
  const allowed: string[] = [];
  const blocked: string[] = [];
  for (const url of urls) {
    if (isAllowed(rules, userAgent, url)) allowed.push(url);
    else blocked.push(url);
  }
  const blockedFindings: Finding[] = [];
  if (blocked.length > 0) {
    const f = finding(
      "robots-blocked-urls",
      "robots",
      "info",
      `${blocked.length} URL${blocked.length === 1 ? "" : "s"} blocked by robots.txt and skipped`,
      blocked.slice(0, 50).join("\n"),
      "If these URLs should be crawled, remove the matching Disallow rule from robots.txt. If they're intentionally blocked, no action needed — this is informational.",
      undefined,
      { businessImpact: "crawl", framework: "SEO" },
    );
    f.refs = blocked;
    blockedFindings.push(f);
  }
  return { allowed, blockedFindings };
}

export async function crawlAudit(startUrl: string, opts: CrawlOptions = {}): Promise<AuditResult> {
  const maxPages = opts.maxPages ?? 25;
  const concurrency = opts.concurrency ?? 5;
  const psiScope = opts.psiScope ?? "homepage";
  const timeoutMs = opts.timeoutMs ?? 10_000;
  const startedAt = new Date().toISOString();

  const signal = opts.signal;
  const ua = opts.userAgent ?? "smartspec/1.0 (+https://smartspec.dev)";
  const rps = opts.requestsPerSecond ?? 2;
  const limiter = new HostRateLimiter({ requestsPerSecond: rps });
  const fetchOpts: FetchWithOptions = {
    limiter,
    retry: { maxAttempts: 3, baseDelayMs: 500 },
    timeoutMs,
    userAgent: ua,
    signal,
  };
  const checkAbort = () => {
    if (signal?.aborted) throw new Error("aborted by signal");
  };
  checkAbort();

  const startHost = (() => { try { return new URL(startUrl).host; } catch { return "unknown"; } })();
  await limiter.acquire(startHost);
  const home = await fetchHtml(startUrl, { timeoutMs, userAgent: ua, signal });
  const homeUrl = normalizeUrl(home.finalUrl);
  const origin = new URL(homeUrl).origin;
  const homeParsed = parseHtml(home.body, homeUrl);

  let pages = await discoverFromSitemap(origin, maxPages, fetchOpts);
  if (!pages || pages.length === 0) {
    const internal = homeParsed.links.internal
      .map((l) => normalizeUrl(l.href))
      .filter((u) => { try { return new URL(u).origin === origin; } catch { return false; } });
    pages = Array.from(new Set([homeUrl, ...internal])).slice(0, maxPages);
  }
  if (!pages.includes(homeUrl)) pages = [homeUrl, ...pages].slice(0, maxPages);

  // Fetch robots.txt once up front: filter the page list AND reuse the body for the site-level robotsModule.
  const robotsForFilter = await fetchTextWith(`${origin}/robots.txt`, fetchOpts);
  const robotsBody = robotsForFilter && robotsForFilter.status === 200 ? robotsForFilter.body : null;
  const filtered = filterByRobots(
    pages,
    robotsBody,
    ua,
  );
  pages = filtered.allowed;

  const findings: Finding[] = [];
  findings.push(...filtered.blockedFindings);

  // Internal link targets seen across every scanned page, deduped by URL, so we
  // can verify their HTTP status once and report broken ones in a single card.
  const linkSightings = new Map<string, { text: string; foundOn: string }>();
  const collectLinks = (links: { href: string; text: string }[], foundOn: string) => {
    for (const l of links) {
      const href = normalizeUrl(l.href);
      let sameOrigin = false;
      try {
        sameOrigin = new URL(href).origin === origin;
      } catch {
        sameOrigin = false;
      }
      if (!sameOrigin || href === homeUrl) continue;
      if (!linkSightings.has(href)) linkSightings.set(href, { text: l.text, foundOn });
    }
  };

  await runPool(pages, concurrency, async (pageUrl) => {
    checkAbort();
    const key = pageKey(pageUrl);
    if (pageUrl === homeUrl) {
      const ctx = { url: homeUrl, parsed: homeParsed };
      collectLinks(homeParsed.links.internal, homeUrl);
      const perPage = (await Promise.all([
        pageModule(ctx), schemaModule(ctx), imagesModule(ctx), linksModule(ctx),
        socialModule(ctx), a11yModule(ctx), hreflangModule(ctx), mobileModule(ctx),
        contentQualityModule(ctx), analyticsModule(ctx),
      ])).flat();
      findings.push(...prefixIds(perPage, key));
      return;
    }
    const res = await fetchTextWith(pageUrl, fetchOpts);
    if (!res || res.status !== 200) {
      findings.push(finding(
        `${key}::crawl-fetch-failed`, "crawl", "warning", "Page could not be fetched",
        `GET ${pageUrl} returned ${res ? res.status : "no response"}.`,
        "Confirm the URL returns HTTP 200. Broken internal pages waste crawl budget and can't be indexed.",
        pageUrl, { businessImpact: "crawl", framework: "SEO" },
      ));
      return;
    }
    const parsed = parseHtml(res.body, pageUrl);
    const ctx = { url: pageUrl, parsed };
    collectLinks(parsed.links.internal, pageUrl);
    const perPage = (await Promise.all([
      pageModule(ctx), schemaModule(ctx), imagesModule(ctx), linksModule(ctx),
      socialModule(ctx), a11yModule(ctx), hreflangModule(ctx), mobileModule(ctx),
      contentQualityModule(ctx), analyticsModule(ctx),
    ])).flat();
    findings.push(...prefixIds(perPage, key));
    if (psiScope === "all") {
      const psi = await runPageSpeed(pageUrl, "mobile", process.env.GOOGLE_PSI_API_KEY);
      findings.push(...prefixIds(psi ? await performanceModule({ ...ctx, psi }) : [], key));
    }
  });

  findings.push(...(await checkBrokenLinks(linkSightings, concurrency, timeoutMs, fetchOpts)));

  checkAbort();
  const [sitemapR, llmsR] = await Promise.all([
    fetchTextWith(`${origin}/sitemap.xml`, fetchOpts),
    fetchTextWith(`${origin}/llms.txt`, fetchOpts),
  ]);
  const homeCtx = { url: homeUrl, parsed: homeParsed };
  checkAbort();
  findings.push(
    ...(await robotsModule({ ...homeCtx, robotsTxt: robotsBody })),
    ...(await sitemapModule({ ...homeCtx, sitemapXml: sitemapR && sitemapR.status === 200 ? sitemapR.body : null })),
    ...(await llmsModule({ ...homeCtx, llmsTxt: llmsR && llmsR.status === 200 ? llmsR.body : null })),
    ...(await redirectsModule({ ...homeCtx, originalUrl: startUrl, finalUrl: home.finalUrl })),
    ...(await securityModule({ ...homeCtx, headers: home.headers })),
  );

  if (psiScope === "homepage") {
    const psi = await runPageSpeed(homeUrl, "mobile", process.env.GOOGLE_PSI_API_KEY);
    findings.push(...(psi ? await performanceModule({ ...homeCtx, psi }) : []));
  }

  const seen = new Set<string>();
  const deduped = findings.filter((f) => {
    if (seen.has(f.id)) return false;
    seen.add(f.id);
    return true;
  });

  const requestedCategories = normalizeAuditCategories(opts.categories);
  const ranCategories = psiScope === "none"
    ? ALL_AUDIT_CATEGORIES.filter((c) => c !== "performance")
    : ALL_AUDIT_CATEGORIES;
  const expectedCategories = requestedCategories
    ? ranCategories.filter((category) => requestedCategories.includes(category))
    : ranCategories;
  const withPasses = [
    ...deduped,
    ...aggregatePassesByCategory(deduped, expectedCategories, homeUrl),
  ];

  const pagesScanned = pages.length;

  let outFindings = withPasses;
  outFindings = filterFindingsByCategory(outFindings, requestedCategories);
  if (opts.includeFixes === false) outFindings = stripSuggestedFixes(outFindings);
  const auditScore = score(outFindings);

  return { startUrl, finalUrl: home.finalUrl, pagesScanned, startedAt, finishedAt: new Date().toISOString(), score: auditScore, findings: outFindings };
}

export function filterFindingsByCategory(findings: Finding[], categories: string[] | undefined): Finding[] {
  const normalized = normalizeAuditCategories(categories);
  if (!normalized || normalized.length === 0) return findings;
  const set = new Set(normalized);
  return findings.filter((f) => set.has(String((f as { category?: string }).category ?? "")));
}

export function stripSuggestedFixes(findings: Finding[]): Finding[] {
  return findings.map((f) => {
    const copy = { ...(f as Record<string, unknown>) };
    delete copy.action;
    delete copy.suggested_fix;
    return copy as Finding;
  });
}
