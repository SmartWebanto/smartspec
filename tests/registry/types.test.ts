import { describe, it, expect } from "vitest";
import {
  isValidRuleId,
  RULE_CATEGORIES,
  RuleDefinition,
} from "../../src/audit/rules/types";

describe("Rule Registry Types", () => {
  describe("isValidRuleId()", () => {
    it("should accept simple dotted rule IDs", () => {
      expect(isValidRuleId("page.title-missing")).toBe(true);
    });

    it("should accept multi-word category names with hyphens", () => {
      expect(isValidRuleId("ai-readiness.llms-txt-missing")).toBe(true);
    });

    it("should reject IDs with no dot separator", () => {
      expect(isValidRuleId("pagetitle")).toBe(false);
    });

    it("should reject IDs with multiple dots", () => {
      expect(isValidRuleId("page.title.missing")).toBe(false);
    });

    it("should reject IDs with uppercase letters", () => {
      expect(isValidRuleId("Page.titleMissing")).toBe(false);
    });

    it("should reject IDs with spaces or special characters", () => {
      expect(isValidRuleId("page.title missing")).toBe(false);
      expect(isValidRuleId("page@title")).toBe(false);
    });
  });

  describe("RULE_CATEGORIES", () => {
    it("should contain exactly 16 categories", () => {
      expect(RULE_CATEGORIES).toHaveLength(16);
    });

    it("should contain all required categories", () => {
      const expectedCategories = [
        "page",
        "schema",
        "images",
        "links",
        "a11y",
        "hreflang",
        "social",
        "robots",
        "sitemap",
        "ai-readiness",
        "redirects",
        "security",
        "performance",
        "mobile",
        "content",
        "analytics",
      ];
      expect(RULE_CATEGORIES).toEqual(expect.arrayContaining(expectedCategories));
    });
  });

  describe("RuleDefinition type", () => {
    it("should allow valid rule definitions", () => {
      const rule: RuleDefinition = {
        id: "page.title-missing",
        category: "page",
        defaultSeverity: "critical",
        defaultEffort: "low",
        defaultConfidence: "confirmed",
        title: "Missing page title",
        description: "The page does not have a title tag",
        recommendation: "Add a descriptive title tag to the page",
        businessImpact: "ranking",
        framework: "SEO",
      };
      expect(rule).toBeDefined();
    });

    it("should allow optional fields (docKey, requires)", () => {
      const rule: RuleDefinition = {
        id: "ai-readiness.llms-txt-missing",
        category: "ai-readiness",
        defaultSeverity: "warning",
        defaultEffort: "medium",
        defaultConfidence: "likely",
        title: "Missing llms.txt",
        description: "The site does not have an llms.txt file",
        recommendation: "Create an llms.txt file at the root",
        businessImpact: "crawl",
        framework: "AEO",
        docKey: "ai-readiness/llms-txt",
        requires: "llms",
      };
      expect(rule).toBeDefined();
    });
  });
});
