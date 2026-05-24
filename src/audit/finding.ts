import type { BusinessImpact, Effort, Finding, SearchFramework, Severity, Status } from "../legacy-types";
import { DOCS } from "./docs";

export type FindingExtras = {
  docKey?: keyof typeof DOCS | Array<keyof typeof DOCS>;
  impact?: string;
  businessImpact?: BusinessImpact;
  framework?: SearchFramework;
  effort?: Effort;
  confidence?: Finding["confidence"];
  status?: Status;
};

export function finding(
  id: string,
  category: string,
  severity: Severity,
  title: string,
  evidence: string,
  action: string,
  url?: string,
  extras: FindingExtras = {},
): Finding {
  const now = new Date().toISOString();
  const docKeys = Array.isArray(extras.docKey)
    ? extras.docKey
    : extras.docKey
      ? [extras.docKey]
      : [];
  const docs = docKeys.map((k) => DOCS[k]).filter(Boolean);
  return {
    id,
    category,
    severity,
    confidence: extras.confidence ?? "confirmed",
    effort: extras.effort ?? "low",
    status: extras.status ?? "backlog",
    title,
    evidence,
    recommendation: action,
    impact: extras.impact ?? "",
    businessImpact: extras.businessImpact ?? "ranking",
    framework: extras.framework ?? "both",
    refs: url ? [url] : undefined,
    docs: docs.length ? docs : undefined,
    createdAt: now,
    updatedAt: now,
  };
}
