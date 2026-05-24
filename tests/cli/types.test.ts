import { describe, it, expect, expectTypeOf } from "vitest";
import type { Finding, SuggestedFix, AuditModule, PageSnapshot, Category } from "../../src/types";

describe("src/types.ts", () => {
  it("Finding has required fields", () => {
    expectTypeOf<Finding>().toHaveProperty("id");
    expectTypeOf<Finding>().toHaveProperty("rule_id");
    expectTypeOf<Finding>().toHaveProperty("category");
    expectTypeOf<Finding>().toHaveProperty("severity");
    expectTypeOf<Finding>().toHaveProperty("url");
    expectTypeOf<Finding>().toHaveProperty("title");
    expectTypeOf<Finding>().toHaveProperty("description");
    expectTypeOf<Finding>().toHaveProperty("detected_at");
    expectTypeOf<Finding>().toHaveProperty("source");
  });

  it("SuggestedFix is one of the spec'd types", () => {
    const fix: SuggestedFix = { type: "html", snippet: "<img alt=\"\" />" };
    expectTypeOf(fix.type).toEqualTypeOf<"html" | "json-ld" | "redirect" | "robots" | "header" | "config" | "text">();
  });

  it("Category includes all 21 spec'd categories", () => {
    const categories: Category[] = [
      "seo", "performance", "a11y", "security", "mobile",
      "content", "eeat", "analytics", "schema", "images",
      "links", "local-seo", "i18n", "robots", "sitemap",
      "redirects", "legal", "social", "video", "adblock", "ai",
    ];
    expect(categories.length).toBe(21);
  });

  it("AuditModule has the expected shape", () => {
    expectTypeOf<AuditModule>().toHaveProperty("id");
    expectTypeOf<AuditModule>().toHaveProperty("category");
    expectTypeOf<AuditModule>().toHaveProperty("audit");
  });
});
