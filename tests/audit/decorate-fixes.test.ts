import { describe, it, expect } from "vitest";
import { decorateFindingsWithAiTool } from "../../src/audit/decorate-fixes";
import { finding } from "../../src/audit/finding";

describe("decorateFindingsWithAiTool", () => {
  it("prepends a Lovable-specific tip to page-noindex when URL is a Lovable preview", () => {
    const raw = finding(
      "page-noindex",
      "page",
      "critical",
      "Page is marked noindex",
      'meta robots = "noindex,nofollow"',
      "Remove the noindex directive.",
      "https://abc.lovable.app/",
    );
    const html = "<html></html>";
    const [out] = decorateFindingsWithAiTool([raw], "https://abc.lovable.app/", html);
    expect(out.recommendation).toMatch(/Lovable/);
    expect(out.recommendation).toContain("Remove the noindex directive.");
  });

  it("prepends a v0-specific tip to page-title-default when title looks like v0 scaffold", () => {
    const raw = finding(
      "page-title-default",
      "page",
      "critical",
      "Title is a default AI-tool placeholder",
      'Current title: "v0 by Vercel".',
      "Replace with a real title.",
      "https://example.com/",
    );
    const html = "<html><head><title>v0 by Vercel</title></head></html>";
    const [out] = decorateFindingsWithAiTool([raw], "https://example.com/", html);
    expect(out.recommendation).toMatch(/v0/);
  });

  it("leaves non-vibecoder-rule findings untouched", () => {
    const raw = finding(
      "page-title-missing",
      "page",
      "critical",
      "Page has no <title>",
      "",
      "Add a <title>.",
      "https://abc.lovable.app/",
    );
    const [out] = decorateFindingsWithAiTool([raw], "https://abc.lovable.app/", "<html></html>");
    expect(out.recommendation).toBe("Add a <title>.");
  });

  it("leaves findings untouched when no AI tool is detected", () => {
    const raw = finding(
      "page-noindex",
      "page",
      "critical",
      "Page is marked noindex",
      "",
      "Remove the noindex directive.",
      "https://acme.com/",
    );
    const [out] = decorateFindingsWithAiTool([raw], "https://acme.com/", "<html></html>");
    expect(out.recommendation).toBe("Remove the noindex directive.");
  });
});
