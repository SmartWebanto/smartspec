import { describe, it, expect } from "vitest";
import { analyticsModule } from "../../../src/audit/modules/analytics";
import { parseHtml } from "../../../src/crawl/parse-html";

function ctx(url: string, html: string) {
  return { url, parsed: parseHtml(html, url) };
}

describe("analyticsModule", () => {
  it("emits analytics-measurement-id-placeholder when 'G-XXXXXXXXXX' is in source", async () => {
    const html = `<html><head><script>gtag('config', 'G-XXXXXXXXXX');</script></head></html>`;
    const findings = await analyticsModule(ctx("https://example.com/", html));
    const f = findings.find((x) => x.id === "analytics-measurement-id-placeholder");
    expect(f).toBeDefined();
    expect(f!.severity).toBe("warning");
  });

  it("emits analytics-measurement-id-placeholder for 'GTM-XXXX' literal", async () => {
    const html = `<html><head><script>window.dataLayer=window.dataLayer||[];_('GTM-XXXX');</script></head></html>`;
    const findings = await analyticsModule(ctx("https://example.com/", html));
    expect(findings.some((x) => x.id === "analytics-measurement-id-placeholder")).toBe(true);
  });

  it("does NOT emit when a real GA measurement-id is configured", async () => {
    const html = `<html><head><script>gtag('config', 'G-AB12CD34EF');</script></head></html>`;
    const findings = await analyticsModule(ctx("https://example.com/", html));
    expect(findings.some((x) => x.id === "analytics-measurement-id-placeholder")).toBe(false);
  });
});
