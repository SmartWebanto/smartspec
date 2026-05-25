import type { AuditResult } from "../crawl/crawl";
import type { Finding } from "../legacy-types";

const SEV_ORDER: Finding["severity"][] = ["critical", "warning", "info", "pass"];
const SEV_LABEL: Record<Finding["severity"], string> = {
  critical: "Critical",
  warning: "Warnings",
  info: "Info",
  pass: "Passes",
};

function counts(findings: Finding[]) {
  const c: Record<Finding["severity"], number> = { critical: 0, warning: 0, info: 0, pass: 0 };
  for (const f of findings) c[f.severity]++;
  return c;
}

function escapeMd(s: string): string {
  return s.replace(/\|/g, "\\|");
}

function renderFinding(f: Finding, n: number): string {
  const parts: string[] = [];
  parts.push(`### ${n}. ${f.title}`);
  parts.push("");
  parts.push(
    `**Category:** \`${f.category}\` · **Effort:** ${f.effort} · **Confidence:** ${f.confidence}`,
  );
  if (f.evidence) {
    parts.push("");
    parts.push("**Evidence:**");
    parts.push("");
    parts.push("```");
    parts.push(f.evidence);
    parts.push("```");
  }
  if (f.recommendation) {
    parts.push("");
    parts.push(`**Fix:** ${f.recommendation}`);
  }
  if (f.impact) {
    parts.push("");
    parts.push(`**Impact:** ${f.impact}`);
  }
  if (f.refs && f.refs.length) {
    parts.push("");
    parts.push("**Refs:**");
    for (const r of f.refs) parts.push(`- ${r}`);
  }
  return parts.join("\n");
}

export function renderMarkdownReport(result: AuditResult): string {
  const c = counts(result.findings);
  const lines: string[] = [];
  lines.push(`# Audit report — ${result.startUrl}`);
  lines.push("");
  lines.push(`**Score:** ${result.score}/100  `);
  lines.push(`**Final URL:** ${result.finalUrl}  `);
  lines.push(`**Pages scanned:** ${result.pagesScanned}  `);
  lines.push(`**Started:** ${result.startedAt}  `);
  lines.push(`**Finished:** ${result.finishedAt}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("| Severity | Count |");
  lines.push("|---|---:|");
  for (const s of SEV_ORDER) lines.push(`| ${SEV_LABEL[s]} | ${c[s]} |`);
  lines.push("");

  for (const sev of SEV_ORDER) {
    if (sev === "pass") continue;
    const group = result.findings.filter((f) => f.severity === sev);
    if (group.length === 0) continue;
    lines.push(`## ${SEV_LABEL[sev]} (${group.length})`);
    lines.push("");
    group.forEach((f, i) => {
      lines.push(renderFinding(f, i + 1));
      lines.push("");
      lines.push("---");
      lines.push("");
    });
  }

  return lines.join("\n");
}
