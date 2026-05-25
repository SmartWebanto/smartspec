import type { AuditResult } from "../crawl/crawl";
import type { Finding } from "../legacy-types";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function elem(name: string, value: string | number | undefined, indent = "    "): string {
  if (value === undefined || value === null || value === "") return "";
  return `${indent}<${name}>${escapeXml(String(value))}</${name}>`;
}

function renderFinding(f: Finding, indent = "    "): string {
  const parts: string[] = [];
  parts.push(`${indent}<finding>`);
  const child = indent + "  ";
  parts.push(elem("id", f.id, child));
  parts.push(elem("severity", f.severity, child));
  parts.push(elem("category", f.category, child));
  parts.push(elem("confidence", f.confidence, child));
  parts.push(elem("effort", f.effort, child));
  parts.push(elem("status", f.status, child));
  parts.push(elem("businessImpact", f.businessImpact, child));
  if (f.framework) parts.push(elem("framework", f.framework, child));
  parts.push(elem("title", f.title, child));
  parts.push(elem("evidence", f.evidence, child));
  parts.push(elem("recommendation", f.recommendation, child));
  parts.push(elem("impact", f.impact, child));
  parts.push(elem("createdAt", f.createdAt, child));
  parts.push(elem("updatedAt", f.updatedAt, child));
  if (f.refs && f.refs.length) {
    parts.push(`${child}<refs>`);
    for (const r of f.refs) parts.push(`${child}  <ref>${escapeXml(r)}</ref>`);
    parts.push(`${child}</refs>`);
  }
  parts.push(`${indent}</finding>`);
  return parts.filter(Boolean).join("\n");
}

export function renderXmlReport(result: AuditResult): string {
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push("<auditReport>");
  lines.push(elem("startUrl", result.startUrl, "  "));
  lines.push(elem("finalUrl", result.finalUrl, "  "));
  lines.push(elem("score", result.score, "  "));
  lines.push(elem("pagesScanned", result.pagesScanned, "  "));
  lines.push(elem("startedAt", result.startedAt, "  "));
  lines.push(elem("finishedAt", result.finishedAt, "  "));
  lines.push("  <findings>");
  for (const f of result.findings) lines.push(renderFinding(f));
  lines.push("  </findings>");
  lines.push("</auditReport>");
  return lines.filter(Boolean).join("\n");
}
