import { describe, it, expect, vi } from "vitest";

vi.mock("../../src/crawl/crawl", () => ({
  crawlAudit: vi.fn(async (startUrl: string, opts: { maxPages?: number }) => ({
    startUrl,
    finalUrl: startUrl,
    pagesScanned: opts.maxPages ?? 25,
    startedAt: "2026-05-23T00:00:00Z",
    finishedAt: "2026-05-23T00:00:01Z",
    score: 88,
    findings: [],
  })),
}));

import { runAuditCommand } from "../../src/cli";
import { crawlAudit } from "../../src/crawl/crawl";

describe("runAuditCommand → crawlAudit", () => {
  it("invokes crawlAudit with the URL and max-pages flag", async () => {
    const writes: string[] = [];
    const stdout = { write: (s: string) => { writes.push(s); return true; } } as unknown as NodeJS.WriteStream;
    const stderr = { write: () => true } as unknown as NodeJS.WriteStream;

    const code = await runAuditCommand(
      "https://example.com",
      { format: "json", maxPages: 7, quiet: true, verbose: false, noFixes: false, noPlugins: false },
      stdout,
      stderr,
    );

    expect(code).toBe(0);
    expect(crawlAudit).toHaveBeenCalledWith(
      "https://example.com",
      expect.objectContaining({ maxPages: 7 }),
    );
    const parsed = JSON.parse(writes.join(""));
    expect(parsed.pagesScanned).toBe(7);
    expect(parsed.score).toBe(88);
  });
});
