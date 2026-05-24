import { describe, it, expect, vi } from "vitest";
import { runAuditCommand } from "../../src/cli";

vi.mock("../../src/crawl/crawl", () => ({
  crawlAudit: async () => ({
    startUrl: "https://example.com",
    finalUrl: "https://example.com",
    pagesScanned: 1,
    startedAt: "2026-05-23T00:00:00Z",
    finishedAt: "2026-05-23T00:00:01Z",
    score: 100,
    findings: [],
  }),
}));

describe("runAuditCommand", () => {
  it("prints JSON to stdout when --format json", async () => {

    const writes: string[] = [];
    const fakeStdout = { write: (s: string) => { writes.push(s); return true; } } as unknown as NodeJS.WriteStream;

    const code = await runAuditCommand(
      "https://example.com",
      { format: "json", maxPages: 1, quiet: true, verbose: false, noFixes: false, noPlugins: false },
      fakeStdout,
    );
    expect(code).toBe(0);
    const out = writes.join("");
    expect(() => JSON.parse(out)).not.toThrow();
    expect(JSON.parse(out)).toHaveProperty("findings");
  });

  it("returns exit code 1 if no target provided", async () => {
    const fakeStderr = { write: () => true } as unknown as NodeJS.WriteStream;
    const fakeStdout = { write: () => true } as unknown as NodeJS.WriteStream;
    const code = await runAuditCommand(
      undefined,
      { format: "console", maxPages: 1, quiet: true, verbose: false, noFixes: false, noPlugins: false },
      fakeStdout,
      fakeStderr,
    );
    expect(code).toBe(1);
  });
});
