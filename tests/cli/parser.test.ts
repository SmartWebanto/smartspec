import { describe, it, expect } from "vitest";
import { parseArgs } from "../../src/cli";

describe("parseArgs", () => {
  it("parses 'audit <url>'", () => {
    const r = parseArgs(["audit", "https://example.com"]);
    expect(r).toEqual({
      command: "audit",
      target: "https://example.com",
      flags: { maxPages: 250, format: "console", quiet: false, verbose: false, noFixes: false, noPlugins: false },
    });
  });

  it("parses '-f json -o out.json -m 50'", () => {
    const r = parseArgs(["audit", "https://example.com", "-f", "json", "-o", "out.json", "-m", "50"]);
    expect(r.flags.format).toBe("json");
    expect(r.flags.output).toBe("out.json");
    expect(r.flags.maxPages).toBe(50);
  });

  it("parses '--no-fixes --quiet --verbose'", () => {
    const r = parseArgs(["audit", "https://x.com", "--no-fixes", "--quiet", "--verbose"]);
    expect(r.flags.noFixes).toBe(true);
    expect(r.flags.quiet).toBe(true);
    expect(r.flags.verbose).toBe(true);
  });

  it("parses '--categories seo,a11y'", () => {
    const r = parseArgs(["audit", "https://x.com", "--categories", "seo,a11y"]);
    expect(r.flags.categories).toEqual(["seo", "a11y"]);
  });

  it("parses 'doctor'", () => {
    expect(parseArgs(["doctor"]).command).toBe("doctor");
  });

  it("parses 'version'", () => {
    expect(parseArgs(["version"]).command).toBe("version");
  });

  it("returns command='help' for unknown command", () => {
    expect(parseArgs(["wat"]).command).toBe("help");
  });

  it("returns command='help' for empty args", () => {
    expect(parseArgs([]).command).toBe("help");
  });

  it("parses '--no-plugins'", () => {
    const r = parseArgs(["audit", "https://x.com", "--no-plugins"]);
    expect(r.flags.noPlugins).toBe(true);
  });
});
