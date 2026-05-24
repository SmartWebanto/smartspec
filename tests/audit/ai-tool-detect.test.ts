import { describe, it, expect } from "vitest";
import { detectAiTool, type AiTool } from "../../src/audit/ai-tool-detect";

describe("detectAiTool", () => {
  const cases: Array<{ url: string; html: string; expected: AiTool | null }> = [
    { url: "https://abc.lovable.app/", html: "<html></html>", expected: "lovable" },
    { url: "https://preview--xyz.lovable.app/x", html: "<html></html>", expected: "lovable" },
    { url: "https://example.com/", html: '<html><head><title>v0 by Vercel</title></head></html>', expected: "v0" },
    { url: "https://example.com/", html: '<html><head><meta name="generator" content="Bolt"></head></html>', expected: "bolt" },
    { url: "https://abc.bolt.host/", html: "<html></html>", expected: "bolt" },
    { url: "https://example.com/", html: "<html><body>hello</body></html>", expected: null },
    { url: "https://abc.replit.app/", html: "<html></html>", expected: "replit" },
    { url: "https://bolt.new/x/abc", html: "<html></html>", expected: "bolt" },
    { url: "https://my-project.bolt.new/", html: "<html></html>", expected: "bolt" },
    { url: "https://example.stackblitz.io/", html: "<html></html>", expected: null }, // no longer auto-classified as Bolt
    { url: "https://my.replit.dev/", html: "<html></html>", expected: "replit" },
    { url: "https://my.replit.co/", html: "<html></html>", expected: "replit" },
    // HTML-embedded URL signals (canonical, og:url, etc. pointing at AI-tool preview)
    {
      url: "http://localhost:9999/page",
      html: '<html><head><link rel="canonical" href="https://preview--abc.lovable.app/"></head></html>',
      expected: "lovable",
    },
    {
      url: "http://localhost:9999/page",
      html: '<html><head><meta property="og:url" content="https://xyz.bolt.host/"></head></html>',
      expected: "bolt",
    },
  ];

  for (const c of cases) {
    it(`returns ${c.expected ?? "null"} for ${c.url}`, () => {
      expect(detectAiTool(c.url, c.html)).toBe(c.expected);
    });
  }
});
