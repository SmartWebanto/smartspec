import { describe, it, expect, vi } from "vitest";

vi.mock("../../src/crawl/fetch", async () => {
  const actual = await vi.importActual<typeof import("../../src/crawl/fetch")>("../../src/crawl/fetch");
  const handler = async (url: string) => {
    if (url.endsWith("/sitemap.xml")) {
      return {
        status: 200,
        body: `<?xml version="1.0" encoding="UTF-8"?>
          <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <sitemap><loc>https://example.com/sitemap-1.xml</loc></sitemap>
            <sitemap><loc>https://example.com/sitemap-2.xml</loc></sitemap>
          </sitemapindex>`,
        finalUrl: url, headers: {},
      };
    }
    if (url.endsWith("/sitemap-1.xml")) {
      return {
        status: 200,
        body: `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <url><loc>https://example.com/a</loc></url>
            <url><loc>https://example.com/b</loc></url>
          </urlset>`,
        finalUrl: url, headers: {},
      };
    }
    if (url.endsWith("/sitemap-2.xml")) {
      return {
        status: 200,
        body: `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <url><loc>https://example.com/c</loc></url>
          </urlset>`,
        finalUrl: url, headers: {},
      };
    }
    return null;
  };
  return {
    ...actual,
    fetchText: vi.fn(handler),
    fetchTextWith: vi.fn(handler),
  };
});

import { discoverFromSitemap } from "../../src/crawl/crawl";
import type { FetchWithOptions } from "../../src/crawl/fetch";

const stubFetchOpts: FetchWithOptions = {
  limiter: { acquire: async () => {} } as never,
  retry: { maxAttempts: 1, baseDelayMs: 1 },
};

describe("discoverFromSitemap (nested)", () => {
  it("follows sitemapindex and aggregates child URLs", async () => {
    const urls = await discoverFromSitemap("https://example.com", 10, stubFetchOpts);
    expect(urls).toEqual([
      "https://example.com/a",
      "https://example.com/b",
      "https://example.com/c",
    ]);
  });

  it("respects max cap across all children", async () => {
    const urls = await discoverFromSitemap("https://example.com", 2, stubFetchOpts);
    expect(urls!.length).toBe(2);
  });
});
