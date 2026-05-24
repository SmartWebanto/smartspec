import { describe, it, expect } from "vitest";
import { pageModule } from "../../../src/audit/modules/page";
import { parseHtml } from "../../../src/crawl/parse-html";

function ctx(url: string, html: string) {
  return { url, parsed: parseHtml(html, url) };
}

describe("pageModule — vibecoder rules", () => {
  it("emits page-title-default when title matches v0 boilerplate", async () => {
    const findings = await pageModule(
      ctx("https://example.com/", "<html><head><title>v0 by Vercel</title></head></html>"),
    );
    const f = findings.find((x) => x.id === "page-title-default");
    expect(f).toBeDefined();
    expect(f!.severity).toBe("critical");
  });

  it("emits page-title-default for 'Vite App'", async () => {
    const findings = await pageModule(
      ctx("https://example.com/", "<html><head><title>Vite App</title></head></html>"),
    );
    expect(findings.some((x) => x.id === "page-title-default")).toBe(true);
  });

  it("emits page-canonical-localhost when canonical points at localhost", async () => {
    const findings = await pageModule(
      ctx(
        "https://acme.com/",
        '<html><head><title>OK</title><link rel="canonical" href="http://localhost:3000/"></head></html>',
      ),
    );
    const f = findings.find((x) => x.id === "page-canonical-localhost");
    expect(f).toBeDefined();
    expect(f!.severity).toBe("critical");
  });

  it("emits page-canonical-localhost when canonical points at a Vercel branch preview", async () => {
    const findings = await pageModule(
      ctx(
        "https://acme.com/",
        '<html><head><title>OK</title><link rel="canonical" href="https://my-app-git-feature-team.vercel.app/"></head></html>',
      ),
    );
    expect(findings.some((x) => x.id === "page-canonical-localhost")).toBe(true);
  });

  it("does NOT emit page-canonical-localhost for production *.vercel.app URLs without -git-", async () => {
    const findings = await pageModule(
      ctx(
        "https://acme.com/",
        '<html><head><title>OK</title><link rel="canonical" href="https://my-app.vercel.app/about"></head></html>',
      ),
    );
    expect(findings.some((x) => x.id === "page-canonical-localhost")).toBe(false);
  });

  it("emits page-empty-source-html when body has <100 chars of text", async () => {
    const findings = await pageModule(
      ctx(
        "https://example.com/",
        '<html><head><title>SPA</title></head><body><div id="root"></div></body></html>',
      ),
    );
    const f = findings.find((x) => x.id === "page-empty-source-html");
    expect(f).toBeDefined();
    expect(f!.severity).toBe("critical");
  });

  it("does NOT emit page-empty-source-html when body has substantial text", async () => {
    const long = "x".repeat(500);
    const findings = await pageModule(
      ctx("https://example.com/", `<html><head><title>OK</title></head><body><p>${long}</p></body></html>`),
    );
    expect(findings.some((x) => x.id === "page-empty-source-html")).toBe(false);
  });

  it("no longer emits page-viewport-missing (moved to mobile module)", async () => {
    const findings = await pageModule(
      ctx("https://example.com/", "<html><head><title>OK</title></head></html>"),
    );
    expect(findings.some((x) => x.id === "page-viewport-missing")).toBe(false);
  });
});
