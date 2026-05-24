import { describe, it, expect } from "vitest";
import { fetchTextWith, fetchHtml } from "../../src/crawl/fetch";
import { HostRateLimiter } from "../../src/crawl/rate-limit";

describe("fetchTextWith (rate-limited, retrying)", () => {
  it("calls the limiter before fetching", async () => {
    const seen: string[] = [];
    const lim = {
      acquire: async (host: string) => { seen.push(host); },
    } as unknown as HostRateLimiter;

    const fakeFetch = async (url: string) => ({
      ok: true, status: 200, url, text: async () => "ok",
      headers: new Headers(),
    }) as unknown as Response;

    await fetchTextWith("https://example.com/x", { limiter: lim, retry: { maxAttempts: 1, baseDelayMs: 1 }, fetchImpl: fakeFetch });
    expect(seen).toEqual(["example.com"]);
  });

  it("respects abort signal", async () => {
    const ac = new AbortController();
    ac.abort();
    const lim = { acquire: async () => {} } as unknown as HostRateLimiter;
    await expect(
      fetchTextWith("https://example.com", { limiter: lim, retry: { maxAttempts: 1, baseDelayMs: 1 }, signal: ac.signal }),
    ).rejects.toThrow();
  });
});

describe("fetchHtml (hardened)", () => {
  it("respects abort signal", async () => {
    const ac = new AbortController();
    ac.abort();
    await expect(fetchHtml("https://example.com", { signal: ac.signal, timeoutMs: 5000 })).rejects.toThrow(/aborted/);
  });

  it("uses provided user-agent", async () => {
    let captured: string | null = null;
    const origFetch = globalThis.fetch;
    globalThis.fetch = (async (input: unknown, init: { headers: Record<string, string> } = { headers: {} }) => {
      captured = init.headers["user-agent"] ?? null;
      return { ok: true, status: 200, url: String(input), text: async () => "<html></html>", headers: new Headers() } as unknown as Response;
    }) as typeof globalThis.fetch;
    try {
      await fetchHtml("https://example.com", { userAgent: "test-ua/1.0", timeoutMs: 5000 });
      expect(captured).toBe("test-ua/1.0");
    } finally {
      globalThis.fetch = origFetch;
    }
  });
});
