export type RetryOptions = {
  maxAttempts: number;
  baseDelayMs: number;
  sleep?: (ms: number) => Promise<void>;
};

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function isRetryable(err: unknown): boolean {
  if (err && typeof err === "object" && (err as { name?: string }).name === "AbortError") return false;
  if (err && typeof err === "object" && "status" in err) {
    const s = (err as { status: number }).status;
    return s >= 500 && s < 600;
  }
  return true;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions,
): Promise<T> {
  const sleep = opts.sleep ?? defaultSleep;
  let lastErr: unknown;
  for (let attempt = 0; attempt < opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err)) throw err;
      if (attempt === opts.maxAttempts - 1) break;
      await sleep(opts.baseDelayMs * Math.pow(2, attempt));
    }
  }
  throw lastErr;
}
