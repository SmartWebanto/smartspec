import { describe, it, expect } from "vitest";
import { sitemapModule } from "../../../src/audit/modules/sitemap";
import { parseHtml } from "../../../src/crawl/parse-html";

function ctx(url: string, sitemapXml: string | null) {
  return { url, parsed: parseHtml("<html></html>", url), sitemapXml };
}

describe("sitemapModule — vibecoder rules", () => {
  it("emits sitemap-empty when sitemap.xml has 0 <url> entries", async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;
    const findings = await sitemapModule(ctx("https://example.com/", xml));
    const f = findings.find((x) => x.id === "sitemap-empty");
    expect(f).toBeDefined();
    expect(f!.severity).toBe("critical");
  });

  it("emits sitemap-phantom when sitemap lists only placeholder URLs", async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>https://localhost:3000/</loc></url>
<url><loc>https://example.com/your-page-here</loc></url>
</urlset>`;
    const findings = await sitemapModule(ctx("https://example.com/", xml));
    const f = findings.find((x) => x.id === "sitemap-phantom");
    expect(f).toBeDefined();
    expect(f!.severity).toBe("critical");
  });

  it("does NOT emit sitemap-empty or sitemap-phantom when sitemap is healthy", async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>https://example.com/</loc></url>
<url><loc>https://example.com/about</loc></url>
</urlset>`;
    const findings = await sitemapModule(ctx("https://example.com/", xml));
    expect(findings.some((x) => x.id === "sitemap-empty" || x.id === "sitemap-phantom")).toBe(false);
  });

  it("handles namespace-prefixed <ns:urlset> root without emitting sitemap-malformed", async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ns:urlset xmlns:ns="http://www.sitemaps.org/schemas/sitemap/0.9">
<ns:url><ns:loc>https://example.com/a</ns:loc></ns:url>
</ns:urlset>`;
    const findings = await sitemapModule(ctx("https://example.com/", xml));
    expect(findings.some((x) => x.id === "sitemap-malformed")).toBe(false);
    expect(findings.some((x) => x.id === "sitemap-empty")).toBe(false);
  });

  it("emits sitemap-phantom when a placeholder loc has surrounding whitespace", async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>
  https://localhost:3000/foo
</loc></url>
<url><loc>https://example.com/real-page</loc></url>
</urlset>`;
    const findings = await sitemapModule(ctx("https://example.com/", xml));
    expect(findings.some((x) => x.id === "sitemap-phantom")).toBe(true);
  });
});
