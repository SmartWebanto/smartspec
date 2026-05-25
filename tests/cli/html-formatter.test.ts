import { describe, it, expect } from "vitest";
import { renderHtmlReport, escapeHtml, safeHref } from "../../src/formatters/html";
import type { AuditResult } from "../../src/crawl/crawl";
import type { Finding } from "../../src/legacy-types";

const f = (
  id: string,
  category: string,
  severity: Finding["severity"],
  overrides: Partial<Finding> = {},
): Finding => ({
  id,
  title: `t-${id}`,
  severity,
  confidence: "confirmed",
  effort: "low",
  status: "backlog",
  category,
  evidence: `evidence-${id}`,
  recommendation: `recommendation-${id}`,
  impact: `impact-${id}`,
  businessImpact: "ranking",
  framework: "both",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

const result = (findings: Finding[], overrides: Partial<AuditResult> = {}): AuditResult => ({
  startUrl: "https://example.com",
  finalUrl: "https://example.com",
  pagesScanned: 1,
  startedAt: "2026-05-24T22:00:00Z",
  finishedAt: "2026-05-24T22:00:30Z",
  score: 87,
  findings,
  ...overrides,
});

describe("escapeHtml", () => {
  it("escapes &, <, >, \", '", () => {
    expect(escapeHtml(`<a href="x" class='c'>&</a>`)).toBe(
      "&lt;a href=&quot;x&quot; class=&#39;c&#39;&gt;&amp;&lt;/a&gt;",
    );
  });
});

describe("safeHref", () => {
  it("accepts http, https, mailto", () => {
    expect(safeHref("http://x.com")).toBe("http://x.com");
    expect(safeHref("https://x.com/path")).toBe("https://x.com/path");
    expect(safeHref("mailto:a@b.c")).toBe("mailto:a@b.c");
  });
  it("rejects javascript, data, vbscript, file, custom", () => {
    expect(safeHref("javascript:alert(1)")).toBeNull();
    expect(safeHref("data:text/html,<script>")).toBeNull();
    expect(safeHref("vbscript:msgbox")).toBeNull();
    expect(safeHref("file:///etc/passwd")).toBeNull();
    expect(safeHref("custom://thing")).toBeNull();
  });
});

describe("renderHtmlReport — document structure", () => {
  it("emits a well-formed HTML5 document", () => {
    const html = renderHtmlReport(result([]));
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect((html.match(/<html\b/g) ?? []).length).toBe(1);
    expect((html.match(/<head\b/g) ?? []).length).toBe(1);
    expect((html.match(/<body\b/g) ?? []).length).toBe(1);
  });

  it("contains no <script> tags and no external resource references", () => {
    const html = renderHtmlReport(
      result([f("a", "security", "critical", { refs: ["https://example.com/page"] })]),
    );
    expect(html).not.toMatch(/<script\b/i);
    expect(html).not.toMatch(/<link\b[^>]*rel\s*=\s*['"]?stylesheet/i);
    expect(html).not.toMatch(/<img\b/i);
    expect(html).not.toMatch(/<link\b[^>]*rel\s*=\s*['"]?icon/i);
    const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    expect(styleMatch).not.toBeNull();
    expect(styleMatch![1]).not.toMatch(/@import\b/i);
    expect(styleMatch![1]).not.toMatch(/\burl\s*\(/i);
  });
});

describe("renderHtmlReport — header", () => {
  it("contains overall score, domain, date, and three severity counts", () => {
    const html = renderHtmlReport(
      result([
        f("a", "security", "critical"),
        f("b", "content", "warning"),
        f("c", "content", "warning"),
        f("d", "links", "warning"),
        f("e", "links", "info"),
        f("g", "perf", "info"),
        f("h", "perf", "info"),
        f("i", "perf", "info"),
        f("j", "perf", "info"),
        f("k", "perf", "info"),
      ]),
    );
    expect(html).toContain(">87<");
    expect(html).toContain("example.com");
    expect(html).toContain("2026-05-24");
    expect(html).toMatch(/<strong>1<\/strong>\s*critical/);
    expect(html).toMatch(/<strong>3<\/strong>\s*warning/);
    expect(html).toMatch(/<strong>6<\/strong>\s*info/);
  });
});

describe("renderHtmlReport — scorecard", () => {
  it("lists only categories that have open (non-done) findings", () => {
    const html = renderHtmlReport(
      result([
        f("a", "security", "critical"),
        f("b", "content", "pass"),
        f("c", "content", "warning"),
        f("d", "links", "critical", { status: "done" }),
      ]),
    );
    expect(html).toMatch(/<div class="tile [^"]+"><span class="n">0<\/span><span class="l">security<\/span><\/div>/);
    expect(html).toMatch(/<div class="tile [^"]+"><span class="n">50<\/span><span class="l">content<\/span><\/div>/);
    expect(html).not.toMatch(/<span class="l">links<\/span>/);
  });
});

describe("renderHtmlReport — kanban board", () => {
  it("emits exactly four status columns labeled backlog/todo/doing/done", () => {
    const html = renderHtmlReport(result([]));
    expect(html).toContain('data-status="backlog"');
    expect(html).toContain('data-status="todo"');
    expect(html).toContain('data-status="doing"');
    expect(html).toContain('data-status="done"');
    expect((html.match(/<section class="col"/g) ?? []).length).toBe(4);
  });

  it("places findings in the column matching their status", () => {
    const html = renderHtmlReport(
      result([
        f("a", "security", "critical", { status: "backlog", title: "IN-BACKLOG" }),
        f("b", "content", "warning", { status: "doing", title: "IN-DOING" }),
        f("c", "links", "info", { status: "done", title: "IN-DONE" }),
      ]),
    );
    const backlogCol = html.match(/data-status="backlog"[\s\S]*?<\/section>/)?.[0] ?? "";
    const doingCol = html.match(/data-status="doing"[\s\S]*?<\/section>/)?.[0] ?? "";
    const doneCol = html.match(/data-status="done"[\s\S]*?<\/section>/)?.[0] ?? "";
    expect(backlogCol).toContain("IN-BACKLOG");
    expect(backlogCol).not.toContain("IN-DOING");
    expect(doingCol).toContain("IN-DOING");
    expect(doneCol).toContain("IN-DONE");
  });

  it("includes done findings in the done column (no longer filtered out)", () => {
    const html = renderHtmlReport(
      result([
        f("a", "links", "critical", { status: "done", title: "DONE-CARD" }),
        f("b", "content", "warning"),
      ]),
    );
    expect(html).toContain("DONE-CARD");
    const doneCol = html.match(/data-status="done"[\s\S]*?<\/section>/)?.[0] ?? "";
    expect(doneCol).toContain("DONE-CARD");
  });

  it("renders an empty-state placeholder for columns with no findings", () => {
    const html = renderHtmlReport(result([f("a", "security", "critical")]));
    const doneCol = html.match(/data-status="done"[\s\S]*?<\/section>/)?.[0] ?? "";
    expect(doneCol).toContain("No findings");
  });

  it("column count badge matches the number of findings in that status", () => {
    const html = renderHtmlReport(
      result([
        f("a", "x", "critical", { status: "backlog" }),
        f("b", "x", "warning", { status: "backlog" }),
        f("c", "x", "info", { status: "todo" }),
      ]),
    );
    const backlogCol = html.match(/data-status="backlog"[\s\S]*?<\/section>/)?.[0] ?? "";
    const todoCol = html.match(/data-status="todo"[\s\S]*?<\/section>/)?.[0] ?? "";
    expect(backlogCol).toMatch(/<span class="count">2<\/span>/);
    expect(todoCol).toMatch(/<span class="count">1<\/span>/);
  });
});

describe("renderHtmlReport — finding cards", () => {
  it("uses <details>/<summary> for collapsible cards with no JS", () => {
    const html = renderHtmlReport(result([f("a", "security", "critical")]));
    expect(html).toMatch(/<details class="finding">/);
    expect(html).toMatch(/<summary>/);
  });

  it("escapes user-derived strings in titles", () => {
    const html = renderHtmlReport(
      result([f("a", "security", "critical", { title: "Missing <meta name=description>" })]),
    );
    expect(html).toContain("Missing &lt;meta name=description&gt;");
    expect(html).not.toMatch(/Missing <meta\s/);
  });

  it("renders safe URLs as anchors and unsafe URLs as plain text", () => {
    const html = renderHtmlReport(
      result([
        f("a", "security", "warning", { refs: ["https://example.com/safe"] }),
        f("b", "security", "warning", { refs: ["javascript:alert(1)"] }),
      ]),
    );
    expect(html).toContain('<a href="https://example.com/safe">');
    expect(html).not.toMatch(/href=['"]javascript:/i);
    expect(html).toContain("javascript:alert(1)");
  });

  it("sorts cards within a column by severity (critical → warning → info)", () => {
    const html = renderHtmlReport(
      result([
        f("a", "x", "info", { title: "INFO-CARD" }),
        f("b", "x", "critical", { title: "CRIT-CARD" }),
        f("c", "x", "warning", { title: "WARN-CARD" }),
      ]),
    );
    const backlogCol = html.match(/data-status="backlog"[\s\S]*?<\/section>/)?.[0] ?? "";
    const idxCrit = backlogCol.indexOf("CRIT-CARD");
    const idxWarn = backlogCol.indexOf("WARN-CARD");
    const idxInfo = backlogCol.indexOf("INFO-CARD");
    expect(idxCrit).toBeGreaterThan(-1);
    expect(idxCrit).toBeLessThan(idxWarn);
    expect(idxWarn).toBeLessThan(idxInfo);
  });
});
