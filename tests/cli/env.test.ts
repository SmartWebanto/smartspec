import { describe, it, expect } from "vitest";
import { readEnvConfig } from "../../src/crawl/env";

describe("readEnvConfig", () => {
  it("returns defaults when no env vars set", () => {
    const c = readEnvConfig({});
    expect(c.concurrency).toBe(5);
    expect(c.userAgent).toBe("smartspec/1.0 (+https://smartspec.dev)");
    expect(c.requestsPerSecond).toBe(2);
  });

  it("honors SMARTSPEC_CONCURRENCY", () => {
    expect(readEnvConfig({ SMARTSPEC_CONCURRENCY: "10" }).concurrency).toBe(10);
  });

  it("honors SMARTSPEC_USER_AGENT", () => {
    expect(readEnvConfig({ SMARTSPEC_USER_AGENT: "MyBot/0.1" }).userAgent).toBe("MyBot/0.1");
  });

  it("honors SMARTSPEC_RATE_LIMIT_RPS", () => {
    expect(readEnvConfig({ SMARTSPEC_RATE_LIMIT_RPS: "0.5" }).requestsPerSecond).toBe(0.5);
  });

  it("ignores garbage values and falls back to defaults", () => {
    const c = readEnvConfig({ SMARTSPEC_CONCURRENCY: "wat", SMARTSPEC_RATE_LIMIT_RPS: "" });
    expect(c.concurrency).toBe(5);
    expect(c.requestsPerSecond).toBe(2);
  });
});
