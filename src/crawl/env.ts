export type EnvConfig = {
  concurrency: number;
  userAgent: string;
  requestsPerSecond: number;
};

const DEFAULTS: EnvConfig = {
  concurrency: 5,
  userAgent: "smartspec/1.0 (+https://smartspec.dev)",
  requestsPerSecond: 2,
};

function num(v: string | undefined, fallback: number): number {
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function readEnvConfig(env: Record<string, string | undefined>): EnvConfig {
  return {
    concurrency: num(env.SMARTSPEC_CONCURRENCY, DEFAULTS.concurrency),
    userAgent: env.SMARTSPEC_USER_AGENT?.trim() || DEFAULTS.userAgent,
    requestsPerSecond: num(env.SMARTSPEC_RATE_LIMIT_RPS, DEFAULTS.requestsPerSecond),
  };
}
