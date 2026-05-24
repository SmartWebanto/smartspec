import { describe, it, expect, vi } from "vitest";
import { withRetry } from "../../src/crawl/retry";

describe("withRetry", () => {
  it("returns the result if the first call succeeds", async () => {
    const fn = vi.fn(async () => "ok");
    const r = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 1 });
    expect(r).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on 5xx-shaped errors and eventually succeeds", async () => {
    let n = 0;
    const fn = vi.fn(async () => {
      n++;
      if (n < 3) throw Object.assign(new Error("server boom"), { status: 503 });
      return "ok";
    });
    const r = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 1 });
    expect(r).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("retries on network errors (no status)", async () => {
    let n = 0;
    const fn = vi.fn(async () => {
      n++;
      if (n < 2) throw new Error("ECONNRESET");
      return "ok";
    });
    const r = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 1 });
    expect(r).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does NOT retry on 4xx-shaped errors", async () => {
    const fn = vi.fn(async () => {
      throw Object.assign(new Error("not found"), { status: 404 });
    });
    await expect(withRetry(fn, { maxAttempts: 3, baseDelayMs: 1 })).rejects.toThrow("not found");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("gives up after maxAttempts", async () => {
    const fn = vi.fn(async () => { throw new Error("nope"); });
    await expect(withRetry(fn, { maxAttempts: 3, baseDelayMs: 1 })).rejects.toThrow("nope");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("does NOT retry on AbortError", async () => {
    const fn = vi.fn(async () => {
      throw Object.assign(new Error("aborted"), { name: "AbortError" });
    });
    await expect(withRetry(fn, { maxAttempts: 3, baseDelayMs: 1 })).rejects.toThrow("aborted");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("uses exponential backoff (delay grows ~2x per attempt)", async () => {
    const delays: number[] = [];
    let n = 0;
    const fn = async () => {
      n++;
      if (n < 4) throw new Error("retry");
      return "ok";
    };
    const sleep = (ms: number) => { delays.push(ms); return Promise.resolve(); };
    await withRetry(fn, { maxAttempts: 4, baseDelayMs: 10, sleep });
    expect(delays.length).toBe(3);
    expect(delays[0]).toBe(10);
    expect(delays[1]).toBe(20);
    expect(delays[2]).toBe(40);
  });
});
