// Public API surface for @smartspec/core. Web and any future package should
// import from this entry, not from internal files.
export { crawlAudit } from "./crawl/crawl";
export type { AuditResult, CrawlOptions } from "./crawl/crawl";
export { runAudit } from "./audit/index";
export { finding } from "./audit/finding";
export { score, categoryScores, healthScore } from "./score";
export { aggregatePassesByCategory, ALL_AUDIT_CATEGORIES } from "./audit/aggregate-passes";
export type {
  Finding,
  Severity,
  Confidence,
  Effort,
  Status,
  AuditScope,
  BusinessImpact,
  SearchFramework,
  AgentId,
} from "./legacy-types";
