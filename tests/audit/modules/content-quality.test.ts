import { describe, it, expect } from "vitest";
import { contentQualityModule } from "../../../src/audit/modules/content-quality";
import { parseHtml } from "../../../src/crawl/parse-html";

function ctx(url: string, html: string) {
  return { url, parsed: parseHtml(html, url) };
}

describe("contentQualityModule", () => {
  it("emits content-thin when body text is shorter than 300 chars on a non-root URL", async () => {
    const findings = await contentQualityModule(
      ctx("https://example.com/about", "<html><body><p>Hello.</p></body></html>"),
    );
    const f = findings.find((x) => x.id === "content-thin");
    expect(f).toBeDefined();
    expect(f!.severity).toBe("warning");
  });

  it("does NOT emit content-thin when body text is substantial", async () => {
    const body = "x".repeat(800);
    const findings = await contentQualityModule(
      ctx("https://example.com/about", `<html><body><p>${body}</p></body></html>`),
    );
    expect(findings.some((x) => x.id === "content-thin")).toBe(false);
  });

  it("does NOT emit content-thin on the root path '/'", async () => {
    const findings = await contentQualityModule(
      ctx("https://example.com/", "<html><body><p>Hi.</p></body></html>"),
    );
    expect(findings.some((x) => x.id === "content-thin")).toBe(false);
  });

  it("emits content-boilerplate-hero when hero matches AI-template phrase", async () => {
    const html = `<html><body><h1>Welcome to my website</h1><p>This is a description of my amazing site.</p></body></html>`;
    const findings = await contentQualityModule(ctx("https://example.com/", html));
    const f = findings.find((x) => x.id === "content-boilerplate-hero");
    expect(f).toBeDefined();
    expect(f!.severity).toBe("info");
  });

  it("does NOT emit content-boilerplate-hero for a unique hero", async () => {
    const html = `<html><body><h1>SaaS revenue forecasting in 30 seconds</h1></body></html>`;
    const findings = await contentQualityModule(ctx("https://example.com/", html));
    expect(findings.some((x) => x.id === "content-boilerplate-hero")).toBe(false);
  });

  it("does NOT emit content-thin on /index.html (treated as home)", async () => {
    const findings = await contentQualityModule(
      ctx("https://example.com/index.html", "<html><body><p>Hi.</p></body></html>"),
    );
    expect(findings.some((x) => x.id === "content-thin")).toBe(false);
  });

  it("emits content-boilerplate-hero on a non-home URL too", async () => {
    const findings = await contentQualityModule(
      ctx("https://example.com/about", "<html><body><h1>Hello World</h1><p>About us.</p></body></html>"),
    );
    expect(findings.some((x) => x.id === "content-boilerplate-hero")).toBe(true);
  });
});
