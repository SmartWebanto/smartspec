import type { AuditResult } from "../crawl/crawl";
import type { Finding } from "../legacy-types";

// LLM-optimized format. Anthropic-style XML tags + a leading instruction block
// so the output can be piped directly into Claude or any other LLM as context.
// Tags are flat and concise (attributes for short data, content for long
// fields) to keep token cost low while preserving structure.

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function attr(key: string, value: string | number | undefined): string {
  if (value === undefined || value === null || value === "") return "";
  return ` ${key}="${escape(String(value)).replace(/"/g, "&quot;")}"`;
}

function renderFinding(f: Finding): string {
  const head =
    `<finding` +
    attr("severity", f.severity) +
    attr("category", f.category) +
    attr("effort", f.effort) +
    attr("confidence", f.confidence) +
    `>`;
  const body: string[] = [];
  body.push(`  <title>${escape(f.title)}</title>`);
  if (f.evidence) body.push(`  <evidence>${escape(f.evidence)}</evidence>`);
  if (f.recommendation) body.push(`  <recommendation>${escape(f.recommendation)}</recommendation>`);
  if (f.impact) body.push(`  <impact>${escape(f.impact)}</impact>`);
  if (f.refs && f.refs.length) {
    body.push(`  <refs>${f.refs.map(escape).join(" ")}</refs>`);
  }
  return [head, ...body, `</finding>`].join("\n");
}

export function renderLlmReport(result: AuditResult): string {
  const lines: string[] = [];
  lines.push(
    "You are given a technical SEO audit. Each finding has a severity (critical|warning|info|pass), category, evidence, and recommendation. Use this report to prioritize fixes, starting with critical issues. The score is computed as pass / (pass + critical*3 + warning) * 100, with info excluded.",
  );
  lines.push("");
  lines.push(
    `<audit` +
      attr("target", result.startUrl) +
      attr("final-url", result.finalUrl) +
      attr("score", result.score) +
      attr("pages-scanned", result.pagesScanned) +
      `>`,
  );
  for (const f of result.findings) lines.push(renderFinding(f));
  lines.push("</audit>");
  return lines.join("\n");
}
