import { describe, it, expect } from "vitest";
import { crawlAudit } from "../../src/crawl/crawl";

describe("crawlAudit abort", () => {
  it("rejects with AbortError when signal aborts mid-run", async () => {
    const ac = new AbortController();
    setTimeout(() => ac.abort(), 5);
    await expect(
      crawlAudit("https://example.com", { maxPages: 100, signal: ac.signal, timeoutMs: 30_000 }),
    ).rejects.toThrow(/aborted/i);
  });
});
