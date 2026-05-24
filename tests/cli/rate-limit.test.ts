import { describe, it, expect } from "vitest";
import { HostRateLimiter } from "../../src/crawl/rate-limit";

describe("HostRateLimiter", () => {
  it("allows requests up to the per-host budget without waiting", async () => {
    let now = 0;
    const clock = () => now;
    const waits: number[] = [];
    const sleep = (ms: number) => { waits.push(ms); now += ms; return Promise.resolve(); };

    const lim = new HostRateLimiter({ requestsPerSecond: 2, clock, sleep });
    await lim.acquire("example.com");
    await lim.acquire("example.com");
    expect(waits).toEqual([]);
  });

  it("makes the 3rd request within 1s wait", async () => {
    let now = 0;
    const clock = () => now;
    const waits: number[] = [];
    const sleep = (ms: number) => { waits.push(ms); now += ms; return Promise.resolve(); };

    const lim = new HostRateLimiter({ requestsPerSecond: 2, clock, sleep });
    await lim.acquire("example.com");
    await lim.acquire("example.com");
    await lim.acquire("example.com");
    expect(waits.length).toBeGreaterThanOrEqual(1);
    expect(waits.reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(500);
  });

  it("tracks hosts independently", async () => {
    let now = 0;
    const clock = () => now;
    const waits: number[] = [];
    const sleep = (ms: number) => { waits.push(ms); now += ms; return Promise.resolve(); };

    const lim = new HostRateLimiter({ requestsPerSecond: 1, clock, sleep });
    await lim.acquire("a.com");
    await lim.acquire("b.com");
    await lim.acquire("c.com");
    expect(waits).toEqual([]);
  });
});
