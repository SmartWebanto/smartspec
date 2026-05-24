import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startFixtureServer } from "./fixture-server";
import { crawlAudit } from "../../src/crawl/crawl";

describe("e2e: multi-page audit on fixture site", () => {
  let server: { url: string; stop: () => void };

  beforeAll(async () => { server = await startFixtureServer(); });
  afterAll(() => { server.stop(); });

  it("crawls 3 allowed pages, skips robots-blocked /admin", async () => {
    const result = await crawlAudit(server.url, {
      maxPages: 20,
      psiScope: "none",
      userAgent: "smartspec/1.0 (+https://smartspec.dev)",
      requestsPerSecond: 50,
      timeoutMs: 5_000,
    });

    expect(result.pagesScanned).toBe(3);
    expect(result.findings.length).toBeGreaterThan(0);

    const robotsBlocked = result.findings.find((f) => (f as { id: string }).id.includes("robots-blocked"));
    expect(robotsBlocked).toBeDefined();
    expect((robotsBlocked as { refs?: string[] })?.refs?.some((r) => r.endsWith("/admin/secret"))).toBe(true);
  }, 30_000);
});
