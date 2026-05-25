import { describe, it, expect } from "vitest";
import {
  ALL_AUDIT_CATEGORIES,
  AUDIT_CATEGORY_ALIASES,
  invalidAuditCategories,
  normalizeAuditCategory,
} from "../../src/audit/aggregate-passes";

const EXPECTED_CATEGORIES = [
  "a11y",
  "ai-readiness",
  "analytics",
  "content",
  "hreflang",
  "images",
  "links",
  "mobile",
  "page",
  "performance",
  "redirects",
  "robots",
  "schema",
  "security",
  "sitemap",
  "social",
] as const;

const EXPECTED_ALIASES: Record<string, string> = {
  llms: "ai-readiness",
  "content-quality": "content",
};

describe("audit category contract", () => {
  it("publishes exactly 16 audit categories", () => {
    expect(ALL_AUDIT_CATEGORIES).toHaveLength(EXPECTED_CATEGORIES.length);
  });

  for (const category of EXPECTED_CATEGORIES) {
    it(`accepts category "${category}"`, () => {
      expect(ALL_AUDIT_CATEGORIES).toContain(category);
      expect(invalidAuditCategories([category])).toEqual([]);
    });
  }

  it("publishes the documented aliases", () => {
    expect(AUDIT_CATEGORY_ALIASES).toEqual(EXPECTED_ALIASES);
  });

  for (const [alias, canonical] of Object.entries(EXPECTED_ALIASES)) {
    it(`resolves alias "${alias}" to canonical "${canonical}"`, () => {
      expect(normalizeAuditCategory(alias)).toBe(canonical);
      expect(invalidAuditCategories([alias])).toEqual([]);
    });
  }

  it("rejects unknown categories", () => {
    expect(invalidAuditCategories(["fake-category"])).toEqual(["fake-category"]);
  });

  it("accepts a comma list of mixed canonical names and aliases", () => {
    expect(invalidAuditCategories(["security", "llms", "content-quality", "mobile"])).toEqual([]);
  });
});
