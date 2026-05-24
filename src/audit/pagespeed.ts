export type PageSpeedResult = {
  performance: number | null;
  lcpMs: number | null;
  cls: number | null;
  inpMs: number | null;
};

export async function runPageSpeed(_url: string, _strategy?: string, _apiKey?: string): Promise<PageSpeedResult | null> {
  // Phase 1: PSI is deferred per spec §3. Returns null = no PSI data.
  return null;
}
