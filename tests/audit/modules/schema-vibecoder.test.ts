import { describe, it, expect } from "vitest";
import { schemaModule } from "../../../src/audit/modules/schema";
import { parseHtml } from "../../../src/crawl/parse-html";

function ctx(url: string, html: string) {
  return { url, parsed: parseHtml(html, url) };
}

const ORG_LD = `<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Acme"}</script>`;
const WEBSITE_LD = `<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"Acme","url":"https://acme.com"}</script>`;
const BREADCRUMB_LD = `<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[]}</script>`;

describe("schemaModule — vibecoder rules", () => {
  it("emits schema-missing-organization when homepage has JSON-LD but no Organization", async () => {
    const findings = await schemaModule(
      ctx("https://acme.com/", `<html><head>${BREADCRUMB_LD}</head></html>`),
    );
    const f = findings.find((x) => x.id === "schema-missing-organization");
    expect(f).toBeDefined();
    expect(f!.severity).toBe("warning");
  });

  it("does NOT emit schema-missing-organization on non-homepage URLs", async () => {
    const findings = await schemaModule(
      ctx("https://acme.com/about", "<html><head></head><body></body></html>"),
    );
    expect(findings.some((x) => x.id === "schema-missing-organization")).toBe(false);
  });

  it("does NOT emit schema-missing-organization when Organization JSON-LD is present", async () => {
    const findings = await schemaModule(ctx("https://acme.com/", `<html><head>${ORG_LD}</head></html>`));
    expect(findings.some((x) => x.id === "schema-missing-organization")).toBe(false);
  });

  it("does NOT emit schema-missing-organization when @type is an array containing 'Organization'", async () => {
    const html = `<html><head><script type="application/ld+json">{"@context":"https://schema.org","@type":["Organization","LocalBusiness"],"name":"Acme"}</script></head></html>`;
    const findings = await schemaModule(ctx("https://acme.com/", html));
    expect(findings.some((x) => x.id === "schema-missing-organization")).toBe(false);
  });

  it("emits schema-missing-website when homepage has JSON-LD but no WebSite", async () => {
    const findings = await schemaModule(
      ctx("https://acme.com/", `<html><head>${BREADCRUMB_LD}</head></html>`),
    );
    const f = findings.find((x) => x.id === "schema-missing-website");
    expect(f).toBeDefined();
    expect(f!.severity).toBe("info");
  });

  it("does NOT emit schema-missing-website when WebSite JSON-LD is present", async () => {
    const findings = await schemaModule(ctx("https://acme.com/", `<html><head>${WEBSITE_LD}</head></html>`));
    expect(findings.some((x) => x.id === "schema-missing-website")).toBe(false);
  });

  it("on empty-head homepage, only schema-jsonld-missing fires (not the missing-organization/website pair)", async () => {
    const findings = await schemaModule(
      ctx("https://acme.com/", "<html><head></head><body></body></html>"),
    );
    expect(findings.some((x) => x.id === "schema-jsonld-missing")).toBe(true);
    expect(findings.some((x) => x.id === "schema-missing-organization")).toBe(false);
    expect(findings.some((x) => x.id === "schema-missing-website")).toBe(false);
  });
});
