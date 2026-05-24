import { describe, it, expect } from "vitest";
import { filterByRobots } from "../../src/crawl/crawl";

describe("filterByRobots", () => {
  it("removes URLs blocked by robots and returns informational findings", () => {
    const robotsBody = "User-agent: *\nDisallow: /admin\n";
    const urls = [
      "https://example.com/",
      "https://example.com/about",
      "https://example.com/admin/users",
    ];
    const r = filterByRobots(urls, robotsBody, "smartspec/1.0");
    expect(r.allowed).toEqual(["https://example.com/", "https://example.com/about"]);
    expect(r.blockedFindings.length).toBe(1);
    expect(r.blockedFindings[0].id).toContain("robots-blocked");
    expect(r.blockedFindings[0].severity).toBe("info");
    expect(r.blockedFindings[0].refs).toContain("https://example.com/admin/users");
  });

  it("passes everything through when robotsBody is null", () => {
    const r = filterByRobots(["https://example.com/"], null, "smartspec/1.0");
    expect(r.allowed).toEqual(["https://example.com/"]);
    expect(r.blockedFindings).toEqual([]);
  });
});
