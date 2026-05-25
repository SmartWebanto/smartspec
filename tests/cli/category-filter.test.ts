import { describe, it, expect } from "vitest";
import { filterFindingsByCategory, stripSuggestedFixes } from "../../src/crawl/crawl";
import type { Finding } from "../../src/legacy-types";

const sample: Finding[] = [
  { id: "1", rule: "img.alt", category: "images", severity: "warning", title: "x", description: "y" } as unknown as Finding,
  { id: "2", rule: "a11y.contrast", category: "a11y", severity: "info", title: "x", description: "y" } as unknown as Finding,
  { id: "3", rule: "seo.title", category: "seo", severity: "critical", title: "x", description: "y", action: "fix this" } as unknown as Finding,
];

describe("filterFindingsByCategory", () => {
  it("keeps only findings in the requested set", () => {
    const r = filterFindingsByCategory(sample, ["seo", "a11y"]);
    expect(r.map((f) => f.category)).toEqual(["a11y", "seo"]);
  });

  it("accepts public category aliases", () => {
    const aliased: Finding[] = [
      { id: "1", rule: "llms.missing", category: "ai-readiness", severity: "warning", title: "x", description: "y" } as unknown as Finding,
      { id: "2", rule: "content.thin", category: "content", severity: "warning", title: "x", description: "y" } as unknown as Finding,
    ];

    expect(filterFindingsByCategory(aliased, ["llms"]).map((f) => f.category)).toEqual(["ai-readiness"]);
    expect(filterFindingsByCategory(aliased, ["content-quality"]).map((f) => f.category)).toEqual(["content"]);
  });

  it("returns all findings when categories is undefined or empty", () => {
    expect(filterFindingsByCategory(sample, undefined)).toHaveLength(3);
    expect(filterFindingsByCategory(sample, [])).toHaveLength(3);
  });
});

describe("stripSuggestedFixes", () => {
  it("removes the action field from every finding", () => {
    const r = stripSuggestedFixes(sample);
    expect(r.every((f) => !("action" in f) || (f as { action?: unknown }).action == null)).toBe(true);
  });
});
