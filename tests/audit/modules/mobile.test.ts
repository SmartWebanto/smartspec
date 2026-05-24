import { describe, it, expect } from "vitest";
import { mobileModule } from "../../../src/audit/modules/mobile";
import { parseHtml } from "../../../src/crawl/parse-html";

function ctx(url: string, html: string) {
  return { url, parsed: parseHtml(html, url) };
}

describe("mobileModule", () => {
  it("emits mobile-viewport-missing as critical when <meta viewport> is absent", async () => {
    const findings = await mobileModule(
      ctx("https://example.com/", "<html><head><title>OK</title></head></html>"),
    );
    const f = findings.find((x) => x.id === "mobile-viewport-missing");
    expect(f).toBeDefined();
    expect(f!.severity).toBe("critical");
  });

  it("does NOT emit mobile-viewport-missing when viewport meta is present", async () => {
    const findings = await mobileModule(
      ctx(
        "https://example.com/",
        '<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head></html>',
      ),
    );
    expect(findings.some((x) => x.id === "mobile-viewport-missing")).toBe(false);
  });
});
