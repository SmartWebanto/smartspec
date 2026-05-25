export type PageSpeedResult = {
  performance: number | null;
  lcpMs: number | null;
  cls: number | null;
  inpMs: number | null;
};

// PageSpeed Insights v5. Returns null on transport error; returns a result with
// null fields when the response is non-OK or fields are missing. Caller can
// distinguish "PSI not configured" (apiKey missing → quota constraints apply)
// from "PSI returned no data" by checking for fully-null fields.
export async function runPageSpeed(
  url: string,
  strategy: "mobile" | "desktop" = "mobile",
  apiKey?: string,
): Promise<PageSpeedResult | null> {
  const params = new URLSearchParams({ url, strategy });
  if (apiKey) params.set("key", apiKey);
  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`;
  try {
    const res = await fetch(endpoint, { method: "GET" });
    if (!res.ok) return { performance: null, lcpMs: null, cls: null, inpMs: null };
    const data = (await res.json()) as {
      lighthouseResult?: {
        categories?: { performance?: { score?: number } };
        audits?: Record<string, { numericValue?: number }>;
      };
    };
    const scoreVal = data.lighthouseResult?.categories?.performance?.score;
    const audits = data.lighthouseResult?.audits ?? {};
    return {
      performance: typeof scoreVal === "number" ? Math.round(scoreVal * 100) : null,
      lcpMs: audits["largest-contentful-paint"]?.numericValue ?? null,
      cls: audits["cumulative-layout-shift"]?.numericValue ?? null,
      inpMs: audits["interaction-to-next-paint"]?.numericValue ?? null,
    };
  } catch {
    return null;
  }
}
