import { withRetry, type RetryOptions } from "./retry";
import { HostRateLimiter } from "./rate-limit";

export type FetchResult = {
  finalUrl: string;
  status: number;
  body: string;
  headers: Record<string, string>;
};

export const DEFAULT_TIMEOUT_MS = 10_000;
export const DEFAULT_UA = "TechnicalSEO-Audit/1.0 (+https://example.com)";

export async function fetchHtml(
  url: string,
  opts: { timeoutMs?: number; userAgent?: string; signal?: AbortSignal } = {},
): Promise<FetchResult> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  if (opts.signal?.aborted) controller.abort();
  const onAbort = () => controller.abort();
  opts.signal?.addEventListener("abort", onAbort);
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": opts.userAgent ?? DEFAULT_UA,
        accept: "text/html,application/xhtml+xml",
      },
    });
    const body = await res.text();
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      headers[k] = v;
    });
    return { finalUrl: res.url || url, status: res.status, body, headers };
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error(`fetch ${opts.signal?.aborted ? "aborted" : "timeout after " + timeoutMs + "ms"}: ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener("abort", onAbort);
  }
}

export async function fetchText(
  url: string,
  opts?: { timeoutMs?: number },
): Promise<FetchResult | null> {
  try {
    return await fetchHtml(url, opts);
  } catch {
    return null;
  }
}

export type FetchWithOptions = {
  limiter: HostRateLimiter;
  retry: RetryOptions;
  timeoutMs?: number;
  userAgent?: string;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
};

function hostOf(url: string): string {
  try { return new URL(url).host; } catch { return "unknown"; }
}

export async function fetchTextWith(
  url: string,
  opts: FetchWithOptions,
): Promise<FetchResult | null> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const ua = opts.userAgent ?? DEFAULT_UA;
  const fetchImpl = opts.fetchImpl ?? fetch;
  const host = hostOf(url);

  await opts.limiter.acquire(host);

  try {
    return await withRetry(async () => {
      // Re-throw aborts so callers can detect them; non-abort failures are swallowed to null below.
      if (opts.signal?.aborted) throw Object.assign(new Error("aborted"), { status: 499 });
      const controller = new AbortController();
      const onAbort = () => controller.abort();
      opts.signal?.addEventListener("abort", onAbort);
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetchImpl(url, {
          redirect: "follow",
          signal: controller.signal,
          headers: { "user-agent": ua, accept: "text/html,application/xhtml+xml,*/*" },
        });
        const body = await res.text();
        const headers: Record<string, string> = {};
        res.headers.forEach((v, k) => { headers[k] = v; });
        if (!res.ok && res.status >= 500) {
          throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status });
        }
        return { finalUrl: res.url || url, status: res.status, body, headers };
      } finally {
        clearTimeout(timer);
        opts.signal?.removeEventListener("abort", onAbort);
      }
    }, opts.retry);
  } catch (err) {
    if (opts.signal?.aborted) throw err;
    return null;
  }
}
