// Phase 1: new types per spec §6-7. Defined now, adopted by modules in Phase 3.

export type Category =
  | "seo"            // core SEO: meta, canonical, h1, favicon
  | "performance"    // LCP, CLS, INP
  | "a11y"           // ARIA, focus, landmarks
  | "security"       // HTTPS, CSP, headers
  | "mobile"         // viewport, tap targets
  | "content"        // readability, freshness, thin
  | "eeat"           // experience, expertise, authority, trust
  | "analytics"      // GA4, GTM, consent mode
  | "schema"         // JSON-LD
  | "images"
  | "links"
  | "local-seo"      // NAP, LocalBusiness
  | "i18n"           // hreflang
  | "robots"         // robots.txt
  | "sitemap"        // sitemap.xml
  | "redirects"      // HTTP redirect chains
  | "legal"          // cookie banner, privacy
  | "social"         // OG, Twitter cards
  | "video"
  | "adblock"
  | "ai";            // llms.txt, AI crawlers

export type Severity = "critical" | "warning" | "info" | "pass";

export type SuggestedFix = {
  type: "html" | "json-ld" | "redirect" | "robots" | "header" | "config" | "text";
  snippet: string;
  context?: string;
  rationale?: string;
};

export type Finding = {
  id: string;                     // sha256(rule_id + url + selector)
  rule_id: string;
  category: Category;
  severity: Severity;
  url: string;
  selector?: string;
  title: string;
  description: string;
  evidence?: unknown;
  suggested_fix?: SuggestedFix;
  doc_url?: string;
  detected_at: string;
  source: "ts-core" | `plugin:${string}`;
};

export type PageSnapshot = {
  url: string;
  status: number;
  headers: Record<string, string>;
  html: string;
  redirects: string[];
  fetched_at: string;
  content_hash: string;
};

export type AuditContext = {
  runId: string;
  options: AuditOptions;
};

export type AuditOptions = {
  maxPages: number;
  categories?: Category[];
  includeFixes: boolean;
  includePlugins: boolean;  // reserved: wired in Phase 6
  quiet: boolean;
  verbose: boolean;
};

export type Rule = {
  id: string;
  category: Category;
  severity: Severity;
  title: string;
  description: string;
};

export type AuditModule = {
  id: string;
  category: Category;
  rules: Rule[];
  audit(page: PageSnapshot, ctx: AuditContext): Promise<Finding[]>;
};
