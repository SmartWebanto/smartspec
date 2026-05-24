import { describe, it, expect } from "vitest";
import { parseRobots, isAllowed } from "../../src/crawl/robots-rules";

const FIXTURE = `
User-agent: *
Disallow: /admin
Disallow: /private/

User-agent: smartspec
Allow: /private/public/
Disallow: /private/

Sitemap: https://example.com/sitemap.xml
`;

describe("robots-rules", () => {
  it("parses User-agent / Disallow / Allow blocks", () => {
    const r = parseRobots(FIXTURE);
    expect(r.groups.size).toBeGreaterThanOrEqual(2);
    expect(r.sitemaps).toContain("https://example.com/sitemap.xml");
  });

  it("denies /admin for any UA via the wildcard group", () => {
    const r = parseRobots(FIXTURE);
    expect(isAllowed(r, "Mozilla/5.0", "https://example.com/admin/login")).toBe(false);
  });

  it("denies /private/ for the wildcard group", () => {
    const r = parseRobots(FIXTURE);
    expect(isAllowed(r, "Mozilla/5.0", "https://example.com/private/secret")).toBe(false);
  });

  it("the smartspec-specific group overrides wildcard for its scope", () => {
    const r = parseRobots(FIXTURE);
    expect(isAllowed(r, "smartspec/1.0", "https://example.com/private/public/page")).toBe(true);
    expect(isAllowed(r, "smartspec/1.0", "https://example.com/private/other")).toBe(false);
  });

  it("allows everything when robots.txt is empty", () => {
    const r = parseRobots("");
    expect(isAllowed(r, "smartspec/1.0", "https://example.com/anything")).toBe(true);
  });

  it("treats null/undefined robots as allow-all (no file fetched)", () => {
    expect(isAllowed(null, "smartspec/1.0", "https://example.com/x")).toBe(true);
  });
});
