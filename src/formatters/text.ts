import type { AuditResult } from "../crawl/crawl";
import type { Finding } from "../legacy-types";

const SEV_ORDER: Finding["severity"][] = ["critical", "warning", "info", "pass"];

function wrap(text: string, width = 78, indent = "    "): string {
  const lines: string[] = [];
  for (const para of text.split(/\n/)) {
    const words = para.split(/\s+/);
    let line = indent;
    for (const w of words) {
      if (line.length + w.length + 1 > width) {
        lines.push(line);
        line = indent + w;
      } else {
        line = line === indent ? indent + w : line + " " + w;
      }
    }
    if (line.trim()) lines.push(line);
  }
  return lines.join("\n");
}

export function renderTextReport(result: AuditResult): string {
  const lines: string[] = [];
  lines.push("AUDIT REPORT");
  lines.push("============");
  lines.push("");
  lines.push(`Target:        ${result.startUrl}`);
  lines.push(`Final URL:     ${result.finalUrl}`);
  lines.push(`Score:         ${result.score}/100`);
  lines.push(`Pages scanned: ${result.pagesScanned}`);
  lines.push(`Started:       ${result.startedAt}`);
  lines.push(`Finished:      ${result.finishedAt}`);
  lines.push("");
  lines.push("SUMMARY");
  lines.push("-------");
  const c: Record<Finding["severity"], number> = { critical: 0, warning: 0, info: 0, pass: 0 };
  for (const f of result.findings) c[f.severity]++;
  for (const s of SEV_ORDER) lines.push(`  ${s.padEnd(8)} ${c[s]}`);
  lines.push("");

  for (const sev of SEV_ORDER) {
    if (sev === "pass") continue;
    const group = result.findings.filter((f) => f.severity === sev);
    if (group.length === 0) continue;
    const header = `${sev.toUpperCase()} (${group.length})`;
    lines.push(header);
    lines.push("-".repeat(header.length));
    lines.push("");
    group.forEach((f, i) => {
      lines.push(`[${i + 1}] ${f.title}`);
      lines.push(`    category: ${f.category}  |  effort: ${f.effort}  |  confidence: ${f.confidence}`);
      if (f.evidence) {
        lines.push("");
        lines.push("    Evidence:");
        lines.push(wrap(f.evidence));
      }
      if (f.recommendation) {
        lines.push("");
        lines.push("    Fix:");
        lines.push(wrap(f.recommendation));
      }
      if (f.impact) {
        lines.push("");
        lines.push("    Impact:");
        lines.push(wrap(f.impact));
      }
      lines.push("");
    });
  }

  return lines.join("\n");
}
