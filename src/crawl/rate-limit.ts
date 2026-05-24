export type RateLimitOptions = {
  requestsPerSecond: number;
  clock?: () => number;
  sleep?: (ms: number) => Promise<void>;
};

export class HostRateLimiter {
  private readonly rps: number;
  private readonly clock: () => number;
  private readonly sleep: (ms: number) => Promise<void>;
  /** Per-host queue of timestamps at which each slot becomes available. */
  private readonly queues = new Map<string, number[]>();

  constructor(opts: RateLimitOptions) {
    this.rps = opts.requestsPerSecond;
    this.clock = opts.clock ?? (() => Date.now());
    this.sleep = opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  }

  async acquire(host: string): Promise<void> {
    const windowMs = 1000;
    const now = this.clock();

    if (!this.queues.has(host)) {
      this.queues.set(host, []);
    }
    const q = this.queues.get(host)!;

    // Drop timestamps that are outside the sliding window.
    const cutoff = now - windowMs;
    while (q.length > 0 && q[0] <= cutoff) {
      q.shift();
    }

    if (q.length < this.rps) {
      // Slot available — record this request and proceed immediately.
      q.push(now);
      return;
    }

    // Must wait until the oldest request in the window falls out.
    const oldest = q[0];
    const waitMs = oldest + windowMs - now;
    if (waitMs > 0) {
      await this.sleep(waitMs);
    }

    // After sleeping, evict expired entries and record this request.
    const after = this.clock();
    const cutoff2 = after - windowMs;
    while (q.length > 0 && q[0] <= cutoff2) {
      q.shift();
    }
    q.push(after);
  }
}
