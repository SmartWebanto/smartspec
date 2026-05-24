export type Severity = "critical" | "warning" | "info" | "pass";
export type Confidence = "confirmed" | "likely" | "hypothesis";
export type Effort = "low" | "medium" | "high";
export type Status = "backlog" | "todo" | "doing" | "done";
export type AuditScope = "full" | "health" | "single-page";
export type BusinessImpact = "ranking" | "crawl" | "ctr" | "ux" | "security";
export type SearchFramework = "SEO" | "AEO" | "both";
export type AgentId =
  | "tech-audit"
  | "tech-page"
  | "tech-schema"
  | "tech-links"
  | "tech-images"
  | "tech-health"
  | "tech-llms-txt"
  | "tech-security";
export type AgentRunStatus = "queued" | "running" | "completed" | "failed";

export const SEVERITIES: Severity[] = ["critical", "warning", "info", "pass"];
export const EFFORTS: Effort[] = ["low", "medium", "high"];
export const STATUSES: Status[] = ["backlog", "todo", "doing", "done"];
export const BUSINESS_IMPACTS: BusinessImpact[] = [
  "ranking",
  "crawl",
  "ctr",
  "ux",
  "security",
];
export const SEARCH_FRAMEWORKS: SearchFramework[] = ["SEO", "AEO", "both"];

export type DocLink = { label: string; url: string };

export type Finding = {
  id: string;
  title: string;
  severity: Severity;
  confidence: Confidence;
  effort: Effort;
  status: Status;
  category: string;
  evidence: string;
  recommendation: string;
  impact: string;
  businessImpact: BusinessImpact;
  framework?: SearchFramework;
  refs?: string[];
  docs?: DocLink[];
  createdAt: string;
  updatedAt: string;
};

export type Client = {
  slug: string;
  name: string;
  domain: string;
  language: string;
  country: string;
  gscProperty?: string;
  sitemapUrl?: string;
  auditScope: AuditScope;
  singlePageUrl?: string;
  dfsLimits: {
    onPageInstantPagesPerDay: number;
    onPageLighthousePerDay: number;
  };
  createdAt: string;
  lastAuditAt?: string;
};

export type AgentRun = {
  id: string;
  clientSlug: string;
  agentId: AgentId;
  status: AgentRunStatus;
  input: {
    domain: string;
    auditScope: AuditScope;
    singlePageUrl?: string;
  };
  output?: {
    score?: number;
    findingsCount?: number;
    pagesScanned?: number;
    artifactIds?: string[];
  };
  error?: string;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
};
